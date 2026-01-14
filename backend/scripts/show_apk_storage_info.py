"""
Script để hiển thị thông tin chi tiết về vị trí lưu trữ APK
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# APK directory
APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"

def format_file_size(size_bytes):
    """Format file size to human readable"""
    if not size_bytes:
        return "N/A"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def check_local_files():
    """Kiểm tra files local"""
    print("\n📁 Local Storage (backend/apk_releases/):")
    print("=" * 60)
    
    if not APK_DIR.exists():
        print("❌ Thư mục không tồn tại!")
        return []
    
    apk_files = list(APK_DIR.glob("*.apk"))
    
    if not apk_files:
        print("⚠️  Không có file APK nào trong thư mục local")
        return []
    
    print(f"✅ Tìm thấy {len(apk_files)} file(s):\n")
    for apk_file in sorted(apk_files):
        size = apk_file.stat().st_size
        print(f"   📦 {apk_file.name}")
        print(f"      - Path: {apk_file}")
        print(f"      - Size: {format_file_size(size)}")
        print()
    
    return apk_files

def check_database():
    """Kiểm tra thông tin trong database"""
    print("\n💾 Database (app_versions table):")
    print("=" * 60)
    
    try:
        # Get all versions
        response = supabase.table("app_versions").select("*").is_("deleted_at", "null").order("version_code", desc=True).execute()
        
        if not response.data or len(response.data) == 0:
            print("❌ Không có version nào trong database!")
            return []
        
        print(f"✅ Tìm thấy {len(response.data)} version(s):\n")
        
        for version in response.data:
            is_active = "🟢 ACTIVE" if version.get("is_active") else "⚪ Inactive"
            print(f"   {is_active} Version {version['version_name']} (Code: {version['version_code']})")
            print(f"      - ID: {version['id']}")
            print(f"      - APK File Path: {version.get('apk_file_path') or '(chưa có)'}")
            print(f"      - APK File URL: {version.get('apk_file_url') or '(chưa có)'}")
            if version.get('apk_file_url'):
                print(f"        → {version['apk_file_url']}")
            print(f"      - File Size: {format_file_size(version.get('file_size'))}")
            print(f"      - Download Count: {version.get('download_count', 0)}")
            print(f"      - Release Notes: {version.get('release_notes') or '(chưa có)'}")
            print()
        
        return response.data
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra database: {e}")
        return []

def check_supabase_storage():
    """Kiểm tra Supabase Storage"""
    print("\n☁️  Supabase Storage (minhchung_chiphi bucket):")
    print("=" * 60)
    
    try:
        # List files in app-versions folder
        storage_path = "app-versions"
        files = supabase.storage.from_("minhchung_chiphi").list(storage_path)
        
        if not files:
            print("⚠️  Không có file nào trong Supabase Storage")
            return []
        
        print(f"✅ Tìm thấy {len(files)} file/folder(s):\n")
        
        # Group by version
        versions = {}
        for item in files:
            if item.get('name', '').endswith('.apk'):
                # Extract version from path
                path_parts = item.get('id', '').split('/')
                if len(path_parts) >= 2:
                    version_folder = path_parts[-2]  # e.g., "v1.0"
                    if version_folder not in versions:
                        versions[version_folder] = []
                    versions[version_folder].append(item)
        
        for version_folder, files_list in sorted(versions.items()):
            print(f"   📦 {version_folder}/")
            for file_info in files_list:
                file_name = file_info.get('name', 'Unknown')
                file_size = file_info.get('metadata', {}).get('size', 0)
                print(f"      - {file_name}")
                print(f"        Size: {format_file_size(file_size)}")
                # Construct public URL
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/minhchung_chiphi/app-versions/{version_folder}/{file_name}"
                print(f"        URL: {public_url}")
            print()
        
        return files
    except Exception as e:
        print(f"⚠️  Không thể kiểm tra Supabase Storage: {e}")
        print("   (Có thể do bucket không tồn tại hoặc không có quyền truy cập)")
        return []

def show_summary(local_files, db_versions, storage_files):
    """Hiển thị tóm tắt"""
    print("\n📊 TÓM TẮT:")
    print("=" * 60)
    
    print(f"   📁 Local Files: {len(local_files)} file(s)")
    print(f"   💾 Database Records: {len(db_versions)} version(s)")
    print(f"   ☁️  Supabase Storage: {len(storage_files) if storage_files else 0} file(s)")
    
    # Check active version
    active_versions = [v for v in db_versions if v.get("is_active")]
    if active_versions:
        active = active_versions[0]
        print(f"\n   🟢 Active Version: {active['version_name']} (Code: {active['version_code']})")
        if active.get('apk_file_url'):
            print(f"      Download URL: {active['apk_file_url']}")
        elif active.get('apk_file_path'):
            print(f"      File Path: {active['apk_file_path']}")
        else:
            print(f"      ⚠️  Chưa có download URL hoặc file path!")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🔍 KIỂM TRA VỊ TRÍ LƯU TRỮ APK")
    print("=" * 60)
    
    # Check all locations
    local_files = check_local_files()
    db_versions = check_database()
    storage_files = check_supabase_storage()
    
    # Show summary
    show_summary(local_files, db_versions, storage_files)
    
    print("\n💡 Lưu ý:")
    print("   - Local files: Lưu trong backend/apk_releases/")
    print("   - Database: Lưu metadata trong bảng app_versions")
    print("   - Supabase Storage: Lưu trong bucket minhchung_chiphi/app-versions/")
    print("   - Download URL: Ưu tiên apk_file_url > apk_file_path > local file")
    print()

