"""
Test script cho MongoDB CRUD operations
Chạy script này để test các hàm insert_one, find_one, update_one, delete_one
"""

import sys
import os
from datetime import datetime, timedelta

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import CRUD functions
from medicine.models import (
    insert_medicine, 
    find_medicine, 
    find_one_medicine, 
    update_medicine, 
    delete_medicine,
    medicine_collection
)


def test_crud_operations():
    """Test tất cả CRUD operations"""
    
    if medicine_collection is None:
        print("✗ MongoDB not connected!")
        return
    
    print("\n" + "="*60)
    print("TESTING MONGODB CRUD OPERATIONS")
    print("="*60)
    
    # Test 1: Insert (CREATE)
    print("\n1. Testing INSERT_ONE...")
    medicine_data = {
        "name": "Paracetamol 500mg",
        "manufacturer": "Pharma Corp",
        "batch_number": "BATCH001",
        "expiration_date": datetime.now() + timedelta(days=365),
        "description": "Pain reliever and fever reducer",
        "location": "Warehouse A",
        "temperature": 25.5,
        "humidity": 60.0,
        "timestamp": datetime.now()
    }
    
    inserted_id = insert_medicine(medicine_data)
    if inserted_id:
        print(f"✓ Medicine inserted successfully with ID: {inserted_id}")
    else:
        print("✗ Failed to insert medicine")
        return
    
    # Test 2: Find One (READ)
    print("\n2. Testing FIND_ONE...")
    found_medicine = find_one_medicine({"name": "Paracetamol 500mg"})
    if found_medicine:
        print(f"✓ Medicine found:")
        for key, value in found_medicine.items():
            print(f"  {key}: {value}")
    else:
        print("✗ Medicine not found")
        return
    
    # Test 3: Find All (READ)
    print("\n3. Testing FIND (all medicines)...")
    all_medicines = find_medicine()
    print(f"✓ Found {len(all_medicines)} medicine(s)")
    for i, med in enumerate(all_medicines[:2], 1):
        print(f"  {i}. {med.get('name')} - {med.get('batch_number')}")
    
    # Test 4: Update (UPDATE)
    print("\n4. Testing UPDATE_ONE...")
    update_data = {
        "location": "Warehouse B",
        "temperature": 22.0,
        "humidity": 55.0
    }
    updated_count = update_medicine(
        {"name": "Paracetamol 500mg"},
        update_data
    )
    if updated_count > 0:
        print(f"✓ {updated_count} medicine(s) updated successfully")
        
        # Verify update
        updated_medicine = find_one_medicine({"name": "Paracetamol 500mg"})
        print(f"  New location: {updated_medicine.get('location')}")
        print(f"  New temperature: {updated_medicine.get('temperature')}")
    else:
        print("✗ Failed to update medicine")
    
    # Test 5: Delete (DELETE)
    print("\n5. Testing DELETE_ONE...")
    deleted_count = delete_medicine({"name": "Paracetamol 500mg"})
    if deleted_count > 0:
        print(f"✓ {deleted_count} medicine(s) deleted successfully")
    else:
        print("✗ Failed to delete medicine")
    
    # Verify deletion
    print("\n6. Verifying deletion...")
    verify_medicine = find_one_medicine({"name": "Paracetamol 500mg"})
    if verify_medicine is None:
        print("✓ Medicine successfully removed from database")
    else:
        print("✗ Medicine still exists in database")
    
    print("\n" + "="*60)
    print("CRUD TESTS COMPLETED")
    print("="*60 + "\n")


if __name__ == "__main__":
    test_crud_operations()
