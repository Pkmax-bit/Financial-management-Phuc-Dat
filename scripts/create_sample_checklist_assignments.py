#!/usr/bin/env python3
"""
Create sample checklist item assignments for testing
"""

import os
import sys
from datetime import datetime, date, timedelta
import random

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

def get_supabase_client():
    """Get Supabase client"""
    from supabase import create_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        return None

    return create_client(url, key)

def create_sample_assignments():
    """Create sample checklist item assignments"""
    print("Creating sample checklist item assignments...")

    supabase = get_supabase_client()
    if not supabase:
        return False

    try:
        # Get existing checklist items
        checklist_items = supabase.table("task_checklist_items").select("id, checklist_id").execute()
        if not checklist_items.data:
            print("No checklist items found. Please create some tasks with checklists first.")
            return False

        # Get existing employees
        employees = supabase.table("employees").select("id, first_name, last_name").execute()
        if not employees.data:
            print("No employees found. Please create employees first.")
            return False

        print(f"Found {len(checklist_items.data)} checklist items")
        print(f"Found {len(employees.data)} employees")

        # Create assignments for some checklist items
        assignments_created = 0
        responsibility_types = ['accountable', 'responsible', 'consulted', 'informed']

        for item in checklist_items.data[:10]:  # Only assign to first 10 items
            # Randomly assign 1-3 employees per item
            num_assignments = random.randint(1, 3)
            assigned_employees = random.sample(employees.data, min(num_assignments, len(employees.data)))

            for i, employee in enumerate(assigned_employees):
                # Determine responsibility type (first employee is usually accountable/responsible)
                resp_type = responsibility_types[i % len(responsibility_types)]

                assignment_data = {
                    "checklist_item_id": item["id"],
                    "employee_id": employee["id"],
                    "responsibility_type": resp_type
                }

                try:
                    result = supabase.table("task_checklist_item_assignments").insert(assignment_data).execute()
                    if result.data:
                        assignments_created += 1
                        print(f"Created assignment: {employee['first_name']} {employee['last_name']} - {resp_type}")
                except Exception as e:
                    print(f"Error creating assignment: {e}")
                    continue

        print(f"Successfully created {assignments_created} assignments")
        return True

    except Exception as e:
        print(f"Error creating sample assignments: {e}")
        return False

if __name__ == "__main__":
    success = create_sample_assignments()
    if success:
        print("✅ Sample assignments created successfully!")
    else:
        print("❌ Failed to create sample assignments")
        sys.exit(1)


