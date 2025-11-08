#!/usr/bin/env python3
"""
Script để kiểm tra cấu hình OpenAI API
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Kiểm tra file .env.local"""
    env_file = Path("frontend/.env.local")
    
    if not env_file.exists():
        print("❌ File frontend/.env.local không tồn tại")
        print("📝 Tạo file .env.local với nội dung:")
        print("""
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
""")
        return False
    
        print("File frontend/.env.local ton tai")
    
    # Đọc nội dung file
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'OPENAI_API_KEY' in content:
            if 'sk-' in content and 'your-openai-api-key-here' not in content:
                print("OPENAI_API_KEY da duoc cau hinh")
                return True
            else:
                print("OPENAI_API_KEY chua duoc thay the bang key thuc te")
                print("Hay thay the 'your-openai-api-key-here' bang API key thuc te")
                return False
        else:
            print("OPENAI_API_KEY khong co trong file .env.local")
            return False
            
    except Exception as e:
        print(f"Loi doc file .env.local: {e}")
        return False

def check_api_files():
    """Kiểm tra các file API"""
    api_files = [
        "frontend/src/app/api/expenses/ai-analyze-with-project/route.ts",
        "frontend/src/app/api/expenses/route.ts",
        "frontend/src/components/expenses/AIReceiptUpload.tsx"
    ]
    
    all_exist = True
    for file_path in api_files:
        if Path(file_path).exists():
            print(f"OK {file_path}")
        else:
            print(f"FAIL {file_path} - File khong ton tai")
            all_exist = False
    
    return all_exist

def check_database_schema():
    """Kiểm tra database schema"""
    schema_file = Path("create_project_costs_schema.sql")
    
    if schema_file.exists():
        print("Database schema file ton tai")
        return True
    else:
        print("Database schema file khong ton tai")
        return False

def main():
    """Main function"""
    print("KIEM TRA CAU HINH OPENAI API")
    print("=" * 50)
    
    # Kiểm tra thư mục
    if not Path("frontend").exists():
        print("Khong tim thay thu muc frontend")
        print("Hay chay script tu thu muc goc cua project")
        sys.exit(1)
    
    print("Dang o thu muc project dung")
    
    # Kiểm tra các thành phần
    checks = [
        ("Environment File", check_env_file),
        ("API Files", check_api_files),
        ("Database Schema", check_database_schema)
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
        print("1. Cau hinh OPENAI_API_KEY trong frontend/.env.local")
        print("2. Setup database schema trong Supabase")
        print("3. Test AI receipt analysis")
        print("4. Verify project cost tracking")
    else:
        print("MOT SO KIEM TRA FAIL!")
        print("\nCAN LAM:")
        print("1. Tao file frontend/.env.local")
        print("2. Cau hinh OPENAI_API_KEY")
        print("3. Setup database schema")
        print("4. Chay lai script nay")
    
    print("\nXem huong dan chi tiet: OPENAI_SETUP_GUIDE.md")

if __name__ == "__main__":
    main()
