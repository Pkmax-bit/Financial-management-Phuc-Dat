"""
Script test nhanh: Kiểm tra dữ liệu nhân viên, phòng ban, vị trí
Sử dụng sau khi sửa foreign keys để xác nhận mọi thứ hoạt động đúng
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration - thử nhiều cách
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
    os.getenv("SUPABASE_SERVICE_KEY") or 
    os.getenv("SUPABASE_ANON_KEY") or
    os.getenv("SUPABASE_KEY")
)

# Nếu không có trong .env, dùng default từ config
if not SUPABASE_URL:
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
if not SUPABASE_KEY:
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("TEST NHANH: DỮ LIỆU NHÂN VIÊN, PHÒNG BAN, VỊ TRÍ")
print("=" * 60)
print()

# Test 1: Lấy nhân viên với relationship query
print("📋 TEST 1: Query nhân viên với relationship")
print("-" * 60)
try:
    response = supabase.table("employees").select(
        "id, first_name, last_name, email, department_id, position_id, "
        "departments:department_id (id, name, code), "
        "positions:position_id (id, name)"
    ).eq("status", "active").limit(10).execute()
    
    employees = response.data
    print(f"✅ Lấy được {len(employees)} nhân viên")
    print()
    
    # Kiểm tra relationship
    has_dept_relationship = 0
    has_pos_relationship = 0
    
    for emp in employees[:5]:  # Chỉ hiển thị 5 nhân viên đầu
        dept = emp.get("departments")
        pos = emp.get("positions")
        
        dept_name = dept.get("name") if dept else None
        pos_name = pos.get("name") if pos else None
        
        if dept_name:
            has_dept_relationship += 1
        if pos_name:
            has_pos_relationship += 1
        
        status_dept = "✅" if dept_name else "❌"
        status_pos = "✅" if pos_name else "❌"
        
        full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
        print(f"   {status_dept} {status_pos} {full_name}")
        print(f"      Phòng ban: {dept_name or 'Không có (relationship)'}")
        print(f"      Vị trí: {pos_name or 'Không có (relationship)'}")
        print()
    
    print(f"📊 Kết quả relationship query:")
    print(f"   - Có phòng ban từ relationship: {has_dept_relationship}/{len(employees[:5])}")
    print(f"   - Có vị trí từ relationship: {has_pos_relationship}/{len(employees[:5])}")
    print()
    
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()

# Test 2: Fallback method (query riêng và map)
print("📋 TEST 2: Fallback method (query riêng và map)")
print("-" * 60)
try:
    # Lấy departments
    dept_response = supabase.table("departments").select("id, name, code").execute()
    departments = {d["id"]: d for d in dept_response.data}
    
    # Lấy positions
    pos_response = supabase.table("positions").select("id, name").execute()
    positions = {p["id"]: p for p in pos_response.data}
    
    # Lấy employees
    emp_response = supabase.table("employees").select(
        "id, first_name, last_name, email, department_id, position_id"
    ).eq("status", "active").limit(10).execute()
    
    employees = emp_response.data
    
    print(f"✅ Lấy được {len(employees)} nhân viên")
    print(f"✅ Lấy được {len(departments)} phòng ban")
    print(f"✅ Lấy được {len(positions)} vị trí")
    print()
    
    # Map dữ liệu
    mapped_count = 0
    for emp in employees[:5]:  # Chỉ hiển thị 5 nhân viên đầu
        dept_id = emp.get("department_id")
        pos_id = emp.get("position_id")
        
        dept = departments.get(dept_id) if dept_id else None
        pos = positions.get(pos_id) if pos_id else None
        
        dept_name = dept.get("name") if dept else None
        pos_name = pos.get("name") if pos else None
        
        if dept_name and pos_name:
            mapped_count += 1
        
        status = "✅" if (dept_name and pos_name) else "⚠️"
        full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
        print(f"   {status} {full_name}")
        print(f"      Phòng ban: {dept_name or 'Không có'}")
        print(f"      Vị trí: {pos_name or 'Không có'}")
        print()
    
    print(f"📊 Kết quả fallback method:")
    print(f"   - Map thành công: {mapped_count}/{len(employees[:5])}")
    print()
    
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()

# Test 3: Kiểm tra foreign key constraints
print("📋 TEST 3: Kiểm tra Foreign Key Constraints")
print("-" * 60)
try:
    # Query để xem foreign key constraints
    query = """
    SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'employees' 
      AND tc.constraint_type = 'FOREIGN KEY'
    ORDER BY kcu.column_name;
    """
    
    # Note: Supabase Python client không hỗ trợ raw SQL query trực tiếp
    # Cần chạy query này trong Supabase SQL Editor
    print("⚠️  Không thể query trực tiếp từ Python client")
    print("   Vui lòng chạy query sau trong Supabase SQL Editor:")
    print()
    print(query)
    print()
    
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()

print("=" * 60)
print("KẾT THÚC TEST")
print("=" * 60)
print()
print("💡 Lưu ý:")
print("   - Nếu TEST 1 có ❌: Foreign keys chưa được sửa đúng")
print("   - Nếu TEST 2 có ✅: Frontend vẫn hoạt động (dùng fallback)")
print("   - Để sửa foreign keys: Chạy script trong SUA_FOREIGN_KEYS_NHANH.md")

