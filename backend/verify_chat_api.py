import requests
import json
import os

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"

def login():
    creds = {"email": "dev_test_user@gmail.com", "password": "Test@1234"}
    try:
        # 1. Try Login
        print("Attempting login...")
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
        if resp.status_code == 200:
            print("Login successful")
            return resp.json()["access_token"]
        
        # 2. If fail, try Register
        print("Login failed, attempting registration...")
        reg_data = {
            "email": "dev_test_user@gmail.com", 
            "password": "Test@1234",
            "full_name": "Dev Test User",
            "role": "admin"
        }
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        if reg_resp.status_code == 200:
             print("Registration successful. Logging in...")
             resp = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
             if resp.status_code == 200:
                 return resp.json()["access_token"]
        
        print(f"Auth failed. Login: {resp.status_code}, Register: {reg_resp.text if 'reg_resp' in locals() else 'N/A'}")
        return None
        
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def get_first_task(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
    if resp.status_code == 200:
        tasks = resp.json()
        if tasks:
            return tasks[0]["id"]
    return None

def send_message(token, task_id, content, file_url=None, msg_type="text"):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "comment": content,
        "type": msg_type,
        "file_url": file_url
    }
    resp = requests.post(f"{BASE_URL}/api/tasks/{task_id}/comments", headers=headers, json=payload)
    print(f"Send Message ({msg_type}): {resp.status_code}")
    print(resp.json())

def upload_file(token, task_id):
    headers = {"Authorization": f"Bearer {token}"}
    # Create dummy file
    with open("test_upload.txt", "w") as f:
        f.write("This is a test file content.")
    
    files = {"file": ("test_upload.txt", open("test_upload.txt", "rb"), "text/plain")}
    # Use generic upload endpoint as used in Android
    resp = requests.post(f"{BASE_URL}/api/uploads/Tasks/{task_id}", headers=headers, files=files)
    
    if resp.status_code == 200:
        print("Upload successful")
        return resp.json()["url"]
    else:
        print(f"Upload failed: {resp.text}")
        return None

def verify_chat():
    token = login()
    if not token:
        return

    task_id = get_first_task(token)
    if not task_id:
        print("No tasks found to test chat on.")
        return
    
    print(f"Testing on Task ID: {task_id}")

    # 1. Send Text Message
    send_message(token, task_id, "Hello from API Test Script (Text)")

    # 2. Upload File and Send File Message
    file_url = upload_file(token, task_id)
    if file_url:
        send_message(token, task_id, "", file_url, "file")

    # 3. Get Comments
    resp = requests.get(f"{BASE_URL}/api/tasks/{task_id}/comments", headers={"Authorization": f"Bearer {token}"})
    print("\n--- Message History ---")
    data = resp.json()
    for msg in data[-3:]: # Show last 3
        print(f"[{msg.get('type')}] {msg.get('comment')} (File: {msg.get('file_url')})")

if __name__ == "__main__":
    verify_chat()
