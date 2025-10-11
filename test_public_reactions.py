#!/usr/bin/env python3
"""
Script test API reactions public
"""

import requests
import json

def test_public_reactions():
    """Test public reactions API"""
    base_url = "http://localhost:8000"
    
    print("Testing public reactions API...")
    
    # Test get emotion types
    print("\n1. Testing GET /api/emotions-comments/emotion-types")
    try:
        response = requests.get(f"{base_url}/api/emotions-comments/emotion-types")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            emotion_types = response.json()
            print(f"Found {len(emotion_types)} emotion types")
            for emotion in emotion_types[:3]:  # Show first 3
                print(f"  - {emotion['name']}: {emotion['display_name']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test get reactions public
    print("\n2. Testing GET /api/emotions-comments/reactions/public")
    try:
        response = requests.get(f"{base_url}/api/emotions-comments/reactions/public?entity_type=attachment&entity_id=test-id")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            reactions = response.json()
            print(f"Found {len(reactions)} reactions")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test add reaction public
    print("\n3. Testing POST /api/emotions-comments/reactions/public")
    try:
        # First get emotion types to get a valid emotion_type_id
        emotion_response = requests.get(f"{base_url}/api/emotions-comments/emotion-types")
        if emotion_response.status_code == 200:
            emotion_types = emotion_response.json()
            if emotion_types:
                emotion_id = emotion_types[0]['id']
                
                reaction_data = {
                    "entity_type": "attachment",
                    "entity_id": "test-attachment-id",
                    "emotion_type_id": emotion_id
                }
                
                response = requests.post(
                    f"{base_url}/api/emotions-comments/reactions/public",
                    json=reaction_data,
                    headers={"Content-Type": "application/json"}
                )
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    reaction = response.json()
                    print(f"Created reaction: {reaction['emotion_name']}")
                else:
                    print(f"Error: {response.text}")
            else:
                print("No emotion types found")
        else:
            print("Could not get emotion types")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_public_reactions()
