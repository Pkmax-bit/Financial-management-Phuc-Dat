#!/usr/bin/env python3
"""
Script to import kitchen cabinet data from SQL query into custom products system
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

def create_kitchen_cabinet_structure():
    """Create the complete kitchen cabinet structure in custom products system"""

    supabase = get_supabase_client()

    try:
        # Step 1: Create category for Kitchen Cabinets
        category_data = {
            "id": str(uuid.uuid4()),
            "name": "Tu Bep",
            "description": "He thong tu bep voi cac loai nhom, tay nam, kinh va bo phan",
            "order_index": 1,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("custom_product_categories").insert(category_data).execute()
        category_id = result.data[0]["id"]
        print(f"Created category: {category_data['name']} (ID: {category_id})")

        # Step 2: Create columns
        columns_data = [
            {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "name": "Loai Nhom",
                "description": "Loai nhom su dung cho tu bep",
                "order_index": 1,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "name": "Loai Tay Nam",
                "description": "Loai tay nam cho tu bep",
                "order_index": 2,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "name": "Loai Kinh",
                "description": "Loai kinh su dung cho tu bep",
                "order_index": 3,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "name": "Bo Phan",
                "description": "Bo phan cua tu bep",
                "order_index": 4,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        ]

        # Insert columns
        for col_data in columns_data:
            result = supabase.table("custom_product_columns").insert(col_data).execute()
            print(f"Created column: {col_data['name']} (ID: {col_data['id']})")

        # Map column names to IDs for easy reference
        column_map = {col["name"]: col["id"] for col in columns_data}

        # Also create English names mapping
        column_name_map = {
            "Loai Nhom": "Loai Nhom",
            "Loai Tay Nam": "Loai Tay Nam",
            "Loai Kinh": "Loai Kinh",
            "Bo Phan": "Bo Phan"
        }

        # Step 3: Create options for each column

        # Loai Nhom options
        nhom_options = [
            {"name": "Nhom thanh", "unit_price": 0, "unit": "cai"},
            {"name": "Thanh nhom dinh hinh dang rong MAC NHOM 6063 T5", "unit_price": 0, "unit": "cai"}
        ]

        # Loai Tay Nam options
        tay_nam_options = [
            {"name": "Tay nam bi", "unit_price": 0, "unit": "cai"},
            {"name": "Tay nam am", "unit_price": 0, "unit": "cai"}
        ]

        # Loai Kinh options
        kinh_options = [
            {"name": "Kinh 4 li", "unit_price": 0, "unit": "m2"},
            {"name": "Kinh 4 li sieu trong", "unit_price": 0, "unit": "m2"},
            {"name": "Kinh 5 li sieu trong", "unit_price": 0, "unit": "m2"},
            {"name": "Kinh 5 li cuong luc", "unit_price": 0, "unit": "m2"},
            {"name": "Kinh 5 li sieu trong cuong luc", "unit_price": 0, "unit": "m2"},
            {"name": "Kinh mo 5li", "unit_price": 0, "unit": "m2"}
        ]

        # Bo Phan options
        bo_phan_options = [
            {"name": "Tu bep tren", "unit_price": 0, "unit": "cai"},
            {"name": "Tu bep duoi", "unit_price": 0, "unit": "cai"},
            {"name": "Tu dung", "unit_price": 0, "unit": "cai"},
            {"name": "Tu lanh", "unit_price": 0, "unit": "cai"},
            {"name": "Ban dao 1 mat", "unit_price": 0, "unit": "cai"},
            {"name": "Ban dao 2 mat", "unit_price": 0, "unit": "cai"},
            {"name": "Hoc keo ray bi", "unit_price": 0, "unit": "cai"},
            {"name": "Hoc keo ray am", "unit_price": 0, "unit": "cai"},
            {"name": "Tang nhom", "unit_price": 0, "unit": "cai"},
            {"name": "Mat canh", "unit_price": 0, "unit": "cai"},
            {"name": "Tu do kho", "unit_price": 0, "unit": "cai"}
        ]

        # Insert options for each column
        options_data = [
            (column_map["Loai Nhom"], nhom_options),
            (column_map["Loai Tay Nam"], tay_nam_options),
            (column_map["Loai Kinh"], kinh_options),
            (column_map["Bo Phan"], bo_phan_options)
        ]

        for column_id, options in options_data:
            for i, option in enumerate(options):
                option_data = {
                    "id": str(uuid.uuid4()),
                    "column_id": column_id,
                    "name": option["name"],
                    "order_index": i,
                    "unit_price": option["unit_price"],
                    "unit": option["unit"],
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                result = supabase.table("custom_product_options").insert(option_data).execute()
                print(f"   Created option: {option['name']}")

        # Step 4: Create default structure
        structure_data = {
            "id": str(uuid.uuid4()),
            "category_id": category_id,
            "name": "Cau truc tu bep co ban",
            "description": "Thu tu: Loai Nhom -> Loai Tay Nam -> Loai Kinh -> Bo Phan",
            "column_order": [
                column_map["Loai Nhom"],
                column_map["Loai Tay Nam"],
                column_map["Loai Kinh"],
                column_map["Bo Phan"]
            ],
            "separator": " ",
            "is_default": True,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("custom_product_structures").insert(structure_data).execute()
        print(f"Created default structure: {structure_data['name']}")

        print("\nSuccessfully created kitchen cabinet structure!")
        print(f"📁 Category ID: {category_id}")
        print(f"📋 Columns: {len(columns_data)}")
        print(f"🔘 Options: {len(nhom_options) + len(tay_nam_options) + len(kinh_options) + len(bo_phan_options)}")

        return category_id

    except Exception as e:
        print("Error creating kitchen cabinet structure")
        print("Error details:", str(e).encode('utf-8', 'replace').decode('utf-8'))
        return None

def create_sample_products(category_id):
    """Create some sample combined products"""

    supabase = get_supabase_client()

    try:
        # Get all columns and options for the category
        columns_result = supabase.table("custom_product_columns").select("id, name").eq("category_id", category_id).execute()
        columns = columns_result.data

        if not columns:
            print("No columns found for category")
            return

        # Create a sample product: "Tu bep tren nhom thanh tay nam bi kinh 4 li"
        sample_options = {
            "Loai Nhom": "Nhom thanh",
            "Loai Tay Nam": "Tay nam bi",
            "Loai Kinh": "Kinh 4 li",
            "Bo Phan": "Tu bep tren"
        }

        # Get option IDs for sample product
        selected_options = []
        for column in columns:
            options_result = supabase.table("custom_product_options").select("id, name").eq("column_id", column["id"]).execute()
            options = options_result.data

            # Find matching option
            for option in options:
                if option["name"] == sample_options.get(column["name"]):
                    selected_options.append({
                        "column_id": column["id"],
                        "column_name": column["name"],
                        "option_id": option["id"],
                        "option_name": option["name"],
                        "quantity": 1,
                        "unit_price": 0
                    })
                    break

        if len(selected_options) == len(columns):
            product_data = {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "name": "Tu bep tren nhom thanh tay nam bi kinh 4 li",
                "description": "San pham mau duoc tao tu dong",
                "column_options": {opt["column_id"]: opt for opt in selected_options},
                "quantity": 1,
                "total_price": 0,
                "total_amount": 0,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            result = supabase.table("custom_products").insert(product_data).execute()
            print(f"Created sample product: {product_data['name']}")
        else:
            print("Could not create sample product - missing options")

    except Exception as e:
        print(f"Error creating sample products: {str(e)}")

if __name__ == "__main__":
    print("Starting kitchen cabinet data import...")

    # Create the structure
    category_id = create_kitchen_cabinet_structure()

    if category_id:
        # Create sample products
        create_sample_products(category_id)

    print("\nImport completed!")
    print("\nNext steps:")
    print("1. Run database migration if not already done")
    print("2. Restart backend and frontend")
    print("3. Go to /sales/custom-products to see the created structure")
    print("4. Go to /sales/combine-products to create new products")
