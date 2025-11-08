#!/usr/bin/env python3
"""
Script để thêm trường timeline_id vào bảng comments
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
    print("Thieu cau hinh Supabase. Vui long kiem tra SUPABASE_URL va SUPABASE_ANON_KEY")
    sys.exit(1)

# Tạo Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def add_timeline_id_column():
    """Thêm cột timeline_id vào bảng comments"""
    try:
        print("Dang them cot timeline_id vao bang comments...")
        
        # Thêm cột timeline_id
        result = supabase.rpc('exec_sql', {
            'sql': '''
                ALTER TABLE comments 
                ADD COLUMN IF NOT EXISTS timeline_id UUID REFERENCES project_timeline(id) ON DELETE CASCADE;
            '''
        }).execute()
        
        print("Da them cot timeline_id thanh cong!")
        
        # Thêm index cho timeline_id
        print("Dang them index cho timeline_id...")
        
        index_result = supabase.rpc('exec_sql', {
            'sql': '''
                CREATE INDEX IF NOT EXISTS idx_comments_timeline_id ON comments(timeline_id);
            '''
        }).execute()
        
        print("Da them index cho timeline_id thanh cong!")
        
        # Thêm comment cho cột
        print("Dang them comment cho cot timeline_id...")
        
        comment_result = supabase.rpc('exec_sql', {
            'sql': '''
                COMMENT ON COLUMN comments.timeline_id IS 'ID cua timeline entry ma binh luan thuoc ve';
            '''
        }).execute()
        
        print("Da them comment cho cot timeline_id thanh cong!")
        
        return True
        
    except Exception as e:
        print(f"Loi khi them cot timeline_id: {e}")
        return False

def verify_timeline_id_column():
    """Kiểm tra cột timeline_id đã được thêm chưa"""
    try:
        print("Dang kiem tra cot timeline_id...")
        
        # Kiểm tra cấu trúc bảng
        result = supabase.rpc('exec_sql', {
            'sql': '''
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'comments' 
                AND column_name = 'timeline_id';
            '''
        }).execute()
        
        if result.data:
            print("Cot timeline_id da ton tai!")
            print(f"   - Data type: {result.data[0]['data_type']}")
            print(f"   - Nullable: {result.data[0]['is_nullable']}")
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
