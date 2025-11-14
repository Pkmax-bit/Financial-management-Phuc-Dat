#!/usr/bin/env python3
"""
Test Token Refresh Logic
Verify JWT token expiration parsing logic
"""

import json
import base64
import time
from datetime import datetime

def decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        
        # Decode base64url
        payload_b64 = parts[1]
        # Add padding if needed
        payload_b64 += '=' * (4 - len(payload_b64) % 4)
        # Replace URL-safe characters
        payload_b64 = payload_b64.replace('-', '+').replace('_', '/')
        
        # Decode
        payload_bytes = base64.b64decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        return payload
    except Exception as e:
        print(f"[FAIL] Error decoding JWT: {e}")
        return {}

def test_jwt_parsing():
    """Test JWT token parsing"""
    print("=" * 60)
    print("JWT Token Parsing Test")
    print("=" * 60)
    
    # Sample JWT token (expired)
    # This is a sample token structure - in real scenario, use actual Supabase token
    sample_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    
    print("\n[TEST] Decoding sample JWT token...")
    payload = decode_jwt_payload(sample_token)
    
    if payload:
        print("[OK] JWT payload decoded successfully")
        print(f"  Payload: {json.dumps(payload, indent=2)}")
        
        if 'exp' in payload:
            exp_timestamp = payload['exp']
            exp_datetime = datetime.fromtimestamp(exp_timestamp)
            print(f"  Expiration (timestamp): {exp_timestamp}")
            print(f"  Expiration (datetime): {exp_datetime.isoformat()}")
            
            # Check if expired
            now = int(time.time())
            if exp_timestamp < now:
                print(f"  [INFO] Token is expired (expired {now - exp_timestamp} seconds ago)")
            else:
                time_until_expiry = exp_timestamp - now
                print(f"  [INFO] Token expires in {time_until_expiry} seconds ({time_until_expiry // 60} minutes)")
                
                # Check if expires soon (< 5 minutes)
                if time_until_expiry < 300:  # 5 minutes
                    print(f"  [WARNING] Token expires soon - should trigger refresh")
                else:
                    print(f"  [OK] Token is still valid")
        else:
            print("[WARNING] No 'exp' claim in token")
    else:
        print("[FAIL] Failed to decode JWT payload")
    
    return payload is not None and 'exp' in payload

def test_expiration_logic():
    """Test expiration check logic"""
    print("\n" + "=" * 60)
    print("Expiration Check Logic Test")
    print("=" * 60)
    
    refresh_threshold = 5 * 60 * 1000  # 5 minutes in milliseconds
    
    test_cases = [
        {
            "name": "Token expires in 10 minutes",
            "exp_timestamp": int(time.time()) + (10 * 60),
            "expected": False,
        },
        {
            "name": "Token expires in 3 minutes",
            "exp_timestamp": int(time.time()) + (3 * 60),
            "expected": True,
        },
        {
            "name": "Token expires in 1 minute",
            "exp_timestamp": int(time.time()) + (1 * 60),
            "expected": True,
        },
        {
            "name": "Token already expired",
            "exp_timestamp": int(time.time()) - (1 * 60),
            "expected": False,  # Already expired, should not trigger refresh check
        },
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n[TEST] {test_case['name']}...")
        
        exp_timestamp = test_case['exp_timestamp']
        expires_at = exp_timestamp * 1000  # Convert to milliseconds
        now = int(time.time() * 1000)  # Current time in milliseconds
        time_until_expiry = expires_at - now
        
        # Check logic: expires within threshold AND not already expired
        should_refresh = time_until_expiry > 0 and time_until_expiry < refresh_threshold
        
        if should_refresh == test_case['expected']:
            print(f"  [OK] Result matches expected: {should_refresh}")
        else:
            print(f"  [FAIL] Expected {test_case['expected']}, got {should_refresh}")
            all_passed = False
        
        minutes = time_until_expiry / 1000 / 60
        print(f"  Time until expiry: {minutes:.1f} minutes")
    
    return all_passed

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Token Refresh Logic Tests")
    print("=" * 60)
    
    results = []
    
    # Test 1: JWT Parsing
    print("\n[TEST 1] JWT Token Parsing")
    result1 = test_jwt_parsing()
    results.append(("JWT Parsing", result1))
    
    # Test 2: Expiration Logic
    print("\n[TEST 2] Expiration Check Logic")
    result2 = test_expiration_logic()
    results.append(("Expiration Logic", result2))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results:
        status = "[OK]" if result else "[FAIL]"
        print(f"{status} {test_name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("[SUCCESS] All tests passed!")
    else:
        print("[FAIL] Some tests failed")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())

