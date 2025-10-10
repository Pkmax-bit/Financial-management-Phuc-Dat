from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class TeamMemberBase(BaseModel):
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: date
    hourly_rate: Optional[float] = None
    status: str = 'active'
    skills: List[str] = []
    avatar: Optional[str] = None
    user_id: Optional[str] = None

class TeamMemberCreate(TeamMemberBase):
    project_id: str

class TeamMemberUpdate(TeamMemberBase):
    pass

class TeamMember(TeamMemberBase):
    id: str
    project_id: str
    created_at: Optional[date]
    updated_at: Optional[date]

@router.get("/projects/{project_id}/team", response_model=List[TeamMember])
async def get_project_team(project_id: str):
    try:
        response = supabase.table('project_team') \
            .select('*') \
            .eq('project_id', project_id) \
            .execute()
        
        if response.data is None:
            return []
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{project_id}/team", response_model=TeamMember)
async def add_team_member(project_id: str, member: TeamMemberCreate):
    try:
        member_data = member.dict()
        member_data['project_id'] = project_id
        
        response = supabase.table('project_team') \
            .insert(member_data) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to add team member")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}/team/{member_id}", response_model=TeamMember)
async def update_team_member(project_id: str, member_id: str, member: TeamMemberUpdate):
    try:
        response = supabase.table('project_team') \
            .update(member.dict(exclude_unset=True)) \
            .eq('id', member_id) \
            .eq('project_id', project_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}/team/{member_id}")
async def delete_team_member(project_id: str, member_id: str):
    try:
        response = supabase.table('project_team') \
            .delete() \
            .eq('id', member_id) \
            .eq('project_id', project_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        return {"message": "Team member deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
