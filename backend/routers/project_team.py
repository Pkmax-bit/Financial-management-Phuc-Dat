"""
Project Team Management API
Handles team member CRUD operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from models.user import User
from services.supabase_client import get_supabase_client

router = APIRouter()

class TeamMember(BaseModel):
    id: str
    project_id: str
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: str
    hourly_rate: Optional[float] = None
    status: str
    skills: List[str] = []
    avatar: Optional[str] = None
    created_at: str
    updated_at: str

class TeamMemberCreate(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: str
    hourly_rate: Optional[float] = None
    status: str = "active"
    skills: List[str] = []
    avatar: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: Optional[str] = None
    hourly_rate: Optional[float] = None
    status: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar: Optional[str] = None

@router.get("/projects/{project_id}/team")
async def get_project_team(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get all team members for a project"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_team").select("*").eq("project_id", project_id).execute()
        
        if not result.data:
            return {"team_members": []}
        
        team_members = []
        for member in result.data:
            # Normalize nullable fields from DB
            if member.get("skills") is None:
                member["skills"] = []
            team_members.append(TeamMember(**member))
        
        return {"team_members": team_members}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team members: {str(e)}"
        )

@router.post("/projects/{project_id}/team")
async def add_team_member(
    project_id: str,
    member_data: TeamMemberCreate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Add a new team member to a project"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create team member
        member_dict = member_data.model_dump()
        member_dict["project_id"] = project_id
        member_dict["created_at"] = datetime.now().isoformat()
        member_dict["updated_at"] = datetime.now().isoformat()
        
        result = supabase.table("project_team").insert(member_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create team member"
            )
        
        return {"message": "Team member added successfully", "member": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add team member: {str(e)}"
        )

@router.put("/projects/{project_id}/team/{member_id}")
async def update_team_member(
    project_id: str,
    member_id: str,
    member_data: TeamMemberUpdate
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Update a team member"""
    try:
        supabase = get_supabase_client()
        
        # Check if team member exists
        existing_result = supabase.table("project_team").select("*").eq("id", member_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        # Update team member
        update_data = member_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()
        
        result = supabase.table("project_team").update(update_data).eq("id", member_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update team member"
            )
        
        return {"message": "Team member updated successfully", "member": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update team member: {str(e)}"
        )

@router.delete("/projects/{project_id}/team/{member_id}")
async def delete_team_member(
    project_id: str,
    member_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Delete a team member"""
    try:
        supabase = get_supabase_client()
        
        # Check if team member exists
        existing_result = supabase.table("project_team").select("*").eq("id", member_id).eq("project_id", project_id).execute()
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        
        # Delete team member
        result = supabase.table("project_team").delete().eq("id", member_id).execute()
        
        return {"message": "Team member deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete team member: {str(e)}"
        )
