# apps/api/app/routers/demo.py
from fastapi import APIRouter
from typing import List, Dict
import asyncio
import httpx

router = APIRouter(prefix="/v1/demo", tags=["demo"])

SITES = [
    {"name": "Google", "url": "https://www.google.com"},
    {"name": "GitHub", "url": "https://github.com"},
    {"name": "Vercel", "url": "https://vercel.com"},
    {"name": "Cloudflare", "url": "https://www.cloudflare.com"},
]

@router.get("/snapshot")
async def snapshot() -> List[Dict]:
    async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
        async def check(site):
            try:
                r = await client.get(site["url"])
                return {
                    "name": site["name"],
                    "url": site["url"],
                    "status_code": r.status_code,
                    "ok": 200 <= r.status_code < 400,
                    "latency_ms": int(r.elapsed.total_seconds() * 1000),
                }
            except Exception:
                return {
                    "name": site["name"],
                    "url": site["url"],
                    "status_code": None,
                    "ok": False,
                    "latency_ms": None,
                }

        results = await asyncio.gather(*(check(s) for s in SITES))
        return list(results)
