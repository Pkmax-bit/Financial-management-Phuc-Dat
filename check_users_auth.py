"""
Script kiem tra users trong database va authentication
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_users_in_database():
    """Kiem tra users trong bang users"""
    print("KIEM TRA USERS TRONG BANG USERS")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Lay tat ca users trong bang users
        result = supabase.table("users").select("*").execute()
        
        if result.data:
            print(f"Tim thay {len(result.data)} users trong bang users:")
            print("-" * 50)
            
            for i, user in enumerate(result.data, 1):
                print(f"{i}. Email: {user.get('email')}")
                print(f"   ID: {user.get('id')}")
                print(f"   Full Name: {user.get('full_name')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Active: {user.get('is_active')}")
                print(f"   Created: {user.get('created_at')}")
                print()
        else:
            print("Khong co users nao trong bang users")
        
        return result.data
        
    except Exception as e:
        print(f"Loi lay users: {str(e)}")
        return []

def check_auth_users():
    """Kiem tra users trong authentication"""
    print("KIEM TRA USERS TRONG AUTHENTICATION")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Lay tat ca auth users
        auth_users = supabase.auth.admin.list_users()
        
        if auth_users:
            print(f"Tim thay {len(auth_users)} users trong authentication:")
            print("-" * 50)
            
            for i, user in enumerate(auth_users, 1):
                print(f"{i}. Email: {user.email}")
                print(f"   ID: {user.id}")
                print(f"   Confirmed: {user.email_confirmed_at is not None}")
                print(f"   Disabled: {user.banned_until is not None}")
                print(f"   Created: {user.created_at}")
                print()
        else:
            print("Khong co users nao trong authentication")
        
        return auth_users
        
    except Exception as e:
        print(f"Loi lay auth users: {str(e)}")
        return []

def compare_users(db_users, auth_users):
    """So sanh users giua database va authentication"""
    print("SO SANH USERS GIUA DATABASE VA AUTHENTICATION")
    print("=" * 50)
    
    if not db_users or not auth_users:
        print("Khong the so sanh - thieu du lieu")
        return
    
    # Tao dict de tim kiem nhanh
    auth_emails = {user.email: user for user in auth_users}
    db_emails = {user.get('email'): user for user in db_users}
    
    print("KET QUA SO SANH:")
    print("-" * 30)
    
    # Kiem tra users co trong database nhung khong co trong auth
    missing_in_auth = []
    for email, db_user in db_emails.items():
        if email not in auth_emails:
            missing_in_auth.append(email)
            print(f"❌ {email} - Co trong database NHUNG KHONG co trong auth")
    
    # Kiem tra users co trong auth nhung khong co trong database
    missing_in_db = []
    for email, auth_user in auth_emails.items():
        if email not in db_emails:
            missing_in_db.append(email)
            print(f"⚠️ {email} - Co trong auth NHUNG KHONG co trong database")
    
    # Kiem tra users co trong ca hai
    common_users = []
    for email in db_emails:
        if email in auth_emails:
            common_users.append(email)
            print(f"✅ {email} - Co trong ca database va auth")
    
    print(f"\nTONG KET:")
    print(f"- Users chung: {len(common_users)}")
    print(f"- Missing in auth: {len(missing_in_auth)}")
    print(f"- Missing in db: {len(missing_in_db)}")
    
    return {
        'common': common_users,
        'missing_in_auth': missing_in_auth,
        'missing_in_db': missing_in_db
    }

def test_login_with_users():
    """Test login voi cac users"""
    print("\nTEST LOGIN VOI CAC USERS")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Test voi cac email pho bien
    test_emails = [
        "admin@test.com",
        "admin@example.com", 
        "sales@example.com",
        "test.employee.new@company.com"
    ]
    
    for email in test_emails:
        print(f"\nTest login voi: {email}")
        try:
            # Test login
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": "123456"
            })
            
            if auth_response.user:
                print(f"✅ Login thanh cong")
                print(f"   User ID: {auth_response.user.id}")
                print(f"   Email: {auth_response.user.email}")
            else:
                print(f"❌ Login that bai - khong co user")
                
        except Exception as e:
            print(f"❌ Login that bai: {str(e)}")
            
            # Phan tich loi
            error_msg = str(e).lower()
            if "invalid login credentials" in error_msg:
                print("   -> Nguyen nhan: Email hoac password sai")
            elif "email not confirmed" in error_msg:
                print("   -> Nguyen nhan: Email chua duoc confirm")
            elif "user not found" in error_msg:
                print("   -> Nguyen nhan: User khong ton tai")
            elif "too many requests" in error_msg:
                print("   -> Nguyen nhan: Qua nhieu request")
            else:
                print(f"   -> Nguyen nhan khac: {str(e)}")

def create_test_user():
    """Tao user test moi"""
    print("\nTAO USER TEST MOI")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Tao user trong auth
        print("Tao user trong Supabase Auth...")
        auth_response = supabase.auth.admin.create_user({
            "email": "test.login@company.com",
            "password": "123456",
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Test Login User",
                "role": "employee"
            }
        })
        
        if auth_response.user:
            user_id = auth_response.user.id
            print(f"✅ Auth user created: {user_id}")
            
            # Tao user trong bang users
            print("Tao user trong bang users...")
            user_data = {
                "id": user_id,
                "email": "test.login@company.com",
                "full_name": "Test Login User",
                "role": "employee",
                "is_active": True
            }
            
            result = supabase.table("users").insert(user_data).execute()
            print("✅ User record created")
            
            # Test login voi user moi
            print("Test login voi user moi...")
            login_response = supabase.auth.sign_in_with_password({
                "email": "test.login@company.com",
                "password": "123456"
            })
            
            if login_response.user:
                print("✅ Login thanh cong voi user moi")
            else:
                print("❌ Login that bai voi user moi")
                
        else:
            print("❌ Khong the tao auth user")
            
    except Exception as e:
        print(f"❌ Loi tao user: {str(e)}")

def main():
    """Ham chinh"""
    print("KIEM TRA USERS VA AUTHENTICATION")
    print("=" * 60)
    
    # 1. Kiem tra users trong database
    db_users = check_users_in_database()
    
    # 2. Kiem tra users trong authentication
    auth_users = check_auth_users()
    
    # 3. So sanh users
    if db_users and auth_users:
        compare_users(db_users, auth_users)
    
    # 4. Test login
    test_login_with_users()
    
    # 5. Tao user test moi
    create_test_user()
    
    print("\n" + "=" * 60)
    print("HOAN THANH KIEM TRA")
    print("=" * 60)

if __name__ == "__main__":
    main()
