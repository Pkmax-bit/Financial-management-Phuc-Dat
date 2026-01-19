"""
Script để apply RLS policy cho bảng projects
"""
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

# Load .env
def load_env_file():
    env_file = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")

load_env_file()

def show_migration_instructions():
    """Hiển thị hướng dẫn apply migration"""
    print("=" * 100)
    print("HƯỚNG DẪN APPLY MIGRATION: THÊM RLS POLICY CHO BẢNG PROJECTS")
    print("=" * 100)
    print()
    
    migration_file = os.path.join(os.path.dirname(__file__), "..", "database", "migrations", "add_projects_insert_policy.sql")
    
    if not os.path.exists(migration_file):
        print(f"❌ Không tìm thấy file migration: {migration_file}")
        return
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print("⚠️  QUAN TRỌNG: Migration này cần được apply trực tiếp trong Supabase")
    print()
    print("CÁCH 1: Qua Supabase Dashboard (KHUYẾN NGHỊ)")
    print("  1. Mở Supabase Dashboard: https://supabase.com/dashboard")
    print("  2. Chọn project của bạn")
    print("  3. Vào SQL Editor (menu bên trái)")
    print("  4. Tạo New Query")
    print("  5. Copy toàn bộ nội dung SQL bên dưới")
    print("  6. Paste vào SQL Editor")
    print("  7. Click 'Run' để execute")
    print()
    print("CÁCH 2: Qua Supabase CLI (nếu đã cài đặt)")
    print("  supabase db push")
    print()
    print("CÁCH 3: Qua psql (nếu có connection string)")
    print(f"  psql <connection_string> -f {migration_file}")
    print()
    print("=" * 100)
    print("NỘI DUNG MIGRATION SQL:")
    print("=" * 100)
    print()
    print(migration_sql)
    print()
    print("=" * 100)
    print()
    print("✅ Sau khi apply migration, bạn sẽ có thể tạo projects mà không gặp lỗi RLS")
    print()

if __name__ == "__main__":
    show_migration_instructions()
