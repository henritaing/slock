import pandas as pd
import numpy as np

def calculate_metrics(df: pd.DataFrame):
    # 1. Sort and Calculate basic returns
    df = df.sort_values('date')
    df['returns'] = df['adj_close'].pct_change()
    
    # 2. Volatility (Annualized 21-day rolling)
    df['volatility'] = df['returns'].rolling(window=21, min_periods=5).std() * np.sqrt(252)
    
    # 3. Cumulative Returns
    # We fillna(0) for the product math so the first valid day works
    df['cum_return'] = (1 + df['returns'].fillna(0)).cumprod() - 1

    # This removes the "0 line" at the start of charts.
    df = df.dropna(subset=['volatility'])

    # Sanitization for JSON
    df = df.replace([np.inf, -np.inf], np.nan)
    df_final = df.where(pd.notnull(df), None)

    return {
        "history": df_final.to_dict(orient='records'),
        "last_price": float(df['adj_close'].iloc[-1]) if not df.empty else 0
    }
