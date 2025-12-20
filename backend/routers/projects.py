"""
Project Management Router
Handles project CRUD, status tracking, time tracking, and profitability analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
from pydantic import BaseModel

from models.project import Project, ProjectCreate, ProjectUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin, security
from services.supabase_client import get_supabase_client
from services.project_profitability_service import ProjectProfitabilityService

router = APIRouter()

def sanitize_search_input(search: str) -> str:
    """Sanitize search input to prevent SQL injection and DoS attacks
    
    Args:
        search: Raw search string from user input
        
    Returns:
        Sanitized search string safe for use in queries
    """
    if not search:
        return ""
    
    # Remove or escape special characters that could be used for injection
    # Escape % and _ which are special in LIKE queries
    sanitized = search.replace('%', '\\%').replace('_', '\\_')
    
    # Remove null bytes and other control characters
    sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
    
    # Limit length to prevent DoS attacks
    if len(sanitized) > 200:
        sanitized = sanitized[:200]
    
    return sanitized.strip()

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

@router.get("/", response_model=List[Project])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get projects with optional filtering. Only shows projects where user is in project_team, except for admin and accountant who see all projects."""
    try:
        supabase = get_supabase_client()
        
        # Admin and accountant see all projects
        if current_user.role in ["admin", "accountant"]:
            query = supabase.table("projects").select("""
                *,
                customers:customer_id(name),
                employees:manager_id(first_name, last_name),
                project_categories:category_id(name, color)
            """)
        else:
            # Non-admin users: only see projects where they are in project_team
            # First, get project_ids where user is in team (by user_id or email)
            team_query = supabase.table("project_team").select("project_id").eq("status", "active")
            
            # Match by user_id or email using OR condition
            # Supabase OR syntax: "column1.eq.value1,column2.eq.value2"
            or_conditions = []
            if current_user.id:
                or_conditions.append(f"user_id.eq.{current_user.id}")
            if current_user.email:
                or_conditions.append(f"email.eq.{current_user.email}")
            
            if not or_conditions:
                # If no user_id or email, return empty list
                return []
            
            # Apply OR condition if we have multiple conditions
            if len(or_conditions) > 1:
                team_query = team_query.or_(",".join(or_conditions))
            else:
                # Single condition - apply directly
                condition = or_conditions[0]
                if condition.startswith("user_id.eq."):
                    team_query = team_query.eq("user_id", current_user.id)
                elif condition.startswith("email.eq."):
                    team_query = team_query.eq("email", current_user.email)
            
            team_result = team_query.execute()
            
            if not team_result.data:
                # User is not in any project team
                return []
            
            # Get unique project_ids
            project_ids = list(set([member["project_id"] for member in team_result.data]))
            
            if not project_ids:
                return []
            
            # Query projects that user has access to
            query = supabase.table("projects").select("""
                *,
                customers:customer_id(name),
                employees:manager_id(first_name, last_name),
                project_categories:category_id(name, color)
            """).in_("id", project_ids)
        
        # Apply filters
        if search:
            sanitized_search = sanitize_search_input(search)
            if sanitized_search:
                query = query.or_(f"name.ilike.%{sanitized_search}%,description.ilike.%{sanitized_search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        if category_id:
            query = query.eq("category_id", category_id)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        # Process data to add customer_name, manager_name, and category info
        processed_projects = []
        for project in result.data:
            project_data = dict(project)
            project_data['customer_name'] = project.get('customers', {}).get('name') if project.get('customers') else None
            project_data['manager_name'] = f"{project.get('employees', {}).get('first_name', '')} {project.get('employees', {}).get('last_name', '')}".strip() if project.get('employees') else None
            # Add category information
            category = project.get('project_categories')
            if category:
                project_data['category_name'] = category.get('name')
                project_data['category_color'] = category.get('color')
            else:
                project_data['category_name'] = None
                project_data['category_color'] = None
            processed_projects.append(Project(**project_data))
        
        return processed_projects
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )

@router.get("/list-ids")
async def get_project_list(
    current_user: User = Depends(get_current_user)
):
    """Get simple list of projects with id, name, description and created_at. Only shows projects where user is in project_team, except for admin and accountant who see all projects."""
    try:
        supabase = get_supabase_client()
        
        # Admin and accountant see all projects
        if current_user.role in ["admin", "accountant"]:
            result = supabase.table("projects").select("id, name, description, created_at, project_code").order("created_at", desc=True).execute()
        else:
            # Non-admin users: only see projects where they are in project_team
            team_query = supabase.table("project_team").select("project_id").eq("status", "active")
            
            or_conditions = []
            if current_user.id:
                or_conditions.append(f"user_id.eq.{current_user.id}")
            if current_user.email:
                or_conditions.append(f"email.eq.{current_user.email}")
            
            if not or_conditions:
                return {"projects": [], "count": 0}
            
            if len(or_conditions) > 1:
                team_query = team_query.or_(",".join(or_conditions))
            else:
                condition = or_conditions[0]
                if condition.startswith("user_id.eq."):
                    team_query = team_query.eq("user_id", current_user.id)
                elif condition.startswith("email.eq."):
                    team_query = team_query.eq("email", current_user.email)
            
            team_result = team_query.execute()
            
            if not team_result.data:
                return {"projects": [], "count": 0}
            
            project_ids = list(set([member["project_id"] for member in team_result.data]))
            
            if not project_ids:
                return {"projects": [], "count": 0}
            
            result = supabase.table("projects").select("id, name, description, created_at, project_code").in_("id", project_ids).order("created_at", desc=True).execute()
        
        return {
            "projects": result.data or [],
            "count": len(result.data) if result.data else 0
        }
    except Exception as e:
        print(f"Error fetching project list: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test/{project_id}")
