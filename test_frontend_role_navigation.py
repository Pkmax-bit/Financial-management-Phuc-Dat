"""
Script test giao dien frontend voi cac role khac nhau
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_frontend_navigation():
    """Test giao dien frontend voi cac role"""
    print("TEST GIAO DIEN FRONTEND VOI CAC ROLE")
    print("=" * 60)
    
    # Cac tai khoan test
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "description": "Toan quyen - Quan ly he thong"
        },
        {
            "email": "sales@example.com", 
            "password": "123456",
            "role": "sales",
            "description": "Quan ly ban hang va chi phi"
        },
        {
            "email": "xuong@gmail.com",
            "password": "123456", 
            "role": "workshop_employee",
            "description": "Nhan vien xuong - Tao chi phi san xuat"
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer", 
            "description": "Khach hang - Portal khach hang"
        }
    ]
    
    results = []
    
    for account in test_accounts:
        print(f"\nTest giao dien voi role: {account['role']}")
        print(f"Email: {account['email']}")
        print(f"Mota: {account['description']}")
        print("-" * 50)
        
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
                
                # Test dashboard access
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test dashboard endpoint
                dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=10)
                if dashboard_response.status_code == 200:
                    print(f"Dashboard API: OK")
                else:
                    print(f"Dashboard API: {dashboard_response.status_code}")
                
                # Test employees endpoint
                emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
                if emp_response.status_code == 200:
                    print(f"Employees API: OK")
                else:
                    print(f"Employees API: {emp_response.status_code}")
                
                # Test projects endpoint
                projects_response = requests.get(f"{API_BASE_URL}/api/projects/", headers=headers, timeout=5)
                if projects_response.status_code == 200:
                    print(f"Projects API: OK")
                else:
                    print(f"Projects API: {projects_response.status_code}")
                
                results.append({
                    "role": account["role"],
                    "email": account["email"],
                    "status": "success",
                    "dashboard_access": dashboard_response.status_code == 200,
                    "employees_access": emp_response.status_code == 200,
                    "projects_access": projects_response.status_code == 200
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

def create_navigation_guide():
    """Tao huong dan navigation theo role"""
    print(f"\nHUONG DAN NAVIGATION THEO ROLE")
    print("=" * 60)
    
    print("1. ADMIN (admin@test.com):")
    print("   - Co the truy cap tat ca cac chuc nang")
    print("   - Quan ly nhan vien, khach hang, du an")
    print("   - Xem bao cao, phan tich AI")
    print("   - Quan ly he thong")
    
    print("\n2. SALES (sales@example.com):")
    print("   - Quan ly ban hang, khach hang")
    print("   - Tao bao gia, hoa don")
    print("   - Xem bao cao ban hang")
    print("   - Khong the quan ly nhan vien")
    
    print("\n3. WORKSHOP_EMPLOYEE (xuong@gmail.com):")
    print("   - Tao chi phi san xuat")
    print("   - Xem du an")
    print("   - Su dung AI Image Reader")
    print("   - Khong the quan ly khach hang")
    
    print("\n4. CUSTOMER (customer@test.com):")
    print("   - Chi xem thong tin cua minh")
    print("   - Xem timeline cong trinh")
    print("   - Khong the tao chi phi")
    
    print(f"\nCACH SU DUNG:")
    print("1. Truy cap: http://localhost:3000/login")
    print("2. Chon tai khoan theo role can test")
    print("3. Bam 'Dang nhap' de vao he thong")
    print("4. Kiem tra cac menu hien thi theo role")

def create_role_comparison():
    """Tao bang so sanh cac role"""
    print(f"\nBANG SO SANH CAC ROLE")
    print("=" * 60)
    
    roles_comparison = {
        "Chuc nang": ["Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi", "Bao cao", "Nhan vien", "AI Analysis"],
        "ADMIN": ["OK", "OK", "OK", "OK", "OK", "OK", "OK", "OK"],
        "SALES": ["OK", "OK", "OK", "OK", "OK", "OK", "NO", "OK"],
        "WORKSHOP_EMPLOYEE": ["OK", "NO", "OK", "NO", "OK", "NO", "NO", "NO"],
        "TRANSPORT": ["OK", "NO", "OK", "NO", "OK", "NO", "NO", "NO"],
        "CUSTOMER": ["OK", "NO", "NO", "NO", "NO", "NO", "NO", "NO"],
        "WORKER": ["OK", "NO", "OK", "NO", "OK", "NO", "NO", "NO"],
        "EMPLOYEE": ["OK", "NO", "OK", "NO", "OK", "NO", "NO", "NO"]
    }
    
    # Print header
    print(f"{'Chuc nang':<20}", end="")
    for role in ["ADMIN", "SALES", "WORKSHOP", "TRANSPORT", "CUSTOMER", "WORKER", "EMPLOYEE"]:
        print(f"{role:<10}", end="")
    print()
    print("-" * 90)
    
    # Print rows
    for i, feature in enumerate(roles_comparison["Chuc nang"]):
        print(f"{feature:<20}", end="")
        for role in ["ADMIN", "SALES", "WORKSHOP_EMPLOYEE", "TRANSPORT", "CUSTOMER", "WORKER", "EMPLOYEE"]:
            if role in roles_comparison:
                print(f"{roles_comparison[role][i]:<10}", end="")
        print()

if __name__ == "__main__":
    print("TEST GIAO DIEN FRONTEND VOI CAC ROLE")
    print("=" * 80)
    
    # Test giao dien
    results = test_frontend_navigation()
    
    # Tao huong dan
    create_navigation_guide()
    
    # Tao bang so sanh
    create_role_comparison()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TEST GIAO DIEN")
    print("=" * 80)
