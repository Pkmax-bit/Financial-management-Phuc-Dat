"""
Script test chi tiết: Lấy và hiển thị TOÀN BỘ dữ liệu nhân viên với đầy đủ thông tin
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or "https://mfmijckzlhevduwfigkl.supabase.co"
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
    os.getenv("SUPABASE_SERVICE_KEY") or 
    os.getenv("SUPABASE_ANON_KEY") or
    os.getenv("SUPABASE_KEY") or
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero"
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("TEST CHI TIẾT: TOÀN BỘ DỮ LIỆU NHÂN VIÊN, PHÒNG BAN, VỊ TRÍ")
print("=" * 80)
print()

# Test 1: Lấy TẤT CẢ departments
print("📋 TEST 1: Lấy TẤT CẢ phòng ban")
print("-" * 80)
try:
    response = supabase.table("departments").select("id, name, code, is_active").order("name").execute()
    departments = response.data
    departmentsMap = {d["id"]: d for d in departments}
    
    print(f"✅ Lấy được {len(departments)} phòng ban")
    print()
    for i, dept in enumerate(departments, 1):
        status = "✅ Active" if dept.get("is_active", True) else "❌ Inactive"
        print(f"   {i:2d}. {dept.get('name', 'N/A'):30s} (Code: {dept.get('code', 'N/A'):10s}) - {status}")
    print()
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()
    departmentsMap = {}

# Test 2: Lấy TẤT CẢ positions
print("📋 TEST 2: Lấy TẤT CẢ vị trí")
print("-" * 80)
try:
    response = supabase.table("positions").select("id, name, code, department_id, is_active").order("name").execute()
    positions = response.data
    positionsMap = {p["id"]: p for p in positions}
    
    print(f"✅ Lấy được {len(positions)} vị trí")
    print()
    for i, pos in enumerate(positions[:10], 1):  # Hiển thị 10 đầu tiên
        status = "✅ Active" if pos.get("is_active", True) else "❌ Inactive"
        dept_id = pos.get("department_id", "")
        dept_name = departmentsMap.get(dept_id, {}).get("name", "N/A") if dept_id else "N/A"
        print(f"   {i:2d}. {pos.get('name', 'N/A'):30s} (Code: {pos.get('code', 'N/A'):10s}) - Phòng ban: {dept_name:20s} - {status}")
    if len(positions) > 10:
        print(f"   ... và {len(positions) - 10} vị trí khác")
    print()
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()
    positionsMap = {}

# Test 3: Lấy TẤT CẢ nhân viên với đầy đủ thông tin
print("📋 TEST 3: Lấy TẤT CẢ nhân viên với đầy đủ thông tin")
print("-" * 80)
try:
    response = supabase.table("employees").select(
        "id, first_name, last_name, email, phone, employee_code, "
        "department_id, position_id, manager_id, hire_date, "
        "status, avatar_url, address, salary"
    ).eq("status", "active").order("first_name").execute()
    
    employees = response.data
    print(f"✅ Lấy được {len(employees)} nhân viên active")
    print()
    
    # Thống kê
    has_dept = sum(1 for e in employees if e.get("department_id"))
    has_pos = sum(1 for e in employees if e.get("position_id"))
    has_manager = sum(1 for e in employees if e.get("manager_id"))
    has_phone = sum(1 for e in employees if e.get("phone"))
    has_address = sum(1 for e in employees if e.get("address"))
    
    print(f"📊 Thống kê:")
    print(f"   - Có phòng ban: {has_dept}/{len(employees)} ({has_dept*100/len(employees) if employees else 0:.1f}%)")
    print(f"   - Có vị trí: {has_pos}/{len(employees)} ({has_pos*100/len(employees) if employees else 0:.1f}%)")
    print(f"   - Có quản lý: {has_manager}/{len(employees)} ({has_manager*100/len(employees) if employees else 0:.1f}%)")
    print(f"   - Có SĐT: {has_phone}/{len(employees)} ({has_phone*100/len(employees) if employees else 0:.1f}%)")
    print(f"   - Có địa chỉ: {has_address}/{len(employees)} ({has_address*100/len(employees) if employees else 0:.1f}%)")
    print()
    
    # Hiển thị chi tiết từng nhân viên
    print("📋 Chi tiết từng nhân viên:")
    print("-" * 80)
    for i, emp in enumerate(employees, 1):
        full_name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
        email = emp.get("email", "N/A")
        employee_code = emp.get("employee_code", "N/A")
        
        # Phòng ban
        dept_id = emp.get("department_id")
        dept_name = "❌ Chưa có"
        if dept_id:
            dept = departmentsMap.get(dept_id)
            if dept:
                dept_name = f"✅ {dept.get('name', 'N/A')}"
            else:
                dept_name = f"⚠️  ID: {dept_id[:8]}... (không tìm thấy)"
        
        # Vị trí
        pos_id = emp.get("position_id")
        pos_name = "❌ Chưa có"
        if pos_id:
            pos = positionsMap.get(pos_id)
            if pos:
                pos_name = f"✅ {pos.get('name', 'N/A')}"
            else:
                pos_name = f"⚠️  ID: {pos_id[:8]}... (không tìm thấy)"
        
        # Quản lý
        manager_id = emp.get("manager_id")
        manager_name = "❌ Chưa có"
        if manager_id:
            # Tìm manager trong danh sách employees
            manager = next((e for e in employees if e.get("id") == manager_id), None)
            if manager:
                mgr_full_name = f"{manager.get('first_name', '')} {manager.get('last_name', '')}".strip()
                manager_name = f"✅ {mgr_full_name}"
            else:
                manager_name = f"⚠️  ID: {manager_id[:8]}... (không tìm thấy)"
        
        print(f"\n{i:2d}. {full_name}")
        print(f"    📧 Email: {email}")
        print(f"    🆔 Mã NV: {employee_code}")
        print(f"    🏢 Phòng ban: {dept_name}")
        print(f"    💼 Vị trí: {pos_name}")
        print(f"    👤 Quản lý: {manager_name}")
        
        if emp.get("phone"):
            print(f"    📱 SĐT: {emp.get('phone')}")
        if emp.get("hire_date"):
            print(f"    📅 Ngày vào: {emp.get('hire_date')}")
        if emp.get("address"):
            print(f"    📍 Địa chỉ: {emp.get('address')}")
        if emp.get("salary"):
            print(f"    💰 Lương: {emp.get('salary')}")
    
    print()
    print("-" * 80)
    
except Exception as e:
    print(f"❌ Lỗi: {e}")
    import traceback
    traceback.print_exc()
    print()

# Test 4: Thống kê theo phòng ban
print("📋 TEST 4: Thống kê nhân viên theo phòng ban")
print("-" * 80)
try:
    dept_stats = {}
    for emp in employees:
        dept_id = emp.get("department_id")
        if dept_id:
            dept = departmentsMap.get(dept_id)
            dept_name = dept.get("name", "Unknown") if dept else f"ID: {dept_id[:8]}..."
        else:
            dept_name = "Chưa có phòng ban"
        
        if dept_name not in dept_stats:
            dept_stats[dept_name] = 0
        dept_stats[dept_name] += 1
    
    print("📊 Số lượng nhân viên theo phòng ban:")
    for dept_name, count in sorted(dept_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"   - {dept_name:30s}: {count:2d} nhân viên")
    print()
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()

# Test 5: Thống kê theo vị trí
print("📋 TEST 5: Thống kê nhân viên theo vị trí")
print("-" * 80)
try:
    pos_stats = {}
    for emp in employees:
        pos_id = emp.get("position_id")
        if pos_id:
            pos = positionsMap.get(pos_id)
            pos_name = pos.get("name", "Unknown") if pos else f"ID: {pos_id[:8]}..."
        else:
            pos_name = "Chưa có vị trí"
        
        if pos_name not in pos_stats:
            pos_stats[pos_name] = 0
        pos_stats[pos_name] += 1
    
    print("📊 Số lượng nhân viên theo vị trí:")
    for pos_name, count in sorted(pos_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"   - {pos_name:30s}: {count:2d} nhân viên")
    print()
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print()

print("=" * 80)
print("KẾT THÚC TEST")
print("=" * 80)

