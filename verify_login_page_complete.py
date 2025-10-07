"""
Script kiem tra trang login da duoc cap nhat day du
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_all_login_accounts():
    """Test tat ca cac tai khoan login"""
    print("KIEM TRA TRANG LOGIN DA CAP NHAT")
    print("=" * 60)
    
    # Tat ca cac tai khoan can co trong trang login
    expected_accounts = [
        {
            "name": "Admin Test",
            "email": "admin@test.com",
            "role": "ADMIN",
            "description": "Toàn quyền - Quản lý hệ thống"
        },
        {
            "name": "Admin Example", 
            "email": "admin@example.com",
            "role": "ADMIN",
            "description": "Toàn quyền - Quản lý hệ thống"
        },
        {
            "name": "Sales Manager",
            "email": "sales@example.com",
            "role": "SALES",
            "description": "Quản lý báo giá và chi phí"
        },
        {
            "name": "Workshop Employee",
            "email": "workshop@test.com",
            "role": "WORKSHOP_EMPLOYEE",
            "description": "Nhân viên xưởng - Tạo chi phí sản xuất"
        },
        {
            "name": "Transport Employee",
            "email": "transport@test.com",
            "role": "TRANSPORT",
            "description": "Nhân viên vận chuyển - Tạo chi phí vận chuyển"
        },
        {
            "name": "Customer",
            "email": "customer@test.com",
            "role": "CUSTOMER",
            "description": "Khách hàng - Portal khách hàng"
        },
        {
            "name": "Worker",
            "email": "worker@test.com",
            "role": "WORKER",
            "description": "Công nhân - Tạo chi phí cơ bản"
        },
        {
            "name": "Test Employee",
            "email": "test.employee.new@company.com",
            "role": "EMPLOYEE",
            "description": "Nhân viên test - Tạo chi phí cơ bản"
        },
        {
            "name": "Test Employee Auth",
            "email": "test.employee.auth@company.com",
            "role": "EMPLOYEE",
            "description": "Nhân viên test - Tạo chi phí cơ bản"
        }
    ]
    
    print(f"Tong so tai khoan can co: {len(expected_accounts)}")
    print("\nCAC TAI KHOAN TRONG TRANG LOGIN:")
    print("-" * 60)
    
    successful_logins = []
    failed_logins = []
    
    for i, account in enumerate(expected_accounts, 1):
        print(f"\n{i}. {account['name']} ({account['email']})")
        print(f"   Role: {account['role']}")
        print(f"   Description: {account['role']}")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": account["email"],
                "password": "123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print(f"   Status: Login thanh cong")
                print(f"   Token: {token[:20]}...")
                successful_logins.append(account)
                
                # Test voi token
                headers = {"Authorization": f"Bearer {token}"}
                
                try:
                    emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
                    if emp_response.status_code == 200:
                        employees = emp_response.json()
                        print(f"   API Test: OK ({len(employees)} employees)")
                    else:
                        print(f"   API Test: {emp_response.status_code}")
                except:
                    print(f"   API Test: Timeout")
                
            else:
                print(f"   Status: Login that bai ({response.status_code})")
                failed_logins.append(account)
                
        except Exception as e:
            print(f"   Status: Loi - {str(e)}")
            failed_logins.append(account)
    
    # Tong ket
    print(f"\n" + "=" * 60)
    print("TONG KET TRANG LOGIN")
    print("=" * 60)
    print(f"Tong so tai khoan: {len(expected_accounts)}")
    print(f"Login thanh cong: {len(successful_logins)}")
    print(f"Login that bai: {len(failed_logins)}")
    print(f"Ty le thanh cong: {len(successful_logins)/len(expected_accounts)*100:.1f}%")
    
    if successful_logins:
        print(f"\nCAC TAI KHOAN HOAT DONG:")
        for account in successful_logins:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    if failed_logins:
        print(f"\nCAC TAI KHOAN CO VAN DE:")
        for account in failed_logins:
            print(f"   - {account['name']} ({account['email']}) - {account['role']}")
    
    return successful_logins, failed_logins

def create_login_usage_guide():
    """Tao huong dan su dung trang login"""
    print(f"\nHUONG DAN SU DUNG TRANG LOGIN")
    print("=" * 60)
    
    print("1. TRUY CAP TRANG LOGIN:")
    print("   - URL: http://localhost:3000/login")
    print("   - Hoac: http://localhost:3000/")
    
    print("\n2. CAC TAI KHOAN CO SAN:")
    print("   - Admin Test (admin@test.com) - ADMIN")
    print("   - Admin Example (admin@example.com) - ADMIN")
    print("   - Sales Manager (sales@example.com) - SALES")
    print("   - Workshop Employee (workshop@test.com) - WORKSHOP_EMPLOYEE")
    print("   - Transport Employee (transport@test.com) - TRANSPORT")
    print("   - Customer (customer@test.com) - CUSTOMER")
    print("   - Worker (worker@test.com) - WORKER")
    print("   - Test Employee (test.employee.new@company.com) - EMPLOYEE")
    print("   - Test Employee Auth (test.employee.auth@company.com) - EMPLOYEE")
    
    print("\n3. CACH SU DUNG:")
    print("   - Bam vao tai khoan de tu dong dien thong tin")
    print("   - Bam 'Dang nhap' de dang nhap nhanh")
    print("   - Tat ca tai khoan deu co password: 123456")
    
    print("\n4. TINH NANG:")
    print("   - Tu dong dien email va password")
    print("   - Hien thi role va mo ta tai khoan")
    print("   - Giao dien dep, de su dung")
    print("   - Ho tro tat ca cac quyen nguoi dung")

def create_role_permissions_summary():
    """Tao tom tat quyen han cac role"""
    print(f"\nTOM TAT QUYEN HAN CAC ROLE")
    print("=" * 60)
    
    roles = {
        "ADMIN": {
            "description": "Toàn quyền - Quản lý hệ thống",
            "permissions": [
                "Xem tất cả dữ liệu",
                "Tạo/sửa/xóa tất cả",
                "Quản lý người dùng",
                "Quản lý hệ thống"
            ]
        },
        "SALES": {
            "description": "Quản lý báo giá và chi phí",
            "permissions": [
                "Xem báo cáo bán hàng",
                "Tạo báo giá",
                "Quản lý khách hàng",
                "Xem chi phí"
            ]
        },
        "WORKSHOP_EMPLOYEE": {
            "description": "Nhân viên xưởng - Tạo chi phí sản xuất",
            "permissions": [
                "Tạo chi phí sản xuất",
                "Xem dự án",
                "Cập nhật tiến độ"
            ]
        },
        "TRANSPORT": {
            "description": "Nhân viên vận chuyển - Tạo chi phí vận chuyển",
            "permissions": [
                "Tạo chi phí vận chuyển",
                "Xem dự án",
                "Cập nhật tiến độ"
            ]
        },
        "CUSTOMER": {
            "description": "Khách hàng - Portal khách hàng",
            "permissions": [
                "Xem dự án của mình",
                "Xem báo cáo",
                "Cập nhật thông tin"
            ]
        },
        "WORKER": {
            "description": "Công nhân - Tạo chi phí cơ bản",
            "permissions": [
                "Tạo chi phí cơ bản",
                "Xem dự án",
                "Cập nhật tiến độ"
            ]
        },
        "EMPLOYEE": {
            "description": "Nhân viên test - Tạo chi phí cơ bản",
            "permissions": [
                "Tạo chi phí cơ bản",
                "Xem dự án",
                "Cập nhật tiến độ"
            ]
        }
    }
    
    for role, info in roles.items():
        print(f"\n{role}:")
        print(f"   Description: {info['description']}")
        print(f"   Permissions:")
        for permission in info['permissions']:
            print(f"     - {permission}")

if __name__ == "__main__":
    print("KIEM TRA TRANG LOGIN DA CAP NHAT DAY DU")
    print("=" * 80)
    
    # Test tat ca cac tai khoan login
    successful, failed = test_all_login_accounts()
    
    # Tao huong dan su dung
    create_login_usage_guide()
    
    # Tao tom tat quyen han
    create_role_permissions_summary()
    
    print("\n" + "=" * 80)
    print("HOAN THANH KIEM TRA TRANG LOGIN")
    print("=" * 80)
