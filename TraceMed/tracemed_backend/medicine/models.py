from django.db import models


class LazyMedicineCollection:
    """Backward-compatible lazy collection proxy for old test scripts."""

    def _get_collection(self):
        from .repository import MedicineRepository

        return MedicineRepository().collection

    def __getattr__(self, name):
        return getattr(self._get_collection(), name)


medicine_collection = LazyMedicineCollection()


def insert_medicine(medicine_data):
    """Insert a medicine document into MongoDB."""
    from .repository import MedicineRepository

    return MedicineRepository().create(medicine_data)


def find_medicine(query=None):
    """Find medicine documents from MongoDB."""
    from .repository import MedicineRepository

    return MedicineRepository().find_all(query)


def find_one_medicine(query=None):
    """Find one medicine document from MongoDB."""
    from .repository import MedicineRepository

    if not query:
        return None
    return MedicineRepository().find_one(query)


def update_medicine(query, data):
    """Update one medicine document in MongoDB."""
    from .repository import MedicineRepository

    return MedicineRepository().update(query, data)


def delete_medicine(query):
    """Delete one medicine document from MongoDB."""
    from .repository import MedicineRepository

    return MedicineRepository().delete(query)


class Medicine(models.Model):
    """Optional Django ORM model; MongoDB access is handled by repositories."""

    name = models.CharField(max_length=255, unique=True)
    batch_number = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=255)

    class Meta:
        managed = False

    def __str__(self):
        return f"{self.name} - {self.batch_number}"
