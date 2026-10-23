from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "legacy_projects"

    project_id = Column(String(32), primary_key=True)
    org_id = Column(String(32), ForeignKey("organizations.org_id", ondelete="RESTRICT"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=False)
    business_objectives = Column(String(2000), nullable=False)
    target_architecture = Column(String(500), nullable=True)
    target_completion_date = Column(Date, nullable=False)
    budget_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    team_size_limit = Column(Integer, nullable=True)
    status = Column(String(30), nullable=False, default="draft")
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="projects")
    requirements = relationship("ProjectRequirement", back_populates="project", cascade="all, delete-orphan")
    clarifications = relationship("RequirementClarification", back_populates="project", cascade="all, delete-orphan")
    analysis_runs = relationship("FeasibilityAnalysisRun", back_populates="project", cascade="all, delete-orphan")

class ProjectRequirement(Base):
    __tablename__ = "project_requirements"

    requirement_id = Column(String(32), primary_key=True)
    project_id = Column(String(32), ForeignKey("legacy_projects.project_id", ondelete="CASCADE"), nullable=False)
    source_document_id = Column(String(32), nullable=True)
    type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=False)
    acceptance_criteria = Column(String(2000), nullable=True)
    complexity_level = Column(String(20), nullable=False, default="medium")
    required_skill_id = Column(String(32), ForeignKey("skills.skill_id", ondelete="SET NULL"), nullable=True)
    minimum_skill_proficiency = Column(Integer, nullable=True)
    is_ambiguous = Column(Boolean, nullable=False, default=False)
    has_unconfirmed_assumptions = Column(Boolean, nullable=False, default=False)
    provenance = Column(String(50), nullable=False, default="manual_entry")
    verified_by_user = Column(Boolean, nullable=False, default=True)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="requirements")
    skill = relationship("Skill")

class RequirementClarification(Base):
    __tablename__ = "requirement_clarifications"

    clarification_id = Column(String(32), primary_key=True)
    project_id = Column(String(32), ForeignKey("legacy_projects.project_id", ondelete="CASCADE"), nullable=False)
    requirement_id = Column(String(32), ForeignKey("project_requirements.requirement_id", ondelete="CASCADE"), nullable=True)
    question = Column(String(1000), nullable=False)
    impact_description = Column(String(1000), nullable=False)
    severity = Column(String(20), nullable=False)
    answer = Column(String(2000), nullable=True)
    is_resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="clarifications")
