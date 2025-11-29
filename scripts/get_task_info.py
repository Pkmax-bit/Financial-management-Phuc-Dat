#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để lấy thông tin nhóm, nhiệm vụ và thành viên
"""

import os
import sys
import io

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import from backend config
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
    from config import Settings
    USE_CONFIG = True
except:
    USE_CONFIG = False

def get_supabase_client() -> Client:
    """Tạo Supabase client"""
    if USE_CONFIG:
        url = Settings.SUPABASE_URL
        key = Settings.SUPABASE_SERVICE_KEY or Settings.SUPABASE_ANON_KEY
    else:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("[ERROR] Thieu SUPABASE_URL hoac SUPABASE_KEY")
        print("Dang thu load tu backend/config.py...")
        sys.exit(1)
    
    return create_client(url, key)

def get_task_info(supabase: Client, task_title: str = "test 7"):
    """Lấy thông tin nhiệm vụ và thành viên"""
    
    print(f"\n[DANG TIM] Dang tim nhiem vu: '{task_title}'...\n")
    
    # 1. Tìm nhiệm vụ
    task_result = supabase.table("tasks").select("""
        *,
        employees:assigned_to(id, first_name, last_name, email),
        task_groups:group_id(id, name, description)
    """).ilike("title", f"%{task_title}%").is_("deleted_at", "null").execute()
    
    if not task_result.data:
        print(f"[ERROR] Khong tim thay nhiem vu co ten chua '{task_title}'")
        return
    
    for task in task_result.data:
        print("=" * 80)
        print(f"[NHIEM VU] {task.get('title')}")
        print("=" * 80)
        print(f"ID: {task.get('id')}")
        print(f"Trạng thái: {task.get('status')}")
        print(f"Ưu tiên: {task.get('priority')}")
        print(f"Mô tả: {task.get('description') or 'Không có'}")
        
        # Thông tin assigned_to từ task
        employee = task.get("employees")
        if employee:
            assigned_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
            print(f"\n[NGUOI PHU TRACH] Tu task.assigned_to:")
            print(f"   - ID: {task.get('assigned_to')}")
            print(f"   - Ten: {assigned_name}")
            print(f"   - Email: {employee.get('email', 'N/A')}")
        else:
            print(f"\n[NGUOI PHU TRACH] Tu task.assigned_to: Khong co")
        
        # Thông tin nhóm
        group = task.get("task_groups")
        group_id = task.get("group_id")
        if group:
            print(f"\n[NHOM]:")
            print(f"   - ID: {group.get('id')}")
            print(f"   - Ten: {group.get('name')}")
            print(f"   - Mo ta: {group.get('description') or 'Khong co'}")
        elif group_id:
            print(f"\n[NHOM] Co group_id ({group_id}) nhung khong tim thay thong tin nhom")
        else:
            print(f"\n[NHOM] Khong co")
        
        task_id = task.get("id")
        
        # 2. Lấy assignments
        print(f"\n[ASSIGNMENTS] Tu task_assignments:")
        assignments_result = supabase.table("task_assignments").select("""
            *,
            employees:assigned_to(id, first_name, last_name, email),
            users:assigned_by(id, full_name)
        """).eq("task_id", task_id).execute()
        
        if assignments_result.data:
            print(f"   Tim thay {len(assignments_result.data)} assignment(s)")
            for i, assignment in enumerate(assignments_result.data, 1):
                print(f"\n   Assignment {i}:")
                print(f"      - Assignment ID: {assignment.get('id')}")
                print(f"      - Assigned To (Employee ID): {assignment.get('assigned_to')}")
                print(f"      - Status: {assignment.get('status')}")
                
                # Kiểm tra employees join
                emp = assignment.get("employees")
                if emp:
                    # Handle cả array và object
                    if isinstance(emp, list):
                        emp = emp[0] if emp else None
                    
                    if emp:
                        name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                        print(f"      - Ten: {name}")
                        print(f"      - Email: {emp.get('email', 'N/A')}")
                    else:
                        print(f"      - [WARNING] Employee join tra ve array rong")
                else:
                    print(f"      - [WARNING] Khong tim thay thong tin employee")
                    # Thử query trực tiếp
                    try:
                        emp_direct = supabase.table("employees").select("id, first_name, last_name, email").eq("id", assignment.get('assigned_to')).execute()
                        if emp_direct.data:
                            emp_data = emp_direct.data[0]
                            name = f"{emp_data.get('first_name', '')} {emp_data.get('last_name', '')}".strip()
                            print(f"      - [DIRECT QUERY] Ten: {name}")
                            print(f"      - [DIRECT QUERY] Email: {emp_data.get('email', 'N/A')}")
                        else:
                            print(f"      - [ERROR] Employee ID {assignment.get('assigned_to')} khong ton tai trong bang employees")
                    except Exception as e:
                        print(f"      - [ERROR] Loi khi query employee: {str(e)}")
        else:
            print("   [EMPTY] Khong co assignments")
        
        # 3. Lấy participants
        print(f"\n[PARTICIPANTS] Tu task_participants:")
        participants_result = supabase.table("task_participants").select("""
            *,
            employees:employee_id(id, first_name, last_name, email)
        """).eq("task_id", task_id).execute()
        
        if participants_result.data:
            for i, participant in enumerate(participants_result.data, 1):
                emp = participant.get("employees")
                if emp:
                    name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                    print(f"   {i}. {name} (ID: {participant.get('employee_id')})")
                    print(f"      - Email: {emp.get('email', 'N/A')}")
                    print(f"      - Vai tro: {participant.get('role')}")
                else:
                    print(f"   {i}. Employee ID: {participant.get('employee_id')} (Khong tim thay thong tin)")
        else:
            print("   [EMPTY] Khong co participants")
        
        # 4. Lấy group members (nếu có group_id)
        if group_id:
            print(f"\n[GROUP MEMBERS] Tu task_group_members:")
            group_members_result = supabase.table("task_group_members").select("""
                *,
                employees:employee_id(id, first_name, last_name, email)
            """).eq("group_id", group_id).execute()
            
            if group_members_result.data:
                for i, member in enumerate(group_members_result.data, 1):
                    emp = member.get("employees")
                    if emp:
                        name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                        print(f"   {i}. {name} (ID: {member.get('employee_id')})")
                        print(f"      - Email: {emp.get('email', 'N/A')}")
                    else:
                        print(f"   {i}. Employee ID: {member.get('employee_id')} (Khong tim thay thong tin)")
            else:
                print("   [EMPTY] Nhom khong co thanh vien")
        
        print("\n" + "=" * 80 + "\n")

def main():
    """Main function"""
    try:
        supabase = get_supabase_client()
        get_task_info(supabase, "test 7")
    except Exception as e:
        print(f"[ERROR] Loi: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

