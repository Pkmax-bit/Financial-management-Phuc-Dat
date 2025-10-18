from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from utils.auth import get_current_user
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



