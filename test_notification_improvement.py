#!/usr/bin/env python3
"""
Test script để kiểm tra cải thiện thông báo
"""

import os
import re

def test_notification_improvement():
    """Test cải thiện thông báo"""
    
    print("Testing Notification Improvement...")
    
    file_path = "frontend/src/components/expenses/CreateProjectExpenseDialog.tsx"
    
    if not os.path.exists(file_path):
        print("ERROR: File not found")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("File loaded successfully")
    
    # Test 1: Kiểm tra nền trong suốt
    print("\nTest 1: Checking transparent background...")
    
    transparent_patterns = [
        r"rgba\([^)]+,\s*0\.95\)",  # 95% opacity
        r"backdrop-filter:\s*blur\(10px\)",
        r"-webkit-backdrop-filter:\s*blur\(10px\)"
    ]
    
    for pattern in transparent_patterns:
        if re.search(pattern, content):
            print(f"OK: Transparent background pattern found: {pattern}")
        else:
            print(f"ERROR: Transparent background pattern missing: {pattern}")
    
    # Test 2: Kiểm tra màu chữ rõ ràng
    print("\nTest 2: Checking clear text color...")
    
    text_patterns = [
        r"color:\s*#ffffff",
        r"font-weight:\s*600",
        r"text-shadow:\s*0\s+1px\s+2px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)"
    ]
    
    for pattern in text_patterns:
        if re.search(pattern, content):
            print(f"OK: Clear text pattern found: {pattern}")
        else:
            print(f"ERROR: Clear text pattern missing: {pattern}")
    
    # Test 3: Kiểm tra animation cải thiện
    print("\nTest 3: Checking improved animation...")
    
    animation_patterns = [
        r"cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\)",
        r"scale\(0\.9\)",
        r"scale\(1\)",
        r"slideOutRight"
    ]
    
    for pattern in animation_patterns:
        if re.search(pattern, content):
            print(f"OK: Animation pattern found: {pattern}")
        else:
            print(f"ERROR: Animation pattern missing: {pattern}")
    
    # Test 4: Kiểm tra typography cải thiện
    print("\nTest 4: Checking improved typography...")
    
    typography_patterns = [
        r"font-size:\s*15px",
        r"line-height:\s*1\.6",
        r"max-width:\s*450px",
        r"padding:\s*20px\s+24px"
    ]
    
    for pattern in typography_patterns:
        if re.search(pattern, content):
            print(f"OK: Typography pattern found: {pattern}")
        else:
            print(f"ERROR: Typography pattern missing: {pattern}")
    
    # Test 5: Kiểm tra màu sắc cho từng loại
    print("\nTest 5: Checking color schemes...")
    
    color_schemes = [
        r"success.*rgba\(16,\s*185,\s*129,\s*0\.95\)",
        r"error.*rgba\(239,\s*68,\s*68,\s*0\.95\)",
        r"warning.*rgba\(245,\s*158,\s*11,\s*0\.95\)",
        r"info.*rgba\(59,\s*130,\s*246,\s*0\.95\)"
    ]
    
    for pattern in color_schemes:
        if re.search(pattern, content):
            print(f"OK: Color scheme found: {pattern}")
        else:
            print(f"ERROR: Color scheme missing: {pattern}")
    
    # Test 6: Kiểm tra thời gian hiển thị
    print("\nTest 6: Checking display duration...")
    
    duration_patterns = [
        r"6000",  # 6 seconds
        r"Auto-hiding notification after 6 seconds"
    ]
    
    for pattern in duration_patterns:
        if re.search(pattern, content):
            print(f"OK: Duration pattern found: {pattern}")
        else:
            print(f"ERROR: Duration pattern missing: {pattern}")
    
    # Test 7: Kiểm tra box shadow cải thiện
    print("\nTest 7: Checking improved box shadow...")
    
    shadow_patterns = [
        r"box-shadow:\s*0\s+20px\s+40px",
        r"0\s+0\s+0\s+1px"
    ]
    
    for pattern in shadow_patterns:
        if re.search(pattern, content):
            print(f"OK: Box shadow pattern found: {pattern}")
        else:
            print(f"ERROR: Box shadow pattern missing: {pattern}")
    
    # Test 8: Kiểm tra border radius
    print("\nTest 8: Checking border radius...")
    
    border_patterns = [
        r"border-radius:\s*16px",
        r"border:\s*2px\s+solid"
    ]
    
    for pattern in border_patterns:
        if re.search(pattern, content):
            print(f"OK: Border pattern found: {pattern}")
        else:
            print(f"ERROR: Border pattern missing: {pattern}")
    
    print("\nTest completed!")
    return True

if __name__ == "__main__":
    test_notification_improvement()
