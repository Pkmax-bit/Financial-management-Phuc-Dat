#!/usr/bin/env python3
"""
Test script for uploading real images to Supabase storage
Bucket: minhchung_chiphi
Folder: Timeline
"""

import os
import sys
import base64
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not found")
        sys.exit(1)
    
    return create_client(url, key)

def create_sample_image():
    """Create a sample image (larger PNG)"""
    # Create a simple 100x100 pixel PNG image
    import io
    from PIL import Image, ImageDraw
    
    # Create a new image with RGB mode
    img = Image.new('RGB', (100, 100), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Draw some content
    draw.rectangle([10, 10, 90, 90], outline='blue', width=2)
    draw.text((20, 40), "TEST", fill='darkblue')
    draw.text((20, 60), "IMAGE", fill='darkblue')
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_upload_real_image():
    """Test uploading a real image to Timeline folder"""
    print("Testing Real Image Upload to Supabase Storage")
    print("=" * 60)
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        print("Connected to Supabase")
        
        # Test project ID
        project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
        print(f"Testing with project ID: {project_id}")
        
        # Create real image data
        print("Creating sample image...")
        image_data = create_sample_image()
        print(f"Image created: {len(image_data)} bytes")
        
        # Upload files with different names
        files_to_upload = [
            "meeting-screenshot.png",
            "progress-report.png", 
            "timeline-update.png",
            "project-milestone.png"
        ]
        
        results = []
        
        for i, filename in enumerate(files_to_upload):
            print(f"\nUploading {filename}...")
            
            file_path = f"Timeline/{project_id}/{filename}"
            
            # Upload to Supabase storage
            result = supabase.storage.from_("minhchung_chiphi").upload(
                file_path,
                image_data,
                file_options={"content-type": "image/png"}
            )
            
            if result:
                print(f"SUCCESS: {filename} uploaded")
                
                # Get public URL
                public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
                print(f"URL: {public_url}")
                
                results.append({
                    "filename": filename,
                    "path": file_path,
                    "url": public_url,
                    "size": len(image_data),
                    "success": True
                })
            else:
                print(f"FAILED: {filename} upload failed")
                results.append({
                    "filename": filename,
                    "success": False
                })
        
        # List all files in Timeline folder
        print(f"\nListing all files in Timeline/{project_id}/...")
        files = supabase.storage.from_("minhchung_chiphi").list(f"Timeline/{project_id}")
        
        if files:
            print(f"Found {len(files)} files:")
            for file in files:
                print(f"  - {file['name']}")
        else:
            print("No files found")
        
        # Test download one file
        if results:
            test_file = results[0]
            if test_file["success"]:
                print(f"\nTesting download: {test_file['filename']}")
                download_result = supabase.storage.from_("minhchung_chiphi").download(test_file["path"])
                if download_result:
                    print(f"Download successful! Size: {len(download_result)} bytes")
                else:
                    print("Download failed")
        
        # Summary
        print("\n" + "="*60)
        print("UPLOAD SUMMARY")
        print("="*60)
        
        successful_uploads = [r for r in results if r.get("success")]
        failed_uploads = [r for r in results if not r.get("success")]
        
        print(f"Total files: {len(results)}")
        print(f"Successful: {len(successful_uploads)}")
        print(f"Failed: {len(failed_uploads)}")
        
        if successful_uploads:
            print(f"\nSample URL: {successful_uploads[0]['url']}")
            print(f"File size: {successful_uploads[0]['size']} bytes")
        
        return {
            "total": len(results),
            "successful": len(successful_uploads),
            "failed": len(failed_uploads),
            "results": results
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

def test_different_file_types():
    """Test uploading different file types"""
    print("\n" + "="*60)
    print("TESTING DIFFERENT FILE TYPES")
    print("="*60)
    
    try:
        supabase = get_supabase_client()
        project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
        
        # Test different file types
        test_files = [
            {
                "name": "document.pdf",
                "content": b"PDF document content",
                "type": "application/pdf"
            },
            {
                "name": "spreadsheet.xlsx", 
                "content": b"Excel spreadsheet content",
                "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            },
            {
                "name": "text-file.txt",
                "content": b"Plain text content",
                "type": "text/plain"
            }
        ]
        
        results = []
        
        for file_info in test_files:
            print(f"\nUploading {file_info['name']}...")
            
            file_path = f"Timeline/{project_id}/{file_info['name']}"
            
            result = supabase.storage.from_("minhchung_chiphi").upload(
                file_path,
                file_info["content"],
                file_options={"content-type": file_info["type"]}
            )
            
            if result:
                public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
                print(f"SUCCESS: {file_info['name']}")
                print(f"URL: {public_url}")
                results.append({"name": file_info["name"], "success": True, "url": public_url})
            else:
                print(f"FAILED: {file_info['name']}")
                results.append({"name": file_info["name"], "success": False})
        
        return results
        
    except Exception as e:
        print(f"Error testing file types: {e}")
        return []

if __name__ == "__main__":
    # Test real image upload
    upload_result = test_upload_real_image()
    
    # Test different file types
    file_type_results = test_different_file_types()
    
    # Final summary
    print("\n" + "="*60)
    print("FINAL TEST SUMMARY")
    print("="*60)
    
    if "error" not in upload_result:
        print(f"Image uploads: {upload_result['successful']}/{upload_result['total']} successful")
    
    if file_type_results:
        successful_files = [r for r in file_type_results if r.get("success")]
        print(f"File type tests: {len(successful_files)}/{len(file_type_results)} successful")
    
    print("\nStorage test completed!")
    print("You can now use these URLs in your timeline components.")
