from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    client = Column(String(255), nullable=False)
    deadline_weeks = Column(Integer, nullable=False)
    budget_min = Column(Float, nullable=False, default=0.0)
    budget_max = Column(Float, nullable=False, default=0.0)
    tech_stack = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="submitted") # submitted, analyzed, approved, team_assigned, in_delivery, completed
    verdict = Column(String(32), nullable=True) # feasible, conditional, not_feasible
    effort_min_weeks = Column(Integer, nullable=True)
    effort_max_weeks = Column(Integer, nullable=True)
    cost_min = Column(Float, nullable=True)
    cost_max = Column(Float, nullable=True)
    sim_offset_days = Column(Integer, nullable=False, default=0)
    actual_weeks = Column(Integer, nullable=True)
    actual_cost = Column(Float, nullable=True)
    approved_by = Column(String(255), nullable=True)
    approval_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    analyses = relationship("Analysis", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    team_assignment = relationship("TeamAssignment", back_populates="project", uselist=False, cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    is_baseline = Column(Boolean, nullable=False, default=False)
    summary = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False, default=list)
    gaps = Column(JSON, nullable=False, default=list)
    conflicts = Column(JSON, nullable=False, default=list)
    risks = Column(JSON, nullable=False, default=list)
    required_skills = Column(JSON, nullable=False, default=list)
    tech_stack = Column(JSON, nullable=False, default=list)
    milestones = Column(JSON, nullable=False, default=list)
    calculation = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="analyses")

class Developer(Base):
    __tablename__ = "developers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    experience_years = Column(Float, nullable=False)
    skills = Column(JSON, nullable=False, default=dict) # {"React": 5, "Python": 4, ...}
    free_capacity_pct = Column(Integer, nullable=False, default=100)
    flagged_skills = Column(JSON, nullable=False, default=list)

class TeamAssignment(Base):
    __tablename__ = "team_assignments"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    selection = Column(String(32), nullable=False, default="best") # "best" or "alternative"
    members = Column(JSON, nullable=False, default=list)
    confirmed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="team_assignment")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True, index=True)
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    milestone_name = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False, default="backlog") # backlog, in_progress, done
    owner_name = Column(String(255), nullable=False)
    owner_id = Column(String(64), nullable=False)
    due_date = Column(String(32), nullable=False) # YYYY-MM-DD
    estimated_hours = Column(Float, nullable=False, default=0.0)
    logged_hours = Column(Float, nullable=False, default=0.0)
    dependencies = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="tasks")

class PastProject(Base):
    __tablename__ = "past_projects"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    estimated_weeks = Column(Float, nullable=False)
    actual_weeks = Column(Float, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    actual_cost = Column(Float, nullable=False)
    overrun_pct = Column(Float, nullable=False)
    domain = Column(String(100), nullable=False)
    is_seed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(64), nullable=False, default="Delivery Manager") # Delivery Manager, Tech Lead, Project Executive
    provider = Column(String(32), nullable=False, default="google") # google, demo
    google_id = Column(String(128), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
