#!/usr/bin/env python3
"""
Script tự động test Phase 3 - Chi phí, Báo cáo và Tính năng nâng cao
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

class Phase3AutoTest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token: Optional[str] = None
        self.admin_email = "admin@test.com"
        self.admin_password = "123456"
        self.test_results: list[TestResult] = []
        self.created_resources = {
            "expenses": [],
            "expense_objects": [],
            "tasks": []
        }
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
    
    def get_or_create_project(self) -> str:
        """Lấy hoặc tạo project để dùng cho test"""
        if self.project_id:
            return self.project_id
        
        # Lấy project đầu tiên
        response = self.make_request("GET", "/projects?limit=1")
        if response.status_code == 200:
            data = response.json()
            projects = data if isinstance(data, list) else data.get("projects", [])
            if projects:
                self.project_id = projects[0].get("id")
                return self.project_id
        
        raise Exception("No project available")
    
    # ==================== TEST CASES ====================
    
    def test_3_1_1_create_company_expense(self, result: TestResult):
        """TC 3.1.1: Tạo chi phí thường (Company Expense)"""
        # Lấy employee đầu tiên
        emp_response = self.make_request("GET", "/employees?limit=1")
        if emp_response.status_code != 200:
            raise Exception("Cannot get employees")
        
        emp_data = emp_response.json()
        employees = emp_data if isinstance(emp_data, list) else emp_data.get("employees", [])
        if not employees:
            raise Exception("No employees available")
        
        employee_id = employees[0].get("id")
        
        # Generate expense code
        timestamp = int(time.time())
        expense_code = f"EXP{timestamp}"
        
        payload = {
            "employee_id": employee_id,  # Required
            "expense_code": expense_code,  # Required by backend (even though not in ExpenseCreate model)
            "description": f"Mua vật liệu văn phòng Test {timestamp}",
            "amount": 5000000,
            "expense_date": date.today().isoformat(),
            "category": "supplies",  # Must be enum: travel, meals, accommodation, transportation, supplies, equipment, training, other
        }
        
        response = self.make_request("POST", "/expenses/expenses", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            expense_id = data.get("id") or (data.get("expense") and data["expense"].get("id"))
            if expense_id:
                self.created_resources["expenses"].append(expense_id)
                self.print_success(f"Expense created: {expense_id}")
            else:
                raise Exception("Expense created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_1_2_list_expenses(self, result: TestResult):
        """TC 3.1.2: Xem danh sách chi phí"""
        response = self.make_request("GET", "/expenses/expenses?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("expenses", []))
            self.print_success(f"Retrieved {count} expenses")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_1_8_list_expense_objects(self, result: TestResult):
        """TC 3.1.8: Quản lý đối tượng chi phí (Expense Objects)"""
        response = self.make_request("GET", "/expense-objects?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("expense_objects", []))
            self.print_success(f"Retrieved {count} expense objects")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_1_project_detailed_report(self, result: TestResult):
        """TC 3.2.1: Báo cáo dự án chi tiết"""
        project_id = self.get_or_create_project()
        
        # Thử endpoint profitability
        response = self.make_request("GET", f"/reports/projects/profitability?project_id={project_id}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Project profitability report retrieved")
        else:
            # Thử endpoint khác
            response2 = self.make_request("GET", f"/reports/projects/profitability/summary?project_id={project_id}")
            if response2.status_code == 200:
                self.print_success("Project profitability summary retrieved")
            else:
                raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_3_pl_report(self, result: TestResult):
        """TC 3.2.3: Báo cáo P&L (Profit & Loss)"""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()
        
        response = self.make_request("GET", f"/reports/financial/pl?start_date={start_date}&end_date={end_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("P&L report retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_4_balance_sheet(self, result: TestResult):
        """TC 3.2.4: Bảng cân đối kế toán (Balance Sheet)"""
        as_of_date = date.today().isoformat()  # Parameter name is as_of_date, not report_date
        
        response = self.make_request("GET", f"/reports/financial/balance-sheet?as_of_date={as_of_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Balance sheet retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_5_cash_flow(self, result: TestResult):
        """TC 3.2.5: Báo cáo lưu chuyển tiền tệ (Cash Flow)"""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()
        
        response = self.make_request("GET", f"/reports/financial/cash-flow-vietnamese?start_date={start_date}&end_date={end_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Cash flow report retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_6_sales_by_customer(self, result: TestResult):
        """TC 3.2.6: Báo cáo doanh thu theo khách hàng"""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()
        
        response = self.make_request("GET", f"/reports/sales/by-customer?start_date={start_date}&end_date={end_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Sales by customer report retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_7_expenses_by_vendor(self, result: TestResult):
        """TC 3.2.7: Báo cáo chi phí theo nhà cung cấp"""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()
        
        response = self.make_request("GET", f"/reports/expenses/by-vendor?start_date={start_date}&end_date={end_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Expenses by vendor report retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_2_8_general_ledger(self, result: TestResult):
        """TC 3.2.8: Sổ cái tổng hợp (General Ledger)"""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()
        
        response = self.make_request("GET", f"/reports/accountant/general-ledger?start_date={start_date}&end_date={end_date}")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("General ledger retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_3_1_project_timeline(self, result: TestResult):
        """TC 3.3.1: Xem timeline dự án"""
        project_id = self.get_or_create_project()
        
        response = self.make_request("GET", f"/projects/{project_id}/timeline")
        result.response = response
        
        if response.status_code == 200:
            self.print_success("Project timeline retrieved")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_4_1_create_task(self, result: TestResult):
        """TC 3.4.1: Tạo nhiệm vụ mới"""
        project_id = self.get_or_create_project()
        
        payload = {
            "title": f"Kiểm tra chất lượng vật liệu Test {int(time.time())}",
            "description": "Kiểm tra và nghiệm thu vật liệu nhập kho",
            "project_id": project_id,
            "due_date": (date.today() + timedelta(days=7)).isoformat(),
            "priority": "high",
            "status": "todo"
        }
        
        response = self.make_request("POST", "/tasks", json=payload)
        result.response = response
        
        if response.status_code in [200, 201]:
            data = response.json()
            task_id = data.get("id") or (data.get("task") and data["task"].get("id"))
            if task_id:
                self.created_resources["tasks"].append(task_id)
                self.print_success(f"Task created: {task_id}")
            else:
                raise Exception("Task created but no ID returned")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_4_2_list_tasks(self, result: TestResult):
        """TC 3.4.2: Xem danh sách nhiệm vụ"""
        response = self.make_request("GET", "/tasks?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("tasks", []))
            self.print_success(f"Retrieved {count} tasks")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_6_1_list_notifications(self, result: TestResult):
        """TC 3.6.1: Xem danh sách thông báo"""
        response = self.make_request("GET", "/notifications?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("notifications", []))
            self.print_success(f"Retrieved {count} notifications")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_8_1_list_product_categories(self, result: TestResult):
        """TC 3.8.1: Quản lý danh mục sản phẩm"""
        response = self.make_request("GET", "/sales/product-categories?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("categories", []))
            self.print_success(f"Retrieved {count} product categories")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    def test_3_8_2_list_products(self, result: TestResult):
        """TC 3.8.2: Quản lý sản phẩm/dịch vụ"""
        response = self.make_request("GET", "/sales/products?skip=0&limit=10")
        result.response = response
        
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else len(data.get("products", []))
            self.print_success(f"Retrieved {count} products")
        else:
            raise Exception(f"Status {response.status_code}: {response.text}")
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Chạy tất cả test cases"""
        self.print_header("🧪 TỰ ĐỘNG TEST PHASE 3")
        
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
        
        print(f"\n{Colors.BOLD}Bắt đầu test Phase 3...{Colors.RESET}\n")
        
        # Test cases - Tập trung vào các chức năng cốt lõi
        test_cases = [
            # Expense Management
            ("TC 3.1.1: Tạo chi phí thường", self.test_3_1_1_create_company_expense),
            ("TC 3.1.2: Danh sách chi phí", self.test_3_1_2_list_expenses),
            ("TC 3.1.8: Danh sách đối tượng chi phí", self.test_3_1_8_list_expense_objects),
            
            # Reports & Analytics
            ("TC 3.2.1: Báo cáo dự án chi tiết", self.test_3_2_1_project_detailed_report),
            ("TC 3.2.3: Báo cáo P&L", self.test_3_2_3_pl_report),
            ("TC 3.2.4: Bảng cân đối kế toán", self.test_3_2_4_balance_sheet),
            ("TC 3.2.5: Báo cáo lưu chuyển tiền tệ", self.test_3_2_5_cash_flow),
            ("TC 3.2.6: Doanh thu theo khách hàng", self.test_3_2_6_sales_by_customer),
            ("TC 3.2.7: Chi phí theo nhà cung cấp", self.test_3_2_7_expenses_by_vendor),
            ("TC 3.2.8: Sổ cái tổng hợp", self.test_3_2_8_general_ledger),
            
            # Project Timeline
            ("TC 3.3.1: Timeline dự án", self.test_3_3_1_project_timeline),
            
            # Task Management
            ("TC 3.4.1: Tạo nhiệm vụ", self.test_3_4_1_create_task),
            ("TC 3.4.2: Danh sách nhiệm vụ", self.test_3_4_2_list_tasks),
            
            # Notifications
            ("TC 3.6.1: Danh sách thông báo", self.test_3_6_1_list_notifications),
            
            # Products & Services
            ("TC 3.8.1: Danh mục sản phẩm", self.test_3_8_1_list_product_categories),
            ("TC 3.8.2: Danh sách sản phẩm", self.test_3_8_2_list_products),
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
        self.print_header("📊 TỔNG KẾT TEST PHASE 3")
        
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
        results_file = Path("test_results_phase3.json")
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
    
    parser = argparse.ArgumentParser(description="Tự động test Phase 3")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend URL (default: http://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    tester = Phase3AutoTest(base_url=args.url)
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

