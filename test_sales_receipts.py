#!/usr/bin/env python3
"""
Test script for Sales Receipts API
"""

import requests
import json
from datetime import datetime, date

# API Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
RECEIPTS_URL = f"{BASE_URL}/api/sales/receipts"

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

def test_create_sales_receipt(token):
    """Test creating a sales receipt"""
    print("\n🧾 Testing create sales receipt...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    receipt_data = {
        "customer_id": None,
        "issue_date": date.today().isoformat(),
        "line_items": [
            {
                "product_id": None,
                "product_name": "Sản phẩm test",
                "description": "Mô tả sản phẩm test",
                "quantity": 2,
                "unit_price": 100000,
                "discount_rate": 10,
                "discount_amount": 20000,
                "line_total": 180000
            }
        ],
        "subtotal": 200000,
        "tax_rate": 10,
        "tax_amount": 18000,
        "discount_amount": 0,
        "total_amount": 198000,
        "payment_method": "Cash",
        "notes": "Phiếu thu test từ script"
    }
    
    try:
        response = requests.post(RECEIPTS_URL, json=receipt_data, headers=headers)
        print(f"Create receipt response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sales receipt created successfully!")
            print(f"Receipt ID: {data.get('id')}")
            print(f"Receipt Number: {data.get('receipt_number')}")
            print(f"Total Amount: {data.get('total_amount')}")
            return data.get('id')
        else:
            print(f"❌ Create receipt failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Create receipt error: {e}")
        return None

def test_get_sales_receipts(token):
    """Test getting sales receipts"""
    print("\n📋 Testing get sales receipts...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(RECEIPTS_URL, headers=headers)
        print(f"Get receipts response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data)} sales receipts")
            for receipt in data:
                print(f"  - {receipt.get('receipt_number')}: {receipt.get('total_amount')} VND")
            return data
        else:
            print(f"❌ Get receipts failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get receipts error: {e}")
        return None

def test_get_sales_receipt_stats(token):
    """Test getting sales receipt statistics"""
    print("\n📊 Testing get sales receipt stats...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{RECEIPTS_URL}/stats/summary", headers=headers)
        print(f"Get stats response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sales receipt statistics:")
            print(f"  - Total receipts: {data.get('total_receipts')}")
            print(f"  - Total amount: {data.get('total_amount')} VND")
            print(f"  - By payment method: {data.get('by_payment_method')}")
            return data
        else:
            print(f"❌ Get stats failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Get stats error: {e}")
        return None

def main():
    """Main test function"""
    print("🚀 Starting Sales Receipts API Tests")
    print("=" * 50)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    # Test create sales receipt
    receipt_id = test_create_sales_receipt(token)
    
    # Test get sales receipts
    test_get_sales_receipts(token)
    
    # Test get statistics
    test_get_sales_receipt_stats(token)
    
    print("\n" + "=" * 50)
    print("✅ Sales Receipts API tests completed!")

if __name__ == "__main__":
    main()
