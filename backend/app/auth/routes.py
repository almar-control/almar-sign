from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(data: LoginRequest):

    users = [
        {
            "email": "admin@almar.com",
            "password": "123456",
            "role": "admin"
        },
        {
            "email": "worker@almar.com",
            "password": "123456",
            "role": "worker"
        }
    ]

    user = next(
        (
            u for u in users
            if u["email"] == data.email
            and u["password"] == data.password
        ),
        None
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
        "success": True,
        "role": user["role"],
        "email": user["email"]
    }

