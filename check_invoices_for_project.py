"""
Script kiểm tra hóa đơn cho dự án
Giúp debug tại sao không có hóa đơn trong báo cáo
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def check_invoices():
    print("=== KIỂM TRA HÓA ĐƠN ===\n")
    
    # 1. Kiểm tra tất cả projects
    projects = supabase.table("projects").select("id, name, project_code").execute()
    print(f"✅ Tổng số dự án: {len(projects.data)}\n")
    
    for project in projects.data:
        print(f"\n📂 Dự án: {project['name']} ({project['project_code']})")
        print(f"   ID: {project['id']}")
        
        # 2. Kiểm tra invoices của dự án
        all_invoices = supabase.table("invoices")\
            .select("id, invoice_number, status, payment_status, total_amount")\
            .eq("project_id", project['id'])\
            .execute()
        
        print(f"   📄 Tổng hóa đơn: {len(all_invoices.data)}")
        
        if len(all_invoices.data) > 0:
            # Group by status
            status_count = {}
            for inv in all_invoices.data:
                status = inv['status']
                status_count[status] = status_count.get(status, 0) + 1
            
            print(f"   📊 Phân loại theo status:")
            for status, count in status_count.items():
                print(f"      • {status}: {count} hóa đơn")
            
            # Show invoices that should be counted
            valid_invoices = [inv for inv in all_invoices.data if inv['status'] in ['sent', 'paid']]
            print(f"\n   ✅ Hóa đơn được tính (sent/paid): {len(valid_invoices)}")
            
            if len(valid_invoices) > 0:
                total = sum(inv['total_amount'] for inv in valid_invoices)
                print(f"      💰 Tổng doanh thu: {total:,.0f} VND")
                print(f"      📋 Danh sách:")
                for inv in valid_invoices:
                    print(f"         - {inv['invoice_number']}: {inv['total_amount']:,.0f} VND (status: {inv['status']}, payment: {inv['payment_status']})")
            else:
                print(f"      ⚠️  Không có hóa đơn với status 'sent' hoặc 'paid'")
                print(f"      💡 Gợi ý: Kiểm tra và cập nhật status cho hóa đơn")
        
        # 3. Kiểm tra project expenses
        expenses = supabase.table("project_expenses")\
            .select("id, expense_code, amount, status")\
            .eq("project_id", project['id'])\
            .execute()
        
        print(f"\n   💸 Tổng chi phí dự án: {len(expenses.data)}")
        
        if len(expenses.data) > 0:
            approved_expenses = [exp for exp in expenses.data if exp['status'] == 'approved']
            print(f"   ✅ Chi phí đã duyệt: {len(approved_expenses)}")
            
            if len(approved_expenses) > 0:
                total_cost = sum(exp['amount'] for exp in approved_expenses)
                print(f"      💰 Tổng chi phí: {total_cost:,.0f} VND")
            else:
                print(f"      ⚠️  Không có chi phí với status 'approved'")
        
        print("\n" + "="*80)

if __name__ == "__main__":
    try:
        check_invoices()
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        import traceback
        traceback.print_exc()

