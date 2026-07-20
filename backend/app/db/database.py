from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# .env file ko load karna
load_dotenv()

# Database URL get karna
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Engine database ke sath connection banata he
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session database me queries run karne ke kaam ata he
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class jis se humare sare database tables (models) banen ge
Base = declarative_base()

# Dependency: Jab bhi API call hogi, ye function naya database session dega aur end me close kar dega
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()