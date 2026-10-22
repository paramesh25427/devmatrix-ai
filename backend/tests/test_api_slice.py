import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.scripts.seed_demo_data import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_project_intake_creation():
    payload = {
        "org_id": "ORG-001",
        "title": "ShopNova Multi-Vendor Marketplace",
        "description": "High throughput digital retail engine with real-time checkout and cart.",
        "business_objectives": "Grow online GMV by 35% across Q4.",
        "target_architecture": "Microservices with PostgreSQL, Redis, FastAPI, and React",
        "target_completion_date": "2026-12-20",
        "budget_amount": 85000.0,
        "currency": "USD",
        "team_size_limit": 5
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["org_id"] == "ORG-001"
    assert data["data"]["status"] == "draft"
    assert data["data"]["project_id"].startswith("PRJ-")

def test_feasibility_analysis_slice():
    response = client.post("/api/v1/projects/PRJ-101/analyze")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    report = data["data"]
    assert report["project_id"] == "PRJ-101"
    assert report["overall_status"] == "feasible_with_conditions"
    assert report["overall_score"] == 59.58 or round(report["overall_score"], 1) == 59.6
    assert len(report["risks"]) >= 4

    # Check evidence citations
    citations = [r["evidence_provenance"]["record_id"] for r in report["risks"]]
    assert "EMP-001" in citations

def test_rerun_feasibility_analysis_idempotency_no_collision():
    # Calling analyze again on the same project PRJ-101 must succeed without UNIQUE constraint collision
    response = client.post("/api/v1/projects/PRJ-101/analyze")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    report = data["data"]
    assert report["project_id"] == "PRJ-101"
    assert len(report["risks"]) >= 4
    for risk in report["risks"]:
        assert risk["risk_id"].startswith(f"{report['run_id']}-")
        assert risk.get("risk_rule_id") is not None
