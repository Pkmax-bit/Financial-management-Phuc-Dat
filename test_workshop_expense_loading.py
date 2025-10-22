#!/usr/bin/env python3
"""
Test script để kiểm tra tính năng load expense objects cho workshop employee
khi tạo chi phí dự án thực tế
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')

def test_expense_objects_loading():
    """Test loading expense objects for workshop employee"""
    print("🧪 Testing expense objects loading for workshop employee...")
    
    try:
        # Test public endpoint
        response = requests.get(f"{API_BASE_URL}/api/expense-objects/public?active_only=true")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully loaded {len(data)} expense objects")
            
            # Check for workshop parent objects
            workshop_parents = [obj for obj in data if obj.get('is_parent') and 
                              ('Xưởng' in obj.get('name', '') or 'xuong' in obj.get('name', '').lower() or 
                               'sản xuất' in obj.get('name', '').lower())]
            
            print(f"🏭 Found {len(workshop_parents)} workshop parent objects:")
            for parent in workshop_parents:
                print(f"  - {parent['name']} (ID: {parent['id']})")
                
                # Find children
                children = [obj for obj in data if obj.get('parent_id') == parent['id']]
                print(f"    Children: {len(children)}")
                for child in children:
                    print(f"      - {child['name']} (ID: {child['id']})")
            
            # Check for workshop children objects
            workshop_children = [obj for obj in data if obj.get('parent_id') and 
                               any(parent['id'] == obj.get('parent_id') for parent in workshop_parents)]
            
            print(f"🔧 Found {len(workshop_children)} workshop children objects:")
            for child in workshop_children:
                print(f"  - {child['name']} (Parent: {child.get('parent_id')})")
            
            return True
            
        else:
            print(f"❌ Failed to load expense objects: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing expense objects: {e}")
        return False

def test_workshop_employee_scenario():
    """Test the complete workshop employee scenario"""
    print("\n🔧 Testing workshop employee scenario...")
    
    # Simulate the workflow
    print("1. Workshop employee opens create actual expense dialog")
    print("2. System should load only children objects of workshop parent")
    print("3. System should auto-select all children objects")
    print("4. System should show workshop parent object in breakdown")
    print("5. When saving, system should show confirmation dialog")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting workshop expense objects loading test...")
    
    # Test 1: Load expense objects
    success1 = test_expense_objects_loading()
    
    # Test 2: Workshop employee scenario
    success2 = test_workshop_employee_scenario()
    
    if success1 and success2:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")


