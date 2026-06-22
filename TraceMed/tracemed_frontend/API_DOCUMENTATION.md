# TÀI LIỆU API TRACEMED BACKEND

> Phiên bản tài liệu: 20/06/2026  
> Nguồn đối chiếu: `medicine/urls.py`, views, serializers, permissions và Postman Collection của dự án.

## 1. Thông tin chung

| Nội dung | Giá trị |
|---|---|
| Base URL (local) | `http://localhost:8000` |
| Kiểu dữ liệu chính | `application/json` |
| Cơ chế xác thực | JWT Bearer Token |
| Access token | Nhận từ API đăng nhập |
| Phân trang | Cursor-based pagination |
| Cơ sở dữ liệu chính | MongoDB |
| Mạng blockchain cấu hình | Ethereum Sepolia (`chain_id = 11155111`) |

Các origin Front-end được cho phép mặc định:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

### Header dùng chung

Đối với request có JSON body:

```http
Content-Type: application/json
```

Đối với API yêu cầu đăng nhập:

```http
Authorization: Bearer <access_token>
```

### Cấu trúc response

Thành công:

```json
{
  "status": "success",
  "message": "Thông báo nếu có",
  "count": 1,
  "pagination": {
    "limit": 50,
    "has_more": false,
    "next_cursor": null
  },
  "data": {}
}
```

Không phải API nào cũng có đầy đủ `message`, `count`, `pagination` và `data`.

Thất bại do nghiệp vụ hoặc dữ liệu không hợp lệ:

```json
{
  "status": "error",
  "message": "Mô tả lỗi",
  "errors": {}
}
```

Lỗi xác thực/phân quyền do Django REST Framework xử lý có thể có dạng:

```json
{
  "detail": "Thông báo lỗi xác thực hoặc phân quyền"
}
```

### Mã trạng thái HTTP thường gặp

| Mã | Ý nghĩa |
|---:|---|
| `200 OK` | Lấy/cập nhật/xóa dữ liệu thành công |
| `201 Created` | Tạo dữ liệu thành công |
| `400 Bad Request` | Dữ liệu đầu vào không hợp lệ hoặc thiếu tham số |
| `401 Unauthorized` | Chưa đăng nhập, token sai hoặc token hết hạn |
| `403 Forbidden` | Đã đăng nhập nhưng không đúng vai trò |
| `404 Not Found` | Không tìm thấy thuốc, lô thuốc hoặc tài nguyên |
| `409 Conflict` | Trùng `batch_number` hoặc `medicine_code` |
| `502 Bad Gateway` | Không đọc/ghi được blockchain |
| `503 Service Unavailable` | Không thể thực hiện kiểm toán đồng bộ blockchain |

## 2. Vai trò và phân quyền

Các vai trò hợp lệ:

`admin`, `regulator`, `manufacturer`, `inspector`, `logistics`, `pharmacy`.

| Nhóm chức năng | Quyền truy cập |
|---|---|
| Đọc thuốc, lịch sử, QR, tìm kiếm | Công khai |
| Tạo/sửa/xóa thuốc | `admin`, `regulator`, `manufacturer` |
| Tạo bản ghi hành trình | Tất cả 6 vai trò đã cấu hình |
| Xem người dùng hiện tại | Người dùng đã đăng nhập |
| Quản lý role trên blockchain | Chỉ `admin` |
| API chẩn đoán blockchain | Công khai |

Khi `BLOCKCHAIN_ENABLED=True`, việc tạo trạng thái hành trình còn bị giới hạn:

| Trạng thái mới | Vai trò được phép |
|---|---|
| `Produced` | `manufacturer` |
| `Inspected` | `inspector` |
| `InTransit` | `logistics` |
| `Delivered`, `Sold` | `pharmacy` |
| `Cancelled` | `manufacturer` |
| `Recalled` | Vai trò đang sở hữu giai đoạn hiện tại của lô |

Các trạng thái thuốc/bản ghi hợp lệ:

`Created`, `Produced`, `Inspected`, `InTransit`, `Delivered`, `Sold`, `Recalled`, `Cancelled`.

Các trạng thái đồng bộ blockchain:

| Giá trị | Ý nghĩa |
|---|---|
| `disabled` | Blockchain đang tắt; dữ liệu chỉ lưu MongoDB |
| `synced` | Đã lưu MongoDB và giao dịch blockchain thành công |
| `failed` | Đã lưu MongoDB nhưng giao dịch blockchain thất bại |
| `skipped` | Trạng thái không có hành động tương ứng trên smart contract |

