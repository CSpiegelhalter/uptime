from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Accept postgres:// or postgresql:// and coerce to postgresql+psycopg://
    DATABASE_URL: str = Field(..., description="SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@host:5432/db")
    WEB_ORIGIN: str = "http://localhost:3000"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_psycopg_driver(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgresql://"):
                return "postgresql+psycopg://" + v[len("postgresql://"):]
            if v.startswith("postgres://"):
                return "postgresql+psycopg://" + v[len("postgres://"):]
        return v

settings = Settings()  # reads from env
