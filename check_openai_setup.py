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
        print("\n📝 Tạo file .env.local:")
        print("1. Tạo file: frontend/.env.local")
        print("2. Thêm nội dung:")
        print("""
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
""")
        return False
    
    print("✅ File frontend/.env.local tồn tại")
    
    # Đọc nội dung file
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'OPENAI_API_KEY' in content:
            if 'sk-' in content and 'your-openai-api-key-here' not in content:
                print("✅ OPENAI_API_KEY đã được cấu hình")
                return True
            else:
                print("⚠️  OPENAI_API_KEY chưa được thay thế bằng key thực tế")
                print("📝 Hãy thay thế 'your-openai-api-key-here' bằng API key thực tế")
                return False
        else:
            print("❌ OPENAI_API_KEY không có trong file .env.local")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi đọc file .env.local: {e}")
        return False

def check_supabase_config():
    """Kiểm tra cấu hình Supabase"""
    env_file = Path("frontend/.env.local")
    
    if not env_file.exists():
        return False
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        supabase_url = 'NEXT_PUBLIC_SUPABASE_URL' in content
        supabase_key = 'NEXT_PUBLIC_SUPABASE_ANON_KEY' in content
        
        if supabase_url and supabase_key:
            print("✅ Supabase configuration OK")
            return True
        else:
            print("⚠️  Supabase configuration chưa đầy đủ")
            return False
            
    except Exception as e:
        print(f"❌ Lỗi đọc file .env.local: {e}")
        return False

def main():
    """Main function"""
    print("🔍 KIỂM TRA CẤU HÌNH OPENAI API")
    print("=" * 50)
    
    # Kiểm tra thư mục
    if not Path("frontend").exists():
        print("❌ Không tìm thấy thư mục frontend")
        print("📝 Hãy chạy script từ thư mục gốc của project")
        sys.exit(1)
    
    print("✅ Đang ở thư mục project đúng")
    
    # Kiểm tra các thành phần
    checks = [
        ("Environment File", check_env_file),
        ("Supabase Config", check_supabase_config)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n🔍 Kiểm tra {name}:")
        result = check_func()
        results.append((name, result))
    
    # Tổng kết
    print("\n" + "=" * 50)
    print("📊 KẾT QUẢ KIỂM TRA:")
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 TẤT CẢ KIỂM TRA ĐỀU PASS!")
        print("\n📋 BƯỚC TIẾP THEO:")
        print("1. Restart development server: cd frontend && npm run dev")
        print("2. Test AI Image Reader: http://localhost:3000/ai-image-reader")
        print("3. Upload hình ảnh để test AI analysis")
    else:
        print("⚠️  MỘT SỐ KIỂM TRA FAIL!")
        print("\n📋 CẦN LÀM:")
        print("1. Tạo file frontend/.env.local")
        print("2. Cấu hình OPENAI_API_KEY")
        print("3. Cấu hình Supabase credentials")
        print("4. Chạy lại script này")
    
    print("\n🔑 HƯỚNG DẪN LẤY OPENAI API KEY:")
    print("1. Vào: https://platform.openai.com/api-keys")
    print("2. Click 'Create new secret key'")
    print("3. Copy API key (bắt đầu bằng sk-)")
    print("4. Thay thế trong file .env.local")
    print("5. Nạp tiền vào tài khoản OpenAI (tối thiểu $5)")

if __name__ == "__main__":
    main()
