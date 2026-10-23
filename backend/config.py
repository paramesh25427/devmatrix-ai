import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DevMatrix AI"
    API_V1_PREFIX: str = ""
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./devmatrix.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    DEFAULT_WEEKLY_RATE: float = 25000.0
    ASSUMED_TEAM_SIZE: float = 2.4
    COMPLEXITY_LOW_PTS: int = 1
    COMPLEXITY_MED_PTS: int = 3
    COMPLEXITY_HIGH_PTS: int = 5
    EFFORT_PER_POINT: float = 0.5
    INTEGRATION_EFFORT: float = 1.5
    BUFFER_MIN: float = 1.15
    BUFFER_MAX: float = 1.50

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
