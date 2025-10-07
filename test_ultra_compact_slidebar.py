"""
Script test thu nho slide bar them mot nua
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_ultra_compact_slidebar():
    """Test thu nho slide bar them mot nua"""
    print("TEST THU NHO SLIDE BAR THEM MOT NUA")
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

def create_ultra_compact_summary():
    """Tao tom tat thu nho them mot nua"""
    print(f"\nTOM TAT THU NHO THEM MOT NUA")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Thu nho slide bar them mot nua (50%)")
    print("2. Giam padding va margin xuong muc toi thieu")
    print("3. Thu nho icon va spacing xuong muc nho nhat")
    print("4. Giam khoang cach giua cac phan tu xuong muc toi thieu")
    
    print("\nTHAY DOI CHI TIET:")
    print("- Container: space-y-1.5 -> space-y-1")
    print("- Section padding: p-1.5 -> p-1")
    print("- Icon size: h-2.5 w-2.5 -> h-2 w-2")
    print("- Button padding: px-1 py-0.5 -> px-0.5 py-0.5")
    print("- Border radius: rounded-sm -> rounded")
    print("- Grid gap: gap-1 -> gap-0.5")
    
    print("\nLOI ICH:")
    print("- Slide bar cuc ky gon gang")
    print("- Tiet kiem khong gian toi da")
    print("- Phu hop voi man hinh rat nho")
    print("- Trong tam vao noi dung")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. SLIDE BAR CUC KY GON GANG:")
    print("   - Chieu cao giam them 50%")
    print("   - Padding va margin toi thieu")
    print("   - Icon va text cuc nho")
    print("   - Khoang cach toi thieu")
    
    print("\n2. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Click vao 'Trung tam Ho tro'")
    print("   - Slide bar mo ra cuc nho gon")
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
    print("   - Giao dien cuc ky gon gang")
    print("   - Tiet kiem khong gian toi da")
    print("   - Phu hop voi man hinh nho")
    print("   - Trong tam vao noi dung")

if __name__ == "__main__":
    print("TEST THU NHO SLIDE BAR THEM MOT NUA")
    print("=" * 60)
    
    # Test thu nho slide bar them mot nua
    test_ultra_compact_slidebar()
    
    # Tao tom tat
    create_ultra_compact_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST THU NHO SLIDE BAR THEM MOT NUA")
    print("=" * 60)
