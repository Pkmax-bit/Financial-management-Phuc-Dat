from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from uuid import UUID
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

class ProjectTeamCreate(BaseModel):
    project_id: UUID
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    start_date: date
    hourly_rate: Optional[float] = None
    skills: Optional[List[str]] = None
    avatar: Optional[str] = None
    user_id: Optional[UUID] = None

class ProjectTeamResponse(ProjectTeamCreate):
    id: UUID
    status: str = 'active'
    created_at: Optional[date] = None
    updated_at: Optional[date] = None

@router.post("/project-team", response_model=ProjectTeamResponse)
async def create_project_team(team_member: ProjectTeamCreate, db: Session = Depends(get_db)):
    values = team_member.dict()
    
    # Check for duplicate member (by user_id or email)
    duplicate_query = """
        SELECT id, name, email, user_id 
        FROM project_team 
        WHERE project_id = :project_id AND status = 'active'
    """
    duplicate_params = {"project_id": values["project_id"]}
    
    # Build duplicate check conditions
    if values.get("user_id"):
        # Check by user_id first (most reliable)
        duplicate_query += " AND user_id = :user_id"
        duplicate_params["user_id"] = values["user_id"]
    elif values.get("email"):
        # Check by email if no user_id
        duplicate_query += " AND email = :email"
        duplicate_params["email"] = values["email"]
    else:
        # If neither user_id nor email, check by name as fallback
        duplicate_query += " AND name = :name"
        duplicate_params["name"] = values["name"]
    
    try:
        # Check for duplicates
        duplicate_result = db.execute(duplicate_query, duplicate_params).fetchone()
        
        if duplicate_result:
            existing_member = dict(duplicate_result)
            raise HTTPException(
                status_code=400,
                detail=f"Thành viên đã tồn tại trong dự án này. {existing_member.get('name', 'N/A')} ({existing_member.get('email', 'N/A')})"
            )
        
        # Insert new team member
        query = """
            INSERT INTO project_team (
                project_id, name, role, email, phone, start_date, 
                hourly_rate, skills, avatar, user_id, status
            ) VALUES (
                :project_id, :name, :role, :email, :phone, :start_date,
                :hourly_rate, :skills, :avatar, :user_id, 'active'
            ) RETURNING *
        """
        result = db.execute(query, values).fetchone()
        db.commit()
        return dict(result)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/project-team/{project_id}", response_model=List[ProjectTeamResponse])
async def get_project_team(project_id: UUID, db: Session = Depends(get_db)):
    query = "SELECT * FROM project_team WHERE project_id = :project_id"
    try:
        result = db.execute(query, {"project_id": project_id}).fetchall()
        return [dict(row) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/project-team/{team_member_id}")
async def delete_team_member(team_member_id: UUID, db: Session = Depends(get_db)):
    query = "DELETE FROM project_team WHERE id = :id"
    try:
        result = db.execute(query, {"id": team_member_id})
        db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Team member not found")
        return {"message": "Team member deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/project-team/{team_member_id}", response_model=ProjectTeamResponse)
async def update_team_member(
    team_member_id: UUID,
    team_member: ProjectTeamCreate,
    db: Session = Depends(get_db)
):
    query = """
        UPDATE project_team SET
            name = :name,
            role = :role,
            email = :email,
            phone = :phone,
            start_date = :start_date,
            hourly_rate = :hourly_rate,
            skills = :skills,
            avatar = :avatar,
            user_id = :user_id,
            updated_at = now()
        WHERE id = :id
        RETURNING *
    """
    values = {**team_member.dict(), "id": team_member_id}
    try:
        result = db.execute(query, values).fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Team member not found")
        db.commit()
        return dict(result)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
