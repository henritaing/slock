# Architecture

This document covers the **current architecture** (local-only, single-user, SQLite). For the **target v1 deployment architecture** (Vercel + Railway + Postgres + Google OAuth), jump to [Target v1 Deployment Architecture](#target-v1-deployment-architecture).

## Current Architecture

### Data Flow

1. **Frontend (React)** - Manages portfolio state in App.jsx using useState/useMemo, renders dashboard and journal UI
2. **API Layer** - Centralized api.js exports API_BASE URL; components use axios for HTTP calls
3. **Backend (FastAPI)** - REST endpoints in main.py handle metrics, journal, watchlist, and earnings
4. **Database** - SQLAlchemy ORM models in database.py; services handle data fetching and transformation

### Core Entities

#### MarketCache (composite PK: ticker + date)
Caches historical OHLC data to minimize YFinance API calls. Fields: ticker, date, adj_close, sector, industry, long_name.

**Caching Strategy** (in services/finances.py):
- On request, check if cache has data older than the requested start date
- If cache is insufficient or refresh=True, fetch fresh data from YFinance
- Bulk upsert all rows (O(1) DB round-trips per ticker, not O(N))
- Sector/industry metadata is fetched once and reused

#### JournalEntry
User notes on each position: buy price, volume, thesis (reason), target price/date, ongoing notes. Auto-created for every portfolio position but user-editable.

#### WatchlistItem
Tracks stocks the user wants to buy, with entry target price and investment thesis.

#### EarningsCache
90-day TTL cache of earnings/dividend/ex-dividend dates from YFinance. Keyed by ticker. (Older docs/README say 7-day; the code in `backend/main.py` uses 90.)

### Backend Endpoints

- `POST /api/metrics` - Core analytics engine; accepts tickers, benchmark, period_months, refresh
- `GET /api/preview/{ticker}` - Lightweight chart data for search modal (12-month history)
- `GET /api/earnings?tickers=...` - Earnings/dividend/ex-dividend calendar (comma-separated)
- `POST/GET/PUT/DELETE /api/journal` - Full CRUD on journal entries
- `POST/GET/PUT/DELETE /api/watchlist` - Full CRUD on watchlist items
- `GET /api/health` - Liveness check

### Frontend Architecture

#### State Management (App.jsx)

- **UI State**: view (landing/dashboard/journal/methodology), isSidebarOpen, isSearchOpen
- **Data State**: portfolio (persisted to localStorage), marketData, loading
- **Filter State**: viewMode (portfolio/detailed), benchmark, period, selectedTickers

**Memoized "engines"**:
- `displayPortfolio` - Aggregates multiple lots of the same ticker (cost-basis averaging)
- `totals` - Sums invested, current, and P&L across portfolio
- `handleSync()` - Calls /api/metrics endpoint and updates marketData

#### Component Hierarchy

    App.jsx
    ├── Sidebar (PortfolioInput inside)
    ├── DashboardHeader
    ├── ControlPanel (view/benchmark/period selectors + refresh button)
    ├── Dashboard (conditional):
    │   ├── DistributionChart (asset/sector donuts)
    │   ├── PortfolioHealth (P&L cards)
    │   ├── PerformanceChart (cumulative returns line chart)
    │   ├── SectorPerformance (portfolio vs benchmark sector exposure)
    │   └── RiskAnalytics (annualized 21-day volatility trend)
    ├── AssetSearchCenter (full-screen stock picker with chart zoom)
    ├── Journal (list of entries with edit/delete)
    └── LandingPage / Methodology (onboarding)

#### Key Design Patterns

1. **Color Stability** - `getTickerColor()` in constants.js uses deterministic hashing so each ticker gets the same color across re-renders and sessions
2. **Date Formatting** - Consistent use of `toLocaleDateString()` for display; stored as ISO strings in DB
3. **Controlled Form Inputs** - Journal and watchlist editors use React state for inputs, only save on explicit button click
4. **Lazy Portfolio Aggregation** - Multiple buys of same stock are merged client-side (volume-weighted cost basis)

### Analytics Engine (services/analytics.py)

Given a DataFrame of daily prices:
1. Calculate daily returns (`pct_change`)
2. Compute annualized 21-day rolling volatility (`std() * sqrt(252)`)
3. Calculate cumulative returns as `(1 + returns).cumprod() - 1`
4. Drop NaN volatility rows, sanitize infinities for JSON serialization
5. Return `{ history: [...], last_price: float }`

This metric is used in both:
- **Portfolio view**: Weighted sum of all position returns
- **Detailed view**: Per-stock cumulative returns overlaid on one chart

### Key Files & Responsibilities

#### Backend

- [main.py](backend/main.py) (207 lines) - FastAPI app, all endpoint definitions, CORS middleware
- [database.py](backend/database.py) (64 lines) - SQLAlchemy ORM models, database initialization
- [models.py](backend/models.py) (32 lines) - Pydantic request/response schemas
- [services/finances.py](backend/services/finances.py) (105 lines) - Data fetching, cache logic, bulk upsert, gap-fill
- [services/analytics.py](backend/services/analytics.py) (26 lines) - Metric calculation (returns, volatility, cumulative returns)

#### Frontend

- [App.jsx](frontend/src/App.jsx) (255 lines) - Main app logic, state management, conditional view rendering
- [Journal.jsx](frontend/src/Journal.jsx) (348 lines) - Journal entries list with CRUD, earnings calendar integration
- [components/AssetSearchCenter.jsx](frontend/src/components/AssetSearchCenter.jsx) - Full-screen stock picker with interactive chart zoom
- [components/PerformanceChart.jsx](frontend/src/components/PerformanceChart.jsx) - Recharts LineChart with dual portfolio/benchmark lines
- [components/RiskAnalytics.jsx](frontend/src/components/RiskAnalytics.jsx) - Volatility trend visualization
- [constants.js](frontend/src/constants.js) - TICKER_MAP (40+ tickers), color hashing, chart color palette
- [api.js](frontend/src/api.js) - Single export: `API_BASE = 'http://127.0.0.1:8000/api'`

---

## Target v1 Deployment Architecture

Public soft-launch topology. Decided 2026-05-15. Migrates from local SQLite/single-user to multi-tenant Postgres with Google OAuth.

### Topology

    Browser
       │
       ▼
    Vercel (slock.fr)  ─── static React build
       │
       │  /api/* rewrite (same-origin, no CORS, cookies just work)
       ▼
    Railway (FastAPI + uvicorn workers)
       │  ├─── Managed Postgres (Railway add-on)
       │  ├─── YFinance  (egress to Yahoo)
       │  ├─── Google OAuth  (auth code exchange)
       │  └─── Sentry  (errors, both backend project + frontend project)

Frontend and backend are **same-origin from the browser's POV** thanks to the Vercel rewrite. No `api.slock.fr` subdomain, no cross-origin cookie config.

### Auth Flow (Google OAuth)

Library: **Authlib** on the backend. Session lives in an **httpOnly cookie** signed with `SESSION_SECRET`. Same-origin means `SameSite=Lax` works.

1. `GET /api/auth/google` → 302 to Google consent screen
2. Google → `GET /api/auth/google/callback?code=...`
3. Backend exchanges code → upserts `User` row by `google_sub` → sets session cookie → 302 to `/`
4. `GET /api/auth/me` → returns current user (frontend uses this to gate routes)
5. `POST /api/auth/logout` → clears cookie

Every domain endpoint gets a `current_user: User = Depends(get_current_user)` dependency. Unauthenticated → 401.

### Schema Additions (M2)

| Table | Change |
|---|---|
| `users` | **New.** `id (uuid)`, `google_sub (unique)`, `email`, `name`, `picture`, `created_at` |
| `positions` | **New.** Replaces frontend localStorage portfolio. `id`, `user_id (FK)`, `ticker`, `buy_price`, `volume`, `created_at`. **`id` adopts the existing `Date.now()` numeric IDs verbatim on first-login migration** so `JournalEntry.lot_id` references survive — see Migration Notes below. |
| `journal` | Add `user_id (FK)` column. `lot_id` keeps pointing at `positions.id` (now a real FK instead of an implicit reference). |
| `watchlist` | Add `user_id (FK)` column. |
| `market_cache` | **Unchanged** — global, no `user_id`. Price data is the same for everyone. |
| `earnings_cache` | **Unchanged** — global, same reason. |

Schema changes from M2 onwards go through **Alembic** migrations. The first migration is the baseline from current SQLAlchemy models; the second adds `users` + `positions` + `user_id` FKs.

### Endpoint Changes

- **All journal / watchlist endpoints**: gain `current_user` dep, `WHERE user_id = current_user.id` on every query, set `user_id` on every insert.
- **New: `GET/POST/PUT/DELETE /api/positions`** — full CRUD for the server-side portfolio.
- **New: `POST /api/positions/bulk`** — used once at first login to upload the existing localStorage portfolio.
- `/api/metrics` keeps accepting `tickers` in the body (no behavior change), but the frontend now derives that list from `/api/positions` instead of localStorage.
- `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/me`, `/api/auth/logout` — new auth routes.

### Environment Configuration

**Backend (Railway):**

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (auto-injected by Railway when Postgres add-on is linked) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials from Google Cloud Console |
| `SESSION_SECRET` | 32+ byte random string for signing session cookies |
| `FRONTEND_URL` | `https://slock.fr` — used in OAuth redirects |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist (`https://slock.fr,http://localhost:5173`) |
| `SENTRY_DSN` | Backend Sentry project DSN |
| `ENV` | `production` / `development` (toggles cookie `Secure` flag, logging level) |

**Frontend (Vercel):**

| Var | Purpose |
|---|---|
| `VITE_API_BASE` | `/api` in production (same-origin via rewrite), `http://127.0.0.1:8000/api` locally |
| `VITE_SENTRY_DSN` | Frontend Sentry project DSN |

`vercel.json` carries the rewrite:

    {
      "rewrites": [
        { "source": "/api/:path*", "destination": "https://<railway-url>/api/:path*" }
      ]
    }

### Observability

- **Sentry — backend**: `sentry-sdk[fastapi]` initialized in [main.py](backend/main.py) before the app instance. Captures unhandled exceptions and slow requests.
- **Sentry — frontend**: `@sentry/react` initialized in main entry, browser tracing on.
- **Health**: `GET /api/health` (existing) used as Railway liveness probe.

### Migration Notes (M2)

The hidden coupling between `JournalEntry.lot_id` and `portfolio[].id` (currently `Date.now()` ints in localStorage) means **first-login portfolio upload must preserve existing IDs**:

1. Frontend POSTs `/api/positions/bulk` with `[{id: <Date.now() int>, ticker, ...}, ...]`.
2. Backend inserts each `Position` row using the **client-supplied `id`** (cast to string for uniformity with future UUIDs, or keep as int — pick one and stick with it in the migration).
3. Existing `JournalEntry.lot_id` values now resolve to real FKs. No rewrite pass needed.
4. Frontend clears `localStorage.slock_portfolio` after successful upload.

After v1, new positions get server-generated UUIDs; the legacy numeric IDs are grandfathered in.

### Deploy-Time Risks (Surfaced in Sanity Check 2026-05-15)

1. **[backend/requirements.txt](backend/requirements.txt) is a full venv `pip freeze` dump** including torch (~700MB), torchvision, easyocr, streamlit, plotly, matplotlib, scikit-image, opencv, moviepy, pytube, jupyter, and **`pywin32` (Windows-only — Railway's Linux build will fail)**. Must be trimmed to ~10 actual runtime deps before any deploy attempt. Also UTF-16 encoded; re-save as UTF-8.
2. **Bulk upsert in [backend/services/finances.py](backend/services/finances.py) uses `sqlalchemy.dialects.sqlite.insert`.** Port to dialect-aware dispatch (sqlite for local dev, postgresql for prod) or standardize on Postgres locally via Docker.
3. **YFinance rate limits on Railway's shared egress IPs.** Existing cache layer absorbs most calls so not a v1 blocker, but worth monitoring post-launch; mitigations include backoff/jitter or a residential proxy.
4. **`yf.Ticker.info` is slow and flaky.** Already short-circuited by `_get_cached_sector()` in finances.py — keep it that way.

