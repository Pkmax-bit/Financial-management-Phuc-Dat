"""
HTTPS and Security Headers Test Script
Tests HTTPS redirect and security headers
"""

import requests
import sys
from typing import Dict, List

# Configuration
BASE_URL = "http://localhost:8000"
HTTPS_URL = "https://localhost:8000"  # Note: May not work without SSL cert

def test_security_headers():
    """Test that security headers are present in responses"""
    print("\n" + "="*60)
    print("Test 1: Security Headers Presence")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers:")
        
        security_headers = {
            "X-Content-Type-Options": response.headers.get("X-Content-Type-Options"),
            "X-Frame-Options": response.headers.get("X-Frame-Options"),
            "X-XSS-Protection": response.headers.get("X-XSS-Protection"),
            "Strict-Transport-Security": response.headers.get("Strict-Transport-Security"),
        }
        
        all_present = True
        for header, value in security_headers.items():
            if value:
                print(f"    [OK] {header}: {value}")
            else:
                if header == "Strict-Transport-Security":
                    print(f"    [INFO] {header}: Not set (expected in development)")
                else:
                    print(f"    [MISSING] {header}: Not found")
                    all_present = False
        
        # Verify values
        if security_headers["X-Content-Type-Options"] == "nosniff":
            print(f"  [OK] X-Content-Type-Options is correct")
        elif security_headers["X-Content-Type-Options"]:
            print(f"  [WARNING] X-Content-Type-Options value is unexpected")
            all_present = False
        
        if security_headers["X-Frame-Options"] == "DENY":
            print(f"  [OK] X-Frame-Options is correct")
        elif security_headers["X-Frame-Options"]:
            print(f"  [WARNING] X-Frame-Options value is unexpected")
            all_present = False
        
        if security_headers["X-XSS-Protection"] == "1; mode=block":
            print(f"  [OK] X-XSS-Protection is correct")
        elif security_headers["X-XSS-Protection"]:
            print(f"  [WARNING] X-XSS-Protection value is unexpected")
            all_present = False
        
        return all_present
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        print(f"      Please start the backend server first:")
        print(f"      cd backend && python -m uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_https_redirect_development():
    """Test HTTPS redirect behavior in development mode"""
    print("\n" + "="*60)
    print("Test 2: HTTPS Redirect (Development Mode)")
    print("="*60)
    print("  Note: In development, HTTP requests should NOT be redirected")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5, allow_redirects=False)
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"  [OK] HTTP request not redirected (expected in development)")
            return True
        elif response.status_code in [301, 302, 307, 308]:
            location = response.headers.get("Location", "")
            print(f"  [WARNING] HTTP request was redirected to: {location}")
            print(f"  This should not happen in development mode")
            return False
        else:
            print(f"  [INFO] Status code: {response.status_code}")
            return True
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_security_headers_values():
    """Test that security headers have correct values"""
    print("\n" + "="*60)
    print("Test 3: Security Headers Values")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/employees", timeout=5)
        
        print(f"  Status Code: {response.status_code}")
        
        # Check X-Content-Type-Options
        content_type_options = response.headers.get("X-Content-Type-Options")
        if content_type_options == "nosniff":
            print(f"  [OK] X-Content-Type-Options: {content_type_options}")
        else:
            print(f"  [FAIL] X-Content-Type-Options: {content_type_options} (expected: nosniff)")
            return False
        
        # Check X-Frame-Options
        frame_options = response.headers.get("X-Frame-Options")
        if frame_options == "DENY":
            print(f"  [OK] X-Frame-Options: {frame_options}")
        else:
            print(f"  [FAIL] X-Frame-Options: {frame_options} (expected: DENY)")
            return False
        
        # Check X-XSS-Protection
        xss_protection = response.headers.get("X-XSS-Protection")
        if xss_protection == "1; mode=block":
            print(f"  [OK] X-XSS-Protection: {xss_protection}")
        else:
            print(f"  [FAIL] X-XSS-Protection: {xss_protection} (expected: 1; mode=block)")
            return False
        
        # Check HSTS (should not be present in development)
        hsts = response.headers.get("Strict-Transport-Security")
        if hsts:
            print(f"  [INFO] Strict-Transport-Security: {hsts}")
            print(f"  [NOTE] HSTS is present (expected in production, not development)")
        else:
            print(f"  [OK] Strict-Transport-Security: Not set (expected in development)")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_all_endpoints_have_security_headers():
    """Test that all endpoints return security headers"""
    print("\n" + "="*60)
    print("Test 4: Security Headers on All Endpoints")
    print("="*60)
    
    endpoints = [
        "/health",
        "/",
        "/api/employees",
        "/api/customers"
    ]
    
    all_present = True
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            has_security_headers = (
                response.headers.get("X-Content-Type-Options") == "nosniff" and
                response.headers.get("X-Frame-Options") == "DENY" and
                response.headers.get("X-XSS-Protection") == "1; mode=block"
            )
            
            if has_security_headers:
                print(f"  [OK] {endpoint}: Security headers present")
            else:
                print(f"  [FAIL] {endpoint}: Missing security headers")
                all_present = False
                
        except Exception as e:
            print(f"  [ERROR] {endpoint}: {e}")
            all_present = False
    
    return all_present

def main():
    """Run all HTTPS and security headers tests"""
    print("="*60)
    print("HTTPS and Security Headers Tests")
    print("="*60)
    print(f"\nTesting against: {BASE_URL}")
    print(f"Environment: Development (HTTPS redirect disabled)")
    print("\n[NOTE] Make sure backend server is running!")
    print("   Start with: cd backend && python -m uvicorn main:app --reload")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        print(f"\n[OK] Backend server is running!")
    except:
        print(f"\n[ERROR] Backend server is NOT running!")
        print(f"   Please start it first: cd backend && python -m uvicorn main:app --reload")
        return 1
    
    results = []
    
    # Run tests
    results.append(("Security Headers Presence", test_security_headers()))
    results.append(("HTTPS Redirect (Development)", test_https_redirect_development()))
    results.append(("Security Headers Values", test_security_headers_values()))
    results.append(("Security Headers on All Endpoints", test_all_endpoints_have_security_headers()))
    
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
        print("\n  [SUCCESS] All tests passed! HTTPS and security headers are configured correctly.")
        print("\n  [NOTE] To test HTTPS redirect in production:")
        print("    1. Set ENVIRONMENT=production in .env")
        print("    2. Restart backend server")
        print("    3. HTTP requests should redirect to HTTPS (301)")
        return 0
    else:
        print(f"\n  [WARNING] {total - passed} test(s) failed. Please review the results above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

