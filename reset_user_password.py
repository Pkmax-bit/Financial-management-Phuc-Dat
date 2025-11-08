"""
Script reset password cho user
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def reset_user_password():
    """Reset password cho user"""
    print("RESET PASSWORD CHO USER")
    print("=" * 40)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Reset password cho admin@example.com
        print("Reset password cho admin@example.com...")
        
        # Tim user theo email
        auth_users = supabase.auth.admin.list_users()
        target_user = None
        
        for user in auth_users:
            if user.email == "admin@example.com":
                target_user = user
                break
        
        if target_user:
            print(f"Tim thay user: {target_user.email} (ID: {target_user.id})")
            
            # Reset password
            try:
                update_response = supabase.auth.admin.update_user_by_id(
                    target_user.id,
                    {"password": "123456"}
                )
                
                if update_response.user:
                    print("Reset password thanh cong")
                    
                    # Test login voi password moi
                    print("Test login voi password moi...")
                    login_response = supabase.auth.sign_in_with_password({
                        "email": "admin@example.com",
                        "password": "123456"
                    })
                    
                    if login_response.user:
                        print("Login thanh cong voi password moi")
                    else:
                        print("Login that bai voi password moi")
                else:
                    print("Reset password that bai")
                    
            except Exception as e:
                print(f"Loi reset password: {str(e)}")
        else:
            print("Khong tim thay user admin@example.com")
        
        # Reset password cho admin@test.com (de dam bao)
        print("\nReset password cho admin@test.com...")
        
        target_user = None
        for user in auth_users:
            if user.email == "admin@test.com":
                target_user = user
                break
        
        if target_user:
            print(f"Tim thay user: {target_user.email} (ID: {target_user.id})")
            
            try:
                update_response = supabase.auth.admin.update_user_by_id(
                    target_user.id,
                    {"password": "123456"}
                )
                
                if update_response.user:
                    print("Reset password thanh cong")
                    
                    # Test login
                    print("Test login voi password moi...")
                    login_response = supabase.auth.sign_in_with_password({
                        "email": "admin@test.com",
                        "password": "123456"
                    })
                    
                    if login_response.user:
                        print("Login thanh cong voi password moi")
                    else:
                        print("Login that bai voi password moi")
                else:
                    print("Reset password that bai")
                    
            except Exception as e:
                print(f"Loi reset password: {str(e)}")
        else:
            print("Khong tim thay user admin@test.com")
        
    except Exception as e:
        print(f"Loi: {str(e)}")

def test_all_logins():
    """Test login voi tat ca users"""
    print("\nTEST LOGIN VOI TAT CA USERS")
    print("=" * 40)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sach users de test
    test_users = [
        "admin@test.com",
        "admin@example.com",
        "sales@example.com",
        "test.employee.new@company.com"
    ]
    
    for email in test_users:
        print(f"\nTest login voi: {email}")
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": "123456"
            })
            
            if login_response.user:
                print("  Login thanh cong")
            else:
                print("  Login that bai - khong co user")
                
        except Exception as e:
            print(f"  Login that bai: {str(e)}")

if __name__ == "__main__":
    reset_user_password()
    test_all_logins()
