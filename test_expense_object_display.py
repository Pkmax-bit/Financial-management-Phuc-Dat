#!/usr/bin/env python3
"""
Test script để kiểm tra logic hiển thị chi phí đối tượng
"""

def test_direct_object_totals_logic():
    """Test logic hasDirectObjectInputs và tính toán tổng"""
    print("Testing direct object totals logic...")
    
    # Test cases
    test_cases = [
        {
            'directObjectTotals': {},
            'expected_hasDirect': False,
            'expected_total': 0,
            'description': 'Empty directObjectTotals should have no direct inputs'
        },
        {
            'directObjectTotals': {'obj1': 0, 'obj2': 0},
            'expected_hasDirect': False,
            'expected_total': 0,
            'description': 'All zero values should have no direct inputs'
        },
        {
            'directObjectTotals': {'obj1': 1000, 'obj2': 0},
            'expected_hasDirect': True,
            'expected_total': 1000,
            'description': 'One positive value should have direct inputs'
        },
        {
            'directObjectTotals': {'obj1': 1000, 'obj2': 2000},
            'expected_hasDirect': True,
            'expected_total': 3000,
            'description': 'Multiple positive values should have direct inputs'
        },
        {
            'directObjectTotals': {'obj1': -1000, 'obj2': 2000},
            'expected_hasDirect': True,
            'expected_total': 1000,
            'description': 'Mixed positive/negative values should have direct inputs'
        }
    ]
    
    results = {}
    
    for i, test_case in enumerate(test_cases):
        directObjectTotals = test_case['directObjectTotals']
        expected_hasDirect = test_case['expected_hasDirect']
        expected_total = test_case['expected_total']
        description = test_case['description']
        
        print(f"\nTest case {i+1}: {description}")
        print(f"   directObjectTotals: {directObjectTotals}")
        print(f"   Expected hasDirect: {expected_hasDirect}")
        print(f"   Expected total: {expected_total}")
        
        # Simulate logic from frontend
        hasDirectObjectInputs = any(val > 0 for val in directObjectTotals.values())
        actual_total = sum(directObjectTotals.values())
        
        print(f"   Actual hasDirect: {hasDirectObjectInputs}")
        print(f"   Actual total: {actual_total}")
        
        # Verify logic
        hasDirect_correct = hasDirectObjectInputs == expected_hasDirect
        total_correct = actual_total == expected_total
        
        if hasDirect_correct and total_correct:
            print(f"   Result: SUCCESS")
            results[f"case_{i+1}"] = 'SUCCESS'
        else:
            print(f"   Result: FAILED")
            if not hasDirect_correct:
                print(f"   hasDirect mismatch: expected {expected_hasDirect}, got {hasDirectObjectInputs}")
            if not total_correct:
                print(f"   total mismatch: expected {expected_total}, got {actual_total}")
            results[f"case_{i+1}"] = 'FAILED'
    
    return results

def test_grand_allocation_total_logic():
    """Test logic grandAllocationTotal"""
    print("\nTesting grand allocation total logic...")
    
    # Mock invoice items
    mock_invoice_items = [
        {'lineTotal': 1000, 'componentsAmt': {'obj1': 500, 'obj2': 500}},
        {'lineTotal': 2000, 'componentsAmt': {'obj1': 1000, 'obj2': 1000}},
        {'lineTotal': 0, 'componentsAmt': {'obj1': 0, 'obj2': 0}},
    ]
    
    # Test cases
    test_cases = [
        {
            'invoice_items': mock_invoice_items,
            'selectedExpenseObjectIds': ['obj1', 'obj2'],
            'expected_total': 3000,  # 1000 + 2000 + 0
            'description': 'Normal invoice items should sum lineTotal'
        },
        {
            'invoice_items': [],
            'selectedExpenseObjectIds': ['obj1', 'obj2'],
            'expected_total': 0,
            'description': 'Empty invoice items should return 0'
        },
        {
            'invoice_items': [{'lineTotal': 0, 'componentsAmt': {}}],
            'selectedExpenseObjectIds': [],
            'expected_total': 0,
            'description': 'Zero lineTotal should return 0'
        }
    ]
    
    results = {}
    
    for i, test_case in enumerate(test_cases):
        invoice_items = test_case['invoice_items']
        selectedExpenseObjectIds = test_case['selectedExpenseObjectIds']
        expected_total = test_case['expected_total']
        description = test_case['description']
        
        print(f"\nTest case {i+1}: {description}")
        print(f"   invoice_items: {len(invoice_items)} items")
        print(f"   selectedExpenseObjectIds: {selectedExpenseObjectIds}")
        print(f"   Expected total: {expected_total}")
        
        # Simulate logic from frontend
        grandAllocationTotal = sum(item['lineTotal'] for item in invoice_items)
        
        print(f"   Actual total: {grandAllocationTotal}")
        
        # Verify logic
        total_correct = grandAllocationTotal == expected_total
        
        if total_correct:
            print(f"   Result: SUCCESS")
            results[f"case_{i+1}"] = 'SUCCESS'
        else:
            print(f"   Result: FAILED")
            print(f"   total mismatch: expected {expected_total}, got {grandAllocationTotal}")
            results[f"case_{i+1}"] = 'FAILED'
    
    return results

