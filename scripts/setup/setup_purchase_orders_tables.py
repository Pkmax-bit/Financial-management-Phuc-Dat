#!/usr/bin/env python3
"""
Setup Purchase Orders Database Tables
Hướng dẫn tạo bảng Purchase Orders trong Supabase
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def main():
    print("🛒 SETUP PURCHASE ORDERS DATABASE TABLES")
    print("=" * 50)
    
    # Check if Supabase credentials are available
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Không tìm thấy Supabase credentials!")
        print("Vui lòng kiểm tra file backend/.env")
        return
    
    print("✅ Đã tìm thấy Supabase credentials")
    print(f"URL: {supabase_url}")
    print(f"Key: {supabase_key[:20]}...")
    
    print("\n📋 HƯỚNG DẪN THỰC HIỆN:")
    print("=" * 30)
    
    print("""
1. Mở Supabase Dashboard:
   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn
   - Vào mục "SQL Editor"

2. Thực hiện SQL Script:
   - Copy nội dung file create_purchase_orders_schema.sql
   - Paste vào SQL Editor
   - Nhấn "Run" để thực thi

3. Kiểm tra kết quả:
   - Vào mục "Table Editor"
   - Kiểm tra các bảng mới:
     * purchase_orders
     * purchase_order_items
     * purchase_order_summary (view)

4. Cấu hình RLS (Row Level Security):
   - Vào mục "Authentication" > "Policies"
   - Tạo policies cho các bảng mới nếu cần

5. Test API:
   - Khởi động backend: python backend/main.py
   - Test endpoints trong Swagger UI: http://localhost:8000/docs
""")
    
    print("\n🔧 CÁC BẢNG SẼ ĐƯỢC TẠO:")
    print("- purchase_orders: Bảng chính lưu đơn đặt hàng")
    print("- purchase_order_items: Chi tiết sản phẩm trong đơn hàng")
    print("- purchase_order_summary: View tổng hợp thông tin")
    
    print("\n📊 CÁC CHỨC NĂNG CHÍNH:")
    print("- Tạo đơn đặt hàng (Draft)")
    print("- Gửi duyệt (Pending Approval)")
    print("- Phê duyệt/Từ chối (Manager/Admin)")
    print("- Chuyển đổi thành Bill (Approved → Bill)")
    print("- Thống kê và báo cáo")
    
    print("\n⚠️ LƯU Ý QUAN TRỌNG:")
    print("- Purchase Orders KHÔNG tạo journal entries (non-posting)")
    print("- Chỉ khi chuyển thành Bill mới tạo journal entries")
    print("- Cần có bảng vendors trước khi tạo purchase_orders")
    print("- Cần có bảng bills để chuyển đổi PO thành Bill")
    
    print("\n✅ HOÀN THÀNH!")
    print("Sau khi setup xong, bạn có thể:")
    print("- Tạo đơn đặt hàng mới")
    print("- Quản lý luồng phê duyệt")
    print("- Chuyển đổi thành hóa đơn")
    print("- Theo dõi thống kê chi tiêu")

if __name__ == "__main__":
    main()
