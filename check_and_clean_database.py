"""
Script kiem tra va xoa du lieu mau
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Cau hinh Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def check_database_tables():
    """Kiem tra cac bang trong database"""
    print("KIEM TRA CAC BANG TRONG DATABASE")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return []
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Cac bang can kiem tra
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
        "cash_flow",
        "customers",
        "products",
        "categories",
        "employees",
        "users",
        "departments",
        "positions"
    ]
    
    existing_tables = []
    
    for table in tables_to_check:
        try:
            result = supabase.table(table).select("id", count="exact").execute()
            count = result.count or 0
            print(f"   {table}: {count} records - OK")
            existing_tables.append(table)
        except Exception as e:
            print(f"   {table}: Error - {str(e)}")
    
    return existing_tables

def clean_existing_tables(existing_tables):
    """Xoa du lieu trong cac bang ton tai"""
    print("\nXOA DU LIEU TRONG CAC BANG TON TAI")
    print("=" * 50)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Loi: Thieu cau hinh Supabase")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Cac bang can xoa du lieu (khong xoa bang cau truc)
    tables_to_clean = [
        "invoices",
        "invoice_items", 
        "payments",
        "expenses",
        "expense_items",
        "bills",
        "bill_items",
        "transactions",
        "cash_flow"
    ]
    
    cleaned_count = 0
    
    for table in tables_to_clean:
        if table in existing_tables:
            try:
                print(f"Xoa du lieu trong {table}...")
                result = supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
                count = len(result.data) if result.data else 0
                print(f"   - Xoa {count} records")
                cleaned_count += count
            except Exception as e:
                print(f"   - Loi: {str(e)}")
        else:
            print(f"Bang {table} khong ton tai")
    
    print(f"\nTong cong da xoa: {cleaned_count} records")
    return True

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
            "expenses",
            "expense_items",
            "bills",
            "bill_items",
            "transactions",
            "cash_flow",
            "customers",
            "products",
            "categories",
            "employees",
            "users",
            "departments",
            "positions"
        ]
        
        total_records = 0
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("id", count="exact").execute()
                count = result.count or 0
                print(f"   {table}: {count} records")
                total_records += count
            except Exception as e:
                print(f"   {table}: Error - {str(e)}")
        
        print(f"\nTong cong: {total_records} records")
        
        if total_records == 0:
            print("Database da duoc xoa sach!")
        else:
            print("Database van con du lieu")
        
    except Exception as e:
        print(f"Loi kiem tra: {str(e)}")

def create_summary():
    """Tao tom tat"""
    print("\nTOM TAT")
    print("=" * 50)
    
    print("Da thuc hien:")
    print("1. Kiem tra cac bang trong database")
    print("2. Xoa du lieu mau trong cac bang ton tai")
    print("3. Kiem tra du lieu con lai")
    
    print("\nCac bang da duoc xoa du lieu:")
    print("- invoices (hoa don)")
    print("- invoice_items (chi tiet hoa don)")
    print("- payments (thanh toan)")
    print("- expenses (chi phi)")
    print("- expense_items (chi tiet chi phi)")
    print("- bills (hoa don phai tra)")
    print("- bill_items (chi tiet hoa don phai tra)")
    print("- transactions (giao dich)")
    print("- cash_flow (luu chuyen tien te)")
    
    print("\nCac bang duoc giu lai:")
    print("- customers (khach hang)")
    print("- products (san pham)")
    print("- categories (danh muc)")
    print("- employees (nhan vien)")
    print("- users (nguoi dung)")
    print("- departments (phong ban)")
    print("- positions (chuc vu)")

if __name__ == "__main__":
    print("KIEM TRA VA XOA DU LIEU MAU")
    print("=" * 60)
    
    # Kiem tra cac bang
    existing_tables = check_database_tables()
    
    # Xoa du lieu trong cac bang ton tai
    clean_existing_tables(existing_tables)
    
    # Kiem tra du lieu con lai
    check_remaining_data()
    
    # Tao tom tat
    create_summary()
    
    print("\n" + "=" * 60)
    print("HOAN THANH XOA DU LIEU MAU")
    print("=" * 60)
