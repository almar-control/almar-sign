from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
router = APIRouter()

records = []

class RecordRequest(BaseModel):
    email: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    device: Optional[str] = None

def validate_gps(data: RecordRequest):
    if data.latitude == 0 or data.longitude == 0:
        raise HTTPException(status_code=400, detail="GPS inválido")

def get_last_record(email: str):
    user_records = [r for r in records if r["email"] == email]
    if not user_records:
        return None
    return user_records[-1]

@router.post("/check-in")
async def check_in(data: RecordRequest):
    validate_gps(data)

    last_record = get_last_record(data.email)

    if last_record and last_record["type"] == "in":
        raise HTTPException(status_code=400, detail="Ya existe una entrada abierta")

    record = {
        "id": len(records) + 1,
        "email": data.email,
        "type": "in",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "valid",
    }

    records.append(record)

    return {
        "success": True,
        "record": record,
    }

@router.post("/check-out")
async def check_out(data: RecordRequest):
    validate_gps(data)

    last_record = get_last_record(data.email)

    if not last_record:
        raise HTTPException(status_code=400, detail="No existe entrada previa")

    if last_record["type"] == "out":
        raise HTTPException(status_code=400, detail="Ya existe una salida registrada")

    record = {
        "id": len(records) + 1,
        "email": data.email,
        "type": "out",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "valid",
    }

    records.append(record)

    return {
        "success": True,
        "record": record,
    }

@router.get("")
async def list_records():
    return {
        "records": records,
    }

