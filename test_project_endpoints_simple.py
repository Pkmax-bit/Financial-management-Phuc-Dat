#!/usr/bin/env python3
"""
Simple Project Endpoints Test
Tests if project endpoints exist and are accessible
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_endpoint_exists(method, url, description):
    """Test if an endpoint exists and returns expected status"""
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            response = requests.post(url, json={})
        else:
            print(f"Unsupported method: {method}")
            return False
        
        print(f"{method} {url}")
        print(f"Status: {response.status_code}")
        
        # Check if endpoint exists (not 404)
        if response.status_code == 404:
            print(f"FAILED: {description} - Endpoint not found")
            return False
        elif response.status_code == 403:
            print(f"SUCCESS: {description} - Endpoint exists but requires authentication")
            return True
        elif response.status_code == 200:
            print(f"SUCCESS: {description} - Endpoint accessible")
            return True
        else:
            print(f"PARTIAL: {description} - Endpoint exists but returned {response.status_code}")
            return True
            
    except Exception as e:
        print(f"ERROR: {description} - {str(e)}")
        return False

def main():
    """Test all project-related endpoints"""
    print("TESTING PROJECT ENDPOINTS")
    print("="*60)
    
    endpoints_to_test = [
        # Basic project endpoints
        ("GET", f"{API_BASE}/projects", "Get all projects"),
        ("POST", f"{API_BASE}/projects", "Create project"),
        
        # New financial summary endpoint
        ("GET", f"{API_BASE}/projects/test-id/financial-summary", "Project financial summary"),
        
        # Project dashboard
        ("GET", f"{API_BASE}/projects/test-id/dashboard", "Project dashboard"),
        
        # Project profitability
        ("GET", f"{API_BASE}/projects/test-id/profitability", "Project profitability"),
        
        # Project comparison
        ("GET", f"{API_BASE}/projects/profitability/comparison", "Projects comparison"),
        
        # Project stats
        ("GET", f"{API_BASE}/projects/stats/overview", "Project stats overview"),
        
        # New profitability reports
        ("GET", f"{API_BASE}/reports/projects/profitability", "Projects profitability report"),
        ("GET", f"{API_BASE}/reports/projects/profitability/summary", "Profitability summary"),
        
        # Project linking endpoints
        ("GET", f"{API_BASE}/projects/by-customer/test-customer-id", "Projects by customer"),
        ("GET", f"{API_BASE}/projects/dropdown-options/test-customer-id", "Project dropdown options"),
        ("GET", f"{API_BASE}/projects/validate-project-customer", "Validate project-customer"),
        
        # Sales and Expenses project linking
        ("GET", f"{API_BASE}/sales/projects/by-customer/test-customer-id", "Sales projects by customer"),
        ("GET", f"{API_BASE}/expenses/projects/by-customer/test-customer-id", "Expenses projects by customer"),
    ]
    
    success_count = 0
    total_count = len(endpoints_to_test)
    
    for method, url, description in endpoints_to_test:
        print(f"\n{description}:")
        if test_endpoint_exists(method, url, description):
            success_count += 1
        print("-" * 40)
    
    print(f"\nSUMMARY:")
    print(f"Total endpoints tested: {total_count}")
    print(f"Successful/Existing: {success_count}")
    print(f"Failed/Not found: {total_count - success_count}")
    
    if success_count == total_count:
        print("ALL PROJECT ENDPOINTS ARE WORKING!")
    elif success_count > total_count * 0.8:
        print("MOST PROJECT ENDPOINTS ARE WORKING!")
    else:
        print("SOME PROJECT ENDPOINTS NEED ATTENTION!")

if __name__ == "__main__":
    main()
