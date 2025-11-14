"""
Input Validation Test Script
Tests input validation with XSS, SQL injection, and invalid formats
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.validators import (
    sanitize_string,
    validate_email,
    validate_phone,
    validate_name
)
from models.customer import CustomerCreate, CustomerUpdate
from models.employee import EmployeeCreate, EmployeeUpdate
from pydantic import ValidationError

def test_sanitize_string():
    """Test string sanitization"""
    print("\n" + "="*60)
    print("Test 1: String Sanitization")
    print("="*60)
    
    test_cases = [
        ("<script>alert('xss')</script>", "alert('xss')"),
        ("'; DROP TABLE users; --", " DROP TABLE users "),
        ("<iframe src='evil.com'></iframe>", ""),
        ("javascript:alert('xss')", "alert('xss')"),
        ("onclick='alert(1)'", ""),
        ("Normal text", "Normal text"),
        ("<img onerror='alert(1)'>", ""),
    ]
    
    passed = 0
    failed = 0
    
    for input_val, expected_pattern in test_cases:
        result = sanitize_string(input_val)
        # Check if dangerous patterns are removed
        is_safe = (
            "<script" not in result.lower() and
            "javascript:" not in result.lower() and
            "onclick" not in result.lower() and
            "drop table" not in result.lower()
        )
        
        if is_safe:
            print(f"  [OK] Input: '{input_val[:50]}' -> Sanitized")
            passed += 1
        else:
            print(f"  [FAIL] Input: '{input_val[:50]}' -> Still contains dangerous patterns")
            failed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0

def test_validate_email():
    """Test email validation"""
    print("\n" + "="*60)
    print("Test 2: Email Validation")
    print("="*60)
    
    valid_emails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "user+tag@example.com",
        "user_name@example-domain.com",
    ]
    
    invalid_emails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user space@example.com",
        "user@example",
    ]
    
    passed = 0
    failed = 0
    
    # Test valid emails
    for email in valid_emails:
        try:
            result = validate_email(email)
            if result:
                print(f"  [OK] Valid email: {email}")
                passed += 1
            else:
                print(f"  [FAIL] Valid email rejected: {email}")
                failed += 1
        except ValueError as e:
            print(f"  [FAIL] Valid email rejected: {email} - {e}")
            failed += 1
    
    # Test invalid emails
    for email in invalid_emails:
        try:
            result = validate_email(email)
            print(f"  [FAIL] Invalid email accepted: {email}")
            failed += 1
        except ValueError:
            print(f"  [OK] Invalid email rejected: {email}")
            passed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0

def test_validate_phone():
    """Test phone validation"""
    print("\n" + "="*60)
    print("Test 3: Phone Validation")
    print("="*60)
    
    valid_phones = [
        ("0123456789", "VN"),
        ("+84123456789", "VN"),
        ("+1-555-123-4567", None),
        ("(555) 123-4567", None),
    ]
    
    invalid_phones = [
        ("123", "VN"),  # Too short
        ("abc123", "VN"),  # Contains letters
        ("1234567890123456", "VN"),  # Too long
    ]
    
    passed = 0
    failed = 0
    
    # Test valid phones
    for phone, country in valid_phones:
        try:
            result = validate_phone(phone, country)
            if result:
                print(f"  [OK] Valid phone: {phone} (country: {country})")
                passed += 1
            else:
                print(f"  [FAIL] Valid phone rejected: {phone}")
                failed += 1
        except ValueError as e:
            print(f"  [FAIL] Valid phone rejected: {phone} - {e}")
            failed += 1
    
    # Test invalid phones
    for phone, country in invalid_phones:
        try:
            result = validate_phone(phone, country)
            print(f"  [FAIL] Invalid phone accepted: {phone}")
            failed += 1
        except ValueError:
            print(f"  [OK] Invalid phone rejected: {phone}")
            passed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0

def test_customer_create_validation():
    """Test CustomerCreate model validation"""
    print("\n" + "="*60)
    print("Test 4: CustomerCreate Model Validation")
    print("="*60)
    
    passed = 0
    failed = 0
    
    # Test valid customer
    try:
        customer = CustomerCreate(
            name="Test Customer",
            type="company",
            email="test@example.com",
            phone="0123456789"
        )
        print(f"  [OK] Valid customer created: {customer.name}")
        passed += 1
    except ValidationError as e:
        print(f"  [FAIL] Valid customer rejected: {e}")
        failed += 1
    
    # Test XSS in name
    try:
        customer = CustomerCreate(
            name="<script>alert('xss')</script>",
            type="company",
            email="test@example.com"
        )
        # Check if XSS is sanitized
        if "<script" not in customer.name.lower():
            print(f"  [OK] XSS in name sanitized: {customer.name}")
            passed += 1
        else:
            print(f"  [FAIL] XSS in name not sanitized")
            failed += 1
    except ValidationError as e:
        print(f"  [FAIL] Customer creation failed: {e}")
        failed += 1
    
    # Test invalid email
    try:
        customer = CustomerCreate(
            name="Test Customer",
            type="company",
            email="invalid-email"
        )
        print(f"  [FAIL] Invalid email accepted")
        failed += 1
    except ValidationError:
        print(f"  [OK] Invalid email rejected")
        passed += 1
    
    # Test invalid phone
    try:
        customer = CustomerCreate(
            name="Test Customer",
            type="company",
            email="test@example.com",
            phone="123"  # Too short
        )
        print(f"  [FAIL] Invalid phone accepted")
        failed += 1
    except ValidationError:
        print(f"  [OK] Invalid phone rejected")
        passed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0

def test_employee_create_validation():
    """Test EmployeeCreate model validation"""
    print("\n" + "="*60)
    print("Test 5: EmployeeCreate Model Validation")
    print("="*60)
    
    from datetime import date
    
    passed = 0
    failed = 0
    
    # Test valid employee
    try:
        employee = EmployeeCreate(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="0123456789",
            hire_date=date.today()
        )
        print(f"  [OK] Valid employee created: {employee.first_name} {employee.last_name}")
        passed += 1
    except ValidationError as e:
        print(f"  [FAIL] Valid employee rejected: {e}")
        failed += 1
    
    # Test XSS in name
    try:
        employee = EmployeeCreate(
            first_name="<script>alert('xss')</script>",
            last_name="Doe",
            email="test@example.com",
            hire_date=date.today()
        )
        if "<script" not in employee.first_name.lower():
            print(f"  [OK] XSS in first_name sanitized")
            passed += 1
        else:
            print(f"  [FAIL] XSS in first_name not sanitized")
            failed += 1
    except ValidationError as e:
        print(f"  [FAIL] Employee creation failed: {e}")
        failed += 1
    
    # Test invalid email
    try:
        employee = EmployeeCreate(
            first_name="John",
            last_name="Doe",
            email="invalid-email",
            hire_date=date.today()
        )
        print(f"  [FAIL] Invalid email accepted")
        failed += 1
    except ValidationError:
        print(f"  [OK] Invalid email rejected")
        passed += 1
    
    print(f"\n  Result: {passed} passed, {failed} failed")
    return failed == 0

def main():
    """Run all input validation tests"""
    print("="*60)
    print("Input Validation Tests")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("String Sanitization", test_sanitize_string()))
    results.append(("Email Validation", test_validate_email()))
    results.append(("Phone Validation", test_validate_phone()))
    results.append(("CustomerCreate Validation", test_customer_create_validation()))
    results.append(("EmployeeCreate Validation", test_employee_create_validation()))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[OK] PASS" if result else "[FAIL] FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  [SUCCESS] All tests passed! Input validation is working correctly.")
        return 0
    else:
        print(f"\n  [WARNING] {total - passed} test(s) failed. Please review the results above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

