from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Uptime API")

# CORS (allow Next.js dev on 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("WEB_ORIGIN","http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
