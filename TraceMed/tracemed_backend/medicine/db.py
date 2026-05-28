# medicine/db.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient, errors

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB") or os.getenv("MONGO_DB_NAME", "tracemed")

_client = None
_db = None

def get_client():
    global _client, _db
    if _client is None:
        if not MONGO_URI:
            raise RuntimeError("MONGO_URI not set")
        try:
            _client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
                maxPoolSize=100
            )
            _client.admin.command("ping")
            _db = _client[MONGO_DB]
        except (errors.ServerSelectionTimeoutError, errors.ConfigurationError) as e:
            raise RuntimeError(f"Cannot connect to MongoDB: {e}")
    return _client

def get_db():
    if _db is None:
        get_client()
    return _db

def get_collection(name):
    db = get_db()
    return db[name]