async def get_project_test(project_id: str):
    """Test endpoint without authentication"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("projects").select("*").eq("id", project_id).execute()
        
        if not result.data:
            return {"error": "Project not found", "project_id": project_id}
        
        return {"success": True, "project": result.data[0]}
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/debug/headers")
async def debug_headers(request: Request):
    """Debug endpoint to check headers"""
    return {
        "headers": dict(request.headers),
        "authorization": request.headers.get("authorization"),
        "content_type": request.headers.get("content-type")
    }

@router.get("/debug/auth")
async def debug_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug authentication"""
    try:
        token = credentials.credentials
        return {
            "success": True,
            "token_length": len(token),
            "token_preview": token[:20] + "..." if len(token) > 20 else token
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/debug/auth-optional")
async def debug_auth_optional(request: Request):
    """Debug authentication with optional token"""
    auth_header = request.headers.get("authorization")
    if auth_header:
        token = auth_header.replace("Bearer ", "")
        return {
            "success": True,
            "has_token": True,
            "token_length": len(token),
            "token_preview": token[:20] + "..." if len(token) > 20 else token
        }
    else:
        return {
            "success": False,
            "has_token": False,
            "message": "No authorization header found"
        }

# ============================================================================
# Project Statuses Management
# Must be defined BEFORE /{project_id} route to avoid route conflicts
# ============================================================================

class ProjectStatus(BaseModel):
    """Project status model"""
    id: str
    name: str
    display_order: int
    description: Optional[str] = None
    color_class: str = "bg-gray-100 text-gray-800"
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ProjectStatusCreate(BaseModel):
    """Project status creation model"""
    name: str
    display_order: int
    description: Optional[str] = None
    color_class: Optional[str] = "bg-gray-100 text-gray-800"

class ProjectStatusUpdate(BaseModel):
    """Project status update model"""
    name: Optional[str] = None
    display_order: Optional[int] = None
    description: Optional[str] = None
    color_class: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/statuses", response_model=List[ProjectStatus])
async def get_project_statuses(
    current_user: User = Depends(get_current_user)
):
    """Get all project statuses ordered by display_order"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_statuses")\
            .select("*")\
            .eq("is_active", True)\
            .order("display_order", desc=False)\
            .execute()
        
        if result.data:
            return result.data
        
        return []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project statuses: {str(e)}"
        )

@router.post("/statuses", response_model=ProjectStatus)
async def create_project_status(
    status_data: ProjectStatusCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new project status"""
    try:
        supabase = get_supabase_client()
        
        # Check if name already exists
        existing = supabase.table("project_statuses")\
            .select("id")\
            .eq("name", status_data.name)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project status with name '{status_data.name}' already exists"
            )
        
        # Check if display_order already exists
        existing_order = supabase.table("project_statuses")\
            .select("id")\
            .eq("display_order", status_data.display_order)\
            .execute()
        
        if existing_order.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Project status with display_order '{status_data.display_order}' already exists"
            )
        
        # Create new status
        result = supabase.table("project_statuses")\
            .insert({
                "name": status_data.name,
                "display_order": status_data.display_order,
                "description": status_data.description,
                "color_class": status_data.color_class or "bg-gray-100 text-gray-800",
                "is_active": True
            })\
            .execute()
        
        if result.data:
            return result.data[0]
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create project status"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project status: {str(e)}"
        )

