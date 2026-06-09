from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from medicine.repository import MedicineRecordRepository, MedicineRepository


DEMO_MEDICINES = [
    {
        "name": "Paracetamol 500mg",
        "manufacturer": "TraceMed Pharma",
        "batch_number": "BATCH001",
        "expiration_date": "2027-12-31",
        "description": "Pain reliever and fever reducer.",
        "location": "Factory A",
        "status": "Inspected",
        "temperature": 24.5,
        "humidity": 58.0,
        "blockchain_hash": "",
    },
    {
        "name": "Amoxicillin 250mg",
        "manufacturer": "HealthChain Labs",
        "batch_number": "BATCH002",
        "expiration_date": "2027-08-15",
        "description": "Antibiotic medicine batch for demo tracing.",
        "location": "Warehouse B",
        "status": "InTransit",
        "temperature": 22.0,
        "humidity": 62.0,
        "blockchain_hash": "",
    },
]


DEMO_RECORDS = {
    "BATCH001": [
        ("Created", "Factory A", 24.0, 55.0, "Batch created by manufacturer."),
        ("Produced", "Factory A", 24.2, 56.0, "Manufacturing completed."),
        ("Inspected", "Quality Lab 1", 23.8, 57.0, "Quality inspection passed."),
    ],
    "BATCH002": [
        ("Created", "Factory B", 23.0, 59.0, "Batch created by manufacturer."),
        ("Produced", "Factory B", 23.5, 60.0, "Manufacturing completed."),
        ("InTransit", "Cold Truck 02", 22.0, 62.0, "Transferred to logistics."),
    ],
}


class Command(BaseCommand):
    help = "Seed demo medicines and supply-chain records into MongoDB."

    def handle(self, *args, **options):
        medicine_repo = MedicineRepository()
        record_repo = MedicineRecordRepository()

        try:
            medicine_repo.create_indexes()
            record_repo.create_indexes()
        except RuntimeError as exc:
            raise CommandError(
                "Cannot seed demo data because MongoDB is not available. "
                "Start MongoDB on localhost:27017 or update MONGO_URI."
            ) from exc

        created_medicines = 0
        created_records = 0

        for medicine in DEMO_MEDICINES:
            existing = medicine_repo.find_by_batch_number(medicine["batch_number"])
            if existing:
                medicine_id = existing["_id"]
            else:
                payload = dict(medicine)
                payload["timestamp"] = timezone.now()
                medicine_id = medicine_repo.create(payload)
                created_medicines += 1

            existing_records = record_repo.find_all({"batch_number": medicine["batch_number"]})
            if existing_records:
                continue

            for status, location, temperature, humidity, note in DEMO_RECORDS[medicine["batch_number"]]:
                record_repo.create({
                    "medicine_id": medicine_id,
                    "batch_number": medicine["batch_number"],
                    "medicine_name": medicine["name"],
                    "location": location,
                    "status": status,
                    "temperature": temperature,
                    "humidity": humidity,
                    "timestamp": timezone.now(),
                    "blockchain_hash": "",
                    "note": note,
                })
                created_records += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seed completed: {created_medicines} medicines, {created_records} records created."
        ))
