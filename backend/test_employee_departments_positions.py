"""
Test script để kiểm tra việc lấy dữ liệu nhân viên, phòng ban và vị trí từ Supabase
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Thiếu SUPABASE_URL hoặc SUPABASE_KEY trong file .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_fetch_employees_with_departments_positions():
    """Test lấy nhân viên với phòng ban và vị trí"""
    print("\n" + "="*60)
    print("TEST: Lấy nhân viên với phòng ban và vị trí")
    print("="*60)
    
    try:
        # Test 1: Query với relationship
        print("\n[Test 1] Query với relationship (departments:department_id, positions:position_id)")
        result = supabase.table("employees").select("""
            id,
            first_name,
            last_name,
            email,
            department_id,
            position_id,
            departments:department_id (id, name),
            positions:position_id (id, name)
        """).eq("status", "active").limit(5).execute()
        
        print(f"✅ Query thành công: {len(result.data)} nhân viên")
        
        if result.data:
            print("\n📊 Dữ liệu mẫu (nhân viên đầu tiên):")
            emp = result.data[0]
            print(f"   ID: {emp.get('id')}")
            print(f"   Tên: {emp.get('first_name')} {emp.get('last_name')}")
            print(f"   Email: {emp.get('email')}")
            print(f"   Department ID: {emp.get('department_id')}")
            print(f"   Position ID: {emp.get('position_id')}")
            print(f"   Departments (relationship): {emp.get('departments')}")
            print(f"   Positions (relationship): {emp.get('positions')}")
            
            # Kiểm tra cấu trúc
            dept = emp.get('departments')
            pos = emp.get('positions')
            
            if dept:
                if isinstance(dept, dict):
                    print(f"   ✅ Department là object: {dept.get('name')}")
                elif isinstance(dept, list):
                    print(f"   ✅ Department là array: {dept[0].get('name') if dept else 'Empty'}")
                else:
                    print(f"   ⚠️ Department có kiểu không xác định: {type(dept)}")
            else:
                print(f"   ❌ Không có dữ liệu department từ relationship")
            
            if pos:
                if isinstance(pos, dict):
                    print(f"   ✅ Position là object: {pos.get('name')}")
                elif isinstance(pos, list):
                    print(f"   ✅ Position là array: {pos[0].get('name') if pos else 'Empty'}")
                else:
                    print(f"   ⚠️ Position có kiểu không xác định: {type(pos)}")
            else:
                print(f"   ❌ Không có dữ liệu position từ relationship")
        else:
            print("   ⚠️ Không có nhân viên nào")
        
    except Exception as e:
        print(f"❌ Lỗi khi query với relationship: {str(e)}")
        import traceback
        traceback.print_exc()

def test_fetch_departments():
    """Test lấy danh sách phòng ban"""
    print("\n" + "="*60)
    print("TEST: Lấy danh sách phòng ban")
    print("="*60)
    
    try:
        result = supabase.table("departments").select("id, name, code").order("name").execute()
        
        print(f"✅ Query thành công: {len(result.data)} phòng ban")
        
        if result.data:
            print("\n📊 Danh sách phòng ban:")
            for i, dept in enumerate(result.data[:10], 1):  # Hiển thị 10 đầu tiên
                print(f"   {i}. {dept.get('name')} (ID: {dept.get('id')}, Code: {dept.get('code', 'N/A')})")
            if len(result.data) > 10:
                print(f"   ... và {len(result.data) - 10} phòng ban khác")
        else:
            print("   ⚠️ Không có phòng ban nào")
            
    except Exception as e:
        print(f"❌ Lỗi khi lấy phòng ban: {str(e)}")
        import traceback
        traceback.print_exc()

def test_fetch_positions():
    """Test lấy danh sách vị trí"""
    print("\n" + "="*60)
    print("TEST: Lấy danh sách vị trí")
    print("="*60)
    
    try:
        result = supabase.table("positions").select("id, name, department_id").order("name").execute()
        
        print(f"✅ Query thành công: {len(result.data)} vị trí")
        
        if result.data:
            print("\n📊 Danh sách vị trí:")
            for i, pos in enumerate(result.data[:10], 1):  # Hiển thị 10 đầu tiên
                print(f"   {i}. {pos.get('name')} (ID: {pos.get('id')}, Dept ID: {pos.get('department_id', 'N/A')})")
            if len(result.data) > 10:
                print(f"   ... và {len(result.data) - 10} vị trí khác")
        else:
            print("   ⚠️ Không có vị trí nào")
            
    except Exception as e:
        print(f"❌ Lỗi khi lấy vị trí: {str(e)}")
        import traceback
        traceback.print_exc()

def test_employees_with_department_position_mapping():
    """Test lấy nhân viên và map với phòng ban/vị trí"""
    print("\n" + "="*60)
    print("TEST: Lấy nhân viên và map với phòng ban/vị trí")
    print("="*60)
    
    try:
        # Lấy tất cả nhân viên
        employees_result = supabase.table("employees").select("id, first_name, last_name, email, department_id, position_id").eq("status", "active").execute()
        
        print(f"✅ Lấy được {len(employees_result.data)} nhân viên")
        
        if not employees_result.data:
            print("   ⚠️ Không có nhân viên nào")
            return
        
        # Lấy tất cả phòng ban
        dept_result = supabase.table("departments").select("id, name").execute()
        departments_map = {dept['id']: dept['name'] for dept in (dept_result.data or [])}
        print(f"✅ Lấy được {len(departments_map)} phòng ban")
        
        # Lấy tất cả vị trí
        pos_result = supabase.table("positions").select("id, name").execute()
        positions_map = {pos['id']: pos['name'] for pos in (pos_result.data or [])}
        print(f"✅ Lấy được {len(positions_map)} vị trí")
        
        # Map nhân viên với phòng ban và vị trí
        print("\n📊 Danh sách nhân viên với phòng ban và vị trí:")
        employees_with_dept_pos = []
        
        for emp in employees_result.data[:10]:  # Hiển thị 10 đầu tiên
            dept_id = emp.get('department_id')
            pos_id = emp.get('position_id')
            
            dept_name = departments_map.get(dept_id, 'Không có phòng ban') if dept_id else 'Không có phòng ban'
            pos_name = positions_map.get(pos_id, 'Không có vị trí') if pos_id else 'Không có vị trí'
            
            employees_with_dept_pos.append({
                'name': f"{emp.get('first_name')} {emp.get('last_name')}",
                'email': emp.get('email'),
                'department': dept_name,
                'position': pos_name
            })
            
            print(f"   - {emp.get('first_name')} {emp.get('last_name')}")
            print(f"     Email: {emp.get('email')}")
            print(f"     Phòng ban: {dept_name} (ID: {dept_id})")
            print(f"     Vị trí: {pos_name} (ID: {pos_id})")
            print()
        
        if len(employees_result.data) > 10:
            print(f"   ... và {len(employees_result.data) - 10} nhân viên khác")
        
        # Thống kê
        print("\n📈 Thống kê:")
        employees_with_dept = sum(1 for emp in employees_result.data if emp.get('department_id'))
        employees_with_pos = sum(1 for emp in employees_result.data if emp.get('position_id'))
        employees_with_both = sum(1 for emp in employees_result.data if emp.get('department_id') and emp.get('position_id'))
        
        print(f"   - Nhân viên có phòng ban: {employees_with_dept}/{len(employees_result.data)} ({employees_with_dept*100/len(employees_result.data):.1f}%)")
        print(f"   - Nhân viên có vị trí: {employees_with_pos}/{len(employees_result.data)} ({employees_with_pos*100/len(employees_result.data):.1f}%)")
        print(f"   - Nhân viên có cả phòng ban và vị trí: {employees_with_both}/{len(employees_result.data)} ({employees_with_both*100/len(employees_result.data):.1f}%)")
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()

def test_foreign_key_relationships():
    """Test kiểm tra foreign key relationships"""
    print("\n" + "="*60)
    print("TEST: Kiểm tra Foreign Key Relationships")
    print("="*60)
    
    try:
        # Test query với foreign key constraint name
        print("\n[Test] Query với foreign key constraint name")
        result = supabase.table("employees").select("""
            id,
            first_name,
            last_name,
            department_id,
            position_id,
            departments!employees_department_id_fkey (id, name),
            positions!employees_position_id_fkey (id, name)
        """).eq("status", "active").limit(3).execute()
        
        print(f"✅ Query với constraint name thành công: {len(result.data)} nhân viên")
        
        if result.data:
            for emp in result.data:
                print(f"\n   Nhân viên: {emp.get('first_name')} {emp.get('last_name')}")
                print(f"   Department (constraint): {emp.get('departments')}")
                print(f"   Position (constraint): {emp.get('positions')}")
        
    except Exception as e:
        print(f"❌ Lỗi khi query với constraint name: {str(e)}")
        print("   (Có thể constraint name không đúng, sẽ dùng cách khác)")

def main():
    """Hàm main để chạy tất cả tests"""
    print("\n" + "="*60)
    print("KIỂM TRA DỮ LIỆU NHÂN VIÊN, PHÒNG BAN VÀ VỊ TRÍ")
    print("="*60)
    
    # Test 1: Lấy phòng ban
    test_fetch_departments()
    
    # Test 2: Lấy vị trí
    test_fetch_positions()
    
    # Test 3: Lấy nhân viên với relationship
    test_fetch_employees_with_departments_positions()
    
    # Test 4: Map nhân viên với phòng ban/vị trí
    test_employees_with_department_position_mapping()
    
    # Test 5: Kiểm tra foreign key relationships
    test_foreign_key_relationships()
    
    print("\n" + "="*60)
    print("KẾT THÚC TEST")
    print("="*60)
    print("\n💡 Lưu ý:")
    print("   - Nếu relationship query không hoạt động, sẽ dùng fallback method")
    print("   - Kiểm tra console logs trong browser để xem chi tiết")
    print("   - Đảm bảo foreign key relationships đã được thiết lập đúng trong database")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy bởi người dùng")
    except Exception as e:
        print(f"\n❌ Lỗi không mong đợi: {str(e)}")
        import traceback
        traceback.print_exc()

