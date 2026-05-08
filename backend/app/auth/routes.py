from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import db

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


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
        "name": user.get("name", "")
    }
