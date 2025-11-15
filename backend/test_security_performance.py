#!/usr/bin/env python3
"""
Security Performance Test
Kiểm tra xem các security features có làm chậm tốc độ load không
"""

import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
import hmac
import hashlib
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
API_SECRET = "default-dev-secret-change-in-production"

# Test configuration
NUM_REQUESTS = 100
CONCURRENT_REQUESTS = 10

def generate_signature(method, path, timestamp, nonce, body=""):
    """Generate HMAC-SHA256 signature"""
    payload = f"{method.upper()}|{path}|{timestamp}|{nonce}|{body}"
    return hmac.new(
        API_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def make_request_without_security():
    """Make request without security headers (baseline)"""
    start = time.time()
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        elapsed = (time.time() - start) * 1000  # Convert to milliseconds
        return {
            "success": response.status_code == 200,
            "time": elapsed,
            "status": response.status_code
        }
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return {
            "success": False,
            "time": elapsed,
            "error": str(e)
        }

def make_request_with_security():
    """Make request with all security headers"""
    start = time.time()
    try:
        timestamp = int(time.time())
        nonce = str(uuid.uuid4())
        method = "GET"
        path = "/health"
        body = ""
        
        signature = generate_signature(method, path, timestamp, nonce, body)
        
        headers = {
            "X-Request-Timestamp": str(timestamp),
            "X-Request-Nonce": nonce,
            "X-Request-Signature": signature,
            "X-Request-ID": str(uuid.uuid4())
        }
        
        response = requests.get(f"{BASE_URL}/health", headers=headers, timeout=5)
        elapsed = (time.time() - start) * 1000
        return {
            "success": response.status_code in [200, 401],
            "time": elapsed,
            "status": response.status_code
        }
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return {
            "success": False,
            "time": elapsed,
            "error": str(e)
        }

def test_performance(func, name, num_requests, concurrent):
    """Test performance of a function"""
    print(f"\n[TEST] {name}")
    print(f"  Requests: {num_requests}, Concurrent: {concurrent}")
    
    times = []
    successes = 0
    failures = 0
    
    start_total = time.time()
    
    with ThreadPoolExecutor(max_workers=concurrent) as executor:
        futures = [executor.submit(func) for _ in range(num_requests)]
        
        for future in as_completed(futures):
            result = future.result()
            times.append(result["time"])
            if result["success"]:
                successes += 1
            else:
                failures += 1
    
    total_time = (time.time() - start_total) * 1000
    
    if times:
        avg_time = statistics.mean(times)
        median_time = statistics.median(times)
        min_time = min(times)
        max_time = max(times)
        p95_time = statistics.quantiles(times, n=20)[18] if len(times) > 20 else max(times)
        p99_time = statistics.quantiles(times, n=100)[98] if len(times) > 100 else max(times)
        
        print(f"  Success: {successes}/{num_requests}")
        print(f"  Failures: {failures}/{num_requests}")
        print(f"  Total Time: {total_time:.2f}ms")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Median: {median_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        print(f"  P95: {p95_time:.2f}ms")
        print(f"  P99: {p99_time:.2f}ms")
        print(f"  Requests/sec: {num_requests / (total_time / 1000):.2f}")
        
        return {
            "name": name,
            "successes": successes,
            "failures": failures,
            "total_time": total_time,
            "avg_time": avg_time,
            "median_time": median_time,
            "min_time": min_time,
            "max_time": max_time,
            "p95_time": p95_time,
            "p99_time": p99_time,
            "requests_per_sec": num_requests / (total_time / 1000),
            "times": times
        }
    else:
        print(f"  [ERROR] No successful requests")
        return None

def test_individual_overhead():
    """Test overhead of individual security features"""
    print("\n" + "=" * 70)
    print("  Individual Feature Overhead Test")
    print("=" * 70)
    
    results = {}
    
    # Test 1: Baseline (no security)
    print("\n[TEST] Baseline - No Security Headers")
    baseline_times = []
    for _ in range(10):
        start = time.time()
        try:
            requests.get(f"{BASE_URL}/health", timeout=5)
            baseline_times.append((time.time() - start) * 1000)
        except:
            pass
    
    if baseline_times:
        baseline_avg = statistics.mean(baseline_times)
        results["baseline"] = baseline_avg
        print(f"  Average: {baseline_avg:.2f}ms")
    
    # Test 2: With Request ID only
    print("\n[TEST] Request ID Header Only")
    request_id_times = []
    for _ in range(10):
        start = time.time()
        try:
            headers = {"X-Request-ID": str(uuid.uuid4())}
            requests.get(f"{BASE_URL}/health", headers=headers, timeout=5)
            request_id_times.append((time.time() - start) * 1000)
        except:
            pass
    
    if request_id_times:
        request_id_avg = statistics.mean(request_id_times)
        results["request_id"] = request_id_avg
        overhead = request_id_avg - baseline_avg if baseline_times else 0
        print(f"  Average: {request_id_avg:.2f}ms")
        print(f"  Overhead: {overhead:.2f}ms ({overhead/baseline_avg*100:.2f}%)" if baseline_times else "")
    
    # Test 3: With Request Signing
    print("\n[TEST] Request Signing Headers")
    signing_times = []
    for _ in range(10):
        start = time.time()
        try:
            timestamp = int(time.time())
            nonce = str(uuid.uuid4())
            signature = generate_signature("GET", "/health", timestamp, nonce, "")
            headers = {
                "X-Request-Timestamp": str(timestamp),
                "X-Request-Nonce": nonce,
                "X-Request-Signature": signature,
                "X-Request-ID": str(uuid.uuid4())
            }
            requests.get(f"{BASE_URL}/health", headers=headers, timeout=5)
            signing_times.append((time.time() - start) * 1000)
        except:
            pass
    
    if signing_times:
        signing_avg = statistics.mean(signing_times)
        results["signing"] = signing_avg
        overhead = signing_avg - baseline_avg if baseline_times else 0
        print(f"  Average: {signing_avg:.2f}ms")
        print(f"  Overhead: {overhead:.2f}ms ({overhead/baseline_avg*100:.2f}%)" if baseline_times else "")
    
    return results

def check_backend_health():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    """Run performance tests"""
    print("\n" + "=" * 70)
    print("  Security Performance Test")
    print("  Check if security features slow down load time")
    print("=" * 70)
    
    print(f"\nTesting against: {BASE_URL}")
    print(f"Configuration:")
    print(f"  Requests per test: {NUM_REQUESTS}")
    print(f"  Concurrent requests: {CONCURRENT_REQUESTS}")
    
    # Check backend
    print("\n[INFO] Checking backend health...")
    if not check_backend_health():
        print("[WARNING] Backend is not running!")
        print("[INFO] Please start backend with: python main.py")
        print("[INFO] Some tests may fail.\n")
    else:
        print("[OK] Backend is running\n")
    
    # Test individual overhead
    individual_results = test_individual_overhead()
    
    # Test bulk performance
    print("\n" + "=" * 70)
    print("  Bulk Performance Test")
    print("=" * 70)
    
    # Test without security (baseline)
    baseline_result = test_performance(
        make_request_without_security,
        "Baseline (No Security Headers)",
        NUM_REQUESTS,
        CONCURRENT_REQUESTS
    )
    
    # Test with security
    security_result = test_performance(
        make_request_with_security,
        "With Security Headers",
        NUM_REQUESTS,
        CONCURRENT_REQUESTS
    )
    
    # Compare results
    if baseline_result and security_result:
        print("\n" + "=" * 70)
        print("  Performance Comparison")
        print("=" * 70)
        
        avg_overhead = security_result["avg_time"] - baseline_result["avg_time"]
        avg_overhead_pct = (avg_overhead / baseline_result["avg_time"]) * 100
        
        median_overhead = security_result["median_time"] - baseline_result["median_time"]
        median_overhead_pct = (median_overhead / baseline_result["median_time"]) * 100
        
        print(f"\nAverage Response Time:")
        print(f"  Baseline: {baseline_result['avg_time']:.2f}ms")
        print(f"  With Security: {security_result['avg_time']:.2f}ms")
        print(f"  Overhead: {avg_overhead:.2f}ms ({avg_overhead_pct:+.2f}%)")
        
        print(f"\nMedian Response Time:")
        print(f"  Baseline: {baseline_result['median_time']:.2f}ms")
        print(f"  With Security: {security_result['median_time']:.2f}ms")
        print(f"  Overhead: {median_overhead:.2f}ms ({median_overhead_pct:+.2f}%)")
        
        print(f"\nThroughput:")
        print(f"  Baseline: {baseline_result['requests_per_sec']:.2f} req/s")
        print(f"  With Security: {security_result['requests_per_sec']:.2f} req/s")
        throughput_loss = ((baseline_result['requests_per_sec'] - security_result['requests_per_sec']) / baseline_result['requests_per_sec']) * 100
        print(f"  Loss: {throughput_loss:.2f}%")
        
        print(f"\nP95 Response Time:")
        print(f"  Baseline: {baseline_result['p95_time']:.2f}ms")
        print(f"  With Security: {security_result['p95_time']:.2f}ms")
        p95_overhead = security_result['p95_time'] - baseline_result['p95_time']
        print(f"  Overhead: {p95_overhead:.2f}ms")
        
        print(f"\nP99 Response Time:")
        print(f"  Baseline: {baseline_result['p99_time']:.2f}ms")
        print(f"  With Security: {security_result['p99_time']:.2f}ms")
        p99_overhead = security_result['p99_time'] - baseline_result['p99_time']
        print(f"  Overhead: {p99_overhead:.2f}ms")
        
        # Conclusion
        print("\n" + "=" * 70)
        print("  Conclusion")
        print("=" * 70)
        
        if avg_overhead_pct < 5:
            print("[OK] Performance impact is MINIMAL (< 5%)")
            print("    Security features have negligible impact on performance.")
        elif avg_overhead_pct < 10:
            print("[OK] Performance impact is ACCEPTABLE (< 10%)")
            print("    Security features have acceptable impact on performance.")
        elif avg_overhead_pct < 20:
            print("[WARNING] Performance impact is MODERATE (10-20%)")
            print("    Consider optimizing security features.")
        else:
            print("[WARNING] Performance impact is HIGH (> 20%)")
            print("    Security features significantly impact performance.")
        
        print(f"\nRecommendation:")
        if avg_overhead_pct < 10:
            print("  [OK] Security features can be used in production.")
            print("  [OK] Performance impact is acceptable.")
        else:
            print("  [WARNING] Consider optimizing security features.")
            print("  [WARNING] Monitor performance in production.")
    
    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    import sys
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n[INFO] Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[ERROR] Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

