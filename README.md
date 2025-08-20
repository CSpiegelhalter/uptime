# Uptime Monitor — Monorepo (Next.js + FastAPI)

A tiny, production-style uptime platform:

- Create HTTP monitors for any URL
- See uptime %, latest status & latency, 24h summary
- Public status pages per monitor (/status/[slug])
- Demo page with a few public sites
- Email/password auth, per-user dashboards


# Tech Stack
Deployed with: Next.js on Vercel + FastAPI on Render + Postgres

## Frontend (apps/web)

- Next.js (App Router, RSC) + TypeScript
- Tailwind CSS
- Server components for data fetching and route handlers that attach the auth token to backend API requests


### Pages:

1. Dashboard (/) — list of monitors
2. New monitor (/monitors/new)
3. Monitor details (/monitors/[id])
4. Public status (/status/[slug])
5. Demo snapshot (/demo)
6. Auth: /login, /register

## Backend (apps/api)

- FastAPI + Uvicorn
- SQLAlchemy 2.x ORM, Alembic migrations
- PostgreSQL (psycopg v3)
- Pydantic v2, httpx for checks, APScheduler for scheduling
- Auth: email/password (bcrypt via passlib), JWT (via PyJWT)
- CORS locked to WEB_ORIGIN

## Infrastructure

- Docker Compose for local full-stack dev (web, api, db)
- Vercel (frontend) + Render (Docker Web Service + managed Postgres)
- Swagger/OpenAPI at /docs on the API (coming soon)


# Authentication Model

- Register/Login: POST to API (/v1/auth/register, /v1/auth/login).
- Password hashed with bcrypt (passlib).
- JWT returned by API is stored by the Next.js app (HTTP-only cookie).
- Route handlers in the Next app forward API calls and attach Authorization: Bearer <token>.
- Protected API routes require a valid JWT (per-user ownership enforced on monitors).

# API Overview (selected)

POST /v1/auth/register — create account

POST /v1/auth/login — obtain JWT

GET /v1/monitors — list authenticated user’s monitors

POST /v1/monitors — create monitor { name, url, interval_sec, expected_status }

DELETE /v1/monitors/:id — delete (also unschedules)

GET /v1/monitors/:id/summary?range=24h — uptime% + avg latency

GET /v1/status/:slug — public status (latest check)

GET /v1/demo/snapshot — live checks for a few popular sites


# Local Development
Prereqs:
- Docker Desktop (or Docker Engine + Compose)
- No local Node/Python required if you use Docker

1) Start everything
```docker compose up --build```


Services:

Web: http://localhost:3000

API: http://localhost:8000

Postgres: localhost:5432 (uptime/uptime)

2) Run database migrations

In another terminal:

```docker compose exec api bash -lc "alembic upgrade head"```


This creates all tables (users, monitors, checks, incidents, etc.)

3) Use the app

Open http://localhost:3000

Register at /register, then log in

Create a monitor at /monitors/new

View public status at /status/[slug]

Try demo at /demo

API docs: http://localhost:8000/docs


## License

MIT — do whatever you want; attribution appreciated.

## Contributing

PRs welcome! If you want to extend:

Shared checks per URL (de-dupe across users)

Incident timelines & email/webhook alerts

Charts for latency & uptime history

Teams & shared dashboards

Happy shipping! If you want a short demo script or Loom outline for recruiters, ping me and I’ll draft one.