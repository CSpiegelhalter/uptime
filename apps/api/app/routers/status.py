from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import get_db
from ..models import Monitor
from ..schemas import StatusPage

router = APIRouter(prefix="/v1/status", tags=["status"])

@router.get("/{slug}", response_model=StatusPage)
def public_status(slug: str, db: Session = Depends(get_db)):
    m = db.query(Monitor).filter(Monitor.slug == slug).first()
    if not m:
        raise HTTPException(404, "Not found")

    row = db.execute(
        text(
            "select status_code, ok, latency_ms, ts "
            "from checks where monitor_id=:mid order by ts desc limit 1"
        ),
        {"mid": m.id},
    ).mappings().first()

    last = dict(row) if row else None

    return {
        "slug": slug,
        "monitors": [{
            "name": m.name,
            "url": m.url,
            "interval_sec": m.interval_sec,
            "expected_status": m.expected_status,
            "last": last
        }]
    }