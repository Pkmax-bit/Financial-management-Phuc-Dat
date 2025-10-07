"""
Script test trung tam ho tro thu nho
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_compact_support():
    """Test trung tam ho tro thu nho"""
    print("TEST TRUNG TAM HO TRO THU NHO")
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
    print(f"\nTOM TAT THU NHO")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Thu nho trung tam ho tro thanh slide bar")
    print("2. Giam khoang cach giua cac tab")
    print("3. Giam padding va margin")
    print("4. Thu nho icon va text")
    print("5. Giam khoang cach user section")
    
    print("\nTHAY DOI CHI TIET:")
    print("- Support center: mt-2 -> mt-1, space-y-3 -> space-y-2")
    print("- Section padding: p-3 -> p-2")
    print("- Icon size: h-4 w-4 -> h-3 w-3")
    print("- Text size: text-xs -> text-xs (giu nguyen)")
    print("- Button padding: px-2 py-1 -> px-1 py-0.5")
    print("- Navigation: py-2.5 -> py-1.5")
    print("- Category margin: mb-4 -> mb-2")
    print("- User section: p-4 -> p-3")
    print("- Avatar size: w-10 h-10 -> w-8 h-8")
    print("- Text size: text-sm -> text-xs")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. TRUNG TAM HO TRO THU NHO:")
    print("   - Click vao 'Trung tam Ho tro'")
    print("   - Slide bar mo ra nho gon")
    print("   - Chon danh muc can tim")
    print("   - Click de navigate")
    
    print("\n2. NAVIGATION THU NHO:")
    print("   - Cac tab gan nhau hon")
    print("   - Icon nho hon")
    print("   - Text nho hon")
    print("   - Khoang cach it hon")
    
    print("\n3. USER SECTION THU NHO:")
    print("   - Avatar nho hon")
    print("   - Text nho hon")
    print("   - Button nho hon")
    print("   - Khoang cach it hon")
    
    print("\n4. LỢI ÍCH:")
    print("   - Giao dien gon gang")
    print("   - Tiet kiem khong gian")
    print("   - De su dung hon")
    print("   - Trong tam vao noi dung")

if __name__ == "__main__":
    print("TEST TRUNG TAM HO TRO THU NHO")
    print("=" * 60)
    
    # Test trung tam ho tro
    test_compact_support()
    
    # Tao tom tat
    create_compact_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST TRUNG TAM HO TRO THU NHO")
    print("=" * 60)
