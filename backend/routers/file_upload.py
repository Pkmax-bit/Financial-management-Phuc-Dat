"""
File Upload Router
Centralized endpoints for file/image uploads
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from services.file_upload_service import get_file_upload_service, FileUploadService
from models.user import User
from utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["File Upload"])

class UploadResponse(BaseModel):
    """Response model for file upload"""
    id: str
    name: str
    url: str
    type: str
    size: int
    uploaded_at: str
    path: str
    content_type: str

class MultipleUploadResponse(BaseModel):
    """Response model for multiple file uploads"""
    files: List[UploadResponse]
    errors: Optional[List[dict]] = None

@router.post("/{folder_path:path}", response_model=UploadResponse)
async def upload_file(
    folder_path: str,
    file: UploadFile = File(...),
    max_size: Optional[int] = Query(None, description="Maximum file size in bytes"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a single file to specified folder
    
    - **folder_path**: Folder path in storage (e.g., "Expenses", "Invoices", "Projects/{project_id}")
    - **file**: File to upload
    - **max_size**: Optional maximum file size override (default: 10MB)
    
    Examples:
    - `/api/uploads/Expenses` - Upload to Expenses folder
    - `/api/uploads/Invoices/INV-001` - Upload to Invoices/INV-001 folder
    - `/api/uploads/Projects/PROJ-123` - Upload to Projects/PROJ-123 folder
    """
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=folder_path,
            max_size=max_size
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/{folder_path:path}/multiple", response_model=MultipleUploadResponse)
async def upload_multiple_files(
    folder_path: str,
    files: List[UploadFile] = File(...),
    max_size: Optional[int] = Query(None, description="Maximum file size in bytes"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple files to specified folder
    
    - **folder_path**: Folder path in storage
    - **files**: List of files to upload
    - **max_size**: Optional maximum file size override
    """
    try:
        service = get_file_upload_service()
        results = await service.upload_multiple_files(
            files=files,
            folder_path=folder_path,
            max_size=max_size
        )
        return MultipleUploadResponse(files=[UploadResponse(**r) for r in results])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multiple upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/images/{folder_path:path}", response_model=UploadResponse)
async def upload_image(
    folder_path: str,
    file: UploadFile = File(...),
    max_size: Optional[int] = Query(None, description="Maximum file size in bytes"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image file (images only)
    
    - **folder_path**: Folder path in storage
    - **file**: Image file to upload (JPEG, PNG, GIF, WebP, SVG)
    - **max_size**: Optional maximum file size override
    """
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=folder_path,
            max_size=max_size,
            allowed_types=service.ALLOWED_IMAGE_TYPES
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.delete("/{folder_path:path}/{filename:path}")
async def delete_file(
    folder_path: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a file from storage
    
    - **folder_path**: Folder path in storage
    - **filename**: Filename to delete
    """
    try:
        file_path = f"{folder_path}/{filename}".strip('/')
        service = get_file_upload_service()
        success = await service.delete_file(file_path)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file"
            )
        
        return {"message": "File deleted successfully", "path": file_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )

# Convenience endpoints for common use cases

@router.post("/expenses/{expense_id}", response_model=UploadResponse)
async def upload_expense_receipt(
    expense_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload receipt for an expense"""
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Expenses/{expense_id}",
            allowed_types=service.ALLOWED_IMAGE_TYPES + ['application/pdf']
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Expense receipt upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/invoices/{invoice_id}", response_model=UploadResponse)
async def upload_invoice_attachment(
    invoice_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload attachment for an invoice"""
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Invoices/{invoice_id}"
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Invoice attachment upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/bills/{bill_id}", response_model=UploadResponse)
async def upload_bill_receipt(
    bill_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload receipt for a bill"""
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Bills/{bill_id}",
            allowed_types=service.ALLOWED_IMAGE_TYPES + ['application/pdf']
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bill receipt upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/projects/{project_id}/images", response_model=UploadResponse)
async def upload_project_image(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload image for a project"""
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Projects/{project_id}/Images",
            allowed_types=service.ALLOWED_IMAGE_TYPES
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project image upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/products/{product_id}/images", response_model=UploadResponse)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload image for a product/service"""
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Products/{product_id}/Images",
            allowed_types=service.ALLOWED_IMAGE_TYPES
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Product image upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/avatars/{entity_type}/{entity_id}", response_model=UploadResponse)
async def upload_avatar(
    entity_type: str,
    entity_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload avatar for an entity (employee, customer, vendor, etc.)
    
    - **entity_type**: Type of entity (employees, customers, vendors, etc.)
    - **entity_id**: ID of the entity
    """
    try:
        service = get_file_upload_service()
        result = await service.upload_file(
            file=file,
            folder_path=f"Avatars/{entity_type}/{entity_id}",
            allowed_types=service.ALLOWED_IMAGE_TYPES
        )
        return UploadResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

