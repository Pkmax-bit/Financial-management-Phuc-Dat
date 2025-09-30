#!/usr/bin/env python3
"""
Test script for Projects API
Tests all project-related endpoints and functionality
"""

import requests
import json
from datetime import datetime, date, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test data
test_project = {
    "project_code": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "name": "Test Project for API",
    "description": "This is a test project to verify API functionality",
    "start_date": date.today().isoformat(),
    "end_date": (date.today() + timedelta(days=30)).isoformat(),
    "budget": 100000.0,
    "priority": "high",
    "billing_type": "fixed",
    "hourly_rate": 50.0
}

test_customer = {
    "customer_code": f"CUST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "name": "Test Customer for Project",
    "type": "company",
    "email": "test@customer.com",
    "phone": "0123456789"
}

def make_request(method, url, data=None, headers=None):
    """Make HTTP request and return response"""
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"{method} {url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code >= 400:
            print(f"Error: {response.text}")
        else:
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2, default=str)}")
                return result
            except:
                print(f"Response: {response.text}")
                return response.text
        
        return None
        
    except Exception as e:
        print(f"Request failed: {str(e)}")
        return None

def test_projects_crud():
    """Test basic CRUD operations for projects"""
    print("\n" + "="*60)
    print("TESTING PROJECTS CRUD OPERATIONS")
    print("="*60)
    
    # Test 1: Create a customer first (required for project)
    print("\n1. Creating test customer...")
    customer_response = make_request("POST", f"{API_BASE}/customers", test_customer)
    if not customer_response:
        print("Failed to create customer. Using existing customer.")
        customer_id = None
    else:
        customer_id = customer_response.get("id")
        test_project["customer_id"] = customer_id
    
    # Test 2: Create project
    print("\n2. Creating test project...")
    project_response = make_request("POST", f"{API_BASE}/projects", test_project)
    if not project_response:
        print("❌ Failed to create project")
        return None
    
    project_id = project_response["id"]
    print(f"✅ Project created with ID: {project_id}")
    
    # Test 3: Get all projects
    print("\n3. Getting all projects...")
    projects_response = make_request("GET", f"{API_BASE}/projects")
    if projects_response:
        print(f"✅ Found {len(projects_response)} projects")
    
    # Test 4: Get specific project
    print(f"\n4. Getting project {project_id}...")
    project_detail = make_request("GET", f"{API_BASE}/projects/{project_id}")
    if project_detail:
        print("✅ Project retrieved successfully")
    
    # Test 5: Update project
    print(f"\n5. Updating project {project_id}...")
    update_data = {
        "name": "Updated Test Project",
        "progress": 25.0,
        "status": "active"
    }
    update_response = make_request("PUT", f"{API_BASE}/projects/{project_id}", update_data)
    if update_response:
        print("✅ Project updated successfully")
    
    return project_id

def test_project_profitability(project_id):
    """Test project profitability calculations"""
    print("\n" + "="*60)
    print("TESTING PROJECT PROFITABILITY")
    print("="*60)
    
    if not project_id:
        print("❌ No project ID provided")
        return
    
    # Test 1: Get project profitability
    print(f"\n1. Getting profitability for project {project_id}...")
    profitability = make_request("GET", f"{API_BASE}/projects/{project_id}/profitability")
    if profitability:
        print("✅ Project profitability calculated successfully")
        print(f"   Revenue: {profitability.get('revenue', {}).get('total', 0)}")
        print(f"   Costs: {profitability.get('costs', {}).get('total', 0)}")
        print(f"   Profit: {profitability.get('profitability', {}).get('gross_profit', 0)}")
    
    # Test 2: Get project dashboard
    print(f"\n2. Getting dashboard for project {project_id}...")
    dashboard = make_request("GET", f"{API_BASE}/projects/{project_id}/dashboard")
    if dashboard:
        print("✅ Project dashboard retrieved successfully")
    
    # Test 3: Get detailed report
    print(f"\n3. Getting detailed report for project {project_id}...")
    report = make_request("GET", f"{API_BASE}/projects/{project_id}/detailed-report")
    if report:
        print("✅ Detailed project report generated successfully")

