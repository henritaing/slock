from sqlalchemy.dialects.sqlite import insert as sqlite_insert
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import MarketCache
from dateutil.relativedelta import relativedelta

def _get_cached_sector(db: Session, ticker: str) -> dict:
    row = db.query(
        MarketCache.sector, 
        MarketCache.industry,
        MarketCache.long_name
    ).filter(
        MarketCache.ticker == ticker,
        MarketCache.sector != None,
        MarketCache.sector != 'Unknown'
    ).first()
    return {"sector": row.sector, "industry": row.industry, "long_name": row.long_name} if row else None

def get_historical_data(db: Session, tickers: list, period_months: int, refresh: bool = False):
    end_date = datetime.now()
    start_date = (end_date - relativedelta(months=period_months)).date()
    
    result_data = {}

    for ticker in tickers:
        df = None
        # 1. Check Cache ONLY if Refresh is False
        if not refresh:
            earliest_entry = db.query(MarketCache).filter(
                MarketCache.ticker == ticker
            ).order_by(MarketCache.date.asc()).first()

            # If cache exists and is old enough to satisfy the request
            if earliest_entry and earliest_entry.date <= start_date:
                cached_rows = db.query(MarketCache).filter(
                    MarketCache.ticker == ticker,
                    MarketCache.date >= start_date
                ).order_by(MarketCache.date.asc()).all()

                if cached_rows:
                    df = pd.DataFrame([
                        {
                            "date": c.date, 
                            "adj_close": c.adj_close, 
                            "sector": c.sector, 
                            "industry": c.industry,
                            "long_name": c.long_name  
                        } for c in cached_rows
                    ])

        # 2. Fetch fresh data if cache missing, too short, or refresh forced
        if df is None or df.empty:
            yf_ticker = yf.Ticker(ticker)
            hist = yf_ticker.history(start=start_date, end=end_date, auto_adjust=True)
            
            if not hist.empty:
                cached_meta = _get_cached_sector(db, ticker)
                if cached_meta:
                    sector = cached_meta["sector"]
                    industry = cached_meta["industry"]
                    long_name = cached_meta["long_name"] or ticker
                else:
                    info = yf_ticker.info
                    sector = info.get('sector', 'Unknown')
                    industry = info.get('industry', 'Unknown')
                    long_name = info.get('longName', ticker)

                df = pd.DataFrame({
                    'date': hist.index.date,
                    'adj_close': hist['Close'].values,
                    'sector': sector,
                    'industry': industry,
                    'long_name': long_name
                }).reset_index(drop=True)

                # Bulk upsert instead of row-by-row merge
                rows = [
                    {
                        "ticker": ticker,
                        "date": row["date"],
                        "adj_close": row["adj_close"],
                        "sector": row["sector"],
                        "industry": row["industry"],
                        "long_name": row["long_name"]   # ADD THIS
                    }
                    for _, row in df.iterrows()
                ]
                stmt = sqlite_insert(MarketCache).values(rows)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["ticker", "date"],
                    set_={
                        "adj_close": stmt.excluded.adj_close,
                        "sector": stmt.excluded.sector,
                        "industry": stmt.excluded.industry,
                        "long_name": stmt.excluded.long_name,
                    }
                )
                db.execute(stmt)
                db.commit()

        if df is not None and not df.empty:
            result_data[ticker] = df

    return result_data