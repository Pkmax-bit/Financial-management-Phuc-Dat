#!/usr/bin/env python3
"""
Script để tạo dữ liệu mẫu cho projects
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def load_environment():
    """Load environment variables"""
    env_file = Path("frontend/.env.local")
    if env_file.exists():
        load_dotenv(env_file)
    else:
        print("❌ File frontend/.env.local không tồn tại")
        return False
    
    return True

def create_supabase_client():
    """Create Supabase client"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Supabase environment variables not found")
        return None
    
    return create_client(url, key)

def create_sample_projects():
    """Create sample projects"""
    if not load_environment():
        return False
    
    supabase = create_supabase_client()
    if not supabase:
        return False
    
    # Sample projects data
    sample_projects = [
        {
            "name": "App Mobile ABC",
            "project_code": "PRJ001",
            "status": "active",
            "priority": "high",
            "budget": 150000000,
            "start_date": "2024-01-01",
            "end_date": "2024-06-30",
            "description": "Phát triển ứng dụng mobile cho khách hàng ABC"
        },
        {
            "name": "Website E-commerce XYZ",
            "project_code": "PRJ002", 
            "status": "active",
            "priority": "medium",
            "budget": 80000000,
            "start_date": "2024-02-01",
            "end_date": "2024-05-31",
            "description": "Xây dựng website thương mại điện tử cho XYZ"
        },
        {
            "name": "Hệ thống CRM",
            "project_code": "PRJ003",
            "status": "planning",
            "priority": "low",
            "budget": 200000000,
            "start_date": "2024-03-01",
            "end_date": "2024-12-31",
            "description": "Phát triển hệ thống quản lý khách hàng"
        },
        {
            "name": "Mobile Banking App",
            "project_code": "PRJ004",
            "status": "active",
            "priority": "high",
            "budget": 300000000,
            "start_date": "2024-01-15",
            "end_date": "2024-08-31",
            "description": "Ứng dụng ngân hàng di động"
        },
        {
            "name": "IoT Smart Home",
            "project_code": "PRJ005",
            "status": "completed",
            "priority": "medium",
            "budget": 120000000,
            "start_date": "2023-09-01",
            "end_date": "2024-01-31",
            "description": "Hệ thống nhà thông minh IoT"
        }
    ]
    
    try:
        print("Dang tao du lieu mau cho projects...")
        
        # Check if projects already exist
        result = supabase.table('projects').select('id').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            print("Projects da ton tai, bo qua tao mau")
            return True
        
        # Insert sample projects
        for project in sample_projects:
            result = supabase.table('projects').insert(project).execute()
            
            if result.data:
                print(f"Da tao project: {project['name']} ({project['project_code']})")
            else:
                print(f"Loi tao project: {project['name']}")
                if result.error:
                    print(f"   Error: {result.error}")
        
        print(f"\nDa tao {len(sample_projects)} projects mau!")
        return True
        
    except Exception as e:
        print(f"Loi tao projects: {e}")
        return False

def main():
    """Main function"""
    print("TAO DU LIEU MAU CHO PROJECTS")
    print("=" * 50)
    
    if create_sample_projects():
        print("\nHoan thanh!")
        print("\nDu lieu da tao:")
        print("- App Mobile ABC (PRJ001)")
        print("- Website E-commerce XYZ (PRJ002)")
        print("- He thong CRM (PRJ003)")
        print("- Mobile Banking App (PRJ004)")
        print("- IoT Smart Home (PRJ005)")
        print("\nTest API:")
        print("curl http://localhost:3000/api/projects")
        print("curl http://localhost:3000/api/projects/search?q=Mobile")
    else:
        print("\nThat bai!")
        print("Kiem tra:")
        print("1. File frontend/.env.local co ton tai")
        print("2. Supabase credentials dung")
        print("3. Database connection hoat dong")

if __name__ == "__main__":
    main()
