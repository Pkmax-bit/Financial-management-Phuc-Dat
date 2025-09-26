"""
Script to add sample departments and positions
"""

import asyncio
from supabase import create_client
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_ANON_KEY"))

async def add_sample_data():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Sample departments
    departments = [
        {"name": "Nhân sự", "description": "Phòng Nhân sự và Hành chính"},
        {"name": "Kế toán", "description": "Phòng Kế toán và Tài chính"},
        {"name": "Kinh doanh", "description": "Phòng Kinh doanh và Marketing"},
        {"name": "Công nghệ", "description": "Phòng Công nghệ thông tin"},
        {"name": "Vận hành", "description": "Phòng Vận hành và Logistics"},
    ]
    
    # Insert departments
    dept_results = []
    for dept in departments:
        dept_data = {
            "id": str(uuid.uuid4()),
            "name": dept["name"],
            "description": dept["description"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("departments").insert(dept_data).execute()
        if result.data:
            dept_results.append(result.data[0])
            print(f"Created department: {dept['name']}")
    
    # Sample positions for each department
    positions_data = [
        # Nhân sự
        {"title": "Trưởng phòng Nhân sự", "dept_name": "Nhân sự"},
        {"title": "Chuyên viên Nhân sự", "dept_name": "Nhân sự"},
        {"title": "Nhân viên Hành chính", "dept_name": "Nhân sự"},
        
        # Kế toán
        {"title": "Trưởng phòng Kế toán", "dept_name": "Kế toán"},
        {"title": "Kế toán trưởng", "dept_name": "Kế toán"},
        {"title": "Kế toán viên", "dept_name": "Kế toán"},
        
        # Kinh doanh
        {"title": "Giám đốc Kinh doanh", "dept_name": "Kinh doanh"},
        {"title": "Trưởng nhóm Sales", "dept_name": "Kinh doanh"},
        {"title": "Nhân viên Kinh doanh", "dept_name": "Kinh doanh"},
        {"title": "Marketing Manager", "dept_name": "Kinh doanh"},
        
        # Công nghệ
        {"title": "CTO", "dept_name": "Công nghệ"},
        {"title": "Senior Developer", "dept_name": "Công nghệ"},
        {"title": "Developer", "dept_name": "Công nghệ"},
        {"title": "System Admin", "dept_name": "Công nghệ"},
        
        # Vận hành
        {"title": "Trưởng phòng Vận hành", "dept_name": "Vận hành"},
        {"title": "Chuyên viên Logistics", "dept_name": "Vận hành"},
        {"title": "Nhân viên Kho", "dept_name": "Vận hành"},
    ]
    
    # Create a mapping of department names to IDs
    dept_map = {dept["name"]: dept["id"] for dept in dept_results}
    
    # Insert positions
    for pos in positions_data:
        dept_id = dept_map.get(pos["dept_name"])
        if dept_id:
            pos_data = {
                "id": str(uuid.uuid4()),
                "title": pos["title"],
                "department_id": dept_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("positions").insert(pos_data).execute()
            if result.data:
                print(f"Created position: {pos['title']} in {pos['dept_name']}")

if __name__ == "__main__":
    asyncio.run(add_sample_data())
    print("Sample data added successfully!")