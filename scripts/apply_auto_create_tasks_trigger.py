"""
Script để apply migration tạo trigger tự động tạo tasks khi tạo project
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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

def read_sql_file():
    """Đọc file SQL migration"""
    sql_file = os.path.join(os.path.dirname(__file__), "..", "database", "migrations", "auto_create_default_tasks_trigger.sql")
    if not os.path.exists(sql_file):
        print(f"❌ Không tìm thấy file: {sql_file}")
        return None
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        return f.read()

def apply_migration_via_mcp():
    """Hướng dẫn apply migration qua MCP"""
    print("=" * 100)
    print("HƯỚNG DẪN ÁP DỤNG MIGRATION TẠO TRIGGER TỰ ĐỘNG TẠO TASKS")
    print("=" * 100)
    print()
    print("Migration này sẽ tạo một database trigger tự động tạo các nhiệm vụ mẫu")
    print("khi một project được tạo (qua API hoặc trực tiếp qua Supabase REST API).")
    print()
    print("Có 2 cách để apply migration:")
    print()
    print("CÁCH 1: Sử dụng MCP (Model Context Protocol)")
    print("-" * 100)
    print("1. Lấy project ID của Supabase project:")
    print("   - Vào Supabase Dashboard")
    print("   - Vào Settings > General")
    print("   - Copy 'Reference ID' (project ID)")
    print()
    print("2. Sử dụng MCP tool:")
    print("   mcp_supabase-school-management_apply_migration")
    print("   hoặc")
    print("   mcp_supabase-FMPD-system_apply_migration")
    print()
    print("   Với các tham số:")
    print("   - project_id: <project_id_của_bạn>")
    print("   - name: auto_create_default_tasks_trigger")
    print("   - query: <nội_dung_file_SQL>")
    print()
    print("CÁCH 2: Apply trực tiếp qua Supabase Dashboard")
    print("-" * 100)
    print("1. Vào Supabase Dashboard > SQL Editor")
    print("2. Copy nội dung file:")
    print(f"   database/migrations/auto_create_default_tasks_trigger.sql")
    print("3. Paste vào SQL Editor và chạy")
    print()
    print("=" * 100)
    print()
    
    sql_content = read_sql_file()
    if sql_content:
        print("NỘI DUNG SQL MIGRATION:")
        print("=" * 100)
        print(sql_content)
        print("=" * 100)
    else:
        print("❌ Không thể đọc file SQL")

if __name__ == "__main__":
    apply_migration_via_mcp()
