import pytest
from backend.app.services.risk_engine.engine import (
    DeterministicRiskEngine,
    RequirementData,
    EmployeeData,
    EmployeeAssignmentData,
    InfrastructureData,
    HistoricalProjectData
)

def test_deterministic_risk_engine_shopnova_scenario():
    requirements = [
        RequirementData(requirement_id="REQ-201", title="Payment Gateway & 3D-Secure 2.0 Integration", type="functional", complexity_level="critical", required_skill_id="SKL-105", minimum_skill_proficiency=4),
        RequirementData(requirement_id="REQ-202", title="Multi-Facet Product Catalog & Fuzzy Search", type="functional", complexity_level="high", required_skill_id="SKL-106", minimum_skill_proficiency=4),
        RequirementData(requirement_id="REQ-203", title="Persistent Shopping Cart & Coupon Engine", type="functional", complexity_level="high", required_skill_id="SKL-101", minimum_skill_proficiency=3),
        RequirementData(requirement_id="REQ-204", title="Order Processing State Machine & Dispatch", type="functional", complexity_level="critical", required_skill_id="SKL-101", minimum_skill_proficiency=4),
        RequirementData(requirement_id="REQ-205", title="Responsive Customer Checkout & Account UI", type="functional", complexity_level="medium", required_skill_id="SKL-102", minimum_skill_proficiency=3),
        RequirementData(requirement_id="REQ-206", title="Concurrency & Peak Traffic Scaling", type="non_functional", complexity_level="high", required_skill_id="SKL-104", minimum_skill_proficiency=4, is_ambiguous=True),
        RequirementData(requirement_id="REQ-207", title="PCI-DSS Level 1 Customer Card Protection", type="compliance", complexity_level="critical", required_skill_id="SKL-105", minimum_skill_proficiency=4),
        RequirementData(requirement_id="REQ-208", title="Automated Daily Backup & Recovery (RPO < 1h)", type="compliance", complexity_level="medium", required_skill_id="SKL-104", minimum_skill_proficiency=3),
    ]

    employees = [
        EmployeeData(
            employee_id="EMP-001",
            name="Arjun Mehta",
            role="Lead Backend Engineer",
            hourly_cost=75.0,
            weekly_capacity_hours=40.0,
            skills={"SKL-101": 5, "SKL-103": 5, "SKL-105": 2, "SKL-106": 4}, # Deficit on SKL-105!
            assignments=[
                EmployeeAssignmentData(project_id="PRJ-090", assigned_hours_per_week=30.0) # 10h remaining
            ]
        ),
        EmployeeData(
            employee_id="EMP-002",
            name="Priya Sharma",
            role="Senior Frontend Engineer",
            hourly_cost=70.0,
            weekly_capacity_hours=40.0,
            skills={"SKL-102": 5},
            assignments=[
                EmployeeAssignmentData(project_id="PRJ-095", assigned_hours_per_week=10.0) # 30h remaining
            ]
        ),
        EmployeeData(
            employee_id="EMP-003",
            name="Rohan Das",
            role="Fullstack Developer",
            hourly_cost=55.0,
            weekly_capacity_hours=40.0,
            skills={"SKL-101": 3, "SKL-102": 3},
            assignments=[]
        ),
        EmployeeData(
            employee_id="EMP-004",
            name="Sneha Patel",
            role="DevOps & Cloud Architect",
            hourly_cost=80.0,
            weekly_capacity_hours=40.0,
            skills={"SKL-104": 5},
            assignments=[
                EmployeeAssignmentData(project_id="PRJ-090", assigned_hours_per_week=20.0) # 20h remaining
            ]
        ),
        EmployeeData(
            employee_id="EMP-005",
            name="David Kim",
            role="QA Automation Lead",
            hourly_cost=60.0,
            weekly_capacity_hours=40.0,
            skills={"SKL-107": 5},
            assignments=[]
        ),
        EmployeeData(
            employee_id="EMP-006",
            name="Sarah Jenkins",
            role="Engineering Manager",
            hourly_cost=95.0,
            weekly_capacity_hours=40.0,
            skills={},
            assignments=[]
        ),
    ]

    infrastructure = [
        InfrastructureData(resource_id="RES-401", name="AWS Production Multi-AZ VPC", category="cloud_environment", status="ready", specifications={}),
        InfrastructureData(resource_id="RES-402", name="AWS Staging Cluster", category="cloud_environment", status="ready", specifications={"pci_certified": False}),
        InfrastructureData(resource_id="RES-403", name="Elasticsearch Enterprise License", category="tool_license", status="unconfirmed", specifications={}),
        InfrastructureData(resource_id="RES-404", name="Stripe Verified Sandbox Org", category="third_party_saas", status="ready", specifications={})
    ]

    historical = [
        HistoricalProjectData(
            historical_id="HPJ-801",
            project_code="QMRT",
            title="QuickMart Portal",
            domain="e-commerce",
            tech_stack=["FastAPI", "Stripe", "PostgreSQL"],
            schedule_variance_pct=44.4,
            documented_failure_causes="Third-party webhook reconciliation failures"
        )
    ]

    engine = DeterministicRiskEngine()
    result = engine.evaluate(
        project_id="PRJ-101",
        title="ShopNova E-Commerce Suite",
        budget_amount=85000.0,
        target_days=60,
        target_architecture="Microservices with PostgreSQL, Redis, FastAPI, and React",
        requirements=requirements,
        employees=employees,
        infrastructure=infrastructure,
        historical_projects=historical
    )

    # 1. Check deterministic composite score
    assert result.overall_score == 59.58 or round(result.overall_score, 1) == 59.6
    assert result.overall_status == "feasible_with_conditions"
    assert result.recommended_action == "proceed_with_conditions"

    # 2. Check that key evidence citations exist
    risk_titles = [r.title for r in result.risks]
    assert any("Backend Lead Bandwidth Deficit" in t for t in risk_titles)
    assert any("Expertise Gap" in t for t in risk_titles)
    assert any("PCI-DSS" in t for t in risk_titles)
    assert any("Unconfirmed License" in t for t in risk_titles)
    assert any("Historical Schedule Slip" in t for t in risk_titles)

    # 3. Check specific evidence record citation
    capacity_risk = next(r for r in result.risks if r.dimension == "capacity")
    assert capacity_risk.evidence_provenance.record_id == "EMP-001"
    assert capacity_risk.evidence_provenance.observed_value == 10.0
