"""
Task Attachments Upload Endpoint
Add this to tasks.py router
"""

from fastapi import UploadFile, File
from services.file_upload_service import get_file_upload_service

@router.post("/{task_id}/attachments")
async def upload_task_attachment(
    task_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload attachment for a task"""
    try:
        supabase = get_supabase_client()
        
        # Verify task exists
        task_result = supabase.table("tasks").select("id").eq("id", task_id).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Upload file to storage
        upload_service = get_file_upload_service()
        file_result = await upload_service.upload_file(
            file=file,
            folder_path=f"Tasks/{task_id}"
        )
        
        # Create attachment record
        attachment_data = {
            "id": str(uuid.uuid4()),
            "task_id": task_id,
            "file_name": file_result["name"],
            "file_url": file_result["url"],
            "file_path": file_result["path"],
            "file_type": file_result["content_type"],
            "file_size": file_result["size"],
            "uploaded_by": current_user.id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("task_attachments").insert(attachment_data).execute()
        
        return {
            "id": attachment_data["id"],
            "file_name": file_result["name"],
            "file_url": file_result["url"],
            "file_type": file_result["content_type"],
            "file_size": file_result["size"],
            "uploaded_by_name": current_user.full_name,
            "created_at": attachment_data["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload attachment: {str(e)}"
        )

@router.delete("/attachments/{attachment_id}")
async def delete_task_attachment(
    attachment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a task attachment"""
    try:
        supabase = get_supabase_client()
        
        # Get attachment info
        attachment_result = supabase.table("task_attachments").select("*").eq("id", attachment_id).execute()
        if not attachment_result.data:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        attachment = attachment_result.data[0]
        
        # Delete from storage
        upload_service = get_file_upload_service()
        await upload_service.delete_file(attachment["file_path"])
        
        # Delete from database
        supabase.table("task_attachments").delete().eq("id", attachment_id).execute()
        
        return {"message": "Attachment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete attachment: {str(e)}"
        )
