import json
from pathlib import Path
from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import PastProject, Project
from backend.schemas import HistoricalProjectItem, HistoryResponse

def seed_past_projects_if_empty(db: Session):
    """Seed fictional historical projects if they are not already in the database."""
    seed_path = Path(__file__).parent / "data" / "past_projects.json"
    if seed_path.exists():
        with open(seed_path, "r", encoding="utf-8") as f:
            seed_data = json.load(f)
        for item in seed_data:
            existing = db.query(PastProject).filter_by(id=item["id"]).first()
            if not existing:
                db_item = PastProject(
                    id=item["id"],
                    name=item["name"],
                    estimated_weeks=float(item["estimated_weeks"]),
                    actual_weeks=float(item["actual_weeks"]),
                    estimated_cost=float(item["estimated_cost"]),
                    actual_cost=float(item["actual_cost"]),
                    overrun_pct=float(item["overrun_pct"]),
                    domain=item.get("domain", "Enterprise"),
                    is_seed=item.get("is_seed", True)
                )
                db.add(db_item)
        db.commit()

def get_historical_overrun_metrics(db: Session) -> Tuple[float, int]:
    """
    Computes average overrun percentage and project count across all completed projects.
    Formula: overrun = (actual_weeks - estimated_weeks) / estimated_weeks
    """
    projects = db.query(PastProject).all()
    if not projects:
        return 0.0, 0

    valid_overruns = []
    for p in projects:
        if p.estimated_weeks > 0:
            overrun = (p.actual_weeks - p.estimated_weeks) / p.estimated_weeks
            valid_overruns.append(overrun)

    if not valid_overruns:
        return 0.0, 0

    avg_overrun = sum(valid_overruns) / len(valid_overruns)
    return avg_overrun, len(valid_overruns)

def get_history_summary(db: Session) -> HistoryResponse:
    seed_past_projects_if_empty(db)
    avg_overrun, count = get_historical_overrun_metrics(db)
    projects = db.query(PastProject).order_by(PastProject.created_at.desc()).all()
    
    items = [
        HistoricalProjectItem(
            id=p.id,
            name=p.name,
            estimated_weeks=p.estimated_weeks,
            actual_weeks=p.actual_weeks,
            estimated_cost=p.estimated_cost,
            actual_cost=p.actual_cost,
            overrun_pct=round(p.overrun_pct * 100.0, 2),
            domain=p.domain,
            is_seed=p.is_seed
        )
        for p in projects
    ]
    return HistoryResponse(
        average_overrun_pct=round(avg_overrun * 100.0, 2),
        project_count=count,
        projects=items
    )

def record_completed_project(
    db: Session,
    project: Project,
    actual_weeks: int,
    actual_cost: float
) -> PastProject:
    """
    Idempotent completion recording:
    If a record for this project already exists in past_projects, update it; otherwise create a new one.
    """
    hist_id = f"HIST-{project.id}"
    existing = db.query(PastProject).filter_by(id=hist_id).first()

    estimated_weeks = float(project.effort_max_weeks or project.effort_min_weeks or 10.0)
    estimated_cost = float(project.cost_max or project.cost_min or 250000.0)

    overrun = (actual_weeks - estimated_weeks) / estimated_weeks if estimated_weeks > 0 else 0.0

    if existing:
        existing.actual_weeks = float(actual_weeks)
        existing.actual_cost = float(actual_cost)
        existing.overrun_pct = overrun
        db.commit()
        db.refresh(existing)
        return existing

    new_hist = PastProject(
        id=hist_id,
        name=f"{project.title} ({project.client})",
        estimated_weeks=estimated_weeks,
        actual_weeks=float(actual_weeks),
        estimated_cost=estimated_cost,
        actual_cost=float(actual_cost),
        overrun_pct=overrun,
        domain="Client Delivery",
        is_seed=False
    )
    db.add(new_hist)
    db.commit()
    db.refresh(new_hist)
    return new_hist
