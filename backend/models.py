from pydantic import BaseModel
from typing import List, Optional

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