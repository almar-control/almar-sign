from fastapi import FastAPI

app = FastAPI(title="ALMAR Sign API")

@app.get("/health")
async def health():
    return {
        "status": "ok"
    }
