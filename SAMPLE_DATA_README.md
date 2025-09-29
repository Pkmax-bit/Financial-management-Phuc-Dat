# Sample Data for Financial Management System

This directory contains sample data to test all the reporting functionality in the Financial Management System.

## Files

- `create_sample_data.sql` - Complete SQL script with sample data
- `insert_sample_data.py` - Python script to insert data programmatically
- `run_sample_data.py` - Simple script with instructions
- `SAMPLE_DATA_README.md` - This documentation file

## Quick Start

### Method 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the content from `create_sample_data.sql`
4. Paste and run the SQL script
5. Verify the data was inserted correctly

### Method 2: Using Python Script

1. Make sure you have the required dependencies:
   ```bash
   pip install supabase python-dotenv
   ```

2. Set up your environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the script:
   ```bash
   python run_sample_data.py
   ```

## Sample Data Overview

### Customers (5 records)
- Công ty TNHH ABC (VIP customer)
- Doanh nghiệp XYZ (Regular customer)
- Cá nhân Nguyễn C (Individual customer)
- Tập đoàn GHI (Large customer)
- Công ty JKL (New customer)

### Vendors (5 records)
- Nhà cung cấp MNO (Main supplier)
- Công ty PQR (Secondary supplier)
- Tập đoàn STU (Large supplier)
- Công ty VWX (Local supplier)
- Doanh nghiệp YZ (Professional supplier)

### Projects (5 records)
- Dự án Website ABC (High priority, 75% complete)
- Hệ thống ERP XYZ (Urgent priority, 45% complete)
- App Mobile GHI (Medium priority, 30% complete)
- Bảo trì JKL (Low priority, 60% complete)
- Tư vấn Cá nhân (Medium priority, planning)

### Sales Data
- **Invoices (5 records)**: Total value ~220M VND
  - Various statuses: paid, partial, pending, overdue
  - Different customers and projects
  - Includes tax calculations

- **Sales Receipts (3 records)**: Total value ~9.8M VND
  - Different payment methods: Cash, Credit Card, Bank Transfer
  - Immediate payment transactions

- **Credit Memos (2 records)**: Total value ~6.6M VND
  - Returns and allowances
  - Applied and refunded scenarios

### Expense Data
- **Bills (5 records)**: Total value ~73M VND
  - Various vendors and projects
  - Different payment statuses
  - Overdue and pending bills

- **Expenses (5 records)**: Total value ~19.5M VND
  - Different categories: travel, meals, supplies, training
  - Various approval statuses

- **Expense Claims (3 records)**: Total value ~10.5M VND
  - Employee reimbursement requests
  - Different statuses: paid, approved, submitted

### Accounting Data
- **Journal Entries (5 records)**: Complete double-entry accounting
  - Proper debit/credit balances
  - Linked to invoices and sales receipts
  - Account codes: 111 (Cash), 112 (Bank), 131 (A/R), 511 (Revenue), 3331 (Tax)

### Budgeting Data
- **Budgets (3 records)**: 
  - Q1 2024 Budget (100M VND, approved)
  - Marketing 2024 Budget (50M VND, approved)
  - Q2 2024 Budget (120M VND, draft)

- **Budget Lines**: Detailed breakdown by expense categories

## Testing Reports

After inserting the sample data, you can test all the following reports:

### Financial Reports
1. **Profit & Loss Report**
   - Revenue: ~230M VND (Invoices + Sales Receipts)
   - Expenses: ~92.5M VND (Bills + Expenses)
   - Net Profit: ~137.5M VND

2. **Balance Sheet Report**
   - Assets: Cash, Bank, Accounts Receivable
   - Liabilities: Accounts Payable, Tax Payable
   - Equity: Retained Earnings

3. **Cash Flow Statement**
   - Operating Activities: Net Income adjustments
   - Investing Activities: Equipment purchases
   - Financing Activities: Capital contributions

### Operational Reports
4. **Sales by Customer Report**
   - Ranked list of customers by revenue
   - ABC Company: ~30M VND
   - XYZ Enterprise: ~60M VND
   - GHI Group: ~88M VND

5. **Expenses by Vendor Report**
   - Ranked list of vendors by expenses
   - MNO Supplier: ~10M VND
   - PQR Company: ~20M VND
   - STU Group: ~30M VND

6. **General Ledger Report**
   - Chronological transaction records
   - Account balances
   - Running balance calculations

## Data Relationships

The sample data includes proper relationships:
- Customers → Invoices → Journal Entries
- Vendors → Bills → Journal Entries
- Projects → Invoices/Bills/Expenses
- Sales Receipts → Journal Entries
- Credit Memos → Journal Entries
- Expense Claims → Journal Entries
- Budgets → Budget Lines

## Account Codes Used

- **111**: Tiền mặt (Cash)
- **112**: Tiền gửi ngân hàng (Bank Account)
- **131**: Phải thu khách hàng (Accounts Receivable)
- **511**: Doanh thu bán hàng (Sales Revenue)
- **3331**: Thuế GTGT phải nộp (VAT Payable)

## Notes

- All amounts are in VND (Vietnamese Dong)
- Dates are set in 2024 for current testing
- Tax rate is 10% (standard Vietnam VAT)
- All journal entries follow double-entry accounting principles
- Data includes various statuses to test different scenarios

## Troubleshooting

If you encounter issues:

1. **Foreign Key Errors**: Make sure all referenced tables exist
2. **Duplicate Key Errors**: Clear existing data before inserting
3. **Permission Errors**: Check your Supabase RLS policies
4. **Data Not Showing**: Verify the data was inserted in the correct tables

## Clean Up

To remove all sample data, run:
```sql
-- Delete in reverse order of dependencies
DELETE FROM budget_lines;
DELETE FROM budgets;
DELETE FROM expense_claims;
DELETE FROM credit_memos;
DELETE FROM journal_entry_lines;
DELETE FROM journal_entries;
DELETE FROM expenses;
DELETE FROM bills;
DELETE FROM sales_receipts;
DELETE FROM invoices;
DELETE FROM projects;
DELETE FROM vendors;
DELETE FROM customers;
```

## Support

If you need help with the sample data or reports, check:
1. The main application documentation
2. The API endpoints documentation
3. The database schema files
4. The report component documentation
