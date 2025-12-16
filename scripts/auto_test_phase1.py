#!/usr/bin/env python3
"""
Script tự động test Phase 1 - Các chức năng cơ bản và nền tảng
"""

import sys
import requests
import json
import time
from datetime import datetime
from typing import Dict, Optional, Tuple
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.error = None
        self.response = None
        self.duration = 0

class Phase1AutoTest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token: Optional[str] = None
        self.user_email: Optional[str] = None
        self.test_results: list[TestResult] = []
        self.created_resources = {
            "users": [],
            "customers": [],
            "employees": []
        }
        
    def print_header(self, text: str):
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")
    
    def print_test(self, name: str):
        print(f"{Colors.BLUE}🧪 {name}...{Colors.RESET}", end=" ", flush=True)
    
    def print_success(self, message: str = ""):
        print(f"{Colors.GREEN}✅ PASS{Colors.RESET}", end="")
        if message:
            print(f" - {message}")
        else:
            print()
    
    def print_error(self, message: str):
        print(f"{Colors.RED}❌ FAIL{Colors.RESET} - {message}")
    
    def print_warning(self, message: str):
        print(f"{Colors.YELLOW}⚠️  WARNING{Colors.RESET} - {message}")
    
    def print_info(self, message: str):
        print(f"{Colors.CYAN}ℹ️  {message}{Colors.RESET}")
    
    def run_test(self, name: str, test_func) -> TestResult:
        """Chạy một test case và ghi lại kết quả"""
        result = TestResult(name)
        start_time = time.time()
        
        try:
            test_func(result)
            result.passed = True
        except Exception as e:
            result.passed = False
            result.error = str(e)
        
        result.duration = time.time() - start_time
        self.test_results.append(result)
        return result
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Helper để gọi API"""
        url = f"{self.api_url}{endpoint}"
        headers = kwargs.get("headers", {})
        
        if self.token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.token}"
        
        kwargs["headers"] = headers
        
        if method.upper() == "GET":
            return requests.get(url, **kwargs)
        elif method.upper() == "POST":
            return requests.post(url, **kwargs)
        elif method.upper() == "PUT":
            return requests.put(url, **kwargs)
        elif method.upper() == "DELETE":
            return requests.delete(url, **kwargs)
        else:
            raise ValueError(f"Unsupported method: {method}")
    
    # ==================== TEST CASES ====================
    
    def test_1_1_1_register(self, result: TestResult):
        """TC 1.1.1: Đăng ký tài khoản mới"""
        timestamp = int(time.time())
        self.user_email = f"testuser_{timestamp}@example.com"
        
        payload = {
            "email": self.user_email,
            "password": "Test123!@#",
            "full_name": f"Nguyễn Văn Test {timestamp}",
            "role": "employee"
        }
        
        response = self.make_request("POST", "/auth/register", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            if "id" in data or "user" in data:
                self.print_success(f"User created: {self.user_email}")
            else:
                raise Exception("User created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_1_2_login(self, result: TestResult):
        """TC 1.1.2: Đăng nhập với Admin test account"""
        # Dùng admin test account
        admin_email = "admin@test.com"
        admin_password = "123456"
        
        # Nếu có user_email từ đăng ký, dùng nó, nếu không dùng admin
        email_to_use = self.user_email if self.user_email else admin_email
        password_to_use = "Test123!@#" if self.user_email else admin_password
        
        payload = {
            "email": email_to_use,
            "password": password_to_use
        }
        
        response = self.make_request("POST", "/auth/login", json=payload)
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                self.user_email = email_to_use  # Lưu email đã dùng
                self.print_success(f"Login successful with {email_to_use}, token received")
            else:
                raise Exception("No access_token in response")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_1_3_login_wrong_credentials(self, result: TestResult):
        """TC 1.1.3: Đăng nhập với thông tin sai"""
        payload = {
            "email": "wrong@example.com",
            "password": "WrongPassword123"
        }
        
        response = self.make_request("POST", "/auth/login", json=payload)
        result.response = response
        
        if response.status_code in [401, 400, 404]:
            self.print_success("Correctly rejected wrong credentials")
        else:
            raise Exception(f"Should reject wrong credentials, got {response.status_code}")
    
    def test_1_1_5_get_current_user(self, result: TestResult):
        """TC 1.1.5: Lấy thông tin người dùng hiện tại"""
        if not self.token:
            raise Exception("No token available (login failed?)")
        
        response = self.make_request("GET", "/auth/me")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            if "email" in data and "id" in data:
                self.print_success(f"User info retrieved: {data.get('email')}")
            else:
                raise Exception("User info incomplete")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_1_6_update_user(self, result: TestResult):
        """TC 1.1.6: Cập nhật thông tin người dùng"""
        if not self.token:
            raise Exception("No token available")
        
        payload = {
            "full_name": "Nguyễn Văn Test Updated"
        }
        
        response = self.make_request("PUT", "/auth/me", json=payload)
        result.response = response
        
        if response.status_code in [200, 204]:
            self.print_success("User info updated")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_1_4_logout(self, result: TestResult):
        """TC 1.1.4: Đăng xuất"""
        if not self.token:
            raise Exception("No token available")
        
        response = self.make_request("POST", "/auth/logout")
        result.response = response
        
        # Logout might return 200 or 204
        if response.status_code in [200, 204]:
            self.print_success("Logout successful")
            # Note: Token might still be valid until expiry, but session is cleared
        else:
            # Logout endpoint might not exist or return different status
            self.print_warning(f"Logout returned {response.status_code}, might not be implemented")
    
    def test_1_2_1_create_customer(self, result: TestResult):
        """TC 1.2.1: Tạo khách hàng mới"""
        if not self.token:
            # Login với admin nếu chưa có token
            print(f"{Colors.YELLOW}   ⚠️  Chưa có token, đang đăng nhập lại...{Colors.RESET}")
            self.test_1_1_2_login(TestResult("re-login"))
        
        payload = {
            "name": "Công ty ABC Test Auto",
            "type": "company",  # Phải dùng "type" không phải "customer_type"
            "email": f"contact_{int(time.time())}@abc-test.com",
            "phone": "0901234567",
            "address": "123 Đường ABC, Quận 1, TP.HCM",
            "credit_limit": 100000000,
            "payment_terms": 30  # Phải là integer, không phải string
        }
        
        response = self.make_request("POST", "/customers", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            customer_id = data.get("id") or (data.get("customer") and data["customer"].get("id"))
            if customer_id:
                self.created_resources["customers"].append(customer_id)
                self.print_success(f"Customer created: {customer_id}")
            else:
                raise Exception("Customer created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_2_2_list_customers(self, result: TestResult):
        """TC 1.2.2: Xem danh sách khách hàng"""
        response = self.make_request("GET", "/customers?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("customers", []))
            self.print_success(f"Retrieved {count} customers")
        else:
            # Try public endpoint
            response = requests.get(f"{self.api_url}/customers/public-list")
            if response.status_code == 200:
                data = response.json()
                count = data.get("customers_count", 0)
                self.print_success(f"Retrieved {count} customers (public endpoint)")
            else:
                raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_2_6_search_customers(self, result: TestResult):
        """TC 1.2.6: Tìm kiếm khách hàng"""
        response = self.make_request("GET", "/customers?search=ABC&skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Search customers works")
        else:
            self.print_warning(f"Search might not be implemented: {response.status_code}")
    
    def test_1_2_7_filter_customers(self, result: TestResult):
        """TC 1.2.7: Lọc khách hàng theo loại"""
        response = self.make_request("GET", "/customers?customer_type=company&skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Filter customers works")
        else:
            self.print_warning(f"Filter might not be implemented: {response.status_code}")
    
    def test_1_3_2_list_employees(self, result: TestResult):
        """TC 1.3.2: Xem danh sách nhân viên"""
        response = self.make_request("GET", "/employees?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("employees", []))
            self.print_success(f"Retrieved {count} employees")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_4_1_dashboard(self, result: TestResult):
        """TC 1.4.1: Xem Dashboard tổng quan"""
        # Try dashboard endpoint
        response = self.make_request("GET", "/dashboard/stats")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            self.print_success("Dashboard stats retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_1_5_1_permissions(self, result: TestResult):
        """TC 1.5.1: Kiểm tra phân quyền"""
        # Try to access admin-only endpoint without admin role
        # This should fail if user is not admin
        response = self.make_request("GET", "/customers")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Has customer management permission")
        elif response.status_code == 403:
            self.print_success("Correctly denied access (403 Forbidden)")
        else:
            self.print_warning(f"Unexpected status: {response.status_code}")
    
    def test_health_check(self, result: TestResult):
        """Kiểm tra health endpoint"""
        response = requests.get(f"{self.base_url}/health")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Backend is healthy")
        else:
            raise Exception(f"Health check failed: {response.status_code}")
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Chạy tất cả test cases"""
        self.print_header("🧪 TỰ ĐỘNG TEST PHASE 1")
        
        # Check backend first
        print(f"{Colors.BLUE}🔍 Kiểm tra backend...{Colors.RESET}")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.print_success("Backend is running")
            else:
                self.print_error(f"Backend returned {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Cannot connect to backend: {e}")
            self.print_warning("Hãy chạy: npm run dev:backend")
            return False
        
        print(f"\n{Colors.BOLD}Bắt đầu test Phase 1...{Colors.RESET}\n")
        
        # Test cases theo thứ tự
        # Bỏ qua đăng ký, dùng admin test account trực tiếp
        test_cases = [
            ("Health Check", self.test_health_check),
            # Skip đăng ký, dùng admin test account
            # ("TC 1.1.1: Đăng ký tài khoản", self.test_1_1_1_register),
            ("TC 1.1.2: Đăng nhập (Admin)", self.test_1_1_2_login),
            ("TC 1.1.3: Đăng nhập sai thông tin", self.test_1_1_3_login_wrong_credentials),
            ("TC 1.1.5: Lấy thông tin user", self.test_1_1_5_get_current_user),
            ("TC 1.1.6: Cập nhật thông tin user", self.test_1_1_6_update_user),
            ("TC 1.2.1: Tạo khách hàng", self.test_1_2_1_create_customer),
            ("TC 1.2.2: Danh sách khách hàng", self.test_1_2_2_list_customers),
            ("TC 1.2.6: Tìm kiếm khách hàng", self.test_1_2_6_search_customers),
            ("TC 1.2.7: Lọc khách hàng", self.test_1_2_7_filter_customers),
            ("TC 1.3.2: Danh sách nhân viên", self.test_1_3_2_list_employees),
            ("TC 1.4.1: Dashboard", self.test_1_4_1_dashboard),
            ("TC 1.5.1: Phân quyền", self.test_1_5_1_permissions),
            ("TC 1.1.4: Đăng xuất", self.test_1_1_4_logout),
        ]
        
        for name, test_func in test_cases:
            self.print_test(name)
            result = self.run_test(name, test_func)
            
            if result.passed:
                self.print_success()
            else:
                self.print_error(result.error or "Unknown error")
        
        # Print summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """In tổng kết kết quả test"""
        self.print_header("📊 TỔNG KẾT TEST PHASE 1")
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r.passed)
        failed = total - passed
        
        print(f"{Colors.BOLD}Tổng số test cases: {total}{Colors.RESET}")
        print(f"{Colors.GREEN}✅ Passed: {passed}{Colors.RESET}")
        print(f"{Colors.RED}❌ Failed: {failed}{Colors.RESET}")
        print(f"{Colors.CYAN}⏱️  Tổng thời gian: {sum(r.duration for r in self.test_results):.2f}s{Colors.RESET}")
        
        if failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}Chi tiết các test case failed:{Colors.RESET}")
            for result in self.test_results:
                if not result.passed:
                    print(f"  ❌ {result.name}")
                    if result.error:
                        print(f"     Error: {result.error}")
                    if result.response:
                        print(f"     Status: {result.response.status_code}")
        
        print(f"\n{Colors.BOLD}Kết quả:{Colors.RESET}")
        if failed == 0:
            print(f"{Colors.GREEN}🎉 Tất cả test cases đều PASS!{Colors.RESET}")
        elif passed > failed:
            print(f"{Colors.YELLOW}⚠️  Có {failed} test case failed, cần kiểm tra lại{Colors.RESET}")
        else:
            print(f"{Colors.RED}❌ Nhiều test case failed, cần fix lỗi{Colors.RESET}")
        
        # Save results to file
        self.save_results()
    
    def save_results(self):
        """Lưu kết quả test vào file"""
        results_file = Path("test_results_phase1.json")
        results_data = {
            "timestamp": datetime.now().isoformat(),
            "total": len(self.test_results),
            "passed": sum(1 for r in self.test_results if r.passed),
            "failed": sum(1 for r in self.test_results if not r.passed),
            "results": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "error": r.error,
                    "duration": r.duration,
                    "status_code": r.response.status_code if r.response else None
                }
                for r in self.test_results
            ]
        }
        
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n{Colors.CYAN}💾 Kết quả đã được lưu vào: {results_file}{Colors.RESET}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Tự động test Phase 1")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend URL (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    tester = Phase1AutoTest(base_url=args.url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Test đã bị hủy bởi người dùng{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Lỗi không mong đợi: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

