#!/usr/bin/env python3
"""
Simple test script to verify email service works
"""

import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Set minimal environment variables
os.environ['SUPABASE_URL'] = 'dummy'
os.environ['SUPABASE_ANON_KEY'] = 'dummy'

try:
    from services.email_service import email_service
    print('SUCCESS: Email service imported successfully')
    print('Email provider:', email_service.email_provider)
    print('Logo path:', email_service.logo_path)

    # Test HTML generation
    test_data = {
        'quote_number': 'TEST-001',
        'customer_name': 'Test Customer',
        'total_amount': 1000000,
        'discount_percentage': 5,
        'customer_phone': '0123456789'
    }

    html = email_service.generate_quote_email_html(
        quote_data=test_data,
        customer_name='Test Customer',
        employee_name='Nguyen Van A',
        employee_phone='0987654321',
        quote_items=[{
            'name_product': 'Cửa nhôm Xingfa',
            'quantity': 2,
            'unit_price': 500000,
            'total_price': 1000000,
            'category_name': 'Cửa',
            'unit': 'bộ',
            'width': 1000,
            'height': 2000,
            'material': 'Nhôm Xingfa',
            'color': 'Trắng',
            'accessories': 'Tay nắm'
        }],
        custom_payment_terms=[{
            'description': 'Đặt cọc 30%',
            'amount': 300000,
            'received': True
        }],
        additional_notes='Ghi chú thêm từ khách hàng',
        default_notes=['Ghi chú mặc định 1', 'Ghi chú mặc định 2'],
        company_info={
            'company_name': 'Công Ty TNHH Phúc Đạt',
            'company_showroom': '123 Đường ABC',
            'company_factory': '456 Đường XYZ',
            'company_hotline': '0901.116.118',
            'company_website': 'https://phucdat.com'
        },
        bank_info={
            'account_name': 'CÔNG TY TNHH PHÚC ĐẠT',
            'account_number': '123456789',
            'bank_name': 'Vietcombank',
            'branch': 'CN TPHCM'
        }
    )

    print(f'SUCCESS: HTML generated successfully, length: {len(html)} characters')

    # Check for key elements in HTML
    checks = [
        ('BẢNG BÁO GIÁ', 'Title present'),
        ('Test Customer', 'Customer name present'),
        ('Nguyen Van A', 'Employee name present'),
        ('Cửa nhôm Xingfa', 'Product name present'),
        ('TỔNG HẠNG MỤC', 'Total section present'),
        ('PHƯƠNG THỨC THANH TOÁN', 'Payment terms section present'),
        ('GHI CHÚ', 'Notes section present'),
    ]

    for check_text, description in checks:
        if check_text in html:
            print(f'SUCCESS: {description}')
        else:
            print(f'ERROR: {description} - MISSING')

    print('\nSUCCESS: Email service test completed successfully!')

except Exception as e:
    print(f'ERROR: Test failed: {str(e)}')
    import traceback
    traceback.print_exc()
