#!/usr/bin/env python3
"""
Script khởi động backend server với network access
Đảm bảo server có thể truy cập từ mobile device qua mạng
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def check_backend_running():
    """Kiểm tra backend có đang chạy không"""
    try:
        response = requests.get('http://192.168.1.25:8000/health', timeout=3)
        return response.status_code == 200
    except:
        return False

def get_local_ip():
    """Lấy IP local của máy"""
    import socket
    try:
        # Kết nối đến một địa chỉ bên ngoài để lấy IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "192.168.1.25"  # Fallback IP

def start_backend():
    """Khởi động backend server"""
    print("🚀 Đang khởi động Financial Management Backend...")
    
    # Kiểm tra backend đã chạy chưa
    if check_backend_running():
        print("✅ Backend đã đang chạy!")
        return True
    
    # Lấy IP local
    local_ip = get_local_ip()
    print(f"📍 IP Local: {local_ip}")
    
    # Đường dẫn đến main.py
    backend_path = Path(__file__).parent / "backend" / "main.py"
    
    if not backend_path.exists():
        print("❌ Không tìm thấy backend/main.py")
        return False
    
    try:
        # Khởi động backend với host 0.0.0.0 để có thể truy cập từ mạng
        print("🔄 Đang khởi động server...")
        process = subprocess.Popen([
            sys.executable, str(backend_path)
        ], cwd=Path(__file__).parent)
        
        # Đợi server khởi động
        print("⏳ Đang đợi server khởi động...")
        for i in range(30):  # Đợi tối đa 30 giây
            time.sleep(1)
            if check_backend_running():
                print("✅ Backend đã khởi động thành công!")
                print(f"🌐 Server URL: http://{local_ip}:8000")
                print(f"📱 Mobile có thể truy cập: http://{local_ip}:8000")
                print(f"📊 API Docs: http://{local_ip}:8000/docs")
                return True
            print(f"⏳ Đang đợi... ({i+1}/30)")
        
        print("❌ Không thể khởi động backend trong 30 giây")
        return False
        
    except Exception as e:
        print(f"❌ Lỗi khi khởi động backend: {e}")
        return False

def test_mobile_access():
    """Test khả năng truy cập từ mobile"""
    print("\n🧪 Testing mobile access...")
    
    try:
        # Test health endpoint
        response = requests.get('http://192.168.1.25:8000/health', timeout=5)
        print(f"✅ Health check: {response.status_code}")
        
        # Test CORS headers
        response = requests.options('http://192.168.1.25:8000/', timeout=5)
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        print(f"✅ CORS Headers: {cors_headers}")
        
        return True
        
    except Exception as e:
        print(f"❌ Mobile access test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🏢 FINANCIAL MANAGEMENT - BACKEND NETWORK STARTUP")
    print("=" * 60)
    
    # Khởi động backend
    if start_backend():
        # Test mobile access
        test_mobile_access()
        
        print("\n" + "=" * 60)
        print("📱 HƯỚNG DẪN CHO MOBILE DEVICE:")
        print("=" * 60)
        print("1. Đảm bảo điện thoại và máy tính cùng mạng WiFi")
        print("2. Truy cập ứng dụng mobile")
        print("3. Cập nhật IP trong app config nếu cần:")
        print("   - AppConfig.java: http://192.168.1.25:8000/api/")
        print("   - NetworkConfig.java: http://192.168.1.25:8000/api/")
        print("4. Nếu vẫn lỗi, kiểm tra firewall Windows")
        print("=" * 60)
        
        # Giữ server chạy
        try:
            print("\n🔄 Server đang chạy... Nhấn Ctrl+C để dừng")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Đang dừng server...")
    else:
        print("❌ Không thể khởi động backend")
        sys.exit(1)