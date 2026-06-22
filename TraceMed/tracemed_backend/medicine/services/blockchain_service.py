import json
from pathlib import Path

from django.conf import settings
from eth_abi import encode
from eth_account.messages import encode_defunct
from web3 import Web3


STATUS_FUNCTIONS = {
    "Produced": "Cungcaplothuoc",
    "Inspected": "kiemDinhLoThuoc",
    "InTransit": "vanChuyenLoThuoc",
    "Delivered": "nhaThuocNhanHang",
    "Sold": "banHang",
    "Recalled": "thuHoiLoThuoc",
}

STAGE_TEXT = {
    0: "Created",
    1: "Produced",
    2: "Inspected",
    3: "InTransit",
    4: "Delivered",
    5: "Sold",
    6: "Recalled",
    7: "Cancelled",
}

RECALL_ROLE_BY_STAGE = {
    1: "manufacturer",
    2: "inspector",
    3: "logistics",
    4: "pharmacy",
    5: "pharmacy",
}


class BlockchainConfigError(Exception):
    """Backward-compatible name used by existing API views."""


class BlockchainNotConfigured(BlockchainConfigError):
    """Raised when backend cannot build a usable blockchain client."""


class BlockchainTransactionError(Exception):
    pass


class BlockchainService:
    abi_filename = "MedicineTraceabilityABI.json"
    default_error = "Blockchain not configured"

    def __init__(
        self,
        provider_url=None,
        contract_address=None,
        chain_id=None,
        private_key=None,
        abi_path=None,
        role_private_keys=None,
    ):
        self.provider_url = (
            settings.WEB3_PROVIDER_URL if provider_url is None else provider_url
        )
        self.contract_address = (
            settings.CONTRACT_ADDRESS if contract_address is None else contract_address
        )
        self.chain_id = settings.CHAIN_ID if chain_id is None else chain_id
        self.private_key = settings.PRIVATE_KEY if private_key is None else private_key
        self.role_private_keys = role_private_keys or {
            "admin": getattr(settings, "ADMIN_PRIVATE_KEY", ""),
            "manufacturer": getattr(settings, "MANUFACTURER_PRIVATE_KEY", ""),
            "inspector": getattr(settings, "INSPECTOR_PRIVATE_KEY", ""),
            "logistics": getattr(settings, "LOGISTICS_PRIVATE_KEY", ""),
            "pharmacy": getattr(settings, "PHARMACY_PRIVATE_KEY", ""),
        }
        self.abi_path = Path(abi_path) if abi_path else self._default_abi_path()
        self.web3 = None
        self.contract = None

    @classmethod
    def _default_abi_path(cls):
        return Path(__file__).resolve().parents[1] / "contracts" / cls.abi_filename

    def validate_configuration(self):
        missing = []
        if not self.provider_url:
            missing.append("WEB3_PROVIDER_URL")
        if not self.contract_address:
            missing.append("CONTRACT_ADDRESS")
        if not self.abi_path.exists():
            missing.append(self.abi_filename)

        if missing:
            raise BlockchainNotConfigured(
                f"{self.default_error}: missing {', '.join(missing)}"
            )

    def load_abi(self):
        self.validate_configuration()
        try:
            abi = json.loads(self.abi_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise BlockchainNotConfigured(
                f"{self.default_error}: invalid {self.abi_filename}"
            ) from exc

        if not isinstance(abi, list) or not abi:
            raise BlockchainNotConfigured(
                f"{self.default_error}: invalid {self.abi_filename}"
            )
        return abi

    def connect(self):
        abi = self.load_abi()
        try:
            checksum_address = Web3.to_checksum_address(self.contract_address)
        except ValueError as exc:
            raise BlockchainNotConfigured(
                f"{self.default_error}: invalid CONTRACT_ADDRESS"
            ) from exc

        self.web3 = Web3(Web3.HTTPProvider(self.provider_url))
        if not self.web3.is_connected():
            raise BlockchainNotConfigured(
                f"{self.default_error}: provider is not connected"
            )

        self.contract = self.web3.eth.contract(address=checksum_address, abi=abi)
        return self.contract

    def get_contract(self):
        if self.contract is None:
            return self.connect()
        return self.contract

    def get_private_key(self, role=None):
        if role:
            private_key = self.role_private_keys.get(role, "")
            if private_key:
                return private_key
        return self.private_key

    def get_account(self, role=None):
        private_key = self.get_private_key(role)
        if not private_key:
            key_name = f"{role.upper()}_PRIVATE_KEY" if role else "PRIVATE_KEY"
            raise BlockchainNotConfigured(f"{self.default_error}: missing {key_name}")
        if self.web3 is None:
            self.connect()
        return self.web3.eth.account.from_key(private_key)

    def send_transaction(self, function_call, role=None):
        private_key = self.get_private_key(role)
        account = self.get_account(role)
        try:
            tx_params = {
                "from": account.address,
                "nonce": self.web3.eth.get_transaction_count(account.address),
                "chainId": int(self.chain_id),
            }
            try:
                estimated_gas = function_call.estimate_gas({"from": account.address})
                tx_params["gas"] = int(estimated_gas * 1.2)
            except Exception:
                pass

            tx = function_call.build_transaction(tx_params)
            signed_tx = self.web3.eth.account.sign_transaction(
                tx,
                private_key=private_key,
            )
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as exc:
            raise BlockchainTransactionError(str(exc)) from exc

        if receipt.status != 1:
            raise BlockchainTransactionError("Blockchain transaction reverted")
        return receipt

    def sign_inspection_message(self, contract_lothuoc_id, passed):
        account = self.get_account("inspector")
        message_hash = Web3.keccak(
            encode(["uint64", "bool"], [int(contract_lothuoc_id), bool(passed)])
        )
        signed = account.sign_message(encode_defunct(message_hash))
        return signed.signature

    def sign_recall_message(self, contract_lothuoc_id, reason, role):
        account = self.get_account(role)
        message_hash = Web3.keccak(
            encode(["uint64", "string"], [int(contract_lothuoc_id), reason])
        )
        signed = account.sign_message(encode_defunct(message_hash))
        return signed.signature

    def get_status_events_from_receipt(self, receipt):
        contract = self.get_contract()
        return contract.events.CapNhatTrangThai().process_receipt(receipt)

    def receipt_payload(self, receipt):
        events = self.get_status_events_from_receipt(receipt)
        first_event_args = events[0]["args"] if events else {}
        lot_id = first_event_args.get("idLoThuoc")
        stage = first_event_args.get("giaiDoan")
        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "lot_id": lot_id,
            "stage": stage,
            "stage_text": stage_to_text(stage),
            "updated_by": first_event_args.get("nguoiCapNhat"),
            "timestamp": first_event_args.get("thoiGian"),
            "note": first_event_args.get("ghiChu"),
        }

    def create_batch(self, name, description="", batch_number="", manufacture_date=""):
        contract = self.get_contract()
        lot_name = batch_number or name
        receipt = self.send_transaction(
            contract.functions.taoLoThuoc(lot_name),
            role="manufacturer",
        )
        payload = self.receipt_payload(receipt)
        payload["name"] = name
        payload["description"] = description
        payload["batch_number"] = batch_number
        payload["manufacture_date"] = manufacture_date
        return payload

    def produce_batch(self, contract_lothuoc_id):
        contract = self.get_contract()
        receipt = self.send_transaction(
            contract.functions.Cungcaplothuoc(int(contract_lothuoc_id)),
            role="manufacturer",
        )
        return self.receipt_payload(receipt)

    def inspect_batch(self, contract_lothuoc_id, passed, signature=b""):
        contract = self.get_contract()
        signature_bytes = (
            self.sign_inspection_message(contract_lothuoc_id, passed)
            if not signature
            else _decode_hex_bytes(signature)
        )
        receipt = self.send_transaction(
            contract.functions.kiemDinhLoThuoc(
                int(contract_lothuoc_id),
                bool(passed),
                signature_bytes,
            ),
            role="inspector",
        )
        return self.receipt_payload(receipt)

    def update_logistics(self, contract_lothuoc_id):
        contract = self.get_contract()
        receipt = self.send_transaction(
            contract.functions.vanChuyenLoThuoc(int(contract_lothuoc_id)),
            role="logistics",
        )
        return self.receipt_payload(receipt)

    def receive_at_pharmacy(self, contract_lothuoc_id):
        contract = self.get_contract()
        receipt = self.send_transaction(
            contract.functions.nhaThuocNhanHang(int(contract_lothuoc_id)),
            role="pharmacy",
        )
        return self.receipt_payload(receipt)

    def sell_batch(self, contract_lothuoc_id):
        contract = self.get_contract()
        receipt = self.send_transaction(
            contract.functions.banHang(int(contract_lothuoc_id)),
            role="pharmacy",
        )
        return self.receipt_payload(receipt)

    def recall_batch(self, contract_lothuoc_id, reason, signature=b""):
        contract = self.get_contract()
        role = self._recall_role(contract_lothuoc_id)
        signature_bytes = (
            self.sign_recall_message(contract_lothuoc_id, reason, role)
            if not signature
            else _decode_hex_bytes(signature)
        )
        receipt = self.send_transaction(
            contract.functions.thuHoiLoThuoc(
                int(contract_lothuoc_id),
                reason,
                signature_bytes,
            ),
            role=role,
        )
        return self.receipt_payload(receipt)

    def _recall_role(self, contract_lothuoc_id):
        batch = self.get_batch(contract_lothuoc_id)
        role = RECALL_ROLE_BY_STAGE.get(batch["stage"])
        if not role:
            raise BlockchainTransactionError(
                f"Lot stage {batch['stage_text']} cannot be recalled"
            )
        return role

    def flag_temperature_breach(self, contract_lothuoc_id, reason, signature=b""):
        breach_reason = reason or "Temperature breach"
        return self.recall_batch(contract_lothuoc_id, breach_reason, signature)

    def get_batch(self, contract_lothuoc_id):
        contract = self.get_contract()
        lot = contract.functions.cacLoThuoc(int(contract_lothuoc_id)).call()
        stage = int(lot[6])
        return {
            "lot_id": int(lot[0]),
            "name": lot[1],
            "manufacturer_id": int(lot[2]),
            "inspector_id": int(lot[3]),
            "logistics_id": int(lot[4]),
            "pharmacy_id": int(lot[5]),
            "stage": stage,
            "stage_text": stage_to_text(stage),
        }

    def get_stage_text(self, contract_lothuoc_id):
        return self.get_batch(contract_lothuoc_id)["stage_text"]

    # --- Role management (owner only) ---

    ROLE_ADD_FUNCTIONS = {
        "manufacturer": "themNhaSanXuat",
        "inspector": "themDonViKiemDinh",
        "logistics": "themDonViVanChuyen",
        "pharmacy": "themNhaThuoc",
    }
    ROLE_REVOKE_FUNCTIONS = {
        "manufacturer": "thuHoiRoleNhaSanXuat",
        "inspector": "thuHoiRoleDonViKiemDinh",
        "logistics": "thuHoiRoleDonViVanChuyen",
        "pharmacy": "thuHoiRoleNhaThuoc",
    }
    ROLE_ACTIVATE_FUNCTIONS = {
        "manufacturer": "kichHoatLaiRoleNhaSanXuat",
        "inspector": "kichHoatLaiRoleDonViKiemDinh",
        "logistics": "kichHoatLaiRoleDonViVanChuyen",
        "pharmacy": "kichHoatLaiRoleNhaThuoc",
    }

    def _validate_role(self, role):
        if role not in self.ROLE_ADD_FUNCTIONS:
            raise BlockchainConfigError(
                f"Invalid role '{role}'. Must be one of: {', '.join(self.ROLE_ADD_FUNCTIONS)}"
            )

    def add_role(self, role, wallet):
        self._validate_role(role)
        contract = self.get_contract()
        checksum_wallet = Web3.to_checksum_address(wallet)
        fn_name = self.ROLE_ADD_FUNCTIONS[role]
        fn = getattr(contract.functions, fn_name)(checksum_wallet)
        receipt = self.send_transaction(fn, role="admin")
        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success",
            "role": role,
            "wallet": checksum_wallet,
        }

    def revoke_role(self, role, role_id, reason=""):
        self._validate_role(role)
        contract = self.get_contract()
        effective_reason = reason if len(str(reason or "")) >= 5 else "Role revoked by admin"
        fn_name = self.ROLE_REVOKE_FUNCTIONS[role]
        fn = getattr(contract.functions, fn_name)(int(role_id), effective_reason)
        receipt = self.send_transaction(fn, role="admin")
        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success",
            "role": role,
            "role_id": int(role_id),
        }

    def activate_role(self, role, role_id):
        self._validate_role(role)
        contract = self.get_contract()
        fn_name = self.ROLE_ACTIVATE_FUNCTIONS[role]
        fn = getattr(contract.functions, fn_name)(int(role_id))
        receipt = self.send_transaction(fn, role="admin")
        return {
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber,
            "status": "success",
            "role": role,
            "role_id": int(role_id),
        }

    def get_history(self, contract_lothuoc_id, from_block=0, to_block="latest"):
        contract = self.get_contract()
        events = contract.events.CapNhatTrangThai().get_logs(
            from_block=from_block,
            to_block=to_block,
        )
        history = []
        for event in events:
            args = event["args"]
            if int(args.get("idLoThuoc")) != int(contract_lothuoc_id):
                continue
            stage = args.get("giaiDoan")
            history.append({
                "lot_id": args.get("idLoThuoc"),
                "stage": stage,
                "stage_text": stage_to_text(stage),
                "updated_by": args.get("nguoiCapNhat"),
                "timestamp": args.get("thoiGian"),
                "note": args.get("ghiChu"),
                "tx_hash": event.get("transactionHash").hex()
                if event.get("transactionHash")
                else None,
                "block_number": event.get("blockNumber"),
            })
        return history

    def status(self):
        configured = bool(
            self.provider_url and self.contract_address and self.abi_path.exists()
        )
        payload = {
            "configured": configured,
            "connected": False,
            "contract_address": self.contract_address,
            "chain_id": self.chain_id,
            "private_key_set": bool(self.private_key),
            "role_private_keys_set": {
                role: bool(key) for role, key in self.role_private_keys.items()
            },
            "abi_path": str(self.abi_path),
        }
        if not configured:
            payload["message"] = self.default_error
            return payload

        try:
            self.connect()
        except BlockchainNotConfigured as exc:
            payload["message"] = str(exc)
            return payload

        payload["connected"] = True
        return payload


