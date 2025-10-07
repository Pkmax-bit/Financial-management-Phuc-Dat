"""
Script test tao nhan vien voi auth user
"""

import os
import uuid
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def test_create_employee_with_auth():
    """Test tao nhan vien voi auth user"""
    print("Test tao nhan vien voi auth user...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Tao user trong Supabase Auth
        print("Tao user trong Supabase Auth...")
        auth_response = supabase.auth.admin.create_user({
            "email": "test.employee.new@company.com",
            "password": "123456",
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Test Employee New",
                "role": "employee"
            }
        })
        
        if not auth_response.user:
            print("Loi: Khong the tao auth user")
            return False
        
        user_id = auth_response.user.id
        print(f"Auth user created: {user_id}")
        
        # Tao user record trong bang users
        print("Tao user record...")
        user_data = {
            "id": user_id,
            "email": "test.employee.new@company.com",
            "full_name": "Test Employee New",
            "role": "employee",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        user_result = supabase.table("users").insert(user_data).execute()
        print("User record created")
        
        # Tao employee record
        print("Tao employee record...")
        employee_id = str(uuid.uuid4())
        employee_data = {
            "id": employee_id,
            "user_id": user_id,
            "employee_code": "EMP202401002",
            "first_name": "Test",
            "last_name": "Employee",
            "email": "test.employee.new@company.com",
            "phone": "0901000099",
            "department_id": "2a839aa7-4ef4-4a47-a20a-26afd66ad2c3",  # SALES
            "position_id": "7f61f3ec-f5fe-4875-bd20-11920c6fcbe0",  # POS-MGMT-002
            "hire_date": "2024-01-01",
            "salary": 20000000,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        employee_result = supabase.table("employees").insert(employee_data).execute()
        print("Employee record created")
        
        # Kiem tra ket qua
        print("\nKiem tra ket qua...")
        result = supabase.table("employees").select("""
            *,
            departments:department_id(name),
            positions:position_id(name),
            users:user_id(role)
        """).eq("id", employee_id).execute()
        
        if result.data:
            emp = result.data[0]
            print("Employee created successfully:")
            print(f"  - Code: {emp.get('employee_code')}")
            print(f"  - Name: {emp.get('first_name')} {emp.get('last_name')}")
            print(f"  - Email: {emp.get('email')}")
            print(f"  - Role: {emp.get('users', {}).get('role', 'N/A')}")
            print(f"  - Department: {emp.get('departments', {}).get('name', 'N/A')}")
            print(f"  - Position: {emp.get('positions', {}).get('name', 'N/A')}")
            return True
        else:
            print("Loi: Khong the lay thong tin employee")
            return False
            
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

if __name__ == "__main__":
    test_create_employee_with_auth()
