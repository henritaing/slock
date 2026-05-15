# Slock — Deploy v1 Checklist

Step-by-step checklist for taking Slock from local-only single-user to a public soft launch. Read [architecture.md](architecture.md) first — especially the **Target v1 Deployment Architecture** section — to understand *why* each task exists. This file says *how*.

How to use:
- Work top to bottom. Tasks within a milestone have ordering dependencies; don't skip ahead.
- Tick `- [x]` when a task is verified working, not when you've written the code.
- If you find something doesn't match this checklist (e.g. file moved, API changed), update the checklist as part of completing the task.
- Each task has an explicit **Verify** step. If you can't verify it, you haven't finished it.

Commands assume PowerShell on Windows (the dev box). Linux equivalents in parens where they differ.

---

## Status

| Milestone | Scope | Estimate | Status |
|---|---|---|---|
| M1 | Postgres + Alembic locally, clean dependencies | ~2 days | in progress (M1.1–M1.3 code done; M1.2–M1.3 verify blocked on Docker Desktop install) |
| M2 | User model, server-side Position model, scoped journal/watchlist | ~3 days | not started |
| M3 | Google OAuth (Authlib), session cookies, frontend auth flow | ~3–4 days | not started |
| M4 | Sentry, Railway backend, Vercel frontend, .fr domain, prod OAuth | ~2–3 days | not started |

---

## M1 — Postgres + Alembic locally

The goal of M1 is: **all existing endpoints pass against a local Postgres database, schema is managed by Alembic, and `uv pip install -r requirements.txt` works in a fresh Linux container.** No new features.

**Discovery (2026-05-15):** The project uses `uv` as the Python package manager. The venv at the repo root has no `pip.exe` — use `uv pip install` everywhere pip is mentioned in this checklist. The venv lives at `venv/` in the repo root, not `backend/venv/`.

### M1.1 — Trim `backend/requirements.txt` to runtime-only

**Goal:** The current file is a `pip freeze` of the entire dev venv (UTF-16 encoded, ~130 packages including `torch`, `easyocr`, `streamlit`, `matplotlib`, `pywin32`, etc.). `pywin32` alone will hard-fail Railway's Linux build. We need a clean ~10-package runtime list.

**Steps:**
- [x] Identify every `import` in `backend/main.py`, `backend/database.py`, `backend/models.py`, `backend/services/finances.py`, `backend/services/analytics.py`. Confirmed runtime deps: `fastapi`, `uvicorn`, `sqlalchemy`, `pandas`, `numpy`, `yfinance`, `python-dateutil`, `pydantic`, `psycopg`, `alembic`, `python-dotenv`.
- [x] Rewrite [backend/requirements.txt](backend/requirements.txt) as **UTF-8 (no BOM)** with pinned versions:

      fastapi==0.135.2
      uvicorn[standard]==0.42.0
      sqlalchemy==2.0.48
      pandas==3.0.1
      numpy==2.4.3
      yfinance==1.2.0
      python-dateutil==2.9.0.post0
      pydantic==2.12.5
      psycopg[binary]==3.3.4
      alembic==1.18.4
      python-dotenv==1.2.2

  **Note:** The Write tool on this machine saves files as UTF-16 LE, which breaks uv parsing. File was re-saved via `[System.IO.File]::WriteAllText` with `New-Object System.Text.UTF8Encoding($false)`. Always use this pattern for plain-text config files — not the Write tool.
- [x] ~~Delete backend/venv~~ — N/A: no `backend/venv/` exists. Venv is at repo root (`venv/`), managed by `uv`.
- [x] New deps installed into existing venv: `uv pip install "psycopg[binary]" alembic python-dotenv` (versions above). Dry-run confirmed all 47 transitive deps resolve cleanly.

**Verify:**
- [x] `uv pip install -r backend/requirements.txt --dry-run` resolves 47 packages with no errors.
- [ ] `uvicorn backend.main:app --reload` starts cleanly — **BLOCKED: install Docker Desktop first (M1.2), then come back here.**
- [ ] `curl http://localhost:8000/api/health` returns `{"status":"online"}` — BLOCKED same.
- [ ] Open `http://localhost:8000/docs` — Swagger UI lists all 12 endpoints — BLOCKED same.

