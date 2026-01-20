#!/usr/bin/env python3
"""
Script để thiết lập mapping giữa trạng thái checklist và người chịu trách nhiệm

Sử dụng:
    python scripts/setup_checklist_status_mapping.py

Hoặc với các tham số:
    python scripts/setup_checklist_status_mapping.py --employee-1-id <id> --employee-2-id <id> --employee-3-id <id> --employee-4-id <id>
"""

import os
import sys
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapping mặc định theo yêu cầu
DEFAULT_STATUS_MAPPING = {
    "THỎA THUẬN": {
        "employee_number": 1,
        "description": "Người phụ trách giai đoạn kế hoạch"
    },
    "XƯỞNG SẢN XUẤT": {
        "employee_number": 2,
        "description": "Người phụ trách giai đoạn sản xuất"
    },
    "VẬN CHUYỂN": {
        "employee_number": 3,
        "description": "Người phụ trách giai đoạn vận chuyển"
    },
    "LẮP ĐẶT": {
        "employee_number": 3,
        "description": "Người phụ trách giai đoạn lắp đặt"
    },
    "CHĂM SÓC KHÁCH HÀNG": {
        "employee_number": 4,
        "description": "Người phụ trách chăm sóc khách hàng"
    },
    "BÁO CÁO / SỬA CHỮA": {
        "employee_number": 4,
        "description": "Người phụ trách báo cáo và sửa chữa"
    },
    "HOÀN THÀNH": {
        "employee_number": 4,
        "description": "Người phụ trách nghiệm thu và tính lương"
    }
}


def get_employee_by_number(employee_number: int):
    """Lấy thông tin employee theo số thứ tự"""
    try:
        # Giả sử có một cách để xác định employee theo số thứ tự
        # Có thể dựa vào position, department, hoặc một trường khác
        # Ở đây ta sẽ list tất cả employees và để user chọn
        
        result = supabase.table("employees").select("id, first_name, last_name, full_name, position").execute()
        
        if not result.data:
            return None
        
        print(f"\n📋 Danh sách nhân viên:")
        for idx, emp in enumerate(result.data, 1):
            name = emp.get('full_name') or f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            position = emp.get('position', 'N/A')
            print(f"  {idx}. {name} ({position}) - ID: {emp['id']}")
        
        # Nếu employee_number được chỉ định, tìm theo index
        if 1 <= employee_number <= len(result.data):
            return result.data[employee_number - 1]
        
        return None
    except Exception as e:
        print(f"❌ Error getting employees: {e}")
        return None


