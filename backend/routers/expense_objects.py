"""
Expense Objects Management Router
Quản lý đối tượng chi phí (expense objects)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models.expense_object import ExpenseObject, ExpenseObjectCreate, ExpenseObjectUpdate
from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/public", response_model=List[ExpenseObject])
async def get_expense_objects_public(active_only: bool = Query(True, description="Chỉ lấy đối tượng đang hoạt động")):
    """Public: Lấy danh sách đối tượng chi phí (không yêu cầu xác thực)"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("expense_objects").select("*")
        if active_only:
            query = query.eq("is_active", True)
        result = query.order("name").execute()
        expense_objects = []
        for row in result.data:
            expense_objects.append(ExpenseObject(
                id=str(row["id"]),
                name=row["name"],
                description=row.get("description"),
                is_active=row["is_active"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                created_by=str(row["created_by"]) if row.get("created_by") else None,
                updated_by=str(row["updated_by"]) if row.get("updated_by") else None
            ))
        return expense_objects
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Lỗi khi lấy danh sách đối tượng chi phí (public): {str(e)}")

@router.get("/", response_model=List[ExpenseObject])
async def get_expense_objects(
    active_only: bool = Query(True, description="Chỉ lấy các đối tượng đang hoạt động"),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách đối tượng chi phí"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("expense_objects").select("*")
        
        if active_only:
            query = query.eq("is_active", True)
        
        result = query.order("name").execute()
        
        expense_objects = []
        for row in result.data:
            expense_objects.append(ExpenseObject(
                id=str(row["id"]),
                name=row["name"],
                description=row["description"],
                is_active=row["is_active"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                created_by=str(row["created_by"]) if row["created_by"] else None,
                updated_by=str(row["updated_by"]) if row["updated_by"] else None
            ))
        
        return expense_objects
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách đối tượng chi phí: {str(e)}"
        )

@router.get("/{expense_object_id}", response_model=ExpenseObject)
async def get_expense_object(
    expense_object_id: str,
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin một đối tượng chi phí"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("expense_objects")\
            .select("*")\
            .eq("id", expense_object_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đối tượng chi phí"
            )
        
        row = result.data[0]
        return ExpenseObject(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            is_active=row["is_active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row["created_by"] else None,
            updated_by=str(row["updated_by"]) if row["updated_by"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy thông tin đối tượng chi phí: {str(e)}"
        )

@router.post("/", response_model=ExpenseObject)
async def create_expense_object(
    expense_object: ExpenseObjectCreate,
    current_user: User = Depends(get_current_user)
):
    """Tạo đối tượng chi phí mới"""
    try:
        supabase = get_supabase_client()
        
        expense_object_data = {
            "id": str(uuid.uuid4()),
            "name": expense_object.name,
            "description": expense_object.description,
            "is_active": True,
            "created_by": current_user.id,
            "updated_by": current_user.id
        }
        
        result = supabase.table("expense_objects").insert(expense_object_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tạo đối tượng chi phí"
            )
        
        row = result.data[0]
        return ExpenseObject(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            is_active=row["is_active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row["created_by"] else None,
            updated_by=str(row["updated_by"]) if row["updated_by"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo đối tượng chi phí: {str(e)}"
        )

@router.put("/{expense_object_id}", response_model=ExpenseObject)
async def update_expense_object(
    expense_object_id: str,
    expense_object: ExpenseObjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Cập nhật đối tượng chi phí"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra đối tượng có tồn tại không
        check_result = supabase.table("expense_objects")\
            .select("id")\
            .eq("id", expense_object_id)\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đối tượng chi phí"
            )
        
        update_data = {
            "updated_by": current_user.id
        }
        
        if expense_object.name is not None:
            update_data["name"] = expense_object.name
        if expense_object.description is not None:
            update_data["description"] = expense_object.description
        if expense_object.is_active is not None:
            update_data["is_active"] = expense_object.is_active
        
        result = supabase.table("expense_objects")\
            .update(update_data)\
            .eq("id", expense_object_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể cập nhật đối tượng chi phí"
            )
        
        row = result.data[0]
        return ExpenseObject(
            id=str(row["id"]),
            name=row["name"],
            description=row["description"],
            is_active=row["is_active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row["created_by"] else None,
            updated_by=str(row["updated_by"]) if row["updated_by"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật đối tượng chi phí: {str(e)}"
        )

@router.delete("/{expense_object_id}")
async def delete_expense_object(
    expense_object_id: str,
    current_user: User = Depends(get_current_user)
):
    """Xóa đối tượng chi phí (soft delete)"""
    try:
        supabase = get_supabase_client()
        
        # Kiểm tra đối tượng có tồn tại không
        check_result = supabase.table("expense_objects")\
            .select("id")\
            .eq("id", expense_object_id)\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đối tượng chi phí"
            )
        
        # Soft delete - chỉ đánh dấu is_active = False
        result = supabase.table("expense_objects")\
            .update({
                "is_active": False,
                "updated_by": current_user.id
            })\
            .eq("id", expense_object_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể xóa đối tượng chi phí"
            )
        
        return {"message": "Đã xóa đối tượng chi phí thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa đối tượng chi phí: {str(e)}"
        )
