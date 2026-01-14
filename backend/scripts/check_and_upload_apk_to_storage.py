"""
Script để kiểm tra và upload APK lên Supabase Storage nếu chưa có
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

def check_and_upload_apk(version_code=1):
    """Kiểm tra và upload APK lên Supabase Storage nếu chưa có"""
    try:
        supabase = get_supabase_client()
        
        # 1. Kiểm tra database
        logger.info(f"🔍 Checking version {version_code} in database...")
        response = supabase.table("app_versions").select("*").eq("version_code", version_code).is_("deleted_at", "null").single().execute()
        
        if not response.data:
            logger.error(f"❌ Version {version_code} not found in database!")
            return False
        
        version = response.data
        version_name = version["version_name"]
        logger.info(f"✅ Found version: {version_name} (code: {version_code})")
        
        # 2. Kiểm tra file local
        APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
        apk_filename = f"app-release-v{version_name}.apk"
        apk_path = APK_DIR / apk_filename
        
        logger.info(f"\n📁 Checking local file...")
        logger.info(f"   Path: {apk_path}")
        
        if not apk_path.exists():
            logger.error(f"❌ Local APK file not found: {apk_path}")
            logger.error(f"   Please ensure the APK file exists before uploading.")
            return False
        
        file_size = apk_path.stat().st_size
        logger.info(f"✅ Local file exists: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
        
        # 3. Kiểm tra Supabase Storage
        storage_path = f"app-version/v{version_name}/{apk_filename}"
        logger.info(f"\n☁️  Checking Supabase Storage...")
        logger.info(f"   Storage path: {storage_path}")
        
        try:
            # Try to get file from storage
            existing_file = supabase.storage.from_("minhchung_chiphi").list(f"app-version/v{version_name}")
            
            file_exists = False
            if existing_file:
                for item in existing_file:
                    if item.get("name") == apk_filename:
                        file_exists = True
                        logger.info(f"✅ File already exists in Supabase Storage!")
                        break
            
            if not file_exists:
                logger.info(f"📤 File not found in storage, uploading...")
                
                # Read file
                with open(apk_path, "rb") as f:
                    content = f.read()
                
                # Upload to Supabase Storage
                try:
                    upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                        storage_path,
                        content,
                        file_options={
                            "content-type": "application/octet-stream",
                            "upsert": "true"
                        }
                    )
                    logger.info(f"✅ Upload successful!")
                except Exception as upload_error:
                    error_msg = str(upload_error)
                    if "Payload too large" in error_msg:
                        logger.error(f"❌ File too large for Supabase Storage!")
                        logger.error(f"   File size: {file_size / 1024 / 1024:.2f} MB")
                        logger.error(f"   Please increase file size limit in Supabase Dashboard")
                        return False
                    elif "mime type" in error_msg.lower():
                        logger.error(f"❌ MIME type not supported!")
                        logger.error(f"   Please add 'application/octet-stream' to allowed MIME types")
                        return False
                    else:
                        raise
                
                # Get public URL
                try:
                    public_url_result = supabase.storage.from_("minhchung_chiphi").get_public_url(storage_path)
                    
                    if hasattr(public_url_result, 'public_url'):
                        apk_file_url = public_url_result.public_url
                    elif isinstance(public_url_result, dict):
                        apk_file_url = public_url_result.get("publicUrl")
                    elif isinstance(public_url_result, str):
                        apk_file_url = public_url_result
                    else:
                        supabase_url = settings.SUPABASE_URL
                        apk_file_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{storage_path}"
                    
                    logger.info(f"✅ Public URL: {apk_file_url}")
                    
                    # Update database
                    logger.info(f"\n💾 Updating database...")
                    update_result = supabase.table("app_versions").update({
                        "apk_file_path": storage_path,
                        "apk_file_url": apk_file_url,
                        "file_size": file_size
                    }).eq("version_code", version_code).is_("deleted_at", "null").execute()
                    
                    if update_result.data:
                        logger.info(f"✅ Database updated successfully!")
                        logger.info(f"   - apk_file_path: {storage_path}")
                        logger.info(f"   - apk_file_url: {apk_file_url}")
                        logger.info(f"   - file_size: {file_size} bytes")
                        return True
                    else:
                        logger.error(f"❌ Failed to update database")
                        return False
                        
                except Exception as url_error:
                    logger.error(f"❌ Failed to get public URL: {url_error}")
                    return False
            else:
                # File exists, just update database URL if needed
                logger.info(f"📝 File exists, checking database URL...")
                
                supabase_url = settings.SUPABASE_URL
                apk_file_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{storage_path}"
                
                current_url = version.get("apk_file_url")
                if current_url != apk_file_url:
                    logger.info(f"🔄 Updating database URL...")
                    update_result = supabase.table("app_versions").update({
                        "apk_file_path": storage_path,
                        "apk_file_url": apk_file_url,
                        "file_size": file_size
                    }).eq("version_code", version_code).is_("deleted_at", "null").execute()
                    
                    if update_result.data:
                        logger.info(f"✅ Database URL updated!")
                        logger.info(f"   New URL: {apk_file_url}")
                        return True
                else:
                    logger.info(f"✅ Database URL is already correct!")
                    return True
                    
        except Exception as storage_error:
            logger.error(f"❌ Error checking Supabase Storage: {storage_error}")
            logger.error(f"   Please check:")
            logger.error(f"   1. Bucket 'minhchung_chiphi' exists")
            logger.error(f"   2. File size limit is sufficient (current: {file_size / 1024 / 1024:.2f} MB)")
            logger.error(f"   3. MIME type 'application/octet-stream' is allowed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Check and upload APK to Supabase Storage")
    parser.add_argument("--code", type=int, default=1, help="Version code to check/upload")
    args = parser.parse_args()
    
    success = check_and_upload_apk(args.code)
    sys.exit(0 if success else 1)

