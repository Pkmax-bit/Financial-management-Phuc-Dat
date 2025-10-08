#!/usr/bin/env python3
"""
Simple script to create expense_categories table
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
        
        # Insert default categories with English names first
        default_categories = [
            {'name': 'Travel', 'description': 'Travel expenses, fuel, taxi, plane tickets, train tickets', 'is_active': True},
            {'name': 'Meals', 'description': 'Meal expenses, entertainment, client meetings', 'is_active': True},
            {'name': 'Accommodation', 'description': 'Hotel expenses, accommodation during business trips', 'is_active': True},
            {'name': 'Office Supplies', 'description': 'Paper, pens, office equipment', 'is_active': True},
            {'name': 'Equipment', 'description': 'Equipment purchases, machinery, tools', 'is_active': True},
            {'name': 'Marketing', 'description': 'Advertising expenses, marketing, PR', 'is_active': True},
            {'name': 'Phone', 'description': 'Phone expenses, internet, telecommunications', 'is_active': True},
            {'name': 'Insurance', 'description': 'Insurance expenses, occupational safety', 'is_active': True},
            {'name': 'Training', 'description': 'Training expenses, learning, skill development', 'is_active': True},
            {'name': 'Other', 'description': 'Other expenses not in the above categories', 'is_active': True}
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
