from fastapi import APIRouter

router = APIRouter()

GPS_SETTINGS = {
    "latitude": 39.5696,
    "longitude": 2.6502,
    "radius_meters": 150,
}

@router.get("/gps")
async def get_gps_settings():
    return GPS_SETTINGS

