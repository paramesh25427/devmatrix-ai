import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Project, Analysis, Developer, TeamAssignment, Task
from backend.schemas import (
    TeamRecommendationResponse, TeamConfirmRequest, DeveloperProfile, DeveloperFlagRequest,
    RequiredSkillItem, MilestoneItem, ProjectStatus
)
from backend.team_optimizer import optimize_team, load_developer_profiles

router = APIRouter(tags=["team"])

def utc_now():
    return datetime.now(timezone.utc)

def raise_error(code: str, message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"error": code, "message": message}
    )

def seed_developers_if_empty(db: Session):
    dev_list = load_developer_profiles()
    for d in dev_list:
        existing = db.query(Developer).filter_by(id=d["id"]).first()
        if not existing:
            db_dev = Developer(
                id=d["id"],
                name=d["name"],
                role=d["role"],
                experience_years=float(d["experience_years"]),
                skills=d.get("skills", {}),
                free_capacity_pct=int(d.get("free_capacity_pct", 100)),
                flagged_skills=d.get("flagged_skills", [])
            )
            db.add(db_dev)
    db.commit()

@router.post("/projects/{project_id}/team", response_model=TeamRecommendationResponse)
def get_team_recommendation(project_id: str, db: Session = Depends(get_db)):
    """
    Recommends best team and alternative team for an approved project.
    Strictly forbidden before approval.
    """
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    # Constraint: Do not permit team recommendation before approval
    if project.status in ["submitted", "analyzed"]:
        raise_error(
            "bad_status",
            f"Cannot recommend team for project in '{project.status}' status. Manager must review and approve baseline first.",
            409
        )

    # Get baseline analysis
    baseline = (
        db.query(Analysis)
        .filter_by(project_id=project_id, is_baseline=True)
        .first()
    )
    if not baseline:
        # Fallback to latest analysis if approved
        baseline = (
            db.query(Analysis)
            .filter_by(project_id=project_id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
    if not baseline:
        raise_error("not_found", f"No analysis found for project '{project_id}'.", 404)

    required_skills = [RequiredSkillItem(**s) for s in baseline.required_skills]
    seed_developers_if_empty(db)

    recommendation = optimize_team(project_id=project.id, required_skills=required_skills)
    return recommendation

@router.post("/projects/{project_id}/team/confirm")
def confirm_team_selection(
    project_id: str,
    payload: TeamConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Confirms team selection (which = 'best' or 'alternative').
    Saves assignment, initializes delivery tasks from milestones, and advances status to 'team_assigned'.
    """
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    if project.status not in ["approved", "team_assigned"]:
        raise_error(
            "bad_status",
            f"Cannot confirm team for project in '{project.status}' status.",
            409
        )

    # Run optimizer to get clean team objects
    baseline = (
        db.query(Analysis)
        .filter_by(project_id=project_id, is_baseline=True)
        .first()
    )
    if not baseline:
        baseline = db.query(Analysis).filter_by(project_id=project_id).first()
    if not baseline:
        raise_error("not_found", "No baseline analysis found to form milestones.", 404)

    req_skills = [RequiredSkillItem(**s) for s in baseline.required_skills]
    rec = optimize_team(project_id=project.id, required_skills=req_skills)

    chosen_members = rec.best_team if payload.which != "alternative" else rec.alternative.team

    # Save or update TeamAssignment
    assignment = db.query(TeamAssignment).filter_by(project_id=project.id).first()
    if assignment:
        assignment.selection = payload.which
        assignment.members = [m.model_dump() for m in chosen_members]
        assignment.confirmed_at = utc_now()
    else:
        assignment = TeamAssignment(
            id=f"ASN-{uuid.uuid4().hex[:8].upper()}",
            project_id=project.id,
            selection=payload.which,
            members=[m.model_dump() for m in chosen_members],
            confirmed_at=utc_now()
        )
        db.add(assignment)

    # Generate initial tasks from milestones if not already generated
    existing_tasks = db.query(Task).filter_by(project_id=project.id).count()
    if existing_tasks == 0:
        milestones = [MilestoneItem(**m) for m in baseline.milestones]
        if not milestones:
            milestones = [
                MilestoneItem(name="Architecture & Foundational Setup", weeks=2),
                MilestoneItem(name="Core Business Modules", weeks=3),
                MilestoneItem(name="Integration & Verification", weeks=2)
            ]

        # Lead member
        lead_member = chosen_members[0] if chosen_members else None
        lead_name = lead_member.name if lead_member else "Lead Engineer"
        lead_id = lead_member.developer_id if lead_member else "DEV-01"

        start_date = datetime.now(timezone.utc)
        current_date_cursor = start_date

        for idx, ms in enumerate(milestones, start=1):
            ms_due = current_date_cursor + timedelta(days=ms.weeks * 7)
            due_str = ms_due.strftime("%Y-%m-%d")

            # Round robin assign team members to milestone tasks
            assigned_emp = chosen_members[(idx - 1) % len(chosen_members)] if chosen_members else None
            emp_name = assigned_emp.name if assigned_emp else lead_name
            emp_id = assigned_emp.developer_id if assigned_emp else lead_id

            est_hours = float(ms.weeks * 40.0) # 40 hrs/week nominal for task
            task_item = Task(
                id=f"TSK-{project.id}-{idx:02d}",
                project_id=project.id,
                title=f"{ms.name} Implementation",
                milestone_name=ms.name,
                status="in_progress" if idx == 1 else "backlog",
                owner_name=emp_name,
                owner_id=emp_id,
                due_date=due_str,
                estimated_hours=est_hours,
                logged_hours=12.0 if idx == 1 else 0.0,
                dependencies=[f"TSK-{project.id}-{idx-1:02d}"] if idx > 1 else [],
                created_at=utc_now(),
                updated_at=utc_now()
            )
            db.add(task_item)
            current_date_cursor = ms_due

    project.status = "team_assigned"
    project.updated_at = utc_now()
    db.commit()

    return {
        "status": "success",
        "project_id": project.id,
        "team_selection": payload.which,
        "assigned_members_count": len(chosen_members),
        "message": f"Team successfully confirmed using '{payload.which}' option. Delivery tasks initialized."
    }

@router.get("/developers", response_model=List[DeveloperProfile])
def list_developers(db: Session = Depends(get_db)):
    seed_developers_if_empty(db)
    devs = db.query(Developer).all()
    return [
        DeveloperProfile(
            id=d.id,
            name=d.name,
            role=d.role,
            experience_years=d.experience_years,
            skills=d.skills or {},
            free_capacity_pct=d.free_capacity_pct,
            flagged_skills=d.flagged_skills or []
        )
        for d in devs
    ]

@router.post("/developers/{developer_id}/flag")
def flag_developer_skill(
    developer_id: str,
    payload: DeveloperFlagRequest,
    db: Session = Depends(get_db)
):
    seed_developers_if_empty(db)
    dev = db.query(Developer).filter_by(id=developer_id).first()
    if not dev:
        raise_error("not_found", f"Developer with ID '{developer_id}' not found.", 404)

    flags = list(dev.flagged_skills or [])
    flags.append(payload.note.strip())
    dev.flagged_skills = flags
    db.commit()

    return {
        "status": "success",
        "developer_id": dev.id,
        "flagged_notes_count": len(flags),
        "message": f"Skill correction note successfully recorded for {dev.name}."
    }
