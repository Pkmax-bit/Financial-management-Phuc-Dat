#!/usr/bin/env python3
"""
Simple test without unicode
"""

import requests
from datetime import date, timedelta

def test_api():
    print("Testing API...")
    
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    url = "http://localhost:8000/api/reports/financial/cash-flow-vietnamese"
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("API: SUCCESS")
            print(f"Period: {data.get('report_period')}")
            print(f"Currency: {data.get('currency')}")
            print(f"Net Cash Flow: {data.get('net_cash_flow', 0):,.0f} VND")
            return True
        else:
            print(f"API: FAILED ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"API: ERROR - {str(e)}")
        return False

def test_frontend():
    print("Testing Frontend...")
    
    try:
        response = requests.get("http://localhost:3000/reports/cash-flow-vietnamese", timeout=5)
        
        if response.status_code == 200:
            print("Frontend: SUCCESS")
            return True
        else:
            print(f"Frontend: FAILED ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"Frontend: ERROR - {str(e)}")
        return False

def main():
    print("Vietnamese Cash Flow Report Test")
    print("=" * 40)
    
    api_ok = test_api()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 40)
    print("RESULTS:")
    print(f"API: {'PASS' if api_ok else 'FAIL'}")
    print(f"Frontend: {'PASS' if frontend_ok else 'FAIL'}")
    
    if api_ok and frontend_ok:
        print("\nALL TESTS PASSED!")
        print("Access: http://localhost:3000/reports/cash-flow-vietnamese")
    else:
        print("\nSome tests failed.")

if __name__ == "__main__":
    main()
