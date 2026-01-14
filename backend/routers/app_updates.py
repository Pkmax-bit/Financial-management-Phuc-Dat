"""
App Updates Router - OTA (Over-The-Air) Update System
Handles version checking and APK file serving for Android app updates
Now uses Supabase database to store version information
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse, RedirectResponse
from typing import Optional, List
from pydantic import BaseModel
import os
from pathlib import Path
from datetime import datetime
import logging
from services.supabase_client import get_supabase_client
from utils.auth import get_current_user, require_admin
from models.user import User
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Path to APK file (should be in a secure location)
APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
APK_DIR.mkdir(parents=True, exist_ok=True)  # Create directory if not exists

class AppVersionResponse(BaseModel):
    """Response model for app version check"""
    current_version_code: int
    current_version_name: str
    latest_version_code: int
    latest_version_name: str
    min_supported_version_code: int
    update_available: bool
    update_required: bool
    download_url: Optional[str] = None
    release_notes: Optional[str] = None
    file_size: Optional[int] = None


class UpdateDownloadUrlRequest(BaseModel):
    """Request model to update download URL (e.g. Google Drive link) for latest version"""
    download_url: str

@router.get("/check", response_model=AppVersionResponse)
async def check_app_version(
    current_version_code: int,
    current_version_name: Optional[str] = None,
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Check if app update is available
    Reads from Supabase database for version information
    Args:
        current_version_code: Current app version code from client
        current_version_name: Current app version name (optional)
    Returns:
        AppVersionResponse with update information
    """
    try:
        # Get latest active version from database
        response = supabase.table("app_versions").select("*").eq("is_active", True).is_("deleted_at", "null").order("version_code", desc=True).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            # Fallback to hardcoded values if no version in database
            logger.warning("No active version found in database, using fallback")
            return AppVersionResponse(
                current_version_code=current_version_code,
                current_version_name=current_version_name or "unknown",
                latest_version_code=1,
                latest_version_name="1.0",
                min_supported_version_code=1,
                update_available=False,
                update_required=False,
                download_url=None,
                release_notes="No version information available",
                file_size=None
            )
        
        latest_version = response.data[0]
        latest_version_code = latest_version["version_code"]
        latest_version_name = latest_version["version_name"]
        min_supported_version_code = latest_version["min_supported_version_code"]
        update_required = latest_version["update_required"]
        release_notes = latest_version.get("release_notes") or f"Version {latest_version_name}"
        file_size = latest_version.get("file_size")
        
        # Determine download URL
        download_url = None
        if latest_version.get("apk_file_url"):
            download_url = latest_version["apk_file_url"]
        elif latest_version.get("apk_file_path"):
            # If stored in Supabase Storage, construct URL
            download_url = f"/api/app-updates/download/{latest_version_code}"
        else:
            # Fallback to local file
            apk_filename = f"app-release-v{latest_version_name}.apk"
            apk_path = APK_DIR / apk_filename
            if apk_path.exists():
                download_url = f"/api/app-updates/download/{latest_version_code}"
                if not file_size:
                    file_size = apk_path.stat().st_size
        
        # Determine if update is available
        update_available = current_version_code < latest_version_code
        update_required = update_required or current_version_code < min_supported_version_code
        
        return AppVersionResponse(
            current_version_code=current_version_code,
            current_version_name=current_version_name or "unknown",
            latest_version_code=latest_version_code,
            latest_version_name=latest_version_name,
            min_supported_version_code=min_supported_version_code,
            update_available=update_available,
            update_required=update_required,
            download_url=download_url,
            release_notes=release_notes,
            file_size=file_size
        )
    except Exception as e:
        logger.error(f"Error checking app version: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking app version: {str(e)}"
        )

