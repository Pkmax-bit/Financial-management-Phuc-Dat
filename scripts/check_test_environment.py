#!/usr/bin/env python3
"""
Script kiểm tra môi trường trước khi test Phase 1
"""

import sys
import requests
import json
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.RESET}")

def check_backend():
    """Kiểm tra backend có đang chạy không"""
    print("\n" + "="*50)
    print("🔍 Kiểm tra Backend...")
    print("="*50)
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend đang chạy tại http://localhost:8000")
            data = response.json()
            print_info(f"  Status: {data.get('status', 'unknown')}")
            print_info(f"  Version: {data.get('version', 'unknown')}")
            return True
        else:
            print_error(f"Backend trả về status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Không thể kết nối đến backend tại http://localhost:8000")
        print_warning("  → Hãy chạy: npm run dev:backend")
        return False
    except Exception as e:
        print_error(f"Lỗi khi kiểm tra backend: {str(e)}")
        return False

def check_frontend():
    """Kiểm tra frontend có đang chạy không"""
    print("\n" + "="*50)
    print("🔍 Kiểm tra Frontend...")
    print("="*50)
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print_success("Frontend đang chạy tại http://localhost:3000")
            return True
        else:
            print_error(f"Frontend trả về status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Không thể kết nối đến frontend tại http://localhost:3000")
        print_warning("  → Hãy chạy: npm run dev:frontend")
        return False
    except Exception as e:
        print_error(f"Lỗi khi kiểm tra frontend: {str(e)}")
        return False

def check_api_docs():
    """Kiểm tra API documentation"""
    print("\n" + "="*50)
    print("🔍 Kiểm tra API Documentation...")
    print("="*50)
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print_success("API Documentation có sẵn tại http://localhost:8000/docs")
            return True
        else:
            print_warning(f"API Documentation trả về status code: {response.status_code}")
            return False
    except Exception as e:
        print_warning(f"Không thể truy cập API Documentation: {str(e)}")
        return False

def check_env_files():
    """Kiểm tra file environment"""
    print("\n" + "="*50)
    print("🔍 Kiểm tra Environment Files...")
    print("="*50)
    
    backend_env = Path("backend/.env")
    frontend_env = Path("frontend/.env.local")
    
    backend_ok = False
    frontend_ok = False
    
    if backend_env.exists():
        print_success("Backend .env file tồn tại")
        backend_ok = True
    else:
        print_error("Backend .env file không tồn tại")
        print_warning("  → Hãy copy: cp backend/env.example backend/.env")
    
    if frontend_env.exists():
        print_success("Frontend .env.local file tồn tại")
        frontend_ok = True
    else:
        print_error("Frontend .env.local file không tồn tại")
        print_warning("  → Hãy copy: cp frontend/env.local.example frontend/.env.local")
    
    return backend_ok and frontend_ok

def check_test_database():
    """Kiểm tra kết nối database (nếu có thể)"""
    print("\n" + "="*50)
    print("🔍 Kiểm tra Database Connection...")
    print("="*50)
    
    try:
        # Thử gọi API cần database
        response = requests.get("http://localhost:8000/api/auth/me", timeout=5)
        # Nếu không có auth, sẽ trả về 401, nhưng ít nhất server đang hoạt động
        if response.status_code in [200, 401, 403]:
            print_success("Database connection có vẻ OK (server phản hồi)")
            return True
        else:
            print_warning(f"Database có thể có vấn đề (status: {response.status_code})")
            return False
    except Exception as e:
        print_warning(f"Không thể kiểm tra database connection: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("🧪 KIỂM TRA MÔI TRƯỜNG TEST PHASE 1")
    print("="*60)
    
    results = {
        "backend": check_backend(),
        "frontend": check_frontend(),
        "api_docs": check_api_docs(),
        "env_files": check_env_files(),
        "database": check_test_database()
    }
    
    print("\n" + "="*60)
    print("📊 TỔNG KẾT")
    print("="*60)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for key, value in results.items():
        status = "✅ PASS" if value else "❌ FAIL"
        print(f"  {key.upper()}: {status}")
    
    print(f"\n  Tổng số kiểm tra: {total}")
    print(f"  Đã pass: {passed}/{total}")
    
    if passed == total:
        print_success("\n🎉 Môi trường đã sẵn sàng để test Phase 1!")
        print_info("\n📖 Hướng dẫn test:")
        print_info("   1. Mở file: docs/TEST_PHASE_1_GUIDE.md")
        print_info("   2. Mở checklist: docs/TEST_CHECKLIST_3_PHASES.md")
        print_info("   3. Bắt đầu test từ Test Case 1.1.1")
        return 0
    else:
        print_error(f"\n⚠️  Có {total - passed} vấn đề cần xử lý trước khi test!")
        print_warning("\n💡 Hướng dẫn khắc phục:")
        print_warning("   1. Kiểm tra lại các lỗi ở trên")
        print_warning("   2. Xem file: docs/SETUP.md")
        print_warning("   3. Chạy lại script này sau khi fix")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Đã hủy kiểm tra.")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n❌ Lỗi không mong đợi: {str(e)}")
        sys.exit(1)








