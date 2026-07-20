from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import models
from app.api.endpoints import router as api_router # Naya import

# Tables banana
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CardioGuard API", version="1.0")

# Naye endpoints ko include karna
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to CardioGuard Backend API!"}