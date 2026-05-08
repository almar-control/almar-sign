from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import db

router = APIRouter()


class RecordRequest(BaseModel):
    email: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    device: Optional[str] = None


def serialize_record(record):
    record["id"] = str(record["_id"])
    del record["_id"]
    return record


def validate_gps(data: RecordRequest):
    if data.latitude == 0 or data.longitude == 0:
        raise HTTPException(status_code=400, detail="GPS inválido")


async def get_last_record(email: str):
    return await db.records.find_one(
        {"email": email},
        sort=[("created_at", -1)]
    )


@router.post("/check-in")
async def check_in(data: RecordRequest):
    validate_gps(data)

    last_record = await get_last_record(data.email)

    if last_record and last_record["type"] == "in":
        raise HTTPException(
            status_code=400,
            detail="Ya existe una entrada abierta"
        )

    now = datetime.now(timezone.utc)

    record = {
        "email": data.email,
        "type": "in",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": now.isoformat(),
        "created_at": now,
        "status": "valid",
    }

    result = await db.records.insert_one(record)
    record["_id"] = result.inserted_id

    return {
        "success": True,
        "record": serialize_record(record),
    }


@router.post("/check-out")
async def check_out(data: RecordRequest):
    validate_gps(data)

    last_record = await get_last_record(data.email)

    if not last_record:
        raise HTTPException(
            status_code=400,
            detail="No existe entrada previa"
        )

    if last_record["type"] == "out":
        raise HTTPException(
            status_code=400,
            detail="Ya existe una salida registrada"
        )

    now = datetime.now(timezone.utc)

    record = {
        "email": data.email,
        "type": "out",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": now.isoformat(),
        "created_at": now,
        "status": "valid",
    }

    result = await db.records.insert_one(record)
    record["_id"] = result.inserted_id

    return {
        "success": True,
        "record": serialize_record(record),
    }


@router.get("")
async def list_records():
    cursor = db.records.find().sort("created_at", -1).limit(100)
    records = []

    async for record in cursor:
        records.append(serialize_record(record))

    return {
        "records": records,
    }
