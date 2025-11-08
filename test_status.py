#!/usr/bin/env python3
"""
Test status codes only
"""

import requests
from datetime import date, timedelta

def test_api_status():
    print("Testing API status...")
    
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    url = "http://localhost:8000/api/reports/financial/cash-flow-vietnamese"
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"API Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("API: SUCCESS")
            return True
        else:
            print("API: FAILED")
            return False
            
    except Exception as e:
        print(f"API: ERROR - {str(e)}")
        return False

def test_frontend_status():
    print("Testing Frontend status...")
    
    try:
        response = requests.get("http://localhost:3000/reports/cash-flow-vietnamese", timeout=5)
        print(f"Frontend Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Frontend: SUCCESS")
            return True
        else:
            print("Frontend: FAILED")
            return False
            
    except Exception as e:
        print(f"Frontend: ERROR - {str(e)}")
        return False

def main():
    print("Vietnamese Cash Flow Report - Status Test")
    print("=" * 50)
    
    api_ok = test_api_status()
    frontend_ok = test_frontend_status()
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"API: {'PASS' if api_ok else 'FAIL'}")
    print(f"Frontend: {'PASS' if frontend_ok else 'FAIL'}")
    
    if api_ok and frontend_ok:
        print("\nALL TESTS PASSED!")
        print("Your Vietnamese Cash Flow Report is working!")
        print("Access: http://localhost:3000/reports/cash-flow-vietnamese")
    else:
        print("\nSome tests failed.")

if __name__ == "__main__":
    main()
