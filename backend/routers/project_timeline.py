"""
Project Timeline API
Handles timeline entries and file attachments
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import os

from models.user import User
from services.supabase_client import get_supabase_client
from utils.auth import get_current_user

router = APIRouter()

class Attachment(BaseModel):
    id: str
    name: str
    url: str
    type: str
    size: int
    uploaded_at: str

class TimelineEntry(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    date: str
    type: str
    status: str
    created_by: str
    created_at: str
    attachments: List[Attachment] = []
    # Optional comments hydrated by separate endpoint
    # comments: List[Comment] = []

class TimelineEntryCreate(BaseModel):
    title: str
    description: str
    date: str
    type: str
    status: str = "pending"
    created_by: str
    attachments: List[Attachment] = []

class TimelineEntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    created_by: Optional[str] = None

class Comment(BaseModel):
    id: str
    timeline_entry_id: str
    project_id: str
    user_id: Optional[str] = None
    author_name: str
    content: str
    created_at: str
    updated_at: Optional[str] = None

class CommentCreate(BaseModel):
    content: str
    author_name: str
    user_id: Optional[str] = None

@router.get("/projects/{project_id}/timeline")
async def get_project_timeline(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get all timeline entries for a project"""
    try:
        supabase = get_supabase_client()
        
        # Get timeline entries
        result = supabase.table("project_timeline").select("*").eq("project_id", project_id).order("date", desc=True).execute()
        
        if not result.data:
            return {"entries": []}
        
        entries = []
        for entry in result.data:
            # Get attachments for this entry
            attachments_result = supabase.table("timeline_attachments").select("*").eq("timeline_entry_id", entry["id"]).execute()
            attachments = [Attachment(**att) for att in attachments_result.data] if attachments_result.data else []
            
            entry_dict = dict(entry)
            entry_dict["attachments"] = attachments
            entries.append(TimelineEntry(**entry_dict))
        
        return {"entries": entries}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch timeline entries: {str(e)}"
        )

@router.post("/projects/{project_id}/timeline")
async def add_timeline_entry(
    project_id: str,
    entry_data: TimelineEntryCreate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Add a new timeline entry"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create timeline entry
        entry_dict = entry_data.model_dump()
        entry_dict["project_id"] = project_id
        entry_dict["created_at"] = datetime.now().isoformat()
        attachments = entry_dict.pop("attachments", [])
        
        # Fix date format - ensure it's a proper ISO datetime
        if "date" in entry_dict:
            try:
                # Parse the date and convert to proper ISO format
                date_str = entry_dict["date"]
                if "T" in date_str and len(date_str) == 16:  # Format: 2025-10-11T09:54
                    # Add seconds if missing
                    date_str += ":00"
                parsed_date = datetime.fromisoformat(date_str)
                entry_dict["date"] = parsed_date.isoformat()
            except Exception as date_error:
                print(f"Date parsing error: {date_error}")
                # Use current datetime as fallback
                entry_dict["date"] = datetime.now().isoformat()
        
        # Validate required fields
        required_fields = ["title", "description", "date", "type", "status", "created_by"]
        for field in required_fields:
            if field not in entry_dict or not entry_dict[field]:
                print(f"Missing or empty required field: {field}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        # Validate type and status values
        valid_types = ["milestone", "update", "issue", "meeting"]
        valid_statuses = ["pending", "in_progress", "completed"]
        
        if entry_dict["type"] not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type. Must be one of: {valid_types}"
            )
        
        if entry_dict["status"] not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        print(f"Creating timeline entry with data: {entry_dict}")
        
        try:
            result = supabase.table("project_timeline").insert(entry_dict).execute()
            print(f"Timeline entry result: {result}")
            
            if not result.data:
                print("No data returned from timeline insert")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create timeline entry - no data returned"
                )
                
        except Exception as db_error:
            print(f"Database error: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_error)}"
            )
        
        entry_id = result.data[0]["id"]
        
        # Add attachments if any
        if attachments:
            print(f"Adding {len(attachments)} attachments")
            for attachment in attachments:
                # attachment is already a dict, no need to call model_dump()
                attachment_dict = dict(attachment)  # Make a copy
                attachment_dict["timeline_entry_id"] = entry_id
                print(f"Inserting attachment: {attachment_dict}")
                
                try:
                    attachment_result = supabase.table("timeline_attachments").insert(attachment_dict).execute()
                    print(f"Attachment result: {attachment_result}")
                except Exception as attach_error:
                    print(f"Attachment error: {attach_error}")
                    # Don't fail the whole operation for attachment errors
        
        return {"message": "Timeline entry added successfully", "entry": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add timeline entry: {str(e)}"
        )

