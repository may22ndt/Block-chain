from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .auth_serializers import LoginSerializer, RefreshSerializer, user_payload
from .responses import error_response, success_response


@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    if not serializer.is_valid():
        return error_response(
            "Login failed",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    return success_response(serializer.validated_data, message="Login successful")


@api_view(["POST"])
def refresh_view(request):
    serializer = RefreshSerializer(data=request.data)
    if not serializer.is_valid():
        return error_response(
            "Token refresh failed",
            errors=serializer.errors,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    return success_response(serializer.validated_data, message="Token refreshed")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return success_response(user_payload(request.user))
