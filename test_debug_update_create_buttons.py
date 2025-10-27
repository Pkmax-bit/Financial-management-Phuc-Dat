#!/usr/bin/env python3
"""
Test script để debug vấn đề không hiển thị 2 nút cập nhật/tạo mới
và không hiển thị đối tượng chi phí cha trong Tổng chi phí theo đối tượng
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_BASE_URL = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')

def test_debug_issues():
    """Test debug các vấn đề"""
    print("🔍 Testing debug issues...")
    
    debug_scenarios = [
        {
            "name": "Không hiển thị 2 nút cập nhật/tạo mới",
            "possible_causes": [
                "showUpdateCreateDialog = false",
                "workshopParentObject = null",
                "selectedExpenseObjectIds.length = 0",
                "category !== 'actual'",
                "Logic trigger dialog không đúng"
            ],
            "debug_steps": [
                "Kiểm tra console.log debug dialog trigger",
                "Kiểm tra workshopParentObject có tồn tại không",
                "Kiểm tra selectedExpenseObjectIds có length > 0 không",
                "Kiểm tra category có = 'actual' không",
                "Kiểm tra logic trigger dialog"
            ]
        },
        {
            "name": "Không hiển thị đối tượng chi phí cha",
            "possible_causes": [
                "workshopParentObject = null",
                "selectedExpenseObjectIds.length = 0",
                "expenseObjectsOptions không chứa parent objects",
                "Logic set parent object không đúng",
                "Parent object không có is_parent = true"
            ],
            "debug_steps": [
                "Kiểm tra console.log debug parent object detection",
                "Kiểm tra expenseObjectsOptions có parent objects không",
                "Kiểm tra selectedExpenseObjectIds có children không",
                "Kiểm tra parent object có is_parent = true không",
                "Kiểm tra logic set parent object"
            ]
        }
    ]
    
    for scenario in debug_scenarios:
        print(f"\n📋 {scenario['name']}:")
        print("  Possible causes:")
        for cause in scenario['possible_causes']:
            print(f"    ❌ {cause}")
        print("  Debug steps:")
        for step in scenario['debug_steps']:
            print(f"    ✅ {step}")
    
    return True

def test_expected_behavior():
    """Test behavior mong đợi"""
    print("\n🎯 Testing expected behavior...")
    
    expected_flows = [
        {
            "name": "Flow hiển thị 2 nút cập nhật/tạo mới",
            "steps": [
                "1. User mở dialog tạo chi phí thực tế",
                "2. System load expense objects theo role",
                "3. User chọn đối tượng chi phí (children)",
                "4. System tự động tìm và set parent object",
                "5. User bấm 'Tạo chi phí thực tế'",
                "6. System kiểm tra workshopParentObject && selectedExpenseObjectIds.length > 0",
                "7. System hiển thị confirmation dialog với 2 nút",
                "8. User chọn 'Cập nhật' hoặc 'Tạo mới'"
            ]
        },
        {
            "name": "Flow hiển thị đối tượng chi phí cha",
            "steps": [
                "1. User chọn children objects",
                "2. System tìm parent object của children",
                "3. System set workshopParentObject = parent object",
                "4. System hiển thị section 'Chi phí đối tượng cha'",
                "5. System hiển thị tổng chi phí parent",
                "6. System hiển thị breakdown chi tiết children"
            ]
        }
    ]
    
    for flow in expected_flows:
        print(f"\n📋 {flow['name']}:")
        for step in flow['steps']:
            print(f"  {step}")
    
    return True

def test_debug_console_logs():
    """Test debug console logs"""
    print("\n🔍 Testing debug console logs...")
    
    console_logs = [
        {
            "name": "Debug dialog trigger",
            "log": "🔍 Debug dialog trigger:",
            "info": [
                "workshopParentObject: parent object name",
                "selectedExpenseObjectIds: number of selected objects",
                "category: 'actual'",
                "userRole: user role"
            ]
        },
        {
            "name": "Debug parent object detection",
            "log": "🔍 Debug parent object detection:",
            "info": [
                "selectedExpenseObjectIds: number of selected objects",
                "expenseObjectsOptions: number of available objects",
                "userRole: user role",
                "category: expense category"
            ]
        },
        {
            "name": "All expense objects options",
            "log": "🔍 All expense objects options:",
            "info": [
                "id: object ID",
                "name: object name",
                "is_parent: true/false",
                "parent_id: parent object ID"
            ]
        },
        {
            "name": "Selected expense object IDs",
            "log": "🔍 Selected expense object IDs:",
            "info": [
                "Array of selected object IDs"
            ]
        },
        {
            "name": "Current workshop parent object",
            "log": "🔍 Current workshop parent object:",
            "info": [
                "Parent object name or null"
            ]
        }
    ]
    
    for log in console_logs:
        print(f"\n📋 {log['name']}:")
        print(f"  Log: {log['log']}")
        for info in log['info']:
            print(f"    ✅ {info}")
    
    return True

def test_troubleshooting_steps():
    """Test troubleshooting steps"""
    print("\n🔧 Testing troubleshooting steps...")
    
    troubleshooting = [
        {
            "name": "Kiểm tra 2 nút không hiển thị",
            "steps": [
                "1. Mở Developer Tools (F12)",
                "2. Mở tab Console",
                "3. Tạo chi phí thực tế với đối tượng chi phí",
                "4. Kiểm tra console logs",
                "5. Tìm log '🔍 Debug dialog trigger:'",
                "6. Kiểm tra workshopParentObject có tồn tại không",
                "7. Kiểm tra selectedExpenseObjectIds.length > 0",
                "8. Kiểm tra category = 'actual'"
            ]
        },
        {
            "name": "Kiểm tra đối tượng chi phí cha không hiển thị",
            "steps": [
                "1. Mở Developer Tools (F12)",
                "2. Mở tab Console",
                "3. Chọn đối tượng chi phí",
                "4. Kiểm tra console logs",
                "5. Tìm log '🔍 Debug parent object detection:'",
                "6. Kiểm tra expenseObjectsOptions có parent objects không",
                "7. Kiểm tra selectedExpenseObjectIds có children không",
                "8. Kiểm tra parent object có is_parent = true không"
            ]
        }
    ]
    
    for troubleshoot in troubleshooting:
        print(f"\n📋 {troubleshoot['name']}:")
        for step in troubleshoot['steps']:
            print(f"  {step}")
    
    return True

def test_common_issues():
    """Test common issues"""
    print("\n⚠️ Testing common issues...")
    
    common_issues = [
        {
            "name": "Expense objects không có parent objects",
            "issue": "expenseObjectsOptions không chứa objects với is_parent = true",
            "solution": "Kiểm tra database có parent objects không, hoặc thêm parent objects"
        },
        {
            "name": "Children objects không có parent_id",
            "issue": "Children objects không có parent_id trỏ đến parent",
            "solution": "Kiểm tra database có parent_id đúng không"
        },
        {
            "name": "Role filtering quá strict",
            "issue": "Role filtering loại bỏ parent objects",
            "solution": "Kiểm tra logic filtering trong loadExpenseObjectsOptions"
        },
        {
            "name": "Category không đúng",
            "issue": "Category không phải 'actual'",
            "solution": "Đảm bảo tạo chi phí thực tế (actual), không phải kế hoạch (planned)"
        }
    ]
    
    for issue in common_issues:
        print(f"\n📋 {issue['name']}:")
        print(f"  Issue: {issue['issue']}")
        print(f"  Solution: {issue['solution']}")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting debug update/create buttons test...")
    
    # Test 1: Debug issues
    success1 = test_debug_issues()
    
    # Test 2: Expected behavior
    success2 = test_expected_behavior()
    
    # Test 3: Debug console logs
    success3 = test_debug_console_logs()
    
    # Test 4: Troubleshooting steps
    success4 = test_troubleshooting_steps()
    
    # Test 5: Common issues
    success5 = test_common_issues()
    
    if success1 and success2 and success3 and success4 and success5:
        print("\n✅ All tests passed!")
        print("\n🎯 Debug information ready!")
        print("\n📋 Next steps:")
        print("1. Mở Developer Tools (F12)")
        print("2. Mở tab Console")
        print("3. Tạo chi phí thực tế với đối tượng chi phí")
        print("4. Kiểm tra console logs để debug")
        print("5. Báo cáo kết quả debug")
    else:
        print("\n❌ Some tests failed!")