@router.put("/projects/{project_id}/timeline/{entry_id}")
async def update_timeline_entry(
    project_id: str,
    entry_id: str,
    entry_data: TimelineEntryUpdate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Update a timeline entry"""
    try:
        supabase = get_supabase_client()
        
        # Check if timeline entry exists
        existing_result = supabase.table("project_timeline").select("*").eq("id", entry_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Timeline entry not found"
            )
        
        # Update timeline entry
        update_data = entry_data.model_dump(exclude_unset=True)
        
        result = supabase.table("project_timeline").update(update_data).eq("id", entry_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update timeline entry"
            )
        
        return {"message": "Timeline entry updated successfully", "entry": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update timeline entry: {str(e)}"
        )

@router.delete("/projects/{project_id}/timeline/{entry_id}")
async def delete_timeline_entry(
    project_id: str,
    entry_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Delete a timeline entry"""
    try:
        supabase = get_supabase_client()
        
        # Check if timeline entry exists
        existing_result = supabase.table("project_timeline").select("*").eq("id", entry_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Timeline entry not found"
            )
        
        # Delete attachments first
        supabase.table("timeline_attachments").delete().eq("timeline_entry_id", entry_id).execute()
        
        # Delete timeline entry
        result = supabase.table("project_timeline").delete().eq("id", entry_id).execute()
        
        return {"message": "Timeline entry deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete timeline entry: {str(e)}"
        )


# ==========================
# Comments Endpoints (CRUD)
# ==========================

@router.get("/projects/{project_id}/timeline/{entry_id}/comments")
async def get_timeline_comments(
    project_id: str,
    entry_id: str
    # current_user: User = Depends(get_current_user)
):
    """Get comments for a timeline entry"""
    try:
        supabase = get_supabase_client()

        # Ensure entry belongs to project
        entry = supabase.table("project_timeline").select("id, project_id").eq("id", entry_id).eq("project_id", project_id).single().execute()
        if not entry.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline entry not found")

        comments_result = supabase.table("timeline_comments").select("*").eq("timeline_entry_id", entry_id).order("created_at", desc=False).execute()
        comments = [Comment(**c) for c in (comments_result.data or [])]
        return {"comments": comments}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch comments: {str(e)}")


@router.post("/projects/{project_id}/timeline/{entry_id}/comments")
async def add_timeline_comment(
    project_id: str,
    entry_id: str,
    payload: CommentCreate
    # current_user: User = Depends(get_current_user)
):
    """Add a comment to a timeline entry"""
    try:
        supabase = get_supabase_client()

        # Validate entry
        entry = supabase.table("project_timeline").select("id, project_id").eq("id", entry_id).eq("project_id", project_id).single().execute()
        if not entry.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline entry not found")

        insert_data = {
            "timeline_entry_id": entry_id,
            "project_id": project_id,
            "user_id": payload.user_id,
            "author_name": payload.author_name,
            "content": payload.content,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        result = supabase.table("timeline_comments").insert(insert_data).execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add comment")

        return {"message": "Comment added", "comment": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to add comment: {str(e)}")


@router.delete("/projects/{project_id}/timeline/{entry_id}/comments/{comment_id}")
async def delete_timeline_comment(
    project_id: str,
    entry_id: str,
    comment_id: str
    # current_user: User = Depends(get_current_user)
):
    """Delete a comment from a timeline entry"""
    try:
        supabase = get_supabase_client()

        # Validate comment belongs to entry and project
        comment = (
            supabase.table("timeline_comments")
            .select("id, timeline_entry_id, project_id")
            .eq("id", comment_id)
            .single()
            .execute()
        )
        if not comment.data or comment.data.get("timeline_entry_id") != entry_id or comment.data.get("project_id") != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        supabase.table("timeline_comments").delete().eq("id", comment_id).execute()
        return {"message": "Comment deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete comment: {str(e)}")


# ==========================
# File Upload Endpoints
# ==========================

@router.post("/projects/{project_id}/timeline/upload")
async def upload_timeline_file(
    project_id: str,
    file: UploadFile = File(...)
    # current_user: User = Depends(get_current_user)
):
    """Upload a file for timeline entry"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file size (max 5MB)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 5MB limit"
            )
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not supported. Please upload JPG, PNG, GIF, WebP, or PDF files."
            )
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = f"Timeline/{project_id}/{unique_filename}"
        
        # Upload to Supabase Storage using service role
        supabase = get_supabase_client()
        
        try:
            upload_result = supabase.storage.from_("minhchung_chiphi").upload(
                file_path,
                content,
                file_options={"content-type": file.content_type}
            )
            
            # Debug: Print the result structure
            print(f"Upload result type: {type(upload_result)}")
            print(f"Upload result: {upload_result}")
            
            # Check for upload errors - try different approaches
            error_msg = None
            if hasattr(upload_result, 'error') and upload_result.error:
                error_msg = str(upload_result.error)
            elif hasattr(upload_result, 'data') and not upload_result.data:
                error_msg = "Upload failed - no data returned"
            elif isinstance(upload_result, dict) and upload_result.get("error"):
                error_msg = str(upload_result.get("error"))
            
            if error_msg:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Upload failed: {error_msg}"
                )
            
            # Get public URL - try different approaches
            public_url = None
            try:
                public_url_result = supabase.storage.from_("minhchung_chiphi").get_public_url(file_path)
                print(f"Public URL result type: {type(public_url_result)}")
                print(f"Public URL result: {public_url_result}")
                
                # Try different ways to get public URL
                if hasattr(public_url_result, 'public_url'):
                    public_url = public_url_result.public_url
                elif hasattr(public_url_result, 'get'):
                    public_url = public_url_result.get("publicUrl")
                elif isinstance(public_url_result, dict):
                    public_url = public_url_result.get("publicUrl")
                elif isinstance(public_url_result, str):
                    public_url = public_url_result
                else:
                    # Try to access as attribute
                    public_url = getattr(public_url_result, 'public_url', None)
                    
            except Exception as url_error:
                print(f"Error getting public URL: {url_error}")
                # Fallback: construct URL manually
                supabase_url = os.getenv("SUPABASE_URL", "")
                if supabase_url:
                    public_url = f"{supabase_url}/storage/v1/object/public/minhchung_chiphi/{file_path}"
                    print(f"Using fallback URL: {public_url}")
            
        except Exception as upload_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
        
        if not public_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get public URL"
            )
        
        # Return attachment info
        attachment = {
            "id": str(uuid.uuid4()),
            "name": file.filename,
            "url": public_url,
            "type": "image" if file.content_type.startswith("image/") else "document",
            "size": len(content),
            "uploaded_at": datetime.now().isoformat()
        }
        
        return {"attachment": attachment}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.delete("/projects/{project_id}/timeline/attachments/{attachment_id}")
async def delete_attachment(
    project_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a timeline attachment"""
    try:
        supabase = get_supabase_client()
        
        # First, get the attachment info to get the file path
        attachment_result = supabase.table("project_timeline_attachments").select("*").eq("id", attachment_id).execute()
        
        if not attachment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )
        
        attachment = attachment_result.data[0]
        
        # Delete from storage
        try:
            # Extract file path from URL
            file_path = attachment["url"].split("/storage/v1/object/")[1]
            if "/" in file_path:
                bucket_name, file_name = file_path.split("/", 1)
                supabase.storage.from_(bucket_name).remove([file_name])
        except Exception as e:
            print(f"Warning: Failed to delete file from storage: {e}")
            # Continue with database deletion even if storage deletion fails
        
        # Delete from database
        delete_result = supabase.table("project_timeline_attachments").delete().eq("id", attachment_id).execute()
        
        if not delete_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )
        
        return {"message": "Attachment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete attachment: {str(e)}"
        )
