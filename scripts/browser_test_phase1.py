#!/usr/bin/env python3
"""
Script tự động test Phase 1 bằng browser (Playwright)
Test cả UI và tương tác người dùng
"""

import asyncio
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from playwright.async_api import async_playwright, Page, Browser, BrowserContext
except ImportError:
    print("❌ Playwright chưa được cài đặt!")
    print("💡 Chạy lệnh: pip install playwright")
    print("💡 Sau đó: playwright install chromium")
    exit(1)

# Colors for terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class BrowserTestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.error = None
        self.screenshot = None
        self.duration = 0

class Phase1BrowserTest:
    def __init__(self, base_url: str = "http://localhost:3000", headless: bool = False):
        self.base_url = base_url
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.test_results: list[BrowserTestResult] = []
        self.screenshots_dir = Path("test_screenshots_phase1")
        self.screenshots_dir.mkdir(exist_ok=True)
        
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
    
    async def setup(self):
        """Khởi tạo browser và page"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            slow_mo=500  # Slow down for visibility
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir="test_videos_phase1" if not self.headless else None
        )
        self.page = await self.context.new_page()
        
        # Set longer timeout
        self.page.set_default_timeout(30000)
    
    async def teardown(self):
        """Đóng browser"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
    
    async def take_screenshot(self, name: str) -> str:
        """Chụp screenshot"""
        filename = f"{int(time.time())}_{name.replace(' ', '_')}.png"
        filepath = self.screenshots_dir / filename
        await self.page.screenshot(path=str(filepath))
        return str(filepath)
    
    async def wait_for_page_load(self, timeout: int = 10000):
        """Đợi page load xong"""
        await self.page.wait_for_load_state("networkidle", timeout=timeout)
    
    async def run_test(self, name: str, test_func) -> BrowserTestResult:
        """Chạy một test case"""
        result = BrowserTestResult(name)
        start_time = time.time()
        
        try:
            await test_func(result)
            result.passed = True
        except Exception as e:
            result.passed = False
            result.error = str(e)
            # Chụp screenshot khi có lỗi
            try:
                result.screenshot = await self.take_screenshot(f"error_{name}")
            except:
                pass
        
        result.duration = time.time() - start_time
        self.test_results.append(result)
        return result
    
    # ==================== TEST CASES ====================
    
    async def test_1_1_1_register(self, result: BrowserTestResult):
        """TC 1.1.1: Đăng ký tài khoản mới"""
        timestamp = int(time.time())
        test_email = f"testuser_{timestamp}@example.com"
        
        await self.page.goto(f"{self.base_url}/register")
        await self.wait_for_page_load()
        
        # Điền form đăng ký
        await self.page.fill('input[type="email"]', test_email)
        await self.page.fill('input[type="password"]', "Test123!@#")
        await self.page.fill('input[name="full_name"], input[placeholder*="tên"], input[placeholder*="name"]', f"Nguyễn Văn Test {timestamp}")
        
        # Chọn role nếu có
        role_select = self.page.locator('select[name="role"], select[aria-label*="role"]')
        if await role_select.count() > 0:
            await role_select.select_option("employee")
        
        # Chụp screenshot trước khi submit
        await self.take_screenshot("register_form")
        
        # Submit form
        submit_button = self.page.locator('button[type="submit"], button:has-text("Đăng ký"), button:has-text("Register")')
        await submit_button.click()
        
        # Đợi redirect hoặc thông báo
        await self.page.wait_for_timeout(2000)
        
        # Kiểm tra kết quả
        current_url = self.page.url
        if "/login" in current_url or "/dashboard" in current_url:
            # Đăng ký thành công
            pass
        else:
            # Kiểm tra có thông báo lỗi không
            error_msg = self.page.locator('.error, .text-red-500, [role="alert"]')
            if await error_msg.count() > 0:
                error_text = await error_msg.first.text_content()
                if "error" in error_text.lower() or "lỗi" in error_text.lower():
                    raise Exception(f"Registration failed: {error_text}")
    
    async def test_1_1_2_login(self, result: BrowserTestResult):
        """TC 1.1.2: Đăng nhập"""
        # Giả sử đã có user test, hoặc dùng user vừa tạo
        test_email = "test@example.com"  # Thay bằng email thực tế
        test_password = "Test123!@#"
        
        await self.page.goto(f"{self.base_url}/login")
        await self.wait_for_page_load()
        
        # Điền form đăng nhập
        email_input = self.page.locator('input[type="email"], input[name="email"]')
        password_input = self.page.locator('input[type="password"], input[name="password"]')
        
        await email_input.fill(test_email)
        await password_input.fill(test_password)
        
        await self.take_screenshot("login_form")
        
        # Submit
        submit_button = self.page.locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")')
        await submit_button.click()
        
        # Đợi redirect
        await self.page.wait_for_timeout(3000)
        
        # Kiểm tra đã đăng nhập thành công
        current_url = self.page.url
        if "/login" in current_url:
            # Vẫn ở trang login, có thể có lỗi
            error_msg = self.page.locator('.error, .text-red-500, [role="alert"]')
            if await error_msg.count() > 0:
                error_text = await error_msg.first.text_content()
                raise Exception(f"Login failed: {error_text}")
        elif "/dashboard" in current_url:
            # Đăng nhập thành công
            await self.take_screenshot("login_success")
        else:
            raise Exception(f"Unexpected redirect to: {current_url}")
    
    async def test_1_1_3_login_wrong(self, result: BrowserTestResult):
        """TC 1.1.3: Đăng nhập với thông tin sai"""
        await self.page.goto(f"{self.base_url}/login")
        await self.wait_for_page_load()
        
        # Điền thông tin sai
        email_input = self.page.locator('input[type="email"], input[name="email"]')
        password_input = self.page.locator('input[type="password"], input[name="password"]')
        
        await email_input.fill("wrong@example.com")
        await password_input.fill("WrongPassword123")
        
        submit_button = self.page.locator('button[type="submit"], button:has-text("Đăng nhập")')
        await submit_button.click()
        
        await self.page.wait_for_timeout(2000)
        
        # Kiểm tra có thông báo lỗi
        error_msg = self.page.locator('.error, .text-red-500, [role="alert"], .alert-error')
        if await error_msg.count() == 0:
            raise Exception("Should show error message for wrong credentials")
        
        error_text = await error_msg.first.text_content()
        await self.take_screenshot("login_error")
    
    async def test_1_2_2_list_customers(self, result: BrowserTestResult):
        """TC 1.2.2: Xem danh sách khách hàng"""
        # Cần đăng nhập trước
        await self.test_1_1_2_login(BrowserTestResult("pre-login"))
        
        await self.page.goto(f"{self.base_url}/customers")
        await self.wait_for_page_load()
        
        # Kiểm tra có danh sách khách hàng
        customers_list = self.page.locator('table, .customer-list, [data-testid="customers-list"]')
        if await customers_list.count() == 0:
            # Có thể là empty state
            empty_state = self.page.locator('text=/không có|empty|no customers/i')
            if await empty_state.count() == 0:
                raise Exception("Cannot find customers list")
        
        await self.take_screenshot("customers_list")
    
    async def test_1_2_1_create_customer(self, result: BrowserTestResult):
        """TC 1.2.1: Tạo khách hàng mới"""
        # Đảm bảo đã đăng nhập
        await self.page.goto(f"{self.base_url}/customers")
        await self.wait_for_page_load()
        
        # Tìm nút tạo khách hàng
        create_button = self.page.locator('button:has-text("Tạo"), button:has-text("Create"), button:has-text("Thêm"), [aria-label*="create"]')
        if await create_button.count() == 0:
            raise Exception("Cannot find create customer button")
        
        await create_button.first.click()
        await self.page.wait_for_timeout(1000)
        
        # Điền form
        name_input = self.page.locator('input[name="name"], input[placeholder*="tên"], input[placeholder*="name"]')
        if await name_input.count() > 0:
            await name_input.fill("Công ty ABC Test Browser")
        
        email_input = self.page.locator('input[type="email"], input[name="email"]')
        if await email_input.count() > 0:
            await email_input.fill(f"contact_{int(time.time())}@abc-test.com")
        
        phone_input = self.page.locator('input[name="phone"], input[type="tel"]')
        if await phone_input.count() > 0:
            await phone_input.fill("0901234567")
        
        await self.take_screenshot("create_customer_form")
        
        # Submit
        submit_button = self.page.locator('button[type="submit"], button:has-text("Lưu"), button:has-text("Save")')
        await submit_button.click()
        
        await self.page.wait_for_timeout(2000)
        await self.take_screenshot("customer_created")
    
    async def test_1_4_1_dashboard(self, result: BrowserTestResult):
        """TC 1.4.1: Xem Dashboard"""
        # Đảm bảo đã đăng nhập
        await self.page.goto(f"{self.base_url}/dashboard")
        await self.wait_for_page_load()
        
        # Kiểm tra có các widget
        widgets = self.page.locator('.widget, .card, [class*="stat"]')
        widget_count = await widgets.count()
        
        if widget_count == 0:
            raise Exception("No dashboard widgets found")
        
        await self.take_screenshot("dashboard")
    
    async def test_1_3_2_list_employees(self, result: BrowserTestResult):
        """TC 1.3.2: Xem danh sách nhân viên"""
        await self.page.goto(f"{self.base_url}/employees")
        await self.wait_for_page_load()
        
        # Kiểm tra có danh sách
        employees_list = self.page.locator('table, .employee-list, [data-testid="employees-list"]')
        if await employees_list.count() == 0:
            empty_state = self.page.locator('text=/không có|empty|no employees/i')
            if await empty_state.count() == 0:
                raise Exception("Cannot find employees list")
        
        await self.take_screenshot("employees_list")
    
    async def test_1_1_4_logout(self, result: BrowserTestResult):
        """TC 1.1.4: Đăng xuất"""
        # Tìm nút logout
        logout_button = self.page.locator('button:has-text("Đăng xuất"), button:has-text("Logout"), [aria-label*="logout"]')
        
        if await logout_button.count() == 0:
            # Thử tìm trong menu
            menu_button = self.page.locator('button[aria-label*="menu"], .user-menu, [data-testid="user-menu"]')
            if await menu_button.count() > 0:
                await menu_button.click()
                await self.page.wait_for_timeout(500)
                logout_button = self.page.locator('button:has-text("Đăng xuất"), button:has-text("Logout")')
        
        if await logout_button.count() > 0:
            await logout_button.click()
            await self.page.wait_for_timeout(2000)
            
            # Kiểm tra đã redirect về login
            current_url = self.page.url
            if "/login" not in current_url:
                raise Exception(f"Should redirect to login, but went to: {current_url}")
            
            await self.take_screenshot("logout_success")
        else:
            self.print_warning("Logout button not found, might not be implemented")
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Chạy tất cả test cases"""
        self.print_header("🌐 TỰ ĐỘNG TEST PHASE 1 BẰNG BROWSER")
        
        # Check frontend
        print(f"{Colors.BLUE}🔍 Kiểm tra frontend...{Colors.RESET}")
        try:
            await self.page.goto(self.base_url, timeout=5000)
            self.print_success("Frontend is accessible")
        except Exception as e:
            self.print_error(f"Cannot access frontend: {e}")
            self.print_warning("Hãy chạy: npm run dev:frontend")
            return False
        
        print(f"\n{Colors.BOLD}Bắt đầu test Phase 1 qua browser...{Colors.RESET}\n")
        print(f"{Colors.CYAN}💡 Browser sẽ {'ẩn' if self.headless else 'hiển thị'} trong quá trình test{Colors.RESET}\n")
        
        # Test cases
        test_cases = [
            ("TC 1.1.1: Đăng ký tài khoản", self.test_1_1_1_register),
            ("TC 1.1.2: Đăng nhập", self.test_1_1_2_login),
            ("TC 1.1.3: Đăng nhập sai thông tin", self.test_1_1_3_login_wrong),
            ("TC 1.2.2: Danh sách khách hàng", self.test_1_2_2_list_customers),
            ("TC 1.2.1: Tạo khách hàng", self.test_1_2_1_create_customer),
            ("TC 1.4.1: Dashboard", self.test_1_4_1_dashboard),
            ("TC 1.3.2: Danh sách nhân viên", self.test_1_3_2_list_employees),
            ("TC 1.1.4: Đăng xuất", self.test_1_1_4_logout),
        ]
        
        for name, test_func in test_cases:
            self.print_test(name)
            result = await self.run_test(name, test_func)
            
            if result.passed:
                self.print_success()
            else:
                self.print_error(result.error or "Unknown error")
                if result.screenshot:
                    self.print_info(f"Screenshot: {result.screenshot}")
        
        # Print summary
        await self.print_summary()
        
        return True
    
    async def print_summary(self):
        """In tổng kết"""
        self.print_header("📊 TỔNG KẾT TEST PHASE 1 (BROWSER)")
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r.passed)
        failed = total - passed
        
        print(f"{Colors.BOLD}Tổng số test cases: {total}{Colors.RESET}")
        print(f"{Colors.GREEN}✅ Passed: {passed}{Colors.RESET}")
        print(f"{Colors.RED}❌ Failed: {failed}{Colors.RESET}")
        print(f"{Colors.CYAN}⏱️  Tổng thời gian: {sum(r.duration for r in self.test_results):.2f}s{Colors.RESET}")
        print(f"{Colors.CYAN}📸 Screenshots: {self.screenshots_dir}{Colors.RESET}")
        
        if failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}Chi tiết các test case failed:{Colors.RESET}")
            for result in self.test_results:
                if not result.passed:
                    print(f"  ❌ {result.name}")
                    if result.error:
                        print(f"     Error: {result.error}")
                    if result.screenshot:
                        print(f"     Screenshot: {result.screenshot}")
        
        # Save results
        await self.save_results()
    
    async def save_results(self):
        """Lưu kết quả"""
        results_file = Path("test_results_phase1_browser.json")
        results_data = {
            "timestamp": datetime.now().isoformat(),
            "total": len(self.test_results),
            "passed": sum(1 for r in self.test_results if r.passed),
            "failed": sum(1 for r in self.test_results if not r.passed),
            "screenshots_dir": str(self.screenshots_dir),
            "results": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "error": r.error,
                    "duration": r.duration,
                    "screenshot": r.screenshot
                }
                for r in self.test_results
            ]
        }
        
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n{Colors.CYAN}💾 Kết quả đã được lưu vào: {results_file}{Colors.RESET}")

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Tự động test Phase 1 bằng browser")
    parser.add_argument(
        "--url",
        default="http://localhost:3000",
        help="Frontend URL (default: http://localhost:3000)"
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Chạy browser ở chế độ ẩn (headless)"
    )
    
    args = parser.parse_args()
    
    tester = Phase1BrowserTest(base_url=args.url, headless=args.headless)
    
    try:
        await tester.setup()
        success = await tester.run_all_tests()
    finally:
        await tester.teardown()
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Test đã bị hủy bởi người dùng{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Lỗi không mong đợi: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

