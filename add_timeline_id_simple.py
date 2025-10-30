#!/usr/bin/env python3
"""
Script đơn giản để thêm trường timeline_id vào bảng comments
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Cấu hình Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Thieu cau hinh Supabase. Vui long kiem tra SUPABASE_URL va SUPABASE_SERVICE_KEY")
    sys.exit(1)

# Tạo Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def add_timeline_id_column():
    """Thêm cột timeline_id vào bảng comments"""
    try:
        print("Dang them cot timeline_id vao bang comments...")
        
        # Thêm cột timeline_id bằng cách tạo bảng mới
        print("Tao bang comments_temp...")
        
        # Tạo bảng tạm với cột timeline_id
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS comments_temp (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id UUID REFERENCES comments_temp(id) ON DELETE CASCADE,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID NOT NULL,
            timeline_id UUID REFERENCES project_timeline(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            author_name VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            is_edited BOOLEAN DEFAULT false,
            is_deleted BOOLEAN DEFAULT false,
            deleted_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Thực hiện SQL trực tiếp
        result = supabase.postgrest.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("Tao bang comments_temp thanh cong!")
        
        # Copy dữ liệu từ bảng cũ
        print("Copy du lieu tu bang cu...")
        copy_sql = """
        INSERT INTO comments_temp (
            id, parent_id, entity_type, entity_id, timeline_id, user_id, 
            author_name, content, is_edited, is_deleted, deleted_at, 
            created_at, updated_at
        )
        SELECT 
            id, parent_id, entity_type, entity_id, NULL as timeline_id, 
            user_id, author_name, content, is_edited, is_deleted, deleted_at, 
            created_at, updated_at
        FROM comments;
        """
        
        result = supabase.postgrest.rpc('exec_sql', {'sql': copy_sql}).execute()
        print("Copy du lieu thanh cong!")
        
        # Xóa bảng cũ và đổi tên bảng mới
        print("Xoa bang cu va doi ten bang moi...")
        rename_sql = """
        DROP TABLE IF EXISTS comments CASCADE;
        ALTER TABLE comments_temp RENAME TO comments;
        """
        
        result = supabase.postgrest.rpc('exec_sql', {'sql': rename_sql}).execute()
        print("Doi ten bang thanh cong!")
        
        # Tạo lại các index
        print("Tao lai cac index...")
        indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
        CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_comments_timeline_id ON comments(timeline_id);
        CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
        CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);
        """
        
        result = supabase.postgrest.rpc('exec_sql', {'sql': indexes_sql}).execute()
        print("Tao lai cac index thanh cong!")
        
        return True
        
    except Exception as e:
        print(f"Loi khi them cot timeline_id: {e}")
        return False

def verify_timeline_id_column():
    """Kiểm tra cột timeline_id đã được thêm chưa"""
    try:
        print("Dang kiem tra cot timeline_id...")
        
        # Kiểm tra cấu trúc bảng
        result = supabase.table("comments").select("timeline_id").limit(1).execute()
        
        if result.data is not None:
            print("Cot timeline_id da ton tai!")
            return True
        else:
            print("Cot timeline_id chua ton tai!")
            return False
            
    except Exception as e:
        print(f"Loi khi kiem tra cot timeline_id: {e}")
        return False

def main():
    """Hàm chính"""
    print("Bat dau cap nhat bang comments voi timeline_id...")
    print("=" * 60)
    
    # Kiểm tra cột đã tồn tại chưa
    if verify_timeline_id_column():
        print("Cot timeline_id da ton tai, khong can them!")
        return
    
    # Thêm cột timeline_id
    if add_timeline_id_column():
        print("Hoan thanh cap nhat bang comments!")
    else:
        print("Khong the cap nhat bang comments!")
        sys.exit(1)
    
    print("=" * 60)
    print("Cap nhat thanh cong!")
    print("Bang comments da co truong timeline_id de luu ID cua timeline entry")

if __name__ == "__main__":
    main()





