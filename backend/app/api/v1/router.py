from fastapi import APIRouter
from backend.app.api.v1.endpoints_projects import router as projects_router
from backend.app.api.v1.endpoints_analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(analysis_router, prefix="/projects", tags=["analysis"])
