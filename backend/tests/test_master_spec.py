import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.rules_engine import calculate_feasibility
from backend.schemas import (
    RequirementItem, RiskItem, ComplexityLevel, RequirementType, RiskSeverity, FeasibilityVerdict
)
from backend.team_optimizer import optimize_team
from backend.alerts import evaluate_task_alerts
from backend.models import Task

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "DevMatrix AI" in data["app"]

def test_deterministic_rules_engine_points_and_effort():
    # 2 low (1 pt each = 2), 1 med (3 pt), 1 high (5 pt) = 10 total points
    # 1 integration = 1.5 person-weeks
    # Person weeks = 10 * 0.5 + 1.5 = 6.5 person weeks
    # Calendar weeks = 6.5 / 2.4 = 2.7083
    # min_weeks = ceil(2.7083 * 1.15) = ceil(3.114) = 4 weeks
    # max_weeks = ceil(2.7083 * 1.50) = ceil(4.062) = 5 weeks
    reqs = [
        RequirementItem(id=1, text="Auth", complexity=ComplexityLevel.LOW, integration=False),
        RequirementItem(id=2, text="Docs", complexity=ComplexityLevel.LOW, integration=False),
        RequirementItem(id=3, text="Profile", complexity=ComplexityLevel.MEDIUM, integration=False),
        RequirementItem(id=4, text="Checkout", complexity=ComplexityLevel.HIGH, integration=True),
    ]
    calc = calculate_feasibility(
        requirements=reqs,
        risks=[],
        deadline_weeks=6,
        budget_max=500000.0
    )
    assert calc.total_points == 10
    assert calc.integrations == 1
    assert calc.person_weeks == 6.5
    assert calc.min_weeks == 4
    assert calc.max_weeks == 5
    assert calc.min_cost == round(6.5 * 1.15 * 25000.0, 2)
    assert calc.max_cost == round(6.5 * 1.50 * 25000.0, 2)
    assert calc.verdict == FeasibilityVerdict.FEASIBLE.value

def test_feasibility_verdict_boundaries_and_downgrades():
    reqs = [
        RequirementItem(id=1, text="Task", complexity=ComplexityLevel.HIGH, integration=False),
        RequirementItem(id=2, text="Task", complexity=ComplexityLevel.HIGH, integration=False),
        RequirementItem(id=3, text="Task", complexity=ComplexityLevel.HIGH, integration=False),
        RequirementItem(id=4, text="Task", complexity=ComplexityLevel.HIGH, integration=False),
    ]
    # Total points = 20. Person-weeks = 10. Calendar = 10 / 2.4 = 4.167
    # min_weeks = ceil(4.167 * 1.15) = 5. max_weeks = ceil(4.167 * 1.50) = 7.
    # min_cost = 10 * 1.15 * 25000 = 287,500.

    # 1. Feasible when max_weeks <= deadline (e.g. deadline = 8)
    res_feasible = calculate_feasibility(reqs, [], deadline_weeks=8, budget_max=500000.0)
    assert res_feasible.verdict == FeasibilityVerdict.FEASIBLE.value

    # 2. Conditional when min_weeks <= deadline < max_weeks (e.g. deadline = 6)
    res_cond = calculate_feasibility(reqs, [], deadline_weeks=6, budget_max=500000.0)
    assert res_cond.verdict == FeasibilityVerdict.CONDITIONAL.value

    # 3. Not feasible when deadline < min_weeks (e.g. deadline = 4)
    res_not = calculate_feasibility(reqs, [], deadline_weeks=4, budget_max=500000.0)
    assert res_not.verdict == FeasibilityVerdict.NOT_FEASIBLE.value

    # 4. Budget downgrade: feasible -> conditional when min_cost > budget_max
    res_bgt = calculate_feasibility(reqs, [], deadline_weeks=8, budget_max=200000.0)
    assert res_bgt.budget_downgrade is True
    assert res_bgt.verdict == FeasibilityVerdict.CONDITIONAL.value

    # 5. Risk downgrade: feasible -> conditional when >= 3 high-severity risks
    risks = [
        RiskItem(title="R1", severity=RiskSeverity.HIGH, mitigation="M1"),
        RiskItem(title="R2", severity=RiskSeverity.HIGH, mitigation="M2"),
        RiskItem(title="R3", severity=RiskSeverity.HIGH, mitigation="M3"),
    ]
    res_risk = calculate_feasibility(reqs, risks, deadline_weeks=8, budget_max=500000.0)
    assert res_risk.risk_downgrade is True
    assert res_risk.verdict == FeasibilityVerdict.CONDITIONAL.value