**Watch out for:**
- If your editor re-saves `backend/requirements.txt`, check the encoding. UTF-16 re-encoding is silent but fatal on Linux.
- The actual versions in this venv differ from what the old UTF-16 requirements.txt appeared to say (`pandas==3.0.1`, not `2.2.3`; `numpy==2.4.3`, not `2.2.5`). The garbled reads were a UTF-16 artifact.

### M1.2 — Run Postgres locally via Docker

**Goal:** A reproducible local Postgres that matches what Railway will give us in prod.

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be installed. It was not present on this machine as of 2026-05-15 — install it before running any command in this section.

**Steps:**
- [x] Created `docker-compose.yml` at the repo root (committed):

      services:
        db:
          image: postgres:16
          environment:
            POSTGRES_USER: slock
            POSTGRES_PASSWORD: slock_dev
            POSTGRES_DB: slock
          ports:
            - "5432:5432"
          volumes:
            - slock_pgdata:/var/lib/postgresql/data
      volumes:
        slock_pgdata:

- [x] Confirmed `docker-compose.yml` is NOT in `.gitignore` — it's dev tooling, it belongs in the repo. The named volume `slock_pgdata` persists across `docker compose down`; only `docker compose down -v` wipes the data.
- [ ] **Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)**, then run: `docker compose up -d`

**Verify:**
- [ ] `docker compose ps` shows the `db` service `running`.
- [ ] `docker compose exec db psql -U slock -d slock -c "SELECT version();"` returns a Postgres 16 version string.

### M1.3 — Move `DATABASE_URL` to environment

**Goal:** [backend/database.py](backend/database.py) previously hardcoded `sqlite:///./cache.db`. It now reads from `os.environ["DATABASE_URL"]`, loaded from `.env` by python-dotenv. Code changes are complete; verify steps below require Postgres running (M1.2).

**Steps:**
- [x] `python-dotenv` added to requirements in M1.1.
- [x] Added `from dotenv import load_dotenv; load_dotenv()` at the top of [backend/main.py](backend/main.py) — before all relative imports so `DATABASE_URL` is in `os.environ` before `database.py` module code runs.
- [x] Replaced hardcoded `DATABASE_URL` with `os.environ["DATABASE_URL"]` in [backend/database.py](backend/database.py). No fallback — fail loudly if the env var is missing.
- [x] Made `connect_args` conditional: `{}` for Postgres, `{"check_same_thread": False, "timeout": 15}` for SQLite.
- [x] Created `.env` at the repo root (not committed — already in `.gitignore`):

      DATABASE_URL=postgresql+psycopg://slock:slock_dev@localhost:5432/slock

- [x] Created `.env.example` at the repo root (committed) with a placeholder value.
- [x] Confirmed `.env` was in `.gitignore` before this task (pre-existing rule). Confirmed `.env` was never committed (`git log --all --full-history -- .env` returned empty).

**Verify:**
- [x] `DATABASE_URL` loads from `.env`: confirmed via `python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.environ['DATABASE_URL'])"` → `postgresql+psycopg://slock:slock_dev@localhost:5432/slock`.
- [x] `connect_args` is `{}` for Postgres dialect (confirmed).
- [ ] `uvicorn backend.main:app --reload` connects to Postgres and serves traffic — **BLOCKED: needs M1.2 Docker running.**
- [ ] `docker compose exec db psql -U slock -d slock -c "\dt"` shows `market_cache`, `journal`, `watchlist`, `earnings_cache` — BLOCKED same.

**Watch out for:**
- The old `cache.db` at the repo root is now stale (backend no longer uses SQLite). Rename it to `cache.db.sqlite.bak` so it doesn't cause confusion.

### M1.4 — Port bulk upsert to dialect-aware dispatch

