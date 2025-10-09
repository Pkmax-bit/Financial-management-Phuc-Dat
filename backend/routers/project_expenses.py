"""
Project Expenses Router - CRUD for project-specific expenses
Mirrors core expenses logic but targets a dedicated table: project_expenses
Includes links to projects and customers via project_id and customer_id
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()
@router.post("/project-expenses/quotes")
async def create_project_expense_quote(
    payload: dict, current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        quote = dict(payload)
        quote["id"] = str(uuid.uuid4())
        quote["status"] = quote.get("status") or "pending"
        quote["created_at"] = datetime.utcnow().isoformat()
        quote["updated_at"] = datetime.utcnow().isoformat()

        for required in ["description", "amount", "expense_date", "project_id"]:
            if not quote.get(required):
                raise HTTPException(status_code=400, detail=f"Missing required field: {required}")

        result = supabase.table("project_expenses_quote").insert(quote).execute()
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=400, detail="Create quote failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create quote: {str(e)}")


@router.put("/project-expenses/quotes/{quote_id}/approve")
async def approve_project_expense_quote(
    quote_id: str, current_user: User = Depends(require_manager_or_admin)
):
    try:
        supabase = get_supabase_client()
        q = supabase.table("project_expenses_quote").select("*").eq("id", quote_id).execute()
        if not q.data:
            raise HTTPException(status_code=404, detail="Quote not found")
        quote = q.data[0]

        # Prepare record for actual expenses
        expense = {k: quote[k] for k in [
            "expense_code","description","amount","currency","expense_date","notes","receipt_url",
            "project_id","customer_id","employee_id","department_id","id_parent"
        ] if k in quote}
        expense["id"] = str(uuid.uuid4())
        expense["status"] = "approved"
        expense["created_at"] = datetime.utcnow().isoformat()
        expense["updated_at"] = datetime.utcnow().isoformat()

        ins = supabase.table("project_expenses").insert(expense).execute()
        if not ins.data:
            raise HTTPException(status_code=400, detail="Failed to convert quote")

        # Optionally, update quote status
        supabase.table("project_expenses_quote").update({
            "status": "approved",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", quote_id).execute()

        return {"message": "Quote approved to actual expense", "expense": ins.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve quote: {str(e)}")


@router.get("/project-expenses")
async def get_project_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        query = supabase.table("project_expenses").select("*")

        if search:
            query = query.or_(
                f"description.ilike.%{search}%,expense_code.ilike.%{search}%,tags.ilike.%{search}%"
            )
        if project_id:
            query = query.eq("project_id", project_id)
        if customer_id:
            query = query.eq("customer_id", customer_id)
        if status_filter:
            query = query.eq("status", status_filter)
        if employee_id:
            query = query.eq("employee_id", employee_id)
        if department_id:
            query = query.eq("department_id", department_id)

        result = (
            query.order("expense_date", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project expenses: {str(e)}",
        )


@router.get("/project-expenses/{expense_id}")
async def get_project_expense(
    expense_id: str, current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        result = (
            supabase.table("project_expenses").select("*").eq("id", expense_id).execute()
        )
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project expense: {str(e)}",
        )


@router.post("/project-expenses")
async def create_project_expense(
    payload: dict, current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()

        # Basic normalization
        expense = dict(payload)
        expense["id"] = str(uuid.uuid4())
        expense["status"] = expense.get("status") or "pending"
        expense["created_at"] = datetime.utcnow().isoformat()
        expense["updated_at"] = datetime.utcnow().isoformat()

        # Required fields minimal check
        for required in ["description", "amount", "expense_date"]:
            if not expense.get(required):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {required}",
                )

        # enforce leaf rule for amount editing: if id_parent present, amount can be set; parent amounts can be computed by clients

        result = supabase.table("project_expenses").insert(expense).execute()
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=400, detail="Create failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project expense: {str(e)}",
        )


@router.put("/project-expenses/{expense_id}")
async def update_project_expense(
    expense_id: str, payload: dict, current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        existing = (
            supabase.table("project_expenses").select("*").eq("id", expense_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        update_dict = {k: v for k, v in payload.items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()

        result = (
            supabase.table("project_expenses").update(update_dict).eq("id", expense_id).execute()
        )
        if result.data:
            return result.data[0]
        raise HTTPException(status_code=400, detail="Update failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project expense: {str(e)}",
        )


@router.delete("/project-expenses/{expense_id}")
async def delete_project_expense(
    expense_id: str, current_user: User = Depends(get_current_user)
):
    try:
        supabase = get_supabase_client()
        existing = (
            supabase.table("project_expenses").select("id").eq("id", expense_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        result = supabase.table("project_expenses").delete().eq("id", expense_id).execute()
        if result.data:
            return {"message": "Deleted"}
        raise HTTPException(status_code=400, detail="Delete failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project expense: {str(e)}",
        )


