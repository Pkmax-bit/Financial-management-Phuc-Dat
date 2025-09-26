#!/usr/bin/env python3
"""
Script to create test positions for different departments
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase_client
import uuid
from datetime import datetime

def create_test_positions():
    """Create test positions for departments"""
    supabase = get_supabase_client()
    
    # Get existing departments
    dept_result = supabase.table("departments").select("id, name, code").execute()
    if not dept_result.data:
        print("No departments found. Please create departments first.")
        return
    
    print("Available departments:")
    for dept in dept_result.data:
        print(f"- {dept['name']} ({dept['code']}) - {dept['id']}")
    
    # Test positions data
    test_positions = [
        {
            "name": "Trưởng phòng IT",
            "code": "ITMAN001", 
            "description": "Quản lý bộ phận công nghệ thông tin",
            "department_id": None,  # Will be set for IT dept
            "salary_range_min": 20000000,
            "salary_range_max": 30000000,
        },
        {
            "name": "Lập trình viên Senior",
            "code": "ITDEV002",
            "description": "Phát triển và bảo trì hệ thống phần mềm",
            "department_id": None,  # Will be set for IT dept
            "salary_range_min": 15000000,
            "salary_range_max": 25000000,
        },
        {
            "name": "Nhân viên kinh doanh",
            "code": "SALSTF001",
            "description": "Chăm sóc khách hàng và bán hàng",
            "department_id": None,  # Will be set for Sales dept
            "salary_range_min": 10000000,
            "salary_range_max": 20000000,
        },
        {
            "name": "Kế toán trưởng",
            "code": "ACCMAN001",
            "description": "Quản lý tài chính và kế toán",
            "department_id": None,  # Will be set for Accounting dept
            "salary_range_min": 18000000,
            "salary_range_max": 28000000,
        }
    ]
    
    # Find IT department ID
    it_dept = None
    for dept in dept_result.data:
        if dept['code'].upper() == 'IT' or 'IT' in dept['name'].upper():
            it_dept = dept
            break
    
    if it_dept:
        test_positions[0]["department_id"] = it_dept['id']
        test_positions[1]["department_id"] = it_dept['id']
        print(f"\nUsing IT department: {it_dept['name']} - {it_dept['id']}")
    
    # Check existing positions
    existing_result = supabase.table("positions").select("code").execute()
    existing_codes = [pos['code'] for pos in existing_result.data] if existing_result.data else []
    
    created_count = 0
    for pos_data in test_positions:
        if pos_data["code"] in existing_codes:
            print(f"Position {pos_data['code']} already exists, skipping...")
            continue
        
        # Add metadata
        pos_data["id"] = str(uuid.uuid4())
        pos_data["is_active"] = True
        pos_data["created_at"] = datetime.utcnow().isoformat()
        pos_data["updated_at"] = datetime.utcnow().isoformat()
        
        try:
            result = supabase.table("positions").insert(pos_data).execute()
            if result.data:
                created_count += 1
                print(f"✓ Created position: {pos_data['name']} ({pos_data['code']})")
            else:
                print(f"✗ Failed to create position: {pos_data['name']}")
        except Exception as e:
            print(f"✗ Error creating position {pos_data['name']}: {str(e)}")
    
    print(f"\nCreated {created_count} new positions")
    
    # Show all positions
    print("\nAll positions:")
    all_positions = supabase.table("positions").select("*").execute()
    if all_positions.data:
        for pos in all_positions.data:
            dept_name = "No Department"
            if pos.get('department_id'):
                for dept in dept_result.data:
                    if dept['id'] == pos['department_id']:
                        dept_name = dept['name']
                        break
            print(f"- {pos['name']} ({pos['code']}) - {dept_name}")
    
if __name__ == "__main__":
    create_test_positions()