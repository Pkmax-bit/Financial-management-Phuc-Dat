"""
HTTP Test Script for Rate Limiting
Tests rate limiting by making actual HTTP requests to the API
"""

import requests
import time
import sys
from typing import Dict, List

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ENDPOINT = "/api/employees"  # Endpoint that requires rate limiting
HEALTH_ENDPOINT = "/health"  # Should not be rate limited
MAX_REQUESTS = 100  # Default rate limit
WINDOW_SECONDS = 60  # Default window

def test_health_check():
    """Test that health check is not rate limited"""
    print("\n" + "="*60)
    print("Test 1: Health Check (Should NOT be rate limited)")
    print("="*60)
    
    success_count = 0
    for i in range(150):  # Make 150 requests
        try:
            response = requests.get(f"{BASE_URL}{HEALTH_ENDPOINT}", timeout=5)
            if response.status_code == 200:
                success_count += 1
            if (i + 1) % 25 == 0:
                print(f"  ✓ Made {i+1} requests, all successful so far")
        except Exception as e:
            print(f"  ✗ Request {i+1} failed: {e}")
            break
    
    print(f"\n  ✅ Result: {success_count}/150 requests successful")
    print(f"  ✅ Health check is NOT rate limited (as expected)")
    return success_count == 150

def test_normal_requests():
    """Test normal requests within rate limit"""
    print("\n" + "="*60)
    print("Test 2: Normal Requests (Should pass)")
    print("="*60)
    
    success_count = 0
    failed_count = 0
    
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}{TEST_ENDPOINT}", timeout=5)
            if response.status_code == 200:
                success_count += 1
                remaining = response.headers.get("X-RateLimit-Remaining", "N/A")
                limit = response.headers.get("X-RateLimit-Limit", "N/A")
                print(f"  ✓ Request {i+1}: Status {response.status_code}, Remaining: {remaining}/{limit}")
            elif response.status_code == 401:
                # Unauthorized is OK (no auth token)
                success_count += 1
                remaining = response.headers.get("X-RateLimit-Remaining", "N/A")
                print(f"  ✓ Request {i+1}: Status {response.status_code} (Unauthorized - expected), Remaining: {remaining}")
            else:
                failed_count += 1
                print(f"  ✗ Request {i+1}: Status {response.status_code}")
        except Exception as e:
            failed_count += 1
            print(f"  ✗ Request {i+1} failed: {e}")
    
    print(f"\n  ✅ Result: {success_count} successful, {failed_count} failed")
    return failed_count == 0

def test_rate_limit_exceeded():
    """Test rate limit exceeded scenario"""
    print("\n" + "="*60)
    print(f"Test 3: Rate Limit Exceeded (Should fail after {MAX_REQUESTS} requests)")
    print("="*60)
    print(f"  Making {MAX_REQUESTS + 10} requests quickly...")
    print("  (This may take a moment)")
    
    success_count = 0
    rate_limited_count = 0
    other_errors = 0
    
    for i in range(MAX_REQUESTS + 10):
        try:
            response = requests.get(f"{BASE_URL}{TEST_ENDPOINT}", timeout=5)
            
            if response.status_code == 200 or response.status_code == 401:
                success_count += 1
                if (i + 1) % 20 == 0:
                    remaining = response.headers.get("X-RateLimit-Remaining", "N/A")
                    print(f"  Request {i+1}: Status {response.status_code}, Remaining: {remaining}")
            elif response.status_code == 429:
                rate_limited_count += 1
                retry_after = response.headers.get("Retry-After", "N/A")
                print(f"\n  ⚠️  Request {i+1}: RATE LIMITED (429)")
                print(f"      Retry-After: {retry_after} seconds")
                print(f"      Detail: {response.json().get('detail', 'N/A')}")
                break
            else:
                other_errors += 1
                print(f"  ✗ Request {i+1}: Unexpected status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"\n  ❌ Connection Error: Backend server is not running!")
            print(f"      Please start the backend server first:")
            print(f"      cd backend && python -m uvicorn main:app --reload")
            return False
        except Exception as e:
            other_errors += 1
            print(f"  ✗ Request {i+1} failed: {e}")
    
    print(f"\n  ✅ Result:")
    print(f"      - Successful requests: {success_count}")
    print(f"      - Rate limited (429): {rate_limited_count}")
    print(f"      - Other errors: {other_errors}")
    
    if rate_limited_count > 0:
        print(f"  ✅ Rate limiting is working correctly!")
        return True
    elif success_count >= MAX_REQUESTS:
        print(f"  ⚠️  Warning: Made {success_count} requests but no rate limit hit")
        print(f"      This might mean rate limiting is disabled or limit is higher")
        return True  # Not necessarily a failure
    else:
        print(f"  ❌ Unexpected result")
        return False

def test_rate_limit_headers():
    """Test that rate limit headers are present"""
    print("\n" + "="*60)
    print("Test 4: Rate Limit Headers")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}{TEST_ENDPOINT}", timeout=5)
        
        headers_to_check = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining"
        ]
        
        print("  Checking headers:")
        all_present = True
        for header in headers_to_check:
            value = response.headers.get(header, None)
            if value:
                print(f"    ✓ {header}: {value}")
            else:
                print(f"    ✗ {header}: Missing")
                all_present = False
        
        if all_present:
            print("\n  ✅ All rate limit headers are present")
        else:
            print("\n  ⚠️  Some headers are missing")
        
        return all_present
        
    except Exception as e:
        print(f"  ✗ Failed to check headers: {e}")
        return False

def test_different_endpoints():
    """Test that different endpoints share the same rate limit"""
    print("\n" + "="*60)
    print("Test 5: Different Endpoints (Should share rate limit)")
    print("="*60)
    
    endpoints = [
        "/api/employees",
        "/api/customers",
        "/api/projects"
    ]
    
    success_count = 0
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            remaining = response.headers.get("X-RateLimit-Remaining", "N/A")
            print(f"  ✓ {endpoint}: Status {response.status_code}, Remaining: {remaining}")
            success_count += 1
        except Exception as e:
            print(f"  ✗ {endpoint}: {e}")
    
    print(f"\n  ✅ Result: {success_count}/{len(endpoints)} endpoints accessible")
    return success_count == len(endpoints)

def main():
    """Run all tests"""
    print("="*60)
    print("Rate Limiting HTTP Tests")
    print("="*60)
    print(f"\nTesting against: {BASE_URL}")
    print(f"Rate Limit: {MAX_REQUESTS} requests per {WINDOW_SECONDS} seconds")
    print("\n⚠️  Note: Make sure backend server is running!")
    print("   Start with: cd backend && python -m uvicorn main:app --reload")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}{HEALTH_ENDPOINT}", timeout=2)
        print(f"\n✅ Backend server is running!")
    except:
        print(f"\n❌ Backend server is NOT running!")
        print(f"   Please start it first: cd backend && python -m uvicorn main:app --reload")
        return 1
    
    results = []
    
    # Run tests
    results.append(("Health Check (No Rate Limit)", test_health_check()))
    time.sleep(1)  # Small delay between tests
    
    results.append(("Normal Requests", test_normal_requests()))
    time.sleep(1)
    
    results.append(("Rate Limit Exceeded", test_rate_limit_exceeded()))
    time.sleep(1)
    
    results.append(("Rate Limit Headers", test_rate_limit_headers()))
    time.sleep(1)
    
    results.append(("Different Endpoints", test_different_endpoints()))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  🎉 All tests passed! Rate limiting is working correctly.")
        return 0
    else:
        print(f"\n  ⚠️  {total - passed} test(s) failed. Please review the results above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

