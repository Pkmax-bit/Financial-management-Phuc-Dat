"""
Script tự động apply RLS policy cho bảng projects qua Supabase REST API
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

def apply_migration():
    """Apply migration qua Supabase REST API (rpc function)"""
    print("=" * 100)
    print("TỰ ĐỘNG APPLY MIGRATION: THÊM RLS POLICY CHO BẢNG PROJECTS")
    print("=" * 100)
    print()
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Chưa cấu hình Supabase credentials!")
        print("   Vui lòng kiểm tra file backend/.env")
        return False
    
    # Đọc migration SQL
    migration_file = os.path.join(os.path.dirname(__file__), "..", "database", "migrations", "add_projects_insert_policy.sql")
    if not os.path.exists(migration_file):
        print(f"❌ Không tìm thấy file migration: {migration_file}")
        return False
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print("📄 Đã đọc migration SQL")
    print()
    
    # Supabase REST API không hỗ trợ chạy SQL trực tiếp
    # Cần dùng PostgREST RPC function hoặc Supabase Dashboard
    # Hoặc có thể dùng Supabase Management API nếu có
    
    # Thử dùng Supabase REST API với rpc function (nếu có)
    # Hoặc tách SQL thành từng câu lệnh nhỏ
    
    # Tách SQL thành các câu lệnh riêng biệt
    sql_statements = []
    current_statement = ""
    
    for line in migration_sql.split('\n'):
        line = line.strip()
        if not line or line.startswith('--'):
            continue
        
        current_statement += line + '\n'
        
        # Kết thúc statement khi gặp dấu ;
        if line.endswith(';'):
            # Bỏ qua phần verification SELECT
            if 'SELECT' in current_statement.upper() and 'pg_policies' in current_statement:
                current_statement = ""
                continue
            
            sql_statements.append(current_statement.strip())
            current_statement = ""
    
    print(f"📝 Đã tách thành {len(sql_statements)} câu lệnh SQL")
    print()
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Thử dùng Supabase Management API hoặc PostgREST
    # Note: Supabase REST API không hỗ trợ DDL trực tiếp
    # Cần dùng Supabase Dashboard hoặc psql
    
    print("⚠️  LƯU Ý: Supabase REST API không hỗ trợ chạy DDL (CREATE POLICY, DROP POLICY)")
    print("   Cần apply migration qua một trong các cách sau:")
    print()
    print("CÁCH 1: Qua Supabase Dashboard (KHUYẾN NGHỊ)")
    print("  1. Mở: https://supabase.com/dashboard")
    print("  2. Chọn project → SQL Editor")
    print("  3. Copy và paste toàn bộ SQL từ file migration")
    print("  4. Click 'Run'")
    print()
    print("CÁCH 2: Qua Supabase CLI")
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
    
    return False

if __name__ == "__main__":
    success = apply_migration()
    if not success:
        print()
        print("💡 TIP: Bạn có thể copy SQL trên và chạy trong Supabase Dashboard")
        print("   Hoặc sử dụng Supabase MCP nếu đã cấu hình access token")
