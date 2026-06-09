from rest_framework import serializers

from .constants import DEFAULT_MEDICINE_STATUS, MEDICINE_STATUSES


class ISODateStringField(serializers.DateField):
    def to_representation(self, value):
        if value in ("", None):
            return value
        if isinstance(value, str):
            return value
        return super().to_representation(value)

    def to_internal_value(self, value):
        return super().to_internal_value(value).isoformat()


class MedicineSerializer(serializers.Serializer):
    """Serializer for medicine batch data stored in MongoDB."""
    _id = serializers.CharField(required=False)
    medicine_code = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(max_length=255)
    generic_name = serializers.CharField(required=False, allow_blank=True)
    dosage_form = serializers.CharField(required=False, allow_blank=True)
    strength = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    manufacturer = serializers.CharField(max_length=255)
    batch_number = serializers.CharField(max_length=100)
    manufacture_date = ISODateStringField(required=False)
    expiration_date = ISODateStringField()
    description = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    storage_condition = serializers.CharField(required=False, allow_blank=True)
    quality_status = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=MEDICINE_STATUSES,
        required=False,
        default=DEFAULT_MEDICINE_STATUS,
    )
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    blockchain_hash = serializers.CharField(required=False, allow_blank=True)
    blockchain_lot_id = serializers.IntegerField(required=False, allow_null=True)
    blockchain_sync_status = serializers.CharField(required=False, allow_blank=True)
    blockchain_error = serializers.CharField(required=False, allow_blank=True)
    blockchain_signature = serializers.CharField(required=False, allow_blank=True, write_only=True)
    timestamp = serializers.DateTimeField(required=False)
    created_at = serializers.DateTimeField(required=False)
    updated_at = serializers.DateTimeField(required=False)


class MedicineRecordSerializer(serializers.Serializer):
    """Serializer for medicine supply-chain history records."""
    _id = serializers.CharField(required=False)
    medicine_id = serializers.CharField(required=False, allow_blank=True)
    batch_number = serializers.CharField(max_length=100)
    medicine_name = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(choices=MEDICINE_STATUSES)
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    quality_status = serializers.CharField(required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(required=False)
    blockchain_hash = serializers.CharField(required=False, allow_blank=True)
    blockchain_lot_id = serializers.IntegerField(required=False, allow_null=True)
    blockchain_sync_status = serializers.CharField(required=False, allow_blank=True)
    blockchain_error = serializers.CharField(required=False, allow_blank=True)
    blockchain_signature = serializers.CharField(required=False, allow_blank=True, write_only=True)
    note = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(required=False)
    updated_at = serializers.DateTimeField(required=False)
