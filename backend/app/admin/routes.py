from datetime import datetime
import csv
import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.database import db

router = APIRouter()


def serialize_record(record):
    record["id"] = str(record["_id"])
    del record["_id"]
    return record


async def calculate_hours(email: str):
    cursor = (
        db.records
        .find({"email": email})
        .sort("created_at", 1)
    )

    records = []

    async for record in cursor:
        records.append(record)

    total_seconds = 0
    current_in = None

    for record in records:
        if record["type"] == "in":
            current_in = datetime.fromisoformat(record["timestamp"])

        elif record["type"] == "out" and current_in:
            current_out = datetime.fromisoformat(record["timestamp"])
            total_seconds += (current_out - current_in).total_seconds()
            current_in = None

    return round(total_seconds / 3600, 2)


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
        records.append(serialize_record(record))

    return {
        "records": records
    }


@router.get("/hours/{email}")
async def get_hours(email: str):
    return {
        "email": email,
        "hours": await calculate_hours(email)
    }


@router.get("/workers")
async def get_workers():
    emails = await db.records.distinct("email")

    workers = []

    for email in sorted(emails):
        last_record = await db.records.find_one(
            {"email": email},
            sort=[("created_at", -1)]
        )

        workers.append({
            "email": email,
            "hours": await calculate_hours(email),
            "last_record": serialize_record(last_record) if last_record else None
        })

    return {
        "workers": workers,
        "total_workers": len(workers)
    }


@router.get("/summary")
async def get_admin_summary():
    total_records = await db.records.count_documents({})

    last_record = await db.records.find_one(
        {},
        sort=[("created_at", -1)]
    )

    emails = await db.records.distinct("email")

    total_hours = 0

    for email in emails:
        total_hours += await calculate_hours(email)

    return {
        "total_records": total_records,
        "active_workers": len(emails),
        "worker_hours": round(total_hours, 2),
        "last_record": serialize_record(last_record) if last_record else None
    }


@router.get("/export.csv")
async def export_records_csv():
    output = io.StringIO()

    writer = csv.writer(output)
    writer.writerow([
        "id",
        "email",
        "type",
        "timestamp",
        "latitude",
        "longitude",
        "accuracy",
        "device",
        "created_at",
    ])

    cursor = (
        db.records
        .find()
        .sort("created_at", -1)
    )

    async for record in cursor:
        writer.writerow([
            str(record.get("_id", "")),
            record.get("email", ""),
            record.get("type", ""),
            record.get("timestamp", ""),
            record.get("latitude", ""),
            record.get("longitude", ""),
            record.get("accuracy", ""),
            record.get("device", ""),
            record.get("created_at", ""),
        ])

    output.seek(0)

    filename = f"almar_sign_registros_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )
