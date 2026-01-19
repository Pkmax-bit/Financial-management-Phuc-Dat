"""
Script để chạy migration thêm HR_MANAGER role vào database
"""
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
import requests

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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

def run_migration():
    """Chạy migration SQL để thêm HR_MANAGER role"""
    print("=" * 100)
    print("CHẠY MIGRATION: THÊM HR_MANAGER ROLE VÀO DATABASE")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        return
    
    # Đọc migration SQL
    migration_file = os.path.join(os.path.dirname(__file__), "..", "database", "migrations", "add_hr_manager_role.sql")
    if not os.path.exists(migration_file):
        print(f"❌ Không tìm thấy file migration: {migration_file}")
        return
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print("Đang chạy migration SQL...")
    print()
    
    # Chạy SQL qua Supabase REST API (rpc function hoặc direct SQL)
    # Note: Supabase REST API không hỗ trợ chạy SQL trực tiếp, cần dùng Supabase MCP hoặc dashboard
    # Hoặc có thể dùng psql nếu có connection string
    
    print("⚠️  LƯU Ý: Migration này cần chạy trực tiếp trong Supabase SQL Editor hoặc qua psql")
    print()
    print("Cách 1: Chạy trong Supabase Dashboard")
    print("  1. Mở Supabase Dashboard")
    print("  2. Vào SQL Editor")
    print("  3. Copy và paste nội dung file migration:")
    print(f"     {migration_file}")
    print("  4. Chạy SQL")
    print()
    print("Cách 2: Sử dụng Supabase MCP (nếu có)")
    print("  - Sử dụng MCP tool để apply migration")
    print()
    print("Nội dung migration SQL:")
    print("-" * 100)
    print(migration_sql)
    print("-" * 100)
    print()
    print("Sau khi chạy migration, hãy chạy lại script update_lien_role.py")

if __name__ == "__main__":
    run_migration()
