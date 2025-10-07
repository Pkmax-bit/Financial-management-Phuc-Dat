"""
Script chạy tất cả các test
Tổng hợp kiểm tra toàn bộ hệ thống
"""

import subprocess
import sys
import time
from datetime import datetime

def run_test_script(script_name, description):
    """Chạy một script test"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    
    try:
        start_time = time.time()
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, 
                              text=True, 
                              timeout=300)  # 5 minutes timeout
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️ Thời gian thực hiện: {duration:.2f}s")
        
        if result.returncode == 0:
            print("✅ Test hoàn thành thành công")
            print(result.stdout)
        else:
            print("❌ Test gặp lỗi")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("⏰ Test bị timeout (5 phút)")
        return False
    except Exception as e:
        print(f"❌ Lỗi chạy test: {str(e)}")
        return False

def check_system_requirements():
    """Kiểm tra yêu cầu hệ thống"""
    print("🔍 Kiểm tra yêu cầu hệ thống...")
    
    # Kiểm tra Python version
    python_version = sys.version_info
    if python_version.major >= 3 and python_version.minor >= 8:
        print(f"✅ Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    else:
        print(f"❌ Python version không đủ: {python_version.major}.{python_version.minor}.{python_version.micro}")
        return False
    
    # Kiểm tra các module cần thiết
    required_modules = ['requests', 'supabase', 'dotenv']
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ Module {module}: OK")
        except ImportError:
            print(f"❌ Module {module}: Thiếu")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"❌ Thiếu các module: {', '.join(missing_modules)}")
        print("Chạy: pip install requests supabase python-dotenv")
        return False
    
    return True

def run_all_tests():
    """Chạy tất cả các test"""
    print("🚀 BẮT ĐẦU KIỂM TRA TOÀN BỘ HỆ THỐNG")
    print(f"📅 Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Kiểm tra yêu cầu hệ thống
    if not check_system_requirements():
        print("❌ Không đủ yêu cầu hệ thống. Dừng kiểm tra.")
        return
    
    # Danh sách các test cần chạy
    tests = [
        ("comprehensive_system_check.py", "Kiểm tra toàn diện hệ thống"),
        ("test_specific_functions.py", "Kiểm tra các chức năng cụ thể"),
        ("test_frontend_integration.py", "Kiểm tra tích hợp frontend")
    ]
    
    results = {}
    total_tests = len(tests)
    passed_tests = 0
    
    # Chạy từng test
    for script, description in tests:
        print(f"\n🔄 Đang chạy: {description}")
        success = run_test_script(script, description)
        results[description] = success
        
        if success:
            passed_tests += 1
            print(f"✅ {description}: THÀNH CÔNG")
        else:
            print(f"❌ {description}: THẤT BẠI")
    
    # Tổng kết kết quả
    print("\n" + "=" * 80)
    print("📊 TỔNG KẾT KẾT QUẢ")
    print("=" * 80)
    
    print(f"📈 Tổng số test: {total_tests}")
    print(f"✅ Test thành công: {passed_tests}")
    print(f"❌ Test thất bại: {total_tests - passed_tests}")
    print(f"📊 Tỷ lệ thành công: {(passed_tests/total_tests)*100:.1f}%")
    
    print("\n📋 Chi tiết kết quả:")
    for description, success in results.items():
        status = "✅ THÀNH CÔNG" if success else "❌ THẤT BẠI"
        print(f"   - {description}: {status}")
    
    # Khuyến nghị
    print("\n💡 KHUYẾN NGHỊ:")
    if passed_tests == total_tests:
        print("🎉 Tất cả test đều thành công! Hệ thống hoạt động tốt.")
    elif passed_tests > total_tests // 2:
        print("⚠️ Một số test thất bại. Kiểm tra lại các chức năng có vấn đề.")
    else:
        print("🚨 Nhiều test thất bại. Cần kiểm tra lại cấu hình và code.")
    
    print(f"\n⏰ Hoàn thành lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    run_all_tests()
