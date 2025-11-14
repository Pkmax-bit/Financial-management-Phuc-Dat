"""
CORS Test Script
Tests CORS configuration and headers
"""

import requests
import sys
from typing import Dict, List, Tuple

# Configuration
BASE_URL = "http://localhost:8000"
ALLOWED_ORIGIN = "http://localhost:3000"
DISALLOWED_ORIGIN = "http://evil.com"

def test_preflight_request():
    """Test OPTIONS preflight request"""
    print("\n" + "="*60)
    print("Test 1: Preflight Request (OPTIONS)")
    print("="*60)
    
    try:
        response = requests.options(
            f"{BASE_URL}/api/employees",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization,Content-Type"
            },
            timeout=5
        )
        
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers:")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
            "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
            "Access-Control-Max-Age": response.headers.get("Access-Control-Max-Age"),
        }
        
        all_present = True
        for header, value in cors_headers.items():
            if value:
                print(f"    [OK] {header}: {value}")
            else:
                print(f"    [MISSING] {header}: Not found")
                all_present = False
        
        # Check max_age
        if cors_headers["Access-Control-Max-Age"]:
            max_age = int(cors_headers["Access-Control-Max-Age"])
            if max_age == 3600:
                print(f"  [OK] Max-Age is 3600 seconds (1 hour) as expected")
            else:
                print(f"  [WARNING] Max-Age is {max_age}, expected 3600")
        
        return all_present and response.status_code in [200, 204]
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        print(f"      Please start the backend server first:")
        print(f"      cd backend && python -m uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_allowed_origin():
    """Test request from allowed origin"""
    print("\n" + "="*60)
    print("Test 2: Request from Allowed Origin")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/employees",
            headers={"Origin": ALLOWED_ORIGIN},
            timeout=5
        )
        
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers:")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
        }
        
        exposed_headers = response.headers.get("Access-Control-Expose-Headers", "")
        exposed_list = [h.strip() for h in exposed_headers.split(",")] if exposed_headers else []
        
        all_present = True
        for header, value in cors_headers.items():
            if value:
                print(f"    [OK] {header}: {value}")
            else:
                print(f"    [MISSING] {header}: Not found")
                all_present = False
        
        # Check exposed headers
        expected_exposed = [
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Retry-After"
        ]
        
        print(f"  Exposed Headers: {exposed_list}")
        for expected in expected_exposed:
            if expected in exposed_list:
                print(f"    [OK] {expected} is exposed")
            else:
                print(f"    [MISSING] {expected} is not exposed")
                all_present = False
        
        # Check X-Request-ID
        request_id = response.headers.get("X-Request-ID")
        if request_id:
            print(f"  [OK] X-Request-ID: {request_id}")
        else:
            print(f"  [MISSING] X-Request-ID not found")
            all_present = False
        
        return all_present
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_disallowed_origin():
    """Test request from disallowed origin (in production)"""
    print("\n" + "="*60)
    print("Test 3: Request from Disallowed Origin")
    print("="*60)
    print("  Note: In development mode, all origins are allowed (*)")
    print("  This test will show different behavior in production")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/employees",
            headers={"Origin": DISALLOWED_ORIGIN},
            timeout=5
        )
        
        print(f"  Status Code: {response.status_code}")
        
        allow_origin = response.headers.get("Access-Control-Allow-Origin")
        
        if allow_origin == "*":
            print(f"  [INFO] Development mode: All origins allowed (*)")
            print(f"  Access-Control-Allow-Origin: {allow_origin}")
            return True
        elif allow_origin == DISALLOWED_ORIGIN:
            print(f"  [WARNING] Disallowed origin was allowed (should not happen in production)")
            return False
        else:
            print(f"  [OK] Disallowed origin was blocked or not included")
            print(f"  Access-Control-Allow-Origin: {allow_origin or 'Not set'}")
            return True
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_cors_with_credentials():
    """Test CORS with credentials"""
    print("\n" + "="*60)
    print("Test 4: CORS with Credentials")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/employees",
            headers={
                "Origin": ALLOWED_ORIGIN,
                "Authorization": "Bearer test-token"
            },
            timeout=5
        )
        
        print(f"  Status Code: {response.status_code}")
        
        allow_credentials = response.headers.get("Access-Control-Allow-Credentials")
        
        if allow_credentials == "true":
            print(f"  [OK] Access-Control-Allow-Credentials: {allow_credentials}")
            return True
        else:
            print(f"  [MISSING] Access-Control-Allow-Credentials not set to 'true'")
            print(f"  Value: {allow_credentials}")
            return False
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def test_cors_headers_presence():
    """Test that all required CORS headers are present"""
    print("\n" + "="*60)
    print("Test 5: CORS Headers Presence")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/employees",
            headers={"Origin": ALLOWED_ORIGIN},
            timeout=5
        )
        
        required_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ]
        
        all_present = True
        for header in required_headers:
            value = response.headers.get(header)
            if value:
                print(f"  [OK] {header}: {value}")
            else:
                print(f"  [MISSING] {header}: Not found")
                all_present = False
        
        return all_present
        
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Connection Error: Backend server is not running!")
        return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

def main():
    """Run all CORS tests"""
    print("="*60)
    print("CORS Configuration Tests")
    print("="*60)
    print(f"\nTesting against: {BASE_URL}")
    print(f"Allowed Origin: {ALLOWED_ORIGIN}")
    print(f"Disallowed Origin: {DISALLOWED_ORIGIN}")
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
    results.append(("Preflight Request (OPTIONS)", test_preflight_request()))
    results.append(("Allowed Origin", test_allowed_origin()))
    results.append(("Disallowed Origin", test_disallowed_origin()))
    results.append(("CORS with Credentials", test_cors_with_credentials()))
    results.append(("CORS Headers Presence", test_cors_headers_presence()))
    
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
        print("\n  [SUCCESS] All tests passed! CORS is configured correctly.")
        return 0
    else:
        print(f"\n  [WARNING] {total - passed} test(s) failed. Please review the results above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

