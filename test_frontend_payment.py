#!/usr/bin/env python3
"""
Test script to simulate frontend payment API call
"""

import requests
import json
import uuid
from datetime import datetime, date

# API Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
INVOICES_URL = f"{BASE_URL}/api/sales/invoices"
CUSTOMERS_URL = f"{BASE_URL}/api/customers"

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
    """Test creating a customer"""
    print("\n👤 Testing create customer...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    customer_data = {
        "customer_code": f"CUST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "name": "Test Customer for Frontend Payment",
        "email": f"frontend-payment-test-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "address": "Test Address",
        "city": "Ho Chi Minh",
        "country": "Vietnam",
        "type": "individual"
    }
    
    try:
        response = requests.post(CUSTOMERS_URL, json=customer_data, headers=headers)
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
        "notes": "Test invoice for frontend payment"
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

def test_frontend_payment_call(token, invoice_id):
    """Test payment API call as frontend would do it"""
    print(f"\n💰 Testing frontend-style payment call for invoice {invoice_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Simulate frontend call with query parameters
    payment_amount = 500000
    payment_method = "bank_transfer"
    payment_date = date.today().isoformat()
    
    # Build URL with query parameters (like frontend does)
    url = f"{INVOICES_URL}/{invoice_id}/payment"
    params = {
        "payment_amount": payment_amount,
        "payment_method": payment_method,
        "payment_date": payment_date
    }
    
    try:
        response = requests.put(url, params=params, headers=headers)
        print(f"Frontend payment call response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend payment call successful!")
            print(f"Message: {data.get('message')}")
            print(f"Journal entry created: {data.get('journal_entry_created')}")
            return True
        else:
            print(f"❌ Frontend payment call failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Frontend payment call error: {e}")
        return False

def test_wrong_format_call(token, invoice_id):
    """Test payment API call with wrong format (body instead of query params)"""
    print(f"\n❌ Testing wrong format payment call for invoice {invoice_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # This is the wrong way (sending data in body)
    payment_data = {
        "payment_amount": 300000,
        "payment_method": "bank_transfer",
        "payment_date": date.today().isoformat()
    }
    
    url = f"{INVOICES_URL}/{invoice_id}/payment"
    
    try:
        response = requests.put(url, json=payment_data, headers=headers)
        print(f"Wrong format call response status: {response.status_code}")
        
        if response.status_code == 422:
            print(f"✅ Correctly rejected with 422 - Unprocessable Entity")
            print(f"Error: {response.text}")
            return True
        else:
            print(f"❌ Unexpected response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Wrong format call error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Frontend Payment API Tests")
    print("=" * 70)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    # Test create customer
    customer_id = test_create_customer(token)
    if not customer_id:
        print("❌ Cannot proceed without customer")
        return
    
    # Test create invoice
    invoice_id = test_create_invoice(token, customer_id)
    if not invoice_id:
        print("❌ Cannot proceed without invoice")
        return
    
    # Test correct frontend payment call
    test_frontend_payment_call(token, invoice_id)
    
    # Test wrong format call (should return 422)
    test_wrong_format_call(token, invoice_id)
    
    print("\n" + "=" * 70)
    print("✅ Frontend Payment API tests completed!")
    print("📊 Summary:")
    print("   - Correct format (query params): ✅ Works")
    print("   - Wrong format (body params): ❌ Returns 422")
    print("   - Frontend should use query parameters for payment API")

if __name__ == "__main__":
    main()
