import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Project, Analysis
from backend.schemas import (
    ProjectCreateResponse, ProjectListItem, ProjectDetailResponse, AnalysisResponse,
    RequirementItem, RiskItem, RequiredSkillItem, MilestoneItem, CalculationDetail,
    RequirementsUpdateRequest, ApprovalRequest, ProjectStatus, FeasibilityVerdict
)
from backend.parser import validate_and_extract_text, ParsingError
from backend.llm import analyze_requirements_with_llm
from backend.rules_engine import calculate_feasibility
from backend.learning import get_historical_overrun_metrics

router = APIRouter(tags=["projects"])

def utc_now():
    return datetime.now(timezone.utc)

def raise_error(code: str, message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"error": code, "message": message}
    )

def to_analysis_response(a: Analysis) -> AnalysisResponse:
    reqs = [RequirementItem(**r) for r in a.requirements]
    risks = [RiskItem(**rk) for rk in a.risks]
    skills = [RequiredSkillItem(**sk) for sk in a.required_skills]
    milestones = [MilestoneItem(**ms) for ms in a.milestones]
    calc = CalculationDetail(**a.calculation)

    return AnalysisResponse(
        id=a.id,
        project_id=a.project_id,
        is_baseline=a.is_baseline,
        summary=a.summary,
        requirements=reqs,
        gaps=a.gaps or [],
        conflicts=a.conflicts or [],
        risks=risks,
        required_skills=skills,
        tech_stack=a.tech_stack or [],
        milestones=milestones,
        calculation=calc,
        created_at=a.created_at
    )