**Goal:** [backend/services/finances.py:1](backend/services/finances.py#L1) imports `from sqlalchemy.dialects.sqlite import insert as sqlite_insert`. This call WILL crash against Postgres because the SQLite dialect doesn't speak Postgres SQL. Make it dispatch on the DB dialect.

**Steps:**
- [ ] In [backend/services/finances.py](backend/services/finances.py), replace the top-level `sqlite_insert` import with a small helper:

      from sqlalchemy.dialects.postgresql import insert as pg_insert
      from sqlalchemy.dialects.sqlite import insert as sqlite_insert

      def _dialect_insert(bind, table):
          name = bind.dialect.name
          if name == "postgresql":
              return pg_insert(table)
          if name == "sqlite":
              return sqlite_insert(table)
          raise RuntimeError(f"Unsupported DB dialect: {name}")

- [ ] In `get_historical_data`, replace line 90:

      stmt = _dialect_insert(db.bind, MarketCache).values(rows)

  The `.on_conflict_do_update(...)` call below works the same on both dialects (PG and SQLite both implement the same SQLAlchemy syntax for it).

**Verify:**
- [ ] Hit `POST /api/metrics` with a small request: `curl -X POST http://localhost:8000/api/metrics -H "Content-Type: application/json" -d '{"tickers":["AAPL"],"benchmark":"SP500","period":3,"refresh":true}'`
- [ ] Inspect rows in Postgres: `docker compose exec db psql -U slock -d slock -c "SELECT ticker, count(*) FROM market_cache GROUP BY ticker;"` — should show `AAPL` with ~60 rows.
- [ ] Re-run the same `curl` — should be fast (cache hit) and not blow up on conflict.

### M1.5 — Initialize Alembic

**Goal:** From M2 onwards we'll add columns and tables. `Base.metadata.create_all()` can't migrate existing data. Alembic can.

**Steps:**
- [ ] From the repo root (with venv active): `alembic init alembic`
- [ ] Edit `alembic.ini`: replace `sqlalchemy.url = ...` with a placeholder, since we'll override it from env in `env.py`:

      sqlalchemy.url = driver://user:pass@localhost/dbname

- [ ] Edit `alembic/env.py`:
  - Add `from dotenv import load_dotenv; load_dotenv()` at the top.
  - Add `import os` and inside `run_migrations_online()` (and `_offline()`), override `config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])`.
  - Import `from backend.database import Base` and set `target_metadata = Base.metadata` for autogen support.
  - You'll need `sys.path.insert(0, ".")` at the top so `backend` is importable.
- [ ] Generate the baseline migration from current models:

      alembic revision --autogenerate -m "baseline schema"

- [ ] Read the generated migration in `alembic/versions/`. It should create `market_cache`, `journal`, `watchlist`, `earnings_cache`. **If any unexpected drops or alters appear, do not run it — fix env.py first.**
- [ ] **Important:** since `init_db()` already created the tables, you need to tell Alembic the schema is at the baseline without re-running it. Stamp it:

      alembic stamp head

  Going forward you'll use `alembic upgrade head` for real migrations.
- [ ] Remove the `init_db()` call from [backend/main.py:21](backend/main.py#L21) — Alembic owns schema now.

**Verify:**
- [ ] `alembic current` returns the baseline revision ID.
- [ ] `alembic history` shows one entry.
- [ ] Backend still starts and serves `/api/health`.

**Watch out for:**
- Alembic autogen does not detect every change (notably column type changes, server defaults, named constraints). Always read the generated migration before running it.
- Commit the `alembic/` dir but `.gitignore` any local SQLite or temp files inside it (there shouldn't be any).

### M1.6 — Full endpoint smoke test against Postgres

- [ ] `POST /api/metrics` with multiple tickers + a benchmark.
- [ ] `GET /api/preview/AAPL`.
- [ ] `POST /api/journal` then `GET /api/journal` then `PUT` then `DELETE` — full CRUD cycle.
- [ ] `POST /api/watchlist` + full CRUD.
- [ ] `GET /api/earnings?tickers=AAPL,MSFT`.
- [ ] `GET /api/health`.

Each must return `200` and round-trip data correctly. Verify rows in Postgres after each write.

### M1.7 — Update CLAUDE.md and checklist.md

**Goal:** Docs must match reality before M2 starts. If you skip this, the next milestone starts from a wrong picture.

**Steps:**
- [ ] Update [CLAUDE.md](CLAUDE.md) — the Gotchas section may need new entries (Docker Postgres setup, Alembic workflow, where the `.env` lives). The dev command in CLAUDE.md should reflect that `docker compose up -d` is now a prerequisite.
- [ ] Update [checklist.md](checklist.md) — flip the M1 row in the Status table to `done`, edit any step whose instructions turned out wrong, add gotchas you hit along the way.
- [ ] Update [architecture.md](architecture.md) only if you changed something the doc claims (schema, topology, env var names).
- [ ] Commit: `docs: M1 complete, update CLAUDE.md + checklist.md`.

**M1 done when:** Backend runs against local Postgres, all endpoints pass, Alembic owns the schema, requirements.txt is a clean runtime list, **and docs reflect this**.

---

## M2 — Multi-user data model + server-side portfolio

The goal of M2 is: **the DB knows what a user is, every user-owned table has a `user_id` FK, and the portfolio (currently localStorage) lives in a `positions` table.** Auth itself comes in M3 — for now, hardcode `current_user_id` to a fixed UUID for testing.

### M2.1 — Add `User` model

**Steps:**
- [ ] In [backend/database.py](backend/database.py), add:

      class User(Base):
          __tablename__ = "users"
          id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
          google_sub = Column(String, unique=True, index=True, nullable=False)
          email = Column(String, nullable=False)
          name = Column(String, nullable=True)
          picture = Column(String, nullable=True)
          created_at = Column(DateTime(timezone=True), default=utcnow)

- [ ] Generate migration: `alembic revision --autogenerate -m "add users table"`
- [ ] Read it. Apply it: `alembic upgrade head`.

**Verify:** `\d users` in psql shows the columns above.

### M2.2 — Add `Position` model (replaces localStorage portfolio)

**Steps:**
- [ ] Add to [backend/database.py](backend/database.py):

      class Position(Base):
          __tablename__ = "positions"
          id = Column(String, primary_key=True)   # NOT auto-generated; first-login migration supplies the Date.now() string from localStorage
          user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
          ticker = Column(String, nullable=False, index=True)
          buy_price = Column(Float, nullable=False)
          volume = Column(Float, nullable=True)
          bought_at = Column(Date, nullable=True)   # purchase date (separate from created_at)
          created_at = Column(DateTime(timezone=True), default=utcnow)

  Note: `id` is `String` (not auto-uuid) because we need to preserve the existing `Date.now()` numeric IDs from the localStorage portfolio so existing `JournalEntry.lot_id` references continue to resolve. See the Migration Notes in [architecture.md](architecture.md).
- [ ] Generate migration: `alembic revision --autogenerate -m "add positions table"`. Apply.

**Verify:** `\d positions`, and confirm FK to `users.id` with `ON DELETE CASCADE`.

### M2.3 — Add `user_id` FK to `journal` and `watchlist`

**Steps:**
- [ ] In [backend/database.py](backend/database.py), add to `JournalEntry`:

      user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

  And to `WatchlistItem`: same.
- [ ] Also convert `JournalEntry.lot_id` to a real FK:

      lot_id = Column(String, ForeignKey("positions.id", ondelete="CASCADE"), index=True)

- [ ] Generate migration: `alembic revision --autogenerate -m "user-scope journal and watchlist"`.
- [ ] **Hand-edit the migration** if needed: since current rows have no `user_id`, the column must be nullable initially OR you need to delete existing rows. Since there are no real users yet, the cleanest path is:

      def upgrade():
          op.execute("DELETE FROM journal")
          op.execute("DELETE FROM watchlist")
          op.add_column("journal", sa.Column("user_id", sa.String, nullable=False))
          op.add_column("watchlist", sa.Column("user_id", sa.String, nullable=False))
          op.create_foreign_key(...)

- [ ] Apply: `alembic upgrade head`.

**Verify:** `\d journal` and `\d watchlist` both show `user_id` NOT NULL with FK to `users.id`.

### M2.4 — `Position` CRUD endpoints

**Steps:**
- [ ] In [backend/models.py](backend/models.py), add `PositionCreate`, `PositionUpdate` Pydantic schemas.
- [ ] In [backend/main.py](backend/main.py), add:
  - `POST /api/positions` — create a single position
  - `GET /api/positions` — list current user's positions
  - `PUT /api/positions/{position_id}` — edit
  - `DELETE /api/positions/{position_id}` — delete
  - `POST /api/positions/bulk` — accept a JSON array; used once at first login to migrate localStorage. Insert all with provided IDs.
- [ ] **For now, hardcode the user_id** at the top of each handler: `current_user_id = "00000000-0000-0000-0000-000000000001"`. Create that user row by hand in psql so FK doesn't fail. M3 will replace this with a real dep.

**Verify:**
- [ ] `POST /api/positions/bulk` with a JSON array of 3 fake positions returns 200 and creates 3 rows.
- [ ] `GET /api/positions` returns those 3.
- [ ] Full CRUD round-trip works.

### M2.5 — Frontend: switch portfolio source to API

**Steps:**
- [ ] In [frontend/src/App.jsx:34](frontend/src/App.jsx#L34), replace the localStorage init with a `useEffect` that fetches `/api/positions` on mount and sets state.
- [ ] Replace the `localStorage.setItem('slock_portfolio', ...)` call ([frontend/src/App.jsx:97](frontend/src/App.jsx#L97)) with API calls (POST/PUT/DELETE depending on the operation). The cleanest pattern: every mutation hits the API first, then updates local React state on success.
- [ ] **First-login migration logic** (for users who had data before this release):

      const saved = localStorage.getItem('slock_portfolio');
      if (saved) {
          await axios.post('/api/positions/bulk', JSON.parse(saved));
          localStorage.removeItem('slock_portfolio');
      }

  Run this **once** before fetching `/api/positions`. After M3, gate it on "user just logged in for the first time" so it doesn't fire on every page load.

**Verify:**
- [ ] Add a position via the UI → row appears in Postgres.
- [ ] Hard-refresh the page → portfolio reappears (now from API, not localStorage).
- [ ] Delete a position via the UI → row gone from Postgres.

### M2.6 — Update CLAUDE.md and checklist.md

**Goal:** Same as M1.7 — keep docs aligned before moving on.

**Steps:**
- [ ] Update [CLAUDE.md](CLAUDE.md) — note that portfolio now lives server-side, the `lot_id` ↔ `Position.id` coupling is now an enforced FK, and there's a hardcoded user_id for testing until M3.
- [ ] Update [checklist.md](checklist.md) — flip M2 to `done`, correct any steps that diverged from reality.
- [ ] Update [architecture.md](architecture.md) — if the schema deltas you actually shipped differ from the "Schema Additions (M2)" table, fix the table.
- [ ] Commit: `docs: M2 complete, update CLAUDE.md + checklist.md`.

**M2 done when:** Positions live in Postgres scoped to a hardcoded user, journal and watchlist are scoped to that same user, the frontend reads/writes positions via the API only, **and docs reflect this**.

---

## M3 — Google OAuth

The goal of M3 is: **users can sign in with Google, their session persists as an httpOnly cookie, and every domain endpoint enforces `current_user`.** No more hardcoded user IDs.

### M3.1 — Google Cloud Console: create OAuth 2.0 Client

**Steps:**
- [ ] Go to https://console.cloud.google.com → create a new project named `slock` (or reuse an existing one).
- [ ] APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type: **Web application**.
- [ ] **Authorized JavaScript origins:**
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- [ ] **Authorized redirect URIs:**
  - `http://localhost:8000/api/auth/google/callback`
  - `http://127.0.0.1:8000/api/auth/google/callback`

  (We'll add the prod URIs in M4.)
- [ ] Copy the **Client ID** and **Client Secret** into `.env`:

      GOOGLE_CLIENT_ID=...
      GOOGLE_CLIENT_SECRET=...
      SESSION_SECRET=<generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`>

- [ ] Add the same keys to `.env.example` with placeholder values.

### M3.2 — Backend OAuth flow

**Steps:**
- [ ] Add to requirements: `authlib`, `httpx` (Authlib needs it for the OAuth client), `itsdangerous` (for session cookie signing). `pip install`.
- [ ] In [backend/main.py](backend/main.py), add the session middleware before `CORSMiddleware`:

      from starlette.middleware.sessions import SessionMiddleware
      app.add_middleware(
          SessionMiddleware,
          secret_key=os.environ["SESSION_SECRET"],
          https_only=os.environ.get("ENV") == "production",
          same_site="lax",
      )

- [ ] Create `backend/auth.py` with the Authlib OAuth client, the `get_current_user` dependency, and four routes:
  - `GET /api/auth/google` → `oauth.google.authorize_redirect(request, redirect_uri)`
  - `GET /api/auth/google/callback` → exchange code, upsert `User` by `google_sub`, `request.session["user_id"] = user.id`, redirect to `FRONTEND_URL` (env var).
  - `GET /api/auth/me` → returns the user or 401.
  - `POST /api/auth/logout` → `request.session.clear()`, return 204.
- [ ] Mount the auth router in main.py.

**Verify:**
- [ ] In a fresh browser session, hit `http://localhost:8000/api/auth/google` → redirects to Google consent.
- [ ] Approve → redirected back to frontend with a session cookie set.
- [ ] `curl --cookie "session=<value>" http://localhost:8000/api/auth/me` returns the user.
- [ ] `POST /api/auth/logout` clears the cookie. Subsequent `/api/auth/me` returns 401.

**Watch out for:**
- `SESSION_SECRET` MUST be the same across backend restarts in dev or your session cookies invalidate every time you hit save. Don't regenerate it casually.
- Authlib needs `httpx`, not `requests`, for async — install it.

### M3.3 — Scope every domain endpoint to `current_user`

**Steps:**
- [ ] For every endpoint in [backend/main.py](backend/main.py) that touches `JournalEntry`, `WatchlistItem`, or `Position`, add `current_user: User = Depends(get_current_user)` to the signature.
- [ ] In every query, add `.filter(<Model>.user_id == current_user.id)`.
- [ ] In every insert, set `user_id=current_user.id`.
- [ ] Delete the hardcoded `current_user_id` from M2.4.
- [ ] **Leave `/api/metrics`, `/api/preview/{ticker}`, `/api/earnings`, `/api/health` UNSCOPED.** Price data is global. But you DO want `/api/metrics` etc. to require auth (just not be filtered) — add `Depends(get_current_user)` without using the user inside the handler, to prevent unauthenticated YFinance hammering from the public.

**Verify:**
- [ ] Without a session cookie, `GET /api/journal` returns 401.
- [ ] Sign in as User A, create a journal entry. Sign out. Sign in as User B (different Google account, or wipe DB and use a different Google account). `GET /api/journal` returns `[]`.
- [ ] User B cannot edit or delete User A's entry by ID — must return 404 (do not leak existence).

### M3.4 — Frontend auth flow

**Steps:**
- [ ] Set `axios.defaults.withCredentials = true` in [frontend/src/api.js](frontend/src/api.js) so the session cookie is sent.
- [ ] Add an `AuthContext` providing `{ user, loading, signOut }`. On mount, fetch `/api/auth/me`. If 401, `user = null`. If 200, `user = data`.
- [ ] Add a login screen with a "Sign in with Google" button → `window.location.href = '/api/auth/google'`.
- [ ] In [frontend/src/App.jsx](frontend/src/App.jsx), gate the dashboard on `user`. If `loading`, render a spinner. If no `user`, render `<Login />`.
- [ ] Update first-login portfolio migration (M2.5) to run only once per user, e.g. after `user.id` is known and a `migrated_<user.id>` flag isn't in localStorage.

**Verify:**
- [ ] Hard refresh while logged out → login screen.
- [ ] Click "Sign in with Google" → consent → bounced back → dashboard renders.
- [ ] Open an incognito window → login screen again (proves session isolation).
- [ ] Sign out → bounced back to login screen.

### M3.5 — Update CLAUDE.md and checklist.md

**Goal:** Docs reflect that the app is now multi-tenant and auth-gated.

**Steps:**
- [ ] Update [CLAUDE.md](CLAUDE.md) — replace the "No authentication in v1" line and the localStorage portfolio note with the new reality. Add a Gotcha entry about local OAuth setup (Google client ID/secret in `.env`, the loopback redirect URI requirement).
- [ ] Update [checklist.md](checklist.md) — flip M3 to `done`, correct any divergences.
- [ ] Update [architecture.md](architecture.md) if you ended up routing OAuth differently than the Target Deployment Architecture describes (e.g. if you used JWT instead of cookies, or a different lib than Authlib).
- [ ] Commit: `docs: M3 complete, update CLAUDE.md + checklist.md`.

**M3 done when:** No endpoint can be hit without a valid session, two different Google accounts see two different journals/portfolios, frontend never assumes a user before `/api/auth/me` confirms it, **and docs reflect this**.

---

## M4 — Production deploy

The goal of M4 is: **slock.fr loads the React frontend on Vercel, `/api/*` proxies to a Railway-hosted FastAPI service backed by Railway Postgres, Sentry captures errors on both sides, and Google OAuth works against the prod redirect URIs.**

### M4.1 — Add Sentry to backend

**Steps:**
- [ ] Add `sentry-sdk[fastapi]` to requirements.
- [ ] At the top of [backend/main.py](backend/main.py), before `app = FastAPI()`:

      import sentry_sdk
      from sentry_sdk.integrations.fastapi import FastApiIntegration

      sentry_dsn = os.environ.get("SENTRY_DSN")
      if sentry_dsn:
          sentry_sdk.init(
              dsn=sentry_dsn,
              integrations=[FastApiIntegration()],
              traces_sample_rate=0.1,
              environment=os.environ.get("ENV", "development"),
          )

- [ ] Create a Sentry account, create a project (Python / FastAPI), copy the DSN.
- [ ] Add `SENTRY_DSN` to `.env` (and `.env.example`).

**Verify:**
- [ ] Temporarily add `raise RuntimeError("sentry smoke test")` to `/api/health`. Hit it. See the error in Sentry within ~30 seconds. Remove the line.

### M4.2 — Add Sentry to frontend

**Steps:**
- [ ] `cd frontend && npm install @sentry/react`
- [ ] In [frontend/src/main.jsx](frontend/src/main.jsx) (or whatever the entry is):

      import * as Sentry from "@sentry/react";
      if (import.meta.env.VITE_SENTRY_DSN) {
          Sentry.init({
              dsn: import.meta.env.VITE_SENTRY_DSN,
              tracesSampleRate: 0.1,
              environment: import.meta.env.MODE,
          });
      }

- [ ] Create a second Sentry project (JavaScript / React), copy the DSN.
- [ ] Add to `frontend/.env`: `VITE_SENTRY_DSN=...`. And `frontend/.env.example`.

**Verify:** Throw a test error from a button click handler, see it in Sentry. Remove the button.

### M4.3 — Vite API base via env

**Steps:**
- [ ] Rewrite [frontend/src/api.js](frontend/src/api.js):

      export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

- [ ] Create `frontend/.env` (dev): `VITE_API_BASE=http://127.0.0.1:8000/api`
- [ ] Create `frontend/.env.production`: `VITE_API_BASE=/api`  (same-origin via Vercel rewrite)
- [ ] Add both to `frontend/.gitignore` if not already (`.env.local`, `.env.*.local`, etc.).
- [ ] Commit `frontend/.env.example` with both keys placeholdered.

**Verify:** `npm run build` produces a `dist/` folder; grep `dist/assets/*.js` for `127.0.0.1` — should find nothing if `VITE_API_BASE` is set to `/api` in `.env.production`.

### M4.4 — Backend CORS via env

**Steps:**
- [ ] Replace the hardcoded list in [backend/main.py:26](backend/main.py#L26):

      allow_origins=os.environ["ALLOWED_ORIGINS"].split(","),

- [ ] Add to `.env`: `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`.
- [ ] In Railway env vars (later in M4.6): `ALLOWED_ORIGINS=https://slock.fr`.

### M4.5 — Procfile + production server config

**Steps:**
- [ ] Create `Procfile` at the repo root:

      web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 2

- [ ] Confirm `runtime.txt` or `.python-version` pins Python 3.11+:

      python-3.11.9

  Railway reads `runtime.txt`.
- [ ] Make sure `init_db()` is gone (Alembic runs migrations now, see M1.5).
- [ ] Add a release-phase command for migrations. In Railway this is configured in the service settings as a "Pre-deploy command":

      alembic upgrade head

### M4.6 — Railway: backend + Postgres

**Steps:**
- [ ] Create a Railway account, link GitHub.
- [ ] New project → Deploy from GitHub → pick the `adviz` repo. Railway auto-detects Python.
- [ ] Add a service: Postgres. Railway exposes `DATABASE_URL` automatically to the linked service.
- [ ] Add env vars to the backend service:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `SESSION_SECRET` (regenerate, do NOT reuse the dev one)
  - `FRONTEND_URL=https://slock.fr`
  - `ALLOWED_ORIGINS=https://slock.fr`
  - `SENTRY_DSN`
  - `ENV=production`
- [ ] Trigger a deploy. Watch the build logs. Expect: `pip install`, `alembic upgrade head`, `uvicorn ... starting`.
- [ ] Note the Railway-assigned URL (something like `slock-backend-production.up.railway.app`).

**Verify:**
- [ ] `curl https://<railway-url>/api/health` returns `{"status":"online"}`.
- [ ] Sentry shows no errors from boot.

### M4.7 — Vercel: frontend + rewrite

**Steps:**
- [ ] Create a Vercel account, link GitHub.
- [ ] Import project → `adviz` repo → set **Root Directory** to `frontend`. Framework auto-detects as Vite.
- [ ] Set env vars in Vercel:
  - `VITE_API_BASE=/api`
  - `VITE_SENTRY_DSN=...`
- [ ] Create `frontend/vercel.json`:

      {
        "rewrites": [
          { "source": "/api/:path*", "destination": "https://<railway-url>/api/:path*" }
        ]
      }

- [ ] Trigger a deploy.

**Verify:**
- [ ] The Vercel preview URL loads the landing page.
- [ ] In DevTools Network tab, requests to `/api/health` succeed against the Vercel domain (proving the rewrite works).

### M4.8 — Domain: OVH .fr → Vercel

**Steps:**
- [ ] Register `slock.fr` (or chosen name) at OVH.
- [ ] In Vercel project settings → Domains → add `slock.fr` and `www.slock.fr`.
- [ ] Vercel shows the DNS records to configure. In OVH DNS zone:
  - `A` record on root → Vercel's IP (`76.76.21.21`)
  - `CNAME` on `www` → `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (~5 min to hours).

**Verify:** `https://slock.fr/api/health` returns the backend's health JSON (via the rewrite).

### M4.9 — Google OAuth: add prod redirect URIs

**Steps:**
- [ ] Back to Google Cloud Console → the OAuth client from M3.1.
- [ ] Add **Authorized JavaScript origins**: `https://slock.fr`.
- [ ] Add **Authorized redirect URIs**: `https://slock.fr/api/auth/google/callback`.

  (Note: this is the slock.fr URL, not the Railway URL — Vercel's rewrite proxies it to Railway. Same-origin auth requires this.)
- [ ] Save.

### M4.10 — Production smoke test

- [ ] `https://slock.fr` loads.
- [ ] "Sign in with Google" works end-to-end, returns to dashboard with a populated `me` response.
- [ ] Add a position → appears in Railway Postgres (`railway connect` to inspect).
- [ ] Refresh → portfolio persists.
- [ ] Open a separate Google account in incognito → see an empty portfolio (proves user isolation).
- [ ] Force an error in the UI → Sentry frontend project captures it.
- [ ] Force an error in the API → Sentry backend project captures it.
- [ ] Check Railway logs for any warnings/errors during normal use.

### M4.11 — Update CLAUDE.md and checklist.md

**Goal:** Final docs sync for the v1 launch. After this, the project is live.

**Steps:**
- [ ] Update [CLAUDE.md](CLAUDE.md) — add the prod URLs (Railway backend, Vercel frontend, custom domain), the Sentry projects, and where to find Railway logs. Remove any "planned for deploy" language that's now reality.
- [ ] Update [checklist.md](checklist.md) — flip M4 to `done`. Consider archiving this file (e.g. rename to `checklist.v1.md`) and starting a fresh checklist for the next phase (Chart Lab, Hit Rate, etc.).
- [ ] Update [architecture.md](architecture.md) — collapse the "Current Architecture" and "Target v1 Deployment Architecture" sections, since they're now the same thing.
- [ ] Update [README.md](README.md) — replace "Local Setup" with a real deploy story, add the live URL, refresh the Roadmap section.
- [ ] Commit: `docs: v1 launch complete, sync all docs`.

**M4 done when:** Two unrelated people can sign up at https://slock.fr, build their own portfolios, and never see each other's data. Sentry catches errors. CORS + cookies work without console errors. **All docs reflect the live state.**

---

## Conventions

- **Commit cadence:** one task = one commit, with a message referencing the task ID (e.g. `M1.4: dialect-aware bulk upsert`).
- **End of every milestone:** the last sub-task is always "update CLAUDE.md and checklist.md" (M1.7, M2.6, M3.5, M4.11). This is a hard step. If docs and code diverge, the next milestone starts from a wrong picture and you'll waste a day. Do not skip.
- **When you find an inaccuracy in this checklist:** fix it in the same PR. The checklist must stay correct as you go, not just at milestone boundaries.
- **When a step fails:** don't move on. The next step assumes the previous one works.
- **When stuck for >30 min:** stop, re-read [architecture.md](architecture.md) for the target you're trying to hit, then ask.