def stage_to_text(stage):
    if stage is None:
        return None
    return STAGE_TEXT.get(int(stage), f"Unknown({stage})")


def is_blockchain_enabled():
    return bool(getattr(settings, "BLOCKCHAIN_ENABLED", False))


def _decode_hex_bytes(value):
    if not value:
        return b""
    if isinstance(value, bytes):
        return value
    text = str(value)
    if text.startswith("0x"):
        text = text[2:]
    try:
        return bytes.fromhex(text)
    except ValueError as exc:
        raise BlockchainConfigError(
            "Blockchain not configured: blockchain_signature must be hex bytes"
        ) from exc


def _client():
    service = BlockchainService()
    contract = service.get_contract()
    account = service.get_account()
    return service.web3, contract, account


def _send_transaction(function_call):
    service = BlockchainService()
    service.get_contract()
    return service.send_transaction(function_call)


def _receipt_payload(receipt, contract):
    events = contract.events.CapNhatTrangThai().process_receipt(receipt)
    first_event_args = events[0]["args"] if events else {}
    stage = first_event_args.get("giaiDoan")
    lot_id = first_event_args.get("idLoThuoc")
    return {
        "tx_hash": receipt.transactionHash.hex(),
        "block_number": receipt.blockNumber,
        "lot_id": lot_id,
        "stage": stage,
        "stage_text": stage_to_text(stage),
    }


