from .constants import USER_ROLES


def user_roles(user):
    if not user or not user.is_authenticated:
        return []
    if user.is_superuser:
        return ["admin"]
    roles = set(user.groups.filter(name__in=USER_ROLES).values_list("name", flat=True))
    return sorted(roles)


def user_has_role(user, allowed_roles):
    roles = set(user_roles(user))
    return bool(roles.intersection(set(allowed_roles)))
