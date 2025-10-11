#!/usr/bin/env python3
"""
Script test tích hợp hệ thống bình luận và cảm xúc
Kiểm tra API endpoints và database
"""

import asyncio
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/emotions-comments"

def test_emotion_types():
    """Test lấy danh sách emotion types"""
    print("Testing emotion types endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/emotion-types")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully fetched {len(data)} emotion types")
            for emotion in data:
                print(f"  - {emotion['emoji']} {emotion['display_name']} ({emotion['name']})")
            return True
        else:
            print(f"Failed to fetch emotion types: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing emotion types: {e}")
        return False

def test_comments_endpoint():
    """Test comments endpoint"""
    print("\nTesting comments endpoint...")
    
    try:
        # Test với một entity giả
        test_entity_type = "timeline_entry"
        test_entity_id = "test-entity-123"
        
        response = requests.get(f"{API_BASE}/comments/{test_entity_type}/{test_entity_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully fetched comments for {test_entity_type}/{test_entity_id}")
            print(f"  Found {len(data)} comments")
            return True
        else:
            print(f"Failed to fetch comments: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing comments: {e}")
        return False

def test_reactions_endpoint():
    """Test reactions endpoint"""
    print("\nTesting reactions endpoint...")
    
    try:
        # Test với một entity giả
        test_entity_type = "timeline_entry"
        test_entity_id = "test-entity-123"
        
        # Test thêm reaction (sẽ fail vì không có auth, nhưng endpoint phải tồn tại)
        reaction_data = {
            "entity_type": test_entity_type,
            "entity_id": test_entity_id,
            "emotion_type_id": "test-emotion-id"
        }
        
        response = requests.post(f"{API_BASE}/reactions", json=reaction_data)
        
        # Expect 401 or 403 (unauthorized) - endpoint exists but needs auth
        if response.status_code in [401, 403, 422]:
            print(f"Reactions endpoint exists (got {response.status_code} as expected)")
            return True
        else:
            print(f"Unexpected response from reactions endpoint: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing reactions: {e}")
        return False

def test_backend_health():
    """Test backend health"""
    print("Testing backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Backend is healthy: {data}")
            return True
        else:
            print(f"Backend health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error checking backend health: {e}")
        return False

def test_api_docs():
    """Test API documentation"""
    print("\nTesting API documentation...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        
        if response.status_code == 200:
            print("API documentation is accessible")
            return True
        else:
            print(f"API documentation not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error checking API docs: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("TESTING EMOTIONS & COMMENTS INTEGRATION")
    print("=" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("API Documentation", test_api_docs),
        ("Emotion Types", test_emotion_types),
        ("Comments Endpoint", test_comments_endpoint),
        ("Reactions Endpoint", test_reactions_endpoint)
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
        print("\nAll tests passed! Integration is working correctly.")
        print("\nNext steps:")
        print("  1. Start the backend server: cd backend && python main.py")
        print("  2. Start the frontend: cd frontend && npm run dev")
        print("  3. Visit the customer timeline view to see emotions & comments")
    else:
        print(f"\n{total - passed} tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
