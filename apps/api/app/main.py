from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import Base, engine
from .routers import monitors, status, demo
from .services.scheduler import start_scheduler

app = FastAPI(title="Uptime API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.WEB_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-create tables (simple dev bootstrap; swap to Alembic later)
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(monitors.router)
app.include_router(status.router)
app.include_router(demo.router)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.on_event("startup")
async def _startup():
    start_scheduler()
