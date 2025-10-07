"""
Script kiểm tra tích hợp frontend
Test các API endpoints mà frontend sử dụng
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_frontend_auth_flow():
    """Test luồng xác thực frontend"""
    print("🔍 Test luồng xác thực frontend...")
    
    try:
        # Test login
        login_data = {
            "email": "admin@test.com",
            "password": "123456"
        }
        
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ Login thành công")
            print(f"   - Token type: {data.get('token_type')}")
            print(f"   - Expires in: {data.get('expires_in')} seconds")
            return token
        else:
            print(f"❌ Login thất bại: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Lỗi test login: {str(e)}")
        return None

def test_dashboard_endpoints(token):
    """Test các endpoints dashboard"""
    print("\n🔍 Test dashboard endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    dashboard_endpoints = [
        ("/api/dashboard/stats", "Dashboard stats"),
        ("/api/dashboard/recent-activities", "Recent activities"),
        ("/api/dashboard/planner-events", "Planner events"),
        ("/api/dashboard/cashflow-projection", "Cashflow projection")
    ]
    
    for endpoint, name in dashboard_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                print(f"✅ {name}: OK")
                data = response.json()
                print(f"   - Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            elif response.status_code == 404:
                print(f"⚠️ {name}: Not implemented")
            else:
                print(f"❌ {name}: Lỗi - {response.status_code}")
                
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def test_employee_management_endpoints(token):
    """Test các endpoints quản lý nhân viên"""
    print("\n🔍 Test employee management endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    employee_endpoints = [
        ("/api/employees/", "Get employees"),
        ("/api/employees/departments", "Get departments"),
        ("/api/employees/positions", "Get positions"),
        ("/api/employees/public", "Public employees")
    ]
    
    for endpoint, name in employee_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: OK")
                if isinstance(data, list):
                    print(f"   - Count: {len(data)}")
                elif isinstance(data, dict):
                    print(f"   - Keys: {list(data.keys())}")
            else:
                print(f"❌ {name}: Lỗi - {response.status_code}")
                
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def test_customer_endpoints(token):
    """Test các endpoints khách hàng"""
    print("\n🔍 Test customer endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    customer_endpoints = [
        ("/api/customers/", "Get customers"),
        ("/api/customers/public", "Public customers")
    ]
    
    for endpoint, name in customer_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: OK")
                if isinstance(data, list):
                    print(f"   - Count: {len(data)}")
            else:
                print(f"❌ {name}: Lỗi - {response.status_code}")
                
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def test_sales_endpoints(token):
    """Test các endpoints bán hàng"""
    print("\n🔍 Test sales endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    sales_endpoints = [
        ("/api/sales/", "Get sales"),
        ("/api/sales/quotes", "Get quotes"),
        ("/api/sales/invoices", "Get invoices"),
        ("/api/sales/receipts", "Get receipts")
    ]
    
    for endpoint, name in sales_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: OK")
                if isinstance(data, list):
                    print(f"   - Count: {len(data)}")
            elif response.status_code == 404:
                print(f"⚠️ {name}: Not implemented")
            else:
                print(f"❌ {name}: Lỗi - {response.status_code}")
                
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def test_reports_endpoints(token):
    """Test các endpoints báo cáo"""
    print("\n🔍 Test reports endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    reports_endpoints = [
        ("/api/reports/balance-sheet", "Balance sheet"),
        ("/api/reports/profit-loss", "Profit & Loss"),
        ("/api/reports/cash-flow", "Cash flow"),
        ("/api/reports/general-ledger", "General ledger")
    ]
    
    for endpoint, name in reports_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: OK")
                if isinstance(data, dict):
                    print(f"   - Keys: {list(data.keys())}")
            elif response.status_code == 404:
                print(f"⚠️ {name}: Not implemented")
            else:
                print(f"❌ {name}: Lỗi - {response.status_code}")
                
        except Exception as e:
            print(f"❌ Lỗi {name}: {str(e)}")

def test_cors_headers():
    """Test CORS headers"""
    print("\n🔍 Test CORS headers...")
    
    try:
        # Test OPTIONS request
        response = requests.options(f"{API_BASE_URL}/api/employees/")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
        }
        
        print("CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"   ✅ {header}: {value}")
            else:
                print(f"   ❌ {header}: Not set")
                
    except Exception as e:
        print(f"❌ Lỗi test CORS: {str(e)}")

def test_api_response_format():
    """Test định dạng response API"""
    print("\n🔍 Test định dạng response API...")
    
    try:
        # Login
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test employees endpoint
            response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    employee = data[0]
                    required_fields = ["id", "employee_code", "first_name", "last_name", "email"]
                    
                    print("Employee data structure:")
                    for field in required_fields:
                        if field in employee:
                            print(f"   ✅ {field}: {employee[field]}")
                        else:
                            print(f"   ❌ {field}: Missing")
                else:
                    print("   ⚠️ No employee data to check")
            else:
                print(f"   ❌ Employees endpoint error: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Lỗi test response format: {str(e)}")

def run_frontend_tests():
    """Chạy tất cả test frontend"""
    print("🚀 BẮT ĐẦU KIỂM TRA TÍCH HỢP FRONTEND")
    print("=" * 60)
    
    # Test auth flow
    token = test_frontend_auth_flow()
    
    if token:
        # Test dashboard
        test_dashboard_endpoints(token)
        
        # Test employee management
        test_employee_management_endpoints(token)
        
        # Test customer endpoints
        test_customer_endpoints(token)
        
        # Test sales endpoints
        test_sales_endpoints(token)
        
        # Test reports endpoints
        test_reports_endpoints(token)
        
        # Test response format
        test_api_response_format()
    
    # Test CORS
    test_cors_headers()
    
    print("\n" + "=" * 60)
    print("🎉 HOÀN THÀNH KIỂM TRA TÍCH HỢP FRONTEND")
    print("=" * 60)

if __name__ == "__main__":
    run_frontend_tests()
