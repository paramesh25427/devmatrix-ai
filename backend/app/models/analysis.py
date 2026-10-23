from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class FeasibilityAnalysisRun(Base):
    __tablename__ = "feasibility_analysis_runs"

    run_id = Column(String(32), primary_key=True)
    project_id = Column(String(32), ForeignKey("legacy_projects.project_id", ondelete="CASCADE"), nullable=False)
    ruleset_version = Column(String(20), nullable=False, default="1.0.0")
    overall_status = Column(String(30), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    completeness_score = Column(Numeric(5, 2), nullable=False)
    technical_complexity_score = Column(Numeric(5, 2), nullable=False)
    org_capability_score = Column(Numeric(5, 2), nullable=False)
    estimated_effort_hours_optimistic = Column(Numeric(8, 2), nullable=False)
    estimated_effort_hours_nominal = Column(Numeric(8, 2), nullable=False)
    estimated_effort_hours_pessimistic = Column(Numeric(8, 2), nullable=False)
    estimated_cost_nominal = Column(Numeric(12, 2), nullable=False)
    estimated_duration_days_nominal = Column(Integer, nullable=False)
    summary_text = Column(String(2000), nullable=False)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="analysis_runs")
    risks = relationship("IdentifiedRisk", back_populates="analysis_run", cascade="all, delete-orphan")
    reports = relationship("FeasibilityReport", back_populates="analysis_run", cascade="all, delete-orphan")

class IdentifiedRisk(Base):
    __tablename__ = "identified_risks"

    risk_id = Column(String(64), primary_key=True)
    risk_rule_id = Column(String(32), nullable=True, index=True)
    run_id = Column(String(32), ForeignKey("feasibility_analysis_runs.run_id", ondelete="CASCADE"), nullable=False)
    dimension = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    severity = Column(String(20), nullable=False)
    likelihood = Column(String(20), nullable=False)
    evidence_provenance = Column(JSON, nullable=False)
    affected_requirement_id = Column(String(32), nullable=True)
    potential_impact = Column(String(1000), nullable=False)
    suggested_mitigation = Column(String(1000), nullable=False)
    owner_role = Column(String(100), nullable=False)
    confidence_level = Column(String(20), nullable=False)
    is_resolved = Column(Boolean, nullable=False, default=False)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    analysis_run = relationship("FeasibilityAnalysisRun", back_populates="risks")

class FeasibilityReport(Base):
    __tablename__ = "feasibility_reports"

    report_id = Column(String(32), primary_key=True)
    run_id = Column(String(32), ForeignKey("feasibility_analysis_runs.run_id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(32), ForeignKey("legacy_projects.project_id", ondelete="CASCADE"), nullable=False)
    executive_summary = Column(String(2000), nullable=False)
    full_report_payload = Column(JSON, nullable=False)
    recommended_action = Column(String(50), nullable=False)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    analysis_run = relationship("FeasibilityAnalysisRun", back_populates="reports")
