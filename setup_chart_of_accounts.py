#!/usr/bin/env python3
"""
Setup Chart of Accounts for Balance Sheet
Creates the chart_of_accounts table and inserts standard Vietnamese accounting accounts
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

def setup_chart_of_accounts():
    """Setup chart of accounts table and data"""
    try:
        # Load environment variables
        load_dotenv()
        
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("Missing Supabase credentials")
            return False
            
        supabase: Client = create_client(url, key)
        
        # Create chart_of_accounts table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS chart_of_accounts (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            account_code VARCHAR(20) UNIQUE NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            account_type VARCHAR(50) NOT NULL,
            parent_code VARCHAR(20),
            is_active BOOLEAN DEFAULT true,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Execute table creation
        result = supabase.rpc('exec_sql', {'sql': create_table_sql})
        print("Chart of accounts table created")
        
        # Insert standard accounts
        accounts_data = [
            # ASSETS (Tài sản)
            {'account_code': '111', 'account_name': 'Tiền mặt', 'account_type': 'ASSET', 'description': 'Cash on hand'},
            {'account_code': '112', 'account_name': 'Tiền gửi ngân hàng', 'account_type': 'ASSET', 'description': 'Bank deposits'},
            {'account_code': '131', 'account_name': 'Phải thu khách hàng', 'account_type': 'ASSET', 'description': 'Accounts receivable'},
            {'account_code': '152', 'account_name': 'Hàng tồn kho', 'account_type': 'ASSET', 'description': 'Inventory'},
            {'account_code': '211', 'account_name': 'Tài sản cố định hữu hình', 'account_type': 'ASSET', 'description': 'Fixed assets - tangible'},
            {'account_code': '213', 'account_name': 'Tài sản cố định vô hình', 'account_type': 'ASSET', 'description': 'Fixed assets - intangible'},
            {'account_code': '214', 'account_name': 'Hao mòn tài sản cố định', 'account_type': 'ASSET', 'description': 'Accumulated depreciation'},
            
            # LIABILITIES (Nợ phải trả)
            {'account_code': '331', 'account_name': 'Phải trả nhà cung cấp', 'account_type': 'LIABILITY', 'description': 'Accounts payable'},
            {'account_code': '333', 'account_name': 'Thuế và các khoản phải nộp nhà nước', 'account_type': 'LIABILITY', 'description': 'Taxes and government obligations'},
            {'account_code': '341', 'account_name': 'Vay ngắn hạn', 'account_type': 'LIABILITY', 'description': 'Short-term loans'},
            {'account_code': '342', 'account_name': 'Vay dài hạn', 'account_type': 'LIABILITY', 'description': 'Long-term loans'},
            
            # EQUITY (Vốn chủ sở hữu)
            {'account_code': '411', 'account_name': 'Vốn đầu tư của chủ sở hữu', 'account_type': 'EQUITY', 'description': 'Owner capital'},
            {'account_code': '421', 'account_name': 'Lợi nhuận chưa phân phối', 'account_type': 'EQUITY', 'description': 'Retained earnings'},
            
            # REVENUE (Doanh thu)
            {'account_code': '511', 'account_name': 'Doanh thu bán hàng', 'account_type': 'REVENUE', 'description': 'Sales revenue'},
            {'account_code': '512', 'account_name': 'Doanh thu cung cấp dịch vụ', 'account_type': 'REVENUE', 'description': 'Service revenue'},
            
            # EXPENSES (Chi phí)
            {'account_code': '632', 'account_name': 'Giá vốn hàng bán', 'account_type': 'EXPENSE', 'description': 'Cost of goods sold'},
            {'account_code': '641', 'account_name': 'Chi phí bán hàng', 'account_type': 'EXPENSE', 'description': 'Selling expenses'},
            {'account_code': '642', 'account_name': 'Chi phí quản lý doanh nghiệp', 'account_type': 'EXPENSE', 'description': 'Administrative expenses'}
        ]
        
        # Insert accounts
        for account in accounts_data:
            try:
                supabase.table('chart_of_accounts').upsert(account).execute()
            except Exception as e:
                print(f"Warning inserting account {account['account_code']}: {e}")
        
        print("Chart of accounts data inserted")
        
        # Create indexes
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
        CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
        """
        
        supabase.rpc('exec_sql', {'sql': index_sql})
        print("Indexes created")
        
        return True
        
    except Exception as e:
        print(f"Error setting up chart of accounts: {e}")
        return False

if __name__ == "__main__":
    print("Setting up Chart of Accounts...")
    success = setup_chart_of_accounts()
    if success:
        print("Chart of accounts setup completed successfully!")
    else:
        print("Chart of accounts setup failed!")
        sys.exit(1)
