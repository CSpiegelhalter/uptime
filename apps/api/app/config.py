from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., description="SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@host:5432/db")
    WEB_ORIGIN: str = "http://localhost:3000"

settings = Settings()  # reads from env
