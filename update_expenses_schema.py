#!/usr/bin/env python3
"""
Script to add category_id column to expenses table
"""

import os
import sys
from supabase import create_client, Client

# Supabase configuration
url = "https://kluster.ai"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXN0ZXIuYWkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDk4NzQwMCwiZXhwIjoyMDUwNTYzNDAwfQ.2Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8"

def update_expenses_schema():
    """Add category_id column to expenses table"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(url, key)
        
        print("Adding category_id column to expenses table...")
        
        # SQL to add category_id column
        add_column_sql = """
        ALTER TABLE public.expenses 
        ADD COLUMN IF NOT EXISTS category_id uuid;
        """
        
        # Execute column addition
        result = supabase.rpc('exec_sql', {'sql': add_column_sql})
        print("Column addition result:", result)
        
        # Add foreign key constraint
        fk_sql = """
        ALTER TABLE public.expenses 
        ADD CONSTRAINT expenses_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE SET NULL;
        """
        
        result = supabase.rpc('exec_sql', {'sql': fk_sql})
        print("Foreign key constraint result:", result)
        
        # Create index
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_expenses_category_id 
        ON public.expenses USING btree (category_id) 
        TABLESPACE pg_default;
        """
        
        result = supabase.rpc('exec_sql', {'sql': index_sql})
        print("Index creation result:", result)
        
        print("Expenses table schema updated successfully!")
        
    except Exception as e:
        print(f"Error updating expenses schema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_expenses_schema()
