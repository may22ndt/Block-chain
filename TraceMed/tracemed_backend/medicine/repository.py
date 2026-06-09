from bson import ObjectId
from django.utils import timezone

from .db import get_collection


class LazyMongoCollection:
    """Delay MongoDB connection until a collection method is actually used."""

    def __init__(self, collection_name):
        self.collection_name = collection_name

    def _get_collection(self):
        return get_collection(self.collection_name)

    def __getattr__(self, name):
        return getattr(self._get_collection(), name)


class BaseMongoRepository:
    """Thin repository wrapper around a MongoDB collection."""

    collection_name = None

    def __init__(self):
        if not self.collection_name:
            raise ValueError("collection_name must be defined")
        self.collection = LazyMongoCollection(self.collection_name)

    def _normalize_document(self, document):
        if not document:
            return None
        if "_id" in document and isinstance(document["_id"], ObjectId):
            document["_id"] = str(document["_id"])
        return document

    def create(self, data):
        payload = dict(data)
        payload.setdefault("created_at", timezone.now())
        payload.setdefault("updated_at", timezone.now())
        result = self.collection.insert_one(payload)
        return str(result.inserted_id)

    def find_all(self, query=None, limit=None):
        cursor = self.collection.find(query or {})
        if limit is not None:
            cursor = cursor.limit(limit)
        return [self._normalize_document(doc) for doc in cursor]

    def find_one(self, query):
        return self._normalize_document(self.collection.find_one(query))

    def update(self, query, data):
        result = self.update_result(query, data)
        return result.modified_count

    def update_result(self, query, data):
        payload = dict(data)
        payload["updated_at"] = timezone.now()
        return self.collection.update_one(query, {"$set": payload})

    def update_by_id(self, document_id, data):
        try:
            object_id = ObjectId(document_id)
        except Exception:
            object_id = document_id
        return self.update_result({"_id": object_id}, data)

    def delete(self, query):
        result = self.collection.delete_one(query)
        return result.deleted_count

    def create_indexes(self):
        return []


class MedicineRepository(BaseMongoRepository):
    collection_name = "medicines"

    def create_indexes(self):
        return [
            self.collection.create_index(
                "batch_number",
                unique=True,
                name="uniq_medicines_batch_number",
            ),
            self.collection.create_index("name", name="idx_medicines_name"),
            self.collection.create_index("manufacturer", name="idx_medicines_manufacturer"),
            self.collection.create_index("created_at", name="idx_medicines_created_at"),
        ]

    def find_by_batch_number(self, batch_number):
        return self.find_one({"batch_number": batch_number})


class MedicineRecordRepository(BaseMongoRepository):
    collection_name = "medicine_records"

    def create_indexes(self):
        return [
            self.collection.create_index("medicine_id", name="idx_records_medicine_id"),
            self.collection.create_index("batch_number", name="idx_records_batch_number"),
            self.collection.create_index("status", name="idx_records_status"),
            self.collection.create_index("timestamp", name="idx_records_timestamp"),
        ]

    def find_by_medicine_id(self, medicine_id, limit=None):
        return self.find_all({"medicine_id": medicine_id}, limit=limit)


class BlockchainHashRepository(BaseMongoRepository):
    collection_name = "blockchain_hashes"

    def create_indexes(self):
        return [
            self.collection.create_index(
                "tx_hash",
                unique=True,
                sparse=True,
                name="uniq_blockchain_tx_hash",
            ),
            self.collection.create_index("batch_number", name="idx_blockchain_batch_number"),
            self.collection.create_index("event_name", name="idx_blockchain_event_name"),
            self.collection.create_index("block_number", name="idx_blockchain_block_number"),
        ]

    def find_by_batch_number(self, batch_number, limit=None):
        return self.find_all({"batch_number": batch_number}, limit=limit)

    def find_by_tx_hash(self, tx_hash):
        return self.find_one({"tx_hash": tx_hash})
