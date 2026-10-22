import sys
import os
from datetime import date, datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy import text
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.organization import (
    Organization, Skill, Employee, EmployeeSkill, EmployeeAssignment,
    InfrastructureResource, HistoricalProject
)
from backend.app.models.project import Project, ProjectRequirement, RequirementClarification
from backend.app.models.analysis import FeasibilityAnalysisRun, IdentifiedRisk, FeasibilityReport

def seed_database():
    Base.metadata.create_all(bind=engine)

    # Safe migration for risk_rule_id if table was already created in SQLite
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE identified_risks ADD COLUMN risk_rule_id VARCHAR(32)"))
            conn.commit()
    except Exception:
        pass

    db = SessionLocal()

    try:
        # Check if already seeded
        org = db.query(Organization).filter_by(org_id="ORG-001").first()
        if org:
            print("Database already contains ORG-001. Cleaning and re-seeding...")
            org_projects = db.query(Project.project_id).filter_by(org_id="ORG-001").all()
            org_proj_ids = [p[0] for p in org_projects]
            if "PRJ-101" not in org_proj_ids:
                org_proj_ids.append("PRJ-101")

            # 1. Clean analysis risks, reports, and runs safely for demo projects
            runs = db.query(FeasibilityAnalysisRun.run_id).filter(FeasibilityAnalysisRun.project_id.in_(org_proj_ids)).all()
            run_ids = [r[0] for r in runs]
            if run_ids:
                db.query(IdentifiedRisk).filter(IdentifiedRisk.run_id.in_(run_ids)).delete(synchronize_session=False)
            db.query(FeasibilityReport).filter(FeasibilityReport.project_id.in_(org_proj_ids)).delete(synchronize_session=False)
            db.query(FeasibilityAnalysisRun).filter(FeasibilityAnalysisRun.project_id.in_(org_proj_ids)).delete(synchronize_session=False)

            # 2. Clean requirement clarifications and requirements for demo projects
            db.query(RequirementClarification).filter(RequirementClarification.project_id.in_(org_proj_ids)).delete(synchronize_session=False)
            db.query(ProjectRequirement).filter(ProjectRequirement.project_id.in_(org_proj_ids)).delete(synchronize_session=False)
            db.query(Project).filter(Project.project_id.in_(org_proj_ids)).delete(synchronize_session=False)

            # 3. Clean employee skills, assignments, and employees for ORG-001
            employees = db.query(Employee.employee_id).filter_by(org_id="ORG-001").all()
            emp_ids = [e[0] for e in employees]
            if emp_ids:
                db.query(EmployeeSkill).filter(EmployeeSkill.employee_id.in_(emp_ids)).delete(synchronize_session=False)
                db.query(EmployeeAssignment).filter(EmployeeAssignment.employee_id.in_(emp_ids)).delete(synchronize_session=False)
            db.query(Employee).filter_by(org_id="ORG-001").delete(synchronize_session=False)

            # 4. Clean synthetic skills (SKL-101..107)
            skill_ids = [f"SKL-{i}" for i in range(101, 108)]
            db.query(Skill).filter(Skill.skill_id.in_(skill_ids)).delete(synchronize_session=False)

            # 5. Clean infrastructure & historical for ORG-001
            db.query(InfrastructureResource).filter_by(org_id="ORG-001").delete(synchronize_session=False)
            db.query(HistoricalProject).filter_by(org_id="ORG-001").delete(synchronize_session=False)

            # 6. Clean organization ORG-001
            db.query(Organization).filter_by(org_id="ORG-001").delete(synchronize_session=False)
            db.commit()

        # 1. Organization
        org = Organization(
            org_id="ORG-001",
            name="ShopNova Retail Corp",
            domain="shopnova.internal",
            default_currency="USD",
            is_synthetic=True
        )
        db.add(org)

        # 2. Skills
        skills = [
            Skill(skill_id="SKL-101", name="Python & FastAPI Microservices", category="backend", is_synthetic=True),
            Skill(skill_id="SKL-102", name="React, TypeScript & Vite", category="frontend", is_synthetic=True),
            Skill(skill_id="SKL-103", name="PostgreSQL Schema & Query Optimization", category="data", is_synthetic=True),
            Skill(skill_id="SKL-104", name="AWS Cloud & Terraform", category="cloud", is_synthetic=True),
            Skill(skill_id="SKL-105", name="Payment Gateway & PCI-DSS Integration", category="backend", is_synthetic=True),
            Skill(skill_id="SKL-106", name="Distributed Search & Elasticsearch", category="data", is_synthetic=True),
            Skill(skill_id="SKL-107", name="Quality Assurance & End-to-End Testing", category="qa", is_synthetic=True),
        ]
        db.add_all(skills)

        # 3. Employees
        employees = [
            Employee(employee_id="EMP-001", org_id="ORG-001", name="Arjun Mehta", role="Lead Backend Engineer", email="arjun.mehta@shopnova.internal", hourly_cost=75.0, weekly_capacity_hours=40.0, is_synthetic=True),
            Employee(employee_id="EMP-002", org_id="ORG-001", name="Priya Sharma", role="Senior Frontend Engineer", email="priya.sharma@shopnova.internal", hourly_cost=70.0, weekly_capacity_hours=40.0, is_synthetic=True),
            Employee(employee_id="EMP-003", org_id="ORG-001", name="Rohan Das", role="Fullstack Developer", email="rohan.das@shopnova.internal", hourly_cost=55.0, weekly_capacity_hours=40.0, is_synthetic=True),
            Employee(employee_id="EMP-004", org_id="ORG-001", name="Sneha Patel", role="DevOps & Cloud Architect", email="sneha.patel@shopnova.internal", hourly_cost=80.0, weekly_capacity_hours=40.0, is_synthetic=True),
            Employee(employee_id="EMP-005", org_id="ORG-001", name="David Kim", role="QA Automation Lead", email="david.kim@shopnova.internal", hourly_cost=60.0, weekly_capacity_hours=40.0, is_synthetic=True),
            Employee(employee_id="EMP-006", org_id="ORG-001", name="Sarah Jenkins", role="Engineering Manager", email="sarah.jenkins@shopnova.internal", hourly_cost=95.0, weekly_capacity_hours=40.0, is_synthetic=True),
        ]
        db.add_all(employees)
        db.flush()

        # 4. Employee Skills
        emp_skills = [
            EmployeeSkill(employee_id="EMP-001", skill_id="SKL-101", proficiency_level=5, years_experience=6.5, verified_projects_count=8, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-001", skill_id="SKL-103", proficiency_level=5, years_experience=7.0, verified_projects_count=9, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-001", skill_id="SKL-105", proficiency_level=2, years_experience=1.0, verified_projects_count=1, is_synthetic=True), # Deficit!
            EmployeeSkill(employee_id="EMP-001", skill_id="SKL-106", proficiency_level=4, years_experience=4.0, verified_projects_count=5, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-002", skill_id="SKL-102", proficiency_level=5, years_experience=5.5, verified_projects_count=7, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-003", skill_id="SKL-101", proficiency_level=3, years_experience=2.5, verified_projects_count=3, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-003", skill_id="SKL-102", proficiency_level=3, years_experience=2.0, verified_projects_count=2, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-004", skill_id="SKL-104", proficiency_level=5, years_experience=6.0, verified_projects_count=8, is_synthetic=True),
            EmployeeSkill(employee_id="EMP-005", skill_id="SKL-107", proficiency_level=5, years_experience=5.0, verified_projects_count=6, is_synthetic=True),
        ]
        db.add_all(emp_skills)

        # 5. Employee Assignments
        assignments = [
            EmployeeAssignment(assignment_id="ASN-001", employee_id="EMP-001", project_id="PRJ-090", project_name="Warehouse Inventory ERP V2", assigned_hours_per_week=30.0, start_date=date(2026, 10, 1), end_date=date(2026, 12, 31), is_synthetic=True),
            EmployeeAssignment(assignment_id="ASN-002", employee_id="EMP-002", project_id="PRJ-095", project_name="Marketing Landing Page", assigned_hours_per_week=10.0, start_date=date(2026, 10, 15), end_date=date(2026, 11, 15), is_synthetic=True),
            EmployeeAssignment(assignment_id="ASN-003", employee_id="EMP-004", project_id="PRJ-090", project_name="Cloud Migration Ops", assigned_hours_per_week=20.0, start_date=date(2026, 10, 1), end_date=date(2026, 11, 30), is_synthetic=True),
        ]
        db.add_all(assignments)

        # 6. Infrastructure Resources
        resources = [
            InfrastructureResource(resource_id="RES-401", org_id="ORG-001", name="AWS Production Multi-AZ VPC", category="cloud_environment", status="ready", specifications={"provider": "AWS", "tier": "Enterprise VPC", "regions": ["us-east-1"]}, monthly_cost=1200.0, is_synthetic=True),
            InfrastructureResource(resource_id="RES-402", org_id="ORG-001", name="AWS Staging Cluster", category="cloud_environment", status="ready", specifications={"provider": "AWS", "tier": "t3.medium", "pci_certified": False}, monthly_cost=450.0, is_synthetic=True),
            InfrastructureResource(resource_id="RES-403", org_id="ORG-001", name="Elasticsearch Enterprise License", category="tool_license", status="unconfirmed", specifications={"vendor": "Elastic", "plan": "Platinum", "seats": 5}, monthly_cost=800.0, is_synthetic=True),
            InfrastructureResource(resource_id="RES-404", org_id="ORG-001", name="Stripe Verified Sandbox Org", category="third_party_saas", status="ready", specifications={"plan": "Custom", "webhook_endpoints": 2}, monthly_cost=0.0, is_synthetic=True),
        ]
        db.add_all(resources)

        # 7. Historical Projects
        historical = [
            HistoricalProject(historical_id="HPJ-801", org_id="ORG-001", project_code="QMRT", title="QuickMart Portal", domain="e-commerce", tech_stack=["FastAPI", "Stripe", "PostgreSQL"], planned_effort_hours=360.0, actual_effort_hours=520.0, planned_duration_days=45, actual_duration_days=65, planned_budget=35000.0, actual_cost=48000.0, schedule_variance_pct=44.4, documented_failure_causes="Third-party webhook reconciliation & bank 3D-Secure sandbox instability caused 20-day delivery slip.", post_mortem_notes={"root_cause": "stripe_webhook_untested"}, is_synthetic=True),
            HistoricalProject(historical_id="HPJ-802", org_id="ORG-001", project_code="LOGI", title="LogiTrack Fleet App", domain="logistics", tech_stack=["React", "Node.js", "PostgreSQL"], planned_effort_hours=480.0, actual_effort_hours=495.0, planned_duration_days=60, actual_duration_days=62, planned_budget=45000.0, actual_cost=46200.0, schedule_variance_pct=3.3, documented_failure_causes="Delivered on schedule; minor UI layout bug fixes during acceptance testing.", post_mortem_notes={"root_cause": "none"}, is_synthetic=True),
            HistoricalProject(historical_id="HPJ-803", org_id="ORG-001", project_code="RHUB", title="RetailHub Flash Sale", domain="e-commerce", tech_stack=["FastAPI", "Redis", "Elasticsearch"], planned_effort_hours=240.0, actual_effort_hours=400.0, planned_duration_days=30, actual_duration_days=50, planned_budget=25000.0, actual_cost=38000.0, schedule_variance_pct=66.7, documented_failure_causes="Unspecified peak concurrency requirements led to Black Friday database connection pool exhaustion.", post_mortem_notes={"root_cause": "missing_concurrency_specs"}, is_synthetic=True),
        ]
        db.add_all(historical)

        # 8. Seed Reference Project PRJ-101
        project = Project(
            project_id="PRJ-101",
            org_id="ORG-001",
            title="ShopNova E-Commerce Suite",
            description="Multi-vendor marketplace platform with product search, cart, checkout, Stripe payment integration, order tracking, and seller management.",
            business_objectives="Expand digital retail revenue by 40% with high-throughput order engine.",
            target_architecture="Microservices with PostgreSQL, Redis, FastAPI, and React",
            target_completion_date=date(2026, 12, 15),
            budget_amount=85000.0,
            currency="USD",
            team_size_limit=5,
            status="draft",
            is_synthetic=True
        )
        db.add(project)
        db.flush()

        requirements = [
            ProjectRequirement(requirement_id="REQ-201", project_id="PRJ-101", type="functional", title="Payment Gateway & 3D-Secure 2.0 Integration", description="Support credit card, UPI, and netbanking with 3D-Secure 2.0 via Stripe.", acceptance_criteria="PCI-DSS compliant, <2s checkout latency, webhook idempotency.", complexity_level="critical", required_skill_id="SKL-105", minimum_skill_proficiency=4, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-202", project_id="PRJ-101", type="functional", title="Multi-Facet Product Catalog & Fuzzy Search", description="Elasticsearch-powered product indexing with category facets and price filters.", acceptance_criteria="Search response <150ms for 100k SKUs.", complexity_level="high", required_skill_id="SKL-106", minimum_skill_proficiency=4, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-203", project_id="PRJ-101", type="functional", title="Persistent Shopping Cart & Coupon Engine", description="Redis-backed session cart with discount rule validation.", acceptance_criteria="Persistent across devices with coupon rate limits.", complexity_level="high", required_skill_id="SKL-101", minimum_skill_proficiency=3, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-204", project_id="PRJ-101", type="functional", title="Order Processing State Machine & Dispatch", description="Distributed order workflow with state validation and seller dispatch notifications.", acceptance_criteria="ACID transaction guarantees and dead-letter queue recovery.", complexity_level="critical", required_skill_id="SKL-101", minimum_skill_proficiency=4, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-205", project_id="PRJ-101", type="functional", title="Responsive Customer Checkout & Account UI", description="Modern React checkout experience with address selector and payment widget.", acceptance_criteria="Mobile-first, WCAG AA accessibility, Lighthouse performance >90.", complexity_level="medium", required_skill_id="SKL-102", minimum_skill_proficiency=3, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-206", project_id="PRJ-101", type="non_functional", title="Concurrency & Peak Traffic Scaling", description="High-traffic scaling support during flash sales and marketing events.", acceptance_criteria="Auto-scaling on ECS Fargate without dropping orders.", complexity_level="high", required_skill_id="SKL-104", minimum_skill_proficiency=4, is_ambiguous=True, is_synthetic=True), # Missing peak RPS
            ProjectRequirement(requirement_id="REQ-207", project_id="PRJ-101", type="compliance", title="PCI-DSS Level 1 Customer Card Protection", description="End-to-end tokenization and card vaulting adhering to PCI-DSS standards.", acceptance_criteria="No raw PAN stored in application logs or databases.", complexity_level="critical", required_skill_id="SKL-105", minimum_skill_proficiency=4, is_synthetic=True),
            ProjectRequirement(requirement_id="REQ-208", project_id="PRJ-101", type="compliance", title="Automated Daily Backup & Recovery (RPO < 1h)", description="RDS automated snapshots and multi-region S3 replication.", acceptance_criteria="Recovery drill verified with RPO < 1h and RTO < 4h.", complexity_level="medium", required_skill_id="SKL-104", minimum_skill_proficiency=3, is_synthetic=True),
        ]
        db.add_all(requirements)

        clarification = RequirementClarification(
            clarification_id="CLR-301",
            project_id="PRJ-101",
            requirement_id="REQ-206",
            question="What is the anticipated peak orders/sec (RPS) and concurrent user count during flash sales?",
            impact_description="Determines database connection pool sizing, Redis cluster topology, and autoscaling thresholds.",
            severity="high",
            is_synthetic=True
        )
        db.add(clarification)

        db.commit()
        print("Successfully seeded ShopNova synthetic demo records!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