def setup_mapping(employee_ids: dict = None):
    """Thiết lập mapping giữa trạng thái và người chịu trách nhiệm"""
    
    print("🚀 Bắt đầu thiết lập mapping trạng thái → người chịu trách nhiệm\n")
    
    # Nếu không có employee_ids, cần lấy từ user
    if not employee_ids:
        employee_ids = {}
        for status, info in DEFAULT_STATUS_MAPPING.items():
            emp_num = info["employee_number"]
            if emp_num not in employee_ids:
                print(f"\n👤 Chọn nhân viên phụ trách số {emp_num}:")
                emp = get_employee_by_number(emp_num)
                if emp:
                    employee_ids[emp_num] = emp["id"]
                    print(f"✅ Đã chọn: {emp.get('full_name') or f\"{emp.get('first_name', '')} {emp.get('last_name', '')}\"}")
                else:
                    print(f"⚠️  Không tìm thấy nhân viên số {emp_num}")
                    # Cho phép nhập ID trực tiếp
                    emp_id = input(f"   Nhập employee_id cho người phụ trách số {emp_num}: ").strip()
                    if emp_id:
                        employee_ids[emp_num] = emp_id
    
    # Tạo mapping
    created_count = 0
    updated_count = 0
    error_count = 0
    
    for status, info in DEFAULT_STATUS_MAPPING.items():
        emp_num = info["employee_number"]
        employee_id = employee_ids.get(emp_num)
        
        if not employee_id:
            print(f"⚠️  Bỏ qua {status}: Không có employee_id cho người phụ trách số {emp_num}")
            error_count += 1
            continue
        
        try:
            # Kiểm tra xem mapping đã tồn tại chưa
            existing = supabase.table("checklist_status_responsible_mapping").select("*").eq(
                "status", status
            ).eq("employee_id", employee_id).eq("responsibility_type", "accountable").execute()
            
            if existing.data:
                # Cập nhật nếu đã tồn tại
                result = supabase.table("checklist_status_responsible_mapping").update({
                    "is_active": True,
                    "updated_at": "now()"
                }).eq("id", existing.data[0]["id"]).execute()
                
                print(f"✅ Đã cập nhật: {status} → Employee {emp_num}")
                updated_count += 1
            else:
                # Tạo mới
                result = supabase.table("checklist_status_responsible_mapping").insert({
                    "status": status,
                    "employee_id": employee_id,
                    "responsibility_type": "accountable",
                    "is_active": True
                }).execute()
                
                print(f"✅ Đã tạo: {status} → Employee {emp_num}")
                created_count += 1
                
        except Exception as e:
            print(f"❌ Lỗi khi tạo mapping cho {status}: {e}")
            error_count += 1
    
    print(f"\n📊 Kết quả:")
    print(f"  ✅ Đã tạo: {created_count}")
    print(f"  🔄 Đã cập nhật: {updated_count}")
    print(f"  ❌ Lỗi: {error_count}")
    
    # Hiển thị tất cả mapping hiện tại
    print(f"\n📋 Tất cả mapping hiện tại:")
    try:
        all_mappings = supabase.table("checklist_status_responsible_mapping").select(
            "status, employee_id, employees(id, first_name, last_name, full_name), is_active"
        ).eq("is_active", True).execute()
        
        for mapping in all_mappings.data:
            status = mapping["status"]
            emp = mapping.get("employees")
            if isinstance(emp, list) and emp:
                emp = emp[0]
            name = emp.get('full_name') if emp else 'N/A'
            if not name and emp:
                name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            print(f"  • {status} → {name}")
    except Exception as e:
        print(f"⚠️  Không thể lấy danh sách mapping: {e}")


def list_current_mappings():
    """Liệt kê tất cả mapping hiện tại"""
    print("📋 Danh sách mapping hiện tại:\n")
    
    try:
        result = supabase.table("checklist_status_responsible_mapping").select(
            "id, status, employee_id, employees(id, first_name, last_name, full_name), responsibility_type, is_active, created_at"
        ).order("status").execute()
        
        if not result.data:
            print("  (Chưa có mapping nào)")
            return
        
        for mapping in result.data:
            status = mapping["status"]
            emp = mapping.get("employees")
            if isinstance(emp, list) and emp:
                emp = emp[0]
            name = emp.get('full_name') if emp else 'N/A'
            if not name and emp:
                name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            
            active = "✅" if mapping.get("is_active") else "❌"
            print(f"  {active} {status} → {name} ({mapping.get('responsibility_type', 'accountable')})")
            
    except Exception as e:
        print(f"❌ Error listing mappings: {e}")


def main():
    parser = argparse.ArgumentParser(description="Thiết lập mapping trạng thái checklist → người chịu trách nhiệm")
    parser.add_argument("--employee-1-id", help="Employee ID cho người phụ trách số 1")
    parser.add_argument("--employee-2-id", help="Employee ID cho người phụ trách số 2")
    parser.add_argument("--employee-3-id", help="Employee ID cho người phụ trách số 3")
    parser.add_argument("--employee-4-id", help="Employee ID cho người phụ trách số 4")
    parser.add_argument("--list", action="store_true", help="Chỉ liệt kê mapping hiện tại")
    
    args = parser.parse_args()
    
    if args.list:
        list_current_mappings()
        return
    
    employee_ids = {}
    if args.employee_1_id:
        employee_ids[1] = args.employee_1_id
    if args.employee_2_id:
        employee_ids[2] = args.employee_2_id
    if args.employee_3_id:
        employee_ids[3] = args.employee_3_id
    if args.employee_4_id:
        employee_ids[4] = args.employee_4_id
    
    setup_mapping(employee_ids if employee_ids else None)


if __name__ == "__main__":
    main()
