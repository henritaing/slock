from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc)

from sqlalchemy import create_engine, Column, String, Float, Date, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid

DATABASE_URL = "sqlite:///./cache.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 15}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MarketCache(Base):
    __tablename__ = "market_cache"

    # Composite primary key: ticker + date
    ticker = Column(String, primary_key=True, index=True)
    date = Column(Date, primary_key=True, index=True)
    adj_close = Column(Float)
    sector = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    long_name = Column(String, nullable=True)

class JournalEntry(Base):
    __tablename__ = "journal"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lot_id = Column(String, index=True)      # matches portfolio[].id from frontend
    ticker = Column(String, index=True)
    bought_at = Column(Float)                # price at purchase
    target_price = Column(Float, nullable=True)
    target_date = Column(String, nullable=True)  # "YYYY-MM" is fine
    reason = Column(Text, nullable=True)     # why I bought
    notes = Column(Text, nullable=True)      # ongoing notes
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


    
class WatchlistItem(Base):
    __tablename__ = "watchlist"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticker = Column(String, index=True)
    entry_target = Column(Float, nullable=True)
    thesis = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)