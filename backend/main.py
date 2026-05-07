from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .services.finances import get_historical_data
from .services.analytics import calculate_metrics
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from .database import SessionLocal, init_db, JournalEntry, WatchlistItem, EarningsCache
import yfinance as yf
from datetime import datetime, timezone, date, timedelta
import logging

logger = logging.getLogger(__name__)

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
    volume: Optional[float] = None  
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
        logger.exception("Error in /api/metrics")
        raise HTTPException(status_code=500, detail="Failed to calculate metrics")
    
@app.get("/api/preview/{ticker}")
def get_preview(ticker: str, db: Session = Depends(get_db)):
    raw = get_historical_data(db, [ticker], 12, False)
    df = raw.get(ticker)
    if df is None or df.empty:
        return {"history": [], "name": ticker}
    
    return {
        "name": df['long_name'].iloc[0] if 'long_name' in df.columns else ticker,
        "history": df[['date', 'adj_close']].to_dict(orient='records'),
        "last_price": float(df['adj_close'].iloc[-1])
    }

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


@app.get("/api/earnings")
def get_earnings(tickers: str, db: Session = Depends(get_db)):
    ticker_list = [t.strip() for t in tickers.split(",")]
    results = {}
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=90)

    for ticker in ticker_list:
        # Check cache freshness
        latest = db.query(EarningsCache).filter(
            EarningsCache.ticker == ticker
        ).order_by(EarningsCache.fetched_at.desc()).first()

        if latest and latest.fetched_at > cutoff:
            rows = db.query(EarningsCache).filter(EarningsCache.ticker == ticker).all()
            results[ticker] = [
                {"event_type": r.event_type, "event_date": str(r.event_date)}
                for r in rows
            ]
            continue

        # Fetch fresh
        try:
            cal = yf.Ticker(ticker).calendar
            if not cal:
                continue

            db.query(EarningsCache).filter(EarningsCache.ticker == ticker).delete()
            events = []
            event_map = {
                "Earnings Date": "earnings",
                "Ex-Dividend Date": "exdividend",
                "Dividend Date": "dividend"
            }
            for label, event_type in event_map.items():
                val = cal.get(label)
                if val is None:
                    continue
                dates = val if isinstance(val, list) else [val]
                for d in dates:
                    event_date = d if isinstance(d, date) else d.date()
                    db.add(EarningsCache(
                        ticker=ticker,
                        event_type=event_type,
                        event_date=event_date
                    ))
                    events.append({
                        "event_type": event_type,
                        "event_date": str(event_date)
                    })
            db.commit()
            results[ticker] = events
        except Exception as e:
            print(f"Earnings fetch failed for {ticker}: {e}")
            continue

    return results

@app.post("/api/watchlist")
def create_watchlist_item(item: WatchlistItemCreate, db: Session = Depends(get_db)):
    db_item = WatchlistItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/api/watchlist")
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(WatchlistItem).order_by(WatchlistItem.created_at.desc()).all()

@app.put("/api/watchlist/{item_id}")
def update_watchlist_item(item_id: str, update: WatchlistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/watchlist/{item_id}")
def delete_watchlist_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"deleted": item_id}