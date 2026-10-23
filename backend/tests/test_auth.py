from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_demo_login_flow():
    res = client.post("/auth/demo-login", json={
        "email": "test.delivery.manager@devmatrix.ai",
        "name": "Sarah Connor",
        "role": "Delivery Manager"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test.delivery.manager@devmatrix.ai"
    assert data["user"]["role"] == "Delivery Manager"

    token = data["access_token"]
    # Test /auth/me
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["name"] == "Sarah Connor"

def test_auth_me_unauthorized():
    res = client.get("/auth/me")
    assert res.status_code == 401
