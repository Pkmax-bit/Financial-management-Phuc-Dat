"""
Project Categories Router
Handles CRUD operations for project categories
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models.project_category import ProjectCategory, ProjectCategoryCreate, ProjectCategoryUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("", response_model=List[ProjectCategory])
async def get_project_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user)
):
    """Get all project categories"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("project_categories").select("*")
        
        if is_active is not None:
            query = query.eq("is_active", is_active)
        
        # Order by display_order, then by name
        query = query.order("display_order", desc=False).order("name", desc=False)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        return [ProjectCategory(**item) for item in result.data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project categories: {str(e)}"
        )

@router.get("/{category_id}", response_model=ProjectCategory)
async def get_project_category(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific project category by ID"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("project_categories").select("*").eq("id", category_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project category not found"
            )
        
        return ProjectCategory(**result.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project category: {str(e)}"
        )

@router.post("/", response_model=ProjectCategory, status_code=status.HTTP_201_CREATED)
async def create_project_category(
    category: ProjectCategoryCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new project category (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if code already exists
        existing = supabase.table("project_categories").select("id").eq("code", category.code).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category code '{category.code}' already exists"
            )
        
        # Create category
        category_data = category.model_dump()
        result = supabase.table("project_categories").insert(category_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project category"
            )
        
        return ProjectCategory(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project category: {str(e)}"
        )

@router.put("/{category_id}", response_model=ProjectCategory)
async def update_project_category(
    category_id: str,
    category: ProjectCategoryUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a project category (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if category exists
        existing = supabase.table("project_categories").select("id").eq("id", category_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project category not found"
            )
        
        # If code is being updated, check for duplicates
        update_data = category.model_dump(exclude_unset=True)
        if "code" in update_data:
            code_check = supabase.table("project_categories").select("id").eq("code", update_data["code"]).neq("id", category_id).execute()
            if code_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category code '{update_data['code']}' already exists"
                )
        
        # Update category
        result = supabase.table("project_categories").update(update_data).eq("id", category_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update project category"
            )
        
        return ProjectCategory(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project category: {str(e)}"
        )

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_category(
    category_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a project category (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if category exists
        existing = supabase.table("project_categories").select("id").eq("id", category_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project category not found"
            )
        
        # Check if category is used by any projects
        projects_using = supabase.table("projects").select("id").eq("category_id", category_id).limit(1).execute()
        if projects_using.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category: it is being used by one or more projects"
            )
        
        # Delete category
        supabase.table("project_categories").delete().eq("id", category_id).execute()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project category: {str(e)}"
        )

