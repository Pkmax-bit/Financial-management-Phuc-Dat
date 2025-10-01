#!/usr/bin/env python3
"""
Script để test AI Image Reader functionality
"""

import os
import sys
from pathlib import Path

def check_ai_image_reader_files():
    """Kiểm tra các file AI Image Reader"""
    files = [
        "frontend/src/app/ai-image-reader/page.tsx",
        "frontend/src/components/ai/AIAnalysisResults.tsx", 
        "frontend/src/components/ai/ImageUploadArea.tsx",
        "frontend/src/app/api/expenses/ai-analyze-with-project/route.ts",
        "frontend/src/app/api/expenses/route.ts"
    ]
    
    all_exist = True
    print("Kiem tra AI Image Reader files:")
    for file_path in files:
        if Path(file_path).exists():
            print(f"  OK {file_path}")
        else:
            print(f"  FAIL {file_path}")
            all_exist = False
    
    return all_exist

def check_navigation_update():
    """Kiểm tra Navigation đã được cập nhật chưa"""
    nav_file = Path("frontend/src/components/Navigation.tsx")
    
    if not nav_file.exists():
        print("FAIL Navigation.tsx khong ton tai")
        return False
    
    try:
        with open(nav_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'AI Image Reader' in content and '/ai-image-reader' in content:
            print("OK Navigation da duoc cap nhat")
            return True
        else:
            print("FAIL Navigation chua duoc cap nhat")
            return False
    except Exception as e:
        print(f"Loi doc Navigation.tsx: {e}")
        return False

def check_environment_setup():
    """Kiểm tra environment setup"""
    env_file = Path("frontend/.env.local")
    
    if not env_file.exists():
        print("WARNING: frontend/.env.local khong ton tai")
        print("CAN LAM: Tao file .env.local va cau hinh OPENAI_API_KEY")
        return False
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'OPENAI_API_KEY' in content and 'sk-' in content:
            print("OK Environment da duoc cau hinh")
            return True
        else:
            print("WARNING: OPENAI_API_KEY chua duoc cau hinh")
            return False
    except Exception as e:
        print(f"Loi doc .env.local: {e}")
        return False

def main():
    """Main function"""
    print("KIEM TRA AI IMAGE READER")
    print("=" * 50)
    
    # Kiểm tra thư mục
    if not Path("frontend").exists():
        print("FAIL: Khong tim thay thu muc frontend")
        print("Hay chay script tu thu muc goc cua project")
        sys.exit(1)
    
    print("OK: Dang o thu muc project dung")
    
    # Kiểm tra các thành phần
    checks = [
        ("AI Image Reader Files", check_ai_image_reader_files),
        ("Navigation Update", check_navigation_update),
        ("Environment Setup", check_environment_setup)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\nKiem tra {name}:")
        result = check_func()
        results.append((name, result))
    
    # Tổng kết
    print("\n" + "=" * 50)
    print("KET QUA KIEM TRA:")
    
    all_passed = True
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("TAT CA KIEM TRA DEU PASS!")
        print("\nBUOC TIEP THEO:")
        print("1. Chay: cd frontend && npm run dev")
        print("2. Vao: http://localhost:3000/ai-image-reader")
        print("3. Upload hinh anh de test AI analysis")
        print("4. Kiem tra ket qua AI doc du lieu")
    else:
        print("MOT SO KIEM TRA FAIL!")
        print("\nCAN LAM:")
        print("1. Tao file frontend/.env.local")
        print("2. Cau hinh OPENAI_API_KEY")
        print("3. Chay lai script nay")
    
    print("\nTINH NANG AI IMAGE READER:")
    print("- Upload hinh anh tu thiet bi hoac chup anh")
    print("- AI phan tich va trich xuat thong tin")
    print("- Hien thi ket qua voi do tin cay")
    print("- Tu dong tim du an phu hop")
    print("- Chinh sua ket qua truoc khi luu")
    print("- Luu chi phi vao database")
    print("- Xem raw JSON output")

if __name__ == "__main__":
    main()
