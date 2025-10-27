"""
Script kiem tra don gian trang login
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_login_accounts():
    """Test cac tai khoan login"""
    print("KIEM TRA TRANG LOGIN")
    print("=" * 50)
    
    # Cac tai khoan can test
    accounts = [
        ("admin@test.com", "ADMIN"),
        ("admin@example.com", "ADMIN"),
        ("sales@example.com", "SALES"),
        ("xuong@gmail.com", "WORKSHOP_EMPLOYEE"),
        ("transport@test.com", "TRANSPORT"),
        ("customer@test.com", "CUSTOMER"),
        ("worker@test.com", "WORKER"),
        ("test.employee.new@company.com", "EMPLOYEE"),
        ("test.employee.auth@company.com", "EMPLOYEE")
    ]
    
    successful = 0
    failed = 0
    
    for email, role in accounts:
        print(f"\nTest: {email} ({role})")
        
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
                "email": email,
                "password": "123456"
            })
            
            if response.status_code == 200:
                print("  Status: OK")
                successful += 1
            else:
                print(f"  Status: FAIL ({response.status_code})")
                failed += 1
                
        except Exception as e:
            print(f"  Status: ERROR - {str(e)}")
            failed += 1
    
    print(f"\nTONG KET:")
    print(f"- Total: {len(accounts)}")
    print(f"- Success: {successful}")
    print(f"- Failed: {failed}")
    print(f"- Rate: {successful/len(accounts)*100:.1f}%")
    
    return successful, failed

def create_summary():
    """Tao tom tat"""
    print(f"\nTOM TAT TRANG LOGIN")
    print("=" * 50)
    
    print("Trang login da duoc cap nhat voi 9 tai khoan:")
    print("1. admin@test.com - ADMIN")
    print("2. admin@example.com - ADMIN")
    print("3. sales@example.com - SALES")
    print("4. xuong@gmail.com - WORKSHOP_EMPLOYEE")
    print("5. transport@test.com - TRANSPORT")
    print("6. customer@test.com - CUSTOMER")
    print("7. worker@test.com - WORKER")
    print("8. test.employee.new@company.com - EMPLOYEE")
    print("9. test.employee.auth@company.com - EMPLOYEE")
    
    print(f"\nCach su dung:")
    print("- URL: http://localhost:3000/login")
    print("- Bam vao tai khoan de tu dong dien")
    print("- Bam 'Dang nhap' de dang nhap")
    print("- Password: 123456")

if __name__ == "__main__":
    print("KIEM TRA TRANG LOGIN DA CAP NHAT")
    print("=" * 60)
    
    # Test cac tai khoan
    successful, failed = test_login_accounts()
    
    # Tao tom tat
    create_summary()
    
    print("\n" + "=" * 60)
    print("HOAN THANH KIEM TRA")
    print("=" * 60)
