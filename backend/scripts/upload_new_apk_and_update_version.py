"""
Script để upload APK mới lên Supabase Storage và cập nhật thông tin version trong database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client
from config import settings
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_new_apk_and_update_version(
    version_code: int,
    version_name: str,
    apk_file_path: str = None,
    release_notes: str = None,
    min_supported_version_code: int = 1,
    update_required: bool = False
):
    """
    Upload APK mới và cập nhật version trong database
    
    Args:
        version_code: Version code (phải tăng dần, ví dụ: 2, 3, 4...)
        version_name: Version name (ví dụ: "1.1", "1.2", "2.0")
        apk_file_path: Đường dẫn đến file APK (nếu None, tự động tìm theo version_name)
        release_notes: Ghi chú phiên bản
        min_supported_version_code: Version code tối thiểu được hỗ trợ
        update_required: Có bắt buộc update không
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Tìm file APK
        if not apk_file_path:
            # Tự động tìm file theo version_name
            APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
            apk_filename = f"app-release-v{version_name}.apk"
            apk_file_path = APK_DIR / apk_filename
        
        apk_path = Path(apk_file_path)
        
        if not apk_path.exists():
            logger.error(f"❌ APK file not found: {apk_path}")
            logger.error(f"   Please provide a valid APK file path")
            return False
        
        file_size = apk_path.stat().st_size
        logger.info(f"✅ Found APK file: {apk_path}")
        logger.info(f"   Size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
        
        # 2. Kiểm tra version_code đã tồn tại chưa
        logger.info(f"\n🔍 Checking if version {version_code} already exists...")
        existing = supabase.table("app_versions").select("id, version_name").eq("version_code", version_code).is_("deleted_at", "null").execute()
        
        if existing.data:
            logger.warning(f"⚠️  Version code {version_code} already exists!")
            logger.warning(f"   Existing version: {existing.data[0].get('version_name')}")
            logger.info(f"   Auto-updating existing version...")
            version_id = existing.data[0]["id"]
        else:
            version_id = None
            logger.info(f"✅ Version code {version_code} is new, will create new record")
        
        # 3. Upload lên Supabase Storage
        storage_path = f"app-version/v{version_name}/{apk_path.name}"
        logger.info(f"\n☁️  Uploading to Supabase Storage...")
        logger.info(f"   Storage path: {storage_path}")
        
        # Read file content
        with open(apk_path, "rb") as f:
            content = f.read()
        
        apk_file_url = None
        
        try:
            # Upload với application/octet-stream (generic binary)
            upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                storage_path,
                content,
                file_options={
                    "content-type": "application/octet-stream",
                    "upsert": "true"
                }
            )
            logger.info(f"✅ Upload successful!")
            
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
                
            except Exception as url_error:
                logger.warning(f"⚠️  Could not get public URL: {url_error}")
                # Construct URL manually
                supabase_url = settings.SUPABASE_URL
                apk_file_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{storage_path}"
                logger.info(f"   Using constructed URL: {apk_file_url}")
                
        except Exception as upload_error:
            error_msg = str(upload_error)
            if "Payload too large" in error_msg:
                logger.error(f"❌ File too large for Supabase Storage!")
                logger.error(f"   File size: {file_size / 1024 / 1024:.2f} MB")
                logger.error(f"   Please increase file size limit in Supabase Dashboard")
                logger.error(f"   Or use external storage (Google Drive, etc.)")
                return False
            elif "mime type" in error_msg.lower():
                logger.error(f"❌ MIME type not supported!")
                logger.error(f"   Please add 'application/octet-stream' to allowed MIME types")
                return False
            else:
                logger.error(f"❌ Upload failed: {upload_error}")
                return False
        
        # 4. Cập nhật hoặc tạo version trong database
        logger.info(f"\n💾 Updating database...")
        
        version_data = {
            "version_code": version_code,
            "version_name": version_name,
            "min_supported_version_code": min_supported_version_code,
            "update_required": update_required,
            "apk_file_path": storage_path,
            "apk_file_url": apk_file_url,
            "file_size": file_size,
            "release_notes": release_notes or f"Version {version_name} - New release",
            "is_active": True,  # Set as active version
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if version_id:
            # Update existing version
            update_result = supabase.table("app_versions").update(version_data).eq("id", version_id).execute()
            logger.info(f"✅ Updated version {version_code} ({version_name})")
        else:
            # Create new version
            version_data["created_at"] = datetime.utcnow().isoformat()
            insert_result = supabase.table("app_versions").insert(version_data).execute()
            logger.info(f"✅ Created new version {version_code} ({version_name})")
            version_id = insert_result.data[0]["id"] if insert_result.data else None
        
        # 5. Deactivate other versions (chỉ giữ 1 version active)
        logger.info(f"\n🔄 Deactivating other versions...")
        deactivate_result = supabase.table("app_versions").update({
            "is_active": False
        }).neq("version_code", version_code).is_("deleted_at", "null").execute()
        
        logger.info(f"✅ Deactivated {len(deactivate_result.data) if deactivate_result.data else 0} other version(s)")
        
        # 6. Hiển thị kết quả
        logger.info(f"\n" + "="*60)
        logger.info(f"✅ HOÀN TẤT!")
        logger.info(f"="*60)
        logger.info(f"📦 Version: {version_name} (Code: {version_code})")
        logger.info(f"📁 Storage Path: {storage_path}")
        logger.info(f"🔗 Download URL: {apk_file_url}")
        logger.info(f"📊 File Size: {file_size / 1024 / 1024:.2f} MB")
        logger.info(f"🟢 Status: ACTIVE")
        logger.info(f"\n💡 Version này sẽ là version mới nhất và được dùng để download")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Upload new APK and update version in database")
    parser.add_argument("--code", type=int, required=True, help="Version code (e.g., 2)")
    parser.add_argument("--name", type=str, required=True, help="Version name (e.g., '1.1')")
    parser.add_argument("--file", type=str, help="Path to APK file (optional, auto-detect if not provided)")
    parser.add_argument("--notes", type=str, help="Release notes")
    parser.add_argument("--min-supported", type=int, default=1, help="Minimum supported version code")
    parser.add_argument("--update-required", action="store_true", help="Is update required?")
    
    args = parser.parse_args()
    
    success = upload_new_apk_and_update_version(
        version_code=args.code,
        version_name=args.name,
        apk_file_path=args.file,
        release_notes=args.notes,
        min_supported_version_code=args.min_supported,
        update_required=args.update_required
    )
    
    sys.exit(0 if success else 1)

