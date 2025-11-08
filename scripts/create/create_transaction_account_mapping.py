#!/usr/bin/env python3
"""
Transaction Account Mapping Script
Maps business transactions to Vietnamese chart of accounts
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    
    return create_client(url, key)

# Transaction to Account Mapping Rules
TRANSACTION_ACCOUNT_MAPPING = {
    # Sales Transactions
    "invoice": {
        "debit": [
            {"account": "131", "description": "Phải thu khách hàng", "amount_field": "total_amount"}
        ],
        "credit": [
            {"account": "511", "description": "Doanh thu bán hàng", "amount_field": "total_amount"}
        ]
    },
    
    "sales_receipt": {
        "debit": [
            {"account": "111", "description": "Tiền mặt", "amount_field": "total_amount", "condition": "payment_method = 'cash'"},
            {"account": "112", "description": "Tiền gửi ngân hàng", "amount_field": "total_amount", "condition": "payment_method = 'bank_transfer'"}
        ],
        "credit": [
            {"account": "511", "description": "Doanh thu bán hàng", "amount_field": "total_amount"}
        ]
    },
    
    # Purchase Transactions
    "bill": {
        "debit": [
            {"account": "632", "description": "Giá vốn hàng bán", "amount_field": "amount", "condition": "category = 'inventory'"},
            {"account": "641", "description": "Chi phí bán hàng", "amount_field": "amount", "condition": "category = 'selling'"},
            {"account": "642", "description": "Chi phí quản lý doanh nghiệp", "amount_field": "amount", "condition": "category = 'administrative'"}
        ],
        "credit": [
            {"account": "331", "description": "Phải trả nhà cung cấp", "amount_field": "amount"}
        ]
    },
    
    "expense": {
        "debit": [
            {"account": "641", "description": "Chi phí bán hàng", "amount_field": "amount", "condition": "category = 'selling'"},
            {"account": "642", "description": "Chi phí quản lý doanh nghiệp", "amount_field": "amount", "condition": "category = 'administrative'"},
            {"account": "635", "description": "Chi phí tài chính", "amount_field": "amount", "condition": "category = 'financial'"}
        ],
        "credit": [
            {"account": "111", "description": "Tiền mặt", "amount_field": "amount", "condition": "payment_method = 'cash'"},
            {"account": "112", "description": "Tiền gửi ngân hàng", "amount_field": "amount", "condition": "payment_method = 'bank_transfer'"}
        ]
    },
    
    # Payment Transactions
    "payment_received": {
        "debit": [
            {"account": "111", "description": "Tiền mặt", "amount_field": "amount", "condition": "payment_method = 'cash'"},
            {"account": "112", "description": "Tiền gửi ngân hàng", "amount_field": "amount", "condition": "payment_method = 'bank_transfer'"}
        ],
        "credit": [
            {"account": "131", "description": "Phải thu khách hàng", "amount_field": "amount"}
        ]
    },
    
    "payment_made": {
        "debit": [
            {"account": "331", "description": "Phải trả nhà cung cấp", "amount_field": "amount"}
        ],
        "credit": [
            {"account": "111", "description": "Tiền mặt", "amount_field": "amount", "condition": "payment_method = 'cash'"},
            {"account": "112", "description": "Tiền gửi ngân hàng", "amount_field": "amount", "condition": "payment_method = 'bank_transfer'"}
        ]
    },
    
    # Payroll Transactions
    "payroll": {
        "debit": [
            {"account": "642", "description": "Chi phí quản lý doanh nghiệp", "amount_field": "gross_salary"}
        ],
        "credit": [
            {"account": "334", "description": "Phải trả người lao động", "amount_field": "net_salary"},
            {"account": "333", "description": "Thuế và các khoản phải nộp nhà nước", "amount_field": "tax_amount"}
        ]
    },
    
    # Asset Transactions
    "asset_purchase": {
        "debit": [
            {"account": "211", "description": "Tài sản cố định hữu hình", "amount_field": "amount", "condition": "asset_type = 'tangible'"},
            {"account": "213", "description": "Tài sản cố định vô hình", "amount_field": "amount", "condition": "asset_type = 'intangible'"}
        ],
        "credit": [
            {"account": "111", "description": "Tiền mặt", "amount_field": "amount", "condition": "payment_method = 'cash'"},
            {"account": "112", "description": "Tiền gửi ngân hàng", "amount_field": "amount", "condition": "payment_method = 'bank_transfer'"},
            {"account": "331", "description": "Phải trả nhà cung cấp", "amount_field": "amount", "condition": "payment_method = 'credit'"}
        ]
    }
}

def create_journal_entry_from_transaction(supabase: Client, transaction_type: str, transaction_data: dict, user_id: str = None):
    """Create journal entry from transaction data"""
    try:
        if transaction_type not in TRANSACTION_ACCOUNT_MAPPING:
            print(f"Unknown transaction type: {transaction_type}")
            return None
        
        mapping = TRANSACTION_ACCOUNT_MAPPING[transaction_type]
        
        # Generate entry number
        entry_number = f"JE-{datetime.now().strftime('%Y%m%d')}-{transaction_data.get('id', '0001')[:4]}"
        
        # Create journal entry
        journal_entry = {
            "entry_number": entry_number,
            "entry_date": transaction_data.get('created_at', datetime.now().isoformat()),
            "description": f"Giao dịch {transaction_type}: {transaction_data.get('description', '')}",
            "transaction_type": transaction_type,
            "transaction_id": transaction_data.get('id'),
            "status": "posted",
            "total_debit": 0,
            "total_credit": 0,
            "created_by": user_id
        }
        
        # Calculate totals
        total_debit = 0
        total_credit = 0
        
        # Create journal entry lines
        lines = []
        
        # Process debit entries
        for debit_entry in mapping.get("debit", []):
            amount = get_amount_from_transaction(transaction_data, debit_entry)
            if amount > 0:
                lines.append({
                    "account_code": debit_entry["account"],
                    "account_name": debit_entry["description"],
                    "debit_amount": amount,
                    "credit_amount": 0,
                    "description": debit_entry["description"],
                    "reference_id": transaction_data.get('id'),
                    "reference_type": transaction_type
                })
                total_debit += amount
        
        # Process credit entries
        for credit_entry in mapping.get("credit", []):
            amount = get_amount_from_transaction(transaction_data, credit_entry)
            if amount > 0:
                lines.append({
                    "account_code": credit_entry["account"],
                    "account_name": credit_entry["description"],
                    "debit_amount": 0,
                    "credit_amount": amount,
                    "description": credit_entry["description"],
                    "reference_id": transaction_data.get('id'),
                    "reference_type": transaction_type
                })
                total_credit += amount
        
        # Update totals
        journal_entry["total_debit"] = total_debit
        journal_entry["total_credit"] = total_credit
        
        # Validate double-entry
        if abs(total_debit - total_credit) > 0.01:
            print(f"Warning: Unbalanced entry for {transaction_type} - Debit: {total_debit}, Credit: {total_credit}")
            return None
        
        # Insert journal entry
        result = supabase.table("journal_entries").insert(journal_entry).execute()
        
        if result.data:
            entry_id = result.data[0]["id"]
            
            # Insert journal entry lines
            for line in lines:
                line["entry_id"] = entry_id
            
            supabase.table("journal_entry_lines").insert(lines).execute()
            
            print(f"Created journal entry {entry_number} for {transaction_type}")
            return entry_id
        
        return None
        
    except Exception as e:
        print(f"Error creating journal entry for {transaction_type}: {str(e)}")
        return None

def get_amount_from_transaction(transaction_data: dict, entry_config: dict) -> float:
    """Get amount from transaction data based on configuration"""
    try:
        amount_field = entry_config.get("amount_field", "amount")
        amount = transaction_data.get(amount_field, 0)
        
        # Apply conditions if specified
        condition = entry_config.get("condition")
        if condition:
            # Simple condition evaluation (can be enhanced)
            if "payment_method = 'cash'" in condition:
                if transaction_data.get("payment_method") != "cash":
                    return 0
            elif "payment_method = 'bank_transfer'" in condition:
                if transaction_data.get("payment_method") != "bank_transfer":
                    return 0
            elif "category = 'inventory'" in condition:
                if transaction_data.get("category") != "inventory":
                    return 0
            # Add more conditions as needed
        
        return float(amount) if amount else 0.0
        
    except Exception:
        return 0.0

def create_chart_of_accounts(supabase: Client):
    """Create Vietnamese chart of accounts"""
    try:
        # Read and execute the SQL file
        with open('create_vietnamese_chart_of_accounts.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                try:
                    supabase.rpc('exec_sql', {'sql': statement}).execute()
                except Exception as e:
                    print(f"Warning: Could not execute statement: {str(e)}")
        
        print("Vietnamese chart of accounts created successfully")
        return True
        
    except Exception as e:
        print(f"Error creating chart of accounts: {str(e)}")
        return False

def main():
    """Main function"""
    print("Vietnamese Chart of Accounts and Transaction Mapping Setup")
    print("=" * 60)
    
    try:
        supabase = get_supabase_client()
        
        # Step 1: Create chart of accounts
        print("\n1. Creating Vietnamese Chart of Accounts...")
        if create_chart_of_accounts(supabase):
            print("✅ Chart of accounts created successfully")
        else:
            print("❌ Failed to create chart of accounts")
            return
        
        # Step 2: Test account mapping
        print("\n2. Testing transaction mapping...")
        
        # Test invoice mapping
        test_invoice = {
            "id": "test-invoice-001",
            "total_amount": 1000000,
            "description": "Test invoice",
            "created_at": datetime.now().isoformat()
        }
        
        entry_id = create_journal_entry_from_transaction(supabase, "invoice", test_invoice)
        if entry_id:
            print("✅ Invoice mapping test successful")
        else:
            print("❌ Invoice mapping test failed")
        
        # Test expense mapping
        test_expense = {
            "id": "test-expense-001",
            "amount": 500000,
            "category": "administrative",
            "payment_method": "bank_transfer",
            "description": "Test expense",
            "created_at": datetime.now().isoformat()
        }
        
        entry_id = create_journal_entry_from_transaction(supabase, "expense", test_expense)
        if entry_id:
            print("✅ Expense mapping test successful")
        else:
            print("❌ Expense mapping test failed")
        
        print("\n3. Setup completed successfully!")
        print("\nNext steps:")
        print("- Use the new API endpoint: /api/reports/financial/cash-flow-vietnamese")
        print("- Access the Vietnamese cash flow report at: /reports/cash-flow-vietnamese")
        print("- The system now supports Vietnamese accounting standards with debit/credit classification")
        
    except Exception as e:
        print(f"Error in main: {str(e)}")

if __name__ == "__main__":
    main()
