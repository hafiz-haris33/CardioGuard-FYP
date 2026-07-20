from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.ai_agent import generate_ai_prediction
from app.services.pdf_generator import generate_pdf_base64

router = APIRouter()

# --- 1. Device Verification Endpoint ---
@router.post("/verify-device")
def verify_device(request: schemas.DeviceVerify, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.device_id == request.device_id).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Device not found. Please check the ID on your box."
        )
    
    if device.owner_uid is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This device is already registered by another user."
        )
    
    return {"status": "success", "message": "Device is valid and available for linking."}

# --- 2. User Registration & Device Linking Endpoint ---
@router.post("/register-user")
def register_user(request: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.uid == request.uid).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists in database.")

    device = db.query(models.Device).filter(models.Device.device_id == request.device_id).first()
    if not device or device.owner_uid is not None:
        raise HTTPException(status_code=400, detail="Device is unavailable or already linked.")

    new_user = models.User(
        uid=request.uid,
        email=request.email,
        full_name=request.full_name,
        emergency_contact=request.emergency_contact,
        gender=request.gender,
        age=request.age,
        weight=request.weight,
        height=request.height,
        blood_type=request.blood_type,
        profile_pic=request.profile_pic,
        medical_conditions=request.medical_conditions
    )
    db.add(new_user)
    
    device.owner_uid = request.uid
    device.is_active = True
    
    db.commit()
    db.refresh(new_user)
    
    return {"status": "success", "message": "User registered and device linked successfully!"}

# --- 3. Get User Profile Endpoint ---
@router.get("/user/{uid}", response_model=schemas.UserResponse)
def get_user_profile(uid: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    return user

# --- 4. Update User Profile Endpoint ---
@router.put("/user/update/{uid}")
def update_user_profile(uid: str, request: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.full_name is not None: user.full_name = request.full_name
    if request.age is not None: user.age = request.age
    if request.gender is not None: user.gender = request.gender
    if request.weight is not None: user.weight = request.weight
    if request.height is not None: user.height = request.height
    if request.blood_type is not None: user.blood_type = request.blood_type
    if request.profile_pic is not None: user.profile_pic = request.profile_pic
    if request.emergency_contact is not None: user.emergency_contact = request.emergency_contact

    db.commit()
    return {"status": "success", "message": "Profile updated successfully"}

# --- 5. Save Dangerous Event Endpoint ---
@router.post("/events")
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    event_time = datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
    
    new_event = models.DangerousEvent(
        user_id=event.user_id,
        device_id=event.device_id,
        heart_rate=event.heart_rate,
        spo2=event.spo2,
        issue=event.issue,
        timestamp=event_time
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return {"status": "success", "message": "Dangerous event permanently saved!"}

# --- 6. Get User Dangerous Events Endpoint ---
@router.get("/events/{user_id}")
def get_user_events(user_id: str, db: Session = Depends(get_db)):
    events = db.query(models.DangerousEvent).filter(
        models.DangerousEvent.user_id == user_id
    ).order_by(models.DangerousEvent.timestamp.desc()).all()
    
    return events

# --- 7. Generate AI Prediction & PDF Report Endpoint ---
@router.get("/generate-report/{uid}")
def generate_health_report(uid: str, alert_reason: str = "Routine_Health_Report", db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    events = db.query(models.DangerousEvent).filter(
        models.DangerousEvent.user_id == uid
    ).order_by(models.DangerousEvent.timestamp.desc()).limit(50).all()

    user_profile = {
        "full_name": user.full_name,
        "age": user.age,
        "weight": user.weight,
        "gender": user.gender,
        "blood_type": user.blood_type,
        "medical_conditions": user.medical_conditions,
        "emergency_contact": user.emergency_contact
    }

    recent_events = []
    for ev in events:
        recent_events.append({
            "issue": ev.issue,
            "heart_rate": ev.heart_rate,
            "spo2": ev.spo2,
            "timestamp": str(ev.timestamp)
        })

    # AI Agent ko reason pass kar diya
    agent_response = generate_ai_prediction(user_profile, recent_events, alert_reason=alert_reason)

    return {
        "status": "success",
        "prediction": agent_response["prediction_output"],
        "pdf_base64": agent_response["pdf_base64"],
        "alert_sent": agent_response["alert_sent"]
    }


# ==========================================
# 🔥 ADMIN DASHBOARD ENDPOINTS 🔥
# ==========================================

# 1. Admin Stats Endpoint (Total Patients, Free/Active Devices)
@router.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_patients = db.query(models.User).count()
    total_devices = db.query(models.Device).count()
    active_devices = db.query(models.Device).filter(models.Device.owner_uid != None).count()
    free_devices = db.query(models.Device).filter(models.Device.owner_uid == None).count()
    total_alerts = db.query(models.DangerousEvent).count()

    return {
        "total_patients": total_patients,
        "total_devices": total_devices,
        "active_devices": active_devices,
        "free_devices": free_devices,
        "total_alerts": total_alerts
    }

# 2. Get All Patients List
@router.get("/admin/patients")
def get_all_patients(db: Session = Depends(get_db)):
    patients = db.query(models.User).all()
    patient_list = []
    for p in patients:
        # Check karna ke is user ke sath konsi device link hai
        device = db.query(models.Device).filter(models.Device.owner_uid == p.uid).first()
        patient_list.append({
            "uid": p.uid,
            "full_name": p.full_name,
            "email": p.email,
            "age": p.age,
            "gender": p.gender,
            "device_id": device.device_id if device else "No Device Linked"
        })
    return patient_list

# 3. Get All Devices List (Inventory Management)
@router.get("/admin/devices")
def get_all_devices(db: Session = Depends(get_db)):
    devices = db.query(models.Device).all()
    device_list = []
    for d in devices:
        owner_name = "None"
        if d.owner_uid:
            owner = db.query(models.User).filter(models.User.uid == d.owner_uid).first()
            if owner:
                owner_name = owner.full_name
                
        device_list.append({
            "device_id": d.device_id,
            "is_active": d.is_active,
            "owner_uid": d.owner_uid,
            "owner_name": owner_name
        })
    return device_list

# 4. Admin Action: Unlink Device from Patient
@router.post("/admin/unlink-device/{device_id}")
def unlink_device(device_id: str, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.owner_uid = None
    device.is_active = False
    db.commit()
    return {"status": "success", "message": "Device unlinked and returned to inventory successfully!"}

# 5. Admin Action: Delete Patient Account
@router.delete("/admin/delete-patient/{uid}")
def delete_patient(uid: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.uid == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Device ko bhi free karo agar link thi
    device = db.query(models.Device).filter(models.Device.owner_uid == uid).first()
    if device:
        device.owner_uid = None
        device.is_active = False
        
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "Patient records permanently deleted."}


# 6. Admin Action: Add New Device to Inventory
@router.post("/admin/add-device/{device_id}")
def add_device(device_id: str, db: Session = Depends(get_db)):
    existing = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device already exists in inventory")
    
    # Nayi device by default "free" (is_active=False, owner_uid=None) hogi
    new_device = models.Device(device_id=device_id, is_active=False, owner_uid=None)
    db.add(new_device)
    db.commit()
    return {"status": "success", "message": "New device added to inventory successfully!"}