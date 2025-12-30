"""
Project Category Members Router
Manages many-to-many relationship between projects and categories
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

class ProjectCategoryMember(BaseModel):
    """Project category member model"""
    id: str
    project_id: str
    category_id: str
    added_at: datetime
    added_by: Optional[str] = None

class ProjectCategoryMemberCreate(BaseModel):
    """Project category member creation model"""
    project_id: str
    category_id: str

@router.post("/", response_model=ProjectCategoryMember)
async def add_project_to_category(
    member_data: ProjectCategoryMemberCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Add a project to a category"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project_check = supabase.table("projects").select("id").eq("id", member_data.project_id).execute()
        if not project_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if category exists
        category_check = supabase.table("project_categories").select("id").eq("id", member_data.category_id).execute()
        if not category_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check if already exists
        existing = supabase.table("project_category_members")\
            .select("id")\
            .eq("project_id", member_data.project_id)\
            .eq("category_id", member_data.category_id)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project is already in this category"
            )
        
        # Add project to category
        result = supabase.table("project_category_members")\
            .insert({
                "project_id": member_data.project_id,
                "category_id": member_data.category_id,
                "added_by": current_user.id
            })\
            .execute()
        
        if result.data:
            return ProjectCategoryMember(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add project to category"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add project to category: {str(e)}"
        )

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_from_category(
    member_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Remove a project from a category"""
    try:
        supabase = get_supabase_client()
        
        # Check if member exists
        existing = supabase.table("project_category_members")\
            .select("id")\
            .eq("id", member_id)\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project category member not found"
            )
        
        # Delete member
        supabase.table("project_category_members")\
            .delete()\
            .eq("id", member_id)\
            .execute()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove project from category: {str(e)}"
        )

@router.get("/projects/{project_id}/categories", response_model=List[dict])
async def get_project_categories(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all categories for a project"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_category_members")\
            .select("id, category_id, project_categories(id, name, color, code)")\
            .eq("project_id", project_id)\
            .execute()
        
        categories = []
        for member in (result.data or []):
            category = member.get('project_categories')
            if category:
                categories.append({
                    'member_id': member.get('id'),
                    'category_id': category.get('id'),
                    'name': category.get('name'),
                    'color': category.get('color'),
                    'code': category.get('code')
                })
        
        return categories
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project categories: {str(e)}"
        )

@router.get("/categories/{category_id}/projects", response_model=List[dict])
async def get_category_projects(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all projects in a category"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_category_members")\
            .select("id, project_id, projects(id, name, project_code, status)")\
            .eq("category_id", category_id)\
            .execute()
        
        projects = []
        for member in (result.data or []):
            project = member.get('projects')
            if project:
                projects.append({
                    'member_id': member.get('id'),
                    'project_id': project.get('id'),
                    'name': project.get('name'),
                    'project_code': project.get('project_code'),
                    'status': project.get('status')
                })
        
        return projects
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get category projects: {str(e)}"
        )






















