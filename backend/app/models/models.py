from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

# --- User Ka Table ---
class User(Base):
    __tablename__ = "users"

    # Firebase UID humari Primary Key hogi
    uid = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    emergency_contact = Column(String)

    # Profile Setup wala data
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Integer, nullable=True)
    blood_type = Column(String, nullable=True) # Naya column
    profile_pic = Column(String, nullable=True) # Naya column (Image ka URL save karne ke liye)
    medical_conditions = Column(String, nullable=True) 

    # Device ke sath link
    device = relationship("Device", back_populates="owner")


# --- Device Ka Table ---
class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String, primary_key=True, index=True)
    owner_uid = Column(String, ForeignKey("users.uid"), nullable=True)
    is_active = Column(Boolean, default=False)

    owner = relationship("User", back_populates="device")


class DangerousEvent(Base):
    __tablename__ = "dangerous_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Firebase ka UID yahan aayega
    device_id = Column(String)
    heart_rate = Column(Float)
    spo2 = Column(Float)
    issue = Column(String) # "Low Blood Oxygen", "High Heart Rate" waghera
    timestamp = Column(DateTime, default=datetime.utcnow)