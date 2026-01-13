#!/usr/bin/env python3
"""
Script to check if checklist items (subtasks) are linked to attachments in task_attachments table.
This script checks:
1. If task_attachments table has checklist_item_id column
2. Which checklist items have attachments linked
3. Which attachments are linked to checklist items vs main task
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table_schema():
    """Check if task_attachments table has checklist_item_id column"""
    print("=" * 80)
    print("1. Checking task_attachments table schema...")
    print("=" * 80)
    
    try:
        # Try to query with checklist_item_id to see if column exists
        result = supabase.table("task_attachments").select("id, task_id, checklist_item_id").limit(1).execute()
        print("✅ task_attachments table has checklist_item_id column")
        return True
    except Exception as e:
        if "column" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ task_attachments table does NOT have checklist_item_id column")
            print("   You need to run the migration: add_checklist_item_id_to_task_attachments.sql")
            return False
        else:
            print(f"⚠️  Error checking schema: {e}")
            return None

def check_attachments_with_checklist_items():
    """Check which attachments are linked to checklist items"""
    print("\n" + "=" * 80)
    print("2. Checking attachments linked to checklist items...")
    print("=" * 80)
    
    try:
        # Get all attachments with checklist_item_id
        result = supabase.table("task_attachments").select("id, task_id, checklist_item_id, file_name, file_url").not_.is_("checklist_item_id", "null").execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} attachment(s) linked to checklist items:")
            for att in result.data:
                print(f"   - Attachment: {att.get('file_name')}")
                print(f"     Task ID: {att.get('task_id')}")
                print(f"     Checklist Item ID: {att.get('checklist_item_id')}")
                print(f"     URL: {att.get('file_url')[:80]}...")
                print()
        else:
            print("⚠️  No attachments are linked to checklist items yet")
            print("   This means files/hình are not being linked when creating subtasks")
        
        return result.data
    except Exception as e:
        print(f"❌ Error checking attachments: {e}")
        return None

def check_attachments_without_checklist_items():
    """Check attachments that are NOT linked to checklist items (belong to main task)"""
    print("\n" + "=" * 80)
    print("3. Checking attachments NOT linked to checklist items (main task attachments)...")
    print("=" * 80)
    
    try:
        # Get all attachments without checklist_item_id
        result = supabase.table("task_attachments").select("id, task_id, checklist_item_id, file_name, file_url").is_("checklist_item_id", "null").limit(20).execute()
        
        if result.data:
            print(f"ℹ️  Found {len(result.data)} attachment(s) NOT linked to checklist items (belong to main task):")
            for att in result.data[:10]:  # Show first 10
                print(f"   - {att.get('file_name')} (Task: {att.get('task_id')})")
            if len(result.data) > 10:
                print(f"   ... and {len(result.data) - 10} more")
        else:
            print("ℹ️  No attachments found (all are linked to checklist items)")
        
        return result.data
    except Exception as e:
        print(f"❌ Error checking attachments: {e}")
        return None

def check_checklist_items_with_attachments():
    """Check which checklist items have attachments"""
    print("\n" + "=" * 80)
    print("4. Checking checklist items and their attachments...")
    print("=" * 80)
    
    try:
        # Get checklist items with their attachments
        result = supabase.table("task_checklist_items").select("id, content, checklist_id").limit(50).execute()
        
        if not result.data:
            print("⚠️  No checklist items found")
            return
        
        print(f"Found {len(result.data)} checklist item(s). Checking attachments...\n")
        
        items_with_attachments = 0
        items_without_attachments = 0
        
        for item in result.data:
            item_id = item.get("id")
            content = item.get("content", "")
            
            # Check if item has attachments linked
            att_result = supabase.table("task_attachments").select("id, file_name").eq("checklist_item_id", item_id).execute()
            
            if att_result.data:
                items_with_attachments += 1
                print(f"✅ Checklist Item: {item_id}")
                print(f"   Content: {content[:60]}...")
                print(f"   Has {len(att_result.data)} linked attachment(s):")
                for att in att_result.data:
                    print(f"     - {att.get('file_name')}")
                print()
            else:
                items_without_attachments += 1
                # Check if content has FILE_URLS
                if "[FILE_URLS:" in content:
                    print(f"⚠️  Checklist Item: {item_id}")
                    print(f"   Content: {content[:60]}...")
                    print(f"   Has FILE_URLS in content but NO linked attachments in task_attachments table")
                    print()
        
        print(f"\nSummary:")
        print(f"  - Checklist items WITH linked attachments: {items_with_attachments}")
        print(f"  - Checklist items WITHOUT linked attachments: {items_without_attachments}")
        
    except Exception as e:
        print(f"❌ Error checking checklist items: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("\n" + "=" * 80)
    print("CHECKLIST ITEM ATTACHMENTS LINKING CHECK")
    print("=" * 80 + "\n")
    
    # Check schema
    has_column = check_table_schema()
    
    if has_column is False:
        print("\n⚠️  Please run the migration first:")
        print("   database/migrations/add_checklist_item_id_to_task_attachments.sql")
        return
    
    if has_column:
        # Check attachments
        check_attachments_with_checklist_items()
        check_attachments_without_checklist_items()
        check_checklist_items_with_attachments()
    
    print("\n" + "=" * 80)
    print("CHECK COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()


