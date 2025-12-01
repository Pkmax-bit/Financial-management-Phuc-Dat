"""
Script Python để tự động sửa foreign key relationships cho bảng employees
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env")
    print("   Cần service role key để có quyền sửa database schema")
    sys.exit(1)

# Initialize Supabase client với service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_foreign_keys():
    """Kiểm tra foreign key constraints hiện tại"""
    print("\n" + "="*60)
    print("KIỂM TRA FOREIGN KEY CONSTRAINTS HIỆN TẠI")
    print("="*60)
    
    # Query để kiểm tra constraints
    query = """
    SELECT 
        tc.constraint_name, 
        tc.table_name, 
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
    
    try:
        # Sử dụng RPC hoặc direct SQL query
        result = supabase.rpc('exec_sql', {'query': query}).execute()
        print("✅ Đã kiểm tra constraints")
        return result.data if result.data else []
    except Exception as e:
        print(f"⚠️  Không thể kiểm tra constraints (có thể cần chạy SQL trực tiếp): {str(e)}")
        return []

def fix_department_foreign_key():
    """Sửa foreign key cho department_id"""
    print("\n" + "="*60)
    print("SỬA FOREIGN KEY CHO DEPARTMENT_ID")
    print("="*60)
    
    sql = """
    DO $$
    BEGIN
        -- Xóa constraint cũ nếu tồn tại
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'employees' 
            AND constraint_name = 'employees_department_id_fkey'
        ) THEN
            ALTER TABLE employees DROP CONSTRAINT employees_department_id_fkey;
            RAISE NOTICE 'Đã xóa constraint cũ';
        END IF;
        
        -- Tạo constraint mới
        ALTER TABLE employees 
        ADD CONSTRAINT employees_department_id_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_department_id_fkey';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Lỗi: %', SQLERRM;
    END $$;
    """
    
    try:
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        print("✅ Đã sửa foreign key cho department_id")
        return True
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        print("   ⚠️  Cần chạy SQL trực tiếp trong Supabase Dashboard")
        return False

def fix_position_foreign_key():
    """Sửa foreign key cho position_id"""
    print("\n" + "="*60)
    print("SỬA FOREIGN KEY CHO POSITION_ID")
    print("="*60)
    
    sql = """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'employees' 
            AND constraint_name = 'employees_position_id_fkey'
        ) THEN
            ALTER TABLE employees DROP CONSTRAINT employees_position_id_fkey;
        END IF;
        
        ALTER TABLE employees 
        ADD CONSTRAINT employees_position_id_fkey 
        FOREIGN KEY (position_id) 
        REFERENCES positions(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_position_id_fkey';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Lỗi: %', SQLERRM;
    END $$;
    """
    
    try:
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        print("✅ Đã sửa foreign key cho position_id")
        return True
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        print("   ⚠️  Cần chạy SQL trực tiếp trong Supabase Dashboard")
        return False

def fix_manager_foreign_key():
    """Sửa foreign key cho manager_id"""
    print("\n" + "="*60)
    print("SỬA FOREIGN KEY CHO MANAGER_ID")
    print("="*60)
    
    sql = """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'employees' 
            AND constraint_name = 'employees_manager_id_fkey'
        ) THEN
            ALTER TABLE employees DROP CONSTRAINT employees_manager_id_fkey;
        END IF;
        
        ALTER TABLE employees 
        ADD CONSTRAINT employees_manager_id_fkey 
        FOREIGN KEY (manager_id) 
        REFERENCES employees(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_manager_id_fkey';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Lỗi: %', SQLERRM;
    END $$;
    """
    
    try:
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        print("✅ Đã sửa foreign key cho manager_id")
        return True
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        print("   ⚠️  Cần chạy SQL trực tiếp trong Supabase Dashboard")
        return False

def test_relationship_query():
    """Test query với relationship sau khi sửa"""
    print("\n" + "="*60)
    print("TEST QUERY VỚI RELATIONSHIP SAU KHI SỬA")
    print("="*60)
    
    try:
        result = supabase.table("employees").select("""
            id,
            first_name,
            last_name,
            department_id,
            position_id,
            departments:department_id (id, name),
            positions:position_id (id, name)
        """).eq("status", "active").limit(3).execute()
        
        print(f"✅ Query thành công: {len(result.data)} nhân viên")
        
        if result.data:
            for emp in result.data:
                print(f"\n   Nhân viên: {emp.get('first_name')} {emp.get('last_name')}")
                dept = emp.get('departments')
                pos = emp.get('positions')
                
                if dept:
                    if isinstance(dept, dict):
                        print(f"   ✅ Department: {dept.get('name')}")
                    elif isinstance(dept, list) and dept:
                        print(f"   ✅ Department: {dept[0].get('name')}")
                    else:
                        print(f"   ⚠️  Department: {dept}")
                else:
                    print(f"   ❌ Không có department")
                
                if pos:
                    if isinstance(pos, dict):
                        print(f"   ✅ Position: {pos.get('name')}")
                    elif isinstance(pos, list) and pos:
                        print(f"   ✅ Position: {pos[0].get('name')}")
                    else:
                        print(f"   ⚠️  Position: {pos}")
                else:
                    print(f"   ❌ Không có position")
        else:
            print("   ⚠️  Không có nhân viên nào")
            
    except Exception as e:
        print(f"❌ Lỗi khi test query: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Hàm main"""
    print("\n" + "="*60)
    print("SỬA FOREIGN KEY RELATIONSHIPS CHO BẢNG EMPLOYEES")
    print("="*60)
    print("\n⚠️  LƯU Ý:")
    print("   - Script này cần SUPABASE_SERVICE_ROLE_KEY")
    print("   - Nếu không có quyền, cần chạy SQL trực tiếp trong Supabase Dashboard")
    print("   - File SQL: database/migrations/fix_employees_foreign_keys.sql")
    print()
    
    response = input("Bạn có muốn tiếp tục? (y/n): ").strip().lower()
    if response != 'y':
        print("Đã hủy")
        return
    
    # Kiểm tra constraints hiện tại
    constraints = check_foreign_keys()
    if constraints:
        print("\n📋 Constraints hiện tại:")
        for c in constraints:
            print(f"   - {c.get('column_name')} → {c.get('foreign_table_name')}.{c.get('foreign_column_name')}")
    
    # Sửa các foreign keys
    print("\n" + "="*60)
    print("BẮT ĐẦU SỬA FOREIGN KEYS")
    print("="*60)
    
    success_count = 0
    
    if fix_department_foreign_key():
        success_count += 1
    
    if fix_position_foreign_key():
        success_count += 1
    
    if fix_manager_foreign_key():
        success_count += 1
    
    print("\n" + "="*60)
    print(f"KẾT QUẢ: {success_count}/3 foreign keys đã được sửa")
    print("="*60)
    
    if success_count < 3:
        print("\n⚠️  Một số foreign keys không thể sửa tự động.")
        print("   Vui lòng chạy SQL trực tiếp trong Supabase Dashboard:")
        print("   File: database/migrations/fix_employees_foreign_keys.sql")
    
    # Test sau khi sửa
    if success_count > 0:
        test_relationship_query()
    
    print("\n✅ Hoàn tất!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Đã hủy")
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()

