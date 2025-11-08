#!/usr/bin/env python3
"""
Test script for uploading images to Supabase storage
Bucket: minhchung_chiphi
Folder: Timeline
"""

import os
import sys
import base64
import requests
from datetime import datetime
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
        sys.exit(1)
    
    return create_client(url, key)

def create_test_image():
    """Create a simple test image (base64 encoded PNG)"""
    # Simple 1x1 pixel PNG image in base64
    png_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    return base64.b64decode(png_data)

def test_upload_to_timeline(supabase: Client, project_id: str = "test-project-123"):
    """Test uploading files to Timeline folder"""
    print(f"🚀 Testing upload to Timeline/{project_id}/")
    
    try:
        # Create test image data
        test_image_data = create_test_image()
        file_name = f"test-image-{datetime.now().strftime('%Y%m%d-%H%M%S')}.png"
        file_path = f"Timeline/{project_id}/{file_name}"
        
        print(f"📁 Uploading to: {file_path}")
        
        # Upload to Supabase storage
        result = supabase.storage.from_("minhchung_chiphi").upload(
            file_path,
            test_image_data,
            file_options={"content-type": "image/png"}
        )
        
        if result:
            print("✅ Upload successful!")
            
            # Get public URL
            public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
            print(f"🔗 Public URL: {public_url}")
            
            # Test download
            print("📥 Testing download...")
            download_result = supabase.storage.from_("minhchung_chiphi").download(file_path)
            if download_result:
                print(f"✅ Download successful! Size: {len(download_result)} bytes")
            else:
                print("❌ Download failed")
                
            return {
                "success": True,
                "file_path": file_path,
                "public_url": public_url,
                "file_size": len(test_image_data)
            }
        else:
            print("❌ Upload failed")
            return {"success": False, "error": "Upload failed"}
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"success": False, "error": str(e)}

def test_multiple_uploads(supabase: Client, project_id: str = "test-project-123"):
    """Test uploading multiple files"""
    print(f"\n🔄 Testing multiple uploads to Timeline/{project_id}/")
    
    files_to_upload = [
        {"name": "meeting-notes.png", "type": "image/png"},
        {"name": "progress-report.pdf", "type": "application/pdf"},
        {"name": "screenshot.jpg", "type": "image/jpeg"}
    ]
    
    results = []
    
    for file_info in files_to_upload:
        print(f"\n📤 Uploading {file_info['name']}...")
        
        # Create dummy content based on file type
        if "image" in file_info["type"]:
            content = create_test_image()
        else:
            content = b"Test document content"
        
        file_path = f"Timeline/{project_id}/{file_info['name']}"
        
        try:
            result = supabase.storage.from_("minhchung_chiphi").upload(
                file_path,
                content,
                file_options={"content-type": file_info["type"]}
            )
            
            if result:
                public_url = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
                print(f"✅ {file_info['name']} uploaded successfully")
                print(f"🔗 URL: {public_url}")
                results.append({
                    "name": file_info["name"],
                    "path": file_path,
                    "url": public_url,
                    "success": True
                })
            else:
                print(f"❌ {file_info['name']} upload failed")
                results.append({
                    "name": file_info["name"],
                    "success": False
                })
                
        except Exception as e:
            print(f"❌ Error uploading {file_info['name']}: {e}")
            results.append({
                "name": file_info["name"],
                "success": False,
                "error": str(e)
            })
    
    return results

def test_list_files(supabase: Client, project_id: str = "test-project-123"):
    """Test listing files in Timeline folder"""
    print(f"\n📋 Listing files in Timeline/{project_id}/")
    
    try:
        files = supabase.storage.from_("minhchung_chiphi").list(f"Timeline/{project_id}")
        
        if files:
            print(f"✅ Found {len(files)} files:")
            for file in files:
                print(f"  📄 {file['name']} ({file.get('size', 'unknown')} bytes)")
        else:
            print("📭 No files found")
            
        return files
        
    except Exception as e:
        print(f"❌ Error listing files: {e}")
        return None

def test_delete_file(supabase: Client, file_path: str):
    """Test deleting a file"""
    print(f"\n🗑️ Testing delete: {file_path}")
    
    try:
        result = supabase.storage.from_("minhchung_chiphi").remove([file_path])
        
        if result:
            print("✅ File deleted successfully")
            return True
        else:
            print("❌ Delete failed")
            return False
            
    except Exception as e:
        print(f"❌ Error deleting file: {e}")
        return False

def main():
    """Main test function"""
    print("Testing Supabase Storage Upload to Timeline")
    print("=" * 50)
    
    # Get Supabase client
    supabase = get_supabase_client()
    print("Connected to Supabase")
    
    # Test project ID
    project_id = "dddddddd-dddd-dddd-dddd-dddddddddddd"
    print(f"Testing with project ID: {project_id}")
    
    # Test 1: Single file upload
    print("\n" + "="*50)
    print("TEST 1: Single File Upload")
    print("="*50)
    upload_result = test_upload_to_timeline(supabase, project_id)
    
    # Test 2: Multiple file uploads
    print("\n" + "="*50)
    print("TEST 2: Multiple File Uploads")
    print("="*50)
    multiple_results = test_multiple_uploads(supabase, project_id)
    
    # Test 3: List files
    print("\n" + "="*50)
    print("TEST 3: List Files")
    print("="*50)
    files = test_list_files(supabase, project_id)
    
    # Test 4: Delete test file (optional)
    if upload_result.get("success") and upload_result.get("file_path"):
        print("\n" + "="*50)
        print("TEST 4: Delete File")
        print("="*50)
        delete_result = test_delete_file(supabase, upload_result["file_path"])
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    
    print(f"✅ Single upload: {'SUCCESS' if upload_result.get('success') else 'FAILED'}")
    print(f"✅ Multiple uploads: {sum(1 for r in multiple_results if r.get('success'))}/{len(multiple_results)} successful")
    print(f"✅ File listing: {'SUCCESS' if files is not None else 'FAILED'}")
    
    if upload_result.get("success"):
        print(f"\n🔗 Test file URL: {upload_result.get('public_url')}")
        print(f"📏 File size: {upload_result.get('file_size')} bytes")
    
    print("\n🎉 Storage test completed!")

if __name__ == "__main__":
    main()
