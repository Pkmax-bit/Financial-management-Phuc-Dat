#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
from datetime import datetime, date, timedelta

def check_data_dates():
    """Check data with different date ranges"""
    print("=== CHECKING DATA WITH DIFFERENT DATE RANGES ===")
    
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
    
    # Prepare headers for API calls
    api_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test different date ranges
    date_ranges = [
        ("2024-01-01", "2024-12-31", "2024 Full Year"),
        ("2024-01-01", "2024-06-30", "2024 First Half"),
        ("2024-07-01", "2024-12-31", "2024 Second Half"),
        ("2025-01-01", "2025-12-31", "2025 Full Year"),
        ("2025-01-01", "2025-01-31", "2025 January"),
        ("2025-08-01", "2025-09-30", "2025 Aug-Sep")
    ]
    
    # Test P&L Report with different dates
    print("\n=== TESTING P&L REPORT WITH DIFFERENT DATES ===")
    for start_date, end_date, description in date_ranges:
        print(f"\n--- {description} ({start_date} to {end_date}) ---")
        try:
            url = f"http://localhost:8000/api/reports/financial/pl?start_date={start_date}&end_date={end_date}"
            response = requests.get(url, headers=api_headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                total_revenue = data.get('summary', {}).get('total_revenue', 0)
                total_expenses = data.get('summary', {}).get('total_expenses', 0)
                net_income = data.get('summary', {}).get('net_income', 0)
                print(f"  Total Revenue: {total_revenue}")
                print(f"  Total Expenses: {total_expenses}")
                print(f"  Net Income: {net_income}")
                
                if total_revenue > 0 or total_expenses > 0:
                    print("  ✅ FOUND DATA!")
                    break
            else:
                print(f"  ERROR: {response.text}")
        except Exception as e:
            print(f"  ERROR: {e}")
    
    # Test Balance Sheet with different dates
    print("\n=== TESTING BALANCE SHEET WITH DIFFERENT DATES ===")
    for start_date, end_date, description in date_ranges:
        print(f"\n--- {description} (as_of_date: {end_date}) ---")
        try:
            url = f"http://localhost:8000/api/reports/financial/balance-sheet?as_of_date={end_date}"
            response = requests.get(url, headers=api_headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                total_assets = data.get('summary', {}).get('total_assets', 0)
                total_liabilities = data.get('summary', {}).get('total_liabilities', 0)
                total_equity = data.get('summary', {}).get('total_equity', 0)
                print(f"  Total Assets: {total_assets}")
                print(f"  Total Liabilities: {total_liabilities}")
                print(f"  Total Equity: {total_equity}")
                
                if total_assets > 0 or total_liabilities > 0:
                    print("  ✅ FOUND DATA!")
                    break
            else:
                print(f"  ERROR: {response.text}")
        except Exception as e:
            print(f"  ERROR: {e}")

if __name__ == "__main__":
    check_data_dates()

