#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def create_admin_user():
    """Create admin user for testing"""
    print("=== CREATING ADMIN USER ===")
    
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
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Admin User",
                "role": "admin"
            }
        }
        
        response = requests.post(admin_url, headers=headers, json=user_data)
        print(f"Create admin user status: {response.status_code}")
        
        if response.status_code == 200:
            user = response.json()
            print(f"Admin user created successfully!")
            print(f"  Email: {user.get('email', 'N/A')}")
            print(f"  ID: {user.get('id', 'N/A')}")
            print(f"  Role: {user.get('user_metadata', {}).get('role', 'N/A')}")
        else:
            print(f"Error creating admin user: {response.text}")
            
    except Exception as e:
        print(f"Create admin user error: {e}")

def test_admin_login():
    """Test admin login"""
    print("\n=== TESTING ADMIN LOGIN ===")
    
    # Supabase configuration
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    try:
        # Test login
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        auth_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(auth_url, headers=headers, json=auth_data)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            auth_result = response.json()
            access_token = auth_result.get("access_token")
            print(f"Login successful!")
            print(f"  Access token: {access_token[:50]}...")
            
            # Test backend API with token
            try:
                backend_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                # Test dashboard API
                dashboard_response = requests.get("http://localhost:8000/api/dashboard/stats", headers=backend_headers)
                print(f"Dashboard API test: {dashboard_response.status_code}")
                
                if dashboard_response.status_code == 200:
                    dashboard_data = dashboard_response.json()
                    print(f"  Dashboard data received successfully!")
                    print(f"    Total Revenue: {dashboard_data.get('totalRevenue', 0)}")
                    print(f"    Total Expenses: {dashboard_data.get('totalExpenses', 0)}")
                    print(f"    Profit/Loss: {dashboard_data.get('profitLoss', 0)}")
                else:
                    print(f"  Dashboard API error: {dashboard_response.text}")
                    
            except Exception as e:
                print(f"  Backend API test error: {e}")
                
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Login test error: {e}")

if __name__ == "__main__":
    create_admin_user()
    test_admin_login()

