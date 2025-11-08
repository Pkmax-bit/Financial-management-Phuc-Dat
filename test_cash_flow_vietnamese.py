#!/usr/bin/env python3
"""
Test Vietnamese Cash Flow Report
Validates the new cash flow report with Vietnamese accounting standards
"""

import os
import sys
import requests
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_cash_flow_vietnamese_api():
    """Test the Vietnamese cash flow API endpoint"""
    print("Testing Vietnamese Cash Flow API")
    print("=" * 40)
    
    # API endpoint
    base_url = "http://localhost:8000"
    endpoint = "/api/reports/financial/cash-flow-vietnamese"
    
    # Test date range (last 30 days)
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    try:
        print(f"Testing endpoint: {base_url}{endpoint}")
        print(f"Date range: {start_date} to {end_date}")
        
        # Make request
        response = requests.get(f"{base_url}{endpoint}", params=params)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API request successful")
            
            # Validate response structure
            required_fields = [
                "report_period", "start_date", "end_date", "currency",
                "beginning_cash", "ending_cash", "net_change_in_cash",
                "operating_activities", "investing_activities", "financing_activities",
                "total_operating_cash_flow", "total_investing_cash_flow", 
                "total_financing_cash_flow", "net_cash_flow", "cash_flow_validation"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            print("✅ Response structure is valid")
            
            # Validate Vietnamese format
            if data.get("currency") != "VND":
                print("❌ Currency should be VND")
                return False
            
            print("✅ Currency is VND")
            
            # Validate cash flow sections
            sections = ["operating_activities", "investing_activities", "financing_activities"]
            for section_name in sections:
                section = data.get(section_name, {})
                if not section:
                    print(f"❌ Missing section: {section_name}")
                    return False
                
                # Check Vietnamese section structure
                required_section_fields = ["section_name", "section_type", "items", "total_debit", "total_credit", "net_cash_flow"]
                missing_section_fields = [field for field in required_section_fields if field not in section]
                if missing_section_fields:
                    print(f"❌ Missing section fields in {section_name}: {missing_section_fields}")
                    return False
                
                # Check items have Vietnamese format
                items = section.get("items", [])
                for item in items:
                    if not all(field in item for field in ["item_name", "debit_amount", "credit_amount", "net_amount", "account_type"]):
                        print(f"❌ Invalid item structure in {section_name}")
                        return False
                
                print(f"✅ {section_name} section is valid")
            
            # Validate cash flow calculation
            operating = data.get("total_operating_cash_flow", 0)
            investing = data.get("total_investing_cash_flow", 0)
            financing = data.get("total_financing_cash_flow", 0)
            net_cash_flow = data.get("net_cash_flow", 0)
            
            calculated_net = operating + investing + financing
            if abs(calculated_net - net_cash_flow) > 0.01:
                print(f"❌ Cash flow calculation error: {calculated_net} != {net_cash_flow}")
                return False
            
            print("✅ Cash flow calculation is correct")
            
            # Print summary
            print("\n📊 Cash Flow Summary:")
            print(f"  Operating Activities: {operating:,.0f} VND")
            print(f"  Investing Activities: {investing:,.0f} VND")
            print(f"  Financing Activities: {financing:,.0f} VND")
            print(f"  Net Cash Flow: {net_cash_flow:,.0f} VND")
            print(f"  Validation: {'✅ Pass' if data.get('cash_flow_validation') else '❌ Fail'}")
            
            return True
            
        else:
            print(f"❌ API request failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure the backend is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
        return False

def test_cash_flow_summary_api():
    """Test the cash flow summary API"""
    print("\nTesting Cash Flow Summary API")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    endpoint = "/api/reports/financial/cash-flow-vietnamese/summary"
    
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    try:
        response = requests.get(f"{base_url}{endpoint}", params=params)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Summary API request successful")
            
            # Validate summary structure
            required_fields = ["period", "net_cash_flow", "operating_cash_flow", "investing_cash_flow", "financing_cash_flow", "validation"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing summary fields: {missing_fields}")
                return False
            
            print("✅ Summary structure is valid")
            print(f"  Period: {data.get('period')}")
            print(f"  Net Cash Flow: {data.get('net_cash_flow', 0):,.0f} VND")
            print(f"  Validation: {'✅ Pass' if data.get('validation') else '❌ Fail'}")
            
            return True
        else:
            print(f"❌ Summary API failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing summary API: {str(e)}")
        return False

def test_frontend_access():
    """Test if frontend page is accessible"""
    print("\nTesting Frontend Access")
    print("=" * 40)
    
    try:
        # Test if the frontend is running
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            
            # Test the reports page
            reports_response = requests.get("http://localhost:3000/reports", timeout=5)
            if reports_response.status_code == 200:
                print("✅ Reports page is accessible")
                
                # Check if Vietnamese cash flow is mentioned
                if "cash-flow-vietnamese" in reports_response.text or "Chuẩn VN" in reports_response.text:
                    print("✅ Vietnamese cash flow report is available in frontend")
                    return True
                else:
                    print("❌ Vietnamese cash flow report not found in frontend")
                    return False
            else:
                print("❌ Reports page not accessible")
                return False
        else:
            print("❌ Frontend not accessible")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend not running on localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Error testing frontend: {str(e)}")
        return False

def main():
    """Main test function"""
    print("Vietnamese Cash Flow Report - Comprehensive Test")
    print("=" * 60)
    
    # Test results
    api_test = test_cash_flow_vietnamese_api()
    summary_test = test_cash_flow_summary_api()
    frontend_test = test_frontend_access()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    print(f"API Endpoint Test: {'✅ PASS' if api_test else '❌ FAIL'}")
    print(f"Summary API Test: {'✅ PASS' if summary_test else '❌ FAIL'}")
    print(f"Frontend Access Test: {'✅ PASS' if frontend_test else '❌ FAIL'}")
    
    if api_test and summary_test and frontend_test:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nYour Vietnamese Cash Flow Report is ready to use:")
        print("1. Backend API: http://localhost:8000/api/reports/financial/cash-flow-vietnamese")
        print("2. Frontend Page: http://localhost:3000/reports/cash-flow-vietnamese")
        print("3. Reports List: http://localhost:3000/reports")
        
        print("\nFeatures implemented:")
        print("✅ Vietnamese accounting standards (bên nợ/bên có)")
        print("✅ Comprehensive cash flow sections")
        print("✅ Debit/Credit classification")
        print("✅ Vietnamese account names and descriptions")
        print("✅ Cash flow validation")
        print("✅ Modern responsive UI")
        
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Please check the errors above and fix them before using the system.")
        
        if not api_test:
            print("\nTo fix API issues:")
            print("1. Make sure the backend is running: python backend/main.py")
            print("2. Check if the cash_flow_vietnamese router is properly imported")
            print("3. Verify the database has the required tables")
        
        if not frontend_test:
            print("\nTo fix frontend issues:")
            print("1. Make sure the frontend is running: npm run dev")
            print("2. Check if the cash-flow-vietnamese page exists")
            print("3. Verify the routing is properly configured")

if __name__ == "__main__":
    main()
