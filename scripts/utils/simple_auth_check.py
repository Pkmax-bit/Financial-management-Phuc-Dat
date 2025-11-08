"""
Script kiem tra don gian authentication
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_users():
    """Kiem tra users"""
    print("KIEM TRA USERS")
    print("=" * 40)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Lay users trong bang users
        print("1. Users trong bang users:")
        db_result = supabase.table("users").select("*").execute()
        
        if db_result.data:
            for user in db_result.data:
                print(f"   - {user.get('email')} (ID: {user.get('id')})")
        else:
            print("   Khong co users nao")
        
        # Lay auth users
        print("\n2. Users trong authentication:")
        auth_users = supabase.auth.admin.list_users()
        
        if auth_users:
            for user in auth_users:
                print(f"   - {user.email} (ID: {user.id})")
        else:
            print("   Khong co auth users nao")
        
        # Test login voi admin@test.com
        print("\n3. Test login voi admin@test.com:")
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": "admin@test.com",
                "password": "123456"
            })
            
            if login_response.user:
                print("   Login thanh cong")
                print(f"   User ID: {login_response.user.id}")
            else:
                print("   Login that bai - khong co user")
                
        except Exception as e:
            print(f"   Login that bai: {str(e)}")
            
            # Kiem tra xem user co ton tai khong
            print("\n4. Kiem tra user admin@test.com:")
            found_user = None
            for user in auth_users:
                if user.email == "admin@test.com":
                    found_user = user
                    break
            
            if found_user:
                print(f"   User ton tai trong auth:")
                print(f"   - ID: {found_user.id}")
                print(f"   - Email: {found_user.email}")
                print(f"   - Confirmed: {found_user.email_confirmed_at is not None}")
            else:
                print("   User KHONG ton tai trong auth")
                
                # Kiem tra trong database
                db_user = None
                for user in db_result.data:
                    if user.get('email') == "admin@test.com":
                        db_user = user
                        break
                
                if db_user:
                    print(f"   User ton tai trong database:")
                    print(f"   - ID: {db_user.get('id')}")
                    print(f"   - Email: {db_user.get('email')}")
                    print("   -> NGUYEN NHAN: User co trong database nhung KHONG co trong auth")
                else:
                    print("   User KHONG ton tai trong ca database va auth")
        
        # Test login voi admin@example.com
        print("\n5. Test login voi admin@example.com:")
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": "admin@example.com",
                "password": "123456"
            })
            
            if login_response.user:
                print("   Login thanh cong")
            else:
                print("   Login that bai - khong co user")
                
        except Exception as e:
            print(f"   Login that bai: {str(e)}")
        
        # Test login voi sales@example.com
        print("\n6. Test login voi sales@example.com:")
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": "sales@example.com",
                "password": "123456"
            })
            
            if login_response.user:
                print("   Login thanh cong")
            else:
                print("   Login that bai - khong co user")
                
        except Exception as e:
            print(f"   Login that bai: {str(e)}")
        
    except Exception as e:
        print(f"Loi: {str(e)}")

if __name__ == "__main__":
    check_users()
