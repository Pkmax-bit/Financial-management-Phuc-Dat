from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from utils.auth import get_current_user, require_manager_or_admin
from models.user import User
from models.system_feedback import (
    SystemFeedback,
    SystemFeedbackCreate,
    SystemFeedbackUpdate,
)
from services.supabase_client import get_supabase_client


router = APIRouter(prefix="/api/feedback/system", tags=["system-feedback"])


@router.get("", response_model=List[SystemFeedback])
async def list_feedback(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        query = supabase.table("system_feedbacks").select("*").order("created_at", desc=True)
        if status:
            query = query.eq("status", status)
        if search:
            query = query.ilike("title", f"%{search}%")
        result = query.range(skip, skip + limit - 1).execute()
        return [SystemFeedback(**row) for row in (result.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list feedback: {e}")


@router.post("", response_model=SystemFeedback)
async def create_feedback(
    payload: SystemFeedbackCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        fid = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        data = payload.dict()
        data.update({
            "id": fid,
            "submitted_by": current_user.id,
            "created_at": now,
            "updated_at": now,
        })
        result = supabase.table("system_feedbacks").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create feedback")
        return SystemFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {e}")


@router.put("/{feedback_id}", response_model=SystemFeedback)
async def update_feedback(
    feedback_id: str,
    payload: SystemFeedbackUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return SystemFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update feedback: {e}")


@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        exists = supabase.table("system_feedbacks").select("id").eq("id", feedback_id).execute()
        if not exists.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        supabase.table("system_feedbacks").delete().eq("id", feedback_id).execute()
        return {"message": "Deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete feedback: {e}")


class ResolveFeedbackRequest(BaseModel):
    admin_notes: Optional[str] = None
    notification_message: Optional[str] = None


@router.post("/{feedback_id}/resolve")
async def resolve_feedback(
    feedback_id: str,
    request: ResolveFeedbackRequest,
    current_user: User = Depends(require_manager_or_admin)
):
    """Resolve a feedback and send notification to the creator"""
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        
        # Update feedback status
        update_data = {
            "status": "resolved",
            "resolved_at": datetime.utcnow().isoformat(),
            "resolved_by": current_user.id,
            "admin_notes": request.admin_notes
        }
        
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to resolve feedback")
        
        # Send notification to all users when feedback is resolved
        if request.notification_message:
            try:
                # Get all users to send notification to everyone
                users_result = supabase.table("users").select("id").execute()
                
                if users_result.data:
                    # Create notification records for all users
                    notifications = []
                    for user in users_result.data:
                        notification_data = {
                            "id": str(uuid.uuid4()),
                            "user_id": user["id"],
                            "title": "Góp ý hệ thống đã được xử lý",
                            "message": f"Góp ý '{feedback.get('title', 'Không có tiêu đề')}' đã được xử lý bởi admin. {request.notification_message}",
                            "type": "feedback_resolved_broadcast",
                            "related_id": feedback_id,
                            "created_at": datetime.utcnow().isoformat(),
                            "is_read": False
                        }
                        notifications.append(notification_data)
                    
                    # Insert all notifications at once
                    if notifications:
                        supabase.table("notifications").insert(notifications).execute()
                        print(f"Sent notification to {len(notifications)} users")
                
            except Exception as e:
                print(f"Failed to send broadcast notification: {e}")
                # Don't fail the whole operation if notification fails
        
        return {"message": "Feedback resolved successfully", "feedback": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve feedback: {e}")


@router.post("/{feedback_id}/close")
async def close_feedback(
    feedback_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Close a resolved feedback"""
    try:
        supabase = get_supabase_client()
        
        # Check if feedback exists and is resolved
        existing = supabase.table("system_feedbacks").select("*").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback = existing.data[0]
        if feedback["status"] != "resolved":
            raise HTTPException(status_code=400, detail="Only resolved feedbacks can be closed")
        
        # Update feedback status
        update_data = {
            "status": "closed",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("system_feedbacks").update(update_data).eq("id", feedback_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to close feedback")
        
        return {"message": "Feedback closed successfully", "feedback": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to close feedback: {e}")


