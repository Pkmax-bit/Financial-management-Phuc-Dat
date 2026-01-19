"""
Script để apply migration fix RLS cho projects table
"""
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os

def read_sql_file():
    """Đọc file SQL migration"""
    sql_file = os.path.join(os.path.dirname(__file__), "..", "database", "migrations", "add_projects_insert_policy.sql")
    if not os.path.exists(sql_file):
        print(f"❌ Không tìm thấy file: {sql_file}")
        return None
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    print("=" * 100)
    print("HƯỚNG DẪN ÁP DỤNG MIGRATION FIX RLS CHO PROJECTS TABLE")
    print("=" * 100)
    print()
    print("Migration này sẽ:")
    print("1. Enable RLS trên bảng projects")
    print("2. Tạo INSERT policy cho authenticated users")
    print("3. Tạo INSERT policy cho service_role (fallback)")
    print("4. Đảm bảo SELECT policy tồn tại")
    print()
    print("CÁCH 1: Sử dụng MCP (nếu có project ID và access token)")
    print("-" * 100)
    print("Sử dụng tool:")
    print("  mcp_supabase-school-management_apply_migration")
    print("  hoặc")
    print("  mcp_supabase-FMPD-system_apply_migration")
    print()
    print("Với parameters:")
    print("  project_id: <project_id_của_bạn>")
    print("  name: fix_projects_rls_policy")
    print("  query: <nội_dung_SQL_bên_dưới>")
    print()
    print("CÁCH 2: Apply qua Supabase Dashboard (KHUYẾN NGHỊ)")
    print("-" * 100)
    print("1. Vào Supabase Dashboard > SQL Editor")
    print("2. Copy toàn bộ SQL bên dưới")
    print("3. Paste và chạy")
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
    main()
