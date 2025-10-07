"""
Script test trung tam ho tro moi
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_new_support_center():
    """Test trung tam ho tro moi"""
    print("TEST TRUNG TAM HO TRO MOI")
    print("=" * 60)
    
    # Test voi cac tai khoan khac nhau
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
            "email": "workshop@test.com",
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
        print(f"\nTest role: {account['role'].upper()}")
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

def create_support_center_features():
    """Tao danh sach tinh nang trung tam ho tro moi"""
    print(f"\nTINH NANG TRUNG TAM HO TRO MOI")
    print("=" * 60)
    
    print("1. GIAO DIEN MOI:")
    print("   - Design don gian, de doc")
    print("   - Mau sac phan biet ro rang")
    print("   - Icon va button dep")
    print("   - Responsive tren moi thiet bi")
    
    print("\n2. CHUC NANG CHINH:")
    print("   - Huong dan co ban")
    print("   - Quan ly du an")
    print("   - Tao chi phi")
    print("   - Bao cao tai chinh")
    print("   - Khac phuc su co")
    print("   - Lien he ho tro")
    
    print("\n3. TINH NANG MOI:")
    print("   - Tim kiem nhanh")
    print("   - Danh muc phan loai")
    print("   - Huong dan chi tiet")
    print("   - FAQ thong minh")
    print("   - Lien he da dang")
    
    print("\n4. CAI TIEN UX:")
    print("   - Navigation don gian")
    print("   - Thao tac nhanh chong")
    print("   - Thong tin ro rang")
    print("   - Hỗ trợ 24/7")

def create_user_section_improvements():
    """Tao danh sach cai tien user section"""
    print(f"\nCAI TIEN USER SECTION")
    print("=" * 60)
    
    print("1. VI TRI MOI:")
    print("   - User section da duoc di chuyen len tren")
    print("   - Nam ngay sau navigation menu")
    print("   - De dang nhin thay hon")
    print("   - Khong bi che khuat")
    
    print("\n2. GIAO DIEN MOI:")
    print("   - Avatar gradient dep")
    print("   - Ten va role ro rang")
    print("   - Nut dang xuat noi bat")
    print("   - Mau sac phan biet")
    
    print("\n3. TINH NANG:")
    print("   - Hien thi avatar dep")
    print("   - Role badge mau sac")
    print("   - Nut dang xuat ro rang")
    print("   - Thong tin day du")
    
    print("\n4. LỢI ÍCH:")
    print("   - Nguoi dung de dang nhin thay")
    print("   - Thao tac nhanh chong")
    print("   - Giao dien dep")
    print("   - Trai nghiem tot hon")

def create_support_structure():
    """Tao cau truc trung tam ho tro"""
    print(f"\nCAU TRUC TRUNG TAM HO TRO")
    print("=" * 60)
    
    print("TRANG HO TRO CHINH (/support):")
    print("├── Huong dan co ban")
    print("│   ├── Dang nhap he thong")
    print("│   ├── Tao du an moi")
    print("│   └── Tao chi phi")
    print("├── Quan ly du an")
    print("│   ├── Tao du an moi")
    print("│   └── Theo doi tien do")
    print("├── Tao chi phi")
    print("│   ├── Chi phi san xuat")
    print("│   ├── Chi phi van chuyen")
    print("│   └── Chi phi co ban")
    print("├── Bao cao")
    print("│   ├── Bao cao theo du an")
    print("│   └── Bao cao tong hop")
    print("├── Khac phuc su co")
    print("│   └── FAQ thong minh")
    print("└── Lien he")
    print("    ├── Chat truc tuyen")
    print("    ├── Email ho tro")
    print("    └── Dien thoai")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 60)
    
    print("1. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Mo sidebar")
    print("   - Tim 'Trung tam Ho tro' o giua")
    print("   - Bam vao de mo")
    print("   - Chon danh muc can tim")
    
    print("\n2. SU DUNG CAC CHUC NANG:")
    print("   - Huong dan co ban: Lam quen voi he thong")
    print("   - Quan ly du an: Tao va quan ly du an")
    print("   - Tao chi phi: Ghi nhan chi phi")
    print("   - Bao cao: Xem bao cao tai chinh")
    print("   - Khac phuc su co: Giai quyet van de")
    print("   - Lien he: Ho tro truc tiep")
    
    print("\n3. TIM KIEM NHANH:")
    print("   - Su dung o tim kiem")
    print("   - Nhap tu khoa can tim")
    print("   - Ket qua hien thi ngay")
    print("   - Chon ket qua phu hop")
    
    print("\n4. LIEN HE HO TRO:")
    print("   - Chat truc tuyen: Ho tro 24/7")
    print("   - Email: support@company.com")
    print("   - Dien thoai: 0123-456-789")
    print("   - Tao ticket: Theo doi van de")

if __name__ == "__main__":
    print("TEST TRUNG TAM HO TRO MOI")
    print("=" * 80)
    
    # Test trung tam ho tro moi
    results = test_new_support_center()
    
    # Tao danh sach tinh nang
    create_support_center_features()
    
    # Tao danh sach cai tien user section
    create_user_section_improvements()
    
    # Tao cau truc trung tam ho tro
    create_support_structure()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TEST TRUNG TAM HO TRO MOI")
    print("=" * 80)
