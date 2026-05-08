from datetime import datetime
import csv
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.database import db

router = APIRouter()



class CreateWorkplaceRequest(BaseModel):
    company_id: str
    name: str
    latitude: float
    longitude: float
    radius_meters: int = 100



class UpdateUserContractRequest(BaseModel):
    weekly_hours: float
    company_id: str = ""
    workplace_id: str = ""


class CreateCompanyRequest(BaseModel):
    name: str
    tax_id: str = ""


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


@router.get("/companies")
async def get_companies():
    cursor = (
        db.companies
        .find()
        .sort("name", 1)
    )

    companies = []

    async for company in cursor:
        company["id"] = str(company["_id"])
        del company["_id"]
        companies.append(company)

    return {
        "companies": companies
    }


@router.post("/companies")
async def create_company(data: CreateCompanyRequest):
    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Nombre empresa obligatorio"
        )

    existing = await db.companies.find_one({
        "name": name
    })

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Empresa ya existe"
        )

    company = {
        "name": name,
        "tax_id": data.tax_id,
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.companies.insert_one(company)

    return {
        "success": True,
        "id": str(result.inserted_id),
        "name": name
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


@router.get("/workplaces")
async def get_workplaces():
    cursor = (
        db.workplaces
        .find()
        .sort("name", 1)
    )

    workplaces = []

    async for workplace in cursor:
        workplace["id"] = str(workplace["_id"])
        del workplace["_id"]
        workplaces.append(workplace)

    return {
        "workplaces": workplaces
    }


@router.post("/workplaces")
async def create_workplace(data: CreateWorkplaceRequest):
    existing = await db.workplaces.find_one({
        "name": data.name
    })

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Centro ya existe"
        )

    workplace = {
        "company_id": data.company_id,
        "name": data.name,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "radius_meters": data.radius_meters,
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.workplaces.insert_one(workplace)

    return {
        "success": True,
        "id": str(result.inserted_id),
        "name": data.name
    }


@router.patch("/users/{email}/contract")
async def update_user_contract(email: str, data: UpdateUserContractRequest):
    clean_email = email.strip().lower()

    update_data = {
        "weekly_hours": data.weekly_hours,
        "updated_at": datetime.utcnow().isoformat(),
    }

    if data.company_id:
        update_data["company_id"] = data.company_id

    if data.workplace_id:
        update_data["workplace_id"] = data.workplace_id

    result = await db.users.update_one(
        {"email": clean_email},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return {
        "success": True,
        "email": clean_email,
        "weekly_hours": data.weekly_hours,
        "company_id": data.company_id,
        "workplace_id": data.workplace_id,
    }


@router.get("/users")
async def get_users():
    cursor = (
        db.users
        .find({}, {"password": 0})
        .sort("email", 1)
    )

    users = []

    async for user in cursor:
        user["id"] = str(user["_id"])
        del user["_id"]
        users.append(user)

    return {
        "users": users
    }
