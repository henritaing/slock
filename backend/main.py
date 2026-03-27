from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .services.finances import get_historical_data
from .services.analytics import calculate_metrics
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd

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

# 3. DB DEPENDENCY
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. API ENDPOINTS
@app.post("/api/metrics")
async def get_metrics(req: MetricsRequest, db: Session = Depends(get_db)):
    try:
        # Prepare list of tickers (including benchmark if it's not "None")
        fetch_tickers = req.tickers.copy()
        
        # Simple mapping for benchmark tickers
        bench_map = {"SP500": "^GSPC", "MSCI World": "URTH", "CAC40": "^FCHI"}
        if req.benchmark in bench_map:
            fetch_tickers.append(bench_map[req.benchmark])

        # Fetch data
        raw_data = get_historical_data(db, fetch_tickers, req.period)
        processed_data = {}
        
        for ticker, df in raw_data.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                # Run the analytics (Cumulative Returns, RSI, Volatility)
                processed_data[ticker] = calculate_metrics(df)
            
        return processed_data
        
    except Exception as e:
        print(f"!!! CRITICAL BACKEND ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "online"}