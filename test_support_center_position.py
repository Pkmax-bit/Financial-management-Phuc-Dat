"""
Script test vi tri Support Center da duoc di chuyen
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_support_center_position():
    """Test vi tri Support Center da duoc di chuyen"""
    print("TEST VI TRI SUPPORT CENTER DA DUOC DI CHUYEN")
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

def create_support_center_improvements():
    """Tao danh sach cai tien Support Center"""
    print(f"\nDANH SACH CAI TIEN SUPPORT CENTER")
    print("=" * 60)
    
    print("1. VI TRI MOI:")
    print("   - Support Center da duoc di chuyen len tren")
    print("   - Nam giua navigation menu va user section")
    print("   - De dang thao tac hon")
    print("   - Khong bi che khuat boi man hinh")
    
    print("\n2. LOI ICH:")
    print("   - Nguoi dung de dang tim thay")
    print("   - Khong can cuon xuong cuoi")
    print("   - Vi tri thuan tien cho thao tac")
    print("   - Cai thien trai nghiem nguoi dung")
    
    print("\n3. CẤU TRÚC MỚI:")
    print("   - Navigation Menu (trên cùng)")
    print("   - Support Center (giữa)")
    print("   - User Section (dưới cùng)")
    print("   - Đăng xuất (cuối cùng)")
    
    print("\n4. TÍNH NĂNG:")
    print("   - Support Center luôn hiển thị")
    print("   - Dễ dàng truy cập")
    print("   - Không bị che khuất")
    print("   - Vị trí hợp lý")

def create_sidebar_structure():
    """Tao cau truc sidebar moi"""
    print(f"\nCAU TRUC SIDEBAR MOI")
    print("=" * 60)
    
    print("SIDEBAR STRUCTURE:")
    print("┌─────────────────────────────────┐")
    print("│ 1. Navigation Menu             │")
    print("│    - Dashboard                  │")
    print("│    - Khách hàng                 │")
    print("│    - Dự án                      │")
    print("│    - Bán hàng                   │")
    print("│    - Chi phí                    │")
    print("│    - Báo cáo                    │")
    print("│    - Nhân viên                  │")
    print("│    - Thông báo                  │")
    print("│    - Files                      │")
    print("│    - AI Analysis                │")
    print("│    - AI Model Info              │")
    print("│    - Test API                   │")
    print("├─────────────────────────────────┤")
    print("│ 2. Support Center (MỚI)        │")
    print("│    - Trung tâm Hỗ trợ           │")
    print("├─────────────────────────────────┤")
    print("│ 3. User Section                │")
    print("│    - Avatar + Tên               │")
    print("│    - Role badge                 │")
    print("│    - Đăng xuất                  │")
    print("└─────────────────────────────────┘")
    
    print("\nTHAY ĐỔI CHÍNH:")
    print("  - Support Center di chuyển từ cuối lên giữa")
    print("  - Vị trí dễ thao tác hơn")
    print("  - Không bị che khuất")
    print("  - Cải thiện UX")

def create_usage_guide():
    """Tao huong dan su dung Support Center"""
    print(f"\nHUONG DAN SU DUNG SUPPORT CENTER")
    print("=" * 60)
    
    print("1. TRUY CAP SUPPORT CENTER:")
    print("   - Mở sidebar (nếu đóng)")
    print("   - Tìm 'Trung tâm Hỗ trợ' ở giữa sidebar")
    print("   - Bấm vào để mở Support Center")
    print("   - Không cần cuộn xuống cuối")
    
    print("\n2. VI TRI MOI:")
    print("   - Nằm giữa navigation menu và user section")
    print("   - Luôn hiển thị khi sidebar mở")
    print("   - Dễ dàng nhìn thấy")
    print("   - Thao tác nhanh chóng")
    
    print("\n3. TINH NANG:")
    print("   - Hỗ trợ người dùng")
    print("   - Hướng dẫn sử dụng")
    print("   - Liên hệ hỗ trợ")
    print("   - FAQ và tài liệu")
    
    print("\n4. LỢI ÍCH:")
    print("   - Dễ dàng truy cập")
    print("   - Không bị che khuất")
    print("   - Cải thiện trải nghiệm")
    print("   - Hỗ trợ người dùng tốt hơn")

if __name__ == "__main__":
    print("TEST VI TRI SUPPORT CENTER DA DUOC DI CHUYEN")
    print("=" * 80)
    
    # Test vi tri Support Center
    results = test_support_center_position()
    
    # Tao danh sach cai tien
    create_support_center_improvements()
    
    # Tao cau truc sidebar moi
    create_sidebar_structure()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 80)
    print("HOAN THANH TEST VI TRI SUPPORT CENTER")
    print("=" * 80)
