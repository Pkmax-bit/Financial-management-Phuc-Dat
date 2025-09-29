#!/usr/bin/env python3
"""
Test script for General Ledger API endpoints
Tests the chronological transaction records from JournalEntries
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/reports/accountant"

def test_general_ledger_api():
    """Test General Ledger API endpoints"""
    print("📚 Testing General Ledger API Endpoints")
    print("=" * 50)
    
    # Test data
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    print(f"📅 Testing period: {start_date} to {end_date}")
    
    # Test 1: Full General Ledger Report
    print("\n1️⃣ Testing Full General Ledger Report")
    try:
        url = f"{API_BASE}/general-ledger"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "include_running_balance": True
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   📊 Report Period: {data.get('report_period', 'N/A')}")
            print(f"   📚 Total Entries: {data.get('total_entries', 0)}")
            print(f"   💰 Total Debits: {data.get('total_debits', 0):,.2f}")
            print(f"   💰 Total Credits: {data.get('total_credits', 0):,.2f}")
            print(f"   ⚖️  Balance Check: {'✅' if data.get('balance_check', False) else '❌'}")
            
            # Ledger entries
            entries = data.get('ledger_entries', [])
            print(f"   📋 Ledger Entries: {len(entries)} entries")
            
            if entries:
                print(f"   📖 Sample Entries (first 3):")
                for i, entry in enumerate(entries[:3]):
                    je = entry.get('journal_entry', {})
                    print(f"      {i+1}. {je.get('date', 'N/A')} - {je.get('account_name', 'N/A')}")
                    print(f"         - Transaction: {je.get('transaction_id', 'N/A')} ({je.get('transaction_type', 'N/A')})")
                    print(f"         - Debit: {je.get('debit_amount', 0):,.2f}, Credit: {je.get('credit_amount', 0):,.2f}")
                    print(f"         - Running Balance: {entry.get('running_balance', 0):,.2f} ({entry.get('balance_type', 'N/A')})")
            
            # Account summary
            account_summary = data.get('account_summary', [])
            print(f"   📊 Account Summary: {len(account_summary)} accounts")
            
            if account_summary:
                print(f"   🏦 Top 3 Accounts by Activity:")
                for i, account in enumerate(account_summary[:3]):
                    print(f"      {i+1}. {account.get('account_name', 'N/A')} ({account.get('account_code', 'N/A')})")
                    print(f"         - Transactions: {account.get('transaction_count', 0)}")
                    print(f"         - Debits: {account.get('total_debits', 0):,.2f}, Credits: {account.get('total_credits', 0):,.2f}")
                    print(f"         - Ending Balance: {account.get('ending_balance', 0):,.2f}")
                    
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: General Ledger Summary
    print("\n2️⃣ Testing General Ledger Summary")
    try:
        url = f"{API_BASE}/general-ledger/summary"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   📊 Period: {data.get('period', 'N/A')}")
            print(f"   📚 Total Entries: {data.get('total_entries', 0)}")
            print(f"   💰 Total Debits: {data.get('total_debits', 0):,.2f}")
            print(f"   💰 Total Credits: {data.get('total_credits', 0):,.2f}")
            print(f"   ⚖️  Balance Check: {'✅' if data.get('balance_check', False) else '❌'}")
            print(f"   🏦 Unique Accounts: {data.get('unique_accounts', 0)}")
            print(f"   📄 Unique Transactions: {data.get('unique_transactions', 0)}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: General Ledger Analysis
    print("\n3️⃣ Testing General Ledger Analysis")
    try:
        url = f"{API_BASE}/general-ledger/analysis"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            
            # Account balances
            account_balances = data.get('account_balances', [])
            print(f"   🏦 Account Balances: {len(account_balances)} accounts")
            
            # Transaction type summary
            transaction_types = data.get('transaction_type_summary', {})
            print(f"   📊 Transaction Types:")
            for txn_type, count in transaction_types.items():
                print(f"      - {txn_type}: {count}")
            
            # Daily activity
            daily_activity = data.get('daily_activity', [])
            print(f"   📅 Daily Activity: {len(daily_activity)} days")
            
            # Balance analysis
            total_debits = data.get('total_debits', 0)
            total_credits = data.get('total_credits', 0)
            balance_difference = data.get('balance_difference', 0)
            is_balanced = data.get('is_balanced', False)
            
            print(f"   ⚖️  Balance Analysis:")
            print(f"      - Total Debits: {total_debits:,.2f}")
            print(f"      - Total Credits: {total_credits:,.2f}")
            print(f"      - Difference: {balance_difference:,.2f}")
            print(f"      - Is Balanced: {'✅' if is_balanced else '❌'}")
            
            # Most active accounts
            most_active = data.get('most_active_accounts', [])
            print(f"   🔥 Most Active Accounts (top 3):")
            for i, account in enumerate(most_active[:3]):
                print(f"      {i+1}. {account.get('account_name', 'N/A')} - {account.get('transaction_count', 0)} transactions")
            
            # Largest transactions
            largest_transactions = data.get('largest_transactions', [])
            print(f"   💎 Largest Transactions (top 3):")
            for i, txn in enumerate(largest_transactions[:3]):
                print(f"      {i+1}. {txn.get('transaction_id', 'N/A')} - {txn.get('total_amount', 0):,.2f}")
                print(f"         - Type: {txn.get('transaction_type', 'N/A')}, Date: {txn.get('date', 'N/A')}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 4: Different parameters
    print("\n4️⃣ Testing different parameters")
    
    test_cases = [
        {
            "name": "Without running balance",
            "params": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "include_running_balance": False
            }
        },
        {
            "name": "Last 7 days",
            "params": {
                "start_date": (end_date - timedelta(days=7)).isoformat(),
                "end_date": end_date.isoformat()
            }
        },
        {
            "name": "Current year",
            "params": {
                "start_date": date(end_date.year, 1, 1).isoformat(),
                "end_date": end_date.isoformat()
            }
        }
    ]
    
    for test_case in test_cases:
        try:
            url = f"{API_BASE}/general-ledger"
            params = test_case["params"]
            
            print(f"   🧪 {test_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   Entries: {data.get('total_entries', 0)}")
                print(f"   Debits: {data.get('total_debits', 0):,.2f}")
                print(f"   Credits: {data.get('total_credits', 0):,.2f}")
                print(f"   Balanced: {'✅' if data.get('balance_check', False) else '❌'}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Test 5: Error cases
    print("\n5️⃣ Testing error cases")
    
    error_cases = [
        {
            "name": "Invalid date format",
            "params": {
                "start_date": "invalid-date",
                "end_date": end_date.isoformat()
            }
        },
        {
            "name": "Missing end_date",
            "params": {
                "start_date": start_date.isoformat()
            }
        },
        {
            "name": "Start date after end date",
            "params": {
                "start_date": end_date.isoformat(),
                "end_date": start_date.isoformat()
            }
        }
    ]
    
    for error_case in error_cases:
        try:
            url = f"{API_BASE}/general-ledger"
            params = error_case["params"]
            
            print(f"   🧪 {error_case['name']}:")
            print(f"   Params: {params}")
            
            response = requests.get(url, params=params)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                print(f"   ✅ Expected error (400)")
            elif response.status_code == 422:
                print(f"   ✅ Expected validation error (422)")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 General Ledger API Testing Complete!")

def test_authentication():
    """Test if authentication is working"""
    print("\n🔐 Testing Authentication")
    print("-" * 30)
    
    try:
        # Test health endpoint (no auth required)
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Health Check: {response.status_code}")
        
        # Test General Ledger endpoint without auth (should fail)
        response = requests.get(f"{API_BASE}/general-ledger?start_date=2024-01-01&end_date=2024-01-31")
        print(f"   General Ledger without auth: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Authentication is properly required")
        else:
            print("   ⚠️  Authentication might not be working properly")
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")

def test_balance_validation():
    """Test balance validation logic"""
    print("\n⚖️  Testing Balance Validation Logic")
    print("-" * 40)
    
    try:
        # Test with a known period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        url = f"{API_BASE}/general-ledger"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "include_running_balance": True
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            total_debits = data.get('total_debits', 0)
            total_credits = data.get('total_credits', 0)
            balance_check = data.get('balance_check', False)
            
            print(f"   📊 Balance Validation:")
            print(f"      - Total Debits: {total_debits:,.2f}")
            print(f"      - Total Credits: {total_credits:,.2f}")
            print(f"      - Difference: {abs(total_debits - total_credits):,.2f}")
            print(f"      - Balance Check: {'✅' if balance_check else '❌'}")
            
            # Check if balance validation is correct
            expected_balanced = abs(total_debits - total_credits) < 0.01
            validation_correct = balance_check == expected_balanced
            
            print(f"      - Validation Correct: {'✅' if validation_correct else '❌'}")
            
            # Check running balance calculation
            entries = data.get('ledger_entries', [])
            if entries:
                print(f"      - Running Balance Entries: {len(entries)}")
                
                # Check if running balances are calculated
                has_running_balances = all(entry.get('running_balance', 0) >= 0 for entry in entries)
                print(f"      - Running Balances Calculated: {'✅' if has_running_balances else '❌'}")
                
        else:
            print(f"   ❌ Failed to get data: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Balance validation test failed: {str(e)}")

def test_chronological_sorting():
    """Test chronological sorting of entries"""
    print("\n📅 Testing Chronological Sorting")
    print("-" * 40)
    
    try:
        # Test with a known period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        url = f"{API_BASE}/general-ledger"
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            entries = data.get('ledger_entries', [])
            
            print(f"   📊 Chronological Sorting Validation:")
            print(f"      - Total Entries: {len(entries)}")
            
            # Check if entries are sorted by date
            is_sorted_by_date = True
            for i in range(1, len(entries)):
                current_date = entries[i]['journal_entry']['date']
                previous_date = entries[i-1]['journal_entry']['date']
                if current_date < previous_date:
                    is_sorted_by_date = False
                    break
            
            print(f"      - Sorted by Date: {'✅' if is_sorted_by_date else '❌'}")
            
            # Check if entries with same date are sorted by transaction_id
            same_date_sorted = True
            for i in range(1, len(entries)):
                current_entry = entries[i]['journal_entry']
                previous_entry = entries[i-1]['journal_entry']
                
                if current_entry['date'] == previous_entry['date']:
                    if current_entry['transaction_id'] < previous_entry['transaction_id']:
                        same_date_sorted = False
                        break
            
            print(f"      - Same Date Sorted by Transaction ID: {'✅' if same_date_sorted else '❌'}")
            
        else:
            print(f"   ❌ Failed to get data: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Chronological sorting test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting General Ledger API Tests")
    print("=" * 50)
    
    # Test authentication first
    test_authentication()
    
    # Test General Ledger API
    test_general_ledger_api()
    
    # Test balance validation
    test_balance_validation()
    
    # Test chronological sorting
    test_chronological_sorting()
    
    print("\n💡 Note: These tests require:")
    print("   1. Backend server running on http://localhost:8000")
    print("   2. Database with journal_entries and accounts data")
    print("   3. Proper authentication setup")
    print("   4. Journal entries with proper account relationships")
    print("\n🔧 To run backend server:")
    print("   cd backend && python main.py")
    print("\n📚 General Ledger Report includes:")
    print("   - Chronological transaction records")
    print("   - Running balance calculations")
    print("   - Balance validation (Debits = Credits)")
    print("   - Account summary and analysis")
    print("   - Transaction type breakdown")
    print("   - Daily activity tracking")
    print("   - Most active accounts identification")
    print("   - Largest transactions identification")
