from datetime import datetime

from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


def serialize_record(record):
    record["id"] = str(record["_id"])
    del record["_id"]

    return record


@router.get("/records")
async def get_all_records():
    cursor = (
        db.records
        .find()
        .sort("created_at", -1)
        .limit(200)
    )

    records = []

    async for record in cursor:
        records.append(
            serialize_record(record)
        )

    return {
        "records": records
    }


@router.get("/hours/{email}")
async def get_hours(email: str):
    cursor = (
        db.records
        .find({
            "email": email
        })
        .sort("created_at", 1)
    )

    records = []

    async for record in cursor:
        records.append(record)

    total_seconds = 0

    current_in = None

    for record in records:
        if record["type"] == "in":
            current_in = datetime.fromisoformat(
                record["timestamp"]
            )

        elif (
            record["type"] == "out"
            and current_in
        ):
            current_out = datetime.fromisoformat(
                record["timestamp"]
            )

            total_seconds += (
                current_out - current_in
            ).total_seconds()

            current_in = None

    total_hours = round(
        total_seconds / 3600,
        2
    )

    return {
        "email": email,
        "hours": total_hours
    }

