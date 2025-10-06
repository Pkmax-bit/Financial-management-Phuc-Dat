#!/usr/bin/env python3
"""
Simple test script for uploading to Supabase storage
Bucket: minhchung_chiphi
Folder: Timeline
"""

import os
import sys
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

def create_test_image():
    """Create a simple test image (base64 encoded PNG)"""
    # Simple 1x1 pixel PNG image in base64
    import base64
    png_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    return base64.b64decode(png_data)

def test_upload():
    """Test uploading a file to Timeline folder"""
    print("Testing Supabase Storage Upload to Timeline")
    print("=" * 50)
    
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        print("Connected to Supabase")
        
        # Test project ID
        project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
        print(f"Testing with project ID: {project_id}")
        
        # Create test image data
        test_image_data = create_test_image()
        file_name = f"test-image-{datetime.now().strftime('%Y%m%d-%H%M%S')}.png"
        file_path = f"Timeline/{project_id}/{file_name}"
        
        print(f"Uploading to: {file_path}")
        
        # Upload to Supabase storage
        result = supabase.storage.from_("minhchung_chiphi").upload(
            file_path,
            test_image_data,
            file_options={"content-type": "image/png"}
        )
        
        if result:
            print("Upload successful!")
            
            # Get public URL
            public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
            print(f"Public URL: {public_url}")
            
            # Test download
            print("Testing download...")
            download_result = supabase.storage.from_("minhchung_chiphi").download(file_path)
            if download_result:
                print(f"Download successful! Size: {len(download_result)} bytes")
            else:
                print("Download failed")
                
            return {
                "success": True,
                "file_path": file_path,
                "public_url": public_url,
                "file_size": len(test_image_data)
            }
        else:
            print("Upload failed")
            return {"success": False, "error": "Upload failed"}
            
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": str(e)}

def test_list_files():
    """Test listing files in Timeline folder"""
    print("\nListing files in Timeline folder...")
    
    try:
        supabase = get_supabase_client()
        project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
        
        files = supabase.storage.from_("minhchung_chiphi").list(f"Timeline/{project_id}")
        
        if files:
            print(f"Found {len(files)} files:")
            for file in files:
                print(f"  - {file['name']} ({file.get('size', 'unknown')} bytes)")
        else:
            print("No files found")
            
        return files
        
    except Exception as e:
        print(f"Error listing files: {e}")
        return None

if __name__ == "__main__":
    # Test upload
    upload_result = test_upload()
    
    # Test list files
    files = test_list_files()
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    if upload_result.get("success"):
        print("Upload: SUCCESS")
        print(f"File URL: {upload_result.get('public_url')}")
        print(f"File size: {upload_result.get('file_size')} bytes")
    else:
        print("Upload: FAILED")
        print(f"Error: {upload_result.get('error')}")
    
    if files is not None:
        print("File listing: SUCCESS")
    else:
        print("File listing: FAILED")
    
    print("\nTest completed!")
