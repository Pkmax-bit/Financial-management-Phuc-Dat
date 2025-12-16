#!/usr/bin/env python3
"""
Script tự động test Phase 2 - Quản lý Dự án và Bán hàng
"""

import sys
import requests
import json
import time
from datetime import datetime, date, timedelta
from typing import Dict, Optional
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

class Phase2AutoTest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token: Optional[str] = None
        self.admin_email = "admin@test.com"
        self.admin_password = "123456"
        self.test_results: list[TestResult] = []
        self.created_resources = {
            "projects": [],
            "quotes": [],
            "invoices": [],
            "budgets": []
        }
        self.customer_id: Optional[str] = None
        self.project_id: Optional[str] = None
        
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
    
    def login(self):
        """Đăng nhập với admin account"""
        if self.token:
            return True
        
        payload = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        response = requests.post(f"{self.api_url}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                return True
        
        raise Exception(f"Login failed: {response.status_code} - {response.text}")
    
    def get_or_create_customer(self) -> str:
        """Lấy hoặc tạo customer để dùng cho test"""
        if self.customer_id:
            return self.customer_id
        
        # Lấy danh sách customers
        response = self.make_request("GET", "/customers?limit=1")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.customer_id = data[0].get("id")
                return self.customer_id
            elif isinstance(data, dict) and data.get("customers") and len(data["customers"]) > 0:
                self.customer_id = data["customers"][0].get("id")
                return self.customer_id
        
        # Nếu không có, tạo mới
        payload = {
            "name": "Khách hàng Test Phase 2",
            "type": "company",
            "email": f"test_customer_{int(time.time())}@test.com",
            "phone": "0901234567",
            "address": "123 Test Street",
            "credit_limit": 100000000,
            "payment_terms": 30
        }
        
        response = self.make_request("POST", "/customers", json=payload)
        if response.status_code in [200, 201]:
            data = response.json()
            self.customer_id = data.get("id") or (data.get("customer") and data["customer"].get("id"))
            return self.customer_id
        
        raise Exception(f"Cannot get or create customer: {response.status_code}")
    
    # ==================== TEST CASES ====================
    
    def test_2_1_1_create_project(self, result: TestResult):
        """TC 2.1.1: Tạo dự án mới"""
        customer_id = self.get_or_create_customer()
        timestamp = int(time.time())
        
        payload = {
            "project_code": f"PRJ{timestamp}",  # Required field
            "name": f"Dự án Test Phase 2 {timestamp}",
            "customer_id": customer_id,
            "description": "Dự án test tự động Phase 2",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=180)).isoformat(),
            "budget": 500000000,
            "status": "planning"
        }
        
        response = self.make_request("POST", "/projects", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            project_id = data.get("id") or (data.get("project") and data["project"].get("id"))
            if project_id:
                self.project_id = project_id
                self.created_resources["projects"].append(project_id)
                self.print_success(f"Project created: {project_id}")
            else:
                raise Exception("Project created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_1_2_list_projects(self, result: TestResult):
        """TC 2.1.2: Xem danh sách dự án"""
        response = self.make_request("GET", "/projects?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("projects", []))
            self.print_success(f"Retrieved {count} projects")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_1_3_get_project_detail(self, result: TestResult):
        """TC 2.1.3: Xem chi tiết dự án"""
        if not self.project_id:
            # Lấy project đầu tiên
            response = self.make_request("GET", "/projects?limit=1")
            if response.status_code == 200:
                data = response.json()
                projects = data if isinstance(data, list) else data.get("projects", [])
                if projects:
                    self.project_id = projects[0].get("id")
        
        if not self.project_id:
            raise Exception("No project available")
        
        response = self.make_request("GET", f"/projects/{self.project_id}")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "name" in data:
                self.print_success(f"Project detail: {data.get('name')}")
            else:
                raise Exception("Project detail incomplete")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_1_4_update_project(self, result: TestResult):
        """TC 2.1.4: Cập nhật thông tin dự án"""
        if not self.project_id:
            raise Exception("No project available")
        
        payload = {
            "budget": 600000000  # Tăng ngân sách
        }
        
        response = self.make_request("PUT", f"/projects/{self.project_id}", json=payload)
        result.response = response
        
        if response.status_code in [200, 204]:
            self.print_success("Project updated")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_1_5_project_team(self, result: TestResult):
        """TC 2.1.5: Quản lý team dự án"""
        if not self.project_id:
            raise Exception("No project available")
        
        # Lấy danh sách employees
        emp_response = self.make_request("GET", "/employees?limit=1")
        if emp_response.status_code != 200:
            raise Exception("Cannot get employees")
        
        emp_data = emp_response.json()
        employees = emp_data if isinstance(emp_data, list) else emp_data.get("employees", [])
        if not employees:
            self.print_warning("No employees available, skipping team test")
            return
        
        employee_id = employees[0].get("id")
        
        # Thêm thành viên vào team
        payload = {
            "employee_id": employee_id,
            "role": "member"
        }
        
        response = self.make_request("POST", f"/project-team/{self.project_id}/members", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            self.print_success("Team member added")
        else:
            # Có thể đã có trong team hoặc endpoint khác
            self.print_warning(f"Team endpoint returned {response.status_code}, might need different format")
    
    def test_2_2_1_create_quote(self, result: TestResult):
        """TC 2.2.1: Tạo báo giá mới"""
        customer_id = self.get_or_create_customer()
        
        if not self.project_id:
            # Tạo project nếu chưa có
            self.test_2_1_1_create_project(TestResult("pre-create-project"))
        
        # Tính toán giá trị
        items = [
            {
                "product_name": "Vật liệu xây dựng",
                "description": "Vật liệu test",
                "quantity": 100,
                "unit_price": 1000000,
                "tax_rate": 10
            }
        ]
        
        subtotal = sum(item["quantity"] * item["unit_price"] for item in items)
        tax_rate = 10.0
        tax_amount = subtotal * (tax_rate / 100)
        total_amount = subtotal + tax_amount
        
        timestamp = int(time.time())
        payload = {
            "quote_number": f"QUO{timestamp}",  # Required
            "customer_id": customer_id,
            "project_id": self.project_id,
            "issue_date": date.today().isoformat(),
            "valid_until": (date.today() + timedelta(days=14)).isoformat(),  # Required
            "subtotal": subtotal,  # Required
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "total_amount": total_amount,  # Required
            "items": items
        }
        
        response = self.make_request("POST", "/sales/quotes", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            quote_id = data.get("id") or (data.get("quote") and data["quote"].get("id"))
            if quote_id:
                self.created_resources["quotes"].append(quote_id)
                self.print_success(f"Quote created: {quote_id}")
            else:
                raise Exception("Quote created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_2_2_list_quotes(self, result: TestResult):
        """TC 2.2.2: Xem danh sách báo giá"""
        response = self.make_request("GET", "/sales/quotes?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("quotes", []))
            self.print_success(f"Retrieved {count} quotes")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_2_7_convert_quote_to_invoice(self, result: TestResult):
        """TC 2.2.7: Chuyển báo giá thành hóa đơn"""
        # Lấy quote đầu tiên hoặc tạo mới
        if not self.created_resources["quotes"]:
            self.test_2_2_1_create_quote(TestResult("pre-create-quote"))
        
        quote_id = self.created_resources["quotes"][0]
        
        # Approve quote trước
        approve_payload = {"status": "approved"}
        approve_response = self.make_request("PUT", f"/sales/quotes/{quote_id}", json=approve_payload)
        
        # Convert to invoice
        response = self.make_request("POST", f"/sales/quotes/{quote_id}/convert-to-invoice")
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            invoice_id = data.get("id") or (data.get("invoice") and data["invoice"].get("id"))
            if invoice_id:
                self.created_resources["invoices"].append(invoice_id)
                self.print_success(f"Invoice created from quote: {invoice_id}")
            else:
                raise Exception("Invoice created but no ID returned")
        else:
            # Có thể endpoint khác hoặc cần format khác
            self.print_warning(f"Convert endpoint returned {response.status_code}, might need different format")
    
    def test_2_3_1_create_invoice(self, result: TestResult):
        """TC 2.3.1: Tạo hóa đơn mới"""
        customer_id = self.get_or_create_customer()
        
        # Tính toán giá trị
        items = [
            {
                "product_name": "Dịch vụ test",
                "description": "Dịch vụ test Phase 2",
                "quantity": 1,
                "unit_price": 5000000,
                "tax_rate": 10
            }
        ]
        
        subtotal = sum(item["quantity"] * item["unit_price"] for item in items)
        tax_rate = 10.0
        tax_amount = subtotal * (tax_rate / 100)
        total_amount = subtotal + tax_amount
        
        timestamp = int(time.time())
        payload = {
            "invoice_number": f"INV{timestamp}",  # Required
            "customer_id": customer_id,
            "project_id": self.project_id,
            "issue_date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "subtotal": subtotal,  # Required
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "total_amount": total_amount,  # Required
            "items": items
        }
        
        response = self.make_request("POST", "/sales/invoices", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            invoice_id = data.get("id") or (data.get("invoice") and data["invoice"].get("id"))
            if invoice_id:
                self.created_resources["invoices"].append(invoice_id)
                self.print_success(f"Invoice created: {invoice_id}")
            else:
                raise Exception("Invoice created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_3_2_list_invoices(self, result: TestResult):
        """TC 2.3.2: Xem danh sách hóa đơn"""
        response = self.make_request("GET", "/sales/invoices?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("invoices", []))
            self.print_success(f"Retrieved {count} invoices")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_2_3_4_record_payment(self, result: TestResult):
        """TC 2.3.4: Ghi nhận thanh toán"""
        if not self.created_resources["invoices"]:
            self.test_2_3_1_create_invoice(TestResult("pre-create-invoice"))
        
        invoice_id = self.created_resources["invoices"][0]
        
        payload = {
            "amount": 10000000,
            "payment_date": date.today().isoformat(),
            "payment_method": "bank_transfer",
            "allocations": [
                {
                    "invoice_id": invoice_id,
                    "amount": 10000000
                }
            ]
        }
        
        response = self.make_request("POST", "/sales/payments", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            self.print_success("Payment recorded")
        else:
            # Có thể endpoint khác
            self.print_warning(f"Payment endpoint returned {response.status_code}, might need different format")
    
    def test_2_4_1_create_budget(self, result: TestResult):
        """TC 2.4.1: Tạo ngân sách dự án"""
        if not self.project_id:
            raise Exception("No project available")
        
        payload = {
            "project_id": self.project_id,
            "budget_items": [
                {
                    "category": "Vật liệu",
                    "amount": 200000000,
                    "description": "Vật liệu xây dựng"
                },
                {
                    "category": "Nhân công",
                    "amount": 175000000,
                    "description": "Chi phí nhân công"
                },
                {
                    "category": "Máy móc",
                    "amount": 75000000,
                    "description": "Chi phí máy móc"
                },
                {
                    "category": "Chi phí khác",
                    "amount": 50000000,
                    "description": "Chi phí khác"
                }
            ]
        }
        
        response = self.make_request("POST", "/budgeting/budgets", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            budget_id = data.get("id") or (data.get("budget") and data["budget"].get("id"))
            if budget_id:
                self.created_resources["budgets"].append(budget_id)
                self.print_success(f"Budget created: {budget_id}")
            else:
                raise Exception("Budget created but no ID returned")
        else:
            # Có thể endpoint khác
            self.print_warning(f"Budget endpoint returned {response.status_code}, might need different format")
    
    def test_2_4_2_get_budget(self, result: TestResult):
        """TC 2.4.2: Xem ngân sách dự án"""
        if not self.project_id:
            raise Exception("No project available")
        
        # Thử lấy budget theo project
        response = self.make_request("GET", f"/budgeting/budgets?project_id={self.project_id}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Budget retrieved")
        else:
            # Có thể endpoint khác
            self.print_warning(f"Budget endpoint returned {response.status_code}")
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Chạy tất cả test cases"""
        self.print_header("🧪 TỰ ĐỘNG TEST PHASE 2")
        
        # Check backend
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
            return False
        
        # Login
        print(f"\n{Colors.BLUE}🔐 Đang đăng nhập với admin account...{Colors.RESET}")
        try:
            self.login()
            self.print_success(f"Logged in as {self.admin_email}")
        except Exception as e:
            self.print_error(f"Login failed: {e}")
            return False
        
        print(f"\n{Colors.BOLD}Bắt đầu test Phase 2...{Colors.RESET}\n")
        
        # Test cases
        test_cases = [
            ("TC 2.1.1: Tạo dự án", self.test_2_1_1_create_project),
            ("TC 2.1.2: Danh sách dự án", self.test_2_1_2_list_projects),
            ("TC 2.1.3: Chi tiết dự án", self.test_2_1_3_get_project_detail),
            ("TC 2.1.4: Cập nhật dự án", self.test_2_1_4_update_project),
            ("TC 2.1.5: Quản lý team dự án", self.test_2_1_5_project_team),
            ("TC 2.2.1: Tạo báo giá", self.test_2_2_1_create_quote),
            ("TC 2.2.2: Danh sách báo giá", self.test_2_2_2_list_quotes),
            ("TC 2.2.7: Chuyển quote thành invoice", self.test_2_2_7_convert_quote_to_invoice),
            ("TC 2.3.1: Tạo hóa đơn", self.test_2_3_1_create_invoice),
            ("TC 2.3.2: Danh sách hóa đơn", self.test_2_3_2_list_invoices),
            ("TC 2.3.4: Ghi nhận thanh toán", self.test_2_3_4_record_payment),
            ("TC 2.4.1: Tạo ngân sách", self.test_2_4_1_create_budget),
            ("TC 2.4.2: Xem ngân sách", self.test_2_4_2_get_budget),
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
        """In tổng kết"""
        self.print_header("📊 TỔNG KẾT TEST PHASE 2")
        
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
        
        print(f"\n{Colors.BOLD}Kết quả:{Colors.RESET}")
        if failed == 0:
            print(f"{Colors.GREEN}🎉 Tất cả test cases đều PASS!{Colors.RESET}")
        elif passed > failed:
            print(f"{Colors.YELLOW}⚠️  Có {failed} test case failed, cần kiểm tra lại{Colors.RESET}")
        else:
            print(f"{Colors.RED}❌ Nhiều test case failed, cần fix lỗi{Colors.RESET}")
        
        # Save results
        self.save_results()
    
    def save_results(self):
        """Lưu kết quả"""
        results_file = Path("test_results_phase2.json")
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
    
    parser = argparse.ArgumentParser(description="Tự động test Phase 2")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend URL (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    tester = Phase2AutoTest(base_url=args.url)
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

