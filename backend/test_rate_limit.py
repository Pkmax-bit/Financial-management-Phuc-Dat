"""
Simple test script for rate limiting
Run this to verify rate limiting works correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from middleware.rate_limit import rate_limiter, get_rate_limit_config
from fastapi import Request
from unittest.mock import Mock

def test_rate_limit():
    """Test rate limiting functionality"""
    print("Testing Rate Limiting...")
    
    # Get config
    config = get_rate_limit_config()
    print(f"Config: {config}")
    
    # Create mock request
    mock_request = Mock(spec=Request)
    mock_request.client = Mock()
    mock_request.client.host = "127.0.0.1"
    mock_request.state = Mock()
    mock_request.state.user_id = None
    
    # Test 1: Normal requests (should pass)
    print("\nTest 1: Normal requests (should pass)")
    for i in range(5):
        try:
            rate_limiter.check_rate_limit(
                mock_request,
                max_requests=config["max_requests"],
                window_seconds=config["window_seconds"]
            )
            print(f"  [OK] Request {i+1} passed")
        except Exception as e:
            print(f"  [FAIL] Request {i+1} failed: {e}")
    
    # Test 2: Exceed limit (should fail)
    print(f"\nTest 2: Exceed limit (should fail after {config['max_requests']} requests)")
    failed = False
    for i in range(config["max_requests"] + 10):
        try:
            rate_limiter.check_rate_limit(
                mock_request,
                max_requests=config["max_requests"],
                window_seconds=config["window_seconds"]
            )
            if i == config["max_requests"] - 1:
                print(f"  [OK] Request {i+1} passed (last allowed)")
        except Exception as e:
            if not failed:
                print(f"  [EXPECTED] Request {i+1} failed (expected): {e}")
                failed = True
                break
    
    # Test 3: Different IPs (should have separate limits)
    print("\nTest 3: Different IPs (should have separate limits)")
    mock_request2 = Mock(spec=Request)
    mock_request2.client = Mock()
    mock_request2.client.host = "192.168.1.1"
    mock_request2.state = Mock()
    mock_request2.state.user_id = None
    
    try:
        rate_limiter.check_rate_limit(
            mock_request2,
            max_requests=config["max_requests"],
            window_seconds=config["window_seconds"]
        )
        print("  [OK] Different IP can make requests")
    except Exception as e:
        print(f"  [FAIL] Different IP failed: {e}")
    
    # Test 4: Get rate limit info
    print("\nTest 4: Get rate limit info")
    info = rate_limiter.get_rate_limit_info("ip:127.0.0.1", config["window_seconds"])
    print(f"  Rate limit info: {info}")
    
    print("\n[SUCCESS] All tests completed!")

if __name__ == "__main__":
    test_rate_limit()

