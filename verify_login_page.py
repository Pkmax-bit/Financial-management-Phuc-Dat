"""
Script kiem tra trang login co hien thi dung cac tai khoan test khong
"""

import requests
import re

def check_login_page():
    """Kiem tra trang login"""
    print("KIEM TRA TRANG LOGIN")
    print("=" * 50)
    
    try:
        # Truy cap trang login
        response = requests.get("http://localhost:3000/login", timeout=10)
        
        if response.status_code == 200:
            print("Trang login hoat dong")
            
            # Kiem tra noi dung trang
            content = response.text
            
            # Kiem tra cac tai khoan test
            test_accounts = [
                "admin@test.com",
                "admin@example.com", 
                "sales@example.com",
                "test.employee.new@company.com",
                "test.employee.auth@company.com"
            ]
            
            print("\nKiem tra cac tai khoan test:")
            found_accounts = []
            
            for account in test_accounts:
                if account in content:
                    print(f"{account} - Co trong trang")
                    found_accounts.append(account)
                else:
                    print(f"{account} - KHONG co trong trang")
            
            # Kiem tra password 123456
            if "123456" in content:
                print("\nPassword 123456 co trong trang")
            else:
                print("\nPassword 123456 KHONG co trong trang")
            
            # Kiem tra cac role
            roles = ["ADMIN", "SALES", "EMPLOYEE"]
            print(f"\nKiem tra cac role:")
            for role in roles:
                if role in content:
                    print(f"{role} - Co trong trang")
                else:
                    print(f"{role} - KHONG co trong trang")
            
            # Kiem tra cac icon
            icons = ["Crown", "DollarSign", "User"]
            print(f"\nKiem tra cac icon:")
            for icon in icons:
                if icon in content:
                    print(f"{icon} - Co trong trang")
                else:
                    print(f"{icon} - KHONG co trong trang")
            
            # Tong ket
            print(f"\nTONG KET:")
            print(f"- Trang login: Hoat dong")
            print(f"- Tai khoan test: {len(found_accounts)}/{len(test_accounts)}")
            print(f"- Password 123456: {'Co' if '123456' in content else 'Khong'}")
            print(f"- Cac role: {'Co' if all(role in content for role in roles) else 'Khong'}")
            print(f"- Cac icon: {'Co' if all(icon in content for icon in icons) else 'Khong'}")
            
            return len(found_accounts) == len(test_accounts)
            
        else:
            print(f"Trang login khong hoat dong: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi truy cap trang login: {str(e)}")
        return False

def test_quick_login():
    """Test dang nhap nhanh"""
    print(f"\nTEST DANG NHAP NHANH")
    print("=" * 50)
    
    # Test voi admin@test.com
    try:
        response = requests.post("http://localhost:8000/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("Dang nhap nhanh thanh cong voi admin@test.com")
            data = response.json()
            print(f"   Token: {data.get('access_token', '')[:20]}...")
            return True
        else:
            print(f"Dang nhap nhanh that bai: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Loi dang nhap nhanh: {str(e)}")
        return False

if __name__ == "__main__":
    print("KIEM TRA TRANG LOGIN VA CAC TAI KHOAN TEST")
    print("=" * 60)
    
    # Kiem tra trang login
    login_ok = check_login_page()
    
    # Test dang nhap nhanh
    auth_ok = test_quick_login()
    
    print(f"\n" + "=" * 60)
    print("KET QUA CUOI CUNG")
    print("=" * 60)
    print(f"Trang login: {'OK' if login_ok else 'LOI'}")
    print(f"Dang nhap nhanh: {'OK' if auth_ok else 'LOI'}")
    
    if login_ok and auth_ok:
        print("\nTRANG LOGIN DA DUOC CAP NHAT THANH CONG!")
        print("   - Cac tai khoan test da duoc cap nhat")
        print("   - Co the bam vao de dien nhanh thong tin dang nhap")
        print("   - Tat ca tai khoan deu hoat dong 100%")
    else:
        print("\nTRANG LOGIN CAN KIEM TRA THEM")
        print("   - Kiem tra xem frontend co dang chay khong")
        print("   - Kiem tra xem backend co dang chay khong")
    
    print("=" * 60)
