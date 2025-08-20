# apps/api/app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.engine.url import make_url, URL

from .config import settings


def _normalize_url(url_str: str) -> URL:
    """
    Ensure the psycopg v3 driver is used for Postgres.
    Return a SQLAlchemy URL object (not a string) so the password isn't masked.
    """
    url = make_url(url_str)
    if url.drivername in ("postgresql", "postgres"):
        url = url.set(drivername="postgresql+psycopg")
    # If you want to log it, never print the real password:
    # print("DB URL ->", url.render_as_string(hide_password=True))
    return url


engine = create_engine(_normalize_url(settings.DATABASE_URL), pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
