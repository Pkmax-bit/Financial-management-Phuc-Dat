#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

def test_supabase_auth():
    """Test Supabase authentication"""
    print("=== TESTING SUPABASE AUTHENTICATION ===")
    
    # Supabase configuration
    SUPABASE_URL = "https://mfmijckzlhevduwfigkl.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E"
    
    # Test 1: Sign in with test user
    try:
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        auth_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = requests.post(auth_url, headers=auth_headers, json=auth_data)
        print(f"Supabase Auth Status: {response.status_code}")
        
        if response.status_code == 200:
            auth_result = response.json()
            access_token = auth_result.get("access_token")
            print(f"  Authentication successful")
            print(f"  Access token: {access_token[:50]}...")
            
            # Test 2: Use token to call backend API
            try:
                backend_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                # Test dashboard API
                dashboard_response = requests.get("http://localhost:8000/api/dashboard/stats", headers=backend_headers)
                print(f"Dashboard API with Supabase token: {dashboard_response.status_code}")
                
                if dashboard_response.status_code == 200:
                    dashboard_data = dashboard_response.json()
                    print(f"  Dashboard data received:")
                    print(f"    Total Revenue: {dashboard_data.get('totalRevenue', 0)}")
                    print(f"    Total Expenses: {dashboard_data.get('totalExpenses', 0)}")
                    print(f"    Profit/Loss: {dashboard_data.get('profitLoss', 0)}")
                else:
                    print(f"  Dashboard API error: {dashboard_response.text}")
                
                # Test cash flow API
                cashflow_response = requests.get("http://localhost:8000/api/reports/financial/cash-flow?start_date=2025-01-01&end_date=2025-01-31", headers=backend_headers)
                print(f"Cash Flow API with Supabase token: {cashflow_response.status_code}")
                
                if cashflow_response.status_code == 200:
                    cashflow_data = cashflow_response.json()
                    print(f"  Cash Flow data received:")
                    print(f"    Net Cash Flow: {cashflow_data.get('net_cash_flow', 0)}")
                    print(f"    Total Transactions: {cashflow_data.get('total_transactions', 0)}")
                else:
                    print(f"  Cash Flow API error: {cashflow_response.text}")
                    
            except Exception as e:
                print(f"  Backend API test error: {e}")
                
        else:
            print(f"  Authentication failed: {response.text}")
            
    except Exception as e:
        print(f"Supabase auth error: {e}")

if __name__ == "__main__":
    test_supabase_auth()
