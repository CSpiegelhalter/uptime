# alembic/env.py
from __future__ import annotations
from logging.config import fileConfig
import os
from urllib.parse import urlsplit, urlunsplit

from alembic import context
from sqlalchemy import create_engine, pool

# ----- Logging config
config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

# ----- Read & normalize DB URL (force psycopg v3 driver)
def normalize(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url

db_url = normalize(os.getenv("DATABASE_URL", ""))  # read env directly
if not db_url:
    raise RuntimeError("DATABASE_URL not set")

# Alembic’s stdout helper (shows up reliably)
def mask(u: str) -> str:
    try:
        s = urlsplit(u)
        if "@" in s.netloc:
            creds, host = s.netloc.split("@", 1)
            if ":" in creds:
                user, _ = creds.split(":", 1)
                netloc = f"{user}:***@{host}"
            else:
                netloc = f"{creds}@{host}"
        else:
            netloc = s.netloc
        return urlunsplit((s.scheme, netloc, s.path, s.query, s.fragment))
    except Exception:
        return u

context.config.print_stdout(f"ALEMBIC sqlalchemy.url -> {mask(db_url)}")

# Ensure alembic.ini gets a URL, though we won’t use engine_from_config
config.set_main_option("sqlalchemy.url", db_url)

# ----- Target metadata (import AFTER url work to avoid side effects)
from app.models import Base  # noqa: E402
target_metadata = Base.metadata

# ----- Offline / Online
def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    engine = create_engine(db_url, poolclass=pool.NullPool, future=True)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