## 3. Danh sách nhanh API

| # | Method | Endpoint | Xác thực | Chức năng |
|---:|---|---|---|---|
| 1 | `GET` | `/` | Không | Kiểm tra server |
| 2 | `POST` | `/api/auth/login/` | Không | Đăng nhập |
| 3 | `POST` | `/api/auth/refresh/` | Không | Làm mới access token |
| 4 | `GET` | `/api/auth/me/` | JWT | Lấy người dùng hiện tại |
| 5 | `GET` | `/api/medicines/` | Không | Danh sách thuốc |
| 6 | `POST` | `/api/medicines/` | JWT + role | Tạo thuốc |
| 7 | `GET` | `/api/medicines/{medicine_id}/` | Không | Chi tiết thuốc |
| 8 | `PUT` | `/api/medicines/{medicine_id}/` | JWT + role | Cập nhật thuốc |
| 9 | `DELETE` | `/api/medicines/{medicine_id}/` | JWT + role | Xóa thuốc |
| 10 | `GET` | `/api/search/` | Không | Tìm thuốc |
| 11 | `GET` | `/api/batches/{batch_number}/qr/` | Không | Tra cứu bằng QR |
| 12 | `GET` | `/api/batches/{batch_number}/history/` | Không | Lịch sử theo lô |
| 13 | `GET` | `/api/records/` | Không | Danh sách bản ghi |
| 14 | `POST` | `/api/records/` | JWT + role | Tạo bản ghi hành trình |
| 15 | `GET` | `/api/records/{medicine_id}/` | Không | Bản ghi theo thuốc |
| 16 | `GET` | `/api/blockchain/status/` | Không | Trạng thái blockchain |
| 17 | `GET` | `/api/blockchain/sync-audit/` | Không | Kiểm toán đồng bộ |
| 18 | `GET` | `/api/blockchain/lots/{lot_id}/` | Không | Chi tiết lô on-chain |
| 19 | `GET` | `/api/blockchain/lots/{lot_id}/history/` | Không | Sự kiện lô on-chain |
| 20 | `POST` | `/api/blockchain/roles/add/` | JWT admin | Thêm ví vào role |
| 21 | `POST` | `/api/blockchain/roles/revoke/` | JWT admin | Thu hồi role |
| 22 | `POST` | `/api/blockchain/roles/activate/` | JWT admin | Kích hoạt lại role |

## 4. Health Check

### 4.1 Kiểm tra server

```http
GET /
```

Response `200 OK` là chuỗi văn bản, không phải JSON:

```text
TraceMed medicine app is working
```

## 5. Authentication API

### 5.1 Đăng nhập

```http
POST /api/auth/login/
Content-Type: application/json
```

Body:

```json
{
  "username": "manufacturer",
  "password": "manufacturer123"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `username` | string | Có | Tên đăng nhập |
| `password` | string | Có | Mật khẩu |

Response `200 OK`:

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access": "<jwt-access-token>",
    "refresh": "<jwt-refresh-token>",
    "user": {
      "id": 1,
      "username": "manufacturer",
      "email": "manufacturer@tracemed.local",
      "roles": ["manufacturer"],
      "is_staff": false,
      "is_superuser": false
    }
  }
}
```

Sai tài khoản/mật khẩu trả về `400 Bad Request` với message `Login failed`.

### 5.2 Làm mới access token

```http
POST /api/auth/refresh/
Content-Type: application/json
```

Body:

```json
{
  "refresh": "<jwt-refresh-token>"
}
```

Response `200 OK`:

```json
{
  "status": "success",
  "message": "Token refreshed",
  "data": {
    "access": "<new-jwt-access-token>"
  }
}
```

Refresh token sai/hết hạn trả về `401 Unauthorized`.

### 5.3 Lấy người dùng hiện tại

