from fastapi import APIRouter

router = APIRouter()

GPS_SETTINGS = {
    "latitude": 41.4225323,
    "longitude": 2.2314079,
    "radius_meters": 150,
}

@router.get("/gps")
async def get_gps_settings():
    return GPS_SETTINGS
