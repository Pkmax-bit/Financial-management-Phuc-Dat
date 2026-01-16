"""
Script để kiểm tra và cập nhật download URL trong database
"""
import os
import sys
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

def check_current_version():
    """Kiểm tra version hiện tại trong database"""
    print("\n🔍 Đang kiểm tra version hiện tại trong database...\n")
    
    try:
        # Get latest active version
        response = supabase.table("app_versions").select("*").eq("is_active", True).is_("deleted_at", "null").order("version_code", desc=True).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            print("❌ Không tìm thấy version nào trong database!")
            return None
        
        version = response.data[0]
        
        print("✅ Tìm thấy version:")
        print(f"   - Version Code: {version['version_code']}")
        print(f"   - Version Name: {version['version_name']}")
        print(f"   - APK File URL: {version.get('apk_file_url') or '(chưa có)'}")
        print(f"   - APK File Path: {version.get('apk_file_path') or '(chưa có)'}")
        print(f"   - File Size: {version.get('file_size') or '(chưa có)'} bytes")
        print(f"   - Release Notes: {version.get('release_notes') or '(chưa có)'}")
        print(f"   - Is Active: {version.get('is_active')}")
        print(f"   - Download Count: {version.get('download_count', 0)}")
        
        return version
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra version: {e}")
        return None

def update_download_url(version_code: int, new_url: str):
    """Cập nhật download URL cho version"""
    print(f"\n🔄 Đang cập nhật download URL cho version {version_code}...\n")
    
    try:
        response = supabase.table("app_versions").update({
            "apk_file_url": new_url
        }).eq("version_code", version_code).execute()
        
        if response.data:
            print(f"✅ Đã cập nhật download URL thành công!")
            print(f"   - Version Code: {version_code}")
            print(f"   - New URL: {new_url}")
            return True
        else:
            print(f"❌ Không tìm thấy version {version_code} để cập nhật!")
            return False
    except Exception as e:
        print(f"❌ Lỗi khi cập nhật: {e}")
        return False

def list_all_versions():
    """Liệt kê tất cả versions"""
    print("\n📋 Danh sách tất cả versions:\n")
    
    try:
        response = supabase.table("app_versions").select("*").is_("deleted_at", "null").order("version_code", desc=True).execute()
        
        if not response.data or len(response.data) == 0:
            print("❌ Không có version nào trong database!")
            return
        
        for i, version in enumerate(response.data, 1):
            print(f"{i}. Version {version['version_name']} (Code: {version['version_code']})")
            print(f"   - APK File URL: {version.get('apk_file_url') or '(chưa có)'}")
            print(f"   - APK File Path: {version.get('apk_file_path') or '(chưa có)'}")
            print(f"   - Is Active: {version.get('is_active')}")
            print()
    except Exception as e:
        print(f"❌ Lỗi khi liệt kê versions: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Kiểm tra và cập nhật download URL trong database")
    parser.add_argument("--check", action="store_true", help="Kiểm tra version hiện tại")
    parser.add_argument("--list", action="store_true", help="Liệt kê tất cả versions")
    parser.add_argument("--update", type=int, metavar="VERSION_CODE", help="Version code để cập nhật")
    parser.add_argument("--url", type=str, metavar="URL", help="URL mới để cập nhật (dùng với --update)")
    
    args = parser.parse_args()
    
    if args.check:
        check_current_version()
    elif args.list:
        list_all_versions()
    elif args.update and args.url:
        if update_download_url(args.update, args.url):
            print("\n✅ Cập nhật thành công! Kiểm tra lại:")
            check_current_version()
    else:
        # Default: check current version
        check_current_version()
        print("\n💡 Sử dụng:")
        print("   python check_app_version_url.py --check          # Kiểm tra version hiện tại")
        print("   python check_app_version_url.py --list           # Liệt kê tất cả versions")
        print("   python check_app_version_url.py --update 1 --url 'https://...'  # Cập nhật URL")






