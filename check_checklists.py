#!/usr/bin/env python3
"""
Script kiểm tra số lượng checklists và items trong các tasks
"""

import requests
import json

def main():
    # Login first
    login_data = {'email': 'admin@test.com', 'password': '123456'}
    login_response = requests.post('http://localhost:8000/api/auth/login', json=login_data)

    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Check specific task with ID from the data
        task_id = '444fd233-c8c2-4961-9ed8-b2c086ab07ec'
        print(f'=== CHECKING TASK: {task_id} ===\n')

        # Get task detail
        detail_response = requests.get(f'http://localhost:8000/api/tasks/{task_id}', headers=headers)
        if detail_response.status_code == 200:
            task_detail = detail_response.json()
            task_info = task_detail.get('task', {})
            checklists = task_detail.get('checklists', [])

            print(f'📋 Task: {task_info.get("title", "Unknown")}')
            print(f'📝 Checklists found: {len(checklists)}\n')

            for i, checklist in enumerate(checklists, 1):
                checklist_id = checklist.get('id')
                title = checklist.get('title')
                items = checklist.get('items', [])
                created_at = checklist.get('created_at', '')

                print(f'{i}. 📋 "{title}" (ID: {checklist_id[:8]}...)')
                print(f'   📅 Created: {created_at[:19] if created_at else "Unknown"}')
                print(f'   ✅ Items: {len(items)}')
                if items:
                    for j, item in enumerate(items, 1):
                        item_title = item.get('content', 'No title')
                        completed = item.get('is_completed', False)
                        status = '✅ Hoàn thành' if completed else '⏳ Cần làm'
                        print(f'      {j}. {status}: {item_title}')
                print()

            # Also check direct checklists API
            print('=== DIRECT CHECKLISTS API ===')
            checklists_response = requests.get(f'http://localhost:8000/api/tasks/{task_id}/checklists', headers=headers)
            if checklists_response.status_code == 200:
                direct_checklists = checklists_response.json()
                print(f'Direct API returns: {len(direct_checklists)} checklists')
                for checklist in direct_checklists:
                    print(f'  - {checklist.get("title")} ({checklist.get("id")[:8]}...)')
            else:
                print('Direct API failed')

        else:
            print(f'Error getting task detail: {detail_response.status_code}')
            print(detail_response.text)
    else:
        print('Login failed')

if __name__ == "__main__":
    main()