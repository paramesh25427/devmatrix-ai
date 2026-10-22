from datetime import date
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class SkillResponse(BaseModel):
    skill_id: str = Field(..., example="SKL-105")
    name: str = Field(..., example="Payment Gateway & PCI-DSS Integration")
    category: str = Field(..., example="backend")

    class Config:
        from_attributes = True

class EmployeeSkillResponse(BaseModel):
    skill_id: str
    skill_name: str
    proficiency_level: int = Field(..., ge=1, le=5)
    years_experience: float
    verified_projects_count: int

    class Config:
        from_attributes = True

class EmployeeAssignmentResponse(BaseModel):
    assignment_id: str
    project_id: str
    project_name: str
    assigned_hours_per_week: float
    start_date: date
    end_date: date

    class Config:
        from_attributes = True

class EmployeeResponse(BaseModel):
    employee_id: str = Field(..., example="EMP-001")
    name: str = Field(..., example="Arjun Mehta")
    role: str = Field(..., example="Lead Backend Engineer")
    hourly_cost: float = Field(..., example=75.00)
    weekly_capacity_hours: float = Field(..., example=40.0, description="Gross contracted hours per week")
    remaining_hours_per_week: float = Field(..., example=10.0, description="Dynamically computed: weekly_capacity_hours minus active assignments overlapping project window")
    skills: List[EmployeeSkillResponse]
    current_assignments: List[EmployeeAssignmentResponse]

    class Config:
        from_attributes = True

class InfrastructureResourceResponse(BaseModel):
    resource_id: str
    name: str
    category: str
    status: str
    specifications: Dict[str, Any]
    monthly_cost: float

    class Config:
        from_attributes = True

class HistoricalProjectResponse(BaseModel):
    historical_id: str
    project_code: str
    title: str
    domain: str
    tech_stack: List[str]
    planned_duration_days: int
    actual_duration_days: int
    schedule_variance_pct: float
    documented_failure_causes: Optional[str] = None

    class Config:
        from_attributes = True
