import asyncio, time
import httpx
from typing import Dict, Set, Tuple
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..db import SessionLocal
from ..models import Monitor, Check, Incident
from ..utils import normalize_url

scheduler: AsyncIOScheduler | None = None
# Map (url, interval) -> job_id
job_ids: Dict[Tuple[str, int], str] = {}

def job_key(url: str, interval: int) -> Tuple[str, int]:
    return (normalize_url(url), int(interval))

async def ping_group(url: str, interval_sec: int):
    # one HTTP request
    started = datetime.now(timezone.utc)
    status_code = None
    latency_ms = None

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            r = await client.get(url)
            status_code = r.status_code
            latency_ms = int(r.elapsed.total_seconds() * 1000)
    except Exception:
        status_code = None
        latency_ms = None

    # fan-out to all monitors for this (url, interval)
    db: Session = SessionLocal()
    try:
        monitors = db.execute(
            select(Monitor).where(Monitor.url == url, Monitor.interval_sec == interval_sec)
        ).scalars().all()

        for m in monitors:
            ok = (status_code is not None and status_code == m.expected_status)
            check = Check(
                monitor_id=m.id,
                status_code=status_code or 0,
                ok=ok,
                latency_ms=latency_ms or 0,
                ts=started,
            )
            db.add(check)
        db.commit()
    finally:
        db.close()

def schedule_monitor(m: Monitor, immediate: bool = False):
    global scheduler
    if not scheduler:
        return
    url = normalize_url(m.url)
    key = job_key(url, m.interval_sec)
    job_id = job_ids.get(key)

    # create the shared interval job if needed
    if not job_id:
        job_id = f"group:{hash(key)}"
        scheduler.add_job(
            ping_group,
            "interval",
            seconds=int(m.interval_sec),
            id=job_id,
            args=[url, int(m.interval_sec)],
            replace_existing=True,
        )
        job_ids[key] = job_id

    # first run now (one-shot) – safe because it just fans out
    if immediate:
        scheduler.add_job(
            ping_group,
            "date",
            run_date=datetime.now(timezone.utc),
            args=[url, int(m.interval_sec)],
            misfire_grace_time=30,
        )

def unschedule_monitor(m: Monitor):
    """
    Remove the shared job ONLY if no monitors remain for this (url, interval).
    """
    global scheduler
    if not scheduler:
        return
    url = normalize_url(m.url)
    key = job_key(url, m.interval_sec)
    job_id = job_ids.get(key)
    if not job_id:
        return

    # check if other monitors still use this (url, interval)
    db: Session = SessionLocal()
    try:
        remaining = db.execute(
            select(Monitor.id).where(Monitor.url == url, Monitor.interval_sec == m.interval_sec)
        ).all()
    finally:
        db.close()

    # exactly one (this one) means after delete there will be none -> remove job
    if len(remaining) <= 1:
        try:
            j = scheduler.get_job(job_id)
            if j:
                j.remove()
        except Exception:
            pass
        job_ids.pop(key, None)

async def load_all_monitors_and_schedule():
    db = SessionLocal()
    try:
        for mon in db.query(Monitor).all():
            schedule_monitor(mon)
    finally:
        db.close()

def start_scheduler():
    global scheduler
    scheduler = AsyncIOScheduler()
    scheduler.start()
    # kick off initial schedule (fire and forget)
    asyncio.get_event_loop().create_task(load_all_monitors_and_schedule())

