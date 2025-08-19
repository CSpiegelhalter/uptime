import asyncio, time
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..db import SessionLocal
from ..models import Monitor, Check, Incident

scheduler: AsyncIOScheduler | None = None

async def ping_once(monitor_id: str):
    db: Session = SessionLocal()
    try:
        mon = db.get(Monitor, monitor_id)
        if not mon: return
        started = time.perf_counter()
        ok = False; status = 0
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                r = await client.get(mon.url)
                status = r.status_code
                ok = (status == mon.expected_status) or (200 <= status < 400)
        except Exception:
            ok = False
            status = 0

        latency_ms = int((time.perf_counter() - started) * 1000)
        db.add(Check(monitor_id=mon.id, status_code=status, ok=ok, latency_ms=latency_ms))

        # Incident logic: open if down, resolve if up
        open_inc = db.execute(
            select(Incident).where(Incident.monitor_id==mon.id, Incident.resolved_at.is_(None))
        ).scalars().first()
        if not ok and not open_inc:
            db.add(Incident(monitor_id=mon.id, reason="Down", last_status_code=status))
        elif ok and open_inc:
            open_inc.resolved_at = db.execute(select(Check.ts).where(Check.monitor_id==mon.id).order_by(desc(Check.ts))).scalar()  # or now()
        db.commit()
    finally:
        db.close()

def schedule_monitor(mon: Monitor, immediate: bool = False):
    global scheduler
    if not scheduler:
        return

    job_id = f"monitor:{mon.id}"
    try:
        j = scheduler.get_job(job_id)
        if j:
            j.remove()
    except Exception:
        pass

    # periodic job
    scheduler.add_job(
        ping_once,
        "interval",
        seconds=mon.interval_sec,
        id=job_id,
        args=[mon.id],
        replace_existing=True,
    )

    # ✅ first ping right away as a one-shot "date" job (runs inside scheduler loop)
    if immediate:
        scheduler.add_job(
            ping_once,
            "date",
            run_date=datetime.now(timezone.utc),
            args=[mon.id],
            misfire_grace_time=30,
        )


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

def unschedule_monitor(monitor_id: str):
    global scheduler
    if not scheduler:
        return
    job_id = f"monitor:{monitor_id}"
    try:
        j = scheduler.get_job(job_id)
        if j:
            j.remove()
    except Exception:
        pass