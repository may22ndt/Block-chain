from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_utils import user_roles


def user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "roles": user_roles(user),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get("request")
        user = authenticate(
            request=request,
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_payload(user),
        }


class RefreshSerializer(TokenRefreshSerializer):
    pass
