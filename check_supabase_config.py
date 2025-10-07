"""
Script kiem tra cau hinh Supabase
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def check_supabase_config():
    """Kiem tra cau hinh Supabase"""
    print("Kiem tra cau hinh Supabase...")
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"SUPABASE_URL: {'OK' if SUPABASE_URL else 'MISSING'}")
    print(f"SUPABASE_SERVICE_KEY: {'OK' if SUPABASE_SERVICE_KEY else 'MISSING'}")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test ket noi
        print("Test ket noi...")
        result = supabase.table("users").select("count").limit(1).execute()
        print("Ket noi thanh cong")
        
        # Test tao user trong auth
        print("Test tao user trong auth...")
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": "test.auth@company.com",
                "password": "123456",
                "email_confirm": True
            })
            
            if auth_response.user:
                print("Tao auth user thanh cong")
                user_id = auth_response.user.id
                print(f"User ID: {user_id}")
                
                # Xoa user test
                supabase.auth.admin.delete_user(user_id)
                print("Da xoa user test")
            else:
                print("Loi: Khong the tao auth user")
                
        except Exception as e:
            print(f"Loi tao auth user: {str(e)}")
            
            # Kiem tra quyen admin
            if "not allowed" in str(e).lower():
                print("Loi: Khong co quyen admin")
                print("Kiem tra SUPABASE_SERVICE_KEY co phai la service role key khong")
            elif "disabled" in str(e).lower():
                print("Loi: Auth admin bi vo hieu hoa")
                print("Kiem tra cau hinh trong Supabase Dashboard")
            else:
                print(f"Loi khac: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"Loi ket noi: {str(e)}")
        return False

if __name__ == "__main__":
    check_supabase_config()
