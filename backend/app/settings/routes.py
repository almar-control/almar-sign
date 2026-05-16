from fastapi import APIRouter, HTTPException

from app.core.database import db

router = APIRouter()


@router.get("/gps")
async def get_gps_settings():
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
        "latitude": workplace.get("latitude", 0),
        "longitude": workplace.get("longitude", 0),
        "radius_meters": workplace.get("radius_meters", 0),
    }
