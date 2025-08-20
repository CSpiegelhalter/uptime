# /app/alembic/env.py
from __future__ import annotations
from logging.config import fileConfig
import os
from alembic import context
from sqlalchemy import engine_from_config, pool

# 1) load logging config
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 2) load your models' metadata
from app.db import Base  # where you declare Base = declarative_base()
from app import models   # import models so tables are registered

target_metadata = Base.metadata

# 3) get DATABASE_URL from env and inject into alembic config
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL not set")
config.set_main_option("sqlalchemy.url", database_url)

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )
    with connectable.connect() as connection:
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
