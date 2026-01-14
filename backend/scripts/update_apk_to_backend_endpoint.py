"""
Script để cập nhật database sử dụng backend API endpoint thay vì Google Drive link
Backend sẽ serve file từ local storage hoặc Supabase Storage
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_to_backend_endpoint():
    """Cập nhật database để dùng backend API endpoint"""
    try:
        supabase = get_supabase_client()
        
        # Get current version
        response = supabase.table("app_versions").select("*").eq("version_code", 1).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            logger.error("Version 1.0 not found in database!")
            return False
        
        version = response.data
        version_code = version["version_code"]
        version_name = version["version_name"]
        
        # Backend URL - lấy từ env hoặc dùng default
        import os
        backend_url = os.getenv("BACKEND_URL") or "https://financial-management-backend-3m78.onrender.com"
        
        # Construct backend API endpoint URL
        backend_download_url = f"{backend_url}/api/app-updates/download/{version_code}"
        
        logger.info(f"Updating version {version_code} ({version_name})...")
        logger.info(f"New download URL: {backend_download_url}")
        
        # Update database
        update_result = supabase.table("app_versions").update({
            "apk_file_url": backend_download_url,  # Backend API endpoint
            "apk_file_path": f"apk_releases/app-release-v{version_name}.apk"  # Local path
        }).eq("version_code", version_code).is_("deleted_at", "null").execute()
        
        if update_result.data:
            logger.info("✅ Database updated successfully!")
            logger.info(f"   Version {version_name} now uses backend API endpoint:")
            logger.info(f"   - apk_file_url: {backend_download_url}")
            logger.info(f"   - apk_file_path: apk_releases/app-release-v{version_name}.apk")
            logger.info(f"\n💡 Backend sẽ serve file từ local storage: backend/apk_releases/app-release-v{version_name}.apk")
            return True
        else:
            logger.error("Failed to update database")
            return False
            
    except Exception as e:
        logger.error(f"Error updating database: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    success = update_to_backend_endpoint()
    sys.exit(0 if success else 1)

