"""
Script to add default product categories to the database
Usage: python backend/scripts/add_default_product_categories.py
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase_client

# Default product categories
DEFAULT_CATEGORIES = [
    {"name": "Nhôm XingFa Nhập khẩu", "description": "Nhôm XingFa nhập khẩu chất lượng cao"},
    {"name": "Nhôm XingFa Việt Nam", "description": "Nhôm XingFa sản xuất tại Việt Nam"},
    {"name": "Nhôm MaxPro", "description": "Nhôm MaxPro - sản phẩm nhôm cao cấp"},
    {"name": "Nhôm ZhongKai", "description": "Nhôm ZhongKai - nhôm nhập khẩu"},
    {"name": "Nhôm OWin", "description": "Nhôm OWin - sản phẩm nhôm chất lượng"},
    {"name": "Cửa kính cường lực", "description": "Cửa kính cường lực an toàn"},
    {"name": "Vách kính", "description": "Vách kính ngăn phòng, văn phòng"},
    {"name": "Phòng tắm kính", "description": "Phòng tắm kính hiện đại"},
    {"name": "Lan can ban công kính", "description": "Lan can ban công bằng kính"},
    {"name": "Lan can cầu thang kính", "description": "Lan can cầu thang kính an toàn"},
    {"name": "Cửa sắt CNC", "description": "Cửa sắt CNC công nghệ cao"},
    {"name": "Nhôm PMI", "description": "Nhôm PMI - sản phẩm nhôm chất lượng"},
    {"name": "Nhôm HMA", "description": "Nhôm HMA - nhôm nhập khẩu"},
]

def add_default_categories():
    """Add default product categories to the database"""
    try:
        supabase = get_supabase_client()
        
        added_count = 0
        skipped_count = 0
        
        for category in DEFAULT_CATEGORIES:
            # Check if category already exists
            existing = supabase.table("product_categories").select("id").eq("name", category["name"]).execute()
            
            if existing.data:
                print(f"⚠️  Category '{category['name']}' already exists, skipping...")
                skipped_count += 1
                continue
            
            # Insert new category
            category_data = {
                "name": category["name"],
                "description": category.get("description", ""),
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("product_categories").insert(category_data).execute()
            
            if result.data:
                print(f"✅ Added category: {category['name']}")
                added_count += 1
            else:
                print(f"❌ Failed to add category: {category['name']}")
        
        print("\n" + "="*50)
        print(f"Summary:")
        print(f"  ✅ Added: {added_count} categories")
        print(f"  ⚠️  Skipped: {skipped_count} categories (already exist)")
        print(f"  📊 Total: {len(DEFAULT_CATEGORIES)} categories")
        print("="*50)
        
        return added_count, skipped_count
        
    except Exception as e:
        print(f"❌ Error adding categories: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Starting to add default product categories...")
    print("="*50)
    add_default_categories()
    print("\n✨ Done!")