```http
GET /api/auth/me/
Authorization: Bearer <access_token>
```

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "manufacturer",
    "email": "manufacturer@tracemed.local",
    "roles": ["manufacturer"],
    "is_staff": false,
    "is_superuser": false
  }
}
```

## 6. Medicine API

### 6.1 Danh sách thuốc

```http
GET /api/medicines/
GET /api/medicines/?limit=20&cursor=<next_cursor>
```

Query params:

| Tham số | Bắt buộc | Mặc định | Mô tả |
|---|:---:|---:|---|
| `limit` | Không | `50` | Số phần tử mỗi trang, tối đa `100` |
| `cursor` | Không | — | Cursor nhận từ `pagination.next_cursor` |

Response `200 OK`:

```json
{
  "status": "success",
  "count": 1,
  "pagination": {
    "limit": 20,
    "has_more": false,
    "next_cursor": null
  },
  "data": [
    {
      "_id": "6a27d84bdb9d502b56be3b4e",
      "medicine_code": "MED001",
      "name": "Paracetamol 500mg",
      "generic_name": "Paracetamol",
      "category": "Pain reliever",
      "manufacturer": "DHG Pharma",
      "batch_number": "BATCH001",
      "expiration_date": "2028-01-15",
      "location": "Pharmacy Warehouse A",
      "quality_status": "Passed",
      "status": "Delivered",
      "temperature": 24.0,
      "humidity": 56.0,
      "blockchain_lot_id": null,
      "blockchain_sync_status": "disabled"
    }
  ]
}
```

### 6.2 Tạo thuốc/lô thuốc

Yêu cầu một trong các role: `admin`, `regulator`, `manufacturer`.

```http
POST /api/medicines/
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body tối thiểu:

```json
{
  "name": "Ibuprofen 400mg",
  "manufacturer": "TraceMed Pharma",
  "batch_number": "BATCH-DEMO-001",
  "expiration_date": "2028-01-31"
}
```

Body đầy đủ mẫu:

```json
{
  "medicine_code": "MED-DEMO-001",
  "name": "Ibuprofen 400mg",
  "generic_name": "Ibuprofen",
  "dosage_form": "Tablet",
  "strength": "400mg",
  "category": "Anti-inflammatory",
  "manufacturer": "TraceMed Pharma",
  "batch_number": "BATCH-DEMO-001",
  "manufacture_date": "2026-06-20",
  "expiration_date": "2028-01-31",
  "description": "Demo medicine",
  "location": "Factory C",
  "storage_condition": "Store below 30C",
  "quality_status": "Passed",
  "status": "Created",
  "temperature": 24.0,
  "humidity": 60.0
}
```

Các trường đầu vào:

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|:---:|---|
| `name` | string | Có | Tối đa 255 ký tự |
| `manufacturer` | string | Có | Tối đa 255 ký tự |
| `batch_number` | string | Có | Tối đa 100 ký tự, duy nhất |
| `expiration_date` | date | Có | Định dạng `YYYY-MM-DD` |
| `medicine_code` | string | Không | Duy nhất khi có giá trị |
| `manufacture_date` | date | Không | Định dạng `YYYY-MM-DD` |
| `status` | enum | Không | Mặc định `Created` |
| `temperature`, `humidity` | number/null | Không | Điều kiện bảo quản |
| Các trường mô tả còn lại | string | Không | Cho phép chuỗi rỗng |

Response `201 Created`:

```json
{
  "status": "success",
  "message": "Medicine added successfully",
  "data": {
    "id": "<new-medicine-object-id>"
  }
}
```

Nếu blockchain bật nhưng giao dịch thất bại, bản ghi MongoDB vẫn được tạo; response vẫn là `201` và có thêm `blockchain_sync_status: "failed"`, `blockchain_error`.

Lỗi thường gặp:

- `400`: thiếu/sai trường hoặc ngày không hợp lệ.
- `403`: không đúng role; khi blockchain bật, chỉ `manufacturer` được tạo lô on-chain.
- `409`: trùng `batch_number` hoặc `medicine_code`.

### 6.3 Chi tiết thuốc

```http
GET /api/medicines/{medicine_id}/
```

Ví dụ: `GET /api/medicines/6a27d84bdb9d502b56be3b4e/`

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "_id": "6a27d84bdb9d502b56be3b4e",
    "medicine_code": "MED001",
    "name": "Paracetamol 500mg",
    "manufacturer": "DHG Pharma",
    "batch_number": "BATCH001",
    "expiration_date": "2028-01-15",
    "status": "Delivered"
  }
}
```

`medicine_id` sai định dạng trả `400`; không tồn tại trả `404`.

### 6.4 Cập nhật thuốc

Yêu cầu role `admin`, `regulator` hoặc `manufacturer`. API dùng `PUT` nhưng chấp nhận cập nhật một phần, không cần gửi lại toàn bộ document.

```http
PUT /api/medicines/{medicine_id}/
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body mẫu:

