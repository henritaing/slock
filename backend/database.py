from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Float, Date, Text, DateTime
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import uuid


def utcnow():
    return datetime.now(timezone.utc)


DATABASE_URL = "sqlite:///./cache.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 15}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

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
    volume = Column(Float, nullable=True)   
    target_price = Column(Float, nullable=True)
    target_date = Column(String, nullable=True)  
    reason = Column(Text, nullable=True)     
    notes = Column(Text, nullable=True)      
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

class EarningsCache(Base):
    __tablename__ = "earnings_cache"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticker = Column(String, index=True)
    event_type = Column(String)          # "earnings", "exdividend", "dividend"
    event_date = Column(Date, nullable=True)
    fetched_at = Column(DateTime(timezone=True), default=utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)