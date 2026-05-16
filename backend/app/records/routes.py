from datetime import datetime, timezone
from math import atan2, cos, radians, sin, sqrt
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


def calculate_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float):
    earth_radius_meters = 6371000

    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)

    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return round(earth_radius_meters * c, 2)


async def get_active_workplace():
    company = await db.companies.find_one({"active": True}, sort=[("created_at", 1)])

    if not company:
        return None

    return await db.workplaces.find_one(
        {"company_id": str(company["_id"]), "active": True},
        sort=[("created_at", 1)]
    )


async def build_gps_status(data: RecordRequest):
    workplace = await get_active_workplace()

    if not workplace:
        return {
            "status": "review",
            "status_reason": "Centro activo no configurado",
            "distance_meters": None,
            "allowed_radius_meters": None,
        }

    workplace_latitude = workplace.get("latitude")
    workplace_longitude = workplace.get("longitude")
    allowed_radius = workplace.get("radius_meters", 0)

    if not workplace_latitude or not workplace_longitude or not allowed_radius:
        return {
            "status": "review",
            "status_reason": "GPS del centro incompleto",
            "distance_meters": None,
            "allowed_radius_meters": allowed_radius,
        }

    distance = calculate_distance_meters(
        workplace_latitude,
        workplace_longitude,
        data.latitude,
        data.longitude,
    )

    if distance > allowed_radius:
        return {
            "status": "review",
            "status_reason": "Fuera de zona",
            "distance_meters": distance,
            "allowed_radius_meters": allowed_radius,
        }

    return {
        "status": "valid",
        "status_reason": "Dentro de zona",
        "distance_meters": distance,
        "allowed_radius_meters": allowed_radius,
    }


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
    gps_status = await build_gps_status(data)

    record = {
        "email": data.email,
        "type": "in",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": now.isoformat(),
        "created_at": now,
        "status": gps_status["status"],
        "status_reason": gps_status["status_reason"],
        "distance_meters": gps_status["distance_meters"],
        "allowed_radius_meters": gps_status["allowed_radius_meters"],
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
    gps_status = await build_gps_status(data)

    record = {
        "email": data.email,
        "type": "out",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "accuracy": data.accuracy,
        "device": data.device,
        "timestamp": now.isoformat(),
        "created_at": now,
        "status": gps_status["status"],
        "status_reason": gps_status["status_reason"],
        "distance_meters": gps_status["distance_meters"],
        "allowed_radius_meters": gps_status["allowed_radius_meters"],
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
