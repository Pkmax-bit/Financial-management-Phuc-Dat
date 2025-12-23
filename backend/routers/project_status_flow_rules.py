"""
Project Status Flow Rules Router
Manages automatic flow rules: when project status changes to X → automatically add/remove from category Y
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

class ProjectStatusFlowRule(BaseModel):
    """Project status flow rule model"""
    id: str
    status_id: str
    category_id: str
    action_type: str  # 'add' or 'remove'
    is_active: bool
    priority: int
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

class ProjectStatusFlowRuleCreate(BaseModel):
    """Project status flow rule creation model"""
    status_id: str
    category_id: str
    action_type: str = 'add'  # 'add' or 'remove'
    is_active: bool = True
    priority: int = 0
    description: Optional[str] = None

class ProjectStatusFlowRuleUpdate(BaseModel):
    """Project status flow rule update model"""
    status_id: Optional[str] = None
    category_id: Optional[str] = None
    action_type: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    description: Optional[str] = None

@router.get("/", response_model=List[ProjectStatusFlowRule])
async def get_flow_rules(
    is_active: Optional[bool] = None,
    status_id: Optional[str] = None,
    category_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all flow rules, optionally filtered"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("project_status_flow_rules")\
            .select("""
                *,
                project_statuses(id, name, display_order),
                project_categories(id, name, code, color)
            """)
        
        if is_active is not None:
            query = query.eq("is_active", is_active)
        if status_id:
            query = query.eq("status_id", status_id)
        if category_id:
            query = query.eq("category_id", category_id)
        
        result = query.order("priority", desc=True).order("created_at", desc=False).execute()
        
        return result.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flow rules: {str(e)}"
        )

@router.get("/{rule_id}", response_model=ProjectStatusFlowRule)
async def get_flow_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific flow rule by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_status_flow_rules")\
            .select("*")\
            .eq("id", rule_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flow rule not found"
            )
        
        return ProjectStatusFlowRule(**result.data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flow rule: {str(e)}"
        )

@router.post("/", response_model=ProjectStatusFlowRule)
async def create_flow_rule(
    rule_data: ProjectStatusFlowRuleCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new flow rule"""
    try:
        supabase = get_supabase_client()
        
        # Validate status exists
        status_check = supabase.table("project_statuses")\
            .select("id")\
            .eq("id", rule_data.status_id)\
            .execute()
        if not status_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project status not found"
            )
        
        # Validate category exists
        category_check = supabase.table("project_categories")\
            .select("id")\
            .eq("id", rule_data.category_id)\
            .execute()
        if not category_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project category not found"
            )
        
        # Validate action_type
        if rule_data.action_type not in ['add', 'remove']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="action_type must be 'add' or 'remove'"
            )
        
        # Create rule
        rule_dict = rule_data.dict()
        rule_dict["created_by"] = current_user.id
        
        result = supabase.table("project_status_flow_rules")\
            .insert(rule_dict)\
            .execute()
        
        if result.data:
            return ProjectStatusFlowRule(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create flow rule"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create flow rule: {str(e)}"
        )

@router.put("/{rule_id}", response_model=ProjectStatusFlowRule)
async def update_flow_rule(
    rule_id: str,
    rule_data: ProjectStatusFlowRuleUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a flow rule"""
    try:
        supabase = get_supabase_client()
        
        # Check if rule exists
        existing = supabase.table("project_status_flow_rules")\
            .select("id")\
            .eq("id", rule_id)\
            .execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flow rule not found"
            )
        
        # Validate status if provided
        if rule_data.status_id:
            status_check = supabase.table("project_statuses")\
                .select("id")\
                .eq("id", rule_data.status_id)\
                .execute()
            if not status_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project status not found"
                )
        
        # Validate category if provided
        if rule_data.category_id:
            category_check = supabase.table("project_categories")\
                .select("id")\
                .eq("id", rule_data.category_id)\
                .execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project category not found"
                )
        
        # Validate action_type if provided
        if rule_data.action_type and rule_data.action_type not in ['add', 'remove']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="action_type must be 'add' or 'remove'"
            )
        
        # Update rule
        update_data = rule_data.dict(exclude_unset=True)
        
        result = supabase.table("project_status_flow_rules")\
            .update(update_data)\
            .eq("id", rule_id)\
            .execute()
        
        if result.data:
            return ProjectStatusFlowRule(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update flow rule"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update flow rule: {str(e)}"
        )

@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow_rule(
    rule_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a flow rule"""
    try:
        supabase = get_supabase_client()
        
        # Check if rule exists
        existing = supabase.table("project_status_flow_rules")\
            .select("id")\
            .eq("id", rule_id)\
            .execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flow rule not found"
            )
        
        # Delete rule
        supabase.table("project_status_flow_rules")\
            .delete()\
            .eq("id", rule_id)\
            .execute()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete flow rule: {str(e)}"
        )





