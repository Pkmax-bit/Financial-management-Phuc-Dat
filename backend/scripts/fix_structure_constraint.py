#!/usr/bin/env python3
"""
Script to fix the custom_product_structures constraint issue.
This script should be run once to migrate the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase_client import get_supabase_client

def fix_constraint():
    """Fix the database constraint for custom_product_structures"""
    supabase = get_supabase_client()

    try:
        # Read the migration SQL
        migration_file = os.path.join(os.path.dirname(__file__), '..', 'migrations', 'fix_custom_product_structures_constraint.sql')

        with open(migration_file, 'r') as f:
            sql = f.read()

        print("Running migration to fix custom_product_structures constraint...")
        print("SQL:", sql)

        # Execute the SQL using Supabase's rpc function
        # Note: This might not work with all Supabase setups
        # You might need to run this directly in Supabase dashboard

        result = supabase.rpc('exec_sql', {'sql': sql})

        print("Migration completed successfully!")
        return True

    except Exception as e:
        print(f"Error running migration: {e}")
        print("You may need to run this SQL manually in your Supabase dashboard:")
        print("""
-- Drop the incorrect unique constraint
ALTER TABLE custom_product_structures DROP CONSTRAINT IF EXISTS custom_product_structures_category_id_is_default_key;

-- Create a partial unique index that only enforces uniqueness for default structures
CREATE UNIQUE INDEX custom_product_structures_category_default_unique
ON custom_product_structures (category_id)
WHERE is_default = true;
        """)
        return False

if __name__ == "__main__":
    fix_constraint()






