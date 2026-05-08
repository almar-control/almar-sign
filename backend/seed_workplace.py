import asyncio
from datetime import datetime

from app.core.database import db


async def seed_workplace():
    company = await db.companies.find_one({
        "name": "ALMAR"
    })

    if not company:
        print("Empresa ALMAR no encontrada")
        return

    workplace = {
        "company_id": str(company["_id"]),
        "name": "ALMAR Beach",
        "latitude": 41.41017981518043,
        "longitude": 2.2134285797996123,
        "radius_meters": 100,
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }

    await db.workplaces.update_one(
        {"name": "ALMAR Beach"},
        {"$set": workplace},
        upsert=True,
    )

    print("Centro de trabajo creado")


if __name__ == "__main__":
    asyncio.run(seed_workplace())
