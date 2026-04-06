from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .services.finances import get_historical_data
from .services.analytics import calculate_metrics
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import yfinance as yf

# Initialize DB
init_db()

app = FastAPI()

# 1. CORS CONFIGURATION (Keep this here, only define 'app' ONCE)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DATA MODELS
class MetricsRequest(BaseModel):
    tickers: List[str]
    benchmark: Optional[str] = "None"
    period: Optional[int] = 12
    refresh: Optional[bool] = False

# 3. DB DEPENDENCY
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/metrics")
async def get_metrics(req: MetricsRequest, db: Session = Depends(get_db)):
    try:
        bench_map = {"SP500": "^GSPC", "MSCI World": "URTH", "CAC40": "^FCHI"}
        fetch_tickers = req.tickers.copy()
        active_bench_symbol = bench_map.get(req.benchmark)
        
        if active_bench_symbol:
            fetch_tickers.append(active_bench_symbol)

        raw_data = get_historical_data(db, fetch_tickers, req.period, req.refresh)
        processed_data = {}
        portfolio_returns_list = []

        # 1. Process Individual Tickers
        for ticker, df in raw_data.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                # Calculate basic metrics (RSI, Vol, etc.)
                ticker_metrics = calculate_metrics(df)
                
                # 2. FETCH METADATA (This is the V1.1 Bridge)
                t_obj = yf.Ticker(ticker)
                info = t_obj.info
                
                # Add sector/industry to the response
                ticker_metrics['sector'] = info.get('sector', 'Other')
                ticker_metrics['industry'] = info.get('industry', 'Other')
                ticker_metrics['longName'] = info.get('longName', ticker)

                processed_data[ticker] = ticker_metrics

                # Capture daily returns for Alpha/Beta (excluding benchmark)
                if ticker != active_bench_symbol:
                    # We use simple mean return here; for exact math, weights would be passed from frontend
                    portfolio_returns_list.append(df['adj_close'].pct_change())

        # 2. Quant Calculations (Alpha & Beta)
        alpha, beta = 0.0, 1.0

        if active_bench_symbol and active_bench_symbol in raw_data and portfolio_returns_list:
            try:
                # 1. Clean Benchmark Returns
                bench_returns = raw_data[active_bench_symbol]['adj_close'].pct_change()
                
                # 2. Clean Portfolio Returns
                port_returns = pd.concat(portfolio_returns_list, axis=1).mean(axis=1)
                
                # 3. Align the two series
                comparison_df = pd.concat([port_returns, bench_returns], axis=1).dropna()
                
                if len(comparison_df) > 10:
                    r_p = comparison_df.iloc[:, 0]
                    r_m = comparison_df.iloc[:, 1]
                    
                    covariance_matrix = np.cov(r_p, r_m)
                    covariance = covariance_matrix[0][1]
                    variance = np.var(r_m)
                    
                    beta = float(covariance / variance) if variance != 0 else 1.0
                    
                    total_port_ret = (1 + r_p).prod() - 1
                    total_mkt_ret = (1 + r_m).prod() - 1
                    alpha = float(total_port_ret - (beta * total_mkt_ret))
                    
            except Exception as calc_error:
                print(f"Calculation Error: {calc_error}")
                alpha, beta = 0.0, 1.0

        # This return must be indented ONE level inside the function
        # but OUTSIDE the try/except and if blocks.
        return {
            "marketData": processed_data,
            "stats": {
                "beta": round(float(beta), 2),
                "alpha": round(float(alpha * 100), 2)
            }
        }
    except Exception as e:
        print(f"Error in /api/metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    
@app.get("/api/health")
def health_check():
    return {"status": "online"}

