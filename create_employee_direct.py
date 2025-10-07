"""
Script tao nhan vien truc tiep trong database
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

def create_employee_direct():
    """Tao nhan vien truc tiep trong database"""
    print("Tao nhan vien truc tiep...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Tao user truc tiep trong bang users
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": "test.employee.direct@company.com",
            "full_name": "Test Employee Direct",
            "role": "employee",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        print("Tao user record...")
        user_result = supabase.table("users").insert(user_data).execute()
        print(f"User created: {user_id}")
        
        # Tao employee record
        employee_id = str(uuid.uuid4())
        employee_data = {
            "id": employee_id,
            "user_id": user_id,
            "employee_code": "EMP202401001",
            "first_name": "Test",
            "last_name": "Employee",
            "email": "test.employee.direct@company.com",
            "phone": "0901000099",
            "department_id": "dept-004",
            "position_id": "pos-008",
            "hire_date": "2024-01-01",
            "salary": 20000000,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        print("Tao employee record...")
        employee_result = supabase.table("employees").insert(employee_data).execute()
        print(f"Employee created: {employee_id}")
        
        # Kiem tra ket qua
        print("\nKiem tra ket qua...")
        
        # Lay thong tin employee voi join
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
    create_employee_direct()
