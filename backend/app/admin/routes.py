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
    cursor = (
        db.users
        .find({"role": "worker"})
        .sort("email", 1)
    )

    workers = []

    async for user in cursor:
        email = user.get("email", "")

        last_record = await db.records.find_one(
            {"email": email},
            sort=[("created_at", -1)]
        )

        workers.append({
            "email": email,
            "name": user.get("name", ""),
            "role": user.get("role", ""),
            "active": user.get("active", False),
            "company_id": user.get("company_id", ""),
            "workplace_id": user.get("workplace_id", ""),
            "weekly_hours": user.get("weekly_hours", 0),
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


@router.get("/settings/company-workplace")
async def get_company_workplace_settings():
    company = await db.companies.find_one({"active": True}, sort=[("created_at", 1)])

    if not company:
        raise HTTPException(status_code=404, detail="Empresa activa no encontrada")

    workplace = await db.workplaces.find_one(
        {"company_id": str(company["_id"]), "active": True},
        sort=[("created_at", 1)]
    )

    if not workplace:
        raise HTTPException(status_code=404, detail="Centro activo no encontrado")

    return {
        "company_id": str(company["_id"]),
        "company_name": company.get("name", ""),
        "workplace_id": str(workplace["_id"]),
        "workplace_name": workplace.get("name", ""),
        "latitude": workplace.get("latitude", 0),
        "longitude": workplace.get("longitude", 0),
        "radius_meters": workplace.get("radius_meters", 0),
    }


@router.patch("/settings/company-workplace")
async def update_company_workplace_settings(data: UpdateCompanyWorkplaceRequest):
    company = await db.companies.find_one({"active": True}, sort=[("created_at", 1)])

    if not company:
        raise HTTPException(status_code=404, detail="Empresa activa no encontrada")

    workplace = await db.workplaces.find_one(
        {"company_id": str(company["_id"]), "active": True},
        sort=[("created_at", 1)]
    )

    if not workplace:
        raise HTTPException(status_code=404, detail="Centro activo no encontrado")

    if not data.company_name.strip() or not data.workplace_name.strip():
        raise HTTPException(status_code=400, detail="Empresa y centro son obligatorios")

    if data.latitude == 0 or data.longitude == 0:
        raise HTTPException(status_code=400, detail="GPS inválido")

    if data.radius_meters <= 0:
        raise HTTPException(status_code=400, detail="Radio GPS inválido")

    now = datetime.utcnow().isoformat()

    await db.companies.update_one(
        {"_id": company["_id"]},
        {"$set": {
            "name": data.company_name.strip(),
            "updated_at": now,
        }}
    )

    await db.workplaces.update_one(
        {"_id": workplace["_id"]},
        {"$set": {
            "name": data.workplace_name.strip(),
            "latitude": data.latitude,
            "longitude": data.longitude,
            "radius_meters": data.radius_meters,
            "updated_at": now,
        }}
    )

    return {
        "success": True,
        "company_id": str(company["_id"]),
        "company_name": data.company_name.strip(),
        "workplace_id": str(workplace["_id"]),
        "workplace_name": data.workplace_name.strip(),
        "latitude": data.latitude,
        "longitude": data.longitude,
        "radius_meters": data.radius_meters,
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



class UpdateCompanyWorkplaceRequest(BaseModel):
    company_name: str
    workplace_name: str
    latitude: float
    longitude: float
    radius_meters: int


class UpdateUserActiveRequest(BaseModel):
    active: bool


@router.patch("/users/{email}/active")
async def toggle_user_active(email: str, data: UpdateUserActiveRequest):
    clean_email = email.strip().lower()

    result = await db.users.update_one(
        {"email": clean_email},
        {"$set": {
            "active": data.active,
            "updated_at": datetime.utcnow().isoformat(),
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return {
        "success": True,
        "email": clean_email,
        "active": data.active
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


class CreateUserRequest(BaseModel):
    email: str
    password: str

    name: str
    surname: str = ""
    dni: str = ""

    phone: str = ""
    address: str = ""
    profile_photo_url: str = ""
    social_security_number: str = ""

    role: str = "worker"
    company_id: str = ""
    workplace_id: str = ""
    department: str = ""
    job_category: str = ""
    active: bool = True

    contract_type: str = ""
    contract_start_date: str = ""
    contract_end_date: str = ""

    weekly_hours: float = 40
    base_salary: float = 0
    salary_type: str = "monthly"

    hourly_rate: float = 0
    overtime_rate: float = 0
    holiday_rate: float = 0

    iban: str = ""
    tax_withholding_percent: float = 0
    social_security_group: str = ""
    collective_agreement: str = ""
    extra_payments: int = 12

    overtime_hours: float = 0
    holiday_hours: float = 0
    night_hours: float = 0

    bonus_amount: float = 0
    deductions_amount: float = 0

    expected_hours: float = 0
    absence_hours: float = 0

    vacation_days: float = 0
    sick_leave_days: float = 0


@router.post("/users")
async def create_user(data: CreateUserRequest):
    email = data.email.strip().lower()
    dni = data.dni.strip().upper().replace(" ", "")

    if not email or not data.password or not data.name:
        raise HTTPException(
            status_code=400,
            detail="Email, contraseña y nombre son obligatorios"
        )

    if data.role not in ["admin", "worker"]:
        raise HTTPException(
            status_code=400,
            detail="Role no válido"
        )

    existing_email = await db.users.find_one({"email": email})

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="El email ya existe"
        )

    if dni:
        existing_dni = await db.users.find_one({"dni": dni})

        if existing_dni:
            raise HTTPException(
                status_code=409,
                detail="El DNI/NIE ya existe"
            )

    user = {
        "email": email,
        "password": data.password,

        "name": data.name.strip(),
        "surname": data.surname.strip(),
        "dni": dni,

        "phone": data.phone.strip(),
        "address": data.address.strip(),
        "profile_photo_url": data.profile_photo_url.strip(),
        "social_security_number": data.social_security_number.strip(),

        "role": data.role,
        "company_id": data.company_id,
        "workplace_id": data.workplace_id,
        "department": data.department.strip(),
        "job_category": data.job_category.strip(),
        "active": data.active,

        "contract_type": data.contract_type.strip(),
        "contract_start_date": data.contract_start_date.strip(),
        "contract_end_date": data.contract_end_date.strip(),

        "weekly_hours": data.weekly_hours,
        "base_salary": data.base_salary,
        "salary_type": data.salary_type,

        "hourly_rate": data.hourly_rate,
        "overtime_rate": data.overtime_rate,
        "holiday_rate": data.holiday_rate,

        "iban": data.iban.strip(),
        "tax_withholding_percent": data.tax_withholding_percent,
        "social_security_group": data.social_security_group.strip(),
        "collective_agreement": data.collective_agreement.strip(),
        "extra_payments": data.extra_payments,

        "overtime_hours": data.overtime_hours,
        "holiday_hours": data.holiday_hours,
        "night_hours": data.night_hours,

        "bonus_amount": data.bonus_amount,
        "deductions_amount": data.deductions_amount,

        "expected_hours": data.expected_hours,
        "absence_hours": data.absence_hours,

        "vacation_days": data.vacation_days,
        "sick_leave_days": data.sick_leave_days,

        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.users.insert_one(user)

    return {
        "success": True,
        "id": str(result.inserted_id),
        "email": email,
        "name": user["name"],
        "surname": user["surname"],
        "dni": dni,
        "role": data.role,
        "weekly_hours": data.weekly_hours,
        "active": True
    }
