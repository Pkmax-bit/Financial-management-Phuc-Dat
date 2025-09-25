"""
Project Management Router
Handles project CRUD, status tracking, time tracking, and profitability analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
from pydantic import BaseModel

from models.project import Project, ProjectCreate, ProjectUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

# Time Entry model
class TimeEntry(BaseModel):
    id: str
    project_id: str
    employee_id: str
    date: date
    hours_worked: float
    description: Optional[str] = None
    billable: bool = True
    hourly_rate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class TimeEntryCreate(BaseModel):
    project_id: str
    employee_id: str
    date: date
    hours_worked: float
    description: Optional[str] = None
    billable: bool = True
    hourly_rate: Optional[float] = None

class TimeEntryUpdate(BaseModel):
    date: Optional[date] = None
    hours_worked: Optional[float] = None
    description: Optional[str] = None
    billable: Optional[bool] = None
    hourly_rate: Optional[float] = None

@router.get("/projects", response_model=List[Project])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all projects with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("projects").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        return [Project(**project) for project in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )

@router.post("/projects", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new project"""
    try:
        supabase = get_supabase_client()
        
        # Create project record
        project_dict = project_data.dict()
        project_dict["id"] = str(uuid.uuid4())
        project_dict["created_at"] = datetime.utcnow().isoformat()
        project_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("projects").insert(project_dict).execute()
        
        if result.data:
            return Project(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create project"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update project information"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        existing = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Update project
        update_data = project_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
        
        if result.data:
            return Project(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update project"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )

@router.get("/projects/{project_id}/time-entries", response_model=List[TimeEntry])
async def get_project_time_entries(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get time entries for a project"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("time_entries").select("*").eq("project_id", project_id)
        
        # Apply filters
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        if start_date and end_date:
            query = query.gte("date", start_date.isoformat()).lte("date", end_date.isoformat())
        elif start_date:
            query = query.gte("date", start_date.isoformat())
        elif end_date:
            query = query.lte("date", end_date.isoformat())
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        return [TimeEntry(**entry) for entry in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch time entries: {str(e)}"
        )

@router.post("/projects/{project_id}/time-entries", response_model=TimeEntry)
async def create_time_entry(
    project_id: str,
    time_entry_data: TimeEntryCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new time entry for a project"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create time entry record
        entry_dict = time_entry_data.dict()
        entry_dict["id"] = str(uuid.uuid4())
        entry_dict["project_id"] = project_id
        entry_dict["created_at"] = datetime.utcnow().isoformat()
        entry_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("time_entries").insert(entry_dict).execute()
        
        if result.data:
            return TimeEntry(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create time entry"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create time entry: {str(e)}"
        )

@router.get("/projects/{project_id}/profitability")
async def get_project_profitability(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get project profitability analysis"""
    try:
        supabase = get_supabase_client()
        
        # Get project details
        project_result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = project_result.data[0]
        
        # Get time entries
        time_entries = supabase.table("time_entries").select("*").eq("project_id", project_id).execute()
        
        # Calculate costs
        total_hours = sum(entry["hours_worked"] for entry in time_entries.data)
        total_labor_cost = 0
        
        for entry in time_entries.data:
            if entry["hourly_rate"]:
                total_labor_cost += entry["hours_worked"] * entry["hourly_rate"]
        
        # Get project expenses
        expenses = supabase.table("expenses").select("amount").eq("project_id", project_id).execute()
        total_expenses = sum(expense["amount"] for expense in expenses.data)
        
        # Calculate profitability
        budget = project["budget"] or 0
        actual_cost = total_labor_cost + total_expenses
        profit = budget - actual_cost
        profit_margin = (profit / budget * 100) if budget > 0 else 0
        
        return {
            "project_id": project_id,
            "project_name": project["name"],
            "budget": budget,
            "actual_cost": actual_cost,
            "profit": profit,
            "profit_margin": profit_margin,
            "total_hours": total_hours,
            "labor_cost": total_labor_cost,
            "expenses": total_expenses,
            "status": project["status"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate profitability: {str(e)}"
        )

@router.get("/projects/stats/overview")
async def get_project_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get project statistics overview"""
    try:
        supabase = get_supabase_client()
        
        # Build date filter
        date_filter = ""
        if start_date and end_date:
            date_filter = f"start_date.gte.{start_date},start_date.lte.{end_date}"
        elif start_date:
            date_filter = f"start_date.gte.{start_date}"
        elif end_date:
            date_filter = f"start_date.lte.{end_date}"
        
        # Get project statistics
        project_query = supabase.table("projects").select("*")
        if date_filter:
            project_query = project_query.filter(date_filter)
        
        projects = project_query.execute()
        
        # Calculate statistics
        total_projects = len(projects.data)
        
        # Count projects by status
        status_counts = {}
        for project in projects.data:
            status = project["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Calculate total budget and actual cost
        total_budget = sum(project["budget"] or 0 for project in projects.data)
        
        # Get time entries for all projects
        project_ids = [project["id"] for project in projects.data]
        total_labor_cost = 0
        total_hours = 0
        
        if project_ids:
            time_entries = supabase.table("time_entries").select("*").in_("project_id", project_ids).execute()
            total_hours = sum(entry["hours_worked"] for entry in time_entries.data)
            
            for entry in time_entries.data:
                if entry["hourly_rate"]:
                    total_labor_cost += entry["hours_worked"] * entry["hourly_rate"]
        
        # Get total expenses for all projects
        total_expenses = 0
        if project_ids:
            expenses = supabase.table("expenses").select("amount").in_("project_id", project_ids).execute()
            total_expenses = sum(expense["amount"] for expense in expenses.data)
        
        total_actual_cost = total_labor_cost + total_expenses
        total_profit = total_budget - total_actual_cost
        
        return {
            "total_projects": total_projects,
            "by_status": status_counts,
            "total_budget": total_budget,
            "total_actual_cost": total_actual_cost,
            "total_profit": total_profit,
            "total_hours": total_hours,
            "labor_cost": total_labor_cost,
            "expenses": total_expenses
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project stats: {str(e)}"
        )

@router.put("/projects/{project_id}/status")
async def update_project_status(
    project_id: str,
    status: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update project status"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        existing = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Update project status
        result = supabase.table("projects").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", project_id).execute()
        
        if result.data:
            return {"message": "Project status updated successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update project status"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project status: {str(e)}"
        )
