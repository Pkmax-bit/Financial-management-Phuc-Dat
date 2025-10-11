#!/usr/bin/env python3
"""
Script test chức năng sidebar cho trang AI Analysis
"""

import requests
import time

def test_ai_analysis_page():
    """Test trang AI Analysis có sidebar không"""
    print("Testing AI Analysis page...")
    
    try:
        # Test frontend server
        response = requests.get("http://localhost:3000/ai-analysis", timeout=10)
        
        if response.status_code == 200:
            print("✅ AI Analysis page is accessible")
            
            # Check if page contains sidebar elements
            content = response.text
            
            # Check for sidebar indicators
            sidebar_indicators = [
                "LayoutWithSidebar",
                "sidebar",
                "toggle",
                "navigation",
                "menu"
            ]
            
            found_indicators = []
            for indicator in sidebar_indicators:
                if indicator.lower() in content.lower():
                    found_indicators.append(indicator)
            
            if found_indicators:
                print(f"✅ Found sidebar indicators: {', '.join(found_indicators)}")
                return True
            else:
                print("❌ No sidebar indicators found")
                return False
        else:
            print(f"❌ AI Analysis page returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend server. Make sure it's running on localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Error testing AI Analysis page: {e}")
        return False

def test_sidebar_components():
    """Test các component sidebar"""
    print("\nTesting sidebar components...")
    
    try:
        # Test LayoutWithSidebar component
        response = requests.get("http://localhost:3000", timeout=10)
        
        if response.status_code == 200:
            content = response.text
            
            # Check for sidebar components
            components = [
                "LayoutWithSidebar",
                "SidebarContext",
                "toggleSidebar",
                "sidebarOpen"
            ]
            
            found_components = []
            for component in components:
                if component in content:
                    found_components.append(component)
            
            if found_components:
                print(f"✅ Found sidebar components: {', '.join(found_components)}")
                return True
            else:
                print("❌ Sidebar components not found")
                return False
        else:
            print(f"❌ Frontend server returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing sidebar components: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("TESTING SIDEBAR FUNCTIONALITY FOR AI ANALYSIS")
    print("=" * 60)
    
    tests = [
        ("AI Analysis Page", test_ai_analysis_page),
        ("Sidebar Components", test_sidebar_components)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"Test {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\nAll tests passed! Sidebar is working correctly.")
        print("\nNext steps:")
        print("  1. Start the frontend: cd frontend && npm run dev")
        print("  2. Visit http://localhost:3000/ai-analysis")
        print("  3. Check if sidebar is visible and functional")
    else:
        print(f"\n{total - passed} tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
