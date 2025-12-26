#!/usr/bin/env python3
"""
Script to import material data from the SQL query into the system
"""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from services.supabase_client import get_supabase_client
import uuid
from datetime import datetime

def create_material_data():
    """Create material data from the SQL query"""

    supabase = get_supabase_client()

    try:
        # Material data from the SQL query
        materials_data = [
            # Basic materials for Tu bep tren
            {"name": "Nhom thanh", "unit": "cai", "price": 0},
            {"name": "Thanh nhom dinh hinh dang rong MAC NHOM 6063 T5", "unit": "cai", "price": 0},
            {"name": "Ban le giam chinh lot long SUS304 (315.06.752)", "unit": "cai", "price": 0},
            {"name": "Ban le giam chinh trung ngoai SUS304 (315.06.750)", "unit": "cai", "price": 0},
            {"name": "Ban le giam chinh trung nua SUS304 (315.06.751)", "unit": "cai", "price": 0},
            {"name": "Son", "unit": "kg", "price": 0},
            {"name": "Dong ran son kinh", "unit": "lit", "price": 0},
            {"name": "Xang", "unit": "lit", "price": 0},
            {"name": "Oc vit", "unit": "cai", "price": 0},
            {"name": "Keo", "unit": "kg", "price": 0},
            {"name": "Alu", "unit": "kg", "price": 0},
            {"name": "Ke", "unit": "cai", "price": 0},
            {"name": "PE", "unit": "kg", "price": 0},
            {"name": "Kinh mo 5li", "unit": "m2", "price": 0},
            {"name": "Kinh 4li trong", "unit": "m2", "price": 0},

            # Basic materials for Tu bep duoi
            {"name": "Ban le giam chinh trung nua SUS304 (315.06.751)", "unit": "cai", "price": 0},

            # Basic materials for Tu dung
            {"name": "Ban le giam chinh lot long SUS304 (315.06.752)", "unit": "cai", "price": 0},
            {"name": "Ban le giam chinh trung ngoai SUS304 (315.06.750)", "unit": "cai", "price": 0},
            {"name": "Ban le giam chinh trung nua SUS304 (315.06.751)", "unit": "cai", "price": 0},

            # Basic materials for Tu lanh
            {"name": "Ban le giam chinh trung ngoai SUS304 (315.06.750)", "unit": "cai", "price": 0},

            # Basic materials for Ban dao
            {"name": "Ban le giam chinh trung nua SUS304 (315.06.751)", "unit": "cai", "price": 0},

            # Basic materials for Hoc keo
            {"name": "Ray bi", "unit": "cai", "price": 0},
            {"name": "Ray am", "unit": "cai", "price": 0},

            # Glass variations
            {"name": "Kinh 4li sieu trong sieu trong trong", "unit": "m2", "price": 0},
            {"name": "Kinh 5li sieu trong", "unit": "m2", "price": 0},
            {"name": "Kinh 5li cuong luc", "unit": "m2", "price": 0},
            {"name": "Kinh 5li sieu trong cuong luc", "unit": "m2", "price": 0},
        ]

        created_count = 0
        for material in materials_data:
            # Check if material already exists
            existing = supabase.table("products").select("id").eq("name", material["name"]).execute()

            if not existing.data:
                product_data = {
                    "id": str(uuid.uuid4()),
                    "name": material["name"],
                    "unit": material["unit"],
                    "price": material["price"],
                    "description": f"Material: {material['name']}",
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }

                result = supabase.table("products").insert(product_data).execute()
                if result.data:
                    created_count += 1
                    print(f"Created material: {material['name']}")
                else:
                    print(f"Failed to create: {material['name']}")
            else:
                print(f"Material already exists: {material['name']}")

        print(f"\nSuccessfully imported {created_count} materials!")

        return True

    except Exception as e:
        print(f"Error importing materials: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting material data import...")

    success = create_material_data()

    if success:
        print("\nMaterial import completed!")
        print("\nNext steps:")
        print("1. Check /sales/products to see imported materials")
        print("2. Update prices for materials as needed")
    else:
        print("\nMaterial import failed!")