```json
{
  "location": "Warehouse B",
  "temperature": 23.5,
  "humidity": 58.0
}
```

Response `200 OK`:

```json
{
  "status": "success",
  "message": "Medicine updated successfully"
}
```

Nếu dữ liệu mới giống dữ liệu cũ, message là `Medicine unchanged`.

### 6.5 Xóa thuốc

Yêu cầu role `admin`, `regulator` hoặc `manufacturer`.

```http
DELETE /api/medicines/{medicine_id}/
Authorization: Bearer <access_token>
```

Response `200 OK`:

```json
{
  "status": "success",
  "message": "Medicine deleted successfully"
}
```

API chỉ xóa document thuốc; code hiện tại không tự xóa các record lịch sử liên quan.

### 6.6 Tìm kiếm thuốc

```http
GET /api/search/?q=MED001&limit=25
```

| Tham số | Bắt buộc | Mô tả |
|---|:---:|---|
| `q` | Có | Từ khóa tìm kiếm |
| `limit` | Không | Mặc định `50`, tối đa `100` |

Tìm chính xác theo `batch_number`, `medicine_code`; nếu không có thì tìm theo tiền tố của tên, tên hoạt chất, nhà sản xuất, mã lô, mã thuốc và danh mục. Thiếu/rỗng `q` trả `400`.

Response `200 OK`:

```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "_id": "6a27d84bdb9d502b56be3b4e",
      "medicine_code": "MED001",
      "name": "Paracetamol 500mg",
      "manufacturer": "DHG Pharma",
      "batch_number": "BATCH001",
      "status": "Delivered"
    }
  ]
}
```

## 7. QR và lịch sử lô thuốc

### 7.1 Tra cứu QR theo mã lô

```http
GET /api/batches/{batch_number}/qr/
```

Ví dụ: `GET /api/batches/BATCH001/qr/`

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "medicine_code": "MED001",
    "batch_number": "BATCH001",
    "name": "Paracetamol 500mg",
    "generic_name": "Paracetamol",
    "dosage_form": "Tablet",
    "strength": "500mg",
    "category": "Pain reliever",
    "manufacturer": "DHG Pharma",
    "manufacture_date": "2026-01-15",
    "expiration_date": "2028-01-15",
    "storage_condition": "Store below 30C",
    "quality_status": "Passed",
    "status": "Delivered",
    "location": "Pharmacy Warehouse A",
    "temperature": 24.0,
    "humidity": 56.0,
    "blockchain_hash": "",
    "blockchain_lot_id": null,
    "blockchain_sync_status": "disabled"
  }
}
```

Không tìm thấy mã lô trả `404 Batch not found`.

### 7.2 Lịch sử theo mã lô

```http
GET /api/batches/{batch_number}/history/?limit=50&cursor=<next_cursor>
```

Lịch sử được sắp tăng dần theo `timestamp`.

Response `200 OK`:

```json
{
  "status": "success",
  "count": 2,
  "pagination": {
    "limit": 50,
    "has_more": false,
    "next_cursor": null
  },
  "data": {
    "medicine": {
      "_id": "6a27d84bdb9d502b56be3b4e",
      "name": "Paracetamol 500mg",
      "batch_number": "BATCH001",
      "status": "Produced"
    },
    "history": [
      {
        "_id": "<record-id-1>",
        "medicine_id": "6a27d84bdb9d502b56be3b4e",
        "batch_number": "BATCH001",
        "location": "Factory A",
        "status": "Created",
        "timestamp": "2026-06-13T07:27:00.216000"
      },
      {
        "_id": "<record-id-2>",
        "medicine_id": "6a27d84bdb9d502b56be3b4e",
        "batch_number": "BATCH001",
        "location": "Factory A",
        "status": "Produced",
        "timestamp": "2026-06-13T08:00:00.000000"
      }
    ]
  }
}
```

## 8. Supply Chain Record API

### 8.1 Danh sách tất cả bản ghi

```http
GET /api/records/?limit=50&cursor=<next_cursor>
```

Response sử dụng cấu trúc phân trang chung; `data` là mảng record và được sắp tăng dần theo thời gian.

### 8.2 Danh sách bản ghi theo thuốc

```http
GET /api/records/{medicine_id}/?limit=50&cursor=<next_cursor>
```

API lọc theo `medicine_id`. Nếu không có record phù hợp, trả `200` với `data: []`, không trả `404`.

### 8.3 Tạo bản ghi hành trình

Yêu cầu đăng nhập bằng một trong 6 role hệ thống.

```http
POST /api/records/
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body tối thiểu:

