# Slock — The Investment Journal for Disciplined Investors

**Slock is a portfolio analyzer that makes you write down *why* you bought, not just *what* you bought.**

Built for self-directed PEA holders and professionals managing 10–50k€ portfolios who want to invest with discipline — not vibes.
No plans of deployment since it's a personal tool for yourself. You can fork the project to add more charts or financial indicators.

---

## Why Slock Exists

Slock combines two things:
1. **Dashboard** — visualize what you bought
2. **Journal** — write down why you bought, predict entry prices, check your hit rate over time
---

## Current Feature Set

### Dashboard
- **Portfolio Overview**: Asset & sector distribution (donut charts), total value, P&L, sector exposure vs benchmark
- **Performance**: Cumulative returns chart, switchable between portfolio-aggregate and per-stock view
- **Risk Analytics**: 21-day annualized volatility trend, comparable across stocks and benchmarks
- **Benchmarking**: One-click comparison against S&P 500, MSCI World, or CAC 40
- **Sloth Score**: A patience metric rewarding long-hold discipline (anti-day-trading behavior)

### Journal
- **Auto-created entries** for every position you hold
- **Editable thesis fields**: why you bought, target price, target date, ongoing notes
- **Watchlist**: track stocks you want to buy with entry targets and reasoning
- **Earnings Calendar**: upcoming earnings, dividend, and ex-dividend dates for your holdings

### Asset Search Center
- Interactive chart-based stock entry — instead of typing a buy price, click a point on the chart to lock the historical date and price
- Zoom by drag-selecting a range on the chart
- Search by company name or ticker (40+ CAC 40 stocks, US blue chips, European ETFs)

### Smart Backend
- **Database-first caching**: avoids redundant Yahoo Finance calls
- **Gap-fill logic**: detects whether the cache is deep enough for the requested horizon
- **Bulk upsert**: O(1) database round-trips per ticker instead of O(N)
- **Force-refresh**: one-click cache bypass for real-time freshness
- **Earnings cache**: 7-day TTL on calendar data to minimize API load

---

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Recharts, Lucide-React, Axios
- **Backend**: FastAPI (Python 3.11+), Pandas, NumPy, YFinance, SQLAlchemy
- **Database**: SQLite
- **Architecture**: Single-page React app with REST API, no auth (intentional)

---

## Architecture

### Backend (`/backend`)

| File | Responsibility |
|---|---|
| `main.py` | FastAPI app, endpoint definitions, CORS config |
| `models.py` | Pydantic request/response schemas |
| `database.py` | SQLAlchemy ORM models (MarketCache, JournalEntry, WatchlistItem, EarningsCache) |
| `services/finances.py` | Data fetching layer — cache check, gap-fill, bulk upsert |
| `services/analytics.py` | Math engine — returns, volatility, cumulative returns |

**Key endpoints**:
- `POST /api/metrics` — main portfolio analytics (tickers, benchmark, period, refresh)
- `GET /api/preview/{ticker}` — lightweight chart data for the search modal
- `GET /api/earnings?tickers=...` — earnings/dividend calendar
- `GET/POST/PUT/DELETE /api/journal` — full CRUD on journal entries
- `GET/POST/PUT/DELETE /api/watchlist` — full CRUD on watchlist items

### Frontend (`/src`)

**Top-level pages** (toggled by `view` state):
- `LandingPage.jsx`, `Methodology.jsx`, `Journal.jsx`, plus the main Dashboard in `App.jsx`

**Layout**:
- `components/layout/Sidebar.jsx`, `DashboardHeader.jsx`

**Dashboard components**:
- `ControlPanel.jsx` — view mode, benchmark, period selectors with auto-sync on change
- `DistributionChart.jsx` — asset + sector donuts
- `SectorPerformance.jsx` — portfolio vs benchmark sector breakdown
- `PortfolioHealth.jsx` — P&L cards
- `PerformanceChart.jsx` — cumulative returns line chart, color-stable across renders
- `RiskAnalytics.jsx` — volatility trend chart

**Stock entry**:
- `AssetSearchCenter.jsx` — full-screen chart-driven asset picker (zoom by drag, click to lock entry point)

**Cross-cutting**:
- `constants.js` — `TICKER_MAP` (40+ supported tickers), `CHART_COLORS`, `getTickerColor()` for stable per-ticker color hashing
- `api.js` — centralized API base URL

---

## Data Model

### MarketCache (composite PK: ticker + date)
`ticker, date, adj_close, sector, industry, long_name`

### JournalEntry
`id (uuid), lot_id, ticker, bought_at, volume, target_price, target_date, reason, notes, created_at, updated_at`

### WatchlistItem
`id (uuid), ticker, entry_target, thesis, created_at, updated_at`

### EarningsCache
`id (uuid), ticker, event_type, event_date, fetched_at`

---

## For future development

### Now: Chart Lab v1 (Sandbox)
The differentiating feature. Up to 4 stocks overlaid on a single chart with:
- Time-shift per stock (±12 months on X axis) for lead-lag analysis
- Y-axis normalization (% change from start of visible range)
- Live correlation coefficient on the visible window
- Toggle 50/200-day moving averages
- Line and candlestick view modes with volume overlay
- Import directly from portfolio holdings

### Next: Deploy v1
- Vercel (frontend) + Railway/Fly.io (backend) + managed Postgres
- Public soft launch to French finance Discord/Reddit communities

### Post-Launch
- Watchlist Hit Rate metric (was your prediction right?)
- "Earnings This Week" dashboard banner
- Per-thesis review reminders (in-app, not email)

---

## Known Constraints

- **No auth** — data is keyed to localStorage.
- **YFinance dependency** — single point of failure; rate limits mitigated by aggressive caching.
- **EUR-centric** — all P&L displayed in euros; multi-currency is not on the roadmap.
- **Mid-long-term focus** — no real-time/intraday data; refresh granularity is daily.

---

## Project Background

Slock is a personal tool — I was frustrated that Finary and my broker app told me *what I owned* but never *whether I was right to own it*. After 2 months of building, this is the result.

It's vibe-coded prototype quality reviewed line-by-line by me. Architecture-first, speed-of-iteration optimized. Cleanly modular enough to onboard a contributor without weeks of context.

I'm sharing it because I think other disciplined retail investors might find it useful.

---

## Local Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend
cd ..
npm install
cd frontend
npm run dev
npm run dev
```
