from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import db

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str


@router.post("/login")
async def login(data: LoginRequest):
    email = data.email.strip().lower()

    user = await db.users.find_one({
        "email": email,
        "password": data.password,
        "active": True,
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "success": True,
        "role": user["role"],
        "email": user["email"],
        "name": user.get("name", ""),
        "company_id": user.get("company_id", ""),
        "workplace_id": user.get("workplace_id", ""),
        "weekly_hours": user.get("weekly_hours", 0),
    }



@router.post("/change-password")
async def change_password(data: ChangePasswordRequest):
    email = data.email.strip().lower()

    if not data.current_password or not data.new_password:
        raise HTTPException(status_code=400, detail="Contraseña actual y nueva son obligatorias")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener mínimo 4 caracteres")

    user = await db.users.find_one({
        "email": email,
        "password": data.current_password,
        "active": True,
    })

    if not user:
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    await db.users.update_one(
        {"email": email},
        {"$set": {"password": data.new_password}}
    )

    return {
        "success": True,
        "email": email,
    }
