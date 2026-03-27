# ADVIZ. | Quantitative Portfolio Analyzer
A full-stack financial dashboard for tracking stock performance, calculating risk metrics (Volatility, RSI), and visualizing unrealized P&L using FastAPI and React (Vite).

## Tech Stack
Frontend: React 18, Tailwind CSS, Recharts, Lucide-React, Axios.

Backend: FastAPI (Python 3.11+), Pandas, NumPy, YFinance.

Database: SQLite (SQLAlchemy) for caching historical market data.

## Project Architecture

1. Backend (/backend)
- main.py: FastAPI entry point. Handles CORS, DB initialization, and the /api/metrics POST endpoint.
- database.py: SQLAlchemy setup for cache.db.
- services/finances.py: Logic for fetching data via yfinance with a "Check-Cache-First" strategy.
- services/analytics.py: The Math Engine. Calculates:
- returns: pct_change()
- volatility: 21-day rolling annualized standard deviation.
- rsi: 14-day Relative Strength Index.

Note: Aggressively sanitizes NaN/Inf to None for JSON compliance.

2. Frontend (/src)
- App.jsx: Global state manager (portfolio, marketData). Features a VSCode-style collapsible sidebar layout.
- components/PortfolioInput.jsx: Sidebar component. Handles CRUD operations and inline editing of holdings.
- components/DistributionChart.jsx: Donut charts for Asset and Sector allocation.
- components/PerformanceChart.jsx: Multi-line chart for historical price/volatility/RSI.
- components/PortfolioHealth.jsx: Bar charts for Price vs. Basis and Unrealized PnL (€).

## Data Schemas
Portfolio Object (Frontend)
{
  "id": 1711456000,
  "ticker": "AAPL",
  "buy_price": "150.25",
  "volume": "10"
}

API Request (POST /api/metrics)
{
  "tickers": ["AAPL", "MSFT"],
  "period": 12
}

API Response
Returns a dictionary where keys are tickers and values are lists of daily records:
{
  "AAPL": [
    {
      "date": "2024-03-25",
      "adj_close": 170.12,
      "returns": 0.002,
      "volatility": 0.18,
      "rsi": 54.2,
      "sector": "Technology"
    }
  ]
}

## Setup & Installation

Backend
1. cd backend
2. python -m venv venv
3. source venv/bin/activate (or venv\Scripts\activate on Windows)
4. pip install fastapi uvicorn pandas numpy yfinance sqlalchemy
5. uvicorn main:app --reload

Frontend
1. cd frontend
2. npm install
3. npm run dev

## Critical Troubleshooting Notes

- JSON Serialization: If the backend throws a ValueError: Out of range float, ensure analytics.py is converting NaN to None using .astype(object).- where(pd.notnull(df), None).
- CORS: The backend must allow origin http://localhost:5173.
- Data Persistence: portfolio state is persisted in localStorage under the key adviz_portfolio.
- Formatting: Use toLocaleString() for Euro values and .toFixed(2) for percentages in all UI components.