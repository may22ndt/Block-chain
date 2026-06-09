MEDICINE_STATUSES = (
    "Created",
    "Produced",
    "Inspected",
    "InTransit",
    "Delivered",
    "Sold",
    "Recalled",
)

DEFAULT_MEDICINE_STATUS = "Created"

USER_ROLES = (
    "admin",
    "regulator",
    "manufacturer",
    "inspector",
    "logistics",
    "pharmacy",
)

WRITE_MEDICINE_ROLES = ("admin", "regulator", "manufacturer")
WRITE_RECORD_ROLES = (
    "admin",
    "regulator",
    "manufacturer",
    "inspector",
    "logistics",
    "pharmacy",
)
