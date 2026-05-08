from fastapi import FastAPI
from app.auth.routes import router as auth_router
from app.records.routes import router as records_router
from app.core.database import db

app = FastAPI(title="ALMAR Sign API")

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"]
)

app.include_router(
    records_router,
    prefix="/records",
    tags=["records"]
)

@app.get("/health")
async def health():
    await db.command("ping")

    return {
        "status": "ok",
        "database": "connected"
    }
