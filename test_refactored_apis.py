#!/usr/bin/env python3
"""
Test script for refactored APIs with journal entries
"""

import requests
import json
import uuid
from datetime import datetime, date

# API Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
INVOICES_URL = f"{BASE_URL}/api/sales/invoices"
PAYMENTS_URL = f"{BASE_URL}/api/sales/payments"
JOURNAL_ENTRIES_URL = f"{BASE_URL}/api/sales/journal-entries"

def test_login():
    """Test login and get token"""
    print("🔐 Testing login...")
    
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful! Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_create_customer(token):
    """Test creating a customer first"""
    print("\n👤 Testing create customer...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    customer_data = {
        "customer_code": f"CUST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "name": "Test Customer",
        "email": f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "address": "Test Address",
        "city": "Ho Chi Minh",
        "country": "Vietnam",
        "type": "individual"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, headers=headers)
        print(f"Create customer response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Customer created successfully!")
            print(f"Customer ID: {data.get('id')}")
            return data.get('id')
        else:
            print(f"❌ Create customer failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create customer error: {e}")
        return None

def test_create_invoice(token, customer_id):
    """Test creating an invoice"""
    print("\n📄 Testing create invoice...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Calculate amounts
    subtotal = 1000000
    tax_amount = subtotal * 0.1
    total_amount = subtotal + tax_amount
    
    invoice_data = {
        "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d')}-{datetime.now().strftime('%H%M%S')}",
        "customer_id": customer_id,
        "issue_date": date.today().isoformat(),
        "due_date": (date.today().replace(month=date.today().month + 1)).isoformat(),
        "subtotal": subtotal,
        "tax_rate": 10,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "currency": "VND",
        "notes": "Test invoice for journal entries"
    }
    
    try:
        response = requests.post(INVOICES_URL, json=invoice_data, headers=headers)
        print(f"Create invoice response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Invoice created successfully!")
            print(f"Invoice ID: {data.get('id')}")
            print(f"Invoice Number: {data.get('invoice_number')}")
            print(f"Total Amount: {data.get('total_amount')}")
            return data.get('id')
        else:
            print(f"❌ Create invoice failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create invoice error: {e}")
        return None

def test_send_invoice(token, invoice_id):
    """Test sending invoice (should create journal entry)"""
    print(f"\n📤 Testing send invoice {invoice_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{INVOICES_URL}/{invoice_id}/send", headers=headers)
        print(f"Send invoice response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Invoice sent successfully!")
            print(f"Message: {data.get('message')}")
            print(f"Journal entry created: {data.get('journal_entry_created')}")
            return True
        else:
            print(f"❌ Send invoice failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Send invoice error: {e}")
        return False

def test_create_payment(token, invoice_id):
    """Test creating a payment (should create journal entry)"""
    print(f"\n💰 Testing create payment for invoice {invoice_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payment_data = {
        "payment_amount": 500000,
        "payment_method": "bank_transfer",
        "payment_reference": f"REF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "payment_date": date.today().isoformat()
    }
    
    try:
        response = requests.put(f"{INVOICES_URL}/{invoice_id}/payment", 
                              json=payment_data, headers=headers)
        print(f"Create payment response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Payment created successfully!")
            print(f"Message: {data.get('message')}")
            print(f"Journal entry created: {data.get('journal_entry_created')}")
            return True
        else:
            print(f"❌ Create payment failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Create payment error: {e}")
        return False

def test_get_journal_entries(token):
    """Test getting journal entries"""
    print("\n📊 Testing get journal entries...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(JOURNAL_ENTRIES_URL, headers=headers)
        print(f"Get journal entries response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} journal entries")
            for entry in data:
                print(f"  - {entry.get('entry_number')}: {entry.get('description')} ({entry.get('transaction_type')})")
                print(f"    Debit: {entry.get('total_debit')}, Credit: {entry.get('total_credit')}")
            return data
        else:
            print(f"❌ Get journal entries failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get journal entries error: {e}")
        return None

def test_get_journal_entries_by_type(token, transaction_type):
    """Test getting journal entries by transaction type"""
    print(f"\n🔍 Testing get journal entries by type: {transaction_type}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{JOURNAL_ENTRIES_URL}?transaction_type={transaction_type}", headers=headers)
        print(f"Get journal entries by type response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} {transaction_type} journal entries")
            for entry in data:
                print(f"  - {entry.get('entry_number')}: {entry.get('description')}")
            return data
        else:
            print(f"❌ Get journal entries by type failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get journal entries by type error: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Starting Refactored APIs Tests with Journal Entries")
    print("=" * 70)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    # Test create customer first
    customer_id = test_create_customer(token)
    if not customer_id:
        print("❌ Cannot proceed without customer")
        return
    
    # Test create invoice
    invoice_id = test_create_invoice(token, customer_id)
    if not invoice_id:
        print("❌ Cannot proceed without invoice")
        return
    
    # Test send invoice (should create journal entry)
    test_send_invoice(token, invoice_id)
    
    # Test create payment (should create journal entry)
    test_create_payment(token, invoice_id)
    
    # Test get journal entries
    test_get_journal_entries(token)
    
    # Test get journal entries by type
    test_get_journal_entries_by_type(token, "invoice")
    test_get_journal_entries_by_type(token, "payment")
    
    print("\n" + "=" * 70)
    print("✅ Refactored APIs tests completed!")
    print("📊 Journal entries should now be automatically created for:")
    print("   - Invoice sending (Debit: Accounts Receivable, Credit: Sales Revenue)")
    print("   - Payment recording (Debit: Cash/Bank, Credit: Accounts Receivable)")

if __name__ == "__main__":
    main()