@router.put("/statuses/{status_id}", response_model=ProjectStatus)
async def update_project_status_item(
    status_id: str,
    status_data: ProjectStatusUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a project status"""
    try:
        supabase = get_supabase_client()
        
        # Check if status exists
        existing = supabase.table("project_statuses")\
            .select("*")\
            .eq("id", status_id)\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project status not found"
            )
        
        # Check name uniqueness if name is being updated
        if status_data.name:
            name_check = supabase.table("project_statuses")\
                .select("id")\
                .eq("name", status_data.name)\
                .neq("id", status_id)\
                .execute()
            
            if name_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Project status with name '{status_data.name}' already exists"
                )
        
        # Check display_order uniqueness if order is being updated
        # Note: We allow temporary conflicts during shifting operations
        # The frontend handles shifting statuses before creating/updating
        if status_data.display_order is not None:
            order_check = supabase.table("project_statuses")\
                .select("id")\
                .eq("display_order", status_data.display_order)\
                .neq("id", status_id)\
                .execute()
            
            if order_check.data:
                # If we're just incrementing by 1 (likely a shift operation), allow it
                # by first shifting the conflicting status
                current_order = existing.data[0].get('display_order')
                if current_order is not None and status_data.display_order == current_order + 1:
                    # This is likely a shift operation, check if we can shift the conflicting status
                    conflicting_status = order_check.data[0]
                    # Try to shift the conflicting status up by 1
                    try:
                        supabase.table("project_statuses")\
                            .update({"display_order": status_data.display_order + 1})\
                            .eq("id", conflicting_status['id'])\
                            .execute()
                    except:
                        # If shift fails, raise the original error
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project status with display_order '{status_data.display_order}' already exists"
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Project status with display_order '{status_data.display_order}' already exists"
                    )
        
        # Build update data
        update_data = {}
        if status_data.name is not None:
            update_data["name"] = status_data.name
        if status_data.display_order is not None:
            update_data["display_order"] = status_data.display_order
        if status_data.description is not None:
            update_data["description"] = status_data.description
        if status_data.color_class is not None:
            update_data["color_class"] = status_data.color_class
        if status_data.is_active is not None:
            update_data["is_active"] = status_data.is_active
        
        # Update status
        result = supabase.table("project_statuses")\
            .update(update_data)\
            .eq("id", status_id)\
            .execute()
        
        if result.data:
            return result.data[0]
        
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

@router.delete("/statuses/{status_id}")
async def delete_project_status(
    status_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a project status permanently from database"""
    try:
        supabase = get_supabase_client()
        
        # Check if status exists
        existing = supabase.table("project_statuses")\
            .select("*")\
            .eq("id", status_id)\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project status not found"
            )
        
        # Check if any projects are using this status
        projects_using_status = supabase.table("projects")\
            .select("id")\
            .eq("status_id", status_id)\
            .limit(1)\
            .execute()
        
        if projects_using_status.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete project status that is in use by projects"
            )
        
        # Hard delete - permanently remove from database
        result = supabase.table("project_statuses")\
            .delete()\
            .eq("id", status_id)\
            .execute()
        
        if result.data:
            return {"message": "Project status deleted successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete project status"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project status: {str(e)}"
        )

def check_user_has_project_access(supabase, current_user: User, project_id: Optional[str]) -> bool:
    """Check if user has access to a specific project"""
    if not project_id:
        return True  # No project_id means no restriction
    
    # Admin and accountant have access to all projects
    if current_user.role in ["admin", "accountant"]:
        return True
    
    # Check if user is in project_team for this project
    team_query = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active")
    
    # Match by user_id or email
    or_conditions = []
    if current_user.id:
        or_conditions.append(f"user_id.eq.{current_user.id}")
    if current_user.email:
        or_conditions.append(f"email.eq.{current_user.email}")
    
    if or_conditions:
        if len(or_conditions) > 1:
            team_query = team_query.or_(",".join(or_conditions))
        else:
            condition = or_conditions[0]
            if condition.startswith("user_id.eq."):
                team_query = team_query.eq("user_id", current_user.id)
            elif condition.startswith("email.eq."):
                team_query = team_query.eq("email", current_user.email)
        
        team_result = team_query.execute()
        return len(team_result.data) > 0
    
    return False

