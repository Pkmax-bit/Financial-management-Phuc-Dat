#!/usr/bin/env python3
"""Script đợi backend sẵn sàng rồi chạy test"""
import time
import requests
import subprocess
import sys

def wait_for_backend(max_wait=30):
    """Đợi backend sẵn sàng"""
    print("⏳ Đang đợi backend khởi động...")
    for i in range(max_wait):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                print("✅ Backend đã sẵn sàng!")
                return True
        except:
            pass
        time.sleep(1)
        if i % 5 == 0:
            print(f"   Đã đợi {i} giây...")
    return False

if __name__ == "__main__":
    if not wait_for_backend():
        print("❌ Backend không khởi động sau 30 giây")
        print("💡 Hãy chạy: npm run dev:backend")
        sys.exit(1)
    
    print("\n🚀 Chạy test Phase 1...\n")
    result = subprocess.run([sys.executable, "scripts/auto_test_phase1.py"])
    sys.exit(result.returncode)





