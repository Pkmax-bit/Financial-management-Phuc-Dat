"""
Script để kiểm tra download endpoint và debug lỗi "Not Found"
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_download_endpoint(version_code=1):
    """Kiểm tra endpoint download có hoạt động không"""
    try:
        supabase = get_supabase_client()
        
        # Check database
        logger.info(f"Checking version {version_code} in database...")
        response = supabase.table("app_versions").select("*").eq("version_code", version_code).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            logger.error(f"❌ Version {version_code} not found in database!")
            return False
        
        version = response.data
        version_name = version["version_name"]
        logger.info(f"✅ Found version: {version_name} (code: {version_code})")
        logger.info(f"   - apk_file_url: {version.get('apk_file_url')}")
        logger.info(f"   - apk_file_path: {version.get('apk_file_path')}")
        logger.info(f"   - is_active: {version.get('is_active')}")
        
        # Check local file
        APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
        apk_filename = f"app-release-v{version_name}.apk"
        apk_path = APK_DIR / apk_filename
        
        logger.info(f"\nChecking local file...")
        logger.info(f"   - APK_DIR: {APK_DIR}")
        logger.info(f"   - File path: {apk_path}")
        logger.info(f"   - File exists: {apk_path.exists()}")
        
        if apk_path.exists():
            file_size = apk_path.stat().st_size
            logger.info(f"   - File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
            logger.info(f"✅ Local file exists!")
        else:
            logger.warning(f"⚠️  Local file does NOT exist!")
            logger.warning(f"   This is OK if running on production server.")
            logger.warning(f"   File should be uploaded to server or use external URL.")
        
        # Check endpoint URL
        backend_url = "https://financial-management-backend-3m78.onrender.com"
        endpoint_url = f"{backend_url}/api/app-updates/download/{version_code}"
        logger.info(f"\n📥 Download Endpoint:")
        logger.info(f"   {endpoint_url}")
        
        logger.info(f"\n💡 Possible issues:")
        logger.info(f"   1. File not uploaded to production server")
        logger.info(f"   2. Version not found in database")
        logger.info(f"   3. File path incorrect on server")
        logger.info(f"   4. Server needs restart after file upload")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error checking endpoint: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Check download endpoint")
    parser.add_argument("--code", type=int, default=1, help="Version code to check")
    args = parser.parse_args()
    
    check_download_endpoint(args.code)






