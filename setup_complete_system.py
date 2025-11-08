"""
Script tổng hợp để thiết lập hệ thống hoàn chỉnh
Tạo tài khoản, departments, positions, employees
"""

import os
import asyncio
import uuid
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def setup_complete_system():
    """Thiết lập hệ thống hoàn chỉnh"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("🚀 Bắt đầu thiết lập hệ thống hoàn chỉnh...")
    
    # 1. Tạo Departments
    print("\n📁 Tạo Departments...")
    departments = [
        {"id": "dept-001", "name": "Quản lý", "code": "MGMT", "description": "Phòng Quản lý và Điều hành"},
        {"id": "dept-002", "name": "Kế toán", "code": "ACCT", "description": "Phòng Kế toán và Tài chính"},
        {"id": "dept-003", "name": "Kinh doanh", "code": "SALES", "description": "Phòng Kinh doanh và Marketing"},
        {"id": "dept-004", "name": "Công nghệ", "code": "IT", "description": "Phòng Công nghệ thông tin"},
        {"id": "dept-005", "name": "Vận hành", "code": "OPS", "description": "Phòng Vận hành và Logistics"},
        {"id": "dept-006", "name": "Xưởng sản xuất", "code": "WORKSHOP", "description": "Xưởng sản xuất và Chế tạo"},
        {"id": "dept-007", "name": "Vận chuyển", "code": "TRANSPORT", "description": "Phòng Vận chuyển và Giao hàng"}
    ]
    
    for dept in departments:
        try:
            dept_data = {
                "id": dept["id"],
                "name": dept["name"],
                "code": dept["code"],
                "description": dept["description"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("departments").insert(dept_data).execute()
            print(f"✅ Tạo department: {dept['name']}")
        except Exception as e:
            print(f"❌ Lỗi tạo department {dept['name']}: {str(e)}")
    
    # 2. Tạo Positions
    print("\n👔 Tạo Positions...")
    positions = [
        # Quản lý
        {"id": "pos-001", "name": "Giám đốc", "code": "POS-MGMT-001", "department_id": "dept-001", "salary_min": 50000000, "salary_max": 80000000},
        {"id": "pos-002", "name": "Phó giám đốc", "code": "POS-MGMT-002", "department_id": "dept-001", "salary_min": 40000000, "salary_max": 60000000},
        
        # Kế toán
        {"id": "pos-003", "name": "Kế toán trưởng", "code": "POS-ACCT-001", "department_id": "dept-002", "salary_min": 25000000, "salary_max": 40000000},
        {"id": "pos-004", "name": "Kế toán viên", "code": "POS-ACCT-002", "department_id": "dept-002", "salary_min": 15000000, "salary_max": 25000000},
        
        # Kinh doanh
        {"id": "pos-005", "name": "Trưởng phòng kinh doanh", "code": "POS-SALES-001", "department_id": "dept-003", "salary_min": 30000000, "salary_max": 50000000},
        {"id": "pos-006", "name": "Nhân viên kinh doanh", "code": "POS-SALES-002", "department_id": "dept-003", "salary_min": 12000000, "salary_max": 20000000},
        
        # Công nghệ
        {"id": "pos-007", "name": "Trưởng phòng IT", "code": "POS-IT-001", "department_id": "dept-004", "salary_min": 35000000, "salary_max": 55000000},
        {"id": "pos-008", "name": "Lập trình viên", "code": "POS-IT-002", "department_id": "dept-004", "salary_min": 20000000, "salary_max": 35000000},
        
        # Vận hành
        {"id": "pos-009", "name": "Trưởng phòng vận hành", "code": "POS-OPS-001", "department_id": "dept-005", "salary_min": 25000000, "salary_max": 40000000},
        {"id": "pos-010", "name": "Nhân viên vận hành", "code": "POS-OPS-002", "department_id": "dept-005", "salary_min": 10000000, "salary_max": 18000000},
        
        # Xưởng sản xuất
        {"id": "pos-011", "name": "Quản đốc xưởng", "code": "POS-WORKSHOP-001", "department_id": "dept-006", "salary_min": 20000000, "salary_max": 30000000},
        {"id": "pos-012", "name": "Công nhân xưởng", "code": "POS-WORKSHOP-002", "department_id": "dept-006", "salary_min": 8000000, "salary_max": 15000000},
        
        # Vận chuyển
        {"id": "pos-013", "name": "Trưởng phòng vận chuyển", "code": "POS-TRANSPORT-001", "department_id": "dept-007", "salary_min": 18000000, "salary_max": 28000000},
        {"id": "pos-014", "name": "Tài xế", "code": "POS-TRANSPORT-002", "department_id": "dept-007", "salary_min": 10000000, "salary_max": 18000000}
    ]
    
    for pos in positions:
        try:
            pos_data = {
                "id": pos["id"],
                "name": pos["name"],
                "code": pos["code"],
                "description": f"Chức vụ {pos['name']}",
                "department_id": pos["department_id"],
                "salary_range_min": pos["salary_min"],
                "salary_range_max": pos["salary_max"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("positions").insert(pos_data).execute()
            print(f"✅ Tạo position: {pos['name']}")
        except Exception as e:
            print(f"❌ Lỗi tạo position {pos['name']}: {str(e)}")
    
    # 3. Tạo Users và Auth Accounts
    print("\n👤 Tạo Users và Auth Accounts...")
    users_data = [
        # ADMIN
        {"id": "user-admin-001", "email": "admin@company.com", "full_name": "Nguyễn Văn Admin", "role": "admin"},
        
        # ACCOUNTANT
        {"id": "user-acc-001", "email": "ketoan.truong@company.com", "full_name": "Trần Thị Kế Toán", "role": "accountant"},
        {"id": "user-acc-002", "email": "ketoan.vien@company.com", "full_name": "Lê Văn Kế Toán", "role": "accountant"},
        
        # SALES
        {"id": "user-sales-001", "email": "kinhdoanh.truong@company.com", "full_name": "Phạm Văn Kinh Doanh", "role": "sales"},
        {"id": "user-sales-002", "email": "kinhdoanh.vien@company.com", "full_name": "Hoàng Thị Kinh Doanh", "role": "sales"},
        
        # WORKSHOP_EMPLOYEE
        {"id": "user-workshop-001", "email": "xuong.quandoc@company.com", "full_name": "Võ Văn Quản Đốc", "role": "workshop_employee"},
        {"id": "user-workshop-002", "email": "xuong.congnhan@company.com", "full_name": "Đặng Thị Công Nhân", "role": "workshop_employee"},
        
        # EMPLOYEE
        {"id": "user-emp-001", "email": "nhanvien.it@company.com", "full_name": "Bùi Văn IT", "role": "employee"},
        {"id": "user-emp-002", "email": "nhanvien.vanhanh@company.com", "full_name": "Ngô Thị Vận Hành", "role": "employee"},
        
        # WORKER
        {"id": "user-worker-001", "email": "congnhan.001@company.com", "full_name": "Lý Văn Công Nhân", "role": "worker"},
        {"id": "user-worker-002", "email": "congnhan.002@company.com", "full_name": "Vũ Thị Công Nhân", "role": "worker"},
        
        # TRANSPORT
        {"id": "user-trans-001", "email": "taixe.001@company.com", "full_name": "Trịnh Văn Tài Xế", "role": "transport"},
        {"id": "user-trans-002", "email": "taixe.002@company.com", "full_name": "Phan Thị Tài Xế", "role": "transport"},
        
        # CUSTOMER
        {"id": "user-cust-001", "email": "khachhang.001@company.com", "full_name": "Công ty ABC", "role": "customer"},
        {"id": "user-cust-002", "email": "khachhang.002@company.com", "full_name": "Công ty XYZ", "role": "customer"}
    ]
    
    for user in users_data:
        try:
            # Tạo auth account
            auth_response = supabase.auth.admin.create_user({
                "email": user["email"],
                "password": "123456",
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user["full_name"],
                    "role": user["role"]
                }
            })
            
            if auth_response.user:
                # Tạo user record
                user_data = {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                supabase.table("users").insert(user_data).execute()
                print(f"✅ Tạo user: {user['email']} ({user['role']})")
            else:
                print(f"❌ Lỗi tạo auth account: {user['email']}")
                
        except Exception as e:
            print(f"❌ Lỗi tạo user {user['email']}: {str(e)}")
    
    # 4. Tạo Employees
    print("\n👥 Tạo Employees...")
    employees_data = [
        # ADMIN
        {"id": "emp-001", "user_id": "user-admin-001", "employee_code": "EMP001", "first_name": "Nguyễn Văn", "last_name": "Admin", "email": "admin@company.com", "phone": "0901000001", "department_id": "dept-001", "position_id": "pos-001", "salary": 60000000},
        
        # ACCOUNTANT
        {"id": "emp-002", "user_id": "user-acc-001", "employee_code": "EMP002", "first_name": "Trần Thị", "last_name": "Kế Toán", "email": "ketoan.truong@company.com", "phone": "0901000002", "department_id": "dept-002", "position_id": "pos-003", "salary": 30000000},
        {"id": "emp-003", "user_id": "user-acc-002", "employee_code": "EMP003", "first_name": "Lê Văn", "last_name": "Kế Toán", "email": "ketoan.vien@company.com", "phone": "0901000003", "department_id": "dept-002", "position_id": "pos-004", "salary": 20000000},
        
        # SALES
        {"id": "emp-004", "user_id": "user-sales-001", "employee_code": "EMP004", "first_name": "Phạm Văn", "last_name": "Kinh Doanh", "email": "kinhdoanh.truong@company.com", "phone": "0901000004", "department_id": "dept-003", "position_id": "pos-005", "salary": 35000000},
        {"id": "emp-005", "user_id": "user-sales-002", "employee_code": "EMP005", "first_name": "Hoàng Thị", "last_name": "Kinh Doanh", "email": "kinhdoanh.vien@company.com", "phone": "0901000005", "department_id": "dept-003", "position_id": "pos-006", "salary": 15000000},
        
        # WORKSHOP_EMPLOYEE
        {"id": "emp-006", "user_id": "user-workshop-001", "employee_code": "EMP006", "first_name": "Võ Văn", "last_name": "Quản Đốc", "email": "xuong.quandoc@company.com", "phone": "0901000006", "department_id": "dept-006", "position_id": "pos-011", "salary": 25000000},
        {"id": "emp-007", "user_id": "user-workshop-002", "employee_code": "EMP007", "first_name": "Đặng Thị", "last_name": "Công Nhân", "email": "xuong.congnhan@company.com", "phone": "0901000007", "department_id": "dept-006", "position_id": "pos-012", "salary": 12000000},
        
        # EMPLOYEE
        {"id": "emp-008", "user_id": "user-emp-001", "employee_code": "EMP008", "first_name": "Bùi Văn", "last_name": "IT", "email": "nhanvien.it@company.com", "phone": "0901000008", "department_id": "dept-004", "position_id": "pos-008", "salary": 25000000},
        {"id": "emp-009", "user_id": "user-emp-002", "employee_code": "EMP009", "first_name": "Ngô Thị", "last_name": "Vận Hành", "email": "nhanvien.vanhanh@company.com", "phone": "0901000009", "department_id": "dept-005", "position_id": "pos-010", "salary": 14000000},
        
        # WORKER
        {"id": "emp-010", "user_id": "user-worker-001", "employee_code": "EMP010", "first_name": "Lý Văn", "last_name": "Công Nhân", "email": "congnhan.001@company.com", "phone": "0901000010", "department_id": "dept-006", "position_id": "pos-012", "salary": 10000000},
        {"id": "emp-011", "user_id": "user-worker-002", "employee_code": "EMP011", "first_name": "Vũ Thị", "last_name": "Công Nhân", "email": "congnhan.002@company.com", "phone": "0901000011", "department_id": "dept-006", "position_id": "pos-012", "salary": 10000000},
        
        # TRANSPORT
        {"id": "emp-012", "user_id": "user-trans-001", "employee_code": "EMP012", "first_name": "Trịnh Văn", "last_name": "Tài Xế", "email": "taixe.001@company.com", "phone": "0901000012", "department_id": "dept-007", "position_id": "pos-014", "salary": 12000000},
        {"id": "emp-013", "user_id": "user-trans-002", "employee_code": "EMP013", "first_name": "Phan Thị", "last_name": "Tài Xế", "email": "taixe.002@company.com", "phone": "0901000013", "department_id": "dept-007", "position_id": "pos-014", "salary": 12000000}
    ]
    
    for emp in employees_data:
        try:
            emp_data = {
                "id": emp["id"],
                "user_id": emp["user_id"],
                "employee_code": emp["employee_code"],
                "first_name": emp["first_name"],
                "last_name": emp["last_name"],
                "email": emp["email"],
                "phone": emp["phone"],
                "department_id": emp["department_id"],
                "position_id": emp["position_id"],
                "hire_date": "2024-01-01",
                "salary": emp["salary"],
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("employees").insert(emp_data).execute()
            print(f"✅ Tạo employee: {emp['employee_code']} - {emp['first_name']} {emp['last_name']}")
        except Exception as e:
            print(f"❌ Lỗi tạo employee {emp['employee_code']}: {str(e)}")
    
    print(f"\n🎉 Hoàn thành thiết lập hệ thống!")
    print(f"\n📋 Tóm tắt:")
    print(f"📁 Departments: {len(departments)}")
    print(f"👔 Positions: {len(positions)}")
    print(f"👤 Users: {len(users_data)}")
    print(f"👥 Employees: {len(employees_data)}")
    
    print(f"\n🔐 Thông tin đăng nhập:")
    print(f"📧 Email: admin@company.com")
    print(f"🔑 Mật khẩu: 123456")
    print(f"👤 Role: admin")
    
    print(f"\n⚠️ Lưu ý:")
    print(f"- Tất cả tài khoản có mật khẩu mặc định: 123456")
    print(f"- Vui lòng thay đổi mật khẩu sau khi đăng nhập lần đầu")
    print(f"- Hệ thống đã sẵn sàng sử dụng với đầy đủ phân quyền")

if __name__ == "__main__":
    setup_complete_system()
