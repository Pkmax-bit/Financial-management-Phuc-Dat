from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from utils.auth import get_current_user, require_manager_or_admin
from models.user import User
from models.feedback import (
    EmployeeFeedback,
    EmployeeFeedbackCreate,
    EmployeeFeedbackUpdate,
)
from services.supabase_client import get_supabase_client


router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.get("/employee", response_model=List[EmployeeFeedback])
async def list_employee_feedbacks(
    employee_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """List feedbacks. If employee_id is provided, filter by employee."""
    try:
        supabase = get_supabase_client()
        query = supabase.table("employee_feedbacks").select("*").order("created_at", desc=True)
        if employee_id:
            query = query.eq("employee_id", employee_id)
        if search:
            # simple ilike on title/content
            query = query.ilike("title", f"%{search}%")
        result = query.range(skip, skip + limit - 1).execute()
        return [EmployeeFeedback(**row) for row in (result.data or [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list feedbacks: {e}")


@router.post("/employee", response_model=EmployeeFeedback)
async def create_employee_feedback(
    payload: EmployeeFeedbackCreate,
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        supabase = get_supabase_client()
        feedback_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        data = payload.dict()
        data.update({
            "id": feedback_id,
            "given_by": payload.given_by or current_user.id,
            "created_at": now,
            "updated_at": now,
        })
        result = supabase.table("employee_feedbacks").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create feedback")
        return EmployeeFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {e}")


@router.put("/employee/{feedback_id}", response_model=EmployeeFeedback)
async def update_employee_feedback(
    feedback_id: str,
    payload: EmployeeFeedbackUpdate,
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        supabase = get_supabase_client()
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("employee_feedbacks").update(update_data).eq("id", feedback_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return EmployeeFeedback(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update feedback: {e}")


@router.delete("/employee/{feedback_id}")
async def delete_employee_feedback(
    feedback_id: str,
    current_user: User = Depends(require_manager_or_admin),
):
    try:
        supabase = get_supabase_client()
        # Ensure exists
        existing = supabase.table("employee_feedbacks").select("id").eq("id", feedback_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Feedback not found")
        supabase.table("employee_feedbacks").delete().eq("id", feedback_id).execute()
        return {"message": "Deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete feedback: {e}")



