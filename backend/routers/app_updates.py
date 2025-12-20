"""
App Updates Router - OTA (Over-The-Air) Update System
Handles version checking and APK file serving for Android app updates
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from typing import Optional
from pydantic import BaseModel
import os
from pathlib import Path

router = APIRouter()

# App version configuration
# Update these when releasing new versions
APP_VERSION_CODE = 1  # Increment for each release
APP_VERSION_NAME = "1.0"
APP_MIN_VERSION_CODE = 1  # Minimum supported version
APP_UPDATE_REQUIRED = False  # Set to True to force update
APP_UPDATE_URL = None  # Will be set to /api/app-updates/download if APK exists

# Path to APK file (should be in a secure location)
APK_DIR = Path(__file__).parent.parent.parent / "apk_releases"
APK_FILENAME = f"app-release-v{APP_VERSION_NAME}.apk"

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

@router.get("/check", response_model=AppVersionResponse)
async def check_app_version(
    current_version_code: int,
    current_version_name: Optional[str] = None
):
    """
    Check if app update is available
    Args:
        current_version_code: Current app version code from client
        current_version_name: Current app version name (optional)
    Returns:
        AppVersionResponse with update information
    """
    try:
        # Check if APK file exists
        apk_path = APK_DIR / APK_FILENAME
        download_url = None
        file_size = None
        
        if apk_path.exists():
            download_url = f"/api/app-updates/download"
            file_size = apk_path.stat().st_size
        
        # Determine if update is available
        update_available = current_version_code < APP_VERSION_CODE
        update_required = APP_UPDATE_REQUIRED or current_version_code < APP_MIN_VERSION_CODE
        
        return AppVersionResponse(
            current_version_code=current_version_code,
            current_version_name=current_version_name or "unknown",
            latest_version_code=APP_VERSION_CODE,
            latest_version_name=APP_VERSION_NAME,
            min_supported_version_code=APP_MIN_VERSION_CODE,
            update_available=update_available,
            update_required=update_required,
            download_url=download_url,
            release_notes=f"Version {APP_VERSION_NAME} - Bug fixes and improvements",
            file_size=file_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking app version: {str(e)}"
        )

@router.get("/download")
async def download_apk():
    """
    Download the latest APK file
    Returns:
        APK file for download
    """
    try:
        apk_path = APK_DIR / APK_FILENAME
        
        if not apk_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="APK file not found. Please contact administrator."
            )
        
        return FileResponse(
            path=str(apk_path),
            filename=APK_FILENAME,
            media_type="application/vnd.android.package-archive"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading APK: {str(e)}"
        )

@router.get("/info")
async def get_update_info():
    """
    Get update information (public endpoint, no auth required)
    Returns:
        Basic update information
    """
    return {
        "latest_version_code": APP_VERSION_CODE,
        "latest_version_name": APP_VERSION_NAME,
        "min_supported_version_code": APP_MIN_VERSION_CODE,
        "update_required": APP_UPDATE_REQUIRED
    }


