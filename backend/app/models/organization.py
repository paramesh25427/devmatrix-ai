from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    org_id = Column(String(32), primary_key=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    default_currency = Column(String(3), nullable=False, default="USD")
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    employees = relationship("Employee", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization")

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(String(32), primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    description = Column(String(500), nullable=True)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    employee_skills = relationship("EmployeeSkill", back_populates="skill")

class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String(32), primary_key=True)
    org_id = Column(String(32), ForeignKey("organizations.org_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    hourly_cost = Column(Numeric(10, 2), nullable=False)
    weekly_capacity_hours = Column(Numeric(5, 2), nullable=False, default=40.0)
    is_active = Column(Boolean, nullable=False, default=True)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="employees")
    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    assignments = relationship("EmployeeAssignment", back_populates="employee", cascade="all, delete-orphan")

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    employee_id = Column(String(32), ForeignKey("employees.employee_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(String(32), ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)
    proficiency_level = Column(Integer, nullable=False)
    years_experience = Column(Numeric(4, 1), nullable=False, default=0.0)
    verified_projects_count = Column(Integer, nullable=False, default=0)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="skills")
    skill = relationship("Skill", back_populates="employee_skills")

class EmployeeAssignment(Base):
    __tablename__ = "employee_assignments"

    assignment_id = Column(String(32), primary_key=True)
    employee_id = Column(String(32), ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(32), nullable=False)
    project_name = Column(String(255), nullable=False)
    assigned_hours_per_week = Column(Numeric(5, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    employee = relationship("Employee", back_populates="assignments")

class InfrastructureResource(Base):
    __tablename__ = "infrastructure_resources"

    resource_id = Column(String(32), primary_key=True)
    org_id = Column(String(32), ForeignKey("organizations.org_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    specifications = Column(JSON, nullable=False, default=dict)
    status = Column(String(50), nullable=False)
    monthly_cost = Column(Numeric(10, 2), nullable=False, default=0.0)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

class HistoricalProject(Base):
    __tablename__ = "historical_projects"

    historical_id = Column(String(32), primary_key=True)
    org_id = Column(String(32), ForeignKey("organizations.org_id", ondelete="CASCADE"), nullable=False)
    project_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False)
    tech_stack = Column(JSON, nullable=False, default=list)
    planned_effort_hours = Column(Numeric(8, 2), nullable=False)
    actual_effort_hours = Column(Numeric(8, 2), nullable=False)
    planned_duration_days = Column(Integer, nullable=False)
    actual_duration_days = Column(Integer, nullable=False)
    planned_budget = Column(Numeric(12, 2), nullable=False)
    actual_cost = Column(Numeric(12, 2), nullable=False)
    schedule_variance_pct = Column(Numeric(6, 2), nullable=False, default=0.0)
    documented_failure_causes = Column(String(1000), nullable=True)
    post_mortem_notes = Column(JSON, nullable=False, default=dict)
    is_synthetic = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
