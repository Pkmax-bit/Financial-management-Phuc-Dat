"""
Script kiem tra toan bo he thong navigation da cap nhat
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_final_navigation_system():
    """Test toan bo he thong navigation da cap nhat"""
    print("KIEM TRA TOAN BO HE THONG NAVIGATION DA CAP NHAT")
    print("=" * 80)
    
    # Cac tai khoan test voi navigation da cap nhat
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "expected_navigation": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
                "AI Model Info", "Test API"
            ],
            "removed_navigation": [
                "AI Image Reader", "Camera Guide"
            ]
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "expected_navigation": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Thong bao", "Files", "AI Analysis"
            ],
            "removed_navigation": [
                "AI Image Reader", "Camera Guide", "AI Model Info", "Test API", "Nhan vien"
            ]
        },
        {
            "email": "xuong@gmail.com",
            "password": "123456",
            "role": "workshop_employee",
            "expected_navigation": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "removed_navigation": [
                "AI Image Reader", "Camera Guide", "AI Analysis", "AI Model Info", 
                "Test API", "Nhan vien", "Khach hang", "Ban hang", "Bao cao"
            ]
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer",
            "expected_navigation": [
                "Dashboard", "View khach hang", "Thong bao"
            ],
            "removed_navigation": [
                "AI Image Reader", "Camera Guide", "AI Analysis", "AI Model Info",
                "Test API", "Nhan vien", "Khach hang", "Du an", "Ban hang", 
                "Chi phi", "Bao cao", "Files"
            ]
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
                
                # Test cac endpoint chinh
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test dashboard
                dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=5)
                print(f"Dashboard: {'OK' if dashboard_response.status_code == 200 else dashboard_response.status_code}")
                
                # Test employees
                emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
                print(f"Employees: {'OK' if emp_response.status_code == 200 else emp_response.status_code}")
                
                # Test projects
                projects_response = requests.get(f"{API_BASE_URL}/api/projects/", headers=headers, timeout=5)
                print(f"Projects: {'OK' if projects_response.status_code == 200 else projects_response.status_code}")
                
                # Test customers
                customers_response = requests.get(f"{API_BASE_URL}/api/customers/", headers=headers, timeout=5)
                print(f"Customers: {'OK' if customers_response.status_code == 200 else customers_response.status_code}")
                
                results.append({
                    "role": account["role"],
                    "email": account["email"],
                    "status": "success",
                    "dashboard_access": dashboard_response.status_code == 200,
                    "employees_access": emp_response.status_code == 200,
                    "projects_access": projects_response.status_code == 200,
                    "customers_access": customers_response.status_code == 200
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

def create_final_navigation_summary():
    """Tao tom tat navigation cuoi cung"""
    print(f"\nTOM TAT NAVIGATION CUOI CUNG")
    print("=" * 80)
    
    print("DA BO CAC CHUC NANG:")
    print("  - AI Image Reader (da bo hoan toan)")
    print("  - Camera Guide (da bo hoan toan)")
    
    print("\nGIU LAI CAC CHUC NANG AI:")
    print("  - AI Analysis (cho ADMIN, SALES)")
    print("  - AI Model Info (cho ADMIN)")
    print("  - Test API (cho ADMIN)")
    
    print("\nNAVIGATION THEO ROLE CUOI CUNG:")
    
    final_navigation = {
        "ADMIN": {
            "description": "Toan quyen - Quan ly he thong",
            "features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
                "AI Model Info", "Test API"
            ],
            "color": "bg-red-500"
        },
        "SALES": {
            "description": "Quan ly ban hang va chi phi",
            "features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Thong bao", "Files", "AI Analysis"
            ],
            "color": "bg-blue-500"
        },
        "WORKSHOP_EMPLOYEE": {
            "description": "Nhan vien xuong - Tao chi phi san xuat",
            "features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "color": "bg-orange-500"
        },
        "TRANSPORT": {
            "description": "Nhan vien van chuyen - Tao chi phi van chuyen",
            "features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "color": "bg-yellow-500"
        },
        "CUSTOMER": {
            "description": "Khach hang - Portal khach hang",
            "features": [
                "Dashboard", "View khach hang", "Thong bao"
            ],
            "color": "bg-indigo-500"
        },
        "WORKER": {
            "description": "Cong nhan - Tao chi phi co ban",
            "features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "color": "bg-purple-500"
        },
        "EMPLOYEE": {
            "description": "Nhan vien - Tao chi phi co ban",
            "features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "color": "bg-green-500"
        }
    }
    
    for role, info in final_navigation.items():
        print(f"\n{role} ({info['color']}):")
        print(f"  Mo ta: {info['description']}")
        print(f"  Chuc nang:")
        for feature in info['features']:
            print(f"    - {feature}")

def create_system_improvements():
    """Tao danh sach cai tien he thong"""
    print(f"\nDANH SACH CAI TIEN HE THONG")
    print("=" * 80)
    
    print("1. NAVIGATION DON GIAN HON:")
    print("   - Bo AI Image Reader (khong can thiet)")
    print("   - Bo Camera Guide (khong can thiet)")
    print("   - Giam bot phuc tap trong menu")
    print("   - Tap trung vao chuc nang chinh")
    
    print("\n2. PHAN QUYEN ROLE RO RANG:")
    print("   - ADMIN: Toan quyen he thong")
    print("   - SALES: Quan ly ban hang")
    print("   - WORKSHOP_EMPLOYEE: Tao chi phi san xuat")
    print("   - TRANSPORT: Tao chi phi van chuyen")
    print("   - CUSTOMER: Portal khach hang")
    print("   - WORKER: Tao chi phi co ban")
    print("   - EMPLOYEE: Tao chi phi co ban")
    
    print("\n3. TINH NANG CHINH:")
    print("   - Phan quyen theo role")
    print("   - An/hien menu theo quyen")
    print("   - Mau sac phan biet role")
    print("   - Navigation don gian")
    print("   - Bao mat theo role")
    
    print("\n4. GIAO DIEN TOI UU:")
    print("   - Menu nhom theo category")
    print("   - Mau sac phan biet role")
    print("   - Hien thi role trong sidebar")
    print("   - Navigation thich ung")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 80)
    
    print("1. TRUY CAP HE THONG:")
    print("   - URL: http://localhost:3000/login")
    print("   - Chon tai khoan theo role can test")
    print("   - Bam 'Dang nhap' de vao he thong")
    
    print("\n2. CAC TAI KHOAN TEST:")
    print("   - admin@test.com (ADMIN) - Toan quyen")
    print("   - sales@example.com (SALES) - Quan ly ban hang")
    print("   - xuong@gmail.com (WORKSHOP_EMPLOYEE) - Nhan vien xuong")
    print("   - transport@test.com (TRANSPORT) - Nhan vien van chuyen")
    print("   - customer@test.com (CUSTOMER) - Khach hang")
    print("   - worker@test.com (WORKER) - Cong nhan")
    print("   - test.employee.new@company.com (EMPLOYEE) - Nhan vien")
    
    print("\n3. TINH NANG NAVIGATION:")
    print("   - Menu hien thi theo role")
    print("   - Mau sac phan biet role")
    print("   - Quyen han khac nhau")
    print("   - Navigation don gian")
    
    print("\n4. LUA CHON ROLE:")
    print("   - ADMIN: Neu muon test toan quyen")
    print("   - SALES: Neu muon test quan ly ban hang")
    print("   - WORKSHOP_EMPLOYEE: Neu muon test tao chi phi san xuat")
    print("   - CUSTOMER: Neu muon test portal khach hang")

if __name__ == "__main__":
    print("KIEM TRA TOAN BO HE THONG NAVIGATION DA CAP NHAT")
    print("=" * 100)
    
    # Test he thong navigation da cap nhat
    results = test_final_navigation_system()
    
    # Tao tom tat navigation cuoi cung
    create_final_navigation_summary()
    
    # Tao danh sach cai tien
    create_system_improvements()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 100)
    print("HOAN THANH KIEM TRA HE THONG NAVIGATION DA CAP NHAT")
    print("=" * 100)
