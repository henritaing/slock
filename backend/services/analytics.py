import pandas as pd
import numpy as np

def calculate_metrics(df: pd.DataFrame):
    # 1. Sort and Calculate basic returns
    df = df.sort_values('date')
    df['returns'] = df['adj_close'].pct_change().fillna(0)
    
    # 2. Calculate Cumulative Returns (Indexed to 0%)
    # We add 1 to returns, take the running product, then subtract 1
    df['cum_return'] = (1 + df['returns']).cumprod() - 1
    
    # 3. Volatility (Annualized 21-day rolling)
    df['volatility'] = df['returns'].rolling(window=21).std() * np.sqrt(252)
    
    # 4. RSI (14-day)
    delta = df['adj_close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # 5. Aggressive Sanitization for JSON compliance
    df = df.replace([np.inf, -np.inf], np.nan)
    
    # Convert to object to allow 'None' (JSON null)
    df_objects = df.astype(object)
    df_final = df_objects.where(pd.notnull(df_objects), None)
    
    return df_final.to_dict(orient='records')