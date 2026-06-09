from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand

from medicine.constants import USER_ROLES


DEMO_USERS = {
    "admin": {
        "password": "admin123",
        "email": "admin@tracemed.local",
        "is_staff": True,
        "is_superuser": True,
    },
    "regulator": {"password": "regulator123", "email": "regulator@tracemed.local"},
    "manufacturer": {"password": "manufacturer123", "email": "manufacturer@tracemed.local"},
    "inspector": {"password": "inspector123", "email": "inspector@tracemed.local"},
    "logistics": {"password": "logistics123", "email": "logistics@tracemed.local"},
    "pharmacy": {"password": "pharmacy123", "email": "pharmacy@tracemed.local"},
}


class Command(BaseCommand):
    help = "Create TraceMed auth groups and demo users for local development."

    def handle(self, *args, **options):
        groups = {}
        for role in USER_ROLES:
            groups[role], _ = Group.objects.get_or_create(name=role)

        created_count = 0
        for username, data in DEMO_USERS.items():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": data["email"],
                    "is_staff": data.get("is_staff", False),
                    "is_superuser": data.get("is_superuser", False),
                },
            )
            if created:
                user.set_password(data["password"])
                created_count += 1
            user.email = data["email"]
            user.is_staff = data.get("is_staff", False)
            user.is_superuser = data.get("is_superuser", False)
            user.groups.add(groups[username])
            user.save()

        self.stdout.write(self.style.SUCCESS(
            f"Auth seed completed: {len(groups)} roles ready, {created_count} users created."
        ))
