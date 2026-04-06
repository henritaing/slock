# Slock | Quantitative Portfolio Analyzer
A full-stack financial dashboard for tracking stock performance, calculating risk metrics (Alpha, Beta, Volatility, RSI), and visualizing unrealized P&L using FastAPI and React (Vite).

## 🚀 Key Features (Updated)
- **Smart Caching:** Database-first strategy with automated gap-filling for 6M, 12M, 24M, and Max horizons.
- **Risk Engine:** Real-time calculation of Portfolio Beta and Alpha relative to S&P 500, MSCI World, or CAC 40.
- **Technical Indicators:** 21-day rolling Annualized Volatility and 14-day RSI with "Smart Slicing" to prevent lead-in data gaps.
- **Force Sync:** One-click cache bypass to fetch fresh market signals directly from Yahoo Finance.

## 🛠 Tech Stack
- **Frontend:** React 18, Tailwind CSS, Recharts, Lucide-React, Axios.
- **Backend:** FastAPI (Python 3.11+), Pandas, NumPy, YFinance.
- **Database:** SQLite (SQLAlchemy) for persistence of historical adjusted closes and metadata.

## Project Architecture

### 1. Backend (`/backend`)
- **`main.py`**: FastAPI entry point. Handles CORS, DB initialization, and the `/api/metrics` POST endpoint including Alpha/Beta orchestration.
- **`services/finances.py`**: Data fetching layer. Includes logic to verify if the cache is "deep enough" for the requested period (e.g., 24M) before falling back to YFinance.
- **`services/analytics.py`**: The Math Engine. 
  - Calculates `returns`, `volatility`, `rsi`, and `cum_return`.
  - **Smart Slicing:** Uses `.dropna()` on technical columns to ensure charts start with valid data points rather than 0.

### 2. Frontend (`/src`)
- **`App.jsx`**: Global state & Layout. Features a VSCode-style sidebar and a unified `handleSync` function with Event-sanitization to prevent JSON circularity errors.
- **`LandingPage.jsx`**
- **`Methodology.jsx`**: Financial & Mathematical explanations of metrics
- **`components/PortfolioInput.jsx`**: Side-slidable page to input portfolio stocks.
- **`components/RiskAnalytics.jsx`**: Visualizes Volatility and RSI trends across the selected horizon. (Postponed)
- **`components/PortfolioHealth.jsx`**: Displays core Quant stats (Alpha/Beta) and P&L breakdowns.
- **`components/PerformanceChart.jsx`**: Displays monthly performance.
- **`components/DistributionChart.jsx`**: Displays portfolio distribution.
- **`components/SectorPerformance.jsx`**: Displays index distribution compared to portfolio.
- **`components/SlothScore.jsx`**: Displays Sloth Metrics.
- **`components/ShockSimulator.jsx`**: Simple stress test for your portfolio compared to the market index chosen.

## Data Schemas

### API Request (POST `/api/metrics`)
```json
{
  "tickers": ["AAPL", "MSFT"],
  "benchmark": "SP500",
  "period": 24,
  "refresh": false
}

{
  "marketData": { "AAPL": [...] },
  "stats": { "beta": 1.15, "alpha": 2.45 }
}
```

## 3. Critical Troubleshooting
- Circular Structure Error: If handleSync fails, ensure the function call is wrapped in an anonymous arrow function () => handleSync() to prevent passing the React Click Event to Axios.
- Data Horizon: If "Max" shows limited data, use the Refresh (Sync) button to force the backend to fetch full history from Yahoo Finance and overwrite the local cache.
- Rolling Gaps: Indicators use min_periods=5 to show data as early as possible while maintaining statistical integrity.

## 4. Improved Initial Prompt (The "Quant Pro" Prompt)

If you were starting this project today or explaining it to a senior developer, use this prompt. It provides much clearer constraints and "Why" behind the logic:

> "Act as a Full-Stack Financial Engineer. Build a Quantitative Portfolio Dashboard called 'ADVIZ.' using FastAPI and React. 
>
> **Core Requirements:**
> 1. **Data Engine:** Implement a Python backend that fetches adjusted close prices via `yfinance`. Use SQLAlchemy to cache this data in SQLite. The cache must be 'Horizon-Aware': if a user requests 24 months but the cache only has 12, it must fetch the missing history.
> 2. **Analytics Layer:** Use Pandas to calculate:
>    - Annualized Rolling Volatility (21-day window).
>    - RSI (14-day window).
>    - Portfolio Beta and Alpha relative to a user-selected benchmark (S&P 500, etc.).
>    - Ensure 'Smart Slicing'—remove lead-in rows where rolling calculations are NaN so the frontend charts start cleanly.
> 3. **Frontend Architecture:** Use Vite/React with Tailwind CSS. Create a sidebar for portfolio CRUD (Ticker, Buy Price, Volume). Use Recharts for visualization. 
> 4. **State Management:** Implement a robust sync function that handles 'Force Refresh' (bypassing cache) and sanitizes input to prevent JSON serialization errors (specifically circular structures from React Events).
> 5. **Design Language:** Dark mode, 'Bloomberg-Lite' aesthetic, using Monospaced fonts for financial figures and Lucide icons."
