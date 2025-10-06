#!/usr/bin/env python3
"""
Simple script to create sample project data with existing images
"""

import os
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables")
        return None
    
    return create_client(url, key)

def create_sample_data():
    """Create sample project data with existing images"""
    print("Creating Simple Sample Project Data")
    print("=" * 40)
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    # Sample project ID
    project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    
    print(f"Using Project ID: {project_id}")
    
    # Sample images with existing URLs (from our previous upload test)
    sample_images = [
        {
            "name": "meeting-screenshot.png",
            "url": "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/meeting-screenshot.png",
            "size": 50000,
            "type": "image/png",
            "description": "Hinh anh cuoc hop khoi cong du an"
        },
        {
            "name": "progress-report.png", 
            "url": "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/progress-report.png",
            "size": 45000,
            "type": "image/png",
            "description": "Bao cao tien do thi cong"
        },
        {
            "name": "timeline-update.png",
            "url": "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/timeline-update.png", 
            "size": 48000,
            "type": "image/png",
            "description": "Cap nhat timeline du an"
        },
        {
            "name": "project-milestone.png",
            "url": "https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/dddddddd-dddd-dddd-dddd-dddddddddddd/project-milestone.png",
            "size": 52000,
            "type": "image/png", 
            "description": "Cot moc quan trong cua du an"
        }
    ]
    
    # Create timeline entries with images
    timeline_entries = [
        {
            "title": "Khoi cong du an xay dung nha pho",
            "description": "Bat dau thi cong du an xay dung nha pho 3 tang tai quan 1, TP.HCM. Du an duoc thuc hien theo dung tien do va chat luong cao.",
            "date": (datetime.now() - timedelta(days=30)).isoformat(),
            "type": "milestone",
            "status": "completed",
            "created_by": "Nguyen Van A - Project Manager",
            "attachments": sample_images[:1]
        },
        {
            "title": "Thi cong mong nha pho",
            "description": "Hoan thanh thi cong mong nha pho voi he thong mong coc khoan nhoi. Chat luong mong duoc kiem tra va dam bao tieu chuan.",
            "date": (datetime.now() - timedelta(days=25)).isoformat(),
            "type": "update",
            "status": "completed",
            "created_by": "Tran Thi B - Site Supervisor", 
            "attachments": sample_images[1:2]
        },
        {
            "title": "Xay tuong nha pho",
            "description": "Tien hanh xay tuong nha pho theo dung tien do. Su dung vat lieu chat luong cao va thuc hien theo dung quy trinh.",
            "date": (datetime.now() - timedelta(days=20)).isoformat(),
            "type": "update",
            "status": "in_progress",
            "created_by": "Le Van C - Foreman",
            "attachments": sample_images[2:3]
        },
        {
            "title": "Lap mai nha pho",
            "description": "Thi cong lap mai nha pho voi he thong mai ton. Dam bao chat luong va tham nuoc tot.",
            "date": (datetime.now() - timedelta(days=15)).isoformat(),
            "type": "milestone",
            "status": "completed",
            "created_by": "Pham Van D - Roofer",
            "attachments": sample_images[3:4]
        },
        {
            "title": "Hoan thien noi that",
            "description": "Cong tac hoan thien noi that nha pho bao gom lap dat he thong dien, nuoc, va trang tri noi that.",
            "date": (datetime.now() - timedelta(days=10)).isoformat(),
            "type": "update",
            "status": "in_progress",
            "created_by": "Hoang Thi E - Interior Designer",
            "attachments": []
        },
        {
            "title": "Nghiem thu du an",
            "description": "Buoc nghiem thu du an xay dung nha pho. Kiem tra chat luong, an toan va dam bao dung tien do.",
            "date": (datetime.now() - timedelta(days=5)).isoformat(),
            "type": "milestone",
            "status": "pending",
            "created_by": "Vu Van F - Quality Inspector",
            "attachments": []
        }
    ]
    
    # Insert timeline entries
    print(f"Creating {len(timeline_entries)} timeline entries...")
    
    for i, entry in enumerate(timeline_entries):
        print(f"Creating timeline entry {i+1}: {entry['title']}")
        
        # Insert timeline entry
        timeline_data = {
            "project_id": project_id,
            "title": entry["title"],
            "description": entry["description"],
            "date": entry["date"],
            "type": entry["type"],
            "status": entry["status"],
            "created_by": entry["created_by"]
        }
        
        try:
            result = supabase.table("project_timeline").insert(timeline_data).execute()
            if result.data:
                timeline_id = result.data[0]["id"]
                print(f"  Timeline entry created: {timeline_id}")
                
                # Insert attachments
                for attachment in entry["attachments"]:
                    attachment_data = {
                        "timeline_entry_id": timeline_id,
                        "name": attachment["name"],
                        "url": attachment["url"],
                        "type": "image",
                        "size": attachment["size"]
                    }
                    
                    try:
                        att_result = supabase.table("timeline_attachments").insert(attachment_data).execute()
                        if att_result.data:
                            print(f"    Attachment added: {attachment['name']}")
                        else:
                            print(f"    Failed to add attachment: {attachment['name']}")
                    except Exception as e:
                        print(f"    Error adding attachment: {e}")
            else:
                print(f"  Failed to create timeline entry: {entry['title']}")
        except Exception as e:
            print(f"  Error creating timeline entry: {e}")
    
    # Create sample project team
    print(f"\nCreating project team...")
    
    team_members = [
        {
            "name": "Nguyen Van A",
            "role": "project_manager",
            "email": "nguyenvana@example.com",
            "phone": "0123456789",
            "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "hourly_rate": 500000,
            "status": "active",
            "skills": ["Project Management", "Leadership", "Construction Planning"]
        },
        {
            "name": "Tran Thi B",
            "role": "site_supervisor",
            "email": "tranthib@example.com",
            "phone": "0987654321", 
            "start_date": (datetime.now() - timedelta(days=25)).strftime("%Y-%m-%d"),
            "hourly_rate": 400000,
            "status": "active",
            "skills": ["Site Supervision", "Quality Control", "Safety Management"]
        },
        {
            "name": "Le Van C",
            "role": "foreman",
            "email": "levanc@example.com",
            "phone": "0369852147",
            "start_date": (datetime.now() - timedelta(days=20)).strftime("%Y-%m-%d"),
            "hourly_rate": 350000,
            "status": "active",
            "skills": ["Construction", "Team Leadership", "Equipment Operation"]
        },
        {
            "name": "Pham Van D",
            "role": "roofer",
            "email": "phamvand@example.com",
            "phone": "0369852148",
            "start_date": (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"),
            "hourly_rate": 300000,
            "status": "active",
            "skills": ["Roofing", "Waterproofing", "Safety"]
        },
        {
            "name": "Hoang Thi E",
            "role": "interior_designer",
            "email": "hoangthie@example.com",
            "phone": "0369852149",
            "start_date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
            "hourly_rate": 450000,
            "status": "active",
            "skills": ["Interior Design", "Space Planning", "Material Selection"]
        }
    ]
    
    for member in team_members:
        member_data = {
            "project_id": project_id,
            **member
        }
        
        try:
            result = supabase.table("project_team").insert(member_data).execute()
            if result.data:
                print(f"  Team member added: {member['name']}")
            else:
                print(f"  Failed to add team member: {member['name']}")
        except Exception as e:
            print(f"  Error adding team member: {e}")
    
    print(f"\nSample project data creation completed!")
    print(f"Project ID: {project_id}")
    print(f"Timeline entries: {len(timeline_entries)}")
    print(f"Team members: {len(team_members)}")
    print(f"Sample images: {len(sample_images)}")
    
    return True

def main():
    """Main function"""
    print("Simple Sample Project Data Creator")
    print("=" * 40)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = create_sample_data()
    
    if success:
        print("\nSample project data created successfully!")
        print("You can now view the project with images at:")
        print("http://localhost:3001/customer-view")
        print("\nSample data includes:")
        print("- 6 timeline entries with construction progress")
        print("- 4 sample images from Storage")
        print("- 5 project team members")
        print("- Complete project information")
    else:
        print("\nFailed to create sample project data")
        print("Check your Supabase configuration and try again")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