# ============================================================================
# Project Categories Routes - Must be defined BEFORE /{project_id} route
# ============================================================================
# Note: Categories routes are handled by project_categories router at /api/projects/categories
# This comment ensures /categories doesn't conflict with /{project_id}
# The actual routes are in routers/project_categories.py

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific project by ID. Only accessible if user is in project_team for that project, except for admin and accountant."""
    try:
        supabase = get_supabase_client()
        
        # Get project data first
        result = supabase.table("projects").select("*").eq("id", project_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = result.data[0]
        
        # Check if user has access to this project
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
        # Get customer, manager, and category data separately
        customer_name = None
        manager_name = None
        category_name = None
        category_color = None
        
        if project.get('customer_id'):
            customer_result = supabase.table("customers").select("name").eq("id", project['customer_id']).execute()
            if customer_result.data:
                customer_name = customer_result.data[0]['name']
        
        if project.get('manager_id'):
            manager_result = supabase.table("employees").select("first_name, last_name").eq("id", project['manager_id']).execute()
            if manager_result.data:
                manager_data = manager_result.data[0]
                manager_name = f"{manager_data.get('first_name', '')} {manager_data.get('last_name', '')}".strip()
        
        if project.get('category_id'):
            category_result = supabase.table("project_categories").select("name, color").eq("id", project['category_id']).execute()
            if category_result.data:
                category_name = category_result.data[0].get('name')
                category_color = category_result.data[0].get('color')
        
        # Process data to add customer_name, manager_name, and category info
        project_data = dict(project)
        project_data['customer_name'] = customer_name
        project_data['manager_name'] = manager_name
        project_data['category_name'] = category_name
        project_data['category_color'] = category_color
        
        return Project(**project_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )

@router.get("/by-customer/{customer_id}")
async def get_projects_by_customer(
    customer_id: str,
    status: Optional[str] = Query(None, description="Filter by project status"),
    current_user: User = Depends(get_current_user)
):
    """Get projects for a specific customer - used for dropdown selection in forms"""
    try:
        supabase = get_supabase_client()
        
        # Verify customer exists
        customer_result = supabase.table("customers").select("id, name").eq("id", customer_id).execute()
        if not customer_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        customer = customer_result.data[0]
        
        # Get projects for this customer - filter by project_team access
        if current_user.role in ["admin", "accountant"]:
            # Admin and accountant see all projects
            query = supabase.table("projects").select("id, project_code, name, status, start_date, end_date").eq("customer_id", customer_id)
        else:
            # Non-admin users: only see projects where they are in project_team
            team_query = supabase.table("project_team").select("project_id").eq("status", "active")
            
            or_conditions = []
            if current_user.id:
                or_conditions.append(f"user_id.eq.{current_user.id}")
            if current_user.email:
                or_conditions.append(f"email.eq.{current_user.email}")
            
            if not or_conditions:
                return {
                    "customer": {
                        "id": customer["id"],
                        "name": customer["name"]
                    },
                    "projects": [],
                    "count": 0
                }
            
            if len(or_conditions) > 1:
                team_query = team_query.or_(",".join(or_conditions))
            else:
                condition = or_conditions[0]
                if condition.startswith("user_id.eq."):
                    team_query = team_query.eq("user_id", current_user.id)
                elif condition.startswith("email.eq."):
                    team_query = team_query.eq("email", current_user.email)
            
            team_result = team_query.execute()
            
            if not team_result.data:
                return {
                    "customer": {
                        "id": customer["id"],
                        "name": customer["name"]
                    },
                    "projects": [],
                    "count": 0
                }
            
            project_ids = list(set([member["project_id"] for member in team_result.data]))
            
            if not project_ids:
                return {
                    "customer": {
                        "id": customer["id"],
                        "name": customer["name"]
                    },
                    "projects": [],
                    "count": 0
                }
            
            query = supabase.table("projects").select("id, project_code, name, status, start_date, end_date").eq("customer_id", customer_id).in_("id", project_ids)
        
        if status:
            query = query.eq("status", status)
        
        # Only get active projects for dropdown selection
        if not status:
            query = query.in_("status", ["planning", "active"])
        
        result = query.order("name").execute()
        
        return {
            "customer": {
                "id": customer["id"],
                "name": customer["name"]
            },
            "projects": [
                {
                    "id": project["id"],
                    "project_code": project["project_code"],
                    "name": project["name"],
                    "status": project["status"],
                    "start_date": project["start_date"],
                    "end_date": project["end_date"]
                }
                for project in result.data
            ],
            "count": len(result.data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects for customer: {str(e)}"
        )

@router.get("/dropdown-options/{customer_id}")
async def get_project_dropdown_options(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get project dropdown options for a specific customer. Only shows projects where user is in project_team, except for admin and accountant who see all projects."""
    try:
        supabase = get_supabase_client()
        
        # Get projects for customer with basic info for dropdown - filter by project_team access
        if current_user.role in ["admin", "accountant"]:
            # Admin and accountant see all projects
            projects_result = supabase.table("projects").select(
                "id, project_code, name, status"
            ).eq("customer_id", customer_id).in_("status", ["planning", "active"]).execute()
        else:
            # Non-admin users: only see projects where they are in project_team
            team_query = supabase.table("project_team").select("project_id").eq("status", "active")
            
            or_conditions = []
            if current_user.id:
                or_conditions.append(f"user_id.eq.{current_user.id}")
            if current_user.email:
                or_conditions.append(f"email.eq.{current_user.email}")
            
            if not or_conditions:
                return []
            
            if len(or_conditions) > 1:
                team_query = team_query.or_(",".join(or_conditions))
            else:
                condition = or_conditions[0]
                if condition.startswith("user_id.eq."):
                    team_query = team_query.eq("user_id", current_user.id)
                elif condition.startswith("email.eq."):
                    team_query = team_query.eq("email", current_user.email)
            
            team_result = team_query.execute()
            
            if not team_result.data:
                return []
            
            project_ids = list(set([member["project_id"] for member in team_result.data]))
            
            if not project_ids:
                return []
            
            projects_result = supabase.table("projects").select(
                "id, project_code, name, status"
            ).eq("customer_id", customer_id).in_("id", project_ids).in_("status", ["planning", "active"]).execute()
        
        return projects_result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project dropdown options: {str(e)}"
        )

