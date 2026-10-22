# DevMatrix AI — REST API Contract & Pydantic Schema Specification

## 1. Global API Standards & Envelope Conventions

### 1.1 Base URL & Content Negotiation
- **Base Prefix**: `/api/v1`
- **Default Content-Type**: `application/json`
- **Date/Time Standard**: ISO 8601 UTC string (`YYYY-MM-DDTHH:MM:SSZ`)

### 1.2 Unified Success & Error Envelopes

#### Success Envelope (`ApiResponse[T]`)
All non-streaming endpoints return an auditable response envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-22T10:15:00Z",
    "request_id": "req-9872134",
    "version": "1.0.0"
  }
}
```

#### Paginated Envelope (`PaginatedApiResponse[T]`)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 45,
    "total_pages": 3
  },
  "meta": {
    "timestamp": "2026-10-22T10:15:00Z"
  }
}
```

#### Standard Error Envelope (`ApiErrorResponse`)
DevMatrix AI conforms to RFC 7807-compatible structured errors:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided for project intake",
    "details": [
      {
        "field": "budget_amount",
        "issue": "Budget must be greater than zero"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-22T10:15:00Z"
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (HTTP 422)
- `RESOURCE_NOT_FOUND` (HTTP 404)
- `PRECONDITION_FAILED` (HTTP 412) — e.g. Attempting task allocation prior to manager approval
- `CONFLICT` (HTTP 409) — e.g. Duplicate project code or resource ID
- `INTERNAL_ENGINE_ERROR` (HTTP 500)

---

## 2. Pydantic v2 Schema Definitions (Shared Contract)

```python
from datetime import date, datetime
from typing import Generic, List, Optional, TypeVar, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum

# --- ENUMS ---
class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ANALYZED = "analyzed"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_DELIVERY = "in_delivery"
    COMPLETED = "completed"

class FeasibilityStatus(str, Enum):
    FEASIBLE = "feasible"
    FEASIBLE_WITH_CONDITIONS = "feasible_with_conditions"
    NOT_FEASIBLE = "not_feasible"
    INSUFFICIENT_INFORMATION = "insufficient_information"

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"

class ApprovalDecision(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    RENEGOTIATION_REQUESTED = "renegotiation_requested"

class AlertType(str, Enum):
    CRITICAL_BLOCKER = "critical_blocker"
    EFFORT_OVERRUN = "effort_overrun"
    SCHEDULE_DELAY = "schedule_delay"
    CAPACITY_CONFLICT = "capacity_conflict"

# --- CORE SCHEMAS ---

# 1. Project Intake
class ProjectCreate(BaseModel):
    org_id: Optional[str] = Field(None, example="ORG-001", description="Target organization ID. If omitted, defaults to authenticated user's organization context or 'ORG-001' for synthetic demo mode.")
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

# 2. Requirements & Clarifications
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

class ClarificationResponse(BaseModel):
    clarification_id: str = Field(..., example="CLR-301")
    project_id: str = Field(..., example="PRJ-101")
    requirement_id: Optional[str] = Field(None, example="REQ-206")
    question: str = Field(..., example="What is the anticipated peak orders/sec during flash sales?")
    impact_description: str = Field(..., example="Affects distributed queue sizing and database read-replica count.")
    severity: SeverityLevel = Field(..., example=SeverityLevel.HIGH)
    answer: Optional[str] = None
    is_resolved: bool = Field(False)

class ClarificationAnswerRequest(BaseModel):
    answer: str = Field(..., min_length=2, example="Peak flash sale expectation is 1,200 RPS.")

# 3. Organization, Employees & Skills
class SkillResponse(BaseModel):
    skill_id: str = Field(..., example="SKL-105")
    name: str = Field(..., example="Payment Gateway & PCI-DSS Integration")
    category: str = Field(..., example="backend")

class EmployeeSkillResponse(BaseModel):
    skill_id: str
    skill_name: str
    proficiency_level: int = Field(..., ge=1, le=5)
    years_experience: float
    verified_projects_count: int

class EmployeeAssignmentResponse(BaseModel):
    assignment_id: str
    project_id: str
    project_name: str
    assigned_hours_per_week: float
    start_date: date
    end_date: date

class EmployeeResponse(BaseModel):
    employee_id: str = Field(..., example="EMP-001")
    name: str = Field(..., example="Arjun Mehta")
    role: str = Field(..., example="Lead Backend Engineer")
    hourly_cost: float = Field(..., example=75.00)
    weekly_capacity_hours: float = Field(..., example=40.0, description="Gross contracted hours per week")
    remaining_hours_per_week: float = Field(..., example=10.0, description="Dynamically computed: weekly_capacity_hours minus active assignments overlapping project window")
    skills: List[EmployeeSkillResponse]
    current_assignments: List[EmployeeAssignmentResponse]

# 4. Feasibility & Risk Engine
class EvidenceProvenance(BaseModel):
    record_type: str = Field(..., example="employee_availability")
    record_id: str = Field(..., example="EMP-001")
    field_name: str = Field(..., example="remaining_hours")
    observed_value: Any = Field(..., example=10.0)
    required_value: Any = Field(..., example=28.0)
    citation: str = Field(..., example="EMP-001 has only 10h/week remaining due to assignment ASN-001 on PRJ-090")

class RiskItemResponse(BaseModel):
    risk_id: str = Field(..., example="RSK-901")
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

# 5. Approval Gate
class ApprovalRequest(BaseModel):
    run_id: str = Field(..., example="RUN-501", description="Target analysis run ID being approved. Must match latest run.")
    report_id: str = Field(..., example="REP-701", description="Target feasibility report ID being approved.")
    decision: ApprovalDecision = Field(..., example=ApprovalDecision.APPROVED)
    manager_name: str = Field(..., min_length=2, example="Sarah Jenkins")
    manager_email: str = Field(..., example="sarah.jenkins@shopnova.internal")
    decision_notes: str = Field(..., example="Approved on condition that external PCI consultant is contracted.")
    approved_conditions: List[str] = Field(default_factory=list, example=["Hire contractor for Stripe PCI module"])

class ApprovalResponse(BaseModel):
    approval_id: str = Field(..., example="APP-601")
    project_id: str = Field(..., example="PRJ-101")
    run_id: str = Field(..., example="RUN-501")
    report_id: str = Field(..., example="REP-701")
    decision: ApprovalDecision
    decision_timestamp: datetime
    manager_name: str
    decision_notes: str

# 6. Workforce & Task Planning
class RecommendedEmployee(BaseModel):
    employee_id: str = Field(..., example="EMP-002")
    name: str = Field(..., example="Priya Sharma")
    role: str = Field(..., example="Senior Frontend Engineer")
    matching_skill_id: str = Field(..., example="SKL-102")
    proficiency_level: int = Field(..., example=5)
    remaining_hours_per_week: float = Field(..., example=30.0)
    fit_score: float = Field(..., example=96.5)
    assignment_rationale: str = Field(..., example="Expert in React with 30h uncommitted capacity.")

class TeamRecommendationResponse(BaseModel):
    project_id: str = Field(..., example="PRJ-101")
    recommended_team: List[RecommendedEmployee]
    unfilled_roles: List[Dict[str, Any]]
    total_weekly_allocated_hours: float
    projected_weekly_burn_rate: float

class TaskCreate(BaseModel):
    requirement_id: Optional[str] = Field(None, example="REQ-201")
    title: str = Field(..., example="Implement 3D-Secure Stripe Webhook Endpoint")
    description: Optional[str] = Field(None, example="FastAPI endpoint with signature validation and Redis deduplication")
    required_skill_id: str = Field(..., example="SKL-105")
    minimum_proficiency: int = Field(4, ge=1, le=5)
    estimated_hours_nominal: float = Field(..., gt=0, example=24.0)
    estimated_hours_optimistic: Optional[float] = Field(None, gt=0, example=19.2, description="Optimistic hours. Service layer defaults to 0.8 * nominal if omitted.")
    estimated_hours_pessimistic: Optional[float] = Field(None, gt=0, example=33.6, description="Pessimistic hours. Service layer defaults to 1.4 * nominal if omitted.")
    dependency_task_ids: List[str] = Field(default_factory=list, example=["TSK-400"])
    assigned_employee_id: Optional[str] = Field(None, example="EMP-001")

class TaskResponse(TaskCreate):
    task_id: str = Field(..., example="TSK-401")
    project_id: str = Field(..., example="PRJ-101")
    status: TaskStatus = Field(TaskStatus.TODO)
    actual_hours_logged: float = Field(0.0)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus = Field(..., example=TaskStatus.BLOCKED)
    logged_hours_increment: float = Field(0.0, ge=0.0, example=4.5)

# 7. Blockers & Delivery Alerts
class BlockerCreate(BaseModel):
    title: str = Field(..., example="Stripe Sandbox Webhook Secret Missing")
    description: str = Field(..., example="Cannot verify webhook signatures in staging cluster.")
    blocker_category: str = Field("third_party_api", example="third_party_api")
    severity: SeverityLevel = Field(SeverityLevel.HIGH)

class BlockerResponse(BlockerCreate):
    blocker_id: str = Field(..., example="BLK-301")
    task_id: str = Field(..., example="TSK-401")
    is_resolved: bool = Field(False)
    created_at: datetime = Field(..., description="Timestamp when blocker was logged")

class DeliveryAlertResponse(BaseModel):
    alert_id: str = Field(..., example="ALT-201")
    project_id: str = Field(..., example="PRJ-101")
    task_id: Optional[str] = Field(None, example="TSK-401")
    alert_type: AlertType = Field(..., example=AlertType.CRITICAL_BLOCKER)
    severity: SeverityLevel = Field(..., example=SeverityLevel.CRITICAL)
    headline: str = Field(..., example="Critical Blocker on Payment Gateway Task")
    details: str = Field(..., example="Task TSK-401 blocked: Stripe sandbox credentials unconfirmed.")
    is_acknowledged: bool = Field(False)
    created_at: datetime

# 8. Performance & Historical
class EmployeePerformanceResponse(BaseModel):
    snapshot_id: str = Field(..., example="PRF-101")
    employee_id: str = Field(..., example="EMP-001")
    project_id: str = Field(..., example="PRJ-101")
    estimate_accuracy_ratio: float = Field(..., example=1.08) # 1.0 = exact, >1.0 = overrun
    on_time_completion_ratio: float = Field(..., example=0.92)
    unresolved_blocker_days: float = Field(..., example=1.5)
    confidence_level: str = Field(..., example="high")
    qualitative_context: str = Field(..., example="High precision on core modules; 1 slip caused by vendor outage.")
```

---

## 3. Complete Endpoints Catalog

### 3.1 Projects & Intake
- `POST /api/v1/projects`
  - **Desc**: Create a new project intake record. Resolves organization context via (1) request body `org_id`, (2) `X-Organization-ID` HTTP header or JWT auth claim, or (3) fallback to `'ORG-001'` in synthetic demo mode.
  - **Req**: `ProjectCreate`
  - **Res**: `ApiResponse[ProjectResponse]` (201 Created)
- `GET /api/v1/projects/{project_id}`
  - **Desc**: Retrieve full project details by ID.
  - **Res**: `ApiResponse[ProjectResponse]` (200 OK)
- `GET /api/v1/projects`
  - **Desc**: List all projects with optional status filter.
  - **Query**: `?status=draft&page=1&page_size=20`
  - **Res**: `PaginatedApiResponse[List[ProjectResponse]]` (200 OK)

### 3.2 Requirements & Document Ingestion
- `POST /api/v1/projects/{project_id}/documents/upload`
  - **Desc**: Upload a text/markdown requirement document.
  - **Req**: `multipart/form-data` (`file: UploadFile`)
  - **Res**: `ApiResponse[Dict[str, Any]]` (201 Created)
- `POST /api/v1/projects/{project_id}/requirements`
  - **Desc**: Manually append or edit a structured requirement.
  - **Req**: `RequirementCreate`
  - **Res**: `ApiResponse[RequirementResponse]` (201 Created)
- `GET /api/v1/projects/{project_id}/requirements`
  - **Desc**: Retrieve all structured requirements and ambiguity flags.
  - **Res**: `ApiResponse[List[RequirementResponse]]` (200 OK)
- `GET /api/v1/projects/{project_id}/clarifications`
  - **Desc**: Retrieve generated clarification questions.
  - **Res**: `ApiResponse[List[ClarificationResponse]]` (200 OK)
- `POST /api/v1/clarifications/{clarification_id}/answer`
  - **Desc**: Answer a clarification question, updating requirement status.
  - **Req**: `ClarificationAnswerRequest`
  - **Res**: `ApiResponse[ClarificationResponse]` (200 OK)

### 3.3 Organization Data Profiling
- `GET /api/v1/organization/employees`
  - **Desc**: Get list of employees with current remaining capacity and skill matrix.
  - **Res**: `ApiResponse[List[EmployeeResponse]]` (200 OK)
- `GET /api/v1/organization/resources`
  - **Desc**: Retrieve available cloud environments and licensed tools.
  - **Res**: `ApiResponse[List[Dict[str, Any]]]` (200 OK)
- `GET /api/v1/organization/historical-projects`
  - **Desc**: Query historical delivery benchmarks and past failure post-mortems.
  - **Res**: `ApiResponse[List[Dict[str, Any]]]` (200 OK)

### 3.4 Feasibility, Risk Engine & Reporting
- `POST /api/v1/projects/{project_id}/analyze`
  - **Desc**: Trigger the deterministic 11-dimension risk evaluation.
  - **Res**: `ApiResponse[FeasibilityReportResponse]` (200 OK)
- `GET /api/v1/projects/{project_id}/reports/latest`
  - **Desc**: Retrieve latest compiled feasibility report.
  - **Res**: `ApiResponse[FeasibilityReportResponse]` (200 OK)

### 3.5 Manager Approval Gate
- `POST /api/v1/projects/{project_id}/approve`
  - **Desc**: Record manager approval, renegotiation, or rejection decision. Validates that `run_id` matches the latest completed analysis run and `report_id` belongs to `run_id`. Rejects stale or mismatched runs with HTTP 409 Conflict (`STALE_ANALYSIS_ERROR`).
  - **Req**: `ApprovalRequest`
  - **Res**: `ApiResponse[ApprovalResponse]` (200 OK)

### 3.6 Workforce Allocation & Task Planning
- `GET /api/v1/projects/{project_id}/workforce/recommendations`
  - **Desc**: Generate role-matched team recommendation based on remaining capacity.
  - **Res**: `ApiResponse[TeamRecommendationResponse]` (200 OK)
- `POST /api/v1/projects/{project_id}/tasks/generate`
  - **Desc**: Auto-generate task DAG from approved project requirements. Populates `estimated_hours_optimistic` (0.8*nominal) and `estimated_hours_pessimistic` (1.4*nominal) if omitted.
  - **Res**: `ApiResponse[List[TaskResponse]]` (201 Created)
- `GET /api/v1/projects/{project_id}/tasks`
  - **Desc**: List all project tasks, assignees, and dependencies.
  - **Res**: `ApiResponse[List[TaskResponse]]` (200 OK)

### 3.7 Delivery Telemetry & Alerts
- `PATCH /api/v1/tasks/{task_id}/status`
  - **Desc**: Update task progress, log actual hours, or flag blocker.
  - **Req**: `TaskStatusUpdate`
  - **Res**: `ApiResponse[TaskResponse]` (200 OK)
- `POST /api/v1/tasks/{task_id}/blockers`
  - **Desc**: Inject an operational blocker on a task.
  - **Req**: `BlockerCreate`
  - **Res**: `ApiResponse[BlockerResponse]` (201 Created)
- `GET /api/v1/projects/{project_id}/alerts`
  - **Desc**: Fetch active delivery alerts and overrun warnings.
  - **Res**: `ApiResponse[List[DeliveryAlertResponse]]` (200 OK)

### 3.8 Performance Intelligence
- `GET /api/v1/projects/{project_id}/performance`
  - **Desc**: Fetch contextualized performance metrics and estimate accuracy.
  - **Res**: `ApiResponse[List[EmployeePerformanceResponse]]` (200 OK)

---

## 4. End-to-End API Call Sequence (Walkthrough)

The 9 steps below execute the complete demo scenario:

```
Step 1: Intake Creation
  POST /api/v1/projects
  Payload: {"org_id": "ORG-001", "title": "ShopNova E-Commerce Suite", "budget_amount": 85000, "target_completion_date": "2026-12-15", ...}
  Response: {"data": {"project_id": "PRJ-101", "org_id": "ORG-001", "status": "draft"}}

Step 2: Structured Requirements Submission
  POST /api/v1/projects/PRJ-101/requirements
  Payload: {"title": "Payment Gateway Integration", "required_skill_id": "SKL-105", "minimum_skill_proficiency": 4, ...}
  Response: {"data": {"requirement_id": "REQ-201"}}

Step 3: Trigger Feasibility & Risk Analysis
  POST /api/v1/projects/PRJ-101/analyze
  Response: {"data": {
    "report_id": "REP-701",
    "run_id": "RUN-501",
    "overall_status": "feasible_with_conditions",
    "overall_score": 59.6,
    "estimated_effort_hours_nominal": 540.0,
    "risks": [
      {
        "risk_id": "RSK-901",
        "title": "Backend Lead Bandwidth Deficit",
        "evidence_provenance": {"record_id": "EMP-001", "citation": "10h remaining vs 28h needed"}
      }
    ]
  }}

Step 4: Inspect Missing Requirements & Clarifications
  GET /api/v1/projects/PRJ-101/clarifications
  Response: {"data": [{"clarification_id": "CLR-301", "question": "What is the peak RPS?"}]}

Step 5: Manager Signs Approval Gate
  POST /api/v1/projects/PRJ-101/approve
  Payload: {
    "run_id": "RUN-501",
    "report_id": "REP-701",
    "decision": "approved",
    "manager_name": "Sarah Jenkins",
    "manager_email": "sarah.jenkins@shopnova.internal",
    "decision_notes": "Approved with contractor",
    "approved_conditions": ["Hire contractor for Stripe PCI module"]
  }
  Response: {"data": {"approval_id": "APP-601", "run_id": "RUN-501", "report_id": "REP-701", "decision": "approved"}}

Step 6: Query Recommended Team & Generate Tasks
  GET /api/v1/projects/PRJ-101/workforce/recommendations
  POST /api/v1/projects/PRJ-101/tasks/generate
  Response: {"data": [{"task_id": "TSK-401", "title": "Stripe Webhook API", "assigned_employee_id": "EMP-001", "estimated_hours_nominal": 24.0, "estimated_hours_optimistic": 19.2, "estimated_hours_pessimistic": 33.6}]}

Step 7: Task Execution & Progress Update
  PATCH /api/v1/tasks/TSK-401/status
  Payload: {"status": "in_progress", "logged_hours_increment": 8.0}
  Response: {"data": {"task_id": "TSK-401", "actual_hours_logged": 8.0}}

Step 8: Blocker Injection Triggers Delivery Alert
  POST /api/v1/tasks/TSK-401/blockers
  Payload: {"title": "Stripe Sandbox Credentials Missing", "severity": "high"}
  Response: {"data": {"blocker_id": "BLK-301", "created_at": "2026-10-22T10:30:00Z"}}
  GET /api/v1/projects/PRJ-101/alerts
  Response: {"data": [{"alert_id": "ALT-201", "headline": "Critical Blocker on Payment Gateway Task"}]}

Step 9: Review Contextual Performance Telemetry
  GET /api/v1/projects/PRJ-101/performance
  Response: {"data": [{"employee_id": "EMP-001", "estimate_accuracy_ratio": 1.08, "confidence_level": "high"}]}
```
