from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from ..db import get_db, Base, engine
from ..models import Monitor, Check, User
from ..schemas import MonitorCreate, MonitorRead, Summary
from ..utils import ulid, slugify, unique_slug
from ..services.scheduler import schedule_monitor, unschedule_monitor
from ..deps import get_current_user


router = APIRouter(prefix="/v1/monitors", tags=["monitors"])

@router.post("", response_model=MonitorRead, status_code=201)
def create_monitor(payload: MonitorCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    base_slug = slugify(payload.name or "Untitled")
    slug = unique_slug(db, base_slug)

    # Try insert, if a race still wins, retry with incremented suffix a few times
    for attempt in range(5):
        try:
            norm = normalize_url(str(payload.url))
            m = Monitor(
                id=ulid(),
                slug=slug,
                name=payload.name or "Untitled",
                url=norm,                                # store normalized
                interval_sec=payload.interval_sec,
                expected_status=payload.expected_status,
                user_id=user.id,
            )

            db.add(m)
            db.commit()
            db.refresh(m)

            schedule_monitor(m, immediate=True)
            return m

        except IntegrityError as e:
            db.rollback()
            # If slug collided, pick another suffix and retry
            if "ix_monitors_slug" in str(e.orig) or "UniqueViolation" in str(e.orig) or "slug" in str(e.orig):
                # bump to next numeric suffix deterministically
                # compute from existing rows again (cheap) to avoid guessing
                slug = unique_slug(db, base_slug)
                continue
            # some other integrity error
            raise

    # If we somehow failed to get a unique slug after retries:
    raise HTTPException(status_code=409, detail="A monitor with a similar name already exists. Please try a different name.")

@router.get("", response_model=list[MonitorRead])
def list_monitors(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Monitor).filter(Monitor.user_id == user.id).order_by(Monitor.created_at.desc()).all()

@router.get("/{monitor_id}", response_model=MonitorRead)
def get_monitor(monitor_id: str, db: Session = Depends(get_db)):
    m = db.get(Monitor, monitor_id)
    if not m: raise HTTPException(404, "Monitor not found")
    return m

@router.delete("/{monitor_id}", status_code=204)
def delete_monitor(monitor_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = db.get(Monitor, monitor_id)
    if not m or m.user_id != user.id:
        raise HTTPException(404, "Monitor not found")
    unschedule_monitor(m.id)
    db.delete(m); db.commit()

@router.get("/{monitor_id}/summary", response_model=Summary)
def monitor_summary(monitor_id: str, range: str = "24h", db: Session = Depends(get_db)):
    m = db.get(Monitor, monitor_id)
    if not m:
        raise HTTPException(404, "Monitor not found")

    # whitelist -> human string we’ll cast to interval
    window_map = {"24h": "24 hours", "7d": "7 days", "30d": "30 days"}
    window_str = window_map.get(range, "24 hours")

    q = db.execute(
        text(
            """
            select count(*) as n,
                   sum(case when ok then 1 else 0 end) as ok_count,
                   avg(latency_ms)::float as avg_latency
            from checks
            where monitor_id = :mid
              and ts >= now() - (:window)::interval
            """
        ),
        {"mid": monitor_id, "window": window_str},
    ).mappings().first()

    n = int(q["n"] or 0)
    okc = int(q["ok_count"] or 0)
    avg_lat = float(q["avg_latency"]) if q["avg_latency"] is not None else None
    uptime = (okc / n * 100.0) if n > 0 else 0.0

    last = db.execute(
        text("select ok from checks where monitor_id=:mid order by ts desc limit 1"),
        {"mid": monitor_id},
    ).first()
    last_ok = bool(last[0]) if last is not None else None

    return {
        "range": range,
        "samples": n,
        "uptime_pct": round(uptime, 2),
        "avg_latency_ms": avg_lat,
        "last_ok": last_ok,
    }