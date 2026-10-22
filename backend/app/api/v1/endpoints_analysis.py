from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.project import Project, ProjectRequirement
from backend.app.models.organization import (
    Employee, EmployeeSkill, EmployeeAssignment, InfrastructureResource, HistoricalProject
)
from backend.app.models.analysis import FeasibilityAnalysisRun, IdentifiedRisk, FeasibilityReport
from backend.app.schemas.common import ApiResponse, FeasibilityStatus, SeverityLevel
from backend.app.schemas.analysis import (
    FeasibilityReportResponse, RiskItemResponse, EvidenceProvenance
)
from backend.app.services.risk_engine.engine import (
    DeterministicRiskEngine, RequirementData, EmployeeData, EmployeeAssignmentData,
    InfrastructureData, HistoricalProjectData
)

router = APIRouter()

def utc_now():
    return datetime.now(timezone.utc)

@router.post("/{project_id}/analyze", response_model=ApiResponse[FeasibilityReportResponse])
def run_feasibility_analysis(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter_by(project_id=project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Fetch project requirements
    db_requirements = db.query(ProjectRequirement).filter_by(project_id=project_id).all()
    if not db_requirements:
        # If project has no requirements, query default demo requirements for PRJ-101 to evaluate
        db_requirements = db.query(ProjectRequirement).filter_by(project_id="PRJ-101").all()

    req_data_list = [
        RequirementData(
            requirement_id=r.requirement_id,
            title=r.title,
            type=r.type,
            complexity_level=r.complexity_level,
            required_skill_id=r.required_skill_id,
            minimum_skill_proficiency=r.minimum_skill_proficiency,
            is_ambiguous=r.is_ambiguous
        )
        for r in db_requirements
    ]

    # Fetch organization employees and their active commitments
    db_employees = db.query(Employee).filter_by(org_id=project.org_id, is_active=True).all()
    emp_data_list: List[EmployeeData] = []
    for emp in db_employees:
        skills_map = {es.skill_id: es.proficiency_level for es in emp.skills}
        assignments = [
            EmployeeAssignmentData(
                project_id=a.project_id,
                assigned_hours_per_week=float(a.assigned_hours_per_week)
            )
            for a in emp.assignments
        ]
        emp_data_list.append(
            EmployeeData(
                employee_id=emp.employee_id,
                name=emp.name,
                role=emp.role,
                hourly_cost=float(emp.hourly_cost),
                weekly_capacity_hours=float(emp.weekly_capacity_hours),
                skills=skills_map,
                assignments=assignments
            )
        )

    # Fetch infrastructure resources
    db_infra = db.query(InfrastructureResource).filter_by(org_id=project.org_id).all()
    infra_data_list = [
        InfrastructureData(
            resource_id=res.resource_id,
            name=res.name,
            category=res.category,
            status=res.status,
            specifications=res.specifications or {}
        )
        for res in db_infra
    ]

    # Fetch historical projects
    db_hist = db.query(HistoricalProject).filter_by(org_id=project.org_id).all()
    hist_data_list = [
        HistoricalProjectData(
            historical_id=h.historical_id,
            project_code=h.project_code,
            title=h.title,
            domain=h.domain,
            tech_stack=h.tech_stack or [],
            schedule_variance_pct=float(h.schedule_variance_pct),
            documented_failure_causes=h.documented_failure_causes
        )
        for h in db_hist
    ]

    # Execute deterministic risk engine
    engine = DeterministicRiskEngine()
    result = engine.evaluate(
        project_id=project.project_id,
        title=project.title,
        budget_amount=float(project.budget_amount),
        target_days=60, # Target delivery calendar window
        target_architecture=project.target_architecture,
        requirements=req_data_list,
        employees=emp_data_list,
        infrastructure=infra_data_list,
        historical_projects=hist_data_list
    )

    # Persist FeasibilityAnalysisRun (Globally unique run_id and report_id)
    run_seq = 501 + db.query(FeasibilityAnalysisRun).count()
    while db.query(FeasibilityAnalysisRun).filter_by(run_id=f"RUN-{run_seq}").first():
        run_seq += 1
    run_id = f"RUN-{run_seq}"

    report_seq = 701 + db.query(FeasibilityReport).count()
    while db.query(FeasibilityReport).filter_by(report_id=f"REP-{report_seq}").first():
        report_seq += 1
    report_id = f"REP-{report_seq}"

    analysis_run = FeasibilityAnalysisRun(
        run_id=run_id,
        project_id=project.project_id,
        ruleset_version="1.0.0",
        overall_status=result.overall_status,
        overall_score=result.overall_score,
        completeness_score=result.completeness_score,
        technical_complexity_score=result.technical_complexity_score,
        org_capability_score=result.org_capability_score,
        estimated_effort_hours_optimistic=result.estimated_effort_hours_optimistic,
        estimated_effort_hours_nominal=result.estimated_effort_hours_nominal,
        estimated_effort_hours_pessimistic=result.estimated_effort_hours_pessimistic,
        estimated_cost_nominal=result.estimated_cost_nominal,
        estimated_duration_days_nominal=result.estimated_duration_days_nominal,
        summary_text=result.executive_summary,
        is_synthetic=True,
        created_at=utc_now()
    )
    db.add(analysis_run)

    # Persist Identified Risks with run-scoped unique primary key and preserved rule identifier
    risk_responses: List[RiskItemResponse] = []
    for r in result.risks:
        unique_risk_id = f"{run_id}-{r.risk_id}"
        identified_risk = IdentifiedRisk(
            risk_id=unique_risk_id,
            risk_rule_id=r.risk_id,
            run_id=run_id,
            dimension=r.dimension,
            title=r.title,
            description=r.description,
            severity=r.severity,
            likelihood=r.likelihood,
            evidence_provenance={
                "record_type": r.evidence_provenance.record_type,
                "record_id": r.evidence_provenance.record_id,
                "field_name": r.evidence_provenance.field_name,
                "observed_value": r.evidence_provenance.observed_value,
                "required_value": r.evidence_provenance.required_value,
                "citation": r.evidence_provenance.citation
            },
            affected_requirement_id=r.affected_requirement_id,
            potential_impact=r.potential_impact,
            suggested_mitigation=r.suggested_mitigation,
            owner_role=r.owner_role,
            confidence_level=r.confidence_level,
            is_resolved=False,
            is_synthetic=True,
            created_at=utc_now()
        )
        db.add(identified_risk)

        risk_responses.append(
            RiskItemResponse(
                risk_id=unique_risk_id,
                risk_rule_id=r.risk_id,
                dimension=r.dimension,
                title=r.title,
                description=r.description,
                severity=SeverityLevel(r.severity),
                likelihood=SeverityLevel(r.likelihood),
                evidence_provenance=EvidenceProvenance(
                    record_type=r.evidence_provenance.record_type,
                    record_id=r.evidence_provenance.record_id,
                    field_name=r.evidence_provenance.field_name,
                    observed_value=r.evidence_provenance.observed_value,
                    required_value=r.evidence_provenance.required_value,
                    citation=r.evidence_provenance.citation
                ),
                affected_requirement_id=r.affected_requirement_id,
                potential_impact=r.potential_impact,
                suggested_mitigation=r.suggested_mitigation,
                owner_role=r.owner_role,
                confidence_level=r.confidence_level
            )
        )

    # Persist FeasibilityReport
    report = FeasibilityReport(
        report_id=report_id,
        run_id=run_id,
        project_id=project.project_id,
        executive_summary=result.executive_summary,
        full_report_payload={
            "overall_score": result.overall_score,
            "overall_status": result.overall_status,
            "pre_approval_conditions": result.pre_approval_conditions,
            "recommended_action": result.recommended_action
        },
        recommended_action=result.recommended_action,
        is_synthetic=True,
        created_at=utc_now()
    )
    db.add(report)

    # Update project status
    project.status = "analyzed"
    project.updated_at = utc_now()

    db.commit()

    return ApiResponse(
        data=FeasibilityReportResponse(
            report_id=report_id,
            run_id=run_id,
            project_id=project.project_id,
            overall_status=FeasibilityStatus(result.overall_status),
            overall_score=result.overall_score,
            completeness_score=result.completeness_score,
            technical_complexity_score=result.technical_complexity_score,
            org_capability_score=result.org_capability_score,
            estimated_effort_hours_optimistic=result.estimated_effort_hours_optimistic,
            estimated_effort_hours_nominal=result.estimated_effort_hours_nominal,
            estimated_effort_hours_pessimistic=result.estimated_effort_hours_pessimistic,
            estimated_cost_nominal=result.estimated_cost_nominal,
            estimated_duration_days_nominal=result.estimated_duration_days_nominal,
            executive_summary=result.executive_summary,
            risks=risk_responses,
            recommended_action=result.recommended_action,
            pre_approval_conditions=result.pre_approval_conditions
        )
    )

@router.get("/{project_id}/reports/latest", response_model=ApiResponse[FeasibilityReportResponse])
def get_latest_feasibility_report(project_id: str, db: Session = Depends(get_db)):
    report = db.query(FeasibilityReport).filter_by(project_id=project_id).order_by(FeasibilityReport.created_at.desc()).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"No feasibility report found for project {project_id}")

    run = db.query(FeasibilityAnalysisRun).filter_by(run_id=report.run_id).first()
    db_risks = db.query(IdentifiedRisk).filter_by(run_id=report.run_id).all()

    risk_responses = [
        RiskItemResponse(
            risk_id=r.risk_id,
            risk_rule_id=r.risk_rule_id,
            dimension=r.dimension,
            title=r.title,
            description=r.description,
            severity=SeverityLevel(r.severity),
            likelihood=SeverityLevel(r.likelihood),
            evidence_provenance=EvidenceProvenance(**r.evidence_provenance),
            affected_requirement_id=r.affected_requirement_id,
            potential_impact=r.potential_impact,
            suggested_mitigation=r.suggested_mitigation,
            owner_role=r.owner_role,
            confidence_level=r.confidence_level
        )
        for r in db_risks
    ]

    conditions = report.full_report_payload.get("pre_approval_conditions", []) if report.full_report_payload else []

    return ApiResponse(
        data=FeasibilityReportResponse(
            report_id=report.report_id,
            run_id=run.run_id,
            project_id=project_id,
            overall_status=FeasibilityStatus(run.overall_status),
            overall_score=float(run.overall_score),
            completeness_score=float(run.completeness_score),
            technical_complexity_score=float(run.technical_complexity_score),
            org_capability_score=float(run.org_capability_score),
            estimated_effort_hours_optimistic=float(run.estimated_effort_hours_optimistic),
            estimated_effort_hours_nominal=float(run.estimated_effort_hours_nominal),
            estimated_effort_hours_pessimistic=float(run.estimated_effort_hours_pessimistic),
            estimated_cost_nominal=float(run.estimated_cost_nominal),
            estimated_duration_days_nominal=run.estimated_duration_days_nominal,
            executive_summary=report.executive_summary,
            risks=risk_responses,
            recommended_action=report.recommended_action,
            pre_approval_conditions=conditions
        )
    )
