"""
File Management Router
Handles file upload, storage, Excel import/export, and document management
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import uuid
import os
import pandas as pd
from io import BytesIO
import mimetypes

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

class FileInfo(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    file_path: str
    uploaded_by: str
    uploaded_at: datetime
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    mime_type: str
    file_path: str
    message: str

# Allowed file types
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    'archive': ['.zip', '.rar', '.7z', '.tar', '.gz'],
    'other': ['.csv', '.json', '.xml']
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_file_type(filename: str) -> str:
    """Determine file type based on extension"""
    ext = os.path.splitext(filename)[1].lower()
    
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    
    return 'other'

def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    ext = os.path.splitext(filename)[1].lower()
    all_extensions = []
    for extensions in ALLOWED_EXTENSIONS.values():
        all_extensions.extend(extensions)
    return ext in all_extensions

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Upload a file to the system"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed"
            )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed size (50MB)"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{file_id}{file_extension}"
        
        # Determine file type
        file_type = get_file_type(file.filename)
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        
        # Store file in Supabase Storage
        supabase = get_supabase_client()
        
        # Create folder structure: files/{file_type}/{year}/{month}/
        now = datetime.utcnow()
        folder_path = f"files/{file_type}/{now.year}/{now.month:02d}"
        file_path = f"{folder_path}/{unique_filename}"
        
        # Upload to Supabase Storage
        upload_result = supabase.storage.from_("files").upload(
            file_path,
            content,
            file_options={"content-type": mime_type}
        )
        
        if upload_result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {upload_result['error']}"
            )
        
        # Save file metadata to database
        file_tags = tags.split(',') if tags else []
        
        file_record = {
            "id": file_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_size": file_size,
            "mime_type": mime_type,
            "file_path": file_path,
            "uploaded_by": current_user.id,
            "uploaded_at": now.isoformat(),
            "description": description,
            "tags": file_tags
        }
        
        db_result = supabase.table("files").insert(file_record).execute()
        
        if not db_result.data:
            # Clean up uploaded file if database insert fails
            supabase.storage.from_("files").remove([file_path])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file metadata"
            )
        
        return FileUploadResponse(
            file_id=file_id,
            filename=unique_filename,
            file_size=file_size,
            mime_type=mime_type,
            file_path=file_path,
            message="File uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/files", response_model=List[FileInfo])
async def get_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    file_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get list of uploaded files"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("files").select("*")
        
        # Apply filters
        if file_type:
            # Filter by file extension
            extensions = ALLOWED_EXTENSIONS.get(file_type, [])
            if extensions:
                # This is a simplified filter - in production, you might want to store file_type in DB
                pass
        
        if search:
            query = query.or_(f"original_filename.ilike.%{search}%,description.ilike.%{search}%")
        
        result = query.order("uploaded_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [FileInfo(**file) for file in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch files: {str(e)}"
        )

@router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file"""
    try:
        supabase = get_supabase_client()
        
        # Get file metadata
        file_result = supabase.table("files").select("*").eq("id", file_id).single().execute()
        
        if not file_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        file_info = file_result.data
        
        # Download file from storage
        download_result = supabase.storage.from_("files").download(file_info["file_path"])
        
        if download_result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file: {download_result['error']}"
            )
        
        # Return file as response
        return Response(
            content=download_result,
            media_type=file_info["mime_type"],
            headers={
                "Content-Disposition": f"attachment; filename={file_info['original_filename']}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a file"""
    try:
        supabase = get_supabase_client()
        
        # Get file metadata
        file_result = supabase.table("files").select("*").eq("id", file_id).single().execute()
        
        if not file_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        file_info = file_result.data
        
        # Delete from storage
        delete_result = supabase.storage.from_("files").remove([file_info["file_path"]])
        
        if delete_result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file from storage: {delete_result['error']}"
            )
        
        # Delete from database
        db_result = supabase.table("files").delete().eq("id", file_id).execute()
        
        if not db_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file metadata"
            )
        
        return {"message": "File deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

@router.post("/import/employees")
async def import_employees(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager_or_admin)
):
    """Import employees from Excel file"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only Excel files (.xlsx, .xls) are allowed"
            )
        
        # Read Excel file
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        
        # Validate required columns
        required_columns = ['first_name', 'last_name', 'email', 'phone', 'department_id', 'position_id', 'hire_date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        supabase = get_supabase_client()
        
        # Process each row
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Generate employee code
                employee_code = f"EMP{str(uuid.uuid4())[:8].upper()}"
                
                employee_data = {
                    "id": str(uuid.uuid4()),
                    "employee_code": employee_code,
                    "first_name": str(row['first_name']).strip(),
                    "last_name": str(row['last_name']).strip(),
                    "email": str(row['email']).strip(),
                    "phone": str(row['phone']).strip(),
                    "department_id": str(row['department_id']).strip(),
                    "position_id": str(row['position_id']).strip(),
                    "hire_date": pd.to_datetime(row['hire_date']).isoformat(),
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Add optional fields if present
                if 'address' in df.columns and pd.notna(row['address']):
                    employee_data['address'] = str(row['address']).strip()
                
                if 'salary' in df.columns and pd.notna(row['salary']):
                    employee_data['salary'] = float(row['salary'])
                
                # Insert employee
                result = supabase.table("employees").insert(employee_data).execute()
                
                if result.data:
                    imported_count += 1
                else:
                    errors.append(f"Row {index + 2}: Failed to insert employee")
                    
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "message": f"Import completed. {imported_count} employees imported successfully.",
            "imported_count": imported_count,
            "total_rows": len(df),
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import employees: {str(e)}"
        )

@router.get("/export/employees")
async def export_employees(
    current_user: User = Depends(get_current_user)
):
    """Export employees to Excel file"""
    try:
        supabase = get_supabase_client()
        
        # Get employees data
        result = supabase.table("employees").select("*").execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No employees found"
            )
        
        # Create DataFrame
        df = pd.DataFrame(result.data)
        
        # Select and rename columns
        export_columns = {
            'employee_code': 'Employee Code',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'email': 'Email',
            'phone': 'Phone',
            'address': 'Address',
            'department_id': 'Department',
            'position_id': 'Position',
            'hire_date': 'Hire Date',
            'salary': 'Salary',
            'status': 'Status'
        }
        
        df_export = df[list(export_columns.keys())].rename(columns=export_columns)
        
        # Convert to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, sheet_name='Employees', index=False)
        
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=employees_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export employees: {str(e)}"
        )

@router.get("/export/customers")
async def export_customers(
    current_user: User = Depends(get_current_user)
):
    """Export customers to Excel file"""
    try:
        supabase = get_supabase_client()
        
        # Get customers data
        result = supabase.table("customers").select("*").execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No customers found"
            )
        
        # Create DataFrame
        df = pd.DataFrame(result.data)
        
        # Select and rename columns
        export_columns = {
            'name': 'Customer Name',
            'email': 'Email',
            'phone': 'Phone',
            'address': 'Address',
            'level': 'Customer Level',
            'total_revenue': 'Total Revenue',
            'created_at': 'Created Date'
        }
        
        df_export = df[list(export_columns.keys())].rename(columns=export_columns)
        
        # Convert to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, sheet_name='Customers', index=False)
        
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=customers_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export customers: {str(e)}"
        )

@router.get("/export/invoices")
async def export_invoices(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Export invoices to Excel file"""
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("invoices").select("*,customers(name)")
        
        if start_date:
            query = query.gte("invoice_date", start_date)
        
        if end_date:
            query = query.lte("invoice_date", end_date)
        
        result = query.execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No invoices found"
            )
        
        # Create DataFrame
        df = pd.DataFrame(result.data)
        
        # Flatten customer data
        df['customer_name'] = df['customers'].apply(lambda x: x['name'] if x else 'N/A')
        
        # Select and rename columns
        export_columns = {
            'invoice_number': 'Invoice Number',
            'customer_name': 'Customer Name',
            'invoice_date': 'Invoice Date',
            'due_date': 'Due Date',
            'total_amount': 'Total Amount',
            'status': 'Status',
            'payment_status': 'Payment Status',
            'payment_date': 'Payment Date'
        }
        
        df_export = df[list(export_columns.keys())].rename(columns=export_columns)
        
        # Convert to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, sheet_name='Invoices', index=False)
        
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=invoices_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export invoices: {str(e)}"
        )