def create_batch(name, description="", batch_number="", manufacture_date=""):
    return BlockchainService().create_batch(
        name=name,
        description=description,
        batch_number=batch_number,
        manufacture_date=manufacture_date,
    )


def produce_batch(contract_lothuoc_id):
    return BlockchainService().produce_batch(contract_lothuoc_id)


def inspect_batch(contract_lothuoc_id, passed, signature=b""):
    return BlockchainService().inspect_batch(contract_lothuoc_id, passed, signature)


def update_logistics(contract_lothuoc_id):
    return BlockchainService().update_logistics(contract_lothuoc_id)


def receive_at_pharmacy(contract_lothuoc_id):
    return BlockchainService().receive_at_pharmacy(contract_lothuoc_id)


def sell_batch(contract_lothuoc_id):
    return BlockchainService().sell_batch(contract_lothuoc_id)


def recall_batch(contract_lothuoc_id, reason, signature=b""):
    return BlockchainService().recall_batch(contract_lothuoc_id, reason, signature)


def flag_temperature_breach(contract_lothuoc_id, reason, signature=b""):
    return BlockchainService().flag_temperature_breach(
        contract_lothuoc_id,
        reason,
        signature,
    )


def get_stage_text(contract_lothuoc_id):
    return BlockchainService().get_stage_text(contract_lothuoc_id)


