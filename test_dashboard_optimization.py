"""
Script test dashboard optimization
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_dashboard_performance():
    """Test dashboard performance"""
    print("TEST DASHBOARD PERFORMANCE")
    print("=" * 50)
    
    # Test login
    print("1. Login...")
    try:
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print(f"Login that bai: {login_response.status_code}")
            return None
        
        token = login_response.json().get("access_token")
        print("Login thanh cong")
        headers = {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"Loi login: {str(e)}")
        return None
    
    # Test dashboard stats performance
    print("\n2. Test dashboard stats performance...")
    times = []
    
    for i in range(3):
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers, timeout=15)
            end_time = time.time()
            
            duration = end_time - start_time
            times.append(duration)
            
            print(f"  Request {i+1}: {response.status_code} - {duration:.2f}s")
            
            if response.status_code == 200:
                data = response.json()
                print(f"    - Total Revenue: {data.get('totalRevenue', 0)}")
                print(f"    - Total Expenses: {data.get('totalExpenses', 0)}")
                print(f"    - Cash Balance: {data.get('cashBalance', 0)}")
            
        except Exception as e:
            print(f"  Request {i+1} error: {str(e)}")
    
    # Calculate average time
    if times:
        avg_time = sum(times) / len(times)
        print(f"\n  Average time: {avg_time:.2f}s")
        
        if avg_time < 2.0:
            print("  Performance: Good (< 2s)")
        elif avg_time < 5.0:
            print("  Performance: Acceptable (2-5s)")
        else:
            print("  Performance: Poor (> 5s)")
    
    return headers

def test_frontend_dashboard():
    """Test frontend dashboard"""
    print("\n3. Test frontend dashboard...")
    
    try:
        # Test truy cap dashboard page
        start_time = time.time()
        response = requests.get("http://localhost:3000/dashboard", timeout=10)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"Dashboard page: {response.status_code} - {duration:.2f}s")
        
        if response.status_code == 200:
            print("Dashboard page hoat dong")
            
            # Kiem tra optimized code
            content = response.text
            
            optimizations = [
                ("useCallback", "useCallback" in content),
                ("useMemo", "useMemo" in content),
                ("useEffect", "useEffect" in content),
                ("checkUser", "checkUser" in content),
                ("isInitialLoading", "isInitialLoading" in content)
            ]
            
            print("\n  Optimizations check:")
            for name, found in optimizations:
                status = "OK" if found else "NO"
                print(f"    {status} {name}: {'Found' if found else 'Not found'}")
            
        else:
            print("Dashboard page khong hoat dong")
            
    except Exception as e:
        print(f"Loi truy cap frontend: {str(e)}")

def test_multiple_dashboard_requests():
    """Test multiple dashboard requests"""
    print("\n4. Test multiple dashboard requests...")
    
    headers = test_dashboard_performance()
    if not headers:
        return
    
    # Test concurrent requests
    import concurrent.futures
    
    def make_request():
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers, timeout=10)
            end_time = time.time()
            return {
                'status': response.status_code,
                'time': end_time - start_time,
                'success': response.status_code == 200
            }
        except Exception as e:
            return {
                'status': 'error',
                'time': 0,
                'success': False,
                'error': str(e)
            }
    
    # Test 3 concurrent requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(make_request) for _ in range(3)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    print("  Concurrent requests results:")
    for i, result in enumerate(results):
        if result['success']:
            print(f"    Request {i+1}: OK {result['status']} - {result['time']:.2f}s")
        else:
            print(f"    Request {i+1}: ERROR {result.get('error', 'Unknown error')}")

def analyze_optimization_results():
    """Phan tich ket qua optimization"""
    print("\n5. PHAN TICH KET QUA OPTIMIZATION")
    print("=" * 50)
    
    print("Cac cai tien da thuc hien:")
    print("1. Optimized user check with useCallback")
    print("2. Single useEffect for initialization")
    print("3. Optimized loading state")
    print("4. Removed duplicate dependencies")
    print("5. Better error handling")
    
    print("\nCac cai tien can them:")
    print("1. Add request deduplication")
    print("2. Implement response caching")
    print("3. Add request timeout")
    print("4. Optimize database queries")
    print("5. Add loading skeletons")
    
    print("\nKet qua mong doi:")
    print("- Dashboard load 1 lan thay vi 2 lan")
    print("- Thoi gian load nhanh hon")
    print("- It re-render hon")
    print("- User experience tot hon")

if __name__ == "__main__":
    print("TEST DASHBOARD OPTIMIZATION")
    print("=" * 60)
    
    # Test performance
    test_dashboard_performance()
    
    # Test frontend
    test_frontend_dashboard()
    
    # Test multiple requests
    test_multiple_dashboard_requests()
    
    # Analyze results
    analyze_optimization_results()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST OPTIMIZATION")
    print("=" * 60)
