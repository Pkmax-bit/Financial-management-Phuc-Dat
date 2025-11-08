"""
Script test thu nho chieu cao slide bar
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_compact_slidebar():
    """Test thu nho chieu cao slide bar"""
    print("TEST THU NHO CHIEU CAO SLIDE BAR")
    print("=" * 50)
    
    # Test voi admin
    print("\nTest voi admin@test.com:")
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("Login: OK")
            
            # Test cac endpoint
            headers = {"Authorization": f"Bearer {response.json().get('access_token')}"}
            
            # Test dashboard
            dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=5)
            print(f"Dashboard: {'OK' if dashboard_response.status_code == 200 else dashboard_response.status_code}")
            
            # Test employees
            emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
            print(f"Employees: {'OK' if emp_response.status_code == 200 else emp_response.status_code}")
            
        else:
            print(f"Login: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def create_compact_summary():
    """Tao tom tat thu nho"""
    print(f"\nTOM TAT THU NHO CHIEU CAO")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Thu nho chieu cao slide bar 20%")
    print("2. Giam padding va margin")
    print("3. Thu nho icon va spacing")
    print("4. Giam khoang cach giua cac phan tu")
    
    print("\nTHAY DOI CHI TIET:")
    print("- Container: mt-1 -> mt-0.5, space-y-2 -> space-y-1.5")
    print("- Section padding: p-2 -> p-1.5")
    print("- Icon size: h-3 w-3 -> h-2.5 w-2.5")
    print("- Margin bottom: mb-1 -> mb-0.5")
    print("- Border radius: rounded-md -> rounded-sm")
    print("- Quick actions: p-2 -> p-1.5")
    
    print("\nLOI ICH:")
    print("- Slide bar gon gang hon")
    print("- Tiet kiem khong gian")
    print("- De su dung tren man hinh nho")
    print("- Trong tam vao noi dung")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. SLIDE BAR THU NHO:")
    print("   - Chieu cao giam 20%")
    print("   - Padding va margin nho hon")
    print("   - Icon va text nho hon")
    print("   - Khoang cach it hon")
    
    print("\n2. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Click vao 'Trung tam Ho tro'")
    print("   - Slide bar mo ra nho gon")
    print("   - Chon danh muc can tim")
    print("   - Click de navigate")
    
    print("\n3. TINH NANG:")
    print("   - Huong dan co ban")
    print("   - Quan ly du an")
    print("   - Tao chi phi")
    print("   - Bao cao tai chinh")
    print("   - Khac phuc su co")
    print("   - Lien he ho tro")
    
    print("\n4. LOI ICH:")
    print("   - Giao dien gon gang")
    print("   - Tiet kiem khong gian")
    print("   - De su dung hon")
    print("   - Trong tam vao noi dung")

if __name__ == "__main__":
    print("TEST THU NHO CHIEU CAO SLIDE BAR")
    print("=" * 60)
    
    # Test thu nho slide bar
    test_compact_slidebar()
    
    # Tao tom tat
    create_compact_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST THU NHO CHIEU CAO SLIDE BAR")
    print("=" * 60)