def test_project_comparison():
    """Test project profitability comparison"""
    print("\n" + "="*60)
    print("TESTING PROJECT PROFITABILITY COMPARISON")
    print("="*60)
    
    # Test 1: Get all projects comparison
    print("\n1. Getting projects profitability comparison...")
    comparison = make_request("GET", f"{API_BASE}/projects/profitability/comparison")
    if comparison:
        print("✅ Projects comparison retrieved successfully")
        summary = comparison.get("summary", {})
        print(f"   Total projects: {summary.get('total_projects', 0)}")
        print(f"   Profitable projects: {summary.get('profitable_projects', 0)}")
        print(f"   Loss projects: {summary.get('loss_projects', 0)}")
    
    # Test 2: Get project stats overview
    print("\n2. Getting project stats overview...")
    stats = make_request("GET", f"{API_BASE}/projects/stats/overview")
    if stats:
        print("✅ Project stats overview retrieved successfully")
        print(f"   Total projects: {stats.get('total_projects', 0)}")
        print(f"   Total budget: {stats.get('total_budget', 0)}")
        print(f"   Total profit: {stats.get('total_profit', 0)}")

def test_time_entries(project_id):
    """Test time entries functionality"""
    print("\n" + "="*60)
    print("TESTING TIME ENTRIES")
    print("="*60)
    
    if not project_id:
        print("❌ No project ID provided")
        return
    
    # Test 1: Create time entry
    print(f"\n1. Creating time entry for project {project_id}...")
    time_entry_data = {
        "project_id": project_id,
        "employee_id": "test-employee-id",  # You might need to create an employee first
        "date": date.today().isoformat(),
        "hours": 8.0,
        "description": "Test time entry",
        "billable": True,
        "hourly_rate": 50.0
    }
    
    time_entry_response = make_request("POST", f"{API_BASE}/projects/{project_id}/time-entries", time_entry_data)
    if time_entry_response:
        print("✅ Time entry created successfully")
    
    # Test 2: Get time entries for project
    print(f"\n2. Getting time entries for project {project_id}...")
    time_entries = make_request("GET", f"{API_BASE}/projects/{project_id}/time-entries")
    if time_entries:
        print(f"✅ Found {len(time_entries)} time entries")

def test_project_status_updates(project_id):
    """Test project status updates"""
    print("\n" + "="*60)
    print("TESTING PROJECT STATUS UPDATES")
    print("="*60)
    
    if not project_id:
        print("❌ No project ID provided")
        return
    
    # Test 1: Update project status
    print(f"\n1. Updating project {project_id} status to 'active'...")
    status_response = make_request("PUT", f"{API_BASE}/projects/{project_id}/status?status=active")
    if status_response:
        print("✅ Project status updated successfully")
    
    # Test 2: Update project status to completed
    print(f"\n2. Updating project {project_id} status to 'completed'...")
    status_response = make_request("PUT", f"{API_BASE}/projects/{project_id}/status?status=completed")
    if status_response:
        print("✅ Project status updated to completed")

def main():
    """Main test function"""
    print("🚀 STARTING PROJECTS API TESTS")
    print("="*60)
    
    # Test basic CRUD operations
    project_id = test_projects_crud()
    
    if project_id:
        # Test profitability calculations
        test_project_profitability(project_id)
        
        # Test time entries
        test_time_entries(project_id)
        
        # Test status updates
        test_project_status_updates(project_id)
    
    # Test comparison and stats
    test_project_comparison()
    
    print("\n" + "="*60)
    print("✅ PROJECTS API TESTS COMPLETED")
    print("="*60)
    
    print("\n📋 SUMMARY OF AVAILABLE ENDPOINTS:")
    print("="*60)
    print("CRUD Operations:")
    print("  GET    /api/projects                    - Get all projects")
    print("  POST   /api/projects                    - Create new project")
    print("  GET    /api/projects/{id}               - Get specific project")
    print("  PUT    /api/projects/{id}               - Update project")
    print("  PUT    /api/projects/{id}/status        - Update project status")
    print()
    print("Time Tracking:")
    print("  GET    /api/projects/{id}/time-entries - Get project time entries")
    print("  POST   /api/projects/{id}/time-entries - Create time entry")
    print()
    print("Analytics & Reports:")
    print("  GET    /api/projects/{id}/profitability     - Get project profitability")
    print("  GET    /api/projects/{id}/dashboard         - Get project dashboard")
    print("  GET    /api/projects/{id}/detailed-report   - Get detailed project report")
    print("  GET    /api/projects/profitability/comparison - Compare all projects")
    print("  GET    /api/projects/stats/overview         - Get project statistics")

if __name__ == "__main__":
    main()