```json
{
  "batch_number": "BATCH001",
  "location": "Pharmacy Warehouse A",
  "status": "Delivered"
}
```

Body đầy đủ mẫu:

```json
{
  "batch_number": "BATCH001",
  "location": "Pharmacy Warehouse A",
  "status": "Delivered",
  "temperature": 24.0,
  "humidity": 56.0,
  "quality_status": "Passed",
  "note": "Received by pharmacy warehouse"
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|:---:|---|
| `batch_number` | string | Có | Phải tồn tại trong collection thuốc |
| `location` | string | Có | Tối đa 255 ký tự |
| `status` | enum | Có | Một trong 8 trạng thái hợp lệ |
| `temperature`, `humidity` | number/null | Không | Điều kiện vận chuyển/bảo quản |
| `quality_status` | string | Không | Ví dụ `Passed`, `Failed` |
| `note` | string | Không | Ghi chú nghiệp vụ |
| `medicine_id` | string | Không | Backend tự xác định lại từ `batch_number` |
| `timestamp` | datetime | Không | Backend ghi đè bằng thời điểm hiện tại |

Response `201 Created`:

```json
{
  "status": "success",
  "message": "Record added successfully",
  "data": {
    "id": "<new-record-object-id>"
  }
}
```

Sau khi tạo thành công, trạng thái/vị trí hiện tại của medicine được cập nhật theo record. Nếu blockchain bật và giao dịch bị từ chối, record vẫn được lưu với `blockchain_sync_status: "failed"`, nhưng medicine không tiến sang trạng thái bị từ chối.

Quy tắc blockchain đáng chú ý:

- `Recalled`: lý do phải có ít nhất 10 ký tự.
- `Cancelled`: chỉ hủy lô mới tạo trước khi sản xuất; lý do ít nhất 5 ký tự.
- `Inspected` với `quality_status` thất bại có thể làm smart contract chuyển lô sang `Recalled`.
- Không tìm thấy `batch_number`: `404 Batch not found`.
- Sai role cho trạng thái: `403 Forbidden`.

## 9. Blockchain Read API

Các API phần này chỉ đọc/chẩn đoán, không gửi giao dịch.

### 9.1 Trạng thái kết nối blockchain

```http
GET /api/blockchain/status/
```

Response `200 OK` mẫu:

```json
{
  "status": "success",
  "data": {
    "configured": true,
    "connected": true,
    "contract_address": "0xf9592BDC391C778F2BE7Eb3F736784e505E0B534",
    "chain_id": 11155111,
    "private_key_set": false,
    "role_private_keys_set": {
      "admin": true,
      "manufacturer": true,
      "inspector": true,
      "logistics": true,
      "pharmacy": true
    },
    "roles_ready": true,
    "missing_roles": [],
    "blockchain_enabled": false
  }
}
```

`configured` cho biết đủ URL provider, contract address và ABI; `connected` cho biết kết nối thật sự thành công; `blockchain_enabled` quyết định backend có gửi giao dịch khi ghi dữ liệu hay không.

### 9.2 Kiểm toán đồng bộ MongoDB và blockchain

```http
GET /api/blockchain/sync-audit/
GET /api/blockchain/sync-audit/?check_chain=false&only_problems=true
```

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `check_chain` | `true` | Đọc blockchain để so sánh trạng thái |
| `only_problems` | `false` | Chỉ trả các bản ghi có vấn đề |

Response chứa `summary` tổng hợp các trạng thái `disabled`, `synced`, `failed`, `skipped`, `status_mismatch`... và mảng `items` chi tiết.

### 9.3 Chi tiết lô trên blockchain

```http
GET /api/blockchain/lots/{blockchain_lot_id}/
```

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "lot_id": 1,
    "name": "BATCH001",
    "manufacturer_id": 1,
    "inspector_id": 1,
    "logistics_id": 1,
    "pharmacy_id": 1,
    "stage": 4,
    "stage_text": "Delivered"
  }
}
```

