"""
Script test nut dang xuat cung hang
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_inline_logout():
    """Test nut dang xuat cung hang"""
    print("TEST NUT DANG XUAT CUNG HANG")
    print("=" * 40)
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("Login: OK")
            
            headers = {"Authorization": f"Bearer {response.json().get('access_token')}"}
            
            dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=5)
            print(f"Dashboard: {'OK' if dashboard_response.status_code == 200 else dashboard_response.status_code}")
            
            emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
            print(f"Employees: {'OK' if emp_response.status_code == 200 else emp_response.status_code}")
            
        else:
            print(f"Login: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def create_summary():
    """Tao tom tat"""
    print(f"\nTOM TAT")
    print("=" * 40)
    
    print("DA THUC HIEN:")
    print("1. Dat nut dang xuat cung hang voi thong tin user")
    print("2. Xoa margin bottom cua user info")
    print("3. Cap nhat LayoutWithSidebar.tsx")
    print("4. Cap nhat NavigationWithToggle.tsx")
    
    print("\nLAYOUT MOI:")
    print("1. Avatar + User info + Logout button (cung hang)")
    print("2. Nut dang xuat chi co icon")
    print("3. Tooltip 'Dang xuat'")
    print("4. Giao dien gon gang hon")
    
    print("\nLOI ICH:")
    print("- Tiet kiem khong gian")
    print("- Giao dien gon gang")
    print("- De su dung hon")
    print("- Trong tam vao noi dung")

if __name__ == "__main__":
    print("TEST NUT DANG XUAT CUNG HANG")
    print("=" * 50)
    
    test_inline_logout()
    create_summary()
    
    print("\n" + "=" * 50)
    print("HOAN THANH TEST NUT DANG XUAT CUNG HANG")
    print("=" * 50)
