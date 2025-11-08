#!/usr/bin/env python3
"""
Script test lấy tên nhân viên "Kĩ Thuật Phụ Trách" từ danh sách báo giá
Test logic: created_by -> employees -> users
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from services.supabase_client import get_supabase_client

def test_get_employee_name_from_quote():
    """Test lấy tên nhân viên từ quote"""
    print("=" * 80)
    print("TEST: Lấy tên nhân viên 'Kĩ Thuật Phụ Trách' từ danh sách báo giá")
    print("=" * 80)
    print()
    
    supabase = get_supabase_client()
    
    # Lấy một quote để test
    print("1. Lấy danh sách quotes...")
    quotes_result = supabase.table("quotes").select("id, quote_number, created_by, employee_in_charge_id").limit(5).execute()
    
    if not quotes_result.data:
        print("❌ Không tìm thấy quote nào!")
        return
    
    print(f"✅ Tìm thấy {len(quotes_result.data)} quotes")
    print()
    
    # Test với từng quote
    for idx, quote in enumerate(quotes_result.data, 1):
        print(f"{'=' * 80}")
        print(f"Quote {idx}: {quote.get('quote_number', 'N/A')}")
        print(f"{'=' * 80}")
        print(f"  ID: {quote.get('id')}")
        print(f"  created_by: {quote.get('created_by')}")
        print(f"  employee_in_charge_id: {quote.get('employee_in_charge_id')}")
        print()
        
        # Lấy emp_id (ưu tiên employee_in_charge_id, fallback created_by)
        emp_id = quote.get("employee_in_charge_id") or quote.get("created_by")
        
        if not emp_id:
            print("  ⚠️ Không có employee_in_charge_id hoặc created_by")
            print()
            continue
        
        print(f"  📍 Sử dụng emp_id: {emp_id}")
        print()
        
        # Step 1: Lấy employee info
        print("  Bước 1: Lấy thông tin từ bảng employees...")
        try:
            emp_res = supabase.table("employees").select("id, user_id, first_name, last_name, phone").eq("id", emp_id).single().execute()
            
            if not emp_res.data:
                print(f"  ❌ Không tìm thấy employee với id: {emp_id}")
                print()
                continue
            
            emp = emp_res.data
            print(f"  ✅ Tìm thấy employee:")
            print(f"     - first_name: {emp.get('first_name')}")
            print(f"     - last_name: {emp.get('last_name')}")
            print(f"     - user_id: {emp.get('user_id')}")
            print(f"     - phone: {emp.get('phone')}")
            print()
            
            # Candidate name from employees (first_name + last_name)
            candidate_name = f"{emp.get('first_name','')} {emp.get('last_name','')}".strip()
            print(f"  📝 Tên từ employees: {candidate_name}")
            print()
            
            # Step 2: Lấy từ users table nếu có user_id
            user_id = emp.get("user_id")
            employee_name = None
            
            if user_id:
                print(f"  Bước 2: Lấy thông tin từ bảng users (user_id: {user_id})...")
                try:
                    user_res = supabase.table("users").select("full_name").eq("id", user_id).single().execute()
                    
                    if user_res.data and user_res.data.get("full_name"):
                        employee_name = user_res.data.get("full_name")
                        print(f"  ✅ Tìm thấy user:")
                        print(f"     - full_name: {employee_name}")
                        print()
                    else:
                        print(f"  ⚠️ Không tìm thấy full_name trong users, sử dụng tên từ employees")
                        employee_name = candidate_name
                        print()
                except Exception as e:
                    print(f"  ⚠️ Lỗi khi lấy từ users: {e}")
                    employee_name = candidate_name
                    print()
            else:
                print(f"  ⚠️ Employee không có user_id, sử dụng tên từ employees")
                employee_name = candidate_name
                print()
            
            # Kết quả
            print(f"  {'=' * 76}")
            print(f"  🎯 KẾT QUẢ: Kĩ Thuật Phụ Trách = {employee_name or '—'}")
            print(f"  {'=' * 76}")
            print()
            
        except Exception as e:
            print(f"  ❌ Lỗi: {e}")
            import traceback
            traceback.print_exc()
            print()
    
    print("=" * 80)
    print("✅ TEST HOÀN TẤT!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_get_employee_name_from_quote()
    except Exception as e:
        print(f"❌ Lỗi khi chạy test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

