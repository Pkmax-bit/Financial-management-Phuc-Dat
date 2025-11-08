#!/usr/bin/env python3
"""
Simple test script to check expense logic functions
"""

import os
import re

def test_expense_functions():
    """Test if expense functions exist"""
    
    print("Testing Expense Logic Functions...")
    
    file_path = "frontend/src/components/expenses/CreateProjectExpenseDialog.tsx"
    
    if not os.path.exists(file_path):
        print("ERROR: File not found")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("File loaded successfully")
    
    # Test functions
    functions = [
        "createExpense",
        "createPlannedExpense", 
        "createActualExpense",
        "updateParentExpense",
        "createNewExpense"
    ]
    
    for func in functions:
        pattern = f"const {func} = async"
        if re.search(pattern, content):
            print(f"OK: {func} function found")
        else:
            print(f"ERROR: {func} function not found")
    
    # Test helper functions
    helpers = [
        "getInvoiceItems",
        "updateParentExpenseAmount", 
        "updateChildExpenses"
    ]
    
    for helper in helpers:
        pattern = f"const {helper} ="
        if re.search(pattern, content):
            print(f"OK: {helper} helper found")
        else:
            print(f"ERROR: {helper} helper not found")
    
    # Test error handling
    error_patterns = [
        r"try \{",
        r"catch \(error\) \{",
        r"console\.error\(",
        r"showNotification\("
    ]
    
    for pattern in error_patterns:
        if re.search(pattern, content):
            print(f"OK: Error handling pattern found")
        else:
            print(f"ERROR: Error handling pattern missing")
    
    print("\nTest completed!")
    return True

if __name__ == "__main__":
    test_expense_functions()
