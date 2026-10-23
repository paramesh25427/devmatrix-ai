from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

# --- Enums ---
class ProjectStatus(str, Enum):
    SUBMITTED = "submitted"
    ANALYZED = "analyzed"
    APPROVED = "approved"
    TEAM_ASSIGNED = "team_assigned"
    IN_DELIVERY = "in_delivery"
    COMPLETED = "completed"

class FeasibilityVerdict(str, Enum):
    FEASIBLE = "feasible"
    CONDITIONAL = "conditional"
    NOT_FEASIBLE = "not_feasible"

class RequirementType(str, Enum):
    FUNCTIONAL = "functional"
    NON_FUNCTIONAL = "non_functional"

class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ComplexityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class RiskSeverity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    DONE = "done"

# --- Error Envelope ---
class ErrorResponse(BaseModel):
    error: str
    message: str

# --- Requirements & Breakdown ---
class RequirementItem(BaseModel):
    id: int
    text: str
    type: RequirementType = RequirementType.FUNCTIONAL
    priority: PriorityLevel = PriorityLevel.MEDIUM
    complexity: ComplexityLevel = ComplexityLevel.MEDIUM
    integration: bool = False

class RiskItem(BaseModel):
    title: str
    severity: RiskSeverity = RiskSeverity.MEDIUM
    mitigation: str

class RequiredSkillItem(BaseModel):
    name: str
    mandatory: bool = True

class MilestoneItem(BaseModel):
    name: str
    weeks: int

class CalculationDetail(BaseModel):
    total_points: int
    person_weeks: float
    integrations: int
    integration_overhead: float
    effective_developers: float
    calendar_weeks: float
    min_weeks: int
    max_weeks: int
    min_cost: float
    max_cost: float
    buffer_min: float
    buffer_max: float
    rate_per_week: float
    historical_adjustment_applied: bool
    historical_overrun_pct: float
    historical_project_count: int
    deadline_weeks: int
    budget_max: float
    base_verdict: str
    budget_downgrade: bool
    risk_downgrade: bool
    verdict: str
    rule_fired: str
    reason: str

# --- Structured AI Output Schema ---
class AIAnalysisOutput(BaseModel):
    project_name: str
    summary: str
    requirements: List[RequirementItem]
    gaps: List[str] = []
    conflicts: List[str] = []
    risks: List[RiskItem] = []
    required_skills: List[RequiredSkillItem] = []
    tech_stack: List[str] = []
    milestones: List[MilestoneItem] = []

# --- Analysis Response Schema ---
class AnalysisResponse(BaseModel):
    id: str
    project_id: str
    is_baseline: bool = False
    summary: str
    requirements: List[RequirementItem]
    gaps: List[str] = []
    conflicts: List[str] = []
    risks: List[RiskItem] = []
    required_skills: List[RequiredSkillItem] = []
    tech_stack: List[str] = []
    milestones: List[MilestoneItem] = []
    calculation: CalculationDetail
    created_at: datetime

class RequirementsUpdateRequest(BaseModel):
    requirements: List[RequirementItem]

class ApprovalRequest(BaseModel):
    approver_name: str
    notes: Optional[str] = None

# --- Project Schemas ---
class ProjectCreateResponse(BaseModel):
    id: str
    title: str
    client: str
    status: ProjectStatus
    message: str

class ProjectListItem(BaseModel):
    id: str
    title: str
    client: str
    status: ProjectStatus
    verdict: Optional[str] = None
    effort_min_weeks: Optional[int] = None
    effort_max_weeks: Optional[int] = None
    cost_min: Optional[float] = None
    cost_max: Optional[float] = None
    deadline_weeks: int
    budget_min: float
    budget_max: float
    updated_at: datetime
    created_at: datetime

class ProjectDetailResponse(BaseModel):
    id: str
    title: str
    client: str
    deadline_weeks: int
    budget_min: float
    budget_max: float
    tech_stack: List[str]
    notes: Optional[str]
    raw_text: str
    status: ProjectStatus
    verdict: Optional[str]
    effort_min_weeks: Optional[int]
    effort_max_weeks: Optional[int]
    cost_min: Optional[float]
    cost_max: Optional[float]
    sim_offset_days: int
    actual_weeks: Optional[int]
    actual_cost: Optional[float]
    approved_by: Optional[str]
    approval_notes: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    analysis: Optional[AnalysisResponse] = None

# --- Developer & Team Schemas ---
class DeveloperProfile(BaseModel):
    id: str
    name: str
    role: str
    experience_years: float
    skills: Dict[str, int]
    free_capacity_pct: int
    flagged_skills: List[str] = []

class DeveloperFlagRequest(BaseModel):
    note: str

class TeamMemberAssigned(BaseModel):
    developer_id: str
    name: str
    role: str
    allocated_capacity_pct: int
    skills: Dict[str, int]
    reason: str

class AlternativeTeamOption(BaseModel):
    team: List[TeamMemberAssigned]
    tradeoff: str
    score: float
    skills_covered_pct: float

class TeamRecommendationResponse(BaseModel):
    project_id: str
    best_team: List[TeamMemberAssigned]
    alternative: AlternativeTeamOption
    mandatory_skills_covered: int
    total_mandatory_skills: int
    coverage_pct: float
    capacity_violations: List[str]
    uncovered_skills: List[str]
    explanation: str

class TeamConfirmRequest(BaseModel):
    which: str = "best" # "best" or "alternative"

# --- Tasks & Delivery Schemas ---
class TaskItem(BaseModel):
    id: str
    project_id: str
    title: str
    milestone_name: str
    status: TaskStatus
    owner_name: str
    owner_id: str
    due_date: str # YYYY-MM-DD
    estimated_hours: float
    logged_hours: float
    dependencies: List[str] = []
    created_at: datetime
    updated_at: datetime

class TaskUpdateRequest(BaseModel):
    status: Optional[TaskStatus] = None
    logged_hours: Optional[float] = None
    owner_name: Optional[str] = None
    due_date: Optional[str] = None

class AlertItem(BaseModel):
    task_id: str
    task_name: str
    severity: RiskSeverity
    rule: str
    message: str

class SimulateRequest(BaseModel):
    advance_days: int = 7

class CompleteProjectRequest(BaseModel):
    actual_weeks: int
    actual_cost: float

# --- History Learning Schemas ---
class HistoricalProjectItem(BaseModel):
    id: str
    name: str
    estimated_weeks: float
    actual_weeks: float
    estimated_cost: float
    actual_cost: float
    overrun_pct: float
    domain: str
    is_seed: bool

class HistoryResponse(BaseModel):
    average_overrun_pct: float
    project_count: int
    projects: List[HistoricalProjectItem]
