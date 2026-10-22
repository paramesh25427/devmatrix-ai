from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.schemas.common import ProjectStatus, SeverityLevel

class ProjectCreate(BaseModel):
    org_id: Optional[str] = Field(None, example="ORG-001", description="Target organization ID. If omitted, defaults to 'ORG-001' for synthetic demo.")
    title: str = Field(..., min_length=3, max_length=255, example="ShopNova E-Commerce Suite")
    description: str = Field(..., min_length=10, example="Multi-vendor marketplace with secure checkout and cart.")
    business_objectives: str = Field(..., example="Expand digital revenue by 40% with high-throughput order engine.")
    target_architecture: Optional[str] = Field("Microservices with PostgreSQL, Redis, FastAPI, and React", example="Microservices")
    target_completion_date: date = Field(..., example="2026-12-15")
    budget_amount: float = Field(..., gt=0, example=85000.00)
    currency: str = Field("USD", max_length=3, example="USD")
    team_size_limit: Optional[int] = Field(None, gt=0, example=5)

class ProjectResponse(ProjectCreate):
    project_id: str = Field(..., example="PRJ-101")
    org_id: str = Field(..., example="ORG-001")
    status: ProjectStatus = Field(..., example=ProjectStatus.DRAFT)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RequirementCreate(BaseModel):
    type: str = Field(..., example="functional") # functional, non_functional, architecture, integration, compliance
    title: str = Field(..., example="Payment Gateway Integration")
    description: str = Field(..., example="Support credit card, UPI, and netbanking with 3D-Secure 2.0 via Stripe.")
    acceptance_criteria: Optional[str] = Field(None, example="PCI-DSS compliant, <2s checkout latency, webhook idempotency.")
    complexity_level: SeverityLevel = Field(SeverityLevel.HIGH)
    required_skill_id: Optional[str] = Field(None, example="SKL-105")
    minimum_skill_proficiency: Optional[int] = Field(None, ge=1, le=5, example=4)
    provenance: str = Field("manual_entry", example="manual_entry")

class RequirementResponse(RequirementCreate):
    requirement_id: str = Field(..., example="REQ-201")
    project_id: str = Field(..., example="PRJ-101")
    is_ambiguous: bool = Field(False)
    has_unconfirmed_assumptions: bool = Field(False)
    verified_by_user: bool = Field(True)

    class Config:
        from_attributes = True

class ClarificationResponse(BaseModel):
    clarification_id: str = Field(..., example="CLR-301")
    project_id: str = Field(..., example="PRJ-101")
    requirement_id: Optional[str] = Field(None, example="REQ-206")
    question: str = Field(..., example="What is the anticipated peak orders/sec during flash sales?")
    impact_description: str = Field(..., example="Affects distributed queue sizing and database read-replica count.")
    severity: SeverityLevel = Field(..., example=SeverityLevel.HIGH)
    answer: Optional[str] = None
    is_resolved: bool = Field(False)

    class Config:
        from_attributes = True

class ClarificationAnswerRequest(BaseModel):
    answer: str = Field(..., min_length=2, example="Peak flash sale expectation is 1,200 RPS.")
