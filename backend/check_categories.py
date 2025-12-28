#!/usr/bin/env python3
from services.supabase_client import get_supabase_client

def main():
    supabase = get_supabase_client()
    result = supabase.table('custom_product_categories').select('id, name, is_primary').execute()

    print('Categories in database:')
    for cat in result.data:
        print(f'  ID: {cat["id"][:8]}... - Primary: {cat["is_primary"]}')

if __name__ == "__main__":
    main()
