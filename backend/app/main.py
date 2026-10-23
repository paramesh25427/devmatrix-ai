from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.core.exceptions import http_exception_handler, validation_exception_handler
from backend.app.api.v1.router import api_router
from backend.scripts.seed_demo_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="DevMatrix AI — Organization-Aware Feasibility & Risk Analysis Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

try:
    from backend.routers.projects import router as canonical_projects_router
    from backend.routers.team import router as canonical_team_router
    from backend.routers.delivery import router as canonical_delivery_router
    app.include_router(canonical_projects_router)
    app.include_router(canonical_team_router)
    app.include_router(canonical_delivery_router)
except Exception as e:
    print(f"Notice: canonical routers could not be imported in backend.app.main: {e}")

@app.get("/health")
def healthcheck():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "1.0.0"}

@app.on_event("startup")
def startup_event():
    # Ensure seed data exists
    try:
        from backend.app.core.database import SessionLocal
        from backend.app.models.organization import Organization
        db = SessionLocal()
        org = db.query(Organization).filter_by(org_id="ORG-001").first()
        db.close()
        if not org:
            seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
