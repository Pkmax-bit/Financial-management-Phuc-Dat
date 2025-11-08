#!/usr/bin/env python3
"""
Test script for Credit Memo functionality
"""

import requests
import json
import uuid
from datetime import datetime, date

# API Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CREDIT_MEMOS_URL = f"{BASE_URL}/api/sales/credit-memos"
CUSTOMERS_URL = f"{BASE_URL}/api/customers"
INVOICES_URL = f"{BASE_URL}/api/sales/invoices"

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
        "name": "Test Customer for Credit Memo",
        "email": f"credit-test-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
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
    subtotal = 2000000
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
        "notes": "Test invoice for credit memo"
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

def test_create_credit_memo(token, customer_id, invoice_id):
    """Test creating a credit memo"""
    print("\n📋 Testing create credit memo...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Calculate amounts
    subtotal = 500000
    tax_amount = subtotal * 0.1
    total_amount = subtotal + tax_amount
    
    credit_memo_data = {
        "customer_id": customer_id,
        "original_invoice_id": invoice_id,
        "issue_date": date.today().isoformat(),
        "returned_items": [
            {
                "product_name": "Sản phẩm trả lại",
                "description": "Sản phẩm bị lỗi",
                "quantity": 1,
                "unit_price": 500000,
                "discount_rate": 0,
                "discount_amount": 0,
                "line_total": 500000,
                "reason": "Sản phẩm bị lỗi kỹ thuật"
            }
        ],
        "subtotal": subtotal,
        "tax_rate": 10,
        "tax_amount": tax_amount,
        "discount_amount": 0,
        "total_amount": total_amount,
        "currency": "VND",
        "reason": "Khách hàng trả lại hàng do sản phẩm bị lỗi",
        "notes": "Test credit memo"
    }
    
    try:
        response = requests.post(CREDIT_MEMOS_URL, json=credit_memo_data, headers=headers)
        print(f"Create credit memo response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Credit memo created successfully!")
            print(f"Credit Memo ID: {data.get('id')}")
            print(f"Credit Memo Number: {data.get('credit_memo_number')}")
            print(f"Total Amount: {data.get('total_amount')}")
            print(f"Status: {data.get('status')}")
            return data.get('id')
        else:
            print(f"❌ Create credit memo failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create credit memo error: {e}")
        return None

def test_apply_credit_memo(token, credit_memo_id, invoice_id):
    """Test applying credit memo to invoice"""
    print(f"\n🔗 Testing apply credit memo {credit_memo_id} to invoice {invoice_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    application_data = {
        "credit_memo_id": credit_memo_id,
        "invoice_id": invoice_id,
        "applied_amount": 300000,
        "notes": "Áp dụng credit memo vào hóa đơn"
    }
    
    try:
        response = requests.post(f"{CREDIT_MEMOS_URL}/{credit_memo_id}/apply", 
                               json=application_data, headers=headers)
        print(f"Apply credit memo response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Credit memo applied successfully!")
            print(f"Applied Amount: {data.get('applied_amount')}")
            print(f"Remaining Amount: {data.get('remaining_amount')}")
            return True
        else:
            print(f"❌ Apply credit memo failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Apply credit memo error: {e}")
        return False

def test_refund_credit_memo(token, credit_memo_id):
    """Test refunding credit memo"""
    print(f"\n💰 Testing refund credit memo {credit_memo_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    refund_data = {
        "credit_memo_id": credit_memo_id,
        "refund_amount": 200000,
        "refund_method": "bank_transfer",
        "refund_reference": f"REF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "notes": "Hoàn tiền qua chuyển khoản"
    }
    
    try:
        response = requests.post(f"{CREDIT_MEMOS_URL}/{credit_memo_id}/refund", 
                               json=refund_data, headers=headers)
        print(f"Refund credit memo response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Credit memo refunded successfully!")
            print(f"Refund Amount: {data.get('refund_amount')}")
            print(f"Remaining Amount: {data.get('remaining_amount')}")
            return True
        else:
            print(f"❌ Refund credit memo failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Refund credit memo error: {e}")
        return False

def test_get_credit_memos(token):
    """Test getting credit memos"""
    print("\n📊 Testing get credit memos...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(CREDIT_MEMOS_URL, headers=headers)
        print(f"Get credit memos response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} credit memos")
            for memo in data:
                print(f"  - {memo.get('credit_memo_number')}: {memo.get('total_amount')} VND ({memo.get('status')})")
            return data
        else:
            print(f"❌ Get credit memos failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get credit memos error: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Starting Credit Memo Tests")
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
    
    # Test create credit memo
    credit_memo_id = test_create_credit_memo(token, customer_id, invoice_id)
    if not credit_memo_id:
        print("❌ Cannot proceed without credit memo")
        return
    
    # Test apply credit memo
    test_apply_credit_memo(token, credit_memo_id, invoice_id)
    
    # Test refund credit memo
    test_refund_credit_memo(token, credit_memo_id)
    
    # Test get credit memos
    test_get_credit_memos(token)
    
    print("\n" + "=" * 70)
    print("✅ Credit Memo tests completed!")
    print("📊 Credit Memo functionality includes:")
    print("   - Create credit memo with journal entries")
    print("   - Apply credit memo to invoices")
    print("   - Process refunds with journal entries")
    print("   - Track credit memo status and amounts")

if __name__ == "__main__":
    main()
