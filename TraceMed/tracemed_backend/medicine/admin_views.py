from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes

from .auth_utils import user_roles as get_user_roles
from .constants import USER_ROLES
from .permissions import AdminOnlyPermission
from .responses import error_response, success_response


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "roles": get_user_roles(user),
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@api_view(["GET", "POST"])
@permission_classes([AdminOnlyPermission])
def user_list(request):
    if request.method == "GET":
        users = User.objects.all().order_by("id").prefetch_related("groups")
        return success_response([_user_payload(u) for u in users], count=users.count())

    # POST — create user
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()
    email = request.data.get("email", "").strip()
    roles = request.data.get("roles", [])

    if not username:
        return error_response("username is required", status_code=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 6:
        return error_response(
            "password is required and must be at least 6 characters",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(username=username).exists():
        return error_response("Username already exists", status_code=status.HTTP_409_CONFLICT)

    invalid = [r for r in roles if r not in USER_ROLES]
    if invalid:
        return error_response(
            f"Invalid roles: {', '.join(invalid)}. Valid: {', '.join(USER_ROLES)}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    new_user = User.objects.create_user(username=username, password=password, email=email)
    if roles:
        new_user.groups.set(Group.objects.filter(name__in=roles))

    return success_response(
        _user_payload(new_user),
        message="User created successfully",
        status_code=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([AdminOnlyPermission])
def user_detail(request, user_id):
    try:
        target = User.objects.prefetch_related("groups").get(id=user_id)
    except User.DoesNotExist:
        return error_response("User not found", status_code=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return success_response(_user_payload(target))

    if request.method == "PATCH":
        if "roles" in request.data:
            if target.is_superuser:
                return error_response(
                    "Cannot change roles of a superuser — roles are granted by the is_superuser flag",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            roles = request.data["roles"]
            if not isinstance(roles, list):
                return error_response("roles must be a list", status_code=status.HTTP_400_BAD_REQUEST)
            invalid = [r for r in roles if r not in USER_ROLES]
            if invalid:
                return error_response(
                    f"Invalid roles: {', '.join(invalid)}",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            target.groups.set(Group.objects.filter(name__in=roles))

        if "email" in request.data:
            target.email = request.data["email"]
        if "is_active" in request.data:
            target.is_active = bool(request.data["is_active"])

        target.save()
        return success_response(_user_payload(target), message="User updated successfully")

    # DELETE
    if target.is_superuser:
        return error_response(
            "Cannot delete a superuser account",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    if target == request.user:
        return error_response(
            "Cannot delete your own account",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    target.delete()
    return success_response(message="User deleted successfully")


@api_view(["POST"])
@permission_classes([AdminOnlyPermission])
def user_set_password(request, user_id):
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return error_response("User not found", status_code=status.HTTP_404_NOT_FOUND)

    password = request.data.get("password", "").strip()
    if len(password) < 6:
        return error_response(
            "Password must be at least 6 characters",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    target.set_password(password)
    target.save()
    return success_response(message="Password updated successfully")
