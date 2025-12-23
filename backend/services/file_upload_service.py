"""
File Upload Service
Centralized service for handling file/image uploads to Supabase Storage
"""

import uuid
import os
import re
import unicodedata
from typing import Optional, List, Dict, Any
from fastapi import UploadFile, HTTPException, status
from datetime import datetime
from services.supabase_client import get_supabase_client
from config import settings
import logging

logger = logging.getLogger(__name__)

class FileUploadService:
    """Service for handling file uploads"""
    
    # Default allowed image types
    ALLOWED_IMAGE_TYPES = [
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/gif', 'image/webp', 'image/svg+xml'
    ]
    
    # Default allowed document types
    ALLOWED_DOCUMENT_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    # Default allowed types (images + documents)
    ALLOWED_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES
    
    def __init__(self, bucket_name: str = "minhchung_chiphi"):
        """Initialize file upload service
        
        Args:
            bucket_name: Supabase storage bucket name
        """
        self.bucket_name = bucket_name
        self.max_file_size = settings.MAX_FILE_SIZE  # Default 10MB from config
    
    def validate_file(
        self, 
        file: UploadFile, 
        max_size: Optional[int] = None,
        allowed_types: Optional[List[str]] = None
    ) -> bytes:
        """Validate uploaded file
        
        Args:
            file: UploadFile object
            max_size: Maximum file size in bytes (default: from config)
            allowed_types: List of allowed MIME types (default: all allowed types)
            
        Returns:
            File content as bytes
            
        Raises:
            HTTPException: If validation fails
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Read file content
        # Note: This needs to be done in the endpoint, not here
        # We'll validate after reading
        
        max_size = max_size or self.max_file_size
        allowed_types = allowed_types or self.ALLOWED_TYPES
        
        # Check file type
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file.content_type}' not supported. Allowed types: {', '.join(allowed_types)}"
            )
        
        return None  # Content will be read in endpoint
    
    async def upload_file(
        self,
        file: UploadFile,
        folder_path: str,
        max_size: Optional[int] = None,
        allowed_types: Optional[List[str]] = None,
        generate_unique_name: bool = True,
        custom_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload file to Supabase Storage
        
        Args:
            file: UploadFile object
            folder_path: Folder path in storage (e.g., "Expenses", "Invoices", "Projects/{project_id}")
            max_size: Maximum file size in bytes
            allowed_types: List of allowed MIME types
            generate_unique_name: Whether to generate unique filename
            
        Returns:
            Dictionary with file information:
            {
                "id": str,
                "name": str,
                "url": str,
                "type": str,  # "image" or "document"
                "size": int,
                "uploaded_at": str,
                "path": str
            }
            
        Raises:
            HTTPException: If upload fails
        """
        try:
            # Validate file
            if not file.filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No file provided"
                )
            
            # Read file content
            content = await file.read()
            
            # Check file size
            max_size = max_size or self.max_file_size
            if len(content) > max_size:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File size ({len(content)} bytes) exceeds maximum allowed size ({max_size} bytes)"
                )
            
            # Check file type
            allowed_types = allowed_types or self.ALLOWED_TYPES
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type '{file.content_type}' not supported. Allowed types: {', '.join(allowed_types)}"
                )
            
            # Tách tên gốc để có thể tự tạo 'tenfile(2).pdf' nếu trùng
            original_name = custom_filename or file.filename
            if '.' in original_name:
                base_name = '.'.join(original_name.split('.')[:-1])
                file_ext = '.' + original_name.split('.')[-1]
            else:
                base_name = original_name
                file_ext = ''
            # Sanitize base name for Supabase Storage
            # Supabase Storage doesn't accept Unicode characters (Vietnamese) and spaces in keys
            # Convert Vietnamese to ASCII (remove diacritics) and replace spaces with underscores
            if custom_filename:
                # Normalize Unicode: convert Vietnamese characters to ASCII (remove diacritics)
                normalized_name = unicodedata.normalize('NFD', base_name)
                # Remove diacritical marks (combining characters)
                ascii_name = ''.join(c for c in normalized_name if unicodedata.category(c) != 'Mn')
                # Handle special Vietnamese characters: đ -> d, Đ -> D
                ascii_name = ascii_name.replace('đ', 'd').replace('Đ', 'D')
                
                # Replace spaces with underscores and remove invalid characters: / \ : * ? " < > | %
                # Also remove % which can cause issues in URLs
                base_name = ascii_name.replace(' ', '_')
                base_name = re.sub(r'[<>:"/\\|?*%]', '_', base_name)
                # Remove multiple consecutive underscores
                base_name = re.sub(r'_+', '_', base_name).strip('_')
            else:
                # For auto-generated names, replace spaces and slashes
                base_name = base_name.replace(' ', '_').replace('/', '_').replace('\\', '_')

            # Nếu generate_unique_name=True thì vẫn ưu tiên UUID để tránh trùng tuyệt đối
            if generate_unique_name and not custom_filename:
                unique_filename = f"{uuid.uuid4()}{file_ext}" if file_ext else str(uuid.uuid4())
                base_name = unique_filename.rsplit('.', 1)[0]

            supabase = get_supabase_client()
            upload_result = None
            public_url = None
            error_msg = None

            # Thử nhiều lần với hậu tố (2), (3), ... khi gặp lỗi Duplicate
            for attempt in range(5):
                suffix = "" if attempt == 0 else f"({attempt + 1})"
                candidate_filename = f"{base_name}{suffix}{file_ext}"
                file_path = f"{folder_path}/{candidate_filename}".strip('/')

                try:
                    # Strategy 1: Upload với content-type gốc, cho phép upsert
                    try:
                        upload_result = supabase.storage.from_(self.bucket_name).upload(
                            file_path,
                            content,
                            file_options={
                                "content-type": file.content_type,
                                "upsert": "false"
                            }
                        )
                        # Check for errors - handle both dict and object responses
                        if isinstance(upload_result, dict):
                            if upload_result.get('error'):
                                raise Exception(str(upload_result.get('error')))
                        elif hasattr(upload_result, 'error') and upload_result.error:
                            raise Exception(str(upload_result.error))
                        # If no error, consider it successful
                    except Exception as e1:
                        logger.warning(f"Upload with content-type failed (attempt {attempt}, name={candidate_filename}): {e1}")
                        
                        # Strategy 2: Không truyền content-type
                        try:
                            upload_result = supabase.storage.from_(self.bucket_name).upload(
                                file_path,
                                content,
                                file_options={
                                    "upsert": "false"
                                }
                            )
                            # Check for errors - handle both dict and object responses
                            if isinstance(upload_result, dict):
                                if upload_result.get('error'):
                                    raise Exception(str(upload_result.get('error')))
                            elif hasattr(upload_result, 'error') and upload_result.error:
                                raise Exception(str(upload_result.error))
                            logger.info(f"Uploaded {file.content_type} without content-type option as workaround")
                        except Exception as e2:
                            logger.warning(f"Upload without content-type failed (attempt {attempt}, name={candidate_filename}): {e2}")
                            
                            # Strategy 3: Dùng application/octet-stream
                            restricted_types = [
                                "application/pdf",
                                "text/plain",
                                "text/html",
                                "text/csv",
                                "application/msword",
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "application/vnd.ms-excel",
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "application/vnd.ms-powerpoint",
                                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            ]
                            error_str = str(e1).lower() + " " + str(e2).lower()
                            if file.content_type in restricted_types or "mime type" in error_str or "not supported" in error_str:
                                try:
                                    upload_result = supabase.storage.from_(self.bucket_name).upload(
                                        file_path,
                                        content,
                                        file_options={
                                            "content-type": "application/octet-stream",
                                            "upsert": "false"
                                        }
                                    )
                                    # Check for errors - handle both dict and object responses
                                    if isinstance(upload_result, dict):
                                        if upload_result.get('error'):
                                            raise Exception(str(upload_result.get('error')))
                                    elif hasattr(upload_result, 'error') and upload_result.error:
                                        raise Exception(str(upload_result.error))
                                    logger.info(f"Uploaded {file.content_type} with generic content-type (application/octet-stream) as workaround")
                                except Exception as e3:
                                    logger.warning(f"Upload with application/octet-stream also failed (attempt {attempt}, name={candidate_filename}): {e3}")
                                    error_msg = str(e3)
                            else:
                                error_msg = str(e2)

                    # Nếu tới đây không có lỗi, thoát vòng lặp
                    if not error_msg:
                        public_url = self._get_public_url(file_path)
                        original_name_to_return = candidate_filename
                        break

                    # Nếu lỗi là Duplicate, thử tên khác với hậu tố (2), (3)...
                    if "duplicate" in error_msg.lower() or "already exists" in error_msg.lower():
                        logger.info(f"File exists, retrying with new name: {candidate_filename}")
                        error_msg = None
                        continue

                    # Các lỗi khác: dừng luôn
                    break

                except HTTPException:
                    raise
                except Exception as upload_error:
                    logger.error(f"Upload error (attempt {attempt}, name={candidate_filename}): {str(upload_error)}")
                    error_msg = str(upload_error)
                    break

            # Sau khi thử hết mà vẫn không upload được
            if not public_url:
                if error_msg:
                    error_lower = error_msg.lower()
                    if "mime type" in error_lower or "not supported" in error_lower or "invalidrequest" in error_lower:
                        # Giữ nguyên đoạn hướng dẫn cấu hình bucket như cũ
                        failed_types = [file.content_type]
                        detail_msg = f"Không thể upload file: Loại file '{file.content_type}' không được phép bởi cấu hình Supabase Storage bucket."
                        detail_msg += f"\n\n📋 CÁCH KHẮC PHỤC (BẮT BUỘC):"
                        detail_msg += f"\n\n1️⃣ Vào Supabase Dashboard:"
                        detail_msg += f"\n   https://supabase.com/dashboard -> Chọn project -> Storage -> Buckets -> 'minhchung_chiphi'"
                        detail_msg += f"\n\n2️⃣ Vào tab 'Settings' (KHÔNG phải Policies)"
                        detail_msg += f"\n\n3️⃣ Tìm phần 'File type restrictions' hoặc 'Allowed MIME types'"
                        detail_msg += f"\n\n4️⃣ Chọn một trong hai cách:"
                        detail_msg += f"\n   ✅ CÁCH A (Khuyến nghị cho Development):"
                        detail_msg += f"\n      - Xóa TẤT CẢ MIME types trong danh sách (để trống)"
                        detail_msg += f"\n      - Hoặc tắt 'Restrict file types'"
                        detail_msg += f"\n      - Click 'Save'"
                        detail_msg += f"\n\n   ✅ CÁCH B (Cho Production):"
                        detail_msg += f"\n      - Thêm các MIME types sau vào danh sách (mỗi dòng một type):"
                        for mime_type in failed_types:
                            detail_msg += f"\n         {mime_type}"
                        detail_msg += f"\n         application/octet-stream"
                        detail_msg += f"\n         image/jpeg"
                        detail_msg += f"\n         image/png"
                        detail_msg += f"\n\n5️⃣ Sau khi lưu, thử upload lại file"
                        detail_msg += f"\n\n⚠️ LƯU Ý: MIME type restrictions được cấu hình trong Dashboard, KHÔNG thể thay đổi qua SQL!"
                        
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=detail_msg
                        )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Upload failed: {error_msg or 'Unknown error'}"
                )
            
            if not public_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to get public URL"
                )
            
            # Determine file type
            file_type = "image" if file.content_type.startswith("image/") else "document"
            
            # Return file information
            return {
                "id": str(uuid.uuid4()),
                "name": file.filename,
                "url": public_url,
                "type": file_type,
                "size": len(content),
                "uploaded_at": datetime.now().isoformat(),
                "path": file_path,
                "content_type": file.content_type
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
    
    def _get_public_url(self, file_path: str) -> Optional[str]:
        """Get public URL for uploaded file
        
        Args:
            file_path: Path to file in storage
            
        Returns:
            Public URL or None if failed
        """
        try:
            supabase = get_supabase_client()
            public_url_result = supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            
            # Try different ways to get public URL
            if hasattr(public_url_result, 'public_url'):
                return public_url_result.public_url
            elif hasattr(public_url_result, 'get'):
                return public_url_result.get("publicUrl")
            elif isinstance(public_url_result, dict):
                return public_url_result.get("publicUrl")
            elif isinstance(public_url_result, str):
                return public_url_result
            else:
                # Fallback: construct URL manually
                supabase_url = settings.SUPABASE_URL
                if supabase_url:
                    return f"{supabase_url}/storage/v1/object/public/{self.bucket_name}/{file_path}"
                
        except Exception as e:
            logger.warning(f"Error getting public URL: {e}")
            # Fallback: construct URL manually
            supabase_url = settings.SUPABASE_URL
            if supabase_url:
                return f"{supabase_url}/storage/v1/object/public/{self.bucket_name}/{file_path}"
        
        return None
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Supabase Storage
        
        Args:
            file_path: Path to file in storage
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            supabase = get_supabase_client()
            result = supabase.storage.from_(self.bucket_name).remove([file_path])
            
            # Check for errors
            if hasattr(result, 'error') and result.error:
                logger.error(f"Delete error: {result.error}")
                return False
            
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False
    
    async def upload_multiple_files(
        self,
        files: List[UploadFile],
        folder_path: str,
        max_size: Optional[int] = None,
        allowed_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Upload multiple files
        
        Args:
            files: List of UploadFile objects
            folder_path: Folder path in storage
            max_size: Maximum file size in bytes
            allowed_types: List of allowed MIME types
            
        Returns:
            List of file information dictionaries
        """
        results = []
        errors = []
        
        for file in files:
            try:
                result = await self.upload_file(
                    file=file,
                    folder_path=folder_path,
                    max_size=max_size,
                    allowed_types=allowed_types
                )
                results.append(result)
            except Exception as e:
                errors.append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        if errors and not results:
            # All files failed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"All files failed to upload: {errors}"
            )
        
        return results

# Global instance
file_upload_service = FileUploadService()

def get_file_upload_service(bucket_name: Optional[str] = None) -> FileUploadService:
    """Get file upload service instance"""
    if bucket_name:
        return FileUploadService(bucket_name=bucket_name)
    return file_upload_service

