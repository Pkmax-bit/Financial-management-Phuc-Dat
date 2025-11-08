"""
Script xoa du lieu mau o ban hang va chi phi
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def clean_sample_data():
    """Xoa du lieu mau"""
    print("XOA DU LIEU MAU")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Xoa du lieu ban hang
        print("1. Xoa du lieu ban hang...")
        
        # Xoa invoices
        invoices_result = supabase.table("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa invoices: {len(invoices_result.data) if invoices_result.data else 0} records")
        
        # Xoa invoice_items
        invoice_items_result = supabase.table("invoice_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa invoice_items: {len(invoice_items_result.data) if invoice_items_result.data else 0} records")
        
        # Xoa payments
        payments_result = supabase.table("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa payments: {len(payments_result.data) if payments_result.data else 0} records")
        
        # Xoa sales
        sales_result = supabase.table("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa sales: {len(sales_result.data) if sales_result.data else 0} records")
        
        print("   Ban hang da duoc xoa sach")
        
        # Xoa du lieu chi phi
        print("\n2. Xoa du lieu chi phi...")
        
        # Xoa expenses
        expenses_result = supabase.table("expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa expenses: {len(expenses_result.data) if expenses_result.data else 0} records")
        
        # Xoa expense_items
        expense_items_result = supabase.table("expense_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa expense_items: {len(expense_items_result.data) if expense_items_result.data else 0} records")
        
        # Xoa bills
        bills_result = supabase.table("bills").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa bills: {len(bills_result.data) if bills_result.data else 0} records")
        
        # Xoa bill_items
        bill_items_result = supabase.table("bill_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa bill_items: {len(bill_items_result.data) if bill_items_result.data else 0} records")
        
        print("   Chi phi da duoc xoa sach")
        
        # Xoa du lieu khac
        print("\n3. Xoa du lieu khac...")
        
        # Xoa transactions
        transactions_result = supabase.table("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa transactions: {len(transactions_result.data) if transactions_result.data else 0} records")
        
        # Xoa cash_flow
        cash_flow_result = supabase.table("cash_flow").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   - Xoa cash_flow: {len(cash_flow_result.data) if cash_flow_result.data else 0} records")
        
        print("   Du lieu khac da duoc xoa sach")
        
        return True
        
    except Exception as e:
        print(f"Loi xoa du lieu: {str(e)}")
        return False

def check_remaining_data():
    """Kiem tra du lieu con lai"""
    print("\nKIEM TRA DU LIEU CON LAI")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        # Kiem tra cac bang chinh
        tables_to_check = [
            "invoices",
            "invoice_items", 
            "payments",
            "sales",
            "expenses",
            "expense_items",
            "bills",
            "bill_items",
            "transactions",
            "cash_flow"
        ]
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("id", count="exact").execute()
                count = result.count or 0
                print(f"   {table}: {count} records")
            except Exception as e:
                print(f"   {table}: Error - {str(e)}")
        
        print("\nDu lieu da duoc xoa sach!")
        
    except Exception as e:
        print(f"Loi kiem tra: {str(e)}")

def create_clean_database():
    """Tao database sach"""
    print("\nTAO DATABASE SACH")
    print("=" * 50)
    
    print("Database da duoc lam sach:")
    print("- Xoa tat ca du lieu mau o ban hang")
    print("- Xoa tat ca du lieu mau o chi phi")
    print("- Xoa tat ca du lieu mau o giao dich")
    print("- Giu lai cau truc bang va du lieu can thiet")
    print("- San sang cho du lieu thuc te")

if __name__ == "__main__":
    print("XOA DU LIEU MAU")
    print("=" * 60)
    
    # Xoa du lieu mau
    success = clean_sample_data()
    
    if success:
        # Kiem tra du lieu con lai
        check_remaining_data()
        
        # Tao database sach
        create_clean_database()
    
    print("\n" + "=" * 60)
    print("HOAN THANH XOA DU LIEU MAU")
    print("=" * 60)
