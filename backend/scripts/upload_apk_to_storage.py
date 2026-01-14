"""
Script to upload existing APK file to Supabase Storage
Run this to upload the current APK file (v1.0) to Supabase Storage bucket
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

def upload_apk_to_storage():
    """Upload existing APK file to Supabase Storage"""
    try:
        supabase = get_supabase_client()
        
        # Read APK file
        apk_path = Path(__file__).parent.parent.parent / "apk_releases" / "app-release-v1.0.apk"
        
        if not apk_path.exists():
            logger.error(f"APK file not found: {apk_path}")
            return False
        
        logger.info(f"Reading APK file: {apk_path}")
        with open(apk_path, "rb") as f:
            content = f.read()
        
        file_size = len(content)
        logger.info(f"File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
        
        # Upload to Supabase Storage
        storage_path = "app-version/v1.0/app-release-v1.0.apk"
        logger.info(f"Uploading to Supabase Storage: {storage_path}")
        
        # Try with application/octet-stream (generic binary) since APK MIME type may not be allowed
        try:
            upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                storage_path,
                content,
                file_options={
                    "content-type": "application/vnd.android.package-archive",
                    "upsert": "true"
                }
            )
        except Exception as e:
            logger.warning(f"Upload with APK MIME type failed: {e}")
            logger.info("Retrying with application/octet-stream...")
            # Fallback to generic binary type
            upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                storage_path,
                content,
                file_options={
                    "content-type": "application/octet-stream",
                    "upsert": "true"
                }
            )
        
        # Get public URL
        public_url_result = supabase.storage.from_("minhchung_chiphi").get_public_url(storage_path)
        
        if hasattr(public_url_result, 'public_url'):
            apk_file_url = public_url_result.public_url
        elif isinstance(public_url_result, dict):
            apk_file_url = public_url_result.get("publicUrl")
        elif isinstance(public_url_result, str):
            apk_file_url = public_url_result
        else:
            # Fallback: construct URL manually
            supabase_url = settings.SUPABASE_URL
            apk_file_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{storage_path}"
        
        logger.info(f"✅ APK uploaded successfully!")
        logger.info(f"   Storage path: {storage_path}")
        logger.info(f"   Public URL: {apk_file_url}")
        
        # Update database with both apk_file_path and apk_file_url
        logger.info("Updating database...")
        update_result = supabase.table("app_versions").update({
            "apk_file_path": f"app-version/v1.0/app-release-v1.0.apk",  # Storage path
            "apk_file_url": apk_file_url,  # Public URL from Supabase Storage
            "file_size": file_size
        }).eq("version_code", 1).is_("deleted_at", "null").execute()
        
        if update_result.data:
            logger.info("✅ Database updated successfully!")
            logger.info(f"   Version 1.0 now has:")
            logger.info(f"   - apk_file_path: app-version/v1.0/app-release-v1.0.apk")
            logger.info(f"   - apk_file_url: {apk_file_url}")
            logger.info(f"   - file_size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
            return True
        else:
            logger.error("Failed to update database")
            return False
            
    except Exception as e:
        logger.error(f"Error uploading APK: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    success = upload_apk_to_storage()
    sys.exit(0 if success else 1)

