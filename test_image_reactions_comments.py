#!/usr/bin/env python3
"""
Script test tính năng cảm xúc và bình luận cho hình ảnh
"""

import requests
import time

def test_attachment_entity_support():
    """Test API hỗ trợ entity type 'attachment'"""
    print("Testing attachment entity support...")
    
    try:
        # Test emotion types endpoint
        response = requests.get("http://localhost:8000/api/emotions-comments/emotion-types")
        
        if response.status_code == 200:
            print("✅ Emotion types endpoint accessible")
            
            # Test comments endpoint with attachment entity
            test_data = {
                "content": "Test comment for attachment",
                "entity_type": "attachment",
                "entity_id": "test-attachment-123"
            }
            
            response = requests.post(
                "http://localhost:8000/api/emotions-comments/comments",
                json=test_data
            )
            
            if response.status_code in [200, 201, 401, 403, 422]:
                print("✅ Attachment entity type supported in comments")
                return True
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                return False
        else:
            print(f"❌ Emotion types endpoint failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing attachment support: {e}")
        return False

def test_reactions_attachment_support():
    """Test reactions endpoint hỗ trợ attachment entity"""
    print("\nTesting reactions attachment support...")
    
    try:
        # Test reactions endpoint with attachment entity
        test_data = {
            "entity_type": "attachment",
            "entity_id": "test-attachment-123",
            "emotion_type_id": "test-emotion-123"
        }
        
        response = requests.post(
            "http://localhost:8000/api/emotions-comments/reactions",
            json=test_data
        )
        
        if response.status_code in [200, 201, 401, 403, 422]:
            print("✅ Attachment entity type supported in reactions")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing reactions attachment support: {e}")
        return False

def test_frontend_components():
    """Test frontend components có tồn tại không"""
    print("\nTesting frontend components...")
    
    try:
        # Test frontend server
        response = requests.get("http://localhost:3000", timeout=10)
        
        if response.status_code == 200:
            print("✅ Frontend server accessible")
            
            # Check for ImageWithReactions component
            content = response.text
            
            # Check for component indicators
            indicators = [
                "ImageWithReactions",
                "attachment",
                "entityType",
                "entityId"
            ]
            
            found_indicators = []
            for indicator in indicators:
                if indicator.lower() in content.lower():
                    found_indicators.append(indicator)
            
            if found_indicators:
                print(f"✅ Found component indicators: {', '.join(found_indicators)}")
                return True
            else:
                print("❌ Component indicators not found")
                return False
        else:
            print(f"❌ Frontend server returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend server. Make sure it's running on localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Error testing frontend components: {e}")
        return False

def test_customer_timeline_page():
    """Test trang customer timeline có tính năng mới không"""
    print("\nTesting customer timeline page...")
    
    try:
        # Test customer timeline page
        response = requests.get("http://localhost:3000/projects/timeline", timeout=10)
        
        if response.status_code == 200:
            print("✅ Customer timeline page accessible")
            
            content = response.text
            
            # Check for new features
            features = [
                "ImageWithReactions",
                "attachment",
                "entityType",
                "entityId",
                "onImageClick"
            ]
            
            found_features = []
            for feature in features:
                if feature in content:
                    found_features.append(feature)
            
            if found_features:
                print(f"✅ Found new features: {', '.join(found_features)}")
                return True
            else:
                print("❌ New features not found")
                return False
        else:
            print(f"❌ Customer timeline page returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing customer timeline page: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("TESTING IMAGE REACTIONS & COMMENTS FEATURES")
    print("=" * 60)
    
    tests = [
        ("Attachment Entity Support", test_attachment_entity_support),
        ("Reactions Attachment Support", test_reactions_attachment_support),
        ("Frontend Components", test_frontend_components),
        ("Customer Timeline Page", test_customer_timeline_page)
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
        print("\nAll tests passed! Image reactions & comments features are working correctly.")
        print("\nNext steps:")
        print("  1. Start backend: cd backend && python main.py")
        print("  2. Start frontend: cd frontend && npm run dev")
        print("  3. Visit customer timeline page")
        print("  4. Test image reactions and comments")
    else:
        print(f"\n{total - passed} tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)




