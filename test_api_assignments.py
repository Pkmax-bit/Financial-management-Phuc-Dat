#!/usr/bin/env python3
import requests
import json

def test_assignments_api():
    """Test xem API có trả về assignments không"""
    base_url = 'http://localhost:8000'

    # Giả sử có project_id và token
    project_id = 'test-project-id'
    headers = {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
    }

    try:
        # Test get task items
        response = requests.get(f'{base_url}/api/tasks?project_id={project_id}', headers=headers)
        print(f'Status: {response.status_code}')

        if response.status_code == 200:
            data = response.json()
            print(f'Found {len(data)} tasks')

            if data:
                task = data[0]
                print(f'Task keys: {list(task.keys())}')

                # Check checklists
                if 'checklists' in task and task['checklists']:
                    checklist = task['checklists'][0]
                    print(f'Checklist keys: {list(checklist.keys())}')

                    if 'items' in checklist and checklist['items']:
                        item = checklist['items'][0]
                        print(f'Item keys: {list(item.keys())}')

                        if 'assignments' in item:
                            print(f'Assignments: {item["assignments"]}')
                        else:
                            print('No assignments field in item')
                    else:
                        print('No items in checklist')
                else:
                    print('No checklists in task')
        else:
            print(f'Error: {response.text}')

    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_assignments_api()


