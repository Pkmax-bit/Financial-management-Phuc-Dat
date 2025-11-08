#!/usr/bin/env python3
"""
Script to create expense_categories table and insert default data
"""

import os
import sys
from supabase import create_client, Client

# Supabase configuration
url = "https://kluster.ai"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXN0ZXIuYWkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDk4NzQwMCwiZXhwIjoyMDUwNTYzNDAwfQ.2Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8"

def create_expense_categories_table():
    """Create expense_categories table and insert default data"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(url, key)
        
        print("Creating expense_categories table...")
        
        # SQL to create table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS public.expense_categories (
          id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
          name character varying(100) NOT NULL,
          description text,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
          CONSTRAINT expense_categories_name_key UNIQUE (name)
        ) TABLESPACE pg_default;
        """
        
        # Execute table creation
        result = supabase.rpc('exec_sql', {'sql': create_table_sql})
        print("Table creation result:", result)
        
        # Create indexes
        index_sqls = [
            "CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON public.expense_categories USING btree (is_active) TABLESPACE pg_default;",
            "CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON public.expense_categories USING btree (name) TABLESPACE pg_default;"
        ]
        
        for index_sql in index_sqls:
            result = supabase.rpc('exec_sql', {'sql': index_sql})
            print(f"Index creation result: {result}")
        
        # Insert default categories
        default_categories = [
            {'name': 'Đi lại', 'description': 'Chi phí đi lại, xăng xe, taxi, vé máy bay, tàu hỏa', 'is_active': True},
            {'name': 'Ăn uống', 'description': 'Chi phí ăn uống, tiệc tùng, khách hàng', 'is_active': True},
            {'name': 'Lưu trú', 'description': 'Chi phí khách sạn, nhà nghỉ khi công tác', 'is_active': True},
            {'name': 'Văn phòng phẩm', 'description': 'Giấy, bút, dụng cụ văn phòng', 'is_active': True},
            {'name': 'Thiết bị', 'description': 'Mua sắm thiết bị, máy móc, công cụ', 'is_active': True},
            {'name': 'Marketing', 'description': 'Chi phí quảng cáo, marketing, PR', 'is_active': True},
            {'name': 'Điện thoại', 'description': 'Chi phí điện thoại, internet, viễn thông', 'is_active': True},
            {'name': 'Bảo hiểm', 'description': 'Chi phí bảo hiểm, an toàn lao động', 'is_active': True},
            {'name': 'Đào tạo', 'description': 'Chi phí đào tạo, học tập, phát triển kỹ năng', 'is_active': True},
            {'name': 'Khác', 'description': 'Các chi phí khác không thuộc danh mục trên', 'is_active': True}
        ]
        
        print("Inserting default expense categories...")
        
        for category in default_categories:
            try:
                # Check if category already exists
                existing = supabase.table('expense_categories').select('id').eq('name', category['name']).execute()
                
                if not existing.data:
                    # Insert new category
                    result = supabase.table('expense_categories').insert(category).execute()
                    print(f"Inserted category: {category['name']}")
                else:
                    print(f"Category already exists: {category['name']}")
                    
            except Exception as e:
                print(f"Error inserting category {category['name']}: {e}")
        
        print("Expense categories setup completed successfully!")
        
    except Exception as e:
        print(f"Error setting up expense categories: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_expense_categories_table()
