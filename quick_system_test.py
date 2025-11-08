"""
Script kiểm tra nhanh hệ thống
Test các chức năng cơ bản nhất
"""

import requests
import time

API_BASE_URL = "http://localhost:8000"

def quick_test():
    """Test nhanh các chức năng cơ bản"""
    print("🚀 KIỂM TRA NHANH HỆ THỐNG")
    print("=" * 50)
    
    # 1. Test server có chạy không
    print("🔍 1. Kiểm tra server...")
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Server đang chạy")
        else:
            print(f"❌ Server lỗi: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Không thể kết nối server: {str(e)}")
        return False
    
    # 2. Test login
    print("\n🔍 2. Kiểm tra login...")
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        }, timeout=10)
        
        if response.status_code == 200:
            print("✅ Login thành công")
            token = response.json().get("access_token")
        else:
            print(f"❌ Login thất bại: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Lỗi login: {str(e)}")
        return False
    
    # 3. Test employees endpoint
    print("\n🔍 3. Kiểm tra employees endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Employees endpoint OK - {len(data)} employees")
        else:
            print(f"❌ Employees endpoint lỗi: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Lỗi employees endpoint: {str(e)}")
        return False
    
    # 4. Test departments endpoint
    print("\n🔍 4. Kiểm tra departments endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/departments", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Departments endpoint OK - {len(data)} departments")
        else:
            print(f"❌ Departments endpoint lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi departments endpoint: {str(e)}")
    
    # 5. Test positions endpoint
    print("\n🔍 5. Kiểm tra positions endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/employees/positions", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Positions endpoint OK - {len(data)} positions")
        else:
            print(f"❌ Positions endpoint lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi positions endpoint: {str(e)}")
    
    # 6. Test dashboard endpoint
    print("\n🔍 6. Kiểm tra dashboard endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Dashboard endpoint OK")
        elif response.status_code == 404:
            print("⚠️ Dashboard endpoint chưa implement")
        else:
            print(f"❌ Dashboard endpoint lỗi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi dashboard endpoint: {str(e)}")
    
    # 7. Test response time
    print("\n🔍 7. Kiểm tra thời gian phản hồi...")
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=10)
        end_time = time.time()
        
        response_time = end_time - start_time
        print(f"✅ Thời gian phản hồi: {response_time:.2f}s")
        
        if response_time > 5:
            print("⚠️ Thời gian phản hồi chậm (>5s)")
        elif response_time > 2:
            print("⚠️ Thời gian phản hồi hơi chậm (>2s)")
        else:
            print("✅ Thời gian phản hồi tốt (<2s)")
            
    except Exception as e:
        print(f"❌ Lỗi test response time: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 HOÀN THÀNH KIỂM TRA NHANH")
    print("=" * 50)
    return True

if __name__ == "__main__":
    quick_test()