@router.post("/projects", response_model=ProjectCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    title: str = Form(...),
    client: str = Form(...),
    deadline_weeks: int = Form(...),
    budget_min: float = Form(0.0),
    budget_max: float = Form(0.0),
    tech_stack: Optional[str] = Form(""),
    notes: Optional[str] = Form(None),
    pasted_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Validations
    if not title.strip():
        raise_error("bad_input", "Project title is required.", 422)
    if deadline_weeks <= 0:
        raise_error("bad_input", "Deadline must be a positive number of weeks.", 422)
    if budget_min > budget_max and budget_max > 0:
        raise_error("bad_input", "Minimum budget cannot exceed maximum budget.", 422)

    # Document / Text Parsing
    filename = file.filename if file else None
    file_bytes = await file.read() if file else None

    try:
        raw_text = validate_and_extract_text(filename, file_bytes, pasted_text)
    except ParsingError as pe:
        raise_error(pe.code, pe.message, pe.status_code)

    tech_list = [t.strip() for t in tech_stack.split(",") if t.strip()] if tech_stack else []

    project_count = db.query(Project).count()
    project_id = f"PRJ-{101 + project_count}"
    while db.query(Project).filter_by(id=project_id).first():
        project_id = f"PRJ-{uuid.uuid4().hex[:6].upper()}"

    new_project = Project(
        id=project_id,
        title=title.strip(),
        client=client.strip(),
        deadline_weeks=deadline_weeks,
        budget_min=budget_min,
        budget_max=budget_max,
        tech_stack=tech_list,
        notes=notes.strip() if notes else None,
        raw_text=raw_text,
        status="submitted",
        created_at=utc_now(),
        updated_at=utc_now()
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return ProjectCreateResponse(
        id=new_project.id,
        title=new_project.title,
        client=new_project.client,
        status=ProjectStatus.SUBMITTED,
        message=f"Project '{new_project.title}' successfully intake registered in 'submitted' status."
    )

@router.get("/projects", response_model=List[ProjectListItem])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    items = []
    for p in projects:
        items.append(
            ProjectListItem(
                id=p.id,
                title=p.title,
                client=p.client,
                status=ProjectStatus(p.status),
                verdict=p.verdict,
                effort_min_weeks=p.effort_min_weeks,
                effort_max_weeks=p.effort_max_weeks,
                cost_min=p.cost_min,
                cost_max=p.cost_max,
                deadline_weeks=p.deadline_weeks,
                budget_min=p.budget_min,
                budget_max=p.budget_max,
                updated_at=p.updated_at,
                created_at=p.created_at
            )
        )
    return items

@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    # Get baseline analysis if approved, else latest analysis
    analysis_record = (
        db.query(Analysis)
        .filter_by(project_id=project_id, is_baseline=True)
        .first()
    )
    if not analysis_record:
        analysis_record = (
            db.query(Analysis)
            .filter_by(project_id=project_id)
            .order_by(Analysis.created_at.desc())
            .first()
        )

    analysis_response = to_analysis_response(analysis_record) if analysis_record else None

    return ProjectDetailResponse(
        id=project.id,
        title=project.title,
        client=project.client,
        deadline_weeks=project.deadline_weeks,
        budget_min=project.budget_min,
        budget_max=project.budget_max,
        tech_stack=project.tech_stack or [],
        notes=project.notes,
        raw_text=project.raw_text,
        status=ProjectStatus(project.status),
        verdict=project.verdict,
        effort_min_weeks=project.effort_min_weeks,
        effort_max_weeks=project.effort_max_weeks,
        cost_min=project.cost_min,
        cost_max=project.cost_max,
        sim_offset_days=project.sim_offset_days,
        actual_weeks=project.actual_weeks,
        actual_cost=project.actual_cost,
        approved_by=project.approved_by,
        approval_notes=project.approval_notes,
        approved_at=project.approved_at,
        created_at=project.created_at,
        updated_at=project.updated_at,
        analysis=analysis_response
    )

@router.post("/projects/{project_id}/analyze", response_model=AnalysisResponse)
def run_project_analysis(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    # Lifecycle constraint: only submitted or analyzed projects can run analysis
    if project.status not in ["submitted", "analyzed"]:
        raise_error("bad_status", f"Cannot re-analyze project in '{project.status}' status. Analysis is frozen.", 409)

    # 1. AI Extraction (Responsible & Isolated)
    try:
        ai_data = analyze_requirements_with_llm(project.title, project.client, project.raw_text)
    except ParsingError as pe:
        raise_error(pe.code, pe.message, pe.status_code)

    # 2. Historical Overrun from past projects
    avg_overrun, hist_count = get_historical_overrun_metrics(db)

    # 3. Deterministic Python Feasibility Engine
    calc_detail = calculate_feasibility(
        requirements=ai_data.requirements,
        risks=ai_data.risks,
        deadline_weeks=project.deadline_weeks,
        budget_max=project.budget_max,
        historical_overrun=avg_overrun if hist_count > 0 else None,
        historical_count=hist_count
    )

    # 4. Save draft Analysis record
    analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"
    analysis = Analysis(
        id=analysis_id,
        project_id=project.id,
        is_baseline=False,
        summary=ai_data.summary,
        requirements=[r.model_dump() for r in ai_data.requirements],
        gaps=ai_data.gaps,
        conflicts=ai_data.conflicts,
        risks=[rk.model_dump() for rk in ai_data.risks],
        required_skills=[sk.model_dump() for sk in ai_data.required_skills],
        tech_stack=ai_data.tech_stack,
        milestones=[ms.model_dump() for ms in ai_data.milestones],
        calculation=calc_detail.model_dump(),
        created_at=utc_now()
    )
    db.add(analysis)

    # Update project state
    project.status = "analyzed"
    project.verdict = calc_detail.verdict
    project.effort_min_weeks = calc_detail.min_weeks
    project.effort_max_weeks = calc_detail.max_weeks
    project.cost_min = calc_detail.min_cost
    project.cost_max = calc_detail.max_cost
    project.updated_at = utc_now()

    db.commit()
    db.refresh(analysis)

    return to_analysis_response(analysis)

@router.put("/projects/{project_id}/analysis", response_model=AnalysisResponse)
def update_project_analysis(
    project_id: str,
    payload: RequirementsUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts edited requirements and recalculates effort, cost, and verdict using Python rules.
    Locked if approved.
    """
    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    if project.status != "analyzed":
        raise_error("bad_status", f"Cannot edit requirements for project in '{project.status}' status. Editing is locked.", 409)

    analysis = (
        db.query(Analysis)
        .filter_by(project_id=project_id, is_baseline=False)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise_error("not_found", f"No draft analysis found for project '{project_id}'.", 404)

    risks = [RiskItem(**r) for r in analysis.risks]
    avg_overrun, hist_count = get_historical_overrun_metrics(db)

    # Recalculate using Python rules
    new_calc = calculate_feasibility(
        requirements=payload.requirements,
        risks=risks,
        deadline_weeks=project.deadline_weeks,
        budget_max=project.budget_max,
        historical_overrun=avg_overrun if hist_count > 0 else None,
        historical_count=hist_count
    )

    # Update analysis record
    analysis.requirements = [r.model_dump() for r in payload.requirements]
    analysis.calculation = new_calc.model_dump()

    # Update project cached totals
    project.verdict = new_calc.verdict
    project.effort_min_weeks = new_calc.min_weeks
    project.effort_max_weeks = new_calc.max_weeks
    project.cost_min = new_calc.min_cost
    project.cost_max = new_calc.max_cost
    project.updated_at = utc_now()

    db.commit()
    db.refresh(analysis)

    return to_analysis_response(analysis)

@router.post("/projects/{project_id}/approve", response_model=AnalysisResponse)
def approve_project_baseline(
    project_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db)
):
    """
    Approves project analysis, freezers an immutable baseline snapshot, and changes status to approved.
    """
    if not payload.approver_name.strip():
        raise_error("bad_input", "Approver name is required to freeze baseline.", 422)

    project = db.query(Project).filter_by(id=project_id).first()
    if not project:
        raise_error("not_found", f"Project with ID '{project_id}' was not found.", 404)

    if project.status != "analyzed":
        raise_error("bad_status", f"Cannot approve project in '{project.status}' status. Only analyzed projects can be approved.", 409)

    latest_analysis = (
        db.query(Analysis)
        .filter_by(project_id=project_id, is_baseline=False)
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if not latest_analysis:
        raise_error("not_found", f"No analysis found to approve for project '{project_id}'.", 404)

    # Create immutable baseline snapshot
    baseline_id = f"BSL-{uuid.uuid4().hex[:8].upper()}"
    baseline_analysis = Analysis(
        id=baseline_id,
        project_id=project.id,
        is_baseline=True,
        summary=latest_analysis.summary,
        requirements=latest_analysis.requirements,
        gaps=latest_analysis.gaps,
        conflicts=latest_analysis.conflicts,
        risks=latest_analysis.risks,
        required_skills=latest_analysis.required_skills,
        tech_stack=latest_analysis.tech_stack,
        milestones=latest_analysis.milestones,
        calculation=latest_analysis.calculation,
        created_at=utc_now()
    )
    db.add(baseline_analysis)

    # Update project status
    project.status = "approved"
    project.approved_by = payload.approver_name.strip()
    project.approval_notes = payload.notes.strip() if payload.notes else None
    project.approved_at = utc_now()
    project.updated_at = utc_now()

    db.commit()
    db.refresh(baseline_analysis)

    return to_analysis_response(baseline_analysis)
