# TraceMed API Guide

## MongoDB CRUD Operations

### 1. Insert (Thêm dữ liệu)
```python
from medicine.models import insert_medicine

medicine_data = {
    "name": "Paracetamol 500mg",
    "manufacturer": "Pharma Corp",
    "batch_number": "BATCH001",
    "expiration_date": "2025-05-28",
    "location": "Warehouse A",
    "temperature": 25.5,
    "humidity": 60.0
}

medicine_id = insert_medicine(medicine_data)
print(f"Inserted ID: {medicine_id}")
```

### 2. Find One (Lấy một dữ liệu)
```python
from medicine.models import find_one_medicine

medicine = find_one_medicine({"name": "Paracetamol 500mg"})
print(medicine)
```

### 3. Find All (Lấy tất cả dữ liệu)
```python
from medicine.models import find_medicine

all_medicines = find_medicine()
# Với điều kiện
medicines = find_medicine({"manufacturer": "Pharma Corp"})
```

### 4. Update (Cập nhật dữ liệu)
```python
from medicine.models import update_medicine

updated_count = update_medicine(
    {"name": "Paracetamol 500mg"},
    {"location": "Warehouse B", "temperature": 22.0}
)
print(f"Updated: {updated_count}")
```

### 5. Delete (Xóa dữ liệu)
```python
from medicine.models import delete_medicine

deleted_count = delete_medicine({"name": "Paracetamol 500mg"})
print(f"Deleted: {deleted_count}")
```

---

## REST API Endpoints

### Medicine Management
- **GET `/api/medicines/`** - Lấy danh sách tất cả thuốc
- **POST `/api/medicines/`** - Thêm thuốc mới
- **GET `/api/medicines/<id>/`** - Lấy chi tiết một thuốc
- **PUT `/api/medicines/<id>/`** - Cập nhật thông tin thuốc
- **DELETE `/api/medicines/<id>/`** - Xóa thuốc

### Supply Chain Tracking
- **GET `/api/records/`** - Lấy tất cả lịch sử vận chuyển
- **POST `/api/records/`** - Thêm bản ghi vận chuyển mới
- **GET `/api/records/<medicine_id>/`** - Lấy lịch sử của một thuốc

### Search
- **GET `/api/search/?q=paracetamol`** - Tìm kiếm theo tên hoặc batch number

---

## Example Requests

### 1. Create Medicine
```bash
curl -X POST http://localhost:8000/api/medicines/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ibuprofen 400mg",
    "manufacturer": "HealthCorp",
    "batch_number": "BATCH002",
    "expiration_date": "2025-12-31",
    "description": "Anti-inflammatory medication",
    "location": "Warehouse A"
  }'
```

### 2. Get All Medicines
```bash
curl http://localhost:8000/api/medicines/
```

### 3. Update Medicine
```bash
curl -X PUT http://localhost:8000/api/medicines/507f1f77bcf86cd799439011/ \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Warehouse C",
    "temperature": 20.0
  }'
```

### 4. Delete Medicine
```bash
curl -X DELETE http://localhost:8000/api/medicines/507f1f77bcf86cd799439011/
```

### 5. Search
```bash
curl "http://localhost:8000/api/search/?q=Paracetamol"
```

---

## Running the Test
```bash
python manage.py shell
>>> exec(open('test_mongodb_crud.py').read())
```

Or directly:
```bash
python test_mongodb_crud.py
```

---

## Settings Configuration
Check `.env` for MongoDB URI:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tracemed?retryWrites=true&w=majority
MONGO_DB_NAME=tracemed
```

## Error Handling
- Connection timeout: 5 seconds (configurable in models.py)
- Retry writes: Enabled
- Returns `None` on errors with console logging
