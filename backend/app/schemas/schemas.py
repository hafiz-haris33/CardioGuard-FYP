from pydantic import BaseModel
from typing import Optional

# Device verify karne ke liye
class DeviceVerify(BaseModel):
    device_id: str

# User register karte waqt aane wala data
class UserCreate(BaseModel):
    uid: str  
    email: str
    full_name: str
    emergency_contact: str
    gender: str
    age: int
    weight: float
    height: int
    blood_type: Optional[str] = None # Optional banaya hai
    profile_pic: Optional[str] = None # Optional banaya hai
    medical_conditions: Optional[str] = None
    device_id: str

# NAYA SCHEMA: Frontend par data wapis bhejne ke liye (Profile fetch karne ke liye)
class UserResponse(BaseModel):
    uid: str
    email: str
    full_name: str
    emergency_contact: str
    gender: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[int] = None
    blood_type: Optional[str] = None
    profile_pic: Optional[str] = None
    medical_conditions: Optional[str] = None

    class Config:
        from_attributes = True


# Naya schema Update ke liye
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[int] = None
    blood_type: Optional[str] = None
    profile_pic: Optional[str] = None
    emergency_contact: Optional[str] = None

class EventCreate(BaseModel):
    user_id: str
    device_id: str
    heart_rate: float
    spo2: float
    issue: str
    timestamp: str