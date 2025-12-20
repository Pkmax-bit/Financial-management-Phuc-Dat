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
    responsibility_type: Optional[str] = None
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
    responsibility_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: str
    hourly_rate: Optional[float] = None
    status: str = "active"
    skills: List[str] = []
    avatar: Optional[str] = None
    user_id: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    responsibility_type: Optional[str] = None
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
    """Add a new team member to a project and automatically add them to all project tasks"""
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
        
        created_member = result.data[0]
        
        # Get employee_id from user_id if available
        employee_id = None
        if created_member.get("user_id"):
            employee_result = supabase.table("employees").select("id").eq("user_id", created_member["user_id"]).limit(1).execute()
            if employee_result.data:
                employee_id = employee_result.data[0]["id"]
        
        # If we have employee_id, add them to all tasks in this project
        if employee_id:
            try:
                # Get all tasks for this project
                tasks_result = supabase.table("tasks").select("id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                
                if tasks_result.data:
                    # Get current user_id for added_by (use the team member's user_id if available, otherwise use a system user)
                    added_by = created_member.get("user_id")
                    if not added_by:
                        # Try to get from employees table
                        emp_user_result = supabase.table("employees").select("user_id").eq("id", employee_id).limit(1).execute()
                        if emp_user_result.data and emp_user_result.data[0].get("user_id"):
                            added_by = emp_user_result.data[0]["user_id"]
                    
                    # Prepare participants to add
                    participants_to_add = []
                    for task in tasks_result.data:
                        # Check if participant already exists
                        existing_participant = supabase.table("task_participants").select("id").eq("task_id", task["id"]).eq("employee_id", employee_id).limit(1).execute()
                        
                        if not existing_participant.data:
                            participants_to_add.append({
                                "task_id": task["id"],
                                "employee_id": employee_id,
                                "role": "participant",
                                "added_by": added_by
                            })
                    
                    # Insert participants in batch
                    if participants_to_add:
                        supabase.table("task_participants").insert(participants_to_add).execute()
            except Exception as task_error:
                # Log error but don't fail the team member creation
                print(f"Warning: Failed to add team member to tasks: {str(task_error)}")
        
        return {"message": "Team member added successfully", "member": created_member}
        
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
        
        member = existing_result.data[0]

        # If member has user_id -> find employee_id
        employee_id = None
        user_id = member.get("user_id")
        if user_id:
            emp_result = supabase.table("employees").select("id").eq("user_id", user_id).limit(1).execute()
            if emp_result.data:
                employee_id = emp_result.data[0].get("id")

        # Delete team member
        result = supabase.table("project_team").delete().eq("id", member_id).execute()
        
        # Also remove from task participants and task_group_members if employee_id is known
        if employee_id:
            try:
                # Get all task ids of this project
                tasks_result = supabase.table("tasks").select("id, group_id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                task_ids = [t["id"] for t in (tasks_result.data or []) if t.get("id")]
                if task_ids:
                    # Remove from task participants
                    supabase.table("task_participants").delete().in_("task_id", task_ids).eq("employee_id", employee_id).execute()
                
                # Get all unique group_ids from tasks in this project
                group_ids = list(set([t.get("group_id") for t in (tasks_result.data or []) if t.get("group_id")]))
                if group_ids:
                    # Remove from all task_group_members in this project's task groups
                    supabase.table("task_group_members").delete().in_("group_id", group_ids).eq("employee_id", employee_id).execute()
            except Exception as rm_err:
                # Log but do not fail delete
                print(f"Warning: failed to remove participant/group member when deleting team member: {rm_err}")

        return {"message": "Team member deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete team member: {str(e)}"
        )
