from unittest.mock import MagicMock, patch

from django.contrib.auth.models import Group, User
from django.test import TestCase, override_settings
from pymongo.errors import DuplicateKeyError
from rest_framework.test import APIClient

from .services.blockchain_service import (
    BlockchainNotConfigured,
    BlockchainService,
    BlockchainTransactionError,
)


MEDICINE = {
    "_id": "665f1f77bcf86cd799439011",
    "name": "Paracetamol 500mg",
    "manufacturer": "TraceMed Pharma",
    "batch_number": "BATCH001",
    "expiration_date": "2027-12-31",
    "description": "Pain reliever and fever reducer.",
    "location": "Factory A",
    "status": "Inspected",
    "temperature": 24.5,
    "humidity": 58.0,
    "blockchain_hash": "",
}

RECORD = {
    "_id": "665f1f77bcf86cd799439099",
    "medicine_id": MEDICINE["_id"],
    "batch_number": "BATCH001",
    "medicine_name": "Paracetamol 500mg",
    "location": "Quality Lab 1",
    "status": "Inspected",
    "temperature": 23.8,
    "humidity": 57.0,
    "blockchain_hash": "",
    "note": "Quality inspection passed.",
}


class FakeMedicineRepository:
    created_payloads = []
    updated_payloads = []
    should_duplicate = False

    def find_all(self, query=None, limit=None):
        self.last_limit = limit
        return [MEDICINE]

    def find_by_batch_number(self, batch_number):
        if batch_number == MEDICINE["batch_number"]:
            return dict(MEDICINE)
        return None

    def create(self, data):
        if self.should_duplicate:
            raise DuplicateKeyError("duplicate batch_number")
        self.created_payloads.append(dict(data))
        return MEDICINE["_id"]

    def update_result(self, query, data):
        class Result:
            matched_count = 1
            modified_count = 0

        return Result()

    def update_by_id(self, document_id, data):
        self.updated_payloads.append({"id": document_id, "data": dict(data)})
        return self.update_result({"_id": document_id}, data)


class FakeMedicineRecordRepository:
    created_payloads = []
    updated_payloads = []

    def find_all(self, query=None, limit=None):
        return [RECORD]

    def find_by_medicine_id(self, medicine_id, limit=None):
        return [RECORD]

    def create(self, data):
        self.created_payloads.append(dict(data))
        return RECORD["_id"]

    def update_by_id(self, document_id, data):
        self.updated_payloads.append({"id": document_id, "data": dict(data)})


class BlockchainServiceTests(TestCase):
    contract_address = "0xf9592BDC391C778F2BE7Eb3F736784e505E0B534"

    def test_loads_medicine_traceability_abi_file(self):
        service = BlockchainService(
            provider_url="http://localhost:8545",
            contract_address=self.contract_address,
            chain_id=11155111,
        )

        abi = service.load_abi()
        function_names = {
            item.get("name")
            for item in abi
            if item.get("type") == "function"
        }

        self.assertIn("taoLoThuoc", function_names)
        self.assertIn("kiemDinhLoThuoc", function_names)
        self.assertIn("vanChuyenLoThuoc", function_names)

    def test_missing_provider_address_or_abi_raises_not_configured(self):
        service = BlockchainService(provider_url="", contract_address="", chain_id=11155111)

        with self.assertRaisesRegex(BlockchainNotConfigured, "Blockchain not configured"):
            service.validate_configuration()

    @patch("medicine.services.blockchain_service.Web3")
    def test_connect_checks_provider_and_creates_contract_instance(self, web3_class):
        web3_instance = MagicMock()
        web3_instance.is_connected.return_value = True
        web3_instance.eth.contract.return_value = "contract-instance"
        web3_class.return_value = web3_instance
        web3_class.HTTPProvider.return_value = "http-provider"
        web3_class.to_checksum_address.return_value = self.contract_address
        service = BlockchainService(
            provider_url="https://eth-sepolia.g.alchemy.com/v2/test-key",
            contract_address=self.contract_address,
            chain_id=11155111,
        )

        contract = service.connect()

        self.assertEqual(contract, "contract-instance")
        web3_class.HTTPProvider.assert_called_once_with(
            "https://eth-sepolia.g.alchemy.com/v2/test-key"
        )
        web3_instance.is_connected.assert_called_once()
        web3_instance.eth.contract.assert_called_once()

    def test_contract_write_wrappers_call_deployed_abi_functions(self):
        service = BlockchainService(
            provider_url="http://localhost:8545",
            contract_address=self.contract_address,
            chain_id=11155111,
        )
        service.contract = MagicMock()

        with (
            patch.object(service, "send_transaction", return_value=MagicMock()),
            patch.object(service, "receipt_payload", return_value={"tx_hash": "0x1"}),
        ):
            service.create_batch("Paracetamol", batch_number="BATCH001")
            service.produce_batch(1)
            service.inspect_batch(1, True, "0x")
            service.update_logistics(1)
            service.receive_at_pharmacy(1)
            service.sell_batch(1)
            service.recall_batch(1, "Quality issue found", "0x")

        service.contract.functions.taoLoThuoc.assert_called_once_with("BATCH001")
        service.contract.functions.Cungcaplothuoc.assert_called_once_with(1)
        service.contract.functions.kiemDinhLoThuoc.assert_called_once_with(1, True, b"")
        service.contract.functions.vanChuyenLoThuoc.assert_called_once_with(1)
        service.contract.functions.nhaThuocNhanHang.assert_called_once_with(1)
        service.contract.functions.banHang.assert_called_once_with(1)
        service.contract.functions.thuHoiLoThuoc.assert_called_once_with(
            1,
            "Quality issue found",
            b"",
        )

    def test_get_stage_text_reads_cac_lo_thuoc_view(self):
        service = BlockchainService(
            provider_url="http://localhost:8545",
            contract_address=self.contract_address,
            chain_id=11155111,
        )
        service.contract = MagicMock()
        service.contract.functions.cacLoThuoc.return_value.call.return_value = (
            1,
            "BATCH001",
            1,
            2,
            3,
            4,
            3,
        )

        self.assertEqual(service.get_stage_text(1), "InTransit")
        service.contract.functions.cacLoThuoc.assert_called_once_with(1)


