#!/usr/bin/env python3
"""
Create sample data for 2025 to test Vietnamese Cash Flow Report
"""

import os
import sys
from datetime import datetime, date, timedelta
import random
from decimal import Decimal

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def get_supabase_client():
    """Get Supabase client"""
    from supabase import create_client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set")
        return None
    
    return create_client(url, key)

def create_sample_data_2025():
    """Create sample data for 2025"""
    print("Creating sample data for 2025...")
    
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Create sample customers
        customers_data = [
            {
                "customer_code": "KH001",
                "name": "Công ty ABC",
                "type": "company",
                "email": "contact@abc.com",
                "phone": "0123456789",
                "address": "123 Đường ABC, Quận 1, TP.HCM",
                "status": "active"
            },
            {
                "customer_code": "KH002", 
                "name": "Công ty XYZ",
                "type": "company",
                "email": "info@xyz.com",
                "phone": "0987654321",
                "address": "456 Đường XYZ, Quận 2, TP.HCM",
                "status": "active"
            },
            {
                "customer_code": "KH003",
                "name": "Công ty DEF",
                "type": "company", 
                "email": "hello@def.com",
                "phone": "0555666777",
                "address": "789 Đường DEF, Quận 3, TP.HCM",
                "status": "active"
            }
        ]
        
        print("Creating customers...")
        customers_result = supabase.table("customers").insert(customers_data).execute()
        customer_ids = [customer["id"] for customer in customers_result.data]
        print(f"✅ Created {len(customer_ids)} customers")
        
        # Create sample vendors
        vendors_data = [
            {
                "vendor_code": "NCC001",
                "name": "Nhà cung cấp A",
                "email": "vendor@supplier-a.com",
                "phone": "0111222333",
                "address": "111 Đường NCC A, TP.HCM",
                "status": "active"
            },
            {
                "vendor_code": "NCC002",
                "name": "Nhà cung cấp B", 
                "email": "info@supplier-b.com",
                "phone": "0444555666",
                "address": "222 Đường NCC B, TP.HCM",
                "status": "active"
            }
        ]
        
        print("Creating vendors...")
        vendors_result = supabase.table("vendors").insert(vendors_data).execute()
        vendor_ids = [vendor["id"] for vendor in vendors_result.data]
        print(f"✅ Created {len(vendor_ids)} vendors")
        
        # Create sample invoices for 2025
        print("Creating invoices for 2025...")
        invoices_data = []
        for month in range(1, 13):  # All 12 months of 2025
            for i in range(2):  # 2 invoices per month
                invoice_date = date(2025, month, random.randint(1, 28))
                amount = random.randint(1000000, 10000000)  # 1M to 10M VND
                
                invoices_data.append({
                    "invoice_number": f"INV-2025-{month:02d}-{i+1:03d}",
                    "customer_id": random.choice(customer_ids),
                    "issue_date": invoice_date.isoformat(),
                    "due_date": (invoice_date + timedelta(days=30)).isoformat(),
                    "total_amount": amount,
                    "status": "paid" if random.random() > 0.3 else "pending",
                    "description": f"Hóa đơn tháng {month}/2025"
                })
        
        invoices_result = supabase.table("invoices").insert(invoices_data).execute()
        print(f"✅ Created {len(invoices_result.data)} invoices")
        
        # Create sample expenses for 2025
        print("Creating expenses for 2025...")
        expenses_data = []
        expense_categories = ["administrative", "selling", "financial", "operating"]
        
        for month in range(1, 13):
            for i in range(3):  # 3 expenses per month
                expense_date = date(2025, month, random.randint(1, 28))
                amount = random.randint(500000, 5000000)  # 500K to 5M VND
                
                expenses_data.append({
                    "vendor_id": random.choice(vendor_ids),
                    "amount": amount,
                    "category": random.choice(expense_categories),
                    "description": f"Chi phí tháng {month}/2025 - {random.choice(['Điện', 'Nước', 'Internet', 'Văn phòng phẩm', 'Điện thoại'])}",
                    "expense_date": expense_date.isoformat(),
                    "status": "approved",
                    "payment_method": random.choice(["cash", "bank_transfer"])
                })
        
        expenses_result = supabase.table("expenses").insert(expenses_data).execute()
        print(f"✅ Created {len(expenses_result.data)} expenses")
        
        # Create sample bills for 2025
        print("Creating bills for 2025...")
        bills_data = []
        
        for month in range(1, 13):
            for i in range(2):  # 2 bills per month
                bill_date = date(2025, month, random.randint(1, 28))
                amount = random.randint(2000000, 8000000)  # 2M to 8M VND
                
                bills_data.append({
                    "bill_number": f"BILL-2025-{month:02d}-{i+1:03d}",
                    "vendor_id": random.choice(vendor_ids),
                    "issue_date": bill_date.isoformat(),
                    "due_date": (bill_date + timedelta(days=45)).isoformat(),
                    "amount": amount,
                    "status": "paid" if random.random() > 0.4 else "pending",
                    "description": f"Hóa đơn nhà cung cấp tháng {month}/2025"
                })
        
        bills_result = supabase.table("bills").insert(bills_data).execute()
        print(f"✅ Created {len(bills_result.data)} bills")
        
        # Create sample sales receipts for 2025
        print("Creating sales receipts for 2025...")
        sales_receipts_data = []
        
        for month in range(1, 13):
            for i in range(1):  # 1 sales receipt per month
                receipt_date = date(2025, month, random.randint(1, 28))
                amount = random.randint(500000, 3000000)  # 500K to 3M VND
                
                sales_receipts_data.append({
                    "receipt_number": f"SR-2025-{month:02d}-{i+1:03d}",
                    "customer_id": random.choice(customer_ids),
                    "receipt_date": receipt_date.isoformat(),
                    "total_amount": amount,
                    "status": "paid",
                    "payment_method": random.choice(["cash", "bank_transfer"]),
                    "description": f"Biên lai bán hàng tháng {month}/2025"
                })
        
        sales_receipts_result = supabase.table("sales_receipts").insert(sales_receipts_data).execute()
        print(f"✅ Created {len(sales_receipts_result.data)} sales receipts")
        
        # Create journal entries for 2025
        print("Creating journal entries for 2025...")
        journal_entries_data = []
        
        # Sample journal entries for each month
        for month in range(1, 13):
            for i in range(5):  # 5 journal entries per month
                entry_date = date(2025, month, random.randint(1, 28))
                
                journal_entries_data.append({
                    "entry_number": f"JE-2025-{month:02d}-{i+1:03d}",
                    "entry_date": entry_date.isoformat(),
                    "description": f"Bút toán tháng {month}/2025 - Giao dịch {i+1}",
                    "transaction_type": random.choice(["invoice", "expense", "payment", "receipt"]),
                    "status": "posted",
                    "total_debit": random.randint(1000000, 5000000),
                    "total_credit": random.randint(1000000, 5000000)
                })
        
        journal_entries_result = supabase.table("journal_entries").insert(journal_entries_data).execute()
        print(f"✅ Created {len(journal_entries_result.data)} journal entries")
        
        # Create journal entry lines
        print("Creating journal entry lines...")
        journal_entry_lines_data = []
        
        for entry in journal_entries_result.data:
            # Create 2-3 lines per journal entry
            num_lines = random.randint(2, 3)
            accounts = ["111", "112", "131", "331", "511", "632", "641", "642"]
            
            for i in range(num_lines):
                account_code = random.choice(accounts)
                debit_amount = random.randint(100000, 2000000) if i == 0 else 0
                credit_amount = random.randint(100000, 2000000) if i > 0 else 0
                
                journal_entry_lines_data.append({
                    "entry_id": entry["id"],
                    "account_code": account_code,
                    "account_name": f"Tài khoản {account_code}",
                    "debit_amount": debit_amount,
                    "credit_amount": credit_amount,
                    "description": f"Dòng {i+1} của bút toán {entry['entry_number']}"
                })
        
        # Insert in batches to avoid timeout
        batch_size = 100
        for i in range(0, len(journal_entry_lines_data), batch_size):
            batch = journal_entry_lines_data[i:i+batch_size]
            supabase.table("journal_entry_lines").insert(batch).execute()
        
        print(f"✅ Created {len(journal_entry_lines_data)} journal entry lines")
        
        print("\n🎉 Sample data for 2025 created successfully!")
        print("\n📊 Data Summary:")
        print(f"  • Customers: {len(customer_ids)}")
        print(f"  • Vendors: {len(vendor_ids)}")
        print(f"  • Invoices: {len(invoices_result.data)}")
        print(f"  • Expenses: {len(expenses_result.data)}")
        print(f"  • Bills: {len(bills_result.data)}")
        print(f"  • Sales Receipts: {len(sales_receipts_result.data)}")
        print(f"  • Journal Entries: {len(journal_entries_result.data)}")
        print(f"  • Journal Entry Lines: {len(journal_entry_lines_data)}")
        
        print("\n🚀 Now you can test the Vietnamese Cash Flow Report with 2025 data!")
        print("Access: http://localhost:3000/reports/cash-flow-vietnamese")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        return False

def main():
    """Main function"""
    print("Creating Sample Data for 2025")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("backend") or not os.path.exists("frontend"):
        print("❌ Please run this script from the project root directory")
        return
    
    # Check environment variables
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_ANON_KEY"):
        print("⚠️  Warning: SUPABASE_URL and SUPABASE_ANON_KEY not set")
        print("Make sure to set these environment variables")
    
    success = create_sample_data_2025()
    
    if success:
        print("\n✅ Sample data creation completed!")
        print("\nNext steps:")
        print("1. Start backend: cd backend && python main.py")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Test report: http://localhost:3000/reports/cash-flow-vietnamese")
    else:
        print("\n❌ Sample data creation failed!")

if __name__ == "__main__":
    main()

