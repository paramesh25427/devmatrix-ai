from datetime import datetime, timezone
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.project import Project, ProjectRequirement
from backend.app.models.organization import Organization
from backend.app.schemas.common import ApiResponse, ProjectStatus
from backend.app.schemas.project import ProjectCreate, ProjectResponse, RequirementCreate, RequirementResponse

router = APIRouter()

def utc_now():
    return datetime.now(timezone.utc)

@router.post("", response_model=ApiResponse[ProjectResponse], status_code=201)
def create_project(
    payload: ProjectCreate,
    x_organization_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Resolve organization context: (1) payload.org_id, (2) X-Organization-ID header, (3) fallback 'ORG-001'
    target_org_id = payload.org_id or x_organization_id or "ORG-001"

    # Verify organization exists
    org = db.query(Organization).filter_by(org_id=target_org_id).first()
    if not org:
        # Auto-create demo org if running in demo environment
        org = Organization(
            org_id=target_org_id,
            name="ShopNova Retail Corp",
            domain="shopnova.internal",
            default_currency="USD",
            is_synthetic=True
        )
        db.add(org)
        db.flush()

    # Generate sequential or unique project ID
    existing_count = db.query(Project).count()
    project_id = f"PRJ-{101 + existing_count}"

    project = Project(
        project_id=project_id,
        org_id=target_org_id,
        title=payload.title,
        description=payload.description,
        business_objectives=payload.business_objectives,
        target_architecture=payload.target_architecture,
        target_completion_date=payload.target_completion_date,
        budget_amount=payload.budget_amount,
        currency=payload.currency,
        team_size_limit=payload.team_size_limit,
        status="draft",
        is_synthetic=True,
        created_at=utc_now(),
        updated_at=utc_now()
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ApiResponse(
        data=ProjectResponse(
            project_id=project.project_id,
            org_id=project.org_id,
            title=project.title,
            description=project.description,
            business_objectives=project.business_objectives,
            target_architecture=project.target_architecture,
            target_completion_date=project.target_completion_date,
            budget_amount=float(project.budget_amount),
            currency=project.currency,
            team_size_limit=project.team_size_limit,
            status=ProjectStatus(project.status),
            created_at=project.created_at,
            updated_at=project.updated_at
        )
    )

@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(project_id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return ApiResponse(
        data=ProjectResponse(
            project_id=project.project_id,
            org_id=project.org_id,
            title=project.title,
            description=project.description,
            business_objectives=project.business_objectives,
            target_architecture=project.target_architecture,
            target_completion_date=project.target_completion_date,
            budget_amount=float(project.budget_amount),
            currency=project.currency,
            team_size_limit=project.team_size_limit,
            status=ProjectStatus(project.status),
            created_at=project.created_at,
            updated_at=project.updated_at
        )
    )

@router.get("", response_model=ApiResponse[List[ProjectResponse]])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    data = [
        ProjectResponse(
            project_id=p.project_id,
            org_id=p.org_id,
            title=p.title,
            description=p.description,
            business_objectives=p.business_objectives,
            target_architecture=p.target_architecture,
            target_completion_date=p.target_completion_date,
            budget_amount=float(p.budget_amount),
            currency=p.currency,
            team_size_limit=p.team_size_limit,
            status=ProjectStatus(p.status),
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in projects
    ]
    return ApiResponse(data=data)
