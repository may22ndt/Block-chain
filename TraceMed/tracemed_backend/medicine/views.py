from bson.objectid import ObjectId
from django.http import HttpResponse
from django.utils import timezone
from pymongo.errors import DuplicateKeyError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

from .constants import DEFAULT_MEDICINE_STATUS
from .permissions import MedicineWritePermission, RecordWritePermission
from .repository import MedicineRecordRepository, MedicineRepository
from .responses import error_response, success_response
from .serializers import MedicineRecordSerializer, MedicineSerializer
from .services.blockchain_service import (
    BlockchainConfigError,
    BlockchainTransactionError,
    create_lot_on_chain,
    is_blockchain_enabled,
    record_status_on_chain,
)


def index(request):
    return HttpResponse("TraceMed medicine app is working")


def _object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


@api_view(["GET", "POST"])
@permission_classes([MedicineWritePermission])
def medicine_list(request):
    medicine_repo = MedicineRepository()

    if request.method == "GET":
        medicines = medicine_repo.find_all()
        serializer = MedicineSerializer(medicines, many=True)
        return success_response(serializer.data, count=len(medicines))

    serializer = MedicineSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response(
            "Invalid medicine data",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    data = dict(serializer.validated_data)
    data.setdefault("status", DEFAULT_MEDICINE_STATUS)
    data["timestamp"] = timezone.now()
    data.setdefault("blockchain_sync_status", "disabled")
    if medicine_repo.find_by_batch_number(data["batch_number"]):
        return error_response(
            "Medicine batch_number already exists",
            status_code=status.HTTP_409_CONFLICT,
        )

    try:
        medicine_id = medicine_repo.create(data)
    except DuplicateKeyError:
        return error_response(
            "Medicine batch_number already exists",
            status_code=status.HTTP_409_CONFLICT,
        )

    response_data = {"id": medicine_id}
    if is_blockchain_enabled():
        try:
            blockchain_result = create_lot_on_chain(data)
        except (BlockchainConfigError, BlockchainTransactionError) as exc:
            blockchain_update = {
                "blockchain_sync_status": "failed",
                "blockchain_error": str(exc),
            }
            medicine_repo.update_by_id(medicine_id, blockchain_update)
            response_data.update(blockchain_update)
            return success_response(
                response_data,
                message="Medicine added, but blockchain sync failed",
                status_code=status.HTTP_201_CREATED,
            )

        blockchain_update = {
            "blockchain_hash": blockchain_result["tx_hash"],
            "blockchain_lot_id": blockchain_result["lot_id"],
            "blockchain_sync_status": "synced",
            "blockchain_error": "",
        }
        medicine_repo.update_by_id(medicine_id, blockchain_update)
        response_data.update(blockchain_update)

    return success_response(
        response_data,
        message="Medicine added successfully",
        status_code=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([MedicineWritePermission])
def medicine_detail(request, medicine_id):
    object_id = _object_id(medicine_id)
    if object_id is None:
        return error_response("Invalid medicine id", status_code=status.HTTP_400_BAD_REQUEST)

    medicine_repo = MedicineRepository()
    query = {"_id": object_id}

    if request.method == "GET":
        medicine = medicine_repo.find_one(query)
        if not medicine:
            return error_response("Medicine not found", status_code=status.HTTP_404_NOT_FOUND)

        serializer = MedicineSerializer(medicine)
        return success_response(serializer.data)

    if request.method == "PUT":
        serializer = MedicineSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                "Invalid medicine data",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        update_result = medicine_repo.update_result(query, dict(serializer.validated_data))
        if update_result.matched_count == 0:
            return error_response("Medicine not found", status_code=status.HTTP_404_NOT_FOUND)

        if update_result.modified_count == 0:
            return success_response(message="Medicine unchanged")

        return success_response(message="Medicine updated successfully")

    deleted_count = medicine_repo.delete(query)
    if deleted_count == 0:
        return error_response("Medicine not found", status_code=status.HTTP_404_NOT_FOUND)

    return success_response(message="Medicine deleted successfully")


@api_view(["GET", "POST"])
@permission_classes([RecordWritePermission])
def medicine_records(request, medicine_id=None):
    record_repo = MedicineRecordRepository()

    if request.method == "GET":
        if medicine_id:
            records = record_repo.find_by_medicine_id(medicine_id)
        else:
            records = record_repo.find_all()

        serializer = MedicineRecordSerializer(records, many=True)
        return success_response(serializer.data, count=len(records))

    serializer = MedicineRecordSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response(
            "Invalid medicine record data",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    data = dict(serializer.validated_data)
    medicine = MedicineRepository().find_by_batch_number(data["batch_number"])
    if not medicine:
        return error_response("Batch not found", status_code=status.HTTP_404_NOT_FOUND)

    data.setdefault("medicine_id", medicine["_id"])
    data.setdefault("medicine_name", medicine.get("name", ""))
    data.setdefault("blockchain_lot_id", medicine.get("blockchain_lot_id"))
    data.setdefault("blockchain_sync_status", "disabled")
    data["timestamp"] = timezone.now()

    record_id = record_repo.create(data)
    response_data = {"id": record_id}
    if is_blockchain_enabled():
        try:
            blockchain_result = record_status_on_chain(medicine, data)
        except (BlockchainConfigError, BlockchainTransactionError) as exc:
            blockchain_update = {
                "blockchain_sync_status": "failed",
                "blockchain_error": str(exc),
            }
            record_repo.update_by_id(record_id, blockchain_update)
            response_data.update(blockchain_update)
            return success_response(
                response_data,
                message="Record added, but blockchain sync failed",
                status_code=status.HTTP_201_CREATED,
            )
        if blockchain_result:
            blockchain_update = {
                "blockchain_hash": blockchain_result["tx_hash"],
                "blockchain_lot_id": blockchain_result["lot_id"],
                "blockchain_sync_status": "synced",
                "blockchain_error": "",
            }
            record_repo.update_by_id(record_id, blockchain_update)
            response_data.update(blockchain_update)
        else:
            record_repo.update_by_id(record_id, {"blockchain_sync_status": "skipped"})
            response_data["blockchain_sync_status"] = "skipped"

    return success_response(
        response_data,
        message="Record added successfully",
        status_code=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def medicine_search(request):
    search_query = request.query_params.get("q", "").strip()
    if not search_query:
        return error_response("Missing search query", status_code=status.HTTP_400_BAD_REQUEST)

    medicine_repo = MedicineRepository()
    medicines = medicine_repo.find_all({
        "$or": [
            {"name": {"$regex": search_query, "$options": "i"}},
            {"batch_number": {"$regex": search_query, "$options": "i"}},
        ]
    })

    serializer = MedicineSerializer(medicines, many=True)
    return success_response(serializer.data, count=len(medicines))


@api_view(["GET"])
def batch_history(request, batch_number):
    medicine_repo = MedicineRepository()
    record_repo = MedicineRecordRepository()

    medicine = medicine_repo.find_by_batch_number(batch_number)
    if not medicine:
        return error_response("Batch not found", status_code=status.HTTP_404_NOT_FOUND)

    records = record_repo.find_all({"batch_number": batch_number})
    return success_response({
        "medicine": medicine,
        "history": records,
    })


@api_view(["GET"])
def batch_qr(request, batch_number):
    medicine = MedicineRepository().find_by_batch_number(batch_number)
    if not medicine:
        return error_response("Batch not found", status_code=status.HTTP_404_NOT_FOUND)

    return success_response({
        "batch_number": medicine.get("batch_number"),
        "name": medicine.get("name"),
        "manufacturer": medicine.get("manufacturer"),
        "expiration_date": medicine.get("expiration_date"),
        "status": medicine.get("status", DEFAULT_MEDICINE_STATUS),
        "location": medicine.get("location"),
        "temperature": medicine.get("temperature"),
        "humidity": medicine.get("humidity"),
        "blockchain_hash": medicine.get("blockchain_hash"),
        "blockchain_lot_id": medicine.get("blockchain_lot_id"),
    })
