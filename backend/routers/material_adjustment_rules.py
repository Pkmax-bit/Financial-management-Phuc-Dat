"""
Material Adjustment Rules Router
API endpoints để quản lý quy tắc điều chỉnh vật tư
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models.material_adjustment_rule import (
    MaterialAdjustmentRule,
    MaterialAdjustmentRuleCreate,
    MaterialAdjustmentRuleUpdate
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/", response_model=List[MaterialAdjustmentRule])
async def get_material_adjustment_rules(
    expense_object_id: Optional[str] = Query(None, description="Lọc theo đối tượng chi phí"),
    dimension_type: Optional[str] = Query(None, description="Lọc theo loại kích thước"),
    is_active: Optional[bool] = Query(True, description="Chỉ lấy quy tắc đang hoạt động"),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách quy tắc điều chỉnh vật tư"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("material_adjustment_rules").select("*")
        
        if expense_object_id:
            query = query.eq("expense_object_id", expense_object_id)
        
        if dimension_type:
            query = query.eq("dimension_type", dimension_type)
        
        if is_active is not None:
            query = query.eq("is_active", is_active)
        
        result = query.order("priority").order("created_at", desc=True).execute()
        
        rules = []
        for row in result.data:
            rules.append(MaterialAdjustmentRule(
                id=str(row["id"]),
                expense_object_id=str(row["expense_object_id"]),
                dimension_type=row["dimension_type"],
                change_type=row["change_type"],
                change_value=float(row["change_value"]),
                change_direction=row["change_direction"],
                adjustment_type=row["adjustment_type"],
                adjustment_value=float(row["adjustment_value"]),
                priority=int(row.get("priority", 100)),
                name=row.get("name"),
                description=row.get("description"),
                is_active=row["is_active"],
                max_adjustment_percentage=row.get("max_adjustment_percentage"),
                max_adjustment_value=row.get("max_adjustment_value"),
                allowed_category_ids=row.get("allowed_category_ids"),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                created_by=str(row["created_by"]) if row.get("created_by") else None
            ))
        
        return rules
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách quy tắc điều chỉnh vật tư: {str(e)}"
        )

@router.get("/{rule_id}", response_model=MaterialAdjustmentRule)
async def get_material_adjustment_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin một quy tắc điều chỉnh vật tư"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("material_adjustment_rules")\
            .select("*")\
            .eq("id", rule_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy quy tắc điều chỉnh vật tư"
            )
        
        row = result.data[0]
        return MaterialAdjustmentRule(
            id=str(row["id"]),
            expense_object_id=str(row["expense_object_id"]),
            dimension_type=row["dimension_type"],
            change_type=row["change_type"],
            change_value=float(row["change_value"]),
            change_direction=row["change_direction"],
            adjustment_type=row["adjustment_type"],
            adjustment_value=float(row["adjustment_value"]),
            priority=int(row.get("priority", 100)),
            name=row.get("name"),
            description=row.get("description"),
            is_active=row["is_active"],
            max_adjustment_percentage=row.get("max_adjustment_percentage"),
            max_adjustment_value=row.get("max_adjustment_value"),
            allowed_category_ids=row.get("allowed_category_ids"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row.get("created_by") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy thông tin quy tắc: {str(e)}"
        )

@router.post("/", response_model=MaterialAdjustmentRule)
async def create_material_adjustment_rule(
    rule: MaterialAdjustmentRuleCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Tạo quy tắc điều chỉnh vật tư mới"""
    try:
        supabase = get_supabase_client()
        
        # Get employee ID for created_by
        employee_result = supabase.table("employees")\
            .select("id")\
            .eq("user_id", current_user.id)\
            .execute()
        created_by = employee_result.data[0]["id"] if employee_result.data else None
        
        rule_dict = rule.dict()
        rule_dict["id"] = str(uuid.uuid4())
        rule_dict["created_by"] = created_by
        
        result = supabase.table("material_adjustment_rules")\
            .insert(rule_dict)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể tạo quy tắc điều chỉnh vật tư"
            )
        
        row = result.data[0]
        return MaterialAdjustmentRule(
            id=str(row["id"]),
            expense_object_id=str(row["expense_object_id"]),
            dimension_type=row["dimension_type"],
            change_type=row["change_type"],
            change_value=float(row["change_value"]),
            change_direction=row["change_direction"],
            adjustment_type=row["adjustment_type"],
            adjustment_value=float(row["adjustment_value"]),
            priority=int(row.get("priority", 100)),
            name=row.get("name"),
            description=row.get("description"),
            is_active=row["is_active"],
            max_adjustment_percentage=row.get("max_adjustment_percentage"),
            max_adjustment_value=row.get("max_adjustment_value"),
            allowed_category_ids=row.get("allowed_category_ids"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row.get("created_by") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo quy tắc điều chỉnh vật tư: {str(e)}"
        )

@router.put("/{rule_id}", response_model=MaterialAdjustmentRule)
async def update_material_adjustment_rule(
    rule_id: str,
    rule: MaterialAdjustmentRuleUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Cập nhật quy tắc điều chỉnh vật tư"""
    try:
        supabase = get_supabase_client()
        
        # Check if rule exists
        check_result = supabase.table("material_adjustment_rules")\
            .select("id")\
            .eq("id", rule_id)\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy quy tắc điều chỉnh vật tư"
            )
        
        # Update rule
        update_dict = rule.dict(exclude_unset=True)
        
        result = supabase.table("material_adjustment_rules")\
            .update(update_dict)\
            .eq("id", rule_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể cập nhật quy tắc điều chỉnh vật tư"
            )
        
        row = result.data[0]
        return MaterialAdjustmentRule(
            id=str(row["id"]),
            expense_object_id=str(row["expense_object_id"]),
            dimension_type=row["dimension_type"],
            change_type=row["change_type"],
            change_value=float(row["change_value"]),
            change_direction=row["change_direction"],
            adjustment_type=row["adjustment_type"],
            adjustment_value=float(row["adjustment_value"]),
            priority=int(row.get("priority", 100)),
            name=row.get("name"),
            description=row.get("description"),
            is_active=row["is_active"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            created_by=str(row["created_by"]) if row.get("created_by") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật quy tắc điều chỉnh vật tư: {str(e)}"
        )

@router.delete("/{rule_id}")
async def delete_material_adjustment_rule(
    rule_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Xóa quy tắc điều chỉnh vật tư"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("material_adjustment_rules")\
            .delete()\
            .eq("id", rule_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy quy tắc điều chỉnh vật tư"
            )
        
        return {"message": "Đã xóa quy tắc điều chỉnh vật tư thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa quy tắc điều chỉnh vật tư: {str(e)}"
        )

