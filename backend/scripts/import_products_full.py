"""
Script to import all products from user data
Usage: python backend/scripts/import_products_full.py
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase_client

# Full product data from user (exact format)
PRODUCTS_DATA = [
    # Cửa kính cường lực
    {"name": "Cửa kính cường lực 1 cánh 10 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa kính cường lực 2 cánh 10 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 1 cánh 10 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 2 cánh 10 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa kính cường lực 1 cánh 12 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa kính cường lực 2 cánh 12 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 1 cánh 12 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 2 cánh 12 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa kính cường lực 1 cánh 15 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa kính cường lực 2 cánh 15 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 1 cánh 15 li", "category_name": "Cửa kính cường lực"},
    {"name": "Cửa lùa kính cường lực 2 cánh 15 li", "category_name": "Cửa kính cường lực"},
    {"name": "Phụ kiện bản lề sàn VVP", "category_name": "Cửa kính cường lực"},
    {"name": "Phụ kiện bản lề sàn Hafpler", "category_name": "Cửa kính cường lực"},
    {"name": "Phụ kiện của lùa thanh treo", "category_name": "Cửa kính cường lực"},
    {"name": "Phụ kiện của lùa Zamilldoor", "category_name": "Cửa kính cường lực"},
    
    # Cửa sắt CNC
    {"name": "Cổng sắt CNC 4 cánh", "category_name": "Cửa sắt CNC"},
    
    # Lan can ban công kính
    {"name": "Lan can kính cường lực 10 li tay vịn gỗ", "category_name": "Lan can ban công kính"},
    {"name": "Lan can kính cường lực 10 li tay vịn nhôm", "category_name": "Lan can ban công kính"},
    {"name": "Lan can kính cường lực 12 li tay vịn gỗ", "category_name": "Lan can ban công kính"},
    {"name": "Lan can kính cường lực 12 li tay vịn nhôm", "category_name": "Lan can ban công kính"},
    
    # Lan can cầu thang kính
    {"name": "Lan can kính cường lực 10 li tay vịn gỗ", "category_name": "Lan can cầu thang kính"},
    {"name": "Lan can kính cường lực 10 li tay vịn nhôm", "category_name": "Lan can cầu thang kính"},
    {"name": "Lan can kính cường lực 12 li tay vịn gỗ", "category_name": "Lan can cầu thang kính"},
    {"name": "Lan can kính cường lực 12 li tay vịn nhôm", "category_name": "Lan can cầu thang kính"},
    
    # Nhôm HMA
    {"name": "Cửa đi mở quay 1 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi mở quay 2 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi mở quay 3 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi mở quay 4 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi mở quay", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi lùa 1 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi lùa 2 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi lùa 3 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa đi lùa 4 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ mở quay 1", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ mở quay 2", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ mở quay 3", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ mở quay 4", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ lùa 1 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ lùa 2 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ lùa 3 cánh", "category_name": "Nhôm HMA"},
    {"name": "Cửa sổ lùa 4 cánh", "category_name": "Nhôm HMA"},
    {"name": "Vách nhôm", "category_name": "Nhôm HMA"},
    {"name": "Mặt dựng", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 3", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 4", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 5", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 6", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 7", "category_name": "Nhôm HMA"},
    {"name": "Cửa xếp trượt 8", "category_name": "Nhôm HMA"},
    
    # Nhôm PMI
    {"name": "Cửa đi mở quay 1 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi mở quay 2 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi mở quay 3 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi mở quay 4 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi mở quay", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi lùa 1 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi lùa 2 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi lùa 3 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa đi lùa 4 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ mở quay 1", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ mở quay 2", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ mở quay 3", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ mở quay 4", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ lùa 1 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ lùa 2 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ lùa 3 cánh", "category_name": "Nhôm PMI"},
    {"name": "Cửa sổ lùa 4 cánh", "category_name": "Nhôm PMI"},
    {"name": "Vách nhôm", "category_name": "Nhôm PMI"},
    {"name": "Mặt dựng", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 3", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 4", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 5", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 6", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 7", "category_name": "Nhôm PMI"},
    {"name": "Cửa xếp trượt 8", "category_name": "Nhôm PMI"},
    
    # Nhôm MaxPro
    {"name": "Cửa đi mở quay 1 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi mở quay 2 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi mở quay 3 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi mở quay 4 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi mở quay", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi lùa 1 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi lùa 2 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi lùa 3 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa đi lùa 4 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ mở quay 1", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ mở quay 2", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ mở quay 3", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ mở quay 4", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ lùa 1 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ lùa 2 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ lùa 3 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa sổ lùa 4 cánh", "category_name": "Nhôm MaxPro"},
    {"name": "Vách nhôm", "category_name": "Nhôm MaxPro"},
    {"name": "Mặt dựng", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 3", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 4", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 5", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 6", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 7", "category_name": "Nhôm MaxPro"},
    {"name": "Cửa xếp trượt 8", "category_name": "Nhôm MaxPro"},
    
    # Nhôm OWin
    {"name": "Cửa thủy lực 2 cánh", "category_name": "Nhôm OWin"},
    
    # Nhôm XingFa Nhập khẩu
    {"name": "Cửa đi mở quay 1 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi mở quay 2 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi mở quay 3 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi mở quay 4 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi mở quay", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi lùa 1 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi lùa 2 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi lùa 3 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa đi lùa 4 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ mở quay 1", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ mở quay 2", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ mở quay 3", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ mở quay 4", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ lùa 1 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ lùa 2 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ lùa 3 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa sổ lùa 4 cánh", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Vách nhôm", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Mặt dựng", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 3", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 4", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 5", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 6", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 7", "category_name": "Nhôm XingFa Nhập khẩu"},
    {"name": "Cửa xếp trượt 8", "category_name": "Nhôm XingFa Nhập khẩu"},
    
    # Nhôm XingFa Việt Nam
    {"name": "Cửa đi mở quay 1 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi mở quay 2 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi mở quay 3 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi mở quay 4 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi mở quay", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi lùa 1 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi lùa 2 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi lùa 3 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa đi lùa 4 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ mở quay 1", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ mở quay 2", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ mở quay 3", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ mở quay 4", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ lùa 1 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ lùa 2 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ lùa 3 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa sổ lùa 4 cánh", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Vách nhôm", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Mặt dựng", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 3", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 4", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 5", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 6", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 7", "category_name": "Nhôm XingFa Việt Nam"},
    {"name": "Cửa xếp trượt 8", "category_name": "Nhôm XingFa Việt Nam"},
    
    # Nhôm ZhongKai
    {"name": "Cửa trượt quay 2 cánh", "category_name": "Nhôm ZhongKai"},
    {"name": "Cửa trượt quay 3 cánh", "category_name": "Nhôm ZhongKai"},
    {"name": "Cửa trượt quay 4 cánh", "category_name": "Nhôm ZhongKai"},
    {"name": "Cửa trượt quay 5 cánh", "category_name": "Nhôm ZhongKai"},
    {"name": "Cửa trượt quay 6 cánh", "category_name": "Nhôm ZhongKai"},
    
    # Phòng tắm kính
    {"name": "Phòng tắm kính cửa lùa", "category_name": "Phòng tắm kính"},
    {"name": "Phòng tắm kính cửa mở 90 độ", "category_name": "Phòng tắm kính"},
    {"name": "Phòng tắm kính cửa mở 135 độ", "category_name": "Phòng tắm kính"},
    {"name": "Phòng tắm kính cửa mở 180 độ", "category_name": "Phòng tắm kính"},
    {"name": "Phụ kiện VVP 90 độ", "category_name": "Phòng tắm kính"},
    {"name": "Phụ kiện VVP 135 độ", "category_name": "Phòng tắm kính"},
    {"name": "Phụ kiện VVP 180 độ", "category_name": "Phòng tắm kính"},
    
    # Vách kính
    {"name": "Vách kính cường lực 10 li", "category_name": "Vách kính"},
    {"name": "Vách kính cường lực 12 li", "category_name": "Vách kính"},
]

def get_category_id_by_name(supabase, category_name):
    """Get category ID by name"""
    result = supabase.table("product_categories").select("id").eq("name", category_name).execute()
    if result.data:
        return result.data[0]["id"]
    return None

def import_products():
    """Import products to the database"""
    try:
        supabase = get_supabase_client()
        
        # Build category name to ID mapping
        print("📋 Building category mapping...")
        category_map = {}
        unique_categories = set(p["category_name"] for p in PRODUCTS_DATA)
        
        for category_name in unique_categories:
            category_id = get_category_id_by_name(supabase, category_name)
            if category_id:
                category_map[category_name] = category_id
                print(f"  ✅ {category_name}: {category_id}")
            else:
                print(f"  ⚠️  Category '{category_name}' not found in database!")
        
        print(f"\n✅ Found {len(category_map)}/{len(unique_categories)} categories")
        print()
        
        added_count = 0
        skipped_count = 0
        error_count = 0
        
        print("🚀 Starting to import products...")
        print("="*70)
        
        for idx, product in enumerate(PRODUCTS_DATA, 1):
            product_name = product["name"]
            category_name = product["category_name"]
            category_id = category_map.get(category_name)
            
            if not category_id:
                print(f"{idx:3d}. ❌ {product_name[:50]:<50} | Category not found: {category_name}")
                error_count += 1
                continue
            
            # Check if product already exists (by name AND category_id to allow same name in different categories)
            existing = supabase.table("products").select("id").eq("name", product_name).eq("category_id", category_id).execute()
            
            if existing.data:
                print(f"{idx:3d}. ⚠️  {product_name[:50]:<50} | Already exists in {category_name}, skipping...")
                skipped_count += 1
                continue
            
            # Create product
            product_data = {
                "name": product_name,
                "category_id": category_id,
                "price": 0.0,  # Default price, can be updated later
                "unit": "cái",  # Default unit
                "description": f"Sản phẩm {product_name}",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("products").insert(product_data).execute()
            
            if result.data:
                print(f"{idx:3d}. ✅ {product_name[:50]:<50} | {category_name}")
                added_count += 1
            else:
                print(f"{idx:3d}. ❌ {product_name[:50]:<50} | Failed to create")
                error_count += 1
        
        print()
        print("="*70)
        print(f"Summary:")
        print(f"  ✅ Added: {added_count} products")
        print(f"  ⚠️  Skipped: {skipped_count} products (already exist)")
        print(f"  ❌ Errors: {error_count} products")
        print(f"  📊 Total: {len(PRODUCTS_DATA)} products")
        print("="*70)
        
        return added_count, skipped_count, error_count
        
    except Exception as e:
        print(f"❌ Error importing products: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    print("🚀 Starting product import...")
    print()
    import_products()
    print()
    print("✨ Done!")

