import os

from django.conf import settings
from dotenv import load_dotenv
from pymongo import MongoClient, errors

load_dotenv()

_client = None
_db = None


def get_mongo_uri():
    return os.getenv("MONGO_URI") or getattr(settings, "MONGO_URI", None)


def get_mongo_db_name():
    return (
        os.getenv("MONGO_DB")
        or os.getenv("MONGO_DB_NAME")
        or getattr(settings, "MONGO_DB_NAME", "tracemed")
    )

def get_client():
    global _client, _db
    if _client is not None and _db is not None:
        return _client

    mongo_uri = get_mongo_uri()
    mongo_db = get_mongo_db_name()

    if not mongo_uri:
        raise RuntimeError("MONGO_URI not set")

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            maxPoolSize=100,
        )
        client.admin.command("ping")
        _client = client
        _db = _client[mongo_db]
    except (
        errors.ServerSelectionTimeoutError,
        errors.ConfigurationError,
        errors.PyMongoError,
    ) as exc:
        _client = None
        _db = None
        raise RuntimeError(f"Cannot connect to MongoDB: {exc}") from exc

    return _client


def get_db():
    if _db is None:
        get_client()
    if _db is None:
        raise RuntimeError("MongoDB database is not initialized")
    return _db


def get_collection(name):
    db = get_db()
    return db[name]
