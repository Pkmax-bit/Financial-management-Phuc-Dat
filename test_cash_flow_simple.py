#!/usr/bin/env python3
"""
Simple test for Vietnamese Cash Flow Report
"""

import requests
import json
from datetime import date, timedelta

def test_api():
    """Test the API endpoint"""
    print("Testing Vietnamese Cash Flow API...")
    
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
            print("✅ API: SUCCESS")
            print(f"   Period: {data.get('report_period')}")
            print(f"   Currency: {data.get('currency')}")
            print(f"   Net Cash Flow: {data.get('net_cash_flow', 0):,.0f} VND")
            print(f"   Validation: {'PASS' if data.get('cash_flow_validation') else 'FAIL'}")
            return True
        else:
            print(f"❌ API: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API: ERROR - {str(e)}")
        return False

def test_frontend():
    """Test the frontend page"""
    print("\nTesting Frontend...")
    
    try:
        response = requests.get("http://localhost:3000/reports/cash-flow-vietnamese", timeout=5)
        
        if response.status_code == 200:
            print("✅ Frontend: SUCCESS")
            return True
        else:
            print(f"❌ Frontend: FAILED ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Frontend: ERROR - {str(e)}")
        return False

def main():
    print("Vietnamese Cash Flow Report - Simple Test")
    print("=" * 50)
    
    api_ok = test_api()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"API: {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Frontend: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if api_ok and frontend_ok:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nYour Vietnamese Cash Flow Report is working!")
        print("Access: http://localhost:3000/reports/cash-flow-vietnamese")
    else:
        print("\n❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
