from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .permissions import AdminOnlyPermission
from .repository import MedicineRepository
from .responses import error_response, success_response
from .services.blockchain_service import (
    BlockchainConfigError,
    BlockchainNotConfigured,
    BlockchainService,
    BlockchainTransactionError,
    is_blockchain_enabled,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def blockchain_status(request):
    svc = BlockchainService()
    data = svc.status()
    data["blockchain_enabled"] = is_blockchain_enabled()
    role_keys = data.get("role_private_keys_set", {})
    data["roles_ready"] = all(role_keys.values()) if role_keys else False
    data["missing_roles"] = [r for r, set_ in role_keys.items() if not set_]
    return success_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def blockchain_sync_audit(request):
    check_chain = request.query_params.get("check_chain", "true").lower() != "false"
    only_problems = request.query_params.get("only_problems", "false").lower() == "true"

    medicines = MedicineRepository().find_all()

    svc = None
    if check_chain:
        try:
            svc = BlockchainService()
            svc.connect()
        except (BlockchainConfigError, BlockchainNotConfigured):
            svc = None

    summary = {
        "total": len(medicines),
        "disabled": 0,
        "synced": 0,
        "failed": 0,
        "skipped": 0,
        "status_mismatch": 0,
        "error": 0,
    }
    items = []

    for med in medicines:
        sync_status = med.get("blockchain_sync_status", "disabled")
        lot_id = med.get("blockchain_lot_id")

        item = {
            "_id": str(med.get("_id", "")),
            "batch_number": med.get("batch_number", ""),
            "name": med.get("name", ""),
            "blockchain_lot_id": lot_id,
            "blockchain_sync_status": sync_status,
        }

        if sync_status in summary:
            summary[sync_status] += 1
        else:
            summary["error"] += 1

        issue = None
        if sync_status == "failed":
            issue = "Blockchain sync failed"
        elif sync_status == "synced" and lot_id is not None and svc is not None:
            try:
                batch = svc.get_batch(lot_id)
                chain_stage_text = batch.get("stage_text", "")
                db_stage = med.get("status", "")
                item["db_stage"] = db_stage
                item["chain_stage"] = chain_stage_text
                item["stage_match"] = db_stage == chain_stage_text
                if not item["stage_match"]:
                    issue = f"Stage mismatch: DB={db_stage}, chain={chain_stage_text}"
                    summary["status_mismatch"] += 1
            except Exception as exc:
                item["chain_error"] = str(exc)
                issue = "Cannot read chain lot"

        if issue:
            item["issue"] = issue

        if only_problems and not issue:
            continue

        items.append(item)

    return success_response({"summary": summary, "items": items})


@api_view(["GET"])
@permission_classes([AllowAny])
def blockchain_lot_detail(request, lot_id):
    try:
        lot_id_int = int(lot_id)
    except (ValueError, TypeError):
        return error_response("Invalid lot_id", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        svc = BlockchainService()
        data = svc.get_batch(lot_id_int)
    except (BlockchainConfigError, BlockchainNotConfigured) as exc:
        return error_response(
            str(exc),
            status_code=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as exc:
        return error_response(
            f"Cannot read blockchain lot: {exc}",
            status_code=status.HTTP_502_BAD_GATEWAY,
        )

    return success_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def blockchain_lot_history(request, lot_id):
    try:
        lot_id_int = int(lot_id)
    except (ValueError, TypeError):
        return error_response("Invalid lot_id", status_code=status.HTTP_400_BAD_REQUEST)

    from_block_raw = request.query_params.get("from_block", "0")
    to_block_raw = request.query_params.get("to_block", "latest")

    try:
        from_block = int(from_block_raw)
    except (ValueError, TypeError):
        return error_response("Invalid from_block", status_code=status.HTTP_400_BAD_REQUEST)

    to_block = to_block_raw if to_block_raw == "latest" else None
    if to_block is None:
        try:
            to_block = int(to_block_raw)
        except (ValueError, TypeError):
            return error_response("Invalid to_block", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        svc = BlockchainService()
        history = svc.get_history(lot_id_int, from_block=from_block, to_block=to_block)
    except (BlockchainConfigError, BlockchainNotConfigured) as exc:
        return error_response(
            str(exc),
            status_code=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as exc:
        return error_response(
            f"Cannot read blockchain lot history: {exc}",
            status_code=status.HTTP_502_BAD_GATEWAY,
        )

    # Normalise to documented shape (add event_name field)
    for event in history:
        event.setdefault("event_name", "CapNhatTrangThai")
        if "timestamp" in event and hasattr(event["timestamp"], "__int__"):
            event["timestamp"] = int(event["timestamp"])

    return success_response(history, count=len(history))


VALID_ROLES = {"manufacturer", "inspector", "logistics", "pharmacy"}


@api_view(["POST"])
@permission_classes([AdminOnlyPermission])
def blockchain_role_add(request):
    role = request.data.get("role", "").strip()
    wallet = request.data.get("wallet", "").strip()

    if not role or role not in VALID_ROLES:
        return error_response(
            f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if not wallet:
        return error_response("wallet is required", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        svc = BlockchainService()
        result = svc.add_role(role, wallet)
    except (BlockchainConfigError, BlockchainNotConfigured) as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except BlockchainTransactionError as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except Exception as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)

    result["message"] = "Blockchain role added"
    return success_response(result, message="Blockchain role added")


@api_view(["POST"])
@permission_classes([AdminOnlyPermission])
def blockchain_role_revoke(request):
    role = request.data.get("role", "").strip()
    role_id = request.data.get("id")
    reason = request.data.get("reason", "")

    if not role or role not in VALID_ROLES:
        return error_response(
            f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if role_id is None:
        return error_response("id is required", status_code=status.HTTP_400_BAD_REQUEST)
    try:
        role_id_int = int(role_id)
    except (ValueError, TypeError):
        return error_response("id must be an integer", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        svc = BlockchainService()
        result = svc.revoke_role(role, role_id_int, reason)
    except (BlockchainConfigError, BlockchainNotConfigured) as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except BlockchainTransactionError as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except Exception as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)

    result["message"] = "Blockchain role revoked"
    return success_response(result, message="Blockchain role revoked")


@api_view(["POST"])
@permission_classes([AdminOnlyPermission])
def blockchain_role_activate(request):
    role = request.data.get("role", "").strip()
    role_id = request.data.get("id")

    if not role or role not in VALID_ROLES:
        return error_response(
            f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if role_id is None:
        return error_response("id is required", status_code=status.HTTP_400_BAD_REQUEST)
    try:
        role_id_int = int(role_id)
    except (ValueError, TypeError):
        return error_response("id must be an integer", status_code=status.HTTP_400_BAD_REQUEST)

    try:
        svc = BlockchainService()
        result = svc.activate_role(role, role_id_int)
    except (BlockchainConfigError, BlockchainNotConfigured) as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except BlockchainTransactionError as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)
    except Exception as exc:
        return error_response(str(exc), status_code=status.HTTP_502_BAD_GATEWAY)

    result["message"] = "Blockchain role activated"
    return success_response(result, message="Blockchain role activated")
