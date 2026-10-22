from typing import List, Optional, Any
from pydantic import BaseModel, Field
from backend.app.schemas.common import FeasibilityStatus, SeverityLevel

class EvidenceProvenance(BaseModel):
    record_type: str = Field(..., example="employee_availability")
    record_id: str = Field(..., example="EMP-001")
    field_name: str = Field(..., example="remaining_hours")
    observed_value: Any = Field(..., example=10.0)
    required_value: Any = Field(..., example=28.2)
    citation: str = Field(..., example="EMP-001 has only 10h/week remaining due to assignment ASN-001 on PRJ-090")

    class Config:
        from_attributes = True

class RiskItemResponse(BaseModel):
    risk_id: str = Field(..., example="RUN-501-RSK-901")
    risk_rule_id: Optional[str] = Field(None, example="RSK-901")
    dimension: str = Field(..., example="employee_capacity")
    title: str = Field(..., example="Backend Lead Bandwidth Deficit")
    description: str = Field(..., example="Required backend workload exceeds Arjun Mehta's available capacity.")
    severity: SeverityLevel = Field(..., example=SeverityLevel.HIGH)
    likelihood: SeverityLevel = Field(..., example=SeverityLevel.HIGH)
    evidence_provenance: EvidenceProvenance
    affected_requirement_id: Optional[str] = Field(None, example="REQ-201")
    potential_impact: str = Field(..., example="3-week delivery slip on core architecture foundation.")
    suggested_mitigation: str = Field(..., example="Reassign 15h/week on PRJ-090 or onboard a contractor.")
    owner_role: str = Field(..., example="Engineering Manager")
    confidence_level: str = Field("high", example="high")

    class Config:
        from_attributes = True

class FeasibilityReportResponse(BaseModel):
    report_id: str = Field(..., example="REP-701")
    run_id: str = Field(..., example="RUN-501")
    project_id: str = Field(..., example="PRJ-101")
    overall_status: FeasibilityStatus = Field(..., example=FeasibilityStatus.FEASIBLE_WITH_CONDITIONS)
    overall_score: float = Field(..., example=59.6) # 0-100 risk score (59.58 exact)
    completeness_score: float = Field(..., example=82.0)
    technical_complexity_score: float = Field(..., example=74.0)
    org_capability_score: float = Field(..., example=58.0)
    estimated_effort_hours_optimistic: float = Field(..., example=420.0)
    estimated_effort_hours_nominal: float = Field(..., example=540.0)
    estimated_effort_hours_pessimistic: float = Field(..., example=720.0)
    estimated_cost_nominal: float = Field(..., example=40500.00)
    estimated_duration_days_nominal: int = Field(..., example=65)
    executive_summary: str
    risks: List[RiskItemResponse]
    recommended_action: str = Field(..., example="proceed_with_conditions")
    pre_approval_conditions: List[str]

    class Config:
        from_attributes = True
