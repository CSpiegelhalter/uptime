# syntax=docker/dockerfile:1.7

FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

# System deps (keep minimal; libffi for bcrypt, ca-certificates for HTTPS)
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libffi-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir "poetry==1.8.3"

# Copy only dependency files first for better layer caching
COPY pyproject.toml poetry.lock* ./

# Install runtime deps only (no dev), and don't try to install the project package itself
RUN poetry install --no-root --only main

# Now copy the rest of the app
# Make sure these paths exist in your repo
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

# Default port (Render sets $PORT at runtime)
ENV PORT=8000

# Healthcheck is optional; Render has its own health check path config
# HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
#   CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

# Run DB migrations then start API
CMD ["sh", "-lc", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
