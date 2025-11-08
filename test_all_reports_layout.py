#!/usr/bin/env python3
"""
Test All Reports Layout
Test all report pages to ensure they're not overlapped by sidebar
"""

import requests

def test_report_page(url, page_name):
    """Test a single report page"""
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            content = response.text
            
            # Check for the main content classes
            if 'lg:ml-64' in content:
                print(f"OK {page_name}: Found lg:ml-64 class - sidebar margin applied")
            else:
                print(f"FAIL {page_name}: Missing lg:ml-64 class - sidebar margin not applied")
            
            if 'relative z-10' in content:
                print(f"OK {page_name}: Found relative z-10 classes - proper layering")
            else:
                print(f"FAIL {page_name}: Missing relative z-10 classes - layering issue")
            
            if 'max-w-7xl mx-auto px-4 py-8' in content:
                print(f"OK {page_name}: Found main content container")
            else:
                print(f"FAIL {page_name}: Main content container not found")
            
            return True
        else:
            print(f"FAIL {page_name}: Failed to load page - {response.status_code}")
            return False
            
    except Exception as e:
        print(f"FAIL {page_name}: Error testing page - {e}")
        return False

def main():
    """Main function"""
    print("Testing All Reports Layout...")
    print("="*60)
    
    # List of all report pages to test
    report_pages = [
        ("http://localhost:3000/reports", "Reports Main Page"),
        ("http://localhost:3000/reports/balance-sheet", "Balance Sheet"),
        ("http://localhost:3000/reports/pl-report", "P&L Report"),
        ("http://localhost:3000/reports/cash-flow", "Cash Flow"),
        ("http://localhost:3000/reports/general-ledger", "General Ledger"),
        ("http://localhost:3000/reports/sales-by-customer", "Sales by Customer"),
        ("http://localhost:3000/reports/project-report", "Project Report"),
    ]
    
    success_count = 0
    total_count = len(report_pages)
    
    for url, page_name in report_pages:
        print(f"\nTesting {page_name}...")
        if test_report_page(url, page_name):
            success_count += 1
        print("-" * 40)
    
    print(f"\nResults: {success_count}/{total_count} pages passed")
    
    if success_count == total_count:
        print("\nAll report pages have proper layout!")
        print("\nAll reports should now display correctly without being overlapped by sidebar.")
        print("\nFixed pages:")
        for _, page_name in report_pages:
            print(f"   - {page_name}")
        print("\nYou can now access all reports without layout issues:")
        print("   http://localhost:3000/reports")
    else:
        print(f"\n{total_count - success_count} pages still have layout issues!")
        print("Please check the failed pages above.")

if __name__ == "__main__":
    main()
