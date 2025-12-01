"""
Script test nhanh quyền truy cập dự án với tài khoản mặc định
Sử dụng khi đã biết thông tin tài khoản
"""

import requests
import json
import os
from typing import Dict, List, Optional

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# Cấu hình tài khoản test (có thể thay đổi)
TEST_ACCOUNTS = [
    {
        "name": "Admin (có quyền tất cả)",
        "email": "admin@test.com",
        "password": "123456",
        "expected_access": "all"  # Admin có quyền tất cả
    },
    {
        "name": "Employee (có trong project_team)",
        "email": "employee@test.com",  # Thay đổi email thực tế
        "password": "123456",
        "expected_access": "limited"  # Chỉ thấy dự án trong project_team
    },
    {
        "name": "Employee (KHÔNG có trong project_team)",
        "email": "employee2@test.com",  # Thay đổi email thực tế
        "password": "123456",
        "expected_access": "none"  # Không thấy dự án nào
    }
]

def login(email: str, password: str) -> Optional[str]:
    """Đăng nhập và lấy token"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except:
        return None

def test_endpoint(token: str, endpoint: str, description: str) -> tuple:
    """Test một endpoint và trả về (status_code, data)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else 1
            return (200, count, "✅")
        elif response.status_code == 403:
            return (403, 0, "❌ 403 Forbidden")
        elif response.status_code == 404:
            return (404, 0, "❌ 404 Not Found")
        else:
            return (response.status_code, 0, f"❌ {response.status_code}")
    except Exception as e:
        return (0, 0, f"❌ Error: {str(e)}")

def test_account(account: Dict):
    """Test một tài khoản"""
    print(f"\n{'='*60}")
    print(f"Test: {account['name']}")
    print(f"Email: {account['email']}")
    print(f"{'='*60}")
    
    token = login(account['email'], account['password'])
    if not token:
        print("❌ Đăng nhập thất bại")
        return
    
    print("✅ Đăng nhập thành công\n")
    
    # Test các endpoints
    endpoints = [
        ("/api/projects/", "Danh sách dự án"),
        ("/api/sales/invoices", "Danh sách hóa đơn"),
        ("/api/sales/quotes", "Danh sách báo giá"),
        ("/api/project-expenses/project-expenses", "Chi phí dự án"),
    ]
    
    results = {}
    for endpoint, desc in endpoints:
        status, count, icon = test_endpoint(token, endpoint, desc)
        results[endpoint] = (status, count)
        print(f"{icon} {desc:30} | Status: {status:3} | Số lượng: {count}")
    
    # Test với một dự án cụ thể (nếu có)
    projects_status, projects_count = results.get("/api/projects/", (0, 0))
    if projects_status == 200 and projects_count > 0:
        # Lấy project_id đầu tiên để test
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{API_BASE_URL}/api/projects/",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                projects = response.json()
                if projects:
                    test_project_id = projects[0].get('id')
                    
                    # Test các endpoint của dự án cụ thể
                    project_endpoints = [
                        (f"/api/projects/{test_project_id}", "Thông tin dự án"),
                        (f"/api/projects/{test_project_id}/financial-summary", "Financial Summary"),
                        (f"/api/projects/{test_project_id}/dashboard", "Dashboard"),
                        (f"/api/projects/{test_project_id}/profitability", "Profitability"),
                    ]
                    
                    print("\n  Test với dự án cụ thể:")
                    for endpoint, desc in project_endpoints:
                        status, count, icon = test_endpoint(token, endpoint, desc)
                        print(f"    {icon} {desc:30} | Status: {status:3}")

def main():
    """Hàm main"""
    print("\n" + "="*60)
    print("KIỂM TRA NHANH QUYỀN TRUY CẬP DỰ ÁN")
    print("="*60)
    print("\n⚠️  Lưu ý: Cần cập nhật email trong TEST_ACCOUNTS để test")
    print("   với tài khoản thực tế trong hệ thống\n")
    
    # Test từng tài khoản
    for account in TEST_ACCOUNTS:
        test_account(account)
    
    print("\n" + "="*60)
    print("KẾT THÚC TEST")
    print("="*60)
    print("\n📊 Phân tích kết quả:")
    print("   - Admin: Phải thấy TẤT CẢ dữ liệu")
    print("   - Employee có trong project_team: Chỉ thấy dự án trong team")
    print("   - Employee KHÔNG có trong project_team: Không thấy dự án nào")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy")
    except Exception as e:
        print(f"\n❌ Lỗi: {str(e)}")

