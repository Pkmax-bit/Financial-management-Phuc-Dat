"""
Script test he thong phan quyen navigation
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_role_based_navigation():
    """Test navigation theo role"""
    print("TEST HE THONG PHAN QUYEN NAVIGATION")
    print("=" * 60)
    
    # Cac tai khoan test voi cac role khac nhau
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "expected_features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi", 
                "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
                "AI Image Reader", "AI Model Info", "Test API", "Camera Guide"
            ]
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "expected_features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Thong bao", "Files", "AI Analysis", "AI Image Reader",
                "Camera Guide"
            ]
        },
        {
            "email": "xuong@gmail.com",
            "password": "123456",
            "role": "workshop_employee",
            "expected_features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
                "AI Image Reader", "Camera Guide"
            ]
        },
        {
            "email": "transport@test.com",
            "password": "123456",
            "role": "transport",
            "expected_features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
                "AI Image Reader", "Camera Guide"
            ]
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer",
            "expected_features": [
                "Dashboard", "View khach hang", "Thong bao"
            ]
        },
        {
            "email": "worker@test.com",
            "password": "123456",
            "role": "worker",
            "expected_features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
                "AI Image Reader", "Camera Guide"
            ]
        }
    ]
    
    results = []
    
    for account in test_accounts:
        print(f"\nTest role: {account['role']} ({account['email']})")
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
                
                # Test employees endpoint (should work for admin/accountant only)
                emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
                if emp_response.status_code == 200:
                    print(f"Employees API: OK (co quyen)")
                else:
                    print(f"Employees API: {emp_response.status_code} (khong co quyen)")
                
                # Test reports endpoint (should work for admin/sales/accountant only)
                reports_response = requests.get(f"{API_BASE_URL}/api/reports/", headers=headers, timeout=5)
                if reports_response.status_code == 200:
                    print(f"Reports API: OK (co quyen)")
                else:
                    print(f"Reports API: {reports_response.status_code} (khong co quyen)")
                
                # Test expenses endpoint (should work for most roles)
                expenses_response = requests.get(f"{API_BASE_URL}/api/expenses/", headers=headers, timeout=5)
                if expenses_response.status_code == 200:
                    print(f"Expenses API: OK (co quyen)")
                else:
                    print(f"Expenses API: {expenses_response.status_code} (khong co quyen)")
                
                results.append({
                    "role": account["role"],
                    "email": account["email"],
                    "status": "success",
                    "employees_access": emp_response.status_code == 200,
                    "reports_access": reports_response.status_code == 200,
                    "expenses_access": expenses_response.status_code == 200
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
    
    # Tong ket
    print(f"\n" + "=" * 60)
    print("TONG KET PHAN QUYEN")
    print("=" * 60)
    
    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] != "success"]
    
    print(f"Tong so test: {len(results)}")
    print(f"Thanh cong: {len(successful)}")
    print(f"That bai: {len(failed)}")
    
    if successful:
        print(f"\nCHI TIET PHAN QUYEN:")
        for result in successful:
            print(f"\n{result['role'].upper()}:")
            print(f"  - Employees API: {'OK' if result.get('employees_access') else 'DENIED'}")
            print(f"  - Reports API: {'OK' if result.get('reports_access') else 'DENIED'}")
            print(f"  - Expenses API: {'OK' if result.get('expenses_access') else 'DENIED'}")
    
    return results

def create_navigation_summary():
    """Tao tom tat navigation theo role"""
    print(f"\nTOM TAT NAVIGATION THEO ROLE")
    print("=" * 60)
    
    role_navigation = {
        "ADMIN": [
            "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
            "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
            "AI Image Reader", "AI Model Info", "Test API", "Camera Guide"
        ],
        "SALES": [
            "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
            "Bao cao", "Thong bao", "Files", "AI Analysis", "AI Image Reader",
            "Camera Guide"
        ],
        "WORKSHOP_EMPLOYEE": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
            "AI Image Reader", "Camera Guide"
        ],
        "TRANSPORT": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
            "AI Image Reader", "Camera Guide"
        ],
        "CUSTOMER": [
            "Dashboard", "View khach hang", "Thong bao"
        ],
        "WORKER": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
            "AI Image Reader", "Camera Guide"
        ],
        "EMPLOYEE": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files",
            "AI Image Reader", "Camera Guide"
        ]
    }
    
    for role, features in role_navigation.items():
        print(f"\n{role}:")
        for feature in features:
            print(f"  - {feature}")

if __name__ == "__main__":
    print("TEST HE THONG PHAN QUYEN NAVIGATION")
    print("=" * 80)
    
    # Test phan quyen
    results = test_role_based_navigation()
    
    # Tao tom tat
    create_navigation_summary()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TEST PHAN QUYEN")
    print("=" * 80)
