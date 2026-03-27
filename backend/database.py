from sqlalchemy import create_engine, Column, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./cache.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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

def init_db():
    Base.metadata.create_all(bind=engine)