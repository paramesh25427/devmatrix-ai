from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

T = TypeVar("T")

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

class MetaPayload(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    request_id: Optional[str] = "req-default"
    version: str = "1.0.0"

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: MetaPayload = Field(default_factory=MetaPayload)

class PaginationMetadata(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

class PaginatedApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    pagination: PaginationMetadata
    meta: MetaPayload = Field(default_factory=MetaPayload)
