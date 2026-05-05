from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .services.finances import get_historical_data
from .services.analytics import calculate_metrics
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from .database import SessionLocal, init_db, JournalEntry, WatchlistItem
from datetime import datetime, timezone

init_db()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetricsRequest(BaseModel):
    tickers: List[str]
    benchmark: Optional[str] = "None"
    period: Optional[int] = 12
    refresh: Optional[bool] = False

class JournalEntryCreate(BaseModel):
    lot_id: str
    ticker: str
    bought_at: Optional[float] = None
    target_price: Optional[float] = None
    target_date: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class JournalEntryUpdate(BaseModel):
    target_price: Optional[float] = None
    target_date: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class WatchlistItemCreate(BaseModel):
    ticker: str
    entry_target: Optional[float] = None
    thesis: Optional[str] = None

class WatchlistItemUpdate(BaseModel):
    entry_target: Optional[float] = None
    thesis: Optional[str] = None



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

        for ticker, df in raw_data.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                ticker_metrics = calculate_metrics(df)
                ticker_metrics['sector'] = df['sector'].iloc[0] if 'sector' in df.columns else 'Other'
                ticker_metrics['industry'] = df['industry'].iloc[0] if 'industry' in df.columns else 'Other'
                ticker_metrics['longName'] = df['long_name'].iloc[0] if 'long_name' in df.columns else ticker
                processed_data[ticker] = ticker_metrics

        return {
            "marketData": processed_data,
            "benchmarkSymbol": active_bench_symbol  
        }

    except Exception as e:
        print(f"Error in /api/metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/health")
def health_check():
    return {"status": "online"}

@app.post("/api/journal")
def create_journal_entry(entry: JournalEntryCreate, db: Session = Depends(get_db)):
    db_entry = JournalEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/api/journal")
def get_journal_entries(db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.created_at.desc()).all()

@app.put("/api/journal/{entry_id}")
def update_journal_entry(entry_id: str, update: JournalEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(entry, k, v)
    entry.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(entry)
    return entry

@app.delete("/api/journal/{entry_id}")
def delete_journal_entry(entry_id: str, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": entry_id}    
