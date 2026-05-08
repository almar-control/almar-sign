import asyncio
from datetime import datetime

from app.core.database import db


async def seed_users():
    users = [
        {
            "email": "admin@almar.com",
            "password": "123456",
            "role": "admin",
            "name": "Admin ALMAR",
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
        },
        {
            "email": "worker@almar.com",
            "password": "123456",
            "role": "worker",
            "name": "Worker ALMAR",
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
        },
    ]

    for user in users:
        await db.users.update_one(
            {"email": user["email"]},
            {"$set": user},
            upsert=True,
        )

    print("Usuarios iniciales creados/actualizados")


if __name__ == "__main__":
    asyncio.run(seed_users())
