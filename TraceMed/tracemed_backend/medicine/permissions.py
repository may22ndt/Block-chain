from rest_framework.permissions import SAFE_METHODS, BasePermission

from .auth_utils import user_has_role
from .constants import WRITE_MEDICINE_ROLES, WRITE_RECORD_ROLES


class MedicineWritePermission(BasePermission):
    message = "You do not have permission to modify medicines."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and user_has_role(request.user, WRITE_MEDICINE_ROLES)


class RecordWritePermission(BasePermission):
    message = "You do not have permission to modify medicine records."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and user_has_role(request.user, WRITE_RECORD_ROLES)
