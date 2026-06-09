# TraceMed Backend API Guide

Base URL for local development:

```text
http://localhost:8000
```

Frontend origin allowed by default:

```text
http://localhost:3000
```

QR lookup is public and uses `batch_number`.

Write APIs require JWT authentication. QR lookup remains public read-only.

## Response Format

Success:

```json
{
  "status": "success",
  "message": "Optional message",
  "count": 1,
  "data": {}
}
```

Error:

```json
{
  "status": "error",
  "message": "Human-readable error",
  "errors": {}
}
```

## Status Values

Use one of these values for medicine and history records:

```text
Created
Produced
Inspected
InTransit
Delivered
Sold
Recalled
```

## Public Endpoints

### Health Check

```http
GET /
```

Response:

```text
TraceMed medicine app is working
```

### QR Lookup

```http
GET /api/batches/<batch_number>/qr/
```

Example:

```bash
curl http://localhost:8000/api/batches/BATCH001/qr/
```

Response:

```json
{
  "status": "success",
  "data": {
    "batch_number": "BATCH001",
    "name": "Paracetamol 500mg",
    "manufacturer": "TraceMed Pharma",
    "expiration_date": "2027-12-31",
    "status": "Inspected",
    "location": "Factory A",
    "temperature": 24.5,
    "humidity": 58.0,
    "blockchain_hash": ""
  }
}
```

## Auth APIs

### Login

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

Response:

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

### Refresh Access Token

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

### Current User

```http
GET /api/auth/me/
Authorization: Bearer <jwt-access-token>
```

## Medicine APIs

### List Medicines

```http
GET /api/medicines/
```

### Create Medicine

```http
POST /api/medicines/
Content-Type: application/json
Authorization: Bearer <jwt-access-token>
```

Body:

```json
{
  "name": "Ibuprofen 400mg",
  "manufacturer": "HealthCorp",
  "batch_number": "BATCH003",
  "expiration_date": "2028-01-31",
  "description": "Anti-inflammatory medicine.",
  "location": "Factory C",
  "status": "Created",
  "temperature": 24.0,
  "humidity": 60.0
}
```

Response:

```json
{
  "status": "success",
  "message": "Medicine added successfully",
  "data": {
    "id": "665f1f77bcf86cd799439011"
  }
}
```

If `batch_number` already exists, backend returns `409 Conflict`.

### Medicine Detail

```http
GET /api/medicines/<medicine_id>/
PUT /api/medicines/<medicine_id>/
DELETE /api/medicines/<medicine_id>/
```

`PUT` returns success even when the submitted data matches the current document.

### Search Medicines

```http
GET /api/search/?q=<keyword>
```

Searches by `name` and `batch_number`.

## Supply Chain History APIs

### List Records

```http
GET /api/records/
```

### Create Record

```http
POST /api/records/
Content-Type: application/json
Authorization: Bearer <jwt-access-token>
```

Body:

```json
{
  "batch_number": "BATCH001",
  "location": "Warehouse A",
  "status": "Delivered",
  "temperature": 24.0,
  "humidity": 60.0,
  "note": "Received by warehouse."
}
```

Backend requires `batch_number` to exist in medicines before creating a history record. If `medicine_id` is omitted, backend resolves it from `batch_number`.

### Records By Medicine ID

```http
GET /api/records/<medicine_id>/
```

### Batch History

```http
GET /api/batches/<batch_number>/history/
```

Response:

```json
{
  "status": "success",
  "data": {
    "medicine": {
      "_id": "665f1f77bcf86cd799439011",
      "name": "Paracetamol 500mg",
      "manufacturer": "TraceMed Pharma",
      "batch_number": "BATCH001",
      "expiration_date": "2027-12-31",
      "status": "Inspected"
    },
    "history": [
      {
        "_id": "665f1f77bcf86cd799439099",
        "medicine_id": "665f1f77bcf86cd799439011",
        "batch_number": "BATCH001",
        "medicine_name": "Paracetamol 500mg",
        "location": "Quality Lab 1",
        "status": "Inspected",
        "temperature": 23.8,
        "humidity": 57.0,
        "note": "Quality inspection passed."
      }
    ]
  }
}
```

## Demo Data

Create demo auth roles and users:

```bash
python manage.py seed_auth_roles
```

Demo users:

```text
admin / admin123
regulator / regulator123
manufacturer / manufacturer123
inspector / inspector123
logistics / logistics123
pharmacy / pharmacy123
```

Start MongoDB local before seeding medicine data, then run:

```bash
python manage.py seed_demo_data
```

The seed command creates demo batches `BATCH001` and `BATCH002` with supply-chain history.

To seed the full 20-medicine dataset from the team:

```bash
python manage.py seed_medicines
```

This command skips existing `batch_number` values, so it is safe to run more than once.

## Frontend Notes

- Use `batch_number` for QR routes, for example `/qr/BATCH001`.
- The frontend should call `GET /api/batches/BATCH001/qr/` for public QR display.
- Send `Authorization: Bearer <access_token>` for write APIs.
- `manufacturer`, `regulator`, and `admin` can create/update/delete medicines.
- All configured roles can create medicine history records.
- Do not call MongoDB directly from frontend.
