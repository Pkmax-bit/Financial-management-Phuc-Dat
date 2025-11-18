"""
Script tạo chức vụ Admin cho phòng ban Quản lý
Chạy: python scripts/create/add_admin_position.py
"""

import os
import sys
from pathlib import Path

# Thêm thư mục gốc vào path
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def create_admin_position():
    """Tạo chức vụ Admin cho phòng ban Quản lý"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY trong file .env")
        return False
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("🔍 Đang tìm phòng ban 'Quản lý'...")
        
        # Tìm phòng ban "Quản lý"
        dept_result = supabase.table("departments").select("id, name, code").or_("code.eq.MGMT,name.eq.Quản lý").eq("is_active", True).limit(1).execute()
        
        if not dept_result.data:
            # Thử tìm theo id cố định
            dept_result = supabase.table("departments").select("id, name, code").eq("id", "dept-001").limit(1).execute()
        
        if not dept_result.data:
            print("❌ Không tìm thấy phòng ban 'Quản lý'!")
            print("   Vui lòng tạo phòng ban 'Quản lý' trước khi chạy script này.")
            return False
        
        dept = dept_result.data[0]
        dept_id = dept["id"]
        dept_name = dept["name"]
        
        print(f"✅ Tìm thấy phòng ban: {dept_name} (ID: {dept_id})")
        
        # Kiểm tra xem chức vụ Admin đã tồn tại chưa
        print("🔍 Đang kiểm tra chức vụ Admin...")
        
        existing_pos = supabase.table("positions").select("id, name, code").eq("name", "Admin").eq("department_id", dept_id).limit(1).execute()
        
        if existing_pos.data:
            print(f"⚠️ Chức vụ Admin đã tồn tại trong phòng ban {dept_name}!")
            print(f"   - ID: {existing_pos.data[0]['id']}")
            print(f"   - Mã: {existing_pos.data[0]['code']}")
            return True
        
        # Tạo mã chức vụ
        position_code = "POS-MGMT-ADMIN"
        
        # Kiểm tra mã có trùng không
        code_check = supabase.table("positions").select("id").eq("code", position_code).limit(1).execute()
        counter = 1
        while code_check.data:
            position_code = f"POS-MGMT-ADMIN-{counter:03d}"
            code_check = supabase.table("positions").select("id").eq("code", position_code).limit(1).execute()
            counter += 1
        
        # Tạo chức vụ Admin
        print("📝 Đang tạo chức vụ Admin...")
        
        position_data = {
            "name": "Admin",
            "code": position_code,
            "description": "Quản trị viên hệ thống - Phòng Quản lý",
            "department_id": dept_id,
            "salary_range_min": 30000000,  # 30 triệu
            "salary_range_max": 60000000,  # 60 triệu
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("positions").insert(position_data).execute()
        
        if result.data:
            new_position = result.data[0]
            print("✅ Đã tạo chức vụ Admin thành công!")
            print(f"   - ID: {new_position['id']}")
            print(f"   - Tên: {new_position['name']}")
            print(f"   - Mã: {new_position['code']}")
            print(f"   - Phòng ban: {dept_name}")
            print(f"   - Lương: {new_position.get('salary_range_min', 0):,.0f} - {new_position.get('salary_range_max', 0):,.0f} VNĐ")
            return True
        else:
            print("❌ Không thể tạo chức vụ Admin!")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi khi tạo chức vụ Admin: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("TẠO CHỨC VỤ ADMIN CHO PHÒNG BAN QUẢN LÝ")
    print("=" * 60)
    print()
    
    success = create_admin_position()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Hoàn thành!")
    else:
        print("❌ Có lỗi xảy ra!")
    print("=" * 60)

