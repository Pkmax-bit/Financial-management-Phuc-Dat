"""
Script để cập nhật version với Google Drive link (khi file quá lớn cho Supabase Storage)
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_version_with_google_drive(
    version_code: int,
    google_drive_url: str,
    release_notes: str = None,
    file_size: int = None
):
    """
    Cập nhật version với Google Drive link
    
    Args:
        version_code: Version code
        google_drive_url: Google Drive direct download URL
        release_notes: Release notes (optional)
        file_size: File size in bytes (optional, sẽ lấy từ local file nếu không có)
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Kiểm tra version có tồn tại không
        logger.info(f"🔍 Checking version {version_code}...")
        response = supabase.table("app_versions").select("*").eq("version_code", version_code).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            logger.error(f"❌ Version {version_code} not found in database!")
            logger.error(f"   Please create version first using the API or database")
            return False
        
        version = response.data
        version_name = version["version_name"]
        logger.info(f"✅ Found version: {version_name} (code: {version_code})")
        
        # 2. Lấy file size từ local nếu không có
        if not file_size:
            APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
            apk_filename = f"app-release-v{version_name}.apk"
            apk_path = APK_DIR / apk_filename
            
            if apk_path.exists():
                file_size = apk_path.stat().st_size
                logger.info(f"✅ Found local file: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
            else:
                logger.warning(f"⚠️  Local file not found, using existing file_size from database")
                file_size = version.get("file_size")
        
        # 3. Cập nhật database
        logger.info(f"\n💾 Updating database...")
        logger.info(f"   Google Drive URL: {google_drive_url}")
        
        update_data = {
            "apk_file_url": google_drive_url,
            "apk_file_path": None,  # Không có trong Supabase Storage
            "file_size": file_size,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if release_notes:
            update_data["release_notes"] = release_notes
        
        update_result = supabase.table("app_versions").update(update_data).eq("version_code", version_code).is_("deleted_at", "null").execute()
        
        if not update_result.data:
            logger.error(f"❌ Failed to update database")
            return False
        
        # 4. Đảm bảo version này là active
        logger.info(f"\n🔄 Ensuring version is active...")
        deactivate_result = supabase.table("app_versions").update({
            "is_active": False
        }).neq("version_code", version_code).is_("deleted_at", "null").execute()
        
        activate_result = supabase.table("app_versions").update({
            "is_active": True
        }).eq("version_code", version_code).is_("deleted_at", "null").execute()
        
        logger.info(f"✅ Deactivated {len(deactivate_result.data) if deactivate_result.data else 0} other version(s)")
        logger.info(f"✅ Activated version {version_code}")
        
        # 5. Hiển thị kết quả
        logger.info(f"\n" + "="*60)
        logger.info(f"✅ HOÀN TẤT!")
        logger.info(f"="*60)
        logger.info(f"📦 Version: {version_name} (Code: {version_code})")
        logger.info(f"🔗 Download URL: {google_drive_url}")
        logger.info(f"📊 File Size: {file_size / 1024 / 1024:.2f} MB" if file_size else "📊 File Size: N/A")
        logger.info(f"🟢 Status: ACTIVE")
        if release_notes:
            logger.info(f"📝 Release Notes: {release_notes}")
        logger.info(f"\n💡 Version này sẽ là version mới nhất và được dùng để download")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Update version with Google Drive link")
    parser.add_argument("--code", type=int, required=True, help="Version code")
    parser.add_argument("--url", type=str, required=True, help="Google Drive direct download URL")
    parser.add_argument("--notes", type=str, help="Release notes")
    parser.add_argument("--size", type=int, help="File size in bytes (auto-detect from local file if not provided)")
    
    args = parser.parse_args()
    
    success = update_version_with_google_drive(
        version_code=args.code,
        google_drive_url=args.url,
        release_notes=args.notes,
        file_size=args.size
    )
    
    sys.exit(0 if success else 1)





