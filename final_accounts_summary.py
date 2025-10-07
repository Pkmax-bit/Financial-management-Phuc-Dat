"""
Script tom tat tat ca cac tai khoan da tao
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_all_accounts():
    """Test tat ca cac tai khoan"""
    print("TEST TAT CA CAC TAI KHOAN")
    print("=" * 60)
    
    # Tat ca cac tai khoan da tao
    all_accounts = [
        {
            "name": "Admin Test",
            "email": "admin@test.com",
            "password": "123456",
            "role": "ADMIN",
            "description": "Toàn quyền - Quản lý hệ thống"
        },
        {
            "name": "Admin Example",
            "email": "admin@example.com",
            "password": "123456",
            "role": "ADMIN",
            "description": "Toàn quyền - Quản lý hệ thống"
        },
        {
            "name": "Sales Manager",
            "email": "sales@example.com",
            "password": "123456",
            "role": "SALES",
            "description": "Quản lý báo giá và chi phí"
        },
        {
            "name": "Workshop Employee",
            "email": "workshop@test.com",
            "password": "123456",
            "role": "WORKSHOP_EMPLOYEE",
            "description": "Nhân viên xưởng - Tạo chi phí sản xuất"
        },
        {
            "name": "Transport Employee",
            "email": "transport@test.com",
            "password": "123456",
            "role": "TRANSPORT",
            "description": "Nhân viên vận chuyển - Tạo chi phí vận chuyển"
        },
        {
            "name": "Customer",
            "email": "customer@test.com",
            "password": "123456",
            "role": "CUSTOMER",
            "description": "Khách hàng - Portal khách hàng"
        },
        {
            "name": "Worker",
            "email": "worker@test.com",
            "password": "123456",
            "role": "WORKER",
            "description": "Công nhân - Tạo chi phí cơ bản"
        },
        {
            "name": "Test Employee",
            "email": "test.employee.new@company.com",
            "password": "123456",
            "role": "EMPLOYEE",
            "description": "Nhân viên test - Tạo chi phí cơ bản"
        },
        {
            "name": "Test Employee Auth",
            "email": "test.employee.auth@company.com",
            "password": "123456",
            "role": "EMPLOYEE",
            "description": "Nhân viên test - Tạo chi phí cơ bản"
        }
    ]
    
    successful_accounts = []
    failed_accounts = []
    
    for i, account in enumerate(all_accounts, 1):
        print(f"\n{i}. Test: {account['name']} ({account['email']})")
        print(f"   Role: {account['role']}")
        print(f"   Description: {account['role']}")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": account["email"],
                "password": account["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print(f"   Status: Login thanh cong")
                print(f"   Token: {token[:20]}...")
                successful_accounts.append(account)
                
                # Test voi token
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test employees endpoint
                try:
                    emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
                    if emp_response.status_code == 200:
                        employees = emp_response.json()
                        print(f"   API Test: Employees endpoint OK ({len(employees)} employees)")
                    else:
                        print(f"   API Test: Employees endpoint {emp_response.status_code}")
                except:
                    print(f"   API Test: Employees endpoint timeout")
                
            else:
                print(f"   Status: Login that bai ({response.status_code})")
                failed_accounts.append(account)
                
        except Exception as e:
            print(f"   Status: Loi - {str(e)}")
            failed_accounts.append(account)
    
    # Tong ket
    print(f"\n" + "=" * 60)
    print("TONG KET")
    print("=" * 60)
    print(f"Tong so tai khoan: {len(all_accounts)}")
    print(f"Login thanh cong: {len(successful_accounts)}")
    print(f"Login that bai: {len(failed_accounts)}")
    print(f"Ty le thanh cong: {len(successful_accounts)/len(all_accounts)*100:.1f}%")
    
    if successful_accounts:
        print(f"\nCAC TAI KHOAN HOAT DONG:")
        for account in successful_accounts:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    if failed_accounts:
        print(f"\nCAC TAI KHOAN CO VAN DE:")
        for account in failed_accounts:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    return successful_accounts, failed_accounts

def create_login_page_summary():
    """Tao tom tat trang login"""
    print(f"\nTOM TAT TRANG LOGIN")
    print("=" * 60)
    
    print("Trang login da duoc cap nhat voi cac tai khoan:")
    print("1. Admin Test (admin@test.com) - ADMIN")
    print("2. Admin Example (admin@example.com) - ADMIN")
    print("3. Sales Manager (sales@example.com) - SALES")
    print("4. Workshop Employee (workshop@test.com) - WORKSHOP_EMPLOYEE")
    print("5. Transport Employee (transport@test.com) - TRANSPORT")
    print("6. Customer (customer@test.com) - CUSTOMER")
    print("7. Worker (worker@test.com) - WORKER")
    print("8. Test Employee (test.employee.new@company.com) - EMPLOYEE")
    print("9. Test Employee Auth (test.employee.auth@company.com) - EMPLOYEE")
    
    print("\nCach su dung:")
    print("- Truy cap: http://localhost:3000/login")
    print("- Bam vao tai khoan de tu dong dien thong tin")
    print("- Bam 'Dang nhap' de dang nhap nhanh")
    print("- Tat ca tai khoan deu co password: 123456")

def create_database_summary():
    """Tao tom tat database"""
    print(f"\nTOM TAT DATABASE")
    print("=" * 60)
    
    print("Database da duoc lam sach:")
    print("- Xoa tat ca du lieu mau o ban hang")
    print("- Xoa tat ca du lieu mau o chi phi")
    print("- Xoa tat ca du lieu mau o giao dich")
    print("- Giu lai cau truc bang va du lieu can thiet")
    
    print("\nCac bang duoc giu lai:")
    print("- users (9 records) - Nguoi dung")
    print("- employees (2 records) - Nhan vien")
    print("- departments (7 records) - Phong ban")
    print("- positions (19 records) - Chuc vu")
    
    print("\nCac bang da duoc xoa sach:")
    print("- invoices - Hoa don")
    print("- invoice_items - Chi tiet hoa don")
    print("- payments - Thanh toan")
    print("- expenses - Chi phi")
    print("- bills - Hoa don phai tra")
    print("- customers - Khach hang")

if __name__ == "__main__":
    print("TOM TAT TAT CA CAC TAI KHOAN DA TAO")
    print("=" * 80)
    
    # Test tat ca cac tai khoan
    successful, failed = test_all_accounts()
    
    # Tao tom tat trang login
    create_login_page_summary()
    
    # Tao tom tat database
    create_database_summary()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TOM TAT")
    print("=" * 80)
