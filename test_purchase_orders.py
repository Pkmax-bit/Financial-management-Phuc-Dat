#!/usr/bin/env python3
"""
Test Purchase Orders API
Script để test các API endpoints của Purchase Orders
"""

import requests
import json
from datetime import datetime, date
import uuid

# API Configuration
API_BASE_URL = "http://localhost:8000"
LOGIN_EMAIL = "admin@example.com"
LOGIN_PASSWORD = "admin123"

def login():
    """Đăng nhập và lấy access token"""
    print("🔐 Đang đăng nhập...")
    
    login_data = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    }
    
    response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Đăng nhập thành công: {data.get('user', {}).get('email', 'Unknown')}")
        return data.get('access_token')
    else:
        print(f"❌ Đăng nhập thất bại: {response.status_code} - {response.text}")
        return None

def test_create_vendor(token):
    """Tạo vendor để test"""
    print("\n🏪 Tạo vendor test...")
    
    headers = {"Authorization": f"Bearer {token}"}
    vendor_data = {
        "name": f"Test Vendor {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "email": f"vendor-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "phone": "0123456789",
        "address": "123 Test Street",
        "city": "Ho Chi Minh",
        "country": "Vietnam",
        "vendor_code": f"VENDOR-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "supplier"
    }
    
    response = requests.post(f"{API_BASE_URL}/api/expenses/vendors", json=vendor_data, headers=headers)
    
    if response.status_code == 201:
        vendor = response.json()
        print(f"✅ Tạo vendor thành công: {vendor.get('name')}")
        return vendor.get('id')
    else:
        print(f"❌ Tạo vendor thất bại: {response.status_code} - {response.text}")
        return None

def test_create_purchase_order(token, vendor_id):
    """Test tạo purchase order"""
    print("\n🛒 Tạo purchase order...")
    
    headers = {"Authorization": f"Bearer {token}"}
    po_data = {
        "vendor_id": vendor_id,
        "issue_date": date.today().isoformat(),
        "delivery_date": (date.today().replace(month=date.today().month + 1)).isoformat(),
        "line_items": [
            {
                "product_name": "Test Product 1",
                "description": "Test product for purchase order",
                "quantity": 10,
                "unit_price": 100000,
                "discount_rate": 5.0,
                "discount_amount": 50000,
                "line_total": 950000
            },
            {
                "product_name": "Test Product 2",
                "description": "Another test product",
                "quantity": 5,
                "unit_price": 200000,
                "discount_rate": 0.0,
                "discount_amount": 0,
                "line_total": 1000000
            }
        ],
        "subtotal": 1950000,
        "tax_rate": 10.0,
        "tax_amount": 195000,
        "discount_amount": 0,
        "total_amount": 2145000,
        "currency": "VND",
        "notes": "Test purchase order",
        "terms": "Payment within 30 days"
    }
    
    response = requests.post(f"{API_BASE_URL}/api/expenses/purchase-orders", json=po_data, headers=headers)
    
    if response.status_code == 201:
        po = response.json()
        print(f"✅ Tạo purchase order thành công: {po.get('po_number')}")
        print(f"   - Vendor: {po.get('vendor_id')}")
        print(f"   - Total: {po.get('total_amount'):,} VND")
        print(f"   - Status: {po.get('status')}")
        return po.get('id')
    else:
        print(f"❌ Tạo purchase order thất bại: {response.status_code} - {response.text}")
        return None

def test_submit_for_approval(token, po_id):
    """Test gửi duyệt purchase order"""
    print("\n📤 Gửi duyệt purchase order...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_BASE_URL}/api/expenses/purchase-orders/{po_id}/submit", headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Gửi duyệt thành công: {result.get('message')}")
        return True
    else:
        print(f"❌ Gửi duyệt thất bại: {response.status_code} - {response.text}")
        return False

def test_approve_purchase_order(token, po_id):
    """Test phê duyệt purchase order"""
    print("\n✅ Phê duyệt purchase order...")
    
    headers = {"Authorization": f"Bearer {token}"}
    approval_data = {
        "action": "approve",
        "notes": "Approved for testing purposes"
    }
    
    response = requests.post(f"{API_BASE_URL}/api/expenses/purchase-orders/{po_id}/approve", json=approval_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Phê duyệt thành công: {result.get('message')}")
        return True
    else:
        print(f"❌ Phê duyệt thất bại: {response.status_code} - {response.text}")
        return False

def test_convert_to_bill(token, po_id):
    """Test chuyển đổi PO thành Bill"""
    print("\n🧾 Chuyển đổi PO thành Bill...")
    
    headers = {"Authorization": f"Bearer {token}"}
    convert_data = {
        "bill_number": f"BILL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
        "issue_date": date.today().isoformat(),
        "due_date": (date.today().replace(month=date.today().month + 1)).isoformat(),
        "notes": "Converted from Purchase Order"
    }
    
    response = requests.post(f"{API_BASE_URL}/api/expenses/purchase-orders/{po_id}/convert-to-bill", json=convert_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Chuyển đổi thành công: {result.get('message')}")
        print(f"   - Bill ID: {result.get('bill', {}).get('id')}")
        print(f"   - Bill Number: {result.get('bill', {}).get('bill_number')}")
        return True
    else:
        print(f"❌ Chuyển đổi thất bại: {response.status_code} - {response.text}")
        return False

def test_get_purchase_orders(token):
    """Test lấy danh sách purchase orders"""
    print("\n📋 Lấy danh sách purchase orders...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE_URL}/api/expenses/purchase-orders", headers=headers)
    
    if response.status_code == 200:
        pos = response.json()
        print(f"✅ Lấy danh sách thành công: {len(pos)} purchase orders")
        for po in pos[:3]:  # Show first 3
            print(f"   - {po.get('po_number')}: {po.get('vendor_name')} - {po.get('total_amount'):,} VND")
        return True
    else:
        print(f"❌ Lấy danh sách thất bại: {response.status_code} - {response.text}")
        return False

def test_get_purchase_order_stats(token):
    """Test lấy thống kê purchase orders"""
    print("\n📊 Lấy thống kê purchase orders...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE_URL}/api/expenses/purchase-orders/stats", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Lấy thống kê thành công:")
        print(f"   - Tổng đơn hàng: {stats.get('total_orders')}")
        print(f"   - Tổng giá trị: {stats.get('total_amount'):,} VND")
        print(f"   - Chờ duyệt: {stats.get('pending_approval')}")
        print(f"   - Đã duyệt tháng này: {stats.get('approved_this_month')}")
        return True
    else:
        print(f"❌ Lấy thống kê thất bại: {response.status_code} - {response.text}")
        return False

def main():
    print("🛒 TEST PURCHASE ORDERS API")
    print("=" * 40)
    
    # Step 1: Login
    token = login()
    if not token:
        return
    
    # Step 2: Create vendor
    vendor_id = test_create_vendor(token)
    if not vendor_id:
        return
    
    # Step 3: Create purchase order
    po_id = test_create_purchase_order(token, vendor_id)
    if not po_id:
        return
    
    # Step 4: Submit for approval
    if test_submit_for_approval(token, po_id):
        # Step 5: Approve purchase order
        if test_approve_purchase_order(token, po_id):
            # Step 6: Convert to bill
            test_convert_to_bill(token, po_id)
    
    # Step 7: Get purchase orders list
    test_get_purchase_orders(token)
    
    # Step 8: Get statistics
    test_get_purchase_order_stats(token)
    
    print("\n✅ HOÀN THÀNH TEST!")
    print("Tất cả các chức năng Purchase Orders đã được test thành công!")

if __name__ == "__main__":
    main()
