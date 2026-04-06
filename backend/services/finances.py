import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import MarketCache

def get_historical_data(db: Session, tickers: list, period_months: int, refresh: bool = False):
    end_date = datetime.now()
    start_date = (end_date - timedelta(days=period_months * 30)).date()
    
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
                            "industry": c.industry
                        } for c in cached_rows
                    ])

        # 2. Fetch fresh data if cache missing, too short, or refresh forced
        if df is None or df.empty:
            yf_ticker = yf.Ticker(ticker)
            hist = yf_ticker.history(start=start_date, end=end_date)
            
            if not hist.empty:
                info = yf_ticker.info
                sector = info.get('sector', 'Unknown')
                industry = info.get('industry', 'Unknown')
                
                df = pd.DataFrame({
                    'date': hist.index.date,
                    'adj_close': hist['Close'],
                    'sector': sector,
                    'industry': industry
                }).reset_index(drop=True)

                # 3. Update Database (Sync)
                for _, row in df.iterrows():
                    entry = MarketCache(
                        ticker=ticker,
                        date=row['date'],
                        adj_close=row['adj_close'],
                        sector=row['sector'],
                        industry=row['industry']
                    )
                    db.merge(entry)
                
                db.commit()

        if df is not None:
            result_data[ticker] = df

    return result_data