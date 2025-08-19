import re, uuid
def ulid() -> str:
    return uuid.uuid4().hex

def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return s or ulid()
