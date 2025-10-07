"""
Script tao tai khoan test don gian
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def create_test_accounts():
    """Tao tai khoan test"""
    print("Tao tai khoan test...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sach tai khoan test
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "full_name": "Admin Test",
            "role": "admin"
        }
    ]
    
    for account in test_accounts:
        try:
            print(f"Tao tai khoan: {account['email']}")
            
            # Tao user trong Supabase Auth
            auth_response = supabase.auth.admin.create_user({
                "email": account["email"],
                "password": account["password"],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": account["full_name"],
                    "role": account["role"]
                }
            })
            
            if auth_response.user:
                user_id = auth_response.user.id
                print(f"  - Auth user created: {user_id}")
                
                # Tao user trong bang users
                user_record = {
                    "id": user_id,
                    "email": account["email"],
                    "full_name": account["full_name"],
                    "role": account["role"],
                    "is_active": True
                }
                
                result = supabase.table("users").insert(user_record).execute()
                print(f"  - User record created")
                
            else:
                print(f"  - Loi tao auth user")
                
        except Exception as e:
            if "already been registered" in str(e):
                print(f"  - Tai khoan da ton tai: {account['email']}")
            else:
                print(f"  - Loi: {str(e)}")
    
    print("Hoan thanh tao tai khoan test")
    return True

if __name__ == "__main__":
    create_test_accounts()
