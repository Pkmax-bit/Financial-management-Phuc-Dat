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
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client
from services.auto_snapshot_service import AutoSnapshotService

router = APIRouter()

async def update_parent_expense_object_total(expense_object_id: str, supabase):
    """Cập nhật tổng chi phí của đối tượng cha dựa trên tổng các đối tượng con"""
    try:
        # Lấy thông tin đối tượng chi phí
        expense_object_result = supabase.table("expense_objects").select("*").eq("id", expense_object_id).execute()
        if not expense_object_result.data:
            return
        
        expense_object = expense_object_result.data[0]
        
        # Nếu đây là đối tượng con, tìm đối tượng cha
        if expense_object.get('parent_id'):
            parent_id = expense_object['parent_id']
            
            # Tính tổng chi phí của tất cả đối tượng con
            children_result = supabase.table("expense_objects").select("id").eq("parent_id", parent_id).execute()
            children_ids = [child['id'] for child in children_result.data or []]
            
            if children_ids:
                # Tính tổng chi phí từ project_expenses
                total_result = supabase.table("project_expenses").select("amount").in_("expense_object_id", children_ids).execute()
                total_amount = sum(float(expense.get('amount', 0)) for expense in total_result.data or [])
                
                # Cập nhật tổng chi phí vào đối tượng cha (nếu có field total_amount)
                # Hoặc tạo một record tổng kết trong project_expenses
                parent_expense_data = {
                    "id": str(uuid.uuid4()),
                    "description": f"Tổng {expense_object.get('name', 'đối tượng')}",
                    "amount": total_amount,
                    "expense_date": datetime.utcnow().date().isoformat(),
                    "expense_object_id": parent_id,
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Kiểm tra xem đã có record tổng kết chưa
                existing_total = supabase.table("project_expenses").select("id").eq("expense_object_id", parent_id).eq("description", f"Tổng {expense_object.get('name', 'đối tượng')}").execute()
                
                if existing_total.data:
                    # Cập nhật record tổng kết
                    supabase.table("project_expenses").update({
                        "amount": total_amount,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", existing_total.data[0]['id']).execute()
                else:
                    # Tạo record tổng kết mới
                    supabase.table("project_expenses").insert(parent_expense_data).execute()
                
                print(f"✅ Updated parent expense object total: {total_amount}")
        
    except Exception as e:
        print(f"❌ Error updating parent expense object total: {e}")
        raise
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
            created_quote = result.data[0]
            
            # Auto-create snapshot if this is a child expense
            if quote.get('id_parent'):
                try:
                    auto_snapshot_service = AutoSnapshotService()
                    await auto_snapshot_service.create_auto_snapshot_for_child(
                        created_quote, 
                        'project_expenses_quote',
                        current_user.id
                    )
                except Exception as e:
                    print(f"Warning: Failed to create auto-snapshot: {e}")
            
            return created_quote
        raise HTTPException(status_code=400, detail="Create quote failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create quote: {str(e)}")


@router.put("/project-expenses/quotes/{quote_id}/approve")
async def approve_project_expense_quote(
    quote_id: str, current_user: User = Depends(get_current_user)
):
    try:
        # Check if user has permission to approve expenses
        allowed_roles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail="Requires admin, accountant, manager, Supplier, vận chuyển, or nhân công role"
            )
        
        supabase = get_supabase_client()
        q = supabase.table("project_expenses_quote").select("*").eq("id", quote_id).execute()
        if not q.data:
            raise HTTPException(status_code=404, detail="Quote not found")
        quote = q.data[0]

        # Prepare record for actual expenses
        expense = {k: quote[k] for k in [
            "expense_code","description","amount","currency","expense_date","notes","receipt_url",
            "project_id","customer_id","employee_id","department_id","id_parent",
            "expense_object_id","expense_object_columns","invoice_items"
        ] if k in quote}
        expense["id"] = str(uuid.uuid4())
        # CRITICAL: Status must be 'pending' by default, not 'approved'
        # Only the approve button in the actions column should change status to 'approved'
        expense["status"] = "pending"
        expense["created_at"] = datetime.utcnow().isoformat()
        expense["updated_at"] = datetime.utcnow().isoformat()

        # Log copied fields for debugging
        print(f"✅ Approving quote {quote_id} to actual expense:")
        print(f"  - expense_object_id: {expense.get('expense_object_id', 'None')}")
        print(f"  - expense_object_columns: {len(expense.get('expense_object_columns', []))} columns")
        print(f"  - invoice_items: {len(expense.get('invoice_items', []))} items")

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
            created_expense = result.data[0]
            
            # Auto-create snapshot if this is a child expense
            if expense.get('id_parent'):
                try:
                    auto_snapshot_service = AutoSnapshotService()
                    await auto_snapshot_service.create_auto_snapshot_for_child(
                        created_expense, 
                        'project_expenses',
                        current_user.id
                    )
                except Exception as e:
                    print(f"Warning: Failed to create auto-snapshot: {e}")
            
            # Tự động cập nhật chi phí đối tượng cha nếu có expense_object_id
            if expense.get('expense_object_id'):
                try:
                    await update_parent_expense_object_total(expense['expense_object_id'], supabase)
                except Exception as e:
                    print(f"Warning: Failed to update parent expense object total: {e}")
            
            return created_expense
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
            updated_expense = result.data[0]
            
            # Tự động cập nhật chi phí đối tượng cha nếu có expense_object_id
            if update_dict.get('expense_object_id'):
                try:
                    await update_parent_expense_object_total(update_dict['expense_object_id'], supabase)
                except Exception as e:
                    print(f"Warning: Failed to update parent expense object total: {e}")
            
            return updated_expense
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


