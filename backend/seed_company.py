import asyncio
from datetime import datetime

from app.core.database import db


async def seed_company():
    company = {
        "name": "ALMAR",
        "tax_id": "",
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.companies.update_one(
        {"name": "ALMAR"},
        {"$set": company},
        upsert=True,
    )

    print("Empresa ALMAR creada/actualizada")
    print(result.raw_result)


if __name__ == "__main__":
    asyncio.run(seed_company())
