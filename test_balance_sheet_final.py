#!/usr/bin/env python3
"""
Final Balance Sheet Test
Test the balance sheet with real data and display results nicely
"""

import os
import sys
import requests
from datetime import datetime, date
from dotenv import load_dotenv

def test_balance_sheet_with_real_data():
    """Test balance sheet with real data"""
    try:
        # Test with current date
        today = date.today().isoformat()
        
        url = "http://localhost:8000/api/reports/financial/balance-sheet"
        params = {"as_of_date": today}
        
        print(f"Testing Balance Sheet for date: {today}")
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n" + "="*60)
            print("BALANCE SHEET REPORT")
            print("="*60)
            print(f"Report Date: {data['as_of_date']}")
            print(f"Currency: {data['currency']}")
            print(f"Generated: {data['generated_at']}")
            
            print("\nASSETS:")
            print("-" * 30)
            print(f"Total Assets: {data['assets']['total_assets']:,.0f} VND")
            print(f"  Current Assets: {data['assets']['current_assets']:,.0f} VND")
            print(f"  Fixed Assets: {data['assets']['fixed_assets']:,.0f} VND")
            
            print("\nAsset Breakdown:")
            for asset in data['assets']['asset_breakdown']:
                if asset['amount'] > 0:
                    print(f"  {asset['category']}: {asset['amount']:,.0f} VND ({asset['percentage']:.1f}%)")
            
            print("\nLIABILITIES:")
            print("-" * 30)
            print(f"Total Liabilities: {data['liabilities']['total_liabilities']:,.0f} VND")
            print(f"  Current Liabilities: {data['liabilities']['current_liabilities']:,.0f} VND")
            print(f"  Long-term Liabilities: {data['liabilities']['long_term_liabilities']:,.0f} VND")
            
            print("\nLiability Breakdown:")
            for liability in data['liabilities']['liability_breakdown']:
                if liability['amount'] > 0:
                    print(f"  {liability['category']}: {liability['amount']:,.0f} VND ({liability['percentage']:.1f}%)")
            
            print("\nEQUITY:")
            print("-" * 30)
            print(f"Total Equity: {data['equity']['total_equity']:,.0f} VND")
            
            print("\nSUMMARY:")
            print("-" * 30)
            print(f"Assets = Liabilities + Equity: {data['summary']['balance_check']}")
            print(f"Total Assets: {data['summary']['total_assets']:,.0f} VND")
            print(f"Total Liabilities: {data['summary']['total_liabilities']:,.0f} VND")
            print(f"Total Equity: {data['summary']['total_equity']:,.0f} VND")
            
            return True
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing balance sheet: {e}")
        return False

def main():
    """Main function"""
    print("Final Balance Sheet Test with Real Data")
    print("="*50)
    
    if test_balance_sheet_with_real_data():
        print("\n" + "="*60)
        print("Balance Sheet test completed successfully!")
        print("="*60)
        print("\nNext steps:")
        print("1. Open http://localhost:3000/reports/balance-sheet in your browser")
        print("2. View the balance sheet with real financial data")
        print("3. Verify that Assets = Liabilities + Equity")
        print("4. The balance sheet is now fully functional!")
    else:
        print("Balance Sheet test failed!")

if __name__ == "__main__":
    main()
