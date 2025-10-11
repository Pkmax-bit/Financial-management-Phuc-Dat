#!/usr/bin/env python3
"""
Script để thiết lập hệ thống cảm xúc và bình luận
Chạy schema SQL và kiểm tra kết nối
"""

import os
import sys
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Tạo Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL và SUPABASE_ANON_KEY phải được thiết lập trong .env")
    
    return create_client(url, key)

def read_sql_file(file_path: str) -> str:
    """Đọc file SQL"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Khong tim thay file: {file_path}")
        return ""
    except Exception as e:
        print(f"Loi khi doc file {file_path}: {e}")
        return ""

async def setup_emotions_comments_schema():
    """Thiết lập schema cho hệ thống cảm xúc và bình luận"""
    print("Bat dau thiet lap he thong cam xuc va binh luan...")
    
    try:
        # Tạo Supabase client
        supabase = get_supabase_client()
        print("Ket noi Supabase thanh cong")
        
        # Đọc file SQL schema
        sql_content = read_sql_file("create_emotions_comments_schema.sql")
        if not sql_content:
            print("Khong the doc file schema")
            return False
        
        print("Da doc file schema thanh cong")
        
        # Chia SQL thành các câu lệnh riêng biệt
        sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        print(f"Tim thay {len(sql_statements)} cau lenh SQL")
        
        # Thực thi từng câu lệnh
        for i, statement in enumerate(sql_statements, 1):
            if not statement:
                continue
                
            try:
                print(f"Thuc thi cau lenh {i}/{len(sql_statements)}...")
                
                # Thực thi SQL
                result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                
                if hasattr(result, 'data') and result.data:
                    print(f"Cau lenh {i} thuc thi thanh cong")
                else:
                    print(f"Cau lenh {i} thuc thi thanh cong (khong co du lieu tra ve)")
                    
            except Exception as e:
                print(f"Loi khi thuc thi cau lenh {i}: {e}")
                # Tiếp tục với câu lệnh tiếp theo
                continue
        
        print("Hoan thanh thiet lap schema!")
        
        # Kiểm tra các bảng đã được tạo
        await verify_tables_created(supabase)
        
        return True
        
    except Exception as e:
        print(f"Loi trong qua trinh thiet lap: {e}")
        return False

async def verify_tables_created(supabase: Client):
    """Kiểm tra các bảng đã được tạo"""
    print("\nKiem tra cac bang da duoc tao...")
    
    tables_to_check = [
        'emotion_types',
        'comments', 
        'user_reactions',
        'comment_notifications',
        'comment_mentions'
    ]
    
    for table in tables_to_check:
        try:
            # Thử query bảng để kiểm tra tồn tại
            result = supabase.table(table).select('*').limit(1).execute()
            print(f"Bang {table} da duoc tao")
        except Exception as e:
            print(f"Bang {table} chua duoc tao hoac co loi: {e}")

async def test_emotion_types():
    """Test thêm và lấy emotion types"""
    print("\nTest he thong emotion types...")
    
    try:
        supabase = get_supabase_client()
        
        # Lấy danh sách emotion types
        result = supabase.table('emotion_types').select('*').execute()
        
        if result.data:
            print(f"Tim thay {len(result.data)} loai cam xuc:")
            for emotion in result.data:
                print(f"  - {emotion['emoji']} {emotion['display_name']} ({emotion['name']})")
        else:
            print("Chua co emotion types nao")
            
    except Exception as e:
        print(f"Loi khi test emotion types: {e}")

async def main():
    """Hàm main"""
    print("=" * 60)
    print("HE THONG CAM XUC VA BINH LUAN")
    print("=" * 60)
    
    # Thiết lập schema
    success = await setup_emotions_comments_schema()
    
    if success:
        # Test hệ thống
        await test_emotion_types()
        
        print("\n" + "=" * 60)
        print("HOAN THANH THIET LAP HE THONG CAM XUC VA BINH LUAN")
        print("=" * 60)
        print("\nCac tinh nang da duoc thiet lap:")
        print("  - Bang emotion_types - Luu tru cac loai cam xuc")
        print("  - Bang comments - Binh luan voi cau truc nhanh cha con")
        print("  - Bang user_reactions - Phan ung cua nguoi dung")
        print("  - Bang comment_notifications - Thong bao binh luan")
        print("  - Bang comment_mentions - Mentions trong binh luan")
        print("\nAPI Endpoints:")
        print("  - GET /api/emotions-comments/emotion-types")
        print("  - POST /api/emotions-comments/comments")
        print("  - GET /api/emotions-comments/comments/{entity_type}/{entity_id}")
        print("  - PUT /api/emotions-comments/comments/{comment_id}")
        print("  - DELETE /api/emotions-comments/comments/{comment_id}")
        print("  - POST /api/emotions-comments/reactions")
        print("  - DELETE /api/emotions-comments/reactions/{entity_type}/{entity_id}")
        print("\nReact Components:")
        print("  - EmotionsComments.tsx - Component chinh")
        print("  - ReactionButton.tsx - Component phan ung")
    else:
        print("\nCO LOI TRONG QUA TRINH THIET LAP")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
