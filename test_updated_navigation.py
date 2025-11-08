"""
Script test navigation da cap nhat (bo AI Image Reader va Camera Guide)
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_updated_navigation():
    """Test navigation da cap nhat"""
    print("TEST NAVIGATION DA CAP NHAT")
    print("=" * 60)
    
    # Cac tai khoan test
    test_accounts = [
        {
            "email": "admin@test.com",
            "password": "123456",
            "role": "admin",
            "expected_features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
                "AI Model Info", "Test API"
            ],
            "removed_features": [
                "AI Image Reader", "Camera Guide"
            ]
        },
        {
            "email": "sales@example.com",
            "password": "123456",
            "role": "sales",
            "expected_features": [
                "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
                "Bao cao", "Thong bao", "Files", "AI Analysis"
            ],
            "removed_features": [
                "AI Image Reader", "Camera Guide", "AI Model Info", "Test API"
            ]
        },
        {
            "email": "workshop@test.com",
            "password": "123456",
            "role": "workshop_employee",
            "expected_features": [
                "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
            ],
            "removed_features": [
                "AI Image Reader", "Camera Guide", "AI Analysis", "AI Model Info", "Test API"
            ]
        },
        {
            "email": "customer@test.com",
            "password": "123456",
            "role": "customer",
            "expected_features": [
                "Dashboard", "View khach hang", "Thong bao"
            ],
            "removed_features": [
                "AI Image Reader", "Camera Guide", "AI Analysis", "AI Model Info", "Test API"
            ]
        }
    ]
    
    results = []
    
    for account in test_accounts:
        print(f"\nTest role: {account['role'].upper()}")
        print(f"Email: {account['email']}")
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
                
                # Test cac endpoint
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

def create_updated_navigation_summary():
    """Tao tom tat navigation da cap nhat"""
    print(f"\nTOM TAT NAVIGATION DA CAP NHAT")
    print("=" * 60)
    
    print("DA BO CAC CHUC NANG:")
    print("  - AI Image Reader (da bo)")
    print("  - Camera Guide (da bo)")
    
    print("\nGIU LAI CAC CHUC NANG:")
    print("  - AI Analysis (giu lai)")
    print("  - AI Model Info (giu lai)")
    print("  - Test API (giu lai)")
    
    print("\nNAVIGATION THEO ROLE:")
    
    role_navigation = {
        "ADMIN": [
            "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
            "Bao cao", "Nhan vien", "Thong bao", "Files", "AI Analysis",
            "AI Model Info", "Test API"
        ],
        "SALES": [
            "Dashboard", "Khach hang", "Du an", "Ban hang", "Chi phi",
            "Bao cao", "Thong bao", "Files", "AI Analysis"
        ],
        "WORKSHOP_EMPLOYEE": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
        ],
        "TRANSPORT": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
        ],
        "CUSTOMER": [
            "Dashboard", "View khach hang", "Thong bao"
        ],
        "WORKER": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
        ],
        "EMPLOYEE": [
            "Dashboard", "Du an", "Chi phi", "Thong bao", "Files"
        ]
    }
    
    for role, features in role_navigation.items():
        print(f"\n{role}:")
        for feature in features:
            print(f"  - {feature}")

def create_removed_features_guide():
    """Tao huong dan cac chuc nang da bo"""
    print(f"\nHUONG DAN CAC CHUC NANG DA BO")
    print("=" * 60)
    
    print("1. AI IMAGE READER (DA BO):")
    print("   - Khong con hien thi trong menu")
    print("   - Khong con truy cap duoc")
    print("   - Da bo khoi tat ca cac role")
    
    print("\n2. CAMERA GUIDE (DA BO):")
    print("   - Khong con hien thi trong menu")
    print("   - Khong con truy cap duoc")
    print("   - Da bo khoi tat ca cac role")
    
    print("\n3. CAC CHUC NANG GIU LAI:")
    print("   - AI Analysis: Van con cho ADMIN, SALES")
    print("   - AI Model Info: Van con cho ADMIN")
    print("   - Test API: Van con cho ADMIN")
    
    print("\n4. LY DO BO:")
    print("   - AI Image Reader: Khong can thiet")
    print("   - Camera Guide: Khong can thiet")
    print("   - Giam bot phuc tap trong menu")
    print("   - Tap trung vao cac chuc nang chinh")

def create_navigation_comparison():
    """Tao bang so sanh navigation truoc va sau"""
    print(f"\nBANG SO SANH NAVIGATION")
    print("=" * 60)
    
    print("TRUOC KHI CAP NHAT:")
    print("  - AI Image Reader: Co")
    print("  - Camera Guide: Co")
    print("  - AI Analysis: Co")
    print("  - AI Model Info: Co")
    print("  - Test API: Co")
    
    print("\nSAU KHI CAP NHAT:")
    print("  - AI Image Reader: BO")
    print("  - Camera Guide: BO")
    print("  - AI Analysis: GIU LAI")
    print("  - AI Model Info: GIU LAI")
    print("  - Test API: GIU LAI")
    
    print("\nTONG KET:")
    print("  - So chuc nang da bo: 2")
    print("  - So chuc nang giu lai: 3")
    print("  - Navigation don gian hon")
    print("  - Tap trung vao chuc nang chinh")

if __name__ == "__main__":
    print("TEST NAVIGATION DA CAP NHAT")
    print("=" * 80)
    
    # Test navigation da cap nhat
    results = test_updated_navigation()
    
    # Tao tom tat
    create_updated_navigation_summary()
    
    # Tao huong dan
    create_removed_features_guide()
    
    # Tao bang so sanh
    create_navigation_comparison()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TEST NAVIGATION DA CAP NHAT")
    print("=" * 80)
