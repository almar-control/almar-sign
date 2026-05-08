import asyncio
from datetime import datetime

from app.core.database import db


async def seed_users():
    company = await db.companies.find_one({
        "name": "ALMAR"
    })

    workplace = await db.workplaces.find_one({
        "name": "ALMAR Beach"
    })

    if not company or not workplace:
        print("Falta empresa o workplace")
        return

    users = [
        {
            "email": "admin@almar.com",
            "password": "123456",
            "role": "admin",
            "name": "Admin ALMAR",
            "company_id": str(company["_id"]),
            "workplace_id": str(workplace["_id"]),
            "weekly_hours": 40,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
        },
        {
            "email": "worker@almar.com",
            "password": "123456",
            "role": "worker",
            "name": "Worker ALMAR",
            "company_id": str(company["_id"]),
            "workplace_id": str(workplace["_id"]),
            "weekly_hours": 40,
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

    print("Usuarios actualizados")


if __name__ == "__main__":
    asyncio.run(seed_users())