@router.get("/validate-project-customer")
async def validate_project_customer(
    project_id: str,
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Validate that a project belongs to a specific customer"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists and belongs to customer
        result = supabase.table("projects").select("id, name, customer_id").eq("id", project_id).eq("customer_id", customer_id).execute()
        
        if not result.data:
            return {
                "valid": False,
                "message": "Project not found or does not belong to the specified customer"
            }
        
        project = result.data[0]
        return {
            "valid": True,
            "project": {
                "id": project["id"],
                "name": project["name"],
                "customer_id": project["customer_id"]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate project-customer relationship: {str(e)}"
        )

@router.post("/", response_model=Project)
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
        
        # Convert date objects to strings for JSON serialization
        if 'start_date' in project_dict and isinstance(project_dict['start_date'], date):
            project_dict['start_date'] = project_dict['start_date'].isoformat()
        if 'end_date' in project_dict and isinstance(project_dict['end_date'], date):
            project_dict['end_date'] = project_dict['end_date'].isoformat()
            
        # Convert enum objects to strings for JSON serialization
        if 'status' in project_dict and hasattr(project_dict['status'], 'value'):
            project_dict['status'] = project_dict['status'].value
        if 'priority' in project_dict and hasattr(project_dict['priority'], 'value'):
            project_dict['priority'] = project_dict['priority'].value
        
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

@router.put("/{project_id}", response_model=Project)
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
        
        # Convert date objects to strings for JSON serialization
        if 'start_date' in update_data and isinstance(update_data['start_date'], date):
            update_data['start_date'] = update_data['start_date'].isoformat()
        if 'end_date' in update_data and isinstance(update_data['end_date'], date):
            update_data['end_date'] = update_data['end_date'].isoformat()
        
        # Convert enum objects to strings for JSON serialization
        if 'status' in update_data and hasattr(update_data['status'], 'value'):
            update_data['status'] = update_data['status'].value
        if 'priority' in update_data and hasattr(update_data['priority'], 'value'):
            update_data['priority'] = update_data['priority'].value
        
        # Auto-update status based on progress (only if status_id is not being updated)
        # If status_id is provided, respect it and don't auto-update status enum
        if 'progress' in update_data and 'status_id' not in update_data:
            progress = update_data['progress']
            # Get current project status
            current_project = supabase.table("projects").select("status").eq("id", project_id).execute()
            current_status = current_project.data[0]['status'] if current_project.data else 'planning'
            
            # Auto-change status based on progress (only for legacy status enum)
            if progress > 0 and current_status == 'planning':
                update_data['status'] = 'active'
            elif progress >= 100 and current_status not in ['completed', 'cancelled']:
                update_data['status'] = 'completed'
        
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

@router.get("/{project_id}/time-entries", response_model=List[TimeEntry])
async def get_project_time_entries(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get time entries for a project. Only accessible if user is in project_team for that project, except for admin and accountant."""
    try:
        supabase = get_supabase_client()
        
        # Check if user has access to this project
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
            )
        
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

@router.post("/{project_id}/time-entries", response_model=TimeEntry)
async def create_time_entry(
    project_id: str,
    time_entry_data: TimeEntryCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new time entry for a project. Only accessible if user is in project_team for that project, except for admin and accountant."""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Check if user has access to this project
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this project"
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

@router.get("/{project_id}/profitability")
async def get_project_profitability(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive project profitability analysis including all revenue and cost sources"""
    try:
        supabase = get_supabase_client()
        
        # Get project details for authorization check
        project_result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = project_result.data[0]
        
        # Object Level Authorization (BOLA) check
        # Check if user has access to this project via project_team membership
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this project's financial data"
            )
        
        # Use service layer for calculations
        service = ProjectProfitabilityService()
        profitability_data = await service.calculate_project_profitability(project_id)
        
        if not profitability_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return profitability_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate profitability: {str(e)}"
        )

@router.get("/stats/overview")
async def get_project_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get project statistics overview"""
    try:
        supabase = get_supabase_client()
        
        # Get project statistics with date filtering
        project_query = supabase.table("projects").select("*")
        
        # Apply date filters using native Supabase methods
        if start_date and end_date:
            project_query = project_query.gte("start_date", start_date.isoformat()).lte("start_date", end_date.isoformat())
        elif start_date:
            project_query = project_query.gte("start_date", start_date.isoformat())
        elif end_date:
            project_query = project_query.lte("start_date", end_date.isoformat())
        
        projects = project_query.execute()
        
        # Calculate statistics
        total_projects = len(projects.data)
        
        # Count projects by status
        status_counts = {}
        for project in projects.data:
            status = project["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Calculate total budget and actual revenue/costs
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
        
        # Get total revenue (invoices + sales receipts)
        total_revenue = 0
        if project_ids:
            invoices = supabase.table("invoices").select("total_amount").in_("project_id", project_ids).execute()
            sales_receipts = supabase.table("sales_receipts").select("total_amount").in_("project_id", project_ids).execute()
            total_revenue = sum(inv["total_amount"] for inv in invoices.data) + sum(sr["total_amount"] for sr in sales_receipts.data)
        
        total_actual_cost = total_labor_cost + total_expenses
        total_profit = total_revenue - total_actual_cost  # Revenue - Cost, not Budget - Cost
        
        return {
            "total_projects": total_projects,
            "by_status": status_counts,
            "total_budget": total_budget,
            "total_revenue": total_revenue,
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

@router.get("/profitability/comparison")
async def get_projects_profitability_comparison(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("profit_margin", description="Sort by: profit_margin, total_profit, revenue, costs"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive profitability comparison across all projects"""
    try:
        # Use service layer for calculations
        service = ProjectProfitabilityService()
        
        # Build filters
        filters = {}
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        if status:
            filters["status"] = status
        
        comparison_data = await service.calculate_projects_comparison(filters)
        
        # Sort projects
        reverse_order = sort_order.lower() == "desc"
        if sort_by == "profit_margin":
            comparison_data["projects"].sort(key=lambda x: x["profitability"]["gross_profit_margin"], reverse=reverse_order)
        elif sort_by == "total_profit":
            comparison_data["projects"].sort(key=lambda x: x["profitability"]["gross_profit"], reverse=reverse_order)
        elif sort_by == "revenue":
            comparison_data["projects"].sort(key=lambda x: x["revenue"]["total"], reverse=reverse_order)
        elif sort_by == "costs":
            comparison_data["projects"].sort(key=lambda x: x["costs"]["total"], reverse=reverse_order)
        
        # Update summary with sorted results
        if comparison_data["projects"]:
            comparison_data["summary"]["most_profitable"] = comparison_data["projects"][0] if sort_by == "profit_margin" and sort_order == "desc" else None
            comparison_data["summary"]["least_profitable"] = comparison_data["projects"][-1] if sort_by == "profit_margin" and sort_order == "desc" else None
        
        comparison_data["filters_applied"] = {
            "start_date": start_date,
            "end_date": end_date,
            "status": status,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        return comparison_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects profitability comparison: {str(e)}"
        )

@router.get("/{project_id}/detailed-report")
async def get_project_detailed_report(
    project_id: str,
    include_transactions: bool = Query(True, description="Include detailed transaction breakdown"),
    current_user: User = Depends(get_current_user)
):
    """Get detailed project report with all transactions and financial breakdown"""
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
        
        # Object Level Authorization (BOLA) check
        # Check if user has access to this project via project_team membership
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this project's detailed report"
            )
        
        # Get customer and manager details
        customer = None
        manager = None
        
        if project["customer_id"]:
            customer_result = supabase.table("customers").select("name, email, phone").eq("id", project["customer_id"]).execute()
            customer = customer_result.data[0] if customer_result.data else None
        
        if project["manager_id"]:
            manager_result = supabase.table("employees").select("first_name, last_name, email").eq("id", project["manager_id"]).execute()
            manager = manager_result.data[0] if manager_result.data else None
        
        # Get all transactions if requested
        transactions = {
            "invoices": [],
            "sales_receipts": [],
            "time_entries": [],
            "expenses": [],
            "bills": []
        }
        
        if include_transactions:
            # Get invoices
            invoices = supabase.table("invoices").select("*").eq("project_id", project_id).execute()
            transactions["invoices"] = invoices.data
            
            # Get sales receipts
            sales_receipts = supabase.table("sales_receipts").select("*").eq("project_id", project_id).execute()
            transactions["sales_receipts"] = sales_receipts.data
            
            # Get time entries
            time_entries = supabase.table("time_entries").select("*").eq("project_id", project_id).execute()
            transactions["time_entries"] = time_entries.data
            
            # Get expenses
            expenses = supabase.table("expenses").select("*").eq("project_id", project_id).execute()
            transactions["expenses"] = expenses.data
            
            # Get bills
            bills = supabase.table("bills").select("*").eq("project_id", project_id).execute()
            transactions["bills"] = bills.data
        
        # Calculate financial summary
        total_revenue = sum(inv["total_amount"] for inv in transactions["invoices"]) + sum(sr["total_amount"] for sr in transactions["sales_receipts"])
        total_paid_revenue = sum(inv["paid_amount"] for inv in transactions["invoices"]) + sum(sr["total_amount"] for sr in transactions["sales_receipts"])
        
        total_labor_cost = sum(te["hours_worked"] * (te["hourly_rate"] or 0) for te in transactions["time_entries"])
        total_expenses = sum(exp["amount"] for exp in transactions["expenses"])
        total_bills = sum(bill["amount"] for bill in transactions["bills"])
        total_costs = total_labor_cost + total_expenses + total_bills
        
        gross_profit = total_revenue - total_costs
        net_profit = total_paid_revenue - total_costs
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            "project": {
                "id": project["id"],
                "project_code": project["project_code"],
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "priority": project["priority"],
                "start_date": project["start_date"],
                "end_date": project["end_date"],
                "budget": project["budget"],
                "progress": project["progress"],
                "created_at": project["created_at"],
                "updated_at": project["updated_at"]
            },
            "stakeholders": {
                "customer": customer,
                "manager": manager
            },
            "financial_summary": {
                "revenue": {
                    "total": total_revenue,
                    "paid": total_paid_revenue,
                    "outstanding": total_revenue - total_paid_revenue
                },
                "costs": {
                    "total": total_costs,
                    "labor": total_labor_cost,
                    "expenses": total_expenses,
                    "bills": total_bills
                },
                "profitability": {
                    "gross_profit": gross_profit,
                    "net_profit": net_profit,
                    "profit_margin": round(profit_margin, 2)
                }
            },
            "transactions": transactions if include_transactions else None,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate project report: {str(e)}"
        )

@router.get("/{project_id}/financial-summary")
async def get_project_financial_summary(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive financial summary for a specific project - for project dashboard"""
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
        
        # Object Level Authorization (BOLA) check
        # Check if user has access to this project via project_team membership
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this project's financial data"
            )
        
        # Get customer information
        customer = None
        if project["customer_id"]:
            customer_result = supabase.table("customers").select("name, email").eq("id", project["customer_id"]).execute()
            customer = customer_result.data[0] if customer_result.data else None
        
        # ============================================================================
        # CALCULATE TOTAL INCOME - Tính tổng doanh thu
        # ============================================================================
        
        # Get all invoices for this project
        invoices = supabase.table("invoices").select("*").eq("project_id", project_id).execute()
        total_invoice_amount = sum(invoice["total_amount"] for invoice in invoices.data)
        total_paid_invoices = sum(invoice["paid_amount"] for invoice in invoices.data)
        
        # Get all sales receipts for this project
        sales_receipts = supabase.table("sales_receipts").select("*").eq("project_id", project_id).execute()
        total_sales_receipts = sum(receipt["total_amount"] for receipt in sales_receipts.data)
        
        # Total Income
        total_income = total_invoice_amount + total_sales_receipts
        total_paid_income = total_paid_invoices + total_sales_receipts
        
        # ============================================================================
        # CALCULATE TOTAL COSTS - Tính tổng chi phí
        # ============================================================================
        
        # Get time entries and calculate labor costs
        time_entries = supabase.table("time_entries").select("*").eq("project_id", project_id).execute()
        total_hours = sum(entry["hours_worked"] for entry in time_entries.data)
        total_labor_cost = 0
        
        for entry in time_entries.data:
            if entry["hourly_rate"]:
                total_labor_cost += entry["hours_worked"] * entry["hourly_rate"]
        
        # Get direct project expenses
        expenses = supabase.table("expenses").select("*").eq("project_id", project_id).execute()
        total_expenses = sum(expense["amount"] for expense in expenses.data)
        
        # Get bills (vendor bills) for this project
        bills = supabase.table("bills").select("*").eq("project_id", project_id).execute()
        total_bills = sum(bill["amount"] for bill in bills.data)
        total_paid_bills = sum(bill["paid_amount"] for bill in bills.data)
        
        # Total Costs
        total_costs = total_labor_cost + total_expenses + total_bills
        
        # ============================================================================
        # CALCULATE PROFIT - Tính lợi nhuận
        # ============================================================================
        
        gross_profit = total_income - total_costs
        net_profit = total_paid_income - total_costs
        
        # Profit margins
        gross_profit_margin = (gross_profit / total_income * 100) if total_income > 0 else 0
        net_profit_margin = (net_profit / total_paid_income * 100) if total_paid_income > 0 else 0
        
        # Budget analysis
        budget = project["budget"] or 0
        budget_variance = budget - total_costs
        budget_utilization = (total_costs / budget * 100) if budget > 0 else 0
        
        # ============================================================================
        # GET RECENT TRANSACTIONS - Lấy giao dịch gần nhất
        # ============================================================================
        
        # Get recent invoices (last 10)
        recent_invoices = supabase.table("invoices").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
        
        # Get recent sales receipts (last 10)
        recent_sales_receipts = supabase.table("sales_receipts").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
        
        # Get recent expenses (last 10)
        recent_expenses = supabase.table("expenses").select("*").eq("project_id", project_id).order("expense_date", desc=True).limit(10).execute()
        
        # Get recent bills (last 10)
        recent_bills = supabase.table("bills").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
        
        # Get recent time entries (last 10)
        recent_time_entries = supabase.table("time_entries").select("*").eq("project_id", project_id).order("date", desc=True).limit(10).execute()
        
        # Combine and sort recent transactions
        recent_transactions = []
        
        # Add invoices
        for invoice in recent_invoices.data:
            recent_transactions.append({
                "type": "invoice",
                "id": invoice["id"],
                "date": invoice["issue_date"],
                "description": f"Invoice {invoice['invoice_number']}",
                "amount": invoice["total_amount"],
                "status": invoice["status"]
            })
        
        # Add sales receipts
        for receipt in recent_sales_receipts.data:
            recent_transactions.append({
                "type": "sales_receipt",
                "id": receipt["id"],
                "date": receipt["issue_date"],
                "description": f"Sales Receipt {receipt['receipt_number']}",
                "amount": receipt["total_amount"],
                "status": "paid"
            })
        
        # Add expenses
        for expense in recent_expenses.data:
            recent_transactions.append({
                "type": "expense",
                "id": expense["id"],
                "date": expense["expense_date"],
                "description": expense["description"],
                "amount": -expense["amount"],  # Negative for costs
                "status": expense["status"]
            })
        
        # Add bills
        for bill in recent_bills.data:
            recent_transactions.append({
                "type": "bill",
                "id": bill["id"],
                "date": bill["issue_date"],
                "description": f"Bill {bill['bill_number']}",
                "amount": -bill["amount"],  # Negative for costs
                "status": bill["status"]
            })
        
        # Sort by date (most recent first)
        recent_transactions.sort(key=lambda x: x["date"], reverse=True)
        recent_transactions = recent_transactions[:10]  # Top 10 most recent
        
        return {
            "project": {
                "id": project["id"],
                "project_code": project["project_code"],
                "name": project["name"],
                "description": project["description"],
                "status": project["status"],
                "priority": project["priority"],
                "start_date": project["start_date"],
                "end_date": project["end_date"],
                "budget": budget,
                "progress": project["progress"]
            },
            "customer": customer,
            "financial_summary": {
                "total_income": total_income,
                "total_paid_income": total_paid_income,
                "outstanding_income": total_income - total_paid_income,
                "total_costs": total_costs,
                "gross_profit": gross_profit,
                "net_profit": net_profit,
                "gross_profit_margin": round(gross_profit_margin, 2),
                "net_profit_margin": round(net_profit_margin, 2)
            },
            "income_breakdown": {
                "invoices": {
                    "total_amount": total_invoice_amount,
                    "paid_amount": total_paid_invoices,
                    "outstanding": total_invoice_amount - total_paid_invoices,
                    "count": len(invoices.data)
                },
                "sales_receipts": {
                    "total_amount": total_sales_receipts,
                    "count": len(sales_receipts.data)
                }
            },
            "costs_breakdown": {
                "labor": {
                    "total_hours": total_hours,
                    "total_cost": total_labor_cost,
                    "average_hourly_rate": total_labor_cost / total_hours if total_hours > 0 else 0
                },
                "expenses": {
                    "total_cost": total_expenses,
                    "count": len(expenses.data)
                },
                "bills": {
                    "total_amount": total_bills,
                    "paid_amount": total_paid_bills,
                    "outstanding": total_bills - total_paid_bills,
                    "count": len(bills.data)
                }
            },
            "budget_analysis": {
                "allocated": budget,
                "actual_costs": total_costs,
                "variance": budget_variance,
                "utilization_percentage": round(budget_utilization, 2)
            },
            "recent_transactions": recent_transactions,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project financial summary: {str(e)}"
        )

@router.get("/{project_id}/dashboard")
async def get_project_dashboard(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get project dashboard with key metrics and recent activity"""
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
        
        # Object Level Authorization (BOLA) check
        # Check if user has access to this project via project_team membership
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this project's dashboard"
            )
        
        # Get recent transactions (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).date()
        
        recent_invoices = supabase.table("invoices").select("*").eq("project_id", project_id).gte("issue_date", thirty_days_ago).execute()
        recent_time_entries = supabase.table("time_entries").select("*").eq("project_id", project_id).gte("date", thirty_days_ago).execute()
        recent_expenses = supabase.table("expenses").select("*").eq("project_id", project_id).gte("expense_date", thirty_days_ago).execute()
        
        # Calculate quick metrics
        total_hours_this_month = sum(te["hours_worked"] for te in recent_time_entries.data)
        total_expenses_this_month = sum(exp["amount"] for exp in recent_expenses.data)
        total_invoices_this_month = sum(inv["total_amount"] for inv in recent_invoices.data)
        
        # Get project team (employees who have logged time)
        team_members = supabase.table("time_entries").select("employee_id").eq("project_id", project_id).execute()
        unique_employees = list(set(te["employee_id"] for te in team_members.data if te["employee_id"]))
        
        return {
            "project": {
                "id": project["id"],
                "name": project["name"],
                "status": project["status"],
                "progress": project["progress"],
                "start_date": project["start_date"],
                "end_date": project["end_date"]
            },
            "this_month": {
                "hours_logged": total_hours_this_month,
                "expenses": total_expenses_this_month,
                "invoices": total_invoices_this_month,
                "team_members": len(unique_employees)
            },
            "recent_activity": {
                "invoices": recent_invoices.data[:5],  # Last 5 invoices
                "time_entries": recent_time_entries.data[:10],  # Last 10 time entries
                "expenses": recent_expenses.data[:5]  # Last 5 expenses
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project dashboard: {str(e)}"
        )

@router.put("/{project_id}/status")
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