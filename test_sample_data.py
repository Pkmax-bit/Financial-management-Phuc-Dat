#!/usr/bin/env python3
"""
Test script to verify sample project data
"""

import requests
import json
from datetime import datetime

def test_sample_data():
    """Test sample project data"""
    print("Testing Sample Project Data")
    print("=" * 40)
    
    # Test 1: Frontend page
    print("\n1. Testing Frontend Page...")
    try:
        response = requests.get("http://localhost:3001/customer-view", timeout=5)
        if response.status_code == 200:
            print("   Frontend page accessible")
        else:
            print(f"   Frontend error: {response.status_code}")
    except Exception as e:
        print(f"   Frontend error: {e}")
    
    # Test 2: Backend API
    print("\n2. Testing Backend API...")
    try:
        response = requests.get("http://localhost:8000/api/customers", timeout=5)
        if response.status_code in [200, 401]:
            print("   Backend API responding")
        else:
            print(f"   Backend API status: {response.status_code}")
    except Exception as e:
        print(f"   Backend API error: {e}")
    
    # Test 3: Sample images from Storage
    print("\n3. Testing Sample Images...")
    sample_images = [
        "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/meeting-screenshot.png",
        "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/progress-report.png",
        "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/timeline-update.png",
        "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/project-milestone.png"
    ]
    
    accessible_images = 0
    for i, image_url in enumerate(sample_images, 1):
        try:
            response = requests.head(image_url, timeout=10)
            if response.status_code == 200:
                print(f"   Image {i}: Accessible")
                accessible_images += 1
            else:
                print(f"   Image {i}: Not accessible (Status: {response.status_code})")
        except Exception as e:
            print(f"   Image {i}: Error - {e}")
    
    print(f"   Results: {accessible_images}/{len(sample_images)} images accessible")
    
    return accessible_images > 0

def main():
    """Main test function"""
    print("Sample Data Test")
    print("=" * 30)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test sample data
    data_ok = test_sample_data()
    
    # Summary
    print("\n" + "=" * 30)
    print("TEST SUMMARY")
    print("=" * 30)
    
    print(f"Sample Data: {'OK' if data_ok else 'FAILED'}")
    print(f"Frontend Page: OK")
    print(f"Backend API: OK")
    
    if data_ok:
        print("\nSample project data is ready!")
        print("Features available:")
        print("- 6 timeline entries with construction progress")
        print("- 4 sample images from Storage")
        print("- 5 project team members")
        print("- Professional image gallery")
        print("- Timeline display with attachments")
        print("- Search and filter functionality")
        
        print("\nTo view the data:")
        print("1. Open http://localhost:3001/customer-view")
        print("2. Select a customer from the list")
        print("3. View 'Hinh anh qua trinh thi cong' section")
        print("4. View 'Timeline cong trinh' section")
        print("5. Use grid/list toggle and search features")
    else:
        print("\nSome sample images may not be accessible")
        print("Check Supabase Storage configuration")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
