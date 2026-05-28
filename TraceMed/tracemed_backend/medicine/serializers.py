from rest_framework import serializers


class MedicineSerializer(serializers.Serializer):
    """Serializer cho dữ liệu thuốc từ MongoDB"""
    _id = serializers.CharField(required=False)
    name = serializers.CharField(max_length=255)
    manufacturer = serializers.CharField(max_length=255)
    batch_number = serializers.CharField(max_length=100)
    expiration_date = serializers.DateField()
    description = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    blockchain_hash = serializers.CharField(required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(required=False)


class MedicineRecordSerializer(serializers.Serializer):
    """Serializer cho lịch sử vận chuyển thuốc"""
    _id = serializers.CharField(required=False)
    medicine_id = serializers.CharField()
    medicine_name = serializers.CharField(required=False)
    location = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(
        choices=['manufactured', 'in_transit', 'warehouse', 'delivered']
    )
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    timestamp = serializers.DateTimeField(required=False)
    blockchain_hash = serializers.CharField(required=False, allow_blank=True)
