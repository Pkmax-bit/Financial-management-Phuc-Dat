#!/usr/bin/env python3
"""
Script tự động khởi động backend/frontend và chạy test Phase 1
"""

import subprocess
import sys
import time
import requests
import os
import signal
from pathlib import Path
from typing import Optional, List

# Colors
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.CYAN}ℹ️  {message}{Colors.RESET}")

class AutoTestRunner:
    def __init__(self):
        self.backend_process: Optional[subprocess.Popen] = None
        self.frontend_process: Optional[subprocess.Popen] = None
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        
    def check_backend(self) -> bool:
        """Kiểm tra backend có đang chạy không"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def check_frontend(self) -> bool:
        """Kiểm tra frontend có đang chạy không"""
        try:
            response = requests.get(self.frontend_url, timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def start_backend(self) -> bool:
        """Khởi động backend"""
        if self.check_backend():
            print_success("Backend đã đang chạy")
            return True
        
        print_info("Đang khởi động backend...")
        
        try:
            # Kiểm tra xem có venv không
            backend_dir = Path("backend")
            venv_python = backend_dir / "venv" / "bin" / "python"
            if not venv_python.exists():
                venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
            
            if venv_python.exists():
                python_cmd = str(venv_python)
            else:
                python_cmd = sys.executable
            
            # Chạy backend
            self.backend_process = subprocess.Popen(
                [python_cmd, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
                cwd="backend",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
            )
            
            # Đợi backend khởi động
            print_info("Đang đợi backend khởi động...")
            for i in range(30):
                time.sleep(1)
                if self.check_backend():
                    print_success(f"Backend đã khởi động tại {self.backend_url}")
                    return True
                if i % 5 == 0:
                    print(f"   Đã đợi {i} giây...")
            
            print_error("Backend không khởi động sau 30 giây")
            return False
            
        except Exception as e:
            print_error(f"Lỗi khi khởi động backend: {e}")
            return False
    
    def start_frontend(self) -> bool:
        """Khởi động frontend"""
        if self.check_frontend():
            print_success("Frontend đã đang chạy")
            return True
        
        print_info("Đang khởi động frontend...")
        
        try:
            # Chạy frontend
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd="frontend",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                shell=True if sys.platform == "win32" else False,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
            )
            
            # Đợi frontend khởi động
            print_info("Đang đợi frontend khởi động...")
            for i in range(45):
                time.sleep(1)
                if self.check_frontend():
                    print_success(f"Frontend đã khởi động tại {self.frontend_url}")
                    return True
                if i % 5 == 0:
                    print(f"   Đã đợi {i} giây...")
            
            print_error("Frontend không khởi động sau 45 giây")
            return False
            
        except Exception as e:
            print_error(f"Lỗi khi khởi động frontend: {e}")
            return False
    
    def wait_for_services(self, max_wait: int = 60):
        """Đợi cả backend và frontend sẵn sàng"""
        print_info("Đang đợi services sẵn sàng...")
        
        for i in range(max_wait):
            backend_ready = self.check_backend()
            frontend_ready = self.check_frontend()
            
            if backend_ready and frontend_ready:
                print_success("Tất cả services đã sẵn sàng!")
                return True
            
            if i % 5 == 0:
                status = []
                if backend_ready:
                    status.append("Backend ✅")
                else:
                    status.append("Backend ⏳")
                if frontend_ready:
                    status.append("Frontend ✅")
                else:
                    status.append("Frontend ⏳")
                print(f"   {', '.join(status)}")
            
            time.sleep(1)
        
        print_error("Services không sẵn sàng sau thời gian chờ")
        return False
    
    def run_api_test(self) -> bool:
        """Chạy API test"""
        print_header("🧪 CHẠY API TEST")
        
        try:
            result = subprocess.run(
                [sys.executable, "scripts/auto_test_phase1.py"],
                cwd=Path.cwd()
            )
            return result.returncode == 0
        except Exception as e:
            print_error(f"Lỗi khi chạy API test: {e}")
            return False
    
    def run_browser_test(self, headless: bool = False) -> bool:
        """Chạy browser test"""
        print_header("🌐 CHẠY BROWSER TEST")
        
        try:
            cmd = [sys.executable, "scripts/browser_test_phase1.py"]
            if headless:
                cmd.append("--headless")
            
            result = subprocess.run(cmd, cwd=Path.cwd())
            return result.returncode == 0
        except Exception as e:
            print_error(f"Lỗi khi chạy browser test: {e}")
            return False
    
    def cleanup(self):
        """Dọn dẹp processes"""
        print_info("Đang dọn dẹp...")
        
        if self.backend_process:
            try:
                if sys.platform == "win32":
                    self.backend_process.terminate()
                else:
                    self.backend_process.terminate()
                    self.backend_process.wait(timeout=5)
            except:
                try:
                    self.backend_process.kill()
                except:
                    pass
        
        if self.frontend_process:
            try:
                if sys.platform == "win32":
                    self.frontend_process.terminate()
                else:
                    self.frontend_process.terminate()
                    self.frontend_process.wait(timeout=5)
            except:
                try:
                    self.frontend_process.kill()
                except:
                    pass
    
    def run(self, test_type: str = "api", headless: bool = False, keep_running: bool = False):
        """Chạy toàn bộ quy trình"""
        print_header("🚀 TỰ ĐỘNG CHẠY TEST PHASE 1")
        
        try:
            # Kiểm tra và khởi động services
            print_header("📦 KIỂM TRA VÀ KHỞI ĐỘNG SERVICES")
            
            backend_ok = self.start_backend()
            if not backend_ok:
                print_error("Không thể khởi động backend")
                return False
            
            frontend_ok = self.start_frontend()
            if not frontend_ok:
                print_error("Không thể khởi động frontend")
                return False
            
            # Đợi services sẵn sàng
            if not self.wait_for_services():
                return False
            
            # Chạy test
            print_header("🧪 BẮT ĐẦU TEST")
            
            if test_type == "api":
                test_ok = self.run_api_test()
            elif test_type == "browser":
                test_ok = self.run_browser_test(headless=headless)
            elif test_type == "both":
                api_ok = self.run_api_test()
                print("\n")
                browser_ok = self.run_browser_test(headless=headless)
                test_ok = api_ok and browser_ok
            else:
                print_error(f"Loại test không hợp lệ: {test_type}")
                return False
            
            # Tổng kết
            print_header("📊 TỔNG KẾT")
            
            if test_ok:
                print_success("🎉 Tất cả test đã hoàn thành!")
            else:
                print_error("⚠️  Một số test đã fail")
            
            # Giữ services chạy nếu cần
            if keep_running:
                print_info("Services sẽ tiếp tục chạy. Nhấn Ctrl+C để dừng.")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\n")
                    print_info("Đang dừng services...")
            
            return test_ok
            
        except KeyboardInterrupt:
            print("\n")
            print_warning("Đã hủy bởi người dùng")
            return False
        except Exception as e:
            print_error(f"Lỗi không mong đợi: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if not keep_running:
                self.cleanup()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Tự động khởi động services và chạy test Phase 1",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
  # Chạy API test
  python scripts/auto_run_tests.py --type api
  
  # Chạy browser test (hiển thị browser)
  python scripts/auto_run_tests.py --type browser
  
  # Chạy browser test (ẩn browser)
  python scripts/auto_run_tests.py --type browser --headless
  
  # Chạy cả API và browser test
  python scripts/auto_run_tests.py --type both
  
  # Giữ services chạy sau khi test xong
  python scripts/auto_run_tests.py --type api --keep-running
        """
    )
    
    parser.add_argument(
        "--type",
        choices=["api", "browser", "both"],
        default="api",
        help="Loại test để chạy (default: api)"
    )
    
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Chạy browser test ở chế độ ẩn (chỉ áp dụng cho browser test)"
    )
    
    parser.add_argument(
        "--keep-running",
        action="store_true",
        help="Giữ services chạy sau khi test xong (nhấn Ctrl+C để dừng)"
    )
    
    args = parser.parse_args()
    
    runner = AutoTestRunner()
    success = runner.run(
        test_type=args.type,
        headless=args.headless,
        keep_running=args.keep_running
    )
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Đã hủy bởi người dùng{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Lỗi: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)





