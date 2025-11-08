#!/usr/bin/env python3
"""
Tạo tài khoản nhân viên xưởng đơn giản
"""

def create_workshop_accounts_simple():
    """Tạo tài khoản nhân viên xưởng"""
    
    print("TAO TAI KHOAN NHAN VIEN XUONG VA NHAN CONG...")
    print("=" * 60)
    
    # Danh sách tài khoản nhân viên xưởng
    workshop_accounts = [
        {
            "email": "xuong.quandoc@company.com",
            "password": "123456",
            "full_name": "Nguyen Van Quan Doc",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-001",
            "position": "Quan doc xuong"
        },
        {
            "email": "xuong.congnhan1@company.com", 
            "password": "123456",
            "full_name": "Tran Thi Cong Nhan 1",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-002",
            "position": "Cong nhan xuong"
        },
        {
            "email": "xuong.congnhan2@company.com",
            "password": "123456", 
            "full_name": "Le Van Cong Nhan 2",
            "role": "workshop_employee",
            "employee_code": "EMP-WORKSHOP-003",
            "position": "Cong nhan xuong"
        }
    ]
    
    # Danh sách tài khoản nhân công
    worker_accounts = [
        {
            "email": "nhan.cong1@company.com",
            "password": "123456",
            "full_name": "Pham Thi Nhan Cong 1", 
            "role": "worker",
            "employee_code": "EMP-WORKER-001",
            "position": "Nhan cong"
        },
        {
            "email": "nhan.cong2@company.com",
            "password": "123456",
            "full_name": "Hoang Van Nhan Cong 2",
            "role": "worker", 
            "employee_code": "EMP-WORKER-002",
            "position": "Nhan cong"
        }
    ]
    
    all_accounts = workshop_accounts + worker_accounts
    
    print("\nDANH SACH TAI KHOAN CAN TAO:")
    print("-" * 40)
    
    for i, account in enumerate(all_accounts, 1):
        print(f"{i}. {account['email']}")
        print(f"   Ten: {account['full_name']}")
        print(f"   Role: {account['role']}")
        print(f"   Mat khau: {account['password']}")
        print()
    
    print("=" * 60)
    print("HUONG DAN TAO TAI KHOAN:")
    print("=" * 60)
    
    print("\n1. CHAY SCRIPT SQL TRUOC:")
    print("   - Mo Supabase SQL Editor")
    print("   - Chay file: create_workshop_expense_objects.sql")
    print("   - De tao doi tuong chi phi xuong")
    
    print("\n2. TAO TAI KHOAN AUTH:")
    print("   - Vao Supabase Dashboard")
    print("   - Vao Authentication > Users")
    print("   - Click 'Add user'")
    print("   - Nhap thong tin tai khoan")
    
    print("\n3. TAO USER RECORDS:")
    print("   - Vao Supabase SQL Editor")
    print("   - Chay script SQL sau:")
    
    print("\n-- TAO USERS")
    for account in all_accounts:
        print(f"INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at)")
        print(f"VALUES (gen_random_uuid(), '{account['email']}', '{account['full_name']}', '{account['role']}', true, now(), now());")
    
    print("\n-- TAO EMPLOYEES")
    for account in all_accounts:
        print(f"INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at)")
        first_name = account['full_name'].split()[-1]
        last_name = " ".join(account['full_name'].split()[:-1])
        print(f"VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = '{account['email']}'), '{account['employee_code']}', '{first_name}', '{last_name}', '{account['email']}', '0123456789', '2024-01-01', 'active', now(), now());")
    
    print("\n" + "=" * 60)
    print("THONG TIN DANG NHAP:")
    print("=" * 60)
    
    print("\nTAI KHOAN NHAN VIEN XUONG:")
    print("Email: xuong.quandoc@company.com")
    print("Mat khau: 123456")
    print("Role: workshop_employee")
    print("Quyen: Chi thay doi tuong chi phi xuong")
    
    print("\nTAI KHOAN NHAN CONG:")
    print("Email: nhan.cong1@company.com")
    print("Mat khau: 123456")
    print("Role: worker")
    print("Quyen: Chi thay doi tuong chi phi nhan cong")
    
    print("\n" + "=" * 60)
    print("CAU TRUC DOI TUONG CHI PHI:")
    print("=" * 60)
    
    print("""
XUONG SAN XUAT (Root)
├── Nguyen vat lieu chinh
│   ├── Thep
│   └── Xi mang
├── Nguyen vat lieu phu
│   ├── Vit, oc
│   └── Keo dan
└── Nhan cong xuong

NHAN CONG (Root)
├── Nhan cong tho chinh
└── Nhan cong tho phu
""")
    
    print("\n" + "=" * 60)
    print("TICH HOP VAO FRONTEND:")
    print("=" * 60)
    
    print("""
1. Tao file: frontend/src/utils/expenseObjectPermissions.ts
2. Su dung trong component CreateExpenseDialog
3. Loc doi tuong chi phi theo role
4. Hien thi tong chi phi con trong bao cao
""")
    
    print("\nLUU Y:")
    print("- Tat ca tai khoan co mat khau mac dinh: 123456")
    print("- Vui long thay doi mat khau sau khi dang nhap lan dau")
    print("- Nhan vien xuong chi thay doi tuong chi phi xuong")
    print("- Nhan cong chi thay doi tuong chi phi nhan cong")
    print("- Tong chi phi con duoc tinh tu dong boi database triggers")

if __name__ == "__main__":
    create_workshop_accounts_simple()
