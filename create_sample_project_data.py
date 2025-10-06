#!/usr/bin/env python3
"""
Script to create sample project data with full information and images
"""

import os
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from PIL import Image, ImageDraw, ImageFont
import io

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

def create_sample_image(title, size=(800, 600), color=(70, 130, 180)):
    """Create a sample image with title"""
    img = Image.new('RGB', size, color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    # Draw title
    text_bbox = draw.textbbox((0, 0), title, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    draw.text((x, y), title, fill=(255, 255, 255), font=font)
    
    # Add timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    try:
        small_font = ImageFont.truetype("arial.ttf", 20)
    except:
        small_font = ImageFont.load_default()
    
    draw.text((10, size[1] - 30), timestamp, fill=(255, 255, 255), font=small_font)
    
    return img

def upload_image_to_storage(supabase: Client, project_id: str, image: Image.Image, filename: str):
    """Upload image to Supabase Storage"""
    try:
        # Convert image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Upload to storage with proper content type
        path = f"Timeline/{project_id}/{filename}"
        
        # Try to upload with proper headers
        result = supabase.storage.from_("minhchung_chiphi").upload(
            path, 
            img_byte_arr,
            file_options={"content-type": "image/png"}
        )
        
        if result.get('error'):
            print(f"Error uploading {filename}: {result['error']}")
            return None
        
        # Get public URL
        public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(path)
        return public_url
        
    except Exception as e:
        print(f"Error uploading {filename}: {e}")
        return None

def create_sample_project_data():
    """Create comprehensive sample project data"""
    print("Creating Sample Project Data with Images")
    print("=" * 50)
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    # Sample project ID (using the existing one from our setup)
    project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    
    print(f"Using Project ID: {project_id}")
    
    # Create sample images
    sample_images = [
        {
            "title": "Khoi Cong Du An",
            "filename": "khoi-cong-du-an.png",
            "description": "Hinh anh khoi cong du an xay dung nha pho"
        },
        {
            "title": "Thi Cong Mong",
            "filename": "thi-cong-mong.png", 
            "description": "Qua trinh thi cong mong nha pho"
        },
        {
            "title": "Xay Tuong",
            "filename": "xay-tuong.png",
            "description": "Thi cong xay tuong nha pho"
        },
        {
            "title": "Lap Mai",
            "filename": "lap-mai.png",
            "description": "Qua trinh lap mai nha pho"
        },
        {
            "title": "Hoan Thien",
            "filename": "hoan-thien.png",
            "description": "Cong tac hoan thien nha pho"
        },
        {
            "title": "Nghiem Thu",
            "filename": "nghiem-thu.png",
            "description": "Buoc nghiem thu du an"
        }
    ]
    
    # Create and upload images
    uploaded_images = []
    for i, img_data in enumerate(sample_images):
        print(f"Creating image {i+1}/{len(sample_images)}: {img_data['title']}")
        
        # Create image with different colors
        colors = [(70, 130, 180), (34, 139, 34), (255, 140, 0), (220, 20, 60), (138, 43, 226), (0, 191, 255)]
        color = colors[i % len(colors)]
        
        image = create_sample_image(img_data['title'], color=color)
        public_url = upload_image_to_storage(supabase, project_id, image, img_data['filename'])
        
        if public_url:
            uploaded_images.append({
                "name": img_data['filename'],
                "url": public_url,
                "size": len(image.tobytes()),
                "type": "image/png",
                "description": img_data['description']
            })
            print(f"  Uploaded: {public_url}")
        else:
            print(f"  Failed to upload: {img_data['filename']}")
    
    print(f"\nSuccessfully uploaded {len(uploaded_images)} images")
    
    # Create timeline entries with images
    timeline_entries = [
        {
            "title": "Khoi cong du an",
            "description": "Bat dau thi cong du an xay dung nha pho 3 tang",
            "date": (datetime.now() - timedelta(days=30)).isoformat(),
            "type": "milestone",
            "status": "completed",
            "created_by": "Nguyen Van A",
            "attachments": uploaded_images[:1] if len(uploaded_images) > 0 else []
        },
        {
            "title": "Thi cong mong nha",
            "description": "Hoan thanh thi cong mong nha pho, chuan bi cho giai doan tiep theo",
            "date": (datetime.now() - timedelta(days=25)).isoformat(),
            "type": "update",
            "status": "completed", 
            "created_by": "Tran Thi B",
            "attachments": uploaded_images[1:2] if len(uploaded_images) > 1 else []
        },
        {
            "title": "Xay tuong nha pho",
            "description": "Tien hanh xay tuong nha pho theo dung tien do",
            "date": (datetime.now() - timedelta(days=20)).isoformat(),
            "type": "update",
            "status": "in_progress",
            "created_by": "Le Van C",
            "attachments": uploaded_images[2:3] if len(uploaded_images) > 2 else []
        },
        {
            "title": "Lap mai nha",
            "description": "Thi cong lap mai nha pho, su dung vat lieu chat luong cao",
            "date": (datetime.now() - timedelta(days=15)).isoformat(),
            "type": "milestone",
            "status": "completed",
            "created_by": "Pham Van D",
            "attachments": uploaded_images[3:4] if len(uploaded_images) > 3 else []
        },
        {
            "title": "Hoan thien noi that",
            "description": "Cong tac hoan thien noi that nha pho, lap dat he thong dien nuoc",
            "date": (datetime.now() - timedelta(days=10)).isoformat(),
            "type": "update",
            "status": "in_progress",
            "created_by": "Hoang Thi E",
            "attachments": uploaded_images[4:5] if len(uploaded_images) > 4 else []
        },
        {
            "title": "Nghiem thu du an",
            "description": "Buoc nghiem thu du an xay dung nha pho, kiem tra chat luong",
            "date": (datetime.now() - timedelta(days=5)).isoformat(),
            "type": "milestone",
            "status": "pending",
            "created_by": "Vu Van F",
            "attachments": uploaded_images[5:6] if len(uploaded_images) > 5 else []
        }
    ]
    
    # Insert timeline entries
    print(f"\nCreating {len(timeline_entries)} timeline entries...")
    
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
    print(f"Images uploaded: {len(uploaded_images)}")
    print(f"Timeline entries: {len(timeline_entries)}")
    print(f"Team members: {len(team_members)}")
    
    return True

def main():
    """Main function"""
    print("Sample Project Data Creator")
    print("=" * 40)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = create_sample_project_data()
    
    if success:
        print("\nSample project data created successfully!")
        print("You can now view the project with images at:")
        print("http://localhost:3001/customer-view")
    else:
        print("\nFailed to create sample project data")
        print("Check your Supabase configuration and try again")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