def test_expense_object_totals_logic():
    """Test logic expenseObjectTotals"""
    print("\nTesting expense object totals logic...")
    
    # Mock data
    mock_invoice_items = [
        {
            'lineTotal': 1000,
            'componentsAmt': {'obj1': 600, 'obj2': 400}
        },
        {
            'lineTotal': 2000,
            'componentsAmt': {'obj1': 1200, 'obj2': 800}
        }
    ]
    
    selectedExpenseObjectIds = ['obj1', 'obj2']
    
    # Test cases
    test_cases = [
        {
            'object_id': 'obj1',
            'expected_total': 1800,  # 600 + 1200
            'description': 'obj1 should sum componentsAmt from all rows'
        },
        {
            'object_id': 'obj2',
            'expected_total': 1200,  # 400 + 800
            'description': 'obj2 should sum componentsAmt from all rows'
        },
        {
            'object_id': 'obj3',
            'expected_total': 0,
            'description': 'Non-existent obj3 should return 0'
        }
    ]
    
    results = {}
    
    for i, test_case in enumerate(test_cases):
        object_id = test_case['object_id']
        expected_total = test_case['expected_total']
        description = test_case['description']
        
        print(f"\nTest case {i+1}: {description}")
        print(f"   object_id: {object_id}")
        print(f"   Expected total: {expected_total}")
        
        # Simulate logic from frontend
        expenseObjectTotals = {}
        for id in selectedExpenseObjectIds:
            expenseObjectTotals[id] = 0
        
        for row in mock_invoice_items:
            for id in selectedExpenseObjectIds:
                expenseObjectTotals[id] += row['componentsAmt'].get(id, 0)
        
        actual_total = expenseObjectTotals.get(object_id, 0)
        
        print(f"   Actual total: {actual_total}")
        
        # Verify logic
        total_correct = actual_total == expected_total
        
        if total_correct:
            print(f"   Result: SUCCESS")
            results[f"case_{i+1}"] = 'SUCCESS'
        else:
            print(f"   Result: FAILED")
            print(f"   total mismatch: expected {expected_total}, got {actual_total}")
            results[f"case_{i+1}"] = 'FAILED'
    
    return results

def test_percentage_calculation():
    """Test logic tính phần trăm"""
    print("\nTesting percentage calculation...")
    
    # Test cases
    test_cases = [
        {
            'totalAmount': 1000,
            'totalAllocation': 2000,
            'expected_percentage': 50.0,
            'description': '50% of total allocation'
        },
        {
            'totalAmount': 0,
            'totalAllocation': 1000,
            'expected_percentage': 0.0,
            'description': '0% when amount is 0'
        },
        {
            'totalAmount': 1000,
            'totalAllocation': 0,
            'expected_percentage': 0.0,
            'description': '0% when total allocation is 0'
        },
        {
            'totalAmount': 1000,
            'totalAllocation': 1000,
            'expected_percentage': 100.0,
            'description': '100% when amounts are equal'
        }
    ]
    
    results = {}
    
    for i, test_case in enumerate(test_cases):
        totalAmount = test_case['totalAmount']
        totalAllocation = test_case['totalAllocation']
        expected_percentage = test_case['expected_percentage']
        description = test_case['description']
        
        print(f"\nTest case {i+1}: {description}")
        print(f"   totalAmount: {totalAmount}")
        print(f"   totalAllocation: {totalAllocation}")
        print(f"   Expected percentage: {expected_percentage}%")
        
        # Simulate logic from frontend
        percentage = (totalAmount / totalAllocation * 100) if totalAllocation > 0 else 0
        
        print(f"   Actual percentage: {percentage}%")
        
        # Verify logic
        percentage_correct = abs(percentage - expected_percentage) < 0.01  # Allow small floating point differences
        
        if percentage_correct:
            print(f"   Result: SUCCESS")
            results[f"case_{i+1}"] = 'SUCCESS'
        else:
            print(f"   Result: FAILED")
            print(f"   percentage mismatch: expected {expected_percentage}%, got {percentage}%")
            results[f"case_{i+1}"] = 'FAILED'
    
    return results

def main():
    """Main test function"""
    print("Starting expense object display tests...")
    
    # Test 1: Direct object totals logic
    direct_results = test_direct_object_totals_logic()
    
    # Test 2: Grand allocation total logic
    grand_results = test_grand_allocation_total_logic()
    
    # Test 3: Expense object totals logic
    expense_results = test_expense_object_totals_logic()
    
    # Test 4: Percentage calculation
    percentage_results = test_percentage_calculation()
    
    # Summary
    print("\nTEST SUMMARY")
    print("=" * 50)
    
    print("\nDirect object totals results:")
    for case, result in direct_results.items():
        print(f"   {case}: {result}")
    
    print("\nGrand allocation total results:")
    for case, result in grand_results.items():
        print(f"   {case}: {result}")
    
    print("\nExpense object totals results:")
    for case, result in expense_results.items():
        print(f"   {case}: {result}")
    
    print("\nPercentage calculation results:")
    for case, result in percentage_results.items():
        print(f"   {case}: {result}")
    
    # Count successes
    all_results = (list(direct_results.values()) + 
                   list(grand_results.values()) + 
                   list(expense_results.values()) + 
                   list(percentage_results.values()))
    
    success_count = sum(1 for result in all_results if result == 'SUCCESS')
    total_count = len(all_results)
    
    print(f"\nOverall: {success_count}/{total_count} tests passed")
    
    if success_count == total_count:
        print("All tests PASSED!")
    else:
        print("Some tests FAILED!")
    
    print("\nTesting completed!")

if __name__ == "__main__":
    main()





