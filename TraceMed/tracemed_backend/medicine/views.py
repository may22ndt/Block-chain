from datetime import datetime

from bson.objectid import ObjectId
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .repository import MedicineRecordRepository, MedicineRepository
from .serializers import MedicineRecordSerializer, MedicineSerializer


def index(request):
    return HttpResponse("TraceMed medicine app is working")


def _object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


@api_view(["GET", "POST"])
def medicine_list(request):
    medicine_repo = MedicineRepository()

    if request.method == "GET":
        medicines = medicine_repo.find_all()
        serializer = MedicineSerializer(medicines, many=True)
        return Response({
            "status": "success",
            "count": len(medicines),
            "data": serializer.data,
        })

    serializer = MedicineSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    data = dict(serializer.validated_data)
    data["timestamp"] = datetime.utcnow()
    medicine_id = medicine_repo.create(data)
    return Response({
        "status": "success",
        "message": "Medicine added successfully",
        "id": medicine_id,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def medicine_detail(request, medicine_id):
    object_id = _object_id(medicine_id)
    if object_id is None:
        return Response({
            "status": "error",
            "message": "Invalid medicine id",
        }, status=status.HTTP_400_BAD_REQUEST)

    medicine_repo = MedicineRepository()
    query = {"_id": object_id}

    if request.method == "GET":
        medicine = medicine_repo.find_one(query)
        if not medicine:
            return Response({
                "status": "error",
                "message": "Medicine not found",
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = MedicineSerializer(medicine)
        return Response({
            "status": "success",
            "data": serializer.data,
        })

    if request.method == "PUT":
        serializer = MedicineSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_count = medicine_repo.update(query, serializer.validated_data)
        if updated_count == 0:
            return Response({
                "status": "error",
                "message": "Medicine not found or unchanged",
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": "success",
            "message": "Medicine updated successfully",
        })

    deleted_count = medicine_repo.delete(query)
    if deleted_count == 0:
        return Response({
            "status": "error",
            "message": "Medicine not found",
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "status": "success",
        "message": "Medicine deleted successfully",
    })


@api_view(["GET", "POST"])
def medicine_records(request, medicine_id=None):
    record_repo = MedicineRecordRepository()

    if request.method == "GET":
        if medicine_id:
            records = record_repo.find_by_medicine_id(medicine_id)
        else:
            records = record_repo.find_all()

        serializer = MedicineRecordSerializer(records, many=True)
        return Response({
            "status": "success",
            "count": len(records),
            "data": serializer.data,
        })

    serializer = MedicineRecordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    data = dict(serializer.validated_data)
    data["timestamp"] = datetime.utcnow()
    record_id = record_repo.create(data)
    return Response({
        "status": "success",
        "message": "Record added successfully",
        "id": record_id,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def medicine_search(request):
    search_query = request.query_params.get("q", "").strip()
    if not search_query:
        return Response({
            "status": "error",
            "message": "Missing search query",
        }, status=status.HTTP_400_BAD_REQUEST)

    medicine_repo = MedicineRepository()
    medicines = medicine_repo.find_all({
        "$or": [
            {"name": {"$regex": search_query, "$options": "i"}},
            {"batch_number": {"$regex": search_query, "$options": "i"}},
        ]
    })

    serializer = MedicineSerializer(medicines, many=True)
    return Response({
        "status": "success",
        "count": len(medicines),
        "data": serializer.data,
    })


@api_view(["GET"])
def batch_history(request, batch_number):
    medicine_repo = MedicineRepository()
    record_repo = MedicineRecordRepository()

    medicine = medicine_repo.find_by_batch_number(batch_number)
    records = record_repo.find_all({"batch_number": batch_number})
    return Response({
        "status": "success",
        "data": {
            "medicine": medicine,
            "history": records,
        },
    })


@api_view(["GET"])
def batch_qr(request, batch_number):
    medicine = MedicineRepository().find_by_batch_number(batch_number)
    if not medicine:
        return Response({
            "status": "error",
            "message": "Batch not found",
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "status": "success",
        "data": {
            "batch_number": medicine.get("batch_number"),
            "name": medicine.get("name"),
            "manufacturer": medicine.get("manufacturer"),
            "expiration_date": medicine.get("expiration_date"),
            "status": medicine.get("status", "unknown"),
            "blockchain_hash": medicine.get("blockchain_hash"),
        },
    })
