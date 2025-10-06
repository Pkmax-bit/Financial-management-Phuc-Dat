#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_pl_report():
    """Test P&L Report API directly"""
    print("=== TESTING P&L REPORT API ===")
    
    # Get authentication token
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    try:
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
        if response.status_code != 200:
            print(f"Authentication failed: {response.text}")
            return
        
        auth_result = response.json()
        access_token = auth_result.get("access_token")
        print("Authentication successful!")
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return
    
    # Test P&L Report API
    api_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test different endpoints
    endpoints = [
        "http://localhost:8000/api/reports/financial/pl",
        "http://localhost:8000/api/reports/pl",
        "http://localhost:8000/api/pl"
    ]
    
    for endpoint in endpoints:
        print(f"\n--- Testing {endpoint} ---")
        try:
            response = requests.get(f"{endpoint}?start_date=2025-01-01&end_date=2025-01-31", headers=api_headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("SUCCESS!")
                print(f"Total Revenue: {data.get('summary', {}).get('total_revenue', 'N/A')}")
                print(f"Total Expenses: {data.get('summary', {}).get('total_expenses', 'N/A')}")
                print(f"Net Income: {data.get('summary', {}).get('net_income', 'N/A')}")
            else:
                print(f"ERROR: {response.text}")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    test_pl_report()



