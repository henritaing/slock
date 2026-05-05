import pandas as pd
import numpy as np

def calculate_metrics(df: pd.DataFrame):
    # 1. Sort and Calculate basic returns
    df = df.sort_values('date')
    df['returns'] = df['adj_close'].pct_change()
    
    # 2. Volatility (Annualized 21-day rolling)
    # min_periods=5 allows the line to start sooner but dropna() below 
    # ensures we don't send incomplete data to the frontend.
    df['volatility'] = df['returns'].rolling(window=21, min_periods=5).std() * np.sqrt(252)
    
    # 4. Cumulative Returns
    # We fillna(0) for the product math so the first valid day works
    df['cum_return'] = (1 + df['returns'].fillna(0)).cumprod() - 1

    # --- CLEANUP ---
    
    # This removes the "0 line" at the start of charts.
    df = df.dropna(subset=['volatility'])

    # 5. Sanitization for JSON
    df = df.replace([np.inf, -np.inf], np.nan)
    df_objects = df.astype(object)
    df_final = df_objects.where(pd.notnull(df_objects), None)

    return {
        "history": df_final.to_dict(orient='records'),
        "last_price": float(df['adj_close'].iloc[-1]) if not df.empty else 0
    }

def calculate_portfolio_beta(portfolio_returns: pd.Series, benchmark_returns: pd.Series):
    try:
        combined = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
        if len(combined) < 5:
            return 1.0
            
        covariance = np.cov(combined.iloc[:, 0], combined.iloc[:, 1])[0][1]
        benchmark_variance = np.var(combined.iloc[:, 1])
        
        return float(covariance / benchmark_variance) if benchmark_variance != 0 else 1.0
    except Exception:
        return 1.0