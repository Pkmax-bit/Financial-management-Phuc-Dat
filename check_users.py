#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def check_supabase_users():
    """Check users in Supabase"""
    print("=== CHECKING SUPABASE USERS ===")
    
    # Supabase configuration
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero"
    
    # Check users table
    try:
        users_url = f"{SUPABASE_URL}/rest/v1/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(users_url, headers=headers)
        print(f"Users API Status: {response.status_code}")
        
        if response.status_code == 200:
            users = response.json()
            print(f"Total users: {len(users)}")
            for user in users[:5]:  # Show first 5 users
                print(f"  User: {user.get('email', 'N/A')} - {user.get('id', 'N/A')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Users check error: {e}")
    
    # Check auth.users table
    try:
        auth_users_url = f"{SUPABASE_URL}/rest/v1/auth/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(auth_users_url, headers=headers)
        print(f"Auth Users API Status: {response.status_code}")
        
        if response.status_code == 200:
            auth_users = response.json()
            print(f"Total auth users: {len(auth_users)}")
            for user in auth_users[:5]:  # Show first 5 users
                print(f"  Auth User: {user.get('email', 'N/A')} - {user.get('id', 'N/A')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Auth users check error: {e}")

def create_test_user():
    """Create a test user if none exists"""
    print("\n=== CREATING TEST USER ===")
    
    # Supabase configuration
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero"
    
    try:
        # Create user via admin API
        admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        user_data = {
            "email": "admin@example.com",
            "password": "admin123",
            "email_confirm": True
        }
        
        response = requests.post(admin_url, headers=headers, json=user_data)
        print(f"Create user status: {response.status_code}")
        
        if response.status_code == 200:
            user = response.json()
            print(f"User created: {user.get('email', 'N/A')} - {user.get('id', 'N/A')}")
        else:
            print(f"Error creating user: {response.text}")
            
    except Exception as e:
        print(f"Create user error: {e}")

if __name__ == "__main__":
    check_supabase_users()
    create_test_user()