def get_history(contract_lothuoc_id, from_block=0, to_block="latest"):
    return BlockchainService().get_history(contract_lothuoc_id, from_block, to_block)


def create_lot_on_chain(medicine):
    return create_batch(
        name=medicine.get("name", ""),
        description=medicine.get("description", ""),
        batch_number=medicine.get("batch_number", ""),
        manufacture_date=medicine.get("manufacture_date", ""),
    )


def record_status_on_chain(medicine, record):
    status = record.get("status")
    lot_id = medicine.get("blockchain_lot_id") or record.get("blockchain_lot_id")
    if lot_id is None and str(record.get("batch_number", "")).isdigit():
        lot_id = int(record["batch_number"])
    if lot_id is None:
        raise BlockchainConfigError("Missing blockchain_lot_id for this batch")

    lot_id = int(lot_id)
    if status == "Produced":
        return produce_batch(lot_id)
    if status == "Inspected":
        quality_status = str(record.get("quality_status") or "").lower()
        passed = quality_status not in {"failed", "fail", "rejected", "khong dat", "khong_dat"}
        return inspect_batch(lot_id, passed, record.get("blockchain_signature"))
    if status == "InTransit":
        return update_logistics(lot_id)
    if status == "Delivered":
        return receive_at_pharmacy(lot_id)
    if status == "Sold":
        return sell_batch(lot_id)
    if status == "Recalled":
        reason = record.get("note") or "Recalled"
        return recall_batch(lot_id, reason, record.get("blockchain_signature"))
    return None


def send_to_blockchain(payload):
    """Backward-compatible entry point for older imports."""
    if not is_blockchain_enabled():
        return {"status": "disabled", "payload": payload}
    return create_lot_on_chain(payload)


def add_role(role, wallet):
    return BlockchainService().add_role(role, wallet)


def revoke_role(role, role_id, reason=""):
    return BlockchainService().revoke_role(role, role_id, reason)


def activate_role(role, role_id):
    return BlockchainService().activate_role(role, role_id)
