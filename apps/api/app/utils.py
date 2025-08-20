import re, uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from urllib.parse import urlparse, urlunparse

def ulid() -> str:
    return uuid.uuid4().hex


def slugify(name: str) -> str:
    # keep your existing slugify if you already have it
    s = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return s or "untitled"

def unique_slug(db: Session, base: str) -> str:
    """
    Find the next available slug: base, base-2, base-3, ...
    """
    rows = db.execute(
        text("select slug from monitors where slug = :base or slug like :like"),
        {"base": base, "like": f"{base}-%"},
    ).scalars().all()

    if not rows:
        return base

    # collect numeric suffixes that match base-N
    suffixes = []
    base_taken = False
    pat = re.compile(rf"^{re.escape(base)}-(\d+)$")
    for s in rows:
        if s == base:
            base_taken = True
        m = pat.match(s)
        if m:
            try:
                suffixes.append(int(m.group(1)))
            except ValueError:
                pass

    # if base is taken but no numeric suffixes, start at 2
    next_n = (max(suffixes) + 1) if suffixes else (2 if base_taken else 1)
    return f"{base}-{next_n}" if base_taken else base

def normalize_url(u: str) -> str:
    # ensure scheme; lower host; drop fragment; keep query/path
    if not u.startswith(("http://", "https://")):
        u = "https://" + u
    p = urlparse(u)
    netloc = p.netloc.lower()
    path = p.path or "/"
    # strip trailing slash EXCEPT root
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return urlunparse((p.scheme, netloc, path, "", p.query, ""))  # no fragment
