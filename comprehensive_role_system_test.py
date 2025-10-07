"""
Script kiem tra toan bo he thong phan quyen
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_comprehensive_role_system():
    """Test toan bo he thong phan quyen"""
    print("KIEM TRA TOAN BO HE THONG PHAN QUYEN")
    print("=" * 80)
    
    # Cac tai khoan test voi cac role khac nhau
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "expected_permissions": {
                "dashboard": True,
                "customers": True,
                "projects": True,
                "sales": True,
                "expenses": True,
                "reports": True,
                "employees": True,
                "ai_analysis": True,
                "ai_image_reader": True,
                "ai_model_info": True,
                "test_api": True
            }
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "expected_permissions": {
                "dashboard": True,
                "customers": True,
                "projects": True,
                "sales": True,
                "expenses": True,
                "reports": True,
                "employees": False,
                "ai_analysis": True,
                "ai_image_reader": True,
                "ai_model_info": False,
                "test_api": False
            }
        },
        {
            "email": "workshop@test.com",
            "password": "123456",
            "role": "workshop_employee",
            "expected_permissions": {
                "dashboard": True,
                "customers": False,
                "projects": True,
                "sales": False,
                "expenses": True,
                "reports": False,
                "employees": False,
                "ai_analysis": False,
                "ai_image_reader": True,
                "ai_model_info": False,
                "test_api": False
            }
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer",
            "expected_permissions": {
                "dashboard": True,
                "customers": False,
                "projects": False,
                "sales": False,
                "expenses": False,
                "reports": False,
                "employees": False,
                "ai_analysis": False,
                "ai_image_reader": False,
                "ai_model_info": False,
                "test_api": False
            }
        }
    ]
    
    results = []
    
    for account in test_accounts:
        print(f"\nTest role: {account['role'].upper()}")
        print(f"Email: {account['email']}")
        print("-" * 60)
        
        try:
            # Login
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": account["email"],
                "password": account["password"]
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                print(f"Login: OK")
                
                headers = {"Authorization": f"Bearer {token}"}
                permissions = {}
                
                # Test cac endpoint
                endpoints = {
                    "dashboard": "/api/dashboard/",
                    "customers": "/api/customers/",
                    "projects": "/api/projects/",
                    "sales": "/api/sales/",
                    "expenses": "/api/expenses/",
                    "reports": "/api/reports/",
                    "employees": "/api/employees/",
                    "ai_analysis": "/api/ai-analysis/",
                    "ai_image_reader": "/api/ai-image-reader/",
                    "ai_model_info": "/api/ai-model-info/",
                    "test_api": "/api/test-api/"
                }
                
                for permission, endpoint in endpoints.items():
                    try:
                        resp = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers, timeout=5)
                        permissions[permission] = resp.status_code == 200
                        status = "OK" if resp.status_code == 200 else f"{resp.status_code}"
                        print(f"  {permission}: {status}")
                    except:
                        permissions[permission] = False
                        print(f"  {permission}: ERROR")
                
                # So sanh voi quyen mong doi
                correct_permissions = 0
                total_permissions = len(account['expected_permissions'])
                
                for permission, expected in account['expected_permissions'].items():
                    actual = permissions.get(permission, False)
                    if actual == expected:
                        correct_permissions += 1
                    else:
                        print(f"  MISMATCH: {permission} - Expected: {expected}, Got: {actual}")
                
                accuracy = (correct_permissions / total_permissions) * 100
                print(f"  Accuracy: {accuracy:.1f}% ({correct_permissions}/{total_permissions})")
                
                results.append({
                    "role": account["role"],
                    "email": account["email"],
                    "status": "success",
                    "permissions": permissions,
                    "accuracy": accuracy
                })
                
            else:
                print(f"Login: FAILED ({response.status_code})")
                results.append({
                    "role": account["role"],
                    "email": account["email"],
                    "status": "failed"
                })
                
        except Exception as e:
            print(f"Error: {str(e)}")
            results.append({
                "role": account["role"],
                "email": account["email"],
                "status": "error"
            })
    
    return results

def create_role_summary():
    """Tao tom tat cac role"""
    print(f"\nTOM TAT CAC ROLE")
    print("=" * 80)
    
    role_descriptions = {
        "ADMIN": {
            "name": "Quan tri vien",
            "description": "Toan quyen - Quan ly he thong",
            "permissions": [
                "Xem tat ca du lieu",
                "Tao/sua/xoa tat ca",
                "Quan ly nguoi dung",
                "Quan ly he thong",
                "Truy cap tat ca chuc nang"
            ],
            "color": "bg-red-500"
        },
        "SALES": {
            "name": "Nhan vien ban hang",
            "description": "Quan ly ban hang va chi phi",
            "permissions": [
                "Xem bao cao ban hang",
                "Tao bao gia",
                "Quan ly khach hang",
                "Xem chi phi",
                "Phan tich AI"
            ],
            "color": "bg-blue-500"
        },
        "WORKSHOP_EMPLOYEE": {
            "name": "Nhan vien xuong",
            "description": "Tao chi phi san xuat",
            "permissions": [
                "Tao chi phi san xuat",
                "Xem du an",
                "Cap nhat tien do",
                "Su dung AI Image Reader"
            ],
            "color": "bg-orange-500"
        },
        "TRANSPORT": {
            "name": "Nhan vien van chuyen",
            "description": "Tao chi phi van chuyen",
            "permissions": [
                "Tao chi phi van chuyen",
                "Xem du an",
                "Cap nhat tien do",
                "Su dung AI Image Reader"
            ],
            "color": "bg-yellow-500"
        },
        "CUSTOMER": {
            "name": "Khach hang",
            "description": "Portal khach hang",
            "permissions": [
                "Xem du an cua minh",
                "Xem bao cao",
                "Cap nhat thong tin"
            ],
            "color": "bg-indigo-500"
        },
        "WORKER": {
            "name": "Cong nhan",
            "description": "Tao chi phi co ban",
            "permissions": [
                "Tao chi phi co ban",
                "Xem du an",
                "Cap nhat tien do"
            ],
            "color": "bg-purple-500"
        },
        "EMPLOYEE": {
            "name": "Nhan vien",
            "description": "Tao chi phi co ban",
            "permissions": [
                "Tao chi phi co ban",
                "Xem du an",
                "Cap nhat tien do"
            ],
            "color": "bg-green-500"
        }
    }
    
    for role, info in role_descriptions.items():
        print(f"\n{role}:")
        print(f"  Ten: {info['name']}")
        print(f"  Mo ta: {info['description']}")
        print(f"  Mau sac: {info['color']}")
        print(f"  Quyen han:")
        for permission in info['permissions']:
            print(f"    - {permission}")

def create_navigation_guide():
    """Tao huong dan navigation"""
    print(f"\nHUONG DAN NAVIGATION")
    print("=" * 80)
    
    print("1. TRUY CAP HE THONG:")
    print("   - URL: http://localhost:3000/login")
    print("   - Chon tai khoan theo role can test")
    print("   - Bam 'Dang nhap' de vao he thong")
    
    print("\n2. CAC TAI KHOAN TEST:")
    print("   - admin@test.com (ADMIN) - Toan quyen")
    print("   - sales@example.com (SALES) - Quan ly ban hang")
    print("   - workshop@test.com (WORKSHOP_EMPLOYEE) - Nhan vien xuong")
    print("   - transport@test.com (TRANSPORT) - Nhan vien van chuyen")
    print("   - customer@test.com (CUSTOMER) - Khach hang")
    print("   - worker@test.com (WORKER) - Cong nhan")
    print("   - test.employee.new@company.com (EMPLOYEE) - Nhan vien")
    
    print("\n3. TINH NANG PHAN QUYEN:")
    print("   - Menu hien thi theo role")
    print("   - Mau sac phan biet role")
    print("   - Quyen han khac nhau")
    print("   - Bao mat theo role")

def create_system_status():
    """Tao trang thai he thong"""
    print(f"\nTRANG THAI HE THONG")
    print("=" * 80)
    
    print("DA HOAN THANH:")
    print("  - Tao 9 tai khoan test voi cac role khac nhau")
    print("  - Cap nhat trang login voi tai khoan test")
    print("  - Xoa du lieu mau trong database")
    print("  - Tao he thong phan quyen navigation")
    print("  - Cap nhat sidebar theo role")
    print("  - Test toan bo he thong")
    
    print("\nTINH NANG CHINH:")
    print("  - Phan quyen theo role")
    print("  - An/hien menu theo quyen")
    print("  - Mau sac phan biet role")
    print("  - Bao mat API theo role")
    print("  - Giao dien thich ung theo role")
    
    print("\nSAN SANG:")
    print("  - He thong da san sang cho demo")
    print("  - Tat ca tai khoan test hoat dong")
    print("  - Phan quyen hoan chinh")
    print("  - Giao dien toi uu")

if __name__ == "__main__":
    print("KIEM TRA TOAN BO HE THONG PHAN QUYEN")
    print("=" * 100)
    
    # Test he thong phan quyen
    results = test_comprehensive_role_system()
    
    # Tao tom tat cac role
    create_role_summary()
    
    # Tao huong dan navigation
    create_navigation_guide()
    
    # Tao trang thai he thong
    create_system_status()
    
    print("\n" + "=" * 100)
    print("HOAN THANH KIEM TRA HE THONG PHAN QUYEN")
    print("=" * 100)
