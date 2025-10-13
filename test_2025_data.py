#!/usr/bin/env python3
"""
Test 2025 data for Vietnamese Cash Flow Report
"""

import requests
from datetime import date, timedelta

def test_2025_cash_flow():
    """Test cash flow report with 2025 data"""
    print("Testing Vietnamese Cash Flow Report with 2025 data")
    print("=" * 60)
    
    # Test different date ranges in 2025
    test_cases = [
        {
            "name": "Q1 2025 (Jan-Mar)",
            "start_date": "2025-01-01",
            "end_date": "2025-03-31"
        },
        {
            "name": "Q2 2025 (Apr-Jun)", 
            "start_date": "2025-04-01",
            "end_date": "2025-06-30"
        },
        {
            "name": "Q3 2025 (Jul-Sep)",
            "start_date": "2025-07-01", 
            "end_date": "2025-09-30"
        },
        {
            "name": "Q4 2025 (Oct-Dec)",
            "start_date": "2025-10-01",
            "end_date": "2025-12-31"
        },
        {
            "name": "Full Year 2025",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31"
        }
    ]
    
    api_url = "http://localhost:8000/api/reports/financial/cash-flow-vietnamese"
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        print("-" * 40)
        
        params = {
            "start_date": test_case["start_date"],
            "end_date": test_case["end_date"]
        }
        
        try:
            response = requests.get(api_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Status: SUCCESS")
                print(f"Period: {data.get('report_period', 'N/A')}")
                print(f"Currency: {data.get('currency', 'N/A')}")
                print(f"Beginning Cash: {data.get('beginning_cash', 0):,.0f} VND")
                print(f"Ending Cash: {data.get('ending_cash', 0):,.0f} VND")
                print(f"Net Cash Flow: {data.get('net_cash_flow', 0):,.0f} VND")
                print(f"Validation: {'PASS' if data.get('cash_flow_validation') else 'FAIL'}")
                
                # Show section summaries
                operating = data.get('total_operating_cash_flow', 0)
                investing = data.get('total_investing_cash_flow', 0)
                financing = data.get('total_financing_cash_flow', 0)
                
                print(f"Operating: {operating:,.0f} VND")
                print(f"Investing: {investing:,.0f} VND")
                print(f"Financing: {financing:,.0f} VND")
                
            else:
                print(f"Status: FAILED ({response.status_code})")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"Status: ERROR - {str(e)}")
    
    print("\n" + "=" * 60)
    print("2025 Data Test Summary")
    print("=" * 60)
    print("If all tests show SUCCESS, your 2025 data is working!")
    print("If tests show FAILED, you may need to create sample data.")
    print("\nTo create sample data:")
    print("1. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
    print("2. Run: python create_data_2025_simple.py")
    print("\nAccess the report at:")
    print("http://localhost:3000/reports/cash-flow-vietnamese")

def test_frontend_2025():
    """Test frontend with 2025 data"""
    print("\nTesting Frontend with 2025 data...")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:3000/reports/cash-flow-vietnamese", timeout=5)
        
        if response.status_code == 200:
            print("Frontend: SUCCESS")
            print("You can now access the Vietnamese Cash Flow Report!")
            print("URL: http://localhost:3000/reports/cash-flow-vietnamese")
        else:
            print(f"Frontend: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Frontend: ERROR - {str(e)}")

def main():
    """Main function"""
    print("Vietnamese Cash Flow Report - 2025 Data Test")
    print("=" * 60)
    
    # Test API with 2025 data
    test_2025_cash_flow()
    
    # Test frontend
    test_frontend_2025()
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()

