import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import MarketCache

def get_historical_data(db: Session, tickers: list, period_months: int):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_months * 30)
    
    result_data = {}

    for ticker in tickers:
        # 1. Check Cache
        cached_data = db.query(MarketCache).filter(
            MarketCache.ticker == ticker,
            MarketCache.date >= start_date.date()
        ).all()

        if cached_data:
            # Convert cache to DataFrame format
            df = pd.DataFrame([
                {"date": c.date, "adj_close": c.adj_close, "sector": c.sector, "industry": c.industry} 
                for c in cached_data
            ])
            result_data[ticker] = df
        else:
            yf_ticker = yf.Ticker(ticker)
            hist = yf_ticker.history(start=start_date, end=end_date)
            
            if not hist.empty:
                info = yf_ticker.info
                sector = info.get('sector', 'Unknown')
                industry = info.get('industry', 'Unknown')
                
                # Create a clean dataframe for calculation and caching
                clean_df = pd.DataFrame({
                    'date': hist.index.date,
                    'adj_close': hist['Close'], # Adjusted by default in yf.history
                    'sector': sector,
                    'industry': industry
                })

                # Save to DB (merge handles updates)
                for _, row in clean_df.iterrows():
                    new_entry = MarketCache(
                        ticker=ticker,
                        date=row['date'],
                        adj_close=row['adj_close'],
                        sector=row['sector'],
                        industry=row['industry']
                    )
                    db.merge(new_entry)
                db.commit()
                
                result_data[ticker] = clean_df

    return result_data