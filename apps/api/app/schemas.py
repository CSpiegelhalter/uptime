from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List

class MonitorCreate(BaseModel):
    name: str
    url: HttpUrl
    interval_sec: int = Field(ge=10, le=3600, default=60)
    expected_status: int = 200

class MonitorRead(BaseModel):
    id: str
    slug: str
    name: str
    url: str
    interval_sec: int
    expected_status: int
    class Config: from_attributes = True

class CheckRead(BaseModel):
    status_code: int
    ok: bool
    latency_ms: int
    ts: str

class Summary(BaseModel):
    range: str
    samples: int
    uptime_pct: float
    avg_latency_ms: float | None
    last_ok: bool | None

class StatusPage(BaseModel):
    slug: str
    monitors: list[dict]
