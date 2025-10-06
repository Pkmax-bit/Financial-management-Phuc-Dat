"""
Project Timeline API
Handles timeline entries and file attachments
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from models.user import User
from services.supabase_client import get_supabase_client

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
        
        result = supabase.table("project_timeline").insert(entry_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create timeline entry"
            )
        
        entry_id = result.data[0]["id"]
        
        # Add attachments if any
        if attachments:
            for attachment in attachments:
                attachment_dict = attachment.model_dump()
                attachment_dict["timeline_entry_id"] = entry_id
                supabase.table("timeline_attachments").insert(attachment_dict).execute()
        
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
