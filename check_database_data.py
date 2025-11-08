"""
Script kiem tra du lieu trong database
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_database_data():
    """Kiem tra du lieu trong database"""
    print("Kiem tra du lieu trong database...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Kiem tra departments
        print("\nKiem tra departments...")
        dept_result = supabase.table("departments").select("*").execute()
        if dept_result.data:
            print(f"Found {len(dept_result.data)} departments:")
            for dept in dept_result.data[:3]:  # Chi hien thi 3 cai dau
                print(f"  - ID: {dept.get('id')} | Code: {dept.get('code')}")
        else:
            print("Khong co departments nao")
        
        # Kiem tra positions
        print("\nKiem tra positions...")
        pos_result = supabase.table("positions").select("*").execute()
        if pos_result.data:
            print(f"Found {len(pos_result.data)} positions:")
            for pos in pos_result.data[:3]:  # Chi hien thi 3 cai dau
                print(f"  - ID: {pos.get('id')} | Code: {pos.get('code')}")
        else:
            print("Khong co positions nao")
        
        # Kiem tra users
        print("\nKiem tra users...")
        user_result = supabase.table("users").select("*").execute()
        if user_result.data:
            print(f"Found {len(user_result.data)} users:")
            for user in user_result.data[:3]:  # Chi hien thi 3 cai dau
                print(f"  - ID: {user.get('id')} | Email: {user.get('email')} | Role: {user.get('role')}")
        else:
            print("Khong co users nao")
        
        # Kiem tra employees
        print("\nKiem tra employees...")
        emp_result = supabase.table("employees").select("*").execute()
        if emp_result.data:
            print(f"Found {len(emp_result.data)} employees:")
            for emp in emp_result.data[:3]:  # Chi hien thi 3 cai dau
                print(f"  - ID: {emp.get('id')} | Code: {emp.get('employee_code')} | Name: {emp.get('first_name')} {emp.get('last_name')}")
        else:
            print("Khong co employees nao")
        
        return True
        
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

if __name__ == "__main__":
    check_database_data()
