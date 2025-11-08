"""
Script kiem tra thong tin dang nhap
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_auth_credentials():
    """Kiem tra thong tin dang nhap"""
    print("Kiem tra thong tin dang nhap...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Kiem tra users trong bang users
        print("\nKiem tra users trong bang users...")
        users_result = supabase.table("users").select("*").execute()
        
        if users_result.data:
            print(f"Found {len(users_result.data)} users:")
            for user in users_result.data:
                print(f"  - Email: {user.get('email')}")
                print(f"    ID: {user.get('id')}")
                print(f"    Role: {user.get('role')}")
                print(f"    Active: {user.get('is_active')}")
                print()
        else:
            print("Khong co users nao")
        
        # Kiem tra auth users
        print("Kiem tra auth users...")
        try:
            auth_users = supabase.auth.admin.list_users()
            print(f"Found {len(auth_users)} auth users:")
            for user in auth_users:
                print(f"  - Email: {user.email}")
                print(f"    ID: {user.id}")
                print(f"    Confirmed: {user.email_confirmed_at is not None}")
                print()
        except Exception as e:
            print(f"Loi lay auth users: {str(e)}")
        
        # Test login voi admin@test.com
        print("Test login voi admin@test.com...")
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": "admin@test.com",
                "password": "123456"
            })
            
            if auth_response.user:
                print("Login thanh cong voi admin@test.com")
                print(f"User ID: {auth_response.user.id}")
                print(f"Email: {auth_response.user.email}")
            else:
                print("Login that bai voi admin@test.com")
                
        except Exception as e:
            print(f"Loi login: {str(e)}")
            
            # Kiem tra cac nguyen nhan co the
            if "Invalid login credentials" in str(e):
                print("\nNguyen nhan co the:")
                print("1. Email khong ton tai trong auth.users")
                print("2. Password sai")
                print("3. User chua duoc confirm")
                print("4. User bi disable")
            
            # Kiem tra xem user co ton tai trong auth khong
            try:
                # Tim user theo email
                auth_users = supabase.auth.admin.list_users()
                found_user = None
                for user in auth_users:
                    if user.email == "admin@test.com":
                        found_user = user
                        break
                
                if found_user:
                    print(f"\nUser ton tai trong auth:")
                    print(f"  - ID: {found_user.id}")
                    print(f"  - Email: {found_user.email}")
                    print(f"  - Confirmed: {found_user.email_confirmed_at is not None}")
                    print(f"  - Disabled: {found_user.banned_until is not None}")
                else:
                    print("\nUser KHONG ton tai trong auth.users")
                    print("Can tao lai user trong Supabase Auth")
                    
            except Exception as list_error:
                print(f"Loi lay danh sach auth users: {str(list_error)}")
        
        return True
        
    except Exception as e:
        print(f"Loi: {str(e)}")
        return False

if __name__ == "__main__":
    check_auth_credentials()
