from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Project, Task, PastProject
from backend.schemas import (
    TaskItem, TaskUpdateRequest, AlertItem, SimulateRequest, CompleteProjectRequest,
    HistoryResponse, TaskStatus, ProjectStatus
)
from backend.alerts import evaluate_task_alerts, get_simulated_date
from backend.learning import get_history_summary, record_completed_project, seed_past_projects_if_empty

router = APIRouter(tags=["delivery"])

def utc_now():
    return datetime.now(timezone.utc)

def raise_error(code: str, message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"error": code, "message": message}
    )

def to_task_item(t: Task) -> TaskItem:
    return TaskItem(
        id=t.id,
        project_id=t.project_id,
        title=t.title,
        milestone_name=t.milestone_name,
        status=TaskStatus(t.status),
        owner_name=t.owner_name,
        owner_id=t.owner_id,
        due_date=t.due_date,
        estimated_hours=t.estimated_hours,
        logged_hours=t.logged_hours,
        dependencies=t.dependencies or [],
        created_at=t.created_at,
        updated_at=t.updated_at
    )

@router.get("/projects/{project_id}/tasks", response_model=List[TaskItem])
def get_project_tasks(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    tasks = db.query(Task).filter_by(project_id=project_id).order_by(Task.due_date.asc()).all()
    return [to_task_item(t) for t in tasks]

@router.patch("/tasks/{task_id}", response_model=TaskItem)
def update_task(task_id: str, payload: TaskUpdateRequest, db: Session = Depends(get_db)):
    task = db.query(Task).filter_by(id=task_id).first()
    if not task:
        raise_error("not_found", f"Task with ID '{task_id}' was not found.", 404)

    project = db.query(Project).filter_by(id=task.project_id).first()
    if project and project.status == "completed":
        raise_error("bad_status", "Cannot modify tasks of a completed project. Project is read-only.", 409)

    if payload.status is not None:
        task.status = payload.status.value
    if payload.logged_hours is not None:
        task.logged_hours = max(0.0, payload.logged_hours)
    if payload.owner_name is not None:
        task.owner_name = payload.owner_name.strip()
    if payload.due_date is not None:
        task.due_date = payload.due_date

    task.updated_at = utc_now()
    if project and project.status == "team_assigned":
        project.status = "in_delivery"
        project.updated_at = utc_now()

    db.commit()
    db.refresh(task)
    return to_task_item(task)

@router.get("/projects/{project_id}/alerts", response_model=List[AlertItem])
def get_project_alerts(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    tasks = db.query(Task).filter_by(project_id=project_id).all()
    alerts = evaluate_task_alerts(tasks, sim_offset_days=project.sim_offset_days)
    return alerts

@router.post("/projects/{project_id}/simulate")
def simulate_project_timeline(
    project_id: str,
    payload: SimulateRequest,
    db: Session = Depends(get_db)
):
    """
    Advances project simulated calendar by advance_days (default 7 days).
    Does NOT change computer's system clock.
    Recalculates delivery alerts immediately.
    """
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    if project.status == "completed":
        raise_error("bad_status", "Cannot advance timeline on a completed project.", 409)

    project.sim_offset_days += payload.advance_days
    project.updated_at = utc_now()
    if project.status == "team_assigned":
        project.status = "in_delivery"

    db.commit()

    tasks = db.query(Task).filter_by(project_id=project_id).all()
    alerts = evaluate_task_alerts(tasks, sim_offset_days=project.sim_offset_days)
    sim_date = get_simulated_date(project.sim_offset_days).strftime("%Y-%m-%d")

    return {
        "status": "success",
        "project_id": project.id,
        "advanced_by_days": payload.advance_days,
        "total_sim_offset_days": project.sim_offset_days,
        "simulated_date": sim_date,
        "active_alerts_count": len(alerts),
        "alerts": [a.model_dump() for a in alerts]
    }

@router.post("/projects/{project_id}/complete")
def complete_project(
    project_id: str,
    payload: CompleteProjectRequest,
    db: Session = Depends(get_db)
):
    """
    Records project actual completion weeks and cost, updates historical learning,
    and locks project into read-only completed status.
    """
    if payload.actual_weeks <= 0 or payload.actual_cost <= 0:
        raise_error("bad_input", "Actual weeks and cost must be positive values.", 422)

    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    project.actual_weeks = payload.actual_weeks
    project.actual_cost = payload.actual_cost
    project.status = "completed"
    project.updated_at = utc_now()

    # Record in historical learning module (idempotent)
    hist_record = record_completed_project(db, project, payload.actual_weeks, payload.actual_cost)

    db.commit()

    return {
        "status": "success",
        "project_id": project.id,
        "new_status": "completed",
        "actual_weeks": payload.actual_weeks,
        "actual_cost": payload.actual_cost,
        "historical_record_id": hist_record.id,
        "message": f"Project '{project.title}' marked as completed. Actuals recorded for future historical learning."
    }

@router.get("/history", response_model=HistoryResponse)
def get_historical_learning_data(db: Session = Depends(get_db)):
    """
    Returns past projects, average overrun percentage, and project count.
    Used for historical estimate vs actual charts and learning calculations.
    """
    return get_history_summary(db)
