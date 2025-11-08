"""
Script debug dashboard loading issue
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_dashboard_endpoints():
    """Test cac dashboard endpoints"""
    print("TEST DASHBOARD ENDPOINTS")
    print("=" * 50)
    
    # Test login truoc
    print("1. Test login...")
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
    
    # Test dashboard stats
    print("\n2. Test dashboard stats...")
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers)
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("Dashboard stats OK")
            print(f"  - Total Revenue: {data.get('totalRevenue', 0)}")
            print(f"  - Total Expenses: {data.get('totalExpenses', 0)}")
            print(f"  - Cash Balance: {data.get('cashBalance', 0)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Loi dashboard stats: {str(e)}")
    
    # Test cashflow projection
    print("\n3. Test cashflow projection...")
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/api/dashboard/cashflow-projection", headers=headers)
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("Cashflow projection OK")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Loi cashflow projection: {str(e)}")
    
    # Test planner events
    print("\n4. Test planner events...")
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/api/dashboard/planner-events", headers=headers)
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("Planner events OK")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Loi planner events: {str(e)}")
    
    return headers

def test_multiple_requests():
    """Test multiple requests to see if there's caching issue"""
    print("\nTEST MULTIPLE REQUESTS")
    print("=" * 50)
    
    headers = test_dashboard_endpoints()
    if not headers:
        return
    
    # Test multiple requests to same endpoint
    print("\n5. Test multiple requests to dashboard stats...")
    for i in range(3):
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers)
            end_time = time.time()
            
            print(f"Request {i+1}: {response.status_code} - {end_time - start_time:.2f}s")
            
        except Exception as e:
            print(f"Request {i+1} error: {str(e)}")

def test_frontend_dashboard():
    """Test frontend dashboard"""
    print("\nTEST FRONTEND DASHBOARD")
    print("=" * 50)
    
    try:
        # Test truy cap dashboard page
        response = requests.get("http://localhost:3000/dashboard", timeout=10)
        print(f"Dashboard page: {response.status_code}")
        
        if response.status_code == 200:
            print("Dashboard page hoat dong")
            
            # Kiem tra xem co loading issues khong
            content = response.text
            
            # Kiem tra cac script loading
            if "useDashboard" in content:
                print("useDashboard hook co trong trang")
            else:
                print("useDashboard hook KHONG co trong trang")
            
            if "useEffect" in content:
                print("useEffect co trong trang")
            else:
                print("useEffect KHONG co trong trang")
            
            # Kiem tra authentication
            if "checkUser" in content:
                print("checkUser function co trong trang")
            else:
                print("checkUser function KHONG co trong trang")
                
        else:
            print("Dashboard page khong hoat dong")
            
    except Exception as e:
        print(f"Loi truy cap frontend: {str(e)}")

def analyze_loading_issue():
    """Phan tich van de loading"""
    print("\nPHAN TICH VAN DE LOADING")
    print("=" * 50)
    
    print("Cac nguyen nhan co the gay ra loading 2 lan:")
    print("1. Authentication check 2 lan")
    print("2. Data fetching 2 lan")
    print("3. useEffect dependencies thay doi")
    print("4. Component re-render")
    print("5. API calls bi duplicate")
    print("6. Caching issues")
    
    print("\nCac giai phap:")
    print("1. Optimize authentication check")
    print("2. Add loading states")
    print("3. Use useMemo/useCallback")
    print("4. Check useEffect dependencies")
    print("5. Add request deduplication")
    print("6. Implement proper caching")

if __name__ == "__main__":
    print("DEBUG DASHBOARD LOADING ISSUE")
    print("=" * 60)
    
    # Test backend endpoints
    test_dashboard_endpoints()
    
    # Test multiple requests
    test_multiple_requests()
    
    # Test frontend
    test_frontend_dashboard()
    
    # Analyze issue
    analyze_loading_issue()
    
    print("\n" + "=" * 60)
    print("HOAN THANH DEBUG")
    print("=" * 60)
