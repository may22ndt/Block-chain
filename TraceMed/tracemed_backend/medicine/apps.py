from django.apps import AppConfig
import logging
import os


logger = logging.getLogger(__name__)


class MedicineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'medicine'

    def ready(self):
        if os.getenv("AUTO_CREATE_MONGO_INDEXES", "True") != "True":
            return

        try:
            from .repository import (
                BlockchainHashRepository,
                MedicineRecordRepository,
                MedicineRepository,
            )

            repositories = (
                MedicineRepository(),
                MedicineRecordRepository(),
                BlockchainHashRepository(),
            )

            for repository in repositories:
                repository.create_indexes()
        except Exception as exc:
            logger.warning("MongoDB indexes were not created: %s", exc)