Lỗi cấu hình/kết nối/đọc contract trả `502 Cannot read blockchain lot`.

### 9.4 Lịch sử sự kiện lô trên blockchain

```http
GET /api/blockchain/lots/{blockchain_lot_id}/history/
GET /api/blockchain/lots/{blockchain_lot_id}/history/?from_block=0&to_block=latest
```

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `from_block` | `0` | Block bắt đầu, phải chuyển được thành số nguyên |
| `to_block` | `latest` | Block kết thúc hoặc `latest` |

Response `data` là mảng sự kiện gồm `event_name`, `lot_id`, `stage`, `stage_text`, `updated_by`, `timestamp`, `note`, `tx_hash`, `block_number`, `log_index`.

## 10. Blockchain Role Management API

Yêu cầu:

- JWT của người dùng có role `admin`.
- `ADMIN_PRIVATE_KEY` thuộc owner của smart contract.
- `role` chỉ nhận: `manufacturer`, `inspector`, `logistics`, `pharmacy`.

### 10.1 Thêm ví vào role

```http
POST /api/blockchain/roles/add/
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Body:

```json
{
  "role": "manufacturer",
  "wallet": "0x0000000000000000000000000000000000000001"
}
```

Response `200 OK` chứa `tx_hash`, `block_number`, `status`, `role`, `wallet` và message `Blockchain role added`.

### 10.2 Thu hồi role

```http
POST /api/blockchain/roles/revoke/
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Body:

```json
{
  "role": "inspector",
  "id": 2,
  "reason": "Role revoked by admin"
}
```

`id` là ID role trên smart contract, không phải Django user ID. `reason` nếu có phải dài ít nhất 5 ký tự; nếu rỗng backend dùng lý do mặc định.

### 10.3 Kích hoạt lại role

```http
POST /api/blockchain/roles/activate/
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Body:

```json
{
  "role": "logistics",
  "id": 3
}
```

Response `200 OK` chứa `tx_hash`, `block_number`, `status`, `role`, `role_id` và message `Blockchain role activated`.

## 11. Dữ liệu demo để kiểm thử

Tạo user/role demo:

```powershell
python manage.py seed_auth_roles
```

| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Regulator | `regulator` | `regulator123` |
| Manufacturer | `manufacturer` | `manufacturer123` |
| Inspector | `inspector` | `inspector123` |
| Logistics | `logistics` | `logistics123` |
| Pharmacy | `pharmacy` | `pharmacy123` |

Tạo index và dữ liệu thuốc mẫu:

```powershell
python manage.py ensure_mongo_indexes
python manage.py seed_medicines
python manage.py backfill_medicine_search_fields
```

Các mã lô có lịch sử mẫu: `BATCH001`, `BATCH002`, `BATCH003`.

## 12. Hướng dẫn dùng Postman

1. Import file `postman_collection.json` vào Postman.
2. Kiểm tra collection variable `base_url = http://localhost:8000`.
3. Chạy request **Login**; test script tự lưu `access_token` và `refresh_token`.
4. Chạy các request đọc dữ liệu hoặc request ghi phù hợp với role vừa đăng nhập.
5. Với phân trang, lấy `pagination.next_cursor` của trang trước đưa vào query `cursor` của trang sau.

Lưu ý: Postman Collection hiện có các API nghiệp vụ chính và blockchain read. Ba API quản lý blockchain role được mô tả đầy đủ trong tài liệu này nhưng chưa có request tương ứng trong collection.

## 13. Checklist kiểm thử nhanh

- Login đúng/sai mật khẩu và refresh token đúng/sai.
- Gọi `/api/auth/me/` khi có, thiếu và hết hạn token.
- Tạo medicine hợp lệ; thử trùng `batch_number` và `medicine_code`.
- Kiểm tra phân quyền create/update/delete bằng từng role.
- Kiểm tra `limit`, `cursor`, trang cuối và cursor không hợp lệ.
- Tìm kiếm chính xác, tìm tiền tố, từ khóa rỗng và ký tự đặc biệt.
- Tra QR/lịch sử với batch tồn tại và không tồn tại.
- Tạo record theo đúng/sai chuỗi trạng thái và đúng/sai role.
- Khi blockchain tắt, xác nhận `blockchain_sync_status = disabled`.
- Khi blockchain bật, kiểm tra tình huống giao dịch thành công/thất bại và đối chiếu sync audit.

