from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db import engine, Base, SessionLocal
from backend.routers.projects import router as projects_router
from backend.routers.team import router as team_router, seed_developers_if_empty
from backend.routers.delivery import router as delivery_router
from backend.routers.auth import router as auth_router
from backend.learning import seed_past_projects_if_empty

# Create all database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure seed data exists
    db = SessionLocal()
    try:
        seed_developers_if_empty(db)
        seed_past_projects_if_empty(db)
    except Exception as e:
        print(f"Startup seed notice: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="DevMatrix AI — Software Project Feasibility, Team Allocation & Delivery Management",
    lifespan=lifespan
)

# CORS Middleware for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for structured JSON errors
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join([f"{e.get('loc', [''])[-1]}: {e.get('msg', 'validation error')}" for e in errors])
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "message": f"Input validation failed: {msg}"}
    )

# Health endpoint
@app.get("/health")
def healthcheck():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

# Mount routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(team_router)
app.include_router(delivery_router)

# Also mount legacy router under API_V1_PREFIX for backward compatibility if needed
try:
    from backend.app.api.v1.router import api_router as legacy_v1_router
    app.include_router(legacy_v1_router, prefix="/api/v1")
except Exception as legacy_err:
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
