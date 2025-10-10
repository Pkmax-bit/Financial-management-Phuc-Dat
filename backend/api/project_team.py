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
    query = """
        INSERT INTO project_team (
            project_id, name, role, email, phone, start_date, 
            hourly_rate, skills, avatar, user_id
        ) VALUES (
            :project_id, :name, :role, :email, :phone, :start_date,
            :hourly_rate, :skills, :avatar, :user_id
        ) RETURNING *
    """
    values = team_member.dict()
    try:
        result = db.execute(query, values).fetchone()
        db.commit()
        return dict(result)
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
