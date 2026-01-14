"""
Script để tạo thư mục app-version trong bucket chungminh để lưu file APK
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app_version_folder():
    """Tạo thư mục app-version trong bucket chungminh"""
    try:
        supabase = get_supabase_client()
        
        bucket_name = "minhchung_chiphi"  # Tên bucket (chungminh = minhchung_chiphi)
        folder_path = "app-version"  # Tên thư mục
        
        logger.info(f"📁 Creating folder '{folder_path}' in bucket '{bucket_name}'...")
        
        # Kiểm tra bucket có tồn tại không
        try:
            buckets = supabase.storage.list_buckets()
            bucket_exists = any(bucket.name == bucket_name for bucket in buckets)
            
            if not bucket_exists:
                logger.error(f"❌ Bucket '{bucket_name}' does not exist!")
                logger.info(f"Available buckets:")
                for bucket in buckets:
                    logger.info(f"   - {bucket.name}")
                return False
            
            logger.info(f"✅ Bucket '{bucket_name}' exists")
        except Exception as e:
            logger.warning(f"Could not list buckets: {e}")
            logger.info(f"Attempting to create folder anyway...")
        
        # Tạo thư mục bằng cách upload một file placeholder
        # Supabase Storage không có khái niệm "thư mục" riêng, 
        # nhưng có thể tạo bằng cách upload file với path chứa "/"
        placeholder_path = f"{folder_path}/.gitkeep"
        placeholder_content = b"# APK Storage Folder"
        
        try:
            # Upload placeholder file để tạo "thư mục"
            result = supabase.storage.from_(bucket_name).upload(
                placeholder_path,
                placeholder_content,
                file_options={
                    "content-type": "text/plain",
                    "upsert": "true"
                }
            )
            logger.info(f"✅ Created folder '{folder_path}' in bucket '{bucket_name}'")
            logger.info(f"   Placeholder file: {placeholder_path}")
            
            # List files trong thư mục để xác nhận
            try:
                files = supabase.storage.from_(bucket_name).list(folder_path)
                logger.info(f"📋 Files in '{folder_path}':")
                if files:
                    for file in files:
                        logger.info(f"   - {file.get('name', 'Unknown')}")
                else:
                    logger.info(f"   (empty folder)")
            except Exception as list_error:
                logger.warning(f"Could not list files: {list_error}")
            
            return True
            
        except Exception as upload_error:
            error_msg = str(upload_error)
            if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
                logger.error(f"❌ Bucket '{bucket_name}' not found!")
                logger.error(f"   Please create the bucket in Supabase Dashboard first")
            elif "permission" in error_msg.lower() or "forbidden" in error_msg.lower():
                logger.error(f"❌ Permission denied!")
                logger.error(f"   Please check RLS policies for bucket '{bucket_name}'")
            else:
                logger.error(f"❌ Error creating folder: {upload_error}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        return False

def check_bucket_structure():
    """Kiểm tra cấu trúc bucket"""
    try:
        supabase = get_supabase_client()
        bucket_name = "minhchung_chiphi"
        
        logger.info(f"\n🔍 Checking bucket structure...")
        logger.info(f"   Bucket: {bucket_name}")
        
        # List root files
        try:
            root_files = supabase.storage.from_(bucket_name).list()
            logger.info(f"\n📋 Root level files/folders:")
            if root_files:
                for item in root_files:
                    item_type = "📁 Folder" if item.get("id") else "📄 File"
                    logger.info(f"   {item_type}: {item.get('name', 'Unknown')}")
            else:
                logger.info(f"   (empty)")
        except Exception as e:
            logger.warning(f"Could not list root files: {e}")
        
        # Check app-version folder
        try:
            app_version_files = supabase.storage.from_(bucket_name).list("app-version")
            logger.info(f"\n📋 Files in 'app-version' folder:")
            if app_version_files:
                for file in app_version_files:
                    logger.info(f"   - {file.get('name', 'Unknown')}")
            else:
                logger.info(f"   (empty folder)")
        except Exception as e:
            logger.warning(f"Folder 'app-version' does not exist or cannot be accessed: {e}")
            
    except Exception as e:
        logger.error(f"Error checking bucket: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Create app-version folder in chungminh bucket")
    parser.add_argument("--check", action="store_true", help="Check bucket structure only")
    args = parser.parse_args()
    
    if args.check:
        check_bucket_structure()
    else:
        success = create_app_version_folder()
        if success:
            check_bucket_structure()
        sys.exit(0 if success else 1)