def test_full_project_intake_and_lifecycle():
    # 1. Project Intake with pasted text >= 200 chars
    citycare_text = (
        "Build a web and mobile application for CityCare Hospitals doctor appointment booking. "
        "The application must handle patient registration with phone and email, doctor search by speciality "
        "and location, real-time doctor calendar slot availability, appointment booking and cancellation, "
        "online consultation payments via UPI and cards, email and SMS receipts, doctor schedule management, "
        "and hospital administrative analytics for 2,000 daily bookings."
    )
    assert len(citycare_text) >= 200

    create_res = client.post(
        "/projects",
        data={
            "title": "CityCare Appointment Suite",
            "client": "CityCare Hospitals",
            "deadline_weeks": 14,
            "budget_min": 600000.0,
            "budget_max": 1200000.0,
            "tech_stack": "FastAPI, React, TypeScript, PostgreSQL",
            "pasted_text": citycare_text
        }
    )
    assert create_res.status_code == 201
    prj_data = create_res.json()
    project_id = prj_data["id"]
    assert prj_data["status"] == "submitted"

    # 2. Analyze project
    anl_res = client.post(f"/projects/{project_id}/analyze")
    assert anl_res.status_code == 200
    analysis = anl_res.json()
    assert len(analysis["requirements"]) > 0
    assert analysis["calculation"]["total_points"] > 0
    assert analysis["calculation"]["verdict"] in ["feasible", "conditional", "not_feasible"]

    # 3. Edit requirement complexity and verify recalculation
    reqs = analysis["requirements"]
    reqs[0]["complexity"] = "high"
    reqs[0]["integration"] = True
    put_res = client.put(
        f"/projects/{project_id}/analysis",
        json={"requirements": reqs}
    )
    assert put_res.status_code == 200
    updated_analysis = put_res.json()
    assert updated_analysis["calculation"]["total_points"] >= analysis["calculation"]["total_points"]

    # 4. Approve Baseline (locks analysis)
    appr_res = client.post(
        f"/projects/{project_id}/approve",
        json={"approver_name": "Delivery Manager Vikram", "notes": "Approved for team allocation"}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["is_baseline"] is True

    # Check project status is approved
    get_prj = client.get(f"/projects/{project_id}")
    assert get_prj.json()["status"] == "approved"
    assert get_prj.json()["approved_by"] == "Delivery Manager Vikram"

    # Attempting to edit after approval must return 409 bad_status
    bad_edit = client.put(f"/projects/{project_id}/analysis", json={"requirements": reqs})
    assert bad_edit.status_code == 409

    # 5. Team Recommendation
    team_res = client.post(f"/projects/{project_id}/team")
    assert team_res.status_code == 200
    team_data = team_res.json()
    assert len(team_data["best_team"]) >= 3
    assert len(team_data["alternative"]["team"]) >= 3
    assert team_data["coverage_pct"] > 0
    assert len(team_data["capacity_violations"]) == 0

    # 6. Confirm Team Selection
    conf_res = client.post(f"/projects/{project_id}/team/confirm", json={"which": "best"})
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "success"

    # Status must now be team_assigned
    get_prj2 = client.get(f"/projects/{project_id}")
    assert get_prj2.json()["status"] == "team_assigned"

    # 7. Check generated tasks
    tasks_res = client.get(f"/projects/{project_id}/tasks")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0
    first_task = tasks[0]

    # 8. Log hours to trigger effort overrun alert
    # Estimated is e.g. 80. Log 120 (1.5x)
    patch_res = client.patch(
        f"/tasks/{first_task['id']}",
        json={"logged_hours": first_task["estimated_hours"] * 1.3}
    )
    assert patch_res.status_code == 200

    # Verify effort overrun alert fired
    alerts_res = client.get(f"/projects/{project_id}/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert any(a["rule"] == "effort_overrun" for a in alerts)

    # 9. Advance simulated time by 30 days to trigger overdue alert
    sim_res = client.post(f"/projects/{project_id}/simulate", json={"advance_days": 35})
    assert sim_res.status_code == 200
    assert sim_res.json()["total_sim_offset_days"] == 35

    alerts_res2 = client.get(f"/projects/{project_id}/alerts")
    alerts2 = alerts_res2.json()
    assert any(a["rule"] == "overdue" for a in alerts2)

    # 10. Complete project and verify historical learning
    comp_res = client.post(
        f"/projects/{project_id}/complete",
        json={"actual_weeks": 15, "actual_cost": 750000.0}
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["new_status"] == "completed"

    # Completed project is read-only
    bad_task_edit = client.patch(f"/tasks/{first_task['id']}", json={"logged_hours": 200.0})
    assert bad_task_edit.status_code == 409

    # Verify history endpoint contains updated record
    hist_res = client.get("/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["project_count"] >= 5
    assert any(project_id in p["id"] for p in hist["projects"])
