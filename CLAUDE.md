# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Slock** is an EUR-centric portfolio analyzer + investment journal targeting self-directed PEA holders managing 10–50k€ portfolios. See [README.md](README.md) for product context, feature set, and roadmap.

## Development

Run backend and frontend in two terminals.

**Backend** (from repo root — `main.py` uses package-relative imports, so `cd backend` then `uvicorn main:app` will fail):

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Copy `.env.example` → `.env` (default values work for local dev as-is)
3. `docker compose up -d` — starts Postgres on port 5432
4. `uv pip install -r backend/requirements.txt` — project uses `uv`, not pip
5. `uvicorn backend.main:app --reload`

Serves on `http://localhost:8000`. Swagger UI at `/docs`. CORS allows `localhost:5173` and `127.0.0.1:5173` only.

**Frontend**:

    cd frontend
    npm install
    npm run dev

Scripts: `dev`, `build`, `lint`, `preview` (see [frontend/package.json](frontend/package.json)).

## Architecture

See [architecture.md](architecture.md) for data flow, entities, endpoints, frontend state, components, and analytics engine. The "Target v1 Deployment Architecture" section at the bottom covers the in-progress migration to Vercel + Railway + Postgres + Google OAuth.

## Deploy v1 Checklist

[checklist.md](checklist.md) is the live, ticked-as-you-go plan for shipping v1 (M1 Postgres + Alembic → M2 multi-user models → M3 Google OAuth → M4 production deploy). Each milestone ends with a mandatory "update CLAUDE.md and checklist.md" sub-task — keep docs and code in lockstep.

## Gotchas

- **Package manager is `uv`, not pip.** The venv at `venv/` has no `pip.exe`. Use `uv pip install -r backend/requirements.txt` to install deps.
- **`DATABASE_URL` is required at startup.** It's read from `.env` at the repo root via `python-dotenv`. If the backend crashes with `KeyError: 'DATABASE_URL'`, the `.env` file is missing — copy `.env.example` to `.env`.
- **The Write tool saves UTF-16 LE on this machine**, which breaks uv/pip parsing. For new plain-text config files (requirements.txt, .env, etc.), write via PowerShell: `[System.IO.File]::WriteAllText(path, content, (New-Object System.Text.UTF8Encoding($false)))`.
- **Portfolio state has no backend yet** — still persisted in browser localStorage under `slock_portfolio`. This changes in M2 (see [checklist.md](checklist.md)).
- **YFinance is the only price source.** The UI's "Force Refresh" button bypasses the cache. To wipe all cached market data: connect to local Postgres and `TRUNCATE market_cache;`.
- **Tickers**: add new ones to `TICKER_MAP` in [frontend/src/constants.js](frontend/src/constants.js). No backend change needed — YFinance auto-fetches on first use.