@router.get("/download")
@router.get("/download/{version_code}")
async def download_apk(
    version_code: Optional[int] = None,
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Download APK file
    If version_code is provided, download that specific version
    Otherwise, download the latest active version
    Returns:
        APK file for download
    """
    try:
        logger.info(f"Download APK request - version_code: {version_code}")
        
        # Get version from database
        if version_code:
            logger.info(f"Fetching version {version_code} from database...")
            response = supabase.table("app_versions").select("*").eq("version_code", version_code).is_("deleted_at", "null").single().execute()
            if not response.data:
                logger.error(f"Version {version_code} not found in database")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Version {version_code} not found"
                )
            version = response.data
            logger.info(f"Found version: {version.get('version_name')} (code: {version.get('version_code')})")
        else:
            # Get latest active version
            logger.info("Fetching latest active version from database...")
            response = supabase.table("app_versions").select("*").eq("is_active", True).is_("deleted_at", "null").order("version_code", desc=True).limit(1).execute()
            if not response.data or len(response.data) == 0:
                logger.error("No active version found in database")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active version found"
                )
            version = response.data[0]
            logger.info(f"Found latest version: {version.get('version_name')} (code: {version.get('version_code')})")
        
        version_name = version["version_name"]
        apk_filename = f"app-release-v{version_name}.apk"
        apk_path = APK_DIR / apk_filename
        
        logger.info(f"Looking for APK file at: {apk_path}")
        logger.info(f"APK_DIR: {APK_DIR}")
        logger.info(f"File exists: {apk_path.exists()}")
        
        # Check if file exists locally
        if not apk_path.exists():
            logger.warning(f"Local APK file not found at: {apk_path}")
            
            # Try to get file from Supabase Storage if apk_file_path exists
            apk_file_path = version.get("apk_file_path")
            if apk_file_path and ("app-version" in apk_file_path or "app-versions" in apk_file_path):
                # File is in Supabase Storage
                try:
                    logger.info(f"Attempting to download from Supabase Storage: {apk_file_path}")
                    # Normalize path (support both app-version and app-versions for backward compatibility)
                    storage_path = apk_file_path
                    if storage_path.startswith("app-versions/"):
                        storage_path = storage_path.replace("app-versions/", "app-version/", 1)
                    
                    # Download file from Supabase Storage
                    file_data = supabase.storage.from_("minhchung_chiphi").download(storage_path)
                    
                    if file_data:
                        logger.info(f"Successfully downloaded from Supabase Storage")
                        # Increment download count
                        try:
                            supabase.table("app_versions").update({
                                "download_count": (version.get("download_count") or 0) + 1
                            }).eq("id", version["id"]).execute()
                        except Exception as e:
                            logger.warning(f"Failed to update download count: {e}")
                        
                        # Return file as response
                        from fastapi.responses import Response
                        return Response(
                            content=file_data,
                            media_type="application/vnd.android.package-archive",
                            headers={
                                "Content-Disposition": f'attachment; filename="{apk_filename}"'
                            }
                        )
                except Exception as storage_error:
                    logger.warning(f"Failed to download from Supabase Storage: {storage_error}")
                    # Fall through to try apk_file_url
            
            # Try to redirect to apk_file_url if available
            apk_file_url = version.get("apk_file_url")
            if apk_file_url:
                # Check if it's a backend endpoint (circular reference)
                if "/api/app-updates/download" in apk_file_url:
                    logger.error(f"Circular reference detected: apk_file_url points to download endpoint")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="APK file configuration error. Please contact administrator."
                    )
                
                if not apk_file_url.startswith("http"):
                    # If it's a relative path, construct full URL
                    backend_url = getattr(settings, 'BACKEND_URL', None) or os.getenv("BACKEND_URL", "https://financial-management-backend-3m78.onrender.com")
                    apk_file_url = f"{backend_url}{apk_file_url}" if apk_file_url.startswith("/") else f"{backend_url}/{apk_file_url}"
                
                if apk_file_url.startswith("http"):
                    logger.info(f"Redirecting to external URL: {apk_file_url}")
                    return RedirectResponse(url=apk_file_url, status_code=302)
            
            logger.error(f"APK file not found locally, in Supabase Storage, and no valid apk_file_url")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"APK file not found for version {version_name}. Please contact administrator."
            )
        
        logger.info(f"APK file found, preparing to serve: {apk_filename}")
        
        # Increment download count
        try:
            supabase.table("app_versions").update({
                "download_count": (version.get("download_count") or 0) + 1
            }).eq("id", version["id"]).execute()
        except Exception as e:
            logger.warning(f"Failed to update download count: {e}")
        
        return FileResponse(
            path=str(apk_path),
            filename=apk_filename,
            media_type="application/vnd.android.package-archive"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading APK: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading APK: {str(e)}"
        )

class AppVersionCreate(BaseModel):
    """Model for creating/updating app version"""
    version_code: int
    version_name: str
    min_supported_version_code: Optional[int] = 1
    update_required: Optional[bool] = False
    apk_file_url: Optional[str] = None
    release_notes: Optional[str] = None
    changelog: Optional[str] = None
    is_active: Optional[bool] = True

class AppVersionInfo(BaseModel):
    """Model for app version information"""
    id: str
    version_code: int
    version_name: str
    min_supported_version_code: int
    update_required: bool
    apk_file_path: Optional[str] = None
    apk_file_url: Optional[str] = None
    file_size: Optional[int] = None
    release_notes: Optional[str] = None
    changelog: Optional[str] = None
    is_active: bool
    download_count: int
    created_at: str
    updated_at: str

@router.get("/latest")
async def get_latest_version(
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Get latest app version information (for frontend download page)
    Returns:
        Latest version info with download URL
    """
    try:
        # Get latest active version from database
        response = supabase.table("app_versions").select("*").eq("is_active", True).is_("deleted_at", "null").order("version_code", desc=True).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            # Fallback to hardcoded values
            logger.warning("No active version found in database, using fallback")
            return {
                "version_code": 1,
                "version_name": "1.0",
                "download_url": None,
                "file_size": None,
                "release_notes": "No version information available"
            }
        
        latest_version = response.data[0]
        version_code = latest_version["version_code"]
        version_name = latest_version["version_name"]
        release_notes = latest_version.get("release_notes") or f"Version {version_name}"
        file_size = latest_version.get("file_size")
        
        # Determine download URL (prioritize apk_file_url)
        download_url = None
        if latest_version.get("apk_file_url"):
            # Use URL from database (could be external URL or backend endpoint)
            download_url = latest_version["apk_file_url"]
            logger.info(f"Using apk_file_url from database: {download_url}")
        elif latest_version.get("apk_file_path"):
            # If stored locally, construct full backend API endpoint URL
            backend_url = getattr(settings, 'BACKEND_URL', None) or os.getenv("BACKEND_URL", "https://financial-management-backend-3m78.onrender.com")
            download_url = f"{backend_url}/api/app-updates/download/{version_code}"
            logger.info(f"Using apk_file_path from database, constructing full API URL: {download_url}")
        else:
            # Fallback to local file via API
            apk_filename = f"app-release-v{version_name}.apk"
            apk_path = APK_DIR / apk_filename
            if apk_path.exists():
                backend_url = getattr(settings, 'BACKEND_URL', None) or os.getenv("BACKEND_URL", "https://financial-management-backend-3m78.onrender.com")
                download_url = f"{backend_url}/api/app-updates/download/{version_code}"
                logger.info(f"Using local file, constructing full API URL: {download_url}")
                if not file_size:
                    file_size = apk_path.stat().st_size
            else:
                logger.warning(f"No download URL found for version {version_name}. apk_file_url, apk_file_path, and local file all missing.")
        
        return {
            "version_code": version_code,
            "version_name": version_name,
            "download_url": download_url,
            "file_size": file_size,
            "release_notes": release_notes
        }
    except Exception as e:
        logger.error(f"Error getting latest version: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting latest version: {str(e)}"
        )

@router.get("/info")
async def get_update_info(
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Get update information (public endpoint, no auth required)
    Returns:
        Basic update information from database
    """
    try:
        response = supabase.table("app_versions").select("*").eq("is_active", True).is_("deleted_at", "null").order("version_code", desc=True).limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            return {
                "latest_version_code": 1,
                "latest_version_name": "1.0",
                "min_supported_version_code": 1,
                "update_required": False
            }
        
        version = response.data[0]
        return {
            "latest_version_code": version["version_code"],
            "latest_version_name": version["version_name"],
            "min_supported_version_code": version["min_supported_version_code"],
            "update_required": version["update_required"]
        }
    except Exception as e:
        logger.error(f"Error getting update info: {str(e)}", exc_info=True)
        return {
            "latest_version_code": 1,
            "latest_version_name": "1.0",
            "min_supported_version_code": 1,
            "update_required": False
        }


@router.put("/latest/download-url")
async def update_latest_download_url(
    payload: UpdateDownloadUrlRequest,
    current_user: User = Depends(get_current_user),
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Cập nhật download URL (ví dụ: Google Drive link) cho phiên bản app đang active mới nhất.
    Chỉ admin mới được phép gọi.
    """
    require_admin(current_user)

    try:
        # Lấy phiên bản đang active mới nhất
        response = (
            supabase.table("app_versions")
            .select("*")
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .order("version_code", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active app version found to update",
            )

        latest_version = response.data[0]

        # Cập nhật apk_file_url với link mới, bỏ apk_file_path (vì dùng external URL)
        update_data = {
            "apk_file_url": payload.download_url,
            "apk_file_path": None,
            "updated_at": datetime.utcnow().isoformat(),
        }

        update_response = (
            supabase.table("app_versions")
            .update(update_data)
            .eq("id", latest_version["id"])
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update download URL for latest version",
            )

        updated_version = update_response.data[0]

        return {
            "message": "Download URL updated successfully",
            "version": updated_version,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating latest download URL: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating latest download URL: {str(e)}",
        )

@router.get("/versions", response_model=List[AppVersionInfo])
async def list_versions(
    current_user: User = Depends(get_current_user),
    supabase: Optional = Depends(get_supabase_client)
):
    """
    List all app versions (admin only)
    Returns:
        List of all app versions
    """
    require_admin(current_user)
    
    try:
        response = supabase.table("app_versions").select("*").is_("deleted_at", "null").order("version_code", desc=True).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error listing versions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing versions: {str(e)}"
        )

@router.post("/versions", response_model=AppVersionInfo)
async def create_version(
    version_data: AppVersionCreate,
    current_user: User = Depends(get_current_user),
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Create a new app version (admin only)
    Returns:
        Created app version
    """
    require_admin(current_user)
    
    try:
        # Check if version_code already exists
        existing = supabase.table("app_versions").select("id").eq("version_code", version_data.version_code).is_("deleted_at", "null").execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Version code {version_data.version_code} already exists"
            )
        
        # Create version record
        version_record = {
            "version_code": version_data.version_code,
            "version_name": version_data.version_name,
            "min_supported_version_code": version_data.min_supported_version_code or 1,
            "update_required": version_data.update_required or False,
            "apk_file_url": version_data.apk_file_url,
            "release_notes": version_data.release_notes,
            "changelog": version_data.changelog,
            "is_active": version_data.is_active if version_data.is_active is not None else True,
            "created_by": current_user.id
        }
        
        response = supabase.table("app_versions").insert(version_record).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create version"
            )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating version: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating version: {str(e)}"
        )

@router.post("/versions/{version_code}/upload")
async def upload_apk(
    version_code: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    supabase: Optional = Depends(get_supabase_client)
):
    """
    Upload APK file for a version (admin only)
    Returns:
        Updated version with file information
    """
    require_admin(current_user)
    
    try:
        # Verify file is APK
        if not file.filename.endswith('.apk'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an APK file"
            )
        
        # Get version from database
        version_response = supabase.table("app_versions").select("*").eq("version_code", version_code).is_("deleted_at", "null").single().execute()
        if not version_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version {version_code} not found"
            )
        
        version = version_response.data
        version_name = version["version_name"]
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Save APK file locally (backup)
        apk_filename = f"app-release-v{version_name}.apk"
        apk_path = APK_DIR / apk_filename
        
        with open(apk_path, "wb") as f:
            f.write(content)
        
        # Upload to Supabase Storage
        storage_path = f"app-version/v{version_name}/{apk_filename}"
        apk_file_url = None
        
        try:
            # Upload to Supabase Storage bucket
            # Try with APK MIME type first, fallback to generic binary if not allowed
            try:
                upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                    storage_path,
                    content,
                    file_options={
                        "content-type": "application/vnd.android.package-archive",
                        "upsert": "true"
                    }
                )
            except Exception as mime_error:
                logger.warning(f"Upload with APK MIME type failed: {mime_error}. Retrying with application/octet-stream...")
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
                if supabase_url:
                    apk_file_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{storage_path}"
            
            logger.info(f"APK uploaded to Supabase Storage: {apk_file_url}")
        except Exception as storage_error:
            logger.warning(f"Failed to upload APK to Supabase Storage: {storage_error}. File saved locally only.")
            # Continue with local file only
        
        # Check how many versions have APK files
        versions_with_files = supabase.table("app_versions").select("id, version_code, apk_file_path").is_("deleted_at", "null").not_.is_("apk_file_path", "null").execute()
        
        # If we have more than 3 versions with APK files, delete the oldest one
        if versions_with_files.data and len(versions_with_files.data) >= 3:
            # Get the oldest version with an APK file (excluding the one we're uploading)
            old_versions = [v for v in versions_with_files.data if v["id"] != version["id"]]
            if old_versions:
                # Sort by version_code ascending to get oldest
                old_versions.sort(key=lambda x: x["version_code"])
                oldest_version = old_versions[0]
                
                # Delete the physical APK file if it exists
                if oldest_version.get("apk_file_path"):
                    old_apk_path = APK_DIR / Path(oldest_version["apk_file_path"]).name
                    if old_apk_path.exists():
                        try:
                            old_apk_path.unlink()
                            logger.info(f"Deleted old APK file: {old_apk_path}")
                        except Exception as e:
                            logger.warning(f"Failed to delete old APK file {old_apk_path}: {e}")
                
                # Clear the APK file path in database (but keep the version record)
                supabase.table("app_versions").update({
                    "apk_file_path": None,
                    "file_size": None
                }).eq("id", oldest_version["id"]).execute()
                logger.info(f"Cleared APK file reference for version {oldest_version['version_code']} (kept version record)")
        
        # Update version record with file information
        update_data = {
            "apk_file_path": f"apk_releases/{apk_filename}",
            "apk_file_url": apk_file_url,  # URL from Supabase Storage
            "file_size": file_size,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("app_versions").update(update_data).eq("id", version["id"]).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update version"
            )
        
        return {
            "message": "APK uploaded successfully",
            "version": response.data[0],
            "file_path": str(apk_path),
            "file_size": file_size,
            "note": "Old APK files are automatically cleaned up (keeps only 3 newest)"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading APK: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading APK: {str(e)}"
        )


