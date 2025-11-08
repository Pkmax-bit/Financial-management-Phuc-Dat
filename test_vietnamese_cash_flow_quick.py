#!/usr/bin/env python3
"""
Quick Test for Vietnamese Cash Flow Report
Tests the essential functionality
"""

import requests
import json
from datetime import date, timedelta

def test_vietnamese_cash_flow():
    """Test the Vietnamese cash flow API"""
    print("🧪 Testing Vietnamese Cash Flow Report")
    print("=" * 50)
    
    # Test parameters
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    api_url = "http://localhost:8000/api/reports/financial/cash-flow-vietnamese"
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    try:
        print(f"📡 Testing API: {api_url}")
        print(f"📅 Date range: {start_date} to {end_date}")
        
        response = requests.get(api_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Response: SUCCESS")
            
            # Check key fields
            required_fields = [
                "report_period", "currency", "beginning_cash", "ending_cash",
                "operating_activities", "investing_activities", "financing_activities",
                "net_cash_flow", "cash_flow_validation"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
                return False
            
            print("✅ Response structure: VALID")
            
            # Check Vietnamese format
            if data.get("currency") == "VND":
                print("✅ Currency: VND")
            else:
                print(f"❌ Wrong currency: {data.get('currency')}")
                return False
            
            # Check sections
            sections = ["operating_activities", "investing_activities", "financing_activities"]
            for section_name in sections:
                section = data.get(section_name, {})
                if not section:
                    print(f"❌ Missing section: {section_name}")
                    return False
                
                # Check Vietnamese section structure
                if "section_name" not in section or "items" not in section:
                    print(f"❌ Invalid section structure: {section_name}")
                    return False
                
                print(f"✅ {section_name}: VALID")
            
            # Print summary
            print("\n📊 Cash Flow Summary:")
            print(f"  💰 Beginning Cash: {data.get('beginning_cash', 0):,.0f} VND")
            print(f"  💰 Ending Cash: {data.get('ending_cash', 0):,.0f} VND")
            print(f"  📈 Net Cash Flow: {data.get('net_cash_flow', 0):,.0f} VND")
            print(f"  ✅ Validation: {'PASS' if data.get('cash_flow_validation') else 'FAIL'}")
            
            return True
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server")
        print("💡 Make sure backend is running: python backend/main.py")
        return False
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

def test_frontend_access():
    """Test frontend accessibility"""
    print("\n🌐 Testing Frontend Access")
    print("=" * 50)
    
    try:
        # Test main page
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: ACCESSIBLE")
            
            # Test reports page
            reports_response = requests.get("http://localhost:3000/reports", timeout=5)
            if reports_response.status_code == 200:
                print("✅ Reports page: ACCESSIBLE")
                
                # Check for Vietnamese cash flow
                if "cash-flow-vietnamese" in reports_response.text:
                    print("✅ Vietnamese Cash Flow: AVAILABLE")
                    return True
                else:
                    print("❌ Vietnamese Cash Flow: NOT FOUND")
                    return False
            else:
                print("❌ Reports page: NOT ACCESSIBLE")
                return False
        else:
            print("❌ Frontend: NOT ACCESSIBLE")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Frontend not running")
        print("💡 Make sure frontend is running: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Frontend test error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Vietnamese Cash Flow - Quick Test")
    print("=" * 60)
    
    # Test API
    api_success = test_vietnamese_cash_flow()
    
    # Test Frontend
    frontend_success = test_frontend_access()
    
    print("\n" + "=" * 60)
    print("📋 TEST RESULTS")
    print("=" * 60)
    
    print(f"🔌 API Test: {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"🌐 Frontend Test: {'✅ PASS' if frontend_success else '❌ FAIL'}")
    
    if api_success and frontend_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n🚀 Your Vietnamese Cash Flow Report is ready!")
        print("\n📱 Access URLs:")
        print("  • Reports: http://localhost:3000/reports")
        print("  • Vietnamese Cash Flow: http://localhost:3000/reports/cash-flow-vietnamese")
        print("  • API: http://localhost:8000/api/reports/financial/cash-flow-vietnamese")
        
        print("\n✨ Features:")
        print("  ✅ Vietnamese accounting standards")
        print("  ✅ Debit/Credit classification")
        print("  ✅ Modern responsive UI")
        print("  ✅ Real-time data validation")
        
    else:
        print("\n❌ SOME TESTS FAILED")
        if not api_success:
            print("🔧 To fix API issues:")
            print("  1. Start backend: python backend/main.py")
            print("  2. Check database connection")
            print("  3. Verify cash_flow_vietnamese router")
        
        if not frontend_success:
            print("🔧 To fix frontend issues:")
            print("  1. Start frontend: npm run dev")
            print("  2. Check cash-flow-vietnamese page exists")
            print("  3. Verify routing configuration")

if __name__ == "__main__":
    main()
