import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "almar_sign")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI no configurado")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
