"""
Script tao them cac tai khoan test voi cac quyen khac nhau
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

def create_additional_test_accounts():
    """Tao them cac tai khoan test"""
    print("TAO THEM CAC TAI KHOAN TEST")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Danh sach tai khoan can tao
    test_accounts = [
        {
            "email": "workshop@test.com",
            "password": "123456",
            "full_name": "Workshop Employee Test",
            "role": "workshop_employee"
        },
        {
            "email": "transport@test.com", 
            "password": "123456",
            "full_name": "Transport Employee Test",
            "role": "transport"
        },
        {
            "email": "customer@test.com",
            "password": "123456", 
            "full_name": "Customer Test",
            "role": "customer"
        },
        {
            "email": "worker@test.com",
            "password": "123456",
            "full_name": "Worker Test", 
            "role": "worker"
        }
    ]
    
    created_accounts = []
    
    for account in test_accounts:
        try:
            print(f"\nTao tai khoan: {account['email']} ({account['role']})")
            
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
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("users").insert(user_record).execute()
                print(f"  - User record created")
                
                created_accounts.append(account)
                
            else:
                print(f"  - Loi tao auth user")
                
        except Exception as e:
            if "already been registered" in str(e):
                print(f"  - Tai khoan da ton tai: {account['email']}")
            else:
                print(f"  - Loi: {str(e)}")
    
    print(f"\nTong ket:")
    print(f"- Tai khoan da tao: {len(created_accounts)}")
    print(f"- Tai khoan loi: {len(test_accounts) - len(created_accounts)}")
    
    return created_accounts

def test_new_accounts():
    """Test cac tai khoan moi"""
    print("\nTEST CAC TAI KHOAN MOI")
    print("=" * 50)
    
    # Test accounts
    test_accounts = [
        "workshop@test.com",
        "transport@test.com", 
        "customer@test.com",
        "worker@test.com"
    ]
    
    for email in test_accounts:
        print(f"\nTest login voi: {email}")
        try:
            # Test login
            response = requests.post("http://localhost:8000/api/auth/login", json={
                "email": email,
                "password": "123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Login thanh cong")
                print(f"  Token: {data.get('access_token', '')[:20]}...")
            else:
                print(f"  Login that bai: {response.status_code}")
                
        except Exception as e:
            print(f"  Loi: {str(e)}")

def update_login_page():
    """Cap nhat trang login voi cac tai khoan moi"""
    print("\nCAP NHAT TRANG LOGIN")
    print("=" * 50)
    
    # Doc file login page
    login_file = "frontend/src/app/login/page.tsx"
    
    try:
        with open(login_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Tim va thay the testAccounts array
        old_test_accounts = '''const testAccounts = [
  {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-500',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Admin Example',
    email: 'admin@example.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-600',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Sales Manager',
    email: 'sales@example.com',
    password: '123456',
    role: 'SALES',
    icon: DollarSign,
    color: 'bg-blue-500',
    description: 'Quản lý báo giá và chi phí'
  },
  {
    name: 'Test Employee',
    email: 'test.employee.new@company.com',
    password: '123456',
    role: 'EMPLOYEE',
    icon: User,
    color: 'bg-green-500',
    description: 'Nhân viên test - Tạo chi phí cơ bản'
  },
  {
    name: 'Test Employee Auth',
    email: 'test.employee.auth@company.com',
    password: '123456',
    role: 'EMPLOYEE',
    icon: User,
    color: 'bg-green-600',
    description: 'Nhân viên test - Tạo chi phí cơ bản'
  }
]'''
        
        new_test_accounts = '''const testAccounts = [
  {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-500',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Admin Example',
    email: 'admin@example.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-600',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Sales Manager',
    email: 'sales@example.com',
    password: '123456',
    role: 'SALES',
    icon: DollarSign,
    color: 'bg-blue-500',
    description: 'Quản lý báo giá và chi phí'
  },
  {
    name: 'Workshop Employee',
    email: 'workshop@test.com',
    password: '123456',
    role: 'WORKSHOP_EMPLOYEE',
    icon: Wrench,
    color: 'bg-orange-500',
    description: 'Nhân viên xưởng - Tạo chi phí sản xuất'
  },
  {
    name: 'Transport Employee',
    email: 'transport@test.com',
    password: '123456',
    role: 'TRANSPORT',
    icon: Truck,
    color: 'bg-yellow-500',
    description: 'Nhân viên vận chuyển - Tạo chi phí vận chuyển'
  },
  {
    name: 'Customer',
    email: 'customer@test.com',
    password: '123456',
    role: 'CUSTOMER',
    icon: Users,
    color: 'bg-indigo-500',
    description: 'Khách hàng - Portal khách hàng'
  },
  {
    name: 'Worker',
    email: 'worker@test.com',
    password: '123456',
    role: 'WORKER',
    icon: User,
    color: 'bg-purple-500',
    description: 'Công nhân - Tạo chi phí cơ bản'
  }
]'''
        
        # Thay the content
        updated_content = content.replace(old_test_accounts, new_test_accounts)
        
        # Ghi lai file
        with open(login_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print("Trang login da duoc cap nhat voi cac tai khoan moi")
        print("Cac tai khoan moi:")
        print("- workshop@test.com (WORKSHOP_EMPLOYEE)")
        print("- transport@test.com (TRANSPORT)")
        print("- customer@test.com (CUSTOMER)")
        print("- worker@test.com (WORKER)")
        
    except Exception as e:
        print(f"Loi cap nhat trang login: {str(e)}")

if __name__ == "__main__":
    print("TAO THEM CAC TAI KHOAN TEST")
    print("=" * 60)
    
    # Tao cac tai khoan moi
    created_accounts = create_additional_test_accounts()
    
    # Test cac tai khoan moi
    test_new_accounts()
    
    # Cap nhat trang login
    update_login_page()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TAO TAI KHOAN")
    print("=" * 60)