@override_settings(
    ALLOWED_HOSTS=["testserver", "localhost", "127.0.0.1"],
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
)
class MedicineApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        FakeMedicineRepository.created_payloads = []
        FakeMedicineRepository.updated_payloads = []
        FakeMedicineRepository.should_duplicate = False
        FakeMedicineRecordRepository.created_payloads = []
        FakeMedicineRecordRepository.updated_payloads = []
        self.manufacturer_group, _ = Group.objects.get_or_create(name="manufacturer")
        self.pharmacy_group, _ = Group.objects.get_or_create(name="pharmacy")
        self.user = User.objects.create_user(username="manufacturer", password="pass123")
        self.user.groups.add(self.manufacturer_group)
        self.pharmacy_user = User.objects.create_user(username="pharmacy", password="pass123")
        self.pharmacy_user.groups.add(self.pharmacy_group)

    def test_login_refresh_and_me_endpoints(self):
        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "manufacturer", "password": "pass123"},
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.data["status"], "success")
        self.assertIn("access", login_response.data["data"])
        self.assertIn("refresh", login_response.data["data"])
        self.assertEqual(login_response.data["data"]["user"]["roles"], ["manufacturer"])

        access = login_response.data["data"]["access"]
        refresh = login_response.data["data"]["refresh"]
        me_response = self.client.get(
            "/api/auth/me/",
            HTTP_AUTHORIZATION=f"Bearer {access}",
        )

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["data"]["username"], "manufacturer")

        refresh_response = self.client.post(
            "/api/auth/refresh/",
            {"refresh": refresh},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.data["data"])

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_get_medicines_returns_consistent_response(self):
        response = self.client.get("/api/medicines/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["data"][0]["batch_number"], "BATCH001")

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_get_medicines_does_not_apply_hidden_limit(self):
        repo = FakeMedicineRepository()
        medicines = repo.find_all()

        self.assertEqual(len(medicines), 1)
        self.assertIsNone(repo.last_limit)

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_medicine_uses_standard_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Ibuprofen 400mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH003",
                "expiration_date": "2028-01-31",
                "location": "Factory C",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(FakeMedicineRepository.created_payloads[0]["status"], "Created")
        self.assertEqual(
            FakeMedicineRepository.created_payloads[0]["blockchain_sync_status"],
            "disabled",
        )

    @override_settings(BLOCKCHAIN_ENABLED=True)
    @patch("medicine.views.create_lot_on_chain", side_effect=BlockchainTransactionError("chain down"))
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_medicine_saves_mongo_when_blockchain_sync_fails(self, _chain):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Ibuprofen 400mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH003",
                "expiration_date": "2028-01-31",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["message"], "Medicine added, but blockchain sync failed")
        self.assertEqual(len(FakeMedicineRepository.created_payloads), 1)
        self.assertEqual(
            FakeMedicineRepository.updated_payloads[0]["data"]["blockchain_sync_status"],
            "failed",
        )

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_medicine_duplicate_batch_returns_409(self):
        self.client.force_authenticate(user=self.user)
        FakeMedicineRepository.should_duplicate = True

        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Ibuprofen 400mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH001",
                "expiration_date": "2028-01-31",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["message"], "Medicine batch_number already exists")

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_put_medicine_unchanged_returns_success_not_404(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.put(
            f"/api/medicines/{MEDICINE['_id']}/",
            {
                "name": "Paracetamol 500mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH001",
                "expiration_date": "2027-12-31",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "Medicine unchanged")

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_medicine_requires_authenticated_role(self):
        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Ibuprofen 400mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH003",
                "expiration_date": "2028-01-31",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_medicine_rejects_wrong_role(self):
        self.client.force_authenticate(user=self.pharmacy_user)
        response = self.client.post(
            "/api/medicines/",
            {
                "name": "Ibuprofen 400mg",
                "manufacturer": "TraceMed Pharma",
                "batch_number": "BATCH003",
                "expiration_date": "2028-01-31",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_batch_qr_is_public_read_response(self):
        response = self.client.get(
            "/api/batches/BATCH001/qr/",
            HTTP_ORIGIN="http://localhost:3000",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:3000")
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["batch_number"], "BATCH001")
        self.assertEqual(response.data["data"]["status"], "Inspected")

    @patch("medicine.views.MedicineRecordRepository", FakeMedicineRecordRepository)
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_batch_history_returns_medicine_and_records(self):
        response = self.client.get("/api/batches/BATCH001/history/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["medicine"]["batch_number"], "BATCH001")
        self.assertEqual(response.data["data"]["history"][0]["batch_number"], "BATCH001")

    @patch("medicine.views.MedicineRecordRepository", FakeMedicineRecordRepository)
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_batch_history_returns_404_when_batch_missing(self):
        response = self.client.get("/api/batches/UNKNOWN/history/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["message"], "Batch not found")

    @patch("medicine.views.MedicineRecordRepository", FakeMedicineRecordRepository)
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_record_saves_to_record_repository(self):
        self.client.force_authenticate(user=self.pharmacy_user)
        response = self.client.post(
            "/api/records/",
            {
                "batch_number": "BATCH001",
                "location": "Warehouse A",
                "status": "Delivered",
                "temperature": 24.0,
                "humidity": 60.0,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(len(FakeMedicineRecordRepository.created_payloads), 1)
        saved = FakeMedicineRecordRepository.created_payloads[0]
        self.assertEqual(saved["batch_number"], "BATCH001")
        self.assertEqual(saved["medicine_id"], MEDICINE["_id"])
        self.assertEqual(saved["medicine_name"], MEDICINE["name"])
        self.assertEqual(saved["blockchain_sync_status"], "disabled")

    @override_settings(BLOCKCHAIN_ENABLED=True)
    @patch("medicine.views.record_status_on_chain", side_effect=BlockchainTransactionError("chain down"))
    @patch("medicine.views.MedicineRecordRepository", FakeMedicineRecordRepository)
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_record_saves_mongo_when_blockchain_sync_fails(self, *_mocks):
        self.client.force_authenticate(user=self.pharmacy_user)

        response = self.client.post(
            "/api/records/",
            {
                "batch_number": "BATCH001",
                "location": "Warehouse A",
                "status": "Delivered",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["message"], "Record added, but blockchain sync failed")
        self.assertEqual(len(FakeMedicineRecordRepository.created_payloads), 1)
        self.assertEqual(
            FakeMedicineRecordRepository.updated_payloads[0]["data"]["blockchain_sync_status"],
            "failed",
        )

    @patch("medicine.views.MedicineRecordRepository", FakeMedicineRecordRepository)
    @patch("medicine.views.MedicineRepository", FakeMedicineRepository)
    def test_post_record_rejects_missing_batch(self):
        self.client.force_authenticate(user=self.pharmacy_user)

        response = self.client.post(
            "/api/records/",
            {
                "batch_number": "UNKNOWN",
                "location": "Warehouse A",
                "status": "Delivered",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["message"], "Batch not found")
        self.assertEqual(FakeMedicineRecordRepository.created_payloads, [])
