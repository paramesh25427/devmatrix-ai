import os
# pyrefly: ignore[missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DevMatrix AI"
    API_V1_PREFIX: str = "/api/v1"

    # Database: Use DATABASE_URL if provided, else fallback to SQLite for local development
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./devmatrix.db")

    # Environment mode
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
