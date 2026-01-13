#!/usr/bin/env python3
"""
Script kiểm tra items trong checklists
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

        # Check the task with ID from the data
        task_id = '444fd233-c8c2-4961-9ed8-b2c086ab07ec'

        # Get task detail
        detail_response = requests.get(f'http://localhost:8000/api/tasks/{task_id}', headers=headers)
        if detail_response.status_code == 200:
            task_detail = detail_response.json()
            checklists = task_detail.get('checklists', [])

            print(f'=== CHI TIẾT ITEMS TRONG CHECKLISTS ===\n')

            for i, checklist in enumerate(checklists, 1):
                checklist_id = checklist.get('id')
                title = checklist.get('title')
                items = checklist.get('items', [])

                print(f'{i}. "{title}" (ID: {checklist_id[:8]}...)')
                print(f'   Items count: {len(items)}')

                if len(items) == 0:
                    print('   ⚠️  KHÔNG CÓ ITEMS → KHÔNG HIỂN THỊ TRONG ANDROID!')
                else:
                    print('   ✅ CÓ ITEMS → HIỂN THỊ TRONG ANDROID')
                    for j, item in enumerate(items, 1):
                        item_title = item.get('content', 'No title')
                        completed = item.get('is_completed', False)
                        status = 'Hoàn thành' if completed else 'Cần làm'
                        print(f'      {j}. {status}: {item_title}')
                print()
        else:
            print(f'Error: {detail_response.status_code}')
    else:
        print('Login failed')

if __name__ == "__main__":
    main()
