"""
Project Management Router
Handles project CRUD, status tracking, time tracking, and profitability analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
import asyncio
import re
import logging
from pydantic import BaseModel

from models.project import Project, ProjectCreate, ProjectUpdate
from models.user import User, UserRole
from utils.auth import get_current_user, require_manager_or_admin, security
from services.supabase_client import get_supabase_client
from services.project_profitability_service import ProjectProfitabilityService
from services.project_default_tasks_service import create_default_tasks_for_project
from services.notification_service import notification_service

router = APIRouter()
logger = logging.getLogger(__name__)

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
        
        # Apply pagination first
        result = query.range(skip, skip + limit - 1).execute()
        
        # Get all project IDs to fetch their categories
        project_ids = [p['id'] for p in result.data] if result.data else []
        
        # Fetch all categories for these projects
        project_categories_map = {}
        if project_ids:
            if category_id:
                # Filter by category through project_category_members
                category_members_result = supabase.table("project_category_members")\
                    .select("project_id, project_categories(id, name, color, code)")\
                    .eq("category_id", category_id)\
                    .in_("project_id", project_ids)\
                    .execute()
            else:
                # Get all categories for these projects
                category_members_result = supabase.table("project_category_members")\
                    .select("project_id, project_categories(id, name, color, code)")\
                    .in_("project_id", project_ids)\
                    .execute()
            
            # Build map: project_id -> list of categories
            for member in (category_members_result.data or []):
                project_id = member.get('project_id')
                category = member.get('project_categories')
                if project_id and category:
                    if project_id not in project_categories_map:
                        project_categories_map[project_id] = []
                    project_categories_map[project_id].append({
                        'id': category.get('id'),
                        'name': category.get('name'),
                        'color': category.get('color'),
                        'code': category.get('code')
                    })
        
        # Filter projects by category if needed
        if category_id:
            filtered_project_ids = set(project_categories_map.keys())
            result.data = [p for p in result.data if p['id'] in filtered_project_ids]
        
        # Process data to add customer_name, manager_name, and categories info
        processed_projects = []
        for project in result.data:
            project_data = dict(project)
            project_data['customer_name'] = project.get('customers', {}).get('name') if project.get('customers') else None
            project_data['manager_name'] = f"{project.get('employees', {}).get('first_name', '')} {project.get('employees', {}).get('last_name', '')}".strip() if project.get('employees') else None
            
            # Add primary category information (backward compatibility)
            category = project.get('project_categories')
            if category:
                project_data['category_name'] = category.get('name')
                project_data['category_color'] = category.get('color')
            else:
                project_data['category_name'] = None
                project_data['category_color'] = None
            
            # Add all categories from project_category_members
            project_id = project.get('id')
            project_data['categories'] = project_categories_map.get(project_id, [])
            
            # Fix invalid date formats (e.g., '12026-03-10' -> '2026-03-10')
            def fix_invalid_date(date_value):
                """Fix invalid date format if year is too long (e.g., 12026 -> 2026)"""
                if not date_value:
                    return date_value
                date_str = str(date_value)
                try:
                    # Check if date string has invalid year (more than 4 digits)
                    if '-' in date_str:
                        parts = date_str.split('-')
                        if len(parts) == 3 and len(parts[0]) > 4:
                            # Year is too long, fix it
                            year_str = parts[0]
                            # Remove leading '1' if year starts with '1' and is too long
                            if year_str.startswith('1') and len(year_str) > 4:
                                year = year_str.lstrip('1')[:4]
                                if len(year) < 4:
                                    # If still invalid, try to extract valid 4-digit year
                                    year = year_str[-4:] if len(year_str) >= 4 else '2026'
                                # Ensure year is reasonable (1900-2100)
                                try:
                                    year_int = int(year)
                                    if year_int < 1900 or year_int > 2100:
                                        year = '2026'  # Default to 2026 if out of range
                                except:
                                    year = '2026'
                                return f"{year}-{parts[1]}-{parts[2]}"
                except:
                    pass
                return date_value
            
            if 'start_date' in project_data:
                project_data['start_date'] = fix_invalid_date(project_data['start_date'])
            
            if 'end_date' in project_data:
                project_data['end_date'] = fix_invalid_date(project_data['end_date'])
            
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
        print(f"[DEBUG] Debug auth endpoint called with token: {bool(token)}")
        return {
            "success": True,
            "token_length": len(token),
            "token_preview": token[:20] + "..." if len(token) > 20 else token
        }
    except Exception as e:
        print(f"[DEBUG] Debug auth error: {str(e)}")
        return {"error": str(e)}

@router.get("/auth/me", response_model=dict)
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    auth_header = request.headers.get("authorization", "")
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "is_active": current_user.is_active,
        "authenticated": True,
        "auth_header_present": bool(auth_header),
        "auth_header_preview": auth_header[:20] + "..." if auth_header else None,
        "request_headers": dict(request.headers)
    }

@router.post("/auth/test-progress-update")
async def test_progress_update(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Test the exact same logic as progress update"""
    project_id = "6bf71318-f57f-405f-b137-f6770c99cd01"

    print("=== TESTING PROGRESS UPDATE ===")
    print(f"User: {current_user.email} (ID: {current_user.id})")
    print(f"Project ID: {project_id}")
    print(f"Request headers: {dict(request.headers)}")

    # Check project access
    from services.supabase_client import get_supabase_client
    supabase = get_supabase_client()

    has_project_access = check_user_has_project_access(supabase, current_user, project_id)
    print(f"Has project access: {has_project_access}")

    # Check progress permission
    has_progress_permission = check_user_can_update_progress(supabase, current_user, project_id)
    print(f"Has progress permission: {has_progress_permission}")

    # Check if project exists
    try:
        existing = supabase.table("projects").select("id, name").eq("id", project_id).execute()
        project_exists = len(existing.data) > 0
        project_name = existing.data[0]["name"] if project_exists else "Unknown"
        print(f"Project exists: {project_exists} (Name: {project_name})")
    except Exception as e:
        print(f"Error checking project: {e}")
        project_exists = False

    result = {
        "test_passed": has_project_access and has_progress_permission and project_exists,
        "user_info": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        },
        "permissions": {
            "project_access": has_project_access,
            "progress_permission": has_progress_permission,
            "project_exists": project_exists,
        },
        "debug": {
            "project_id": project_id,
            "auth_header": request.headers.get("authorization", "")[:20] + "..." if request.headers.get("authorization") else None,
        }
    }

    print(f"Test result: {'PASSED' if result['test_passed'] else 'FAILED'}")
    print("===============================")

    return result

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
    category_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ProjectStatusCreate(BaseModel):
    """Project status creation model"""
    name: str
    display_order: int
    description: Optional[str] = None
    color_class: Optional[str] = "bg-gray-100 text-gray-800"
    category_id: Optional[str] = None

class ProjectStatusUpdate(BaseModel):
    """Project status update model"""
    name: Optional[str] = None
    display_order: Optional[int] = None
    description: Optional[str] = None
    color_class: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[str] = None

@router.get("/statuses", response_model=List[ProjectStatus])
async def get_project_statuses(
    category_id: Optional[str] = Query(None, description="Filter by category ID. Returns global statuses (category_id IS NULL) and statuses for this category"),
    current_user: User = Depends(get_current_user)
):
    """Get all project statuses ordered by display_order. 
    If category_id is provided, returns global statuses (category_id IS NULL) and statuses for that category.
    If category_id is not provided, returns all active statuses."""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("project_statuses")\
            .select("*")\
            .eq("is_active", True)
        
        # If category_id is provided, filter to show:
        # 1. Global statuses (category_id IS NULL)
        # 2. Statuses for the specified category
        if category_id:
            # Use OR condition: category_id IS NULL OR category_id = provided_id
            # Supabase doesn't support OR directly, so we'll filter in Python
            result = query.order("display_order", desc=False).execute()
            
            if result.data:
                # Filter in Python: keep global statuses and statuses for this category
                filtered_data = [
                    status for status in result.data
                    if status.get("category_id") is None or status.get("category_id") == category_id
                ]
                return filtered_data
            
            return []
        else:
            # No category filter: return all active statuses
            result = query.order("display_order", desc=False).execute()
            
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
        
        # Check if display_order already exists and shift if needed
        # Database has UNIQUE constraint on display_order globally
        existing_order = supabase.table("project_statuses")\
            .select("id, name, display_order")\
            .eq("display_order", status_data.display_order)\
            .execute()
        
        if existing_order.data:
            # Shift all statuses with display_order >= new order up by 1
            statuses_to_shift = supabase.table("project_statuses")\
                .select("id, display_order")\
                .gte("display_order", status_data.display_order)\
                .order("display_order", desc=True)\
                .execute()
            
            if statuses_to_shift.data:
                # Shift each status up by 1 (in descending order to avoid conflicts)
                for status_to_shift in statuses_to_shift.data:
                    try:
                        supabase.table("project_statuses")\
                            .update({"display_order": status_to_shift["display_order"] + 1})\
                            .eq("id", status_to_shift["id"])\
                            .execute()
                    except Exception as shift_error:
                        # If shift fails, raise error
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Failed to shift existing statuses: {str(shift_error)}"
                        )
        
        # Create new status
        # Extract color hex from color_class or use default
        color_class = status_data.color_class or "bg-gray-100 text-gray-800"
        # Map common Tailwind color classes to hex values
        color_map = {
            "bg-gray-100": "#f3f4f6",
            "bg-gray-200": "#e5e7eb",
            "bg-blue-100": "#dbeafe",
            "bg-blue-200": "#bfdbfe",
            "bg-green-100": "#dcfce7",
            "bg-green-200": "#bbf7d0",
            "bg-yellow-100": "#fef3c7",
            "bg-yellow-200": "#fde68a",
            "bg-red-100": "#fee2e2",
            "bg-red-200": "#fecaca",
            "bg-purple-100": "#f3e8ff",
            "bg-purple-200": "#e9d5ff",
        }
        # Extract first color class (before space)
        first_color_class = color_class.split()[0] if color_class else "bg-gray-100"
        color_hex = color_map.get(first_color_class, "#6b7280")  # Default gray
        
        status_dict = {
            "name": status_data.name,
            "display_order": status_data.display_order,
            "description": status_data.description,
            "color_class": color_class,
            "color": color_hex,  # Add required color field
            "is_active": True
        }
        if status_data.category_id:
            status_dict["category_id"] = status_data.category_id
        
        result = supabase.table("project_statuses")\
            .insert(status_dict)\
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
        # Database has UNIQUE constraint on display_order, so we need to handle conflicts
        if status_data.display_order is not None:
            current_order = existing.data[0].get('display_order')
            new_order = status_data.display_order
            
            # Only check if order is actually changing
            if new_order != current_order:
                order_check = supabase.table("project_statuses")\
                    .select("id, display_order")\
                    .eq("display_order", new_order)\
                    .neq("id", status_id)\
                    .execute()
                
                if order_check.data:
                    # Found conflict - try to shift the conflicting status
                    conflicting_status = order_check.data[0]
                    conflicting_id = conflicting_status['id']
                    conflicting_order = conflicting_status['display_order']
                    
                    # Calculate new order for conflicting status
                    # If moving forward, shift conflicting status forward
                    # If moving backward, shift conflicting status backward
                    if new_order > current_order:
                        # Moving forward - shift conflicting status forward
                        shift_to = conflicting_order + 1
                    else:
                        # Moving backward - shift conflicting status backward
                        shift_to = conflicting_order - 1
                    
                    # Try to shift the conflicting status
                    try:
                        supabase.table("project_statuses")\
                            .update({"display_order": shift_to})\
                            .eq("id", conflicting_id)\
                            .execute()
                    except Exception as shift_error:
                        # If shift fails, raise error
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot update display_order to {new_order}. Another status already uses this order and cannot be shifted."
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
            # Also update color when color_class changes
            color_map = {
                "bg-gray-100": "#f3f4f6",
                "bg-gray-200": "#e5e7eb",
                "bg-blue-100": "#dbeafe",
                "bg-blue-200": "#bfdbfe",
                "bg-green-100": "#dcfce7",
                "bg-green-200": "#bbf7d0",
                "bg-yellow-100": "#fef3c7",
                "bg-yellow-200": "#fde68a",
                "bg-red-100": "#fee2e2",
                "bg-red-200": "#fecaca",
                "bg-purple-100": "#f3e8ff",
                "bg-purple-200": "#e9d5ff",
            }
            first_color_class = status_data.color_class.split()[0] if status_data.color_class else "bg-gray-100"
            update_data["color"] = color_map.get(first_color_class, "#6b7280")
        if status_data.is_active is not None:
            update_data["is_active"] = status_data.is_active
        if status_data.category_id is not None:
            update_data["category_id"] = status_data.category_id
        
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
        
        # Get the display_order of the status being deleted
        deleted_order = existing.data[0].get('display_order')
        
        # Hard delete - permanently remove from database
        result = supabase.table("project_statuses")\
            .delete()\
            .eq("id", status_id)\
            .execute()
        
        if result.data and deleted_order is not None:
            # Shift all statuses with display_order > deleted_order down by 1
            statuses_to_shift = supabase.table("project_statuses")\
                .select("id, display_order")\
                .gt("display_order", deleted_order)\
                .order("display_order", desc=False)\
                .execute()
            
            if statuses_to_shift.data:
                # Shift each status down by 1 (in ascending order)
                for status_to_shift in statuses_to_shift.data:
                    try:
                        supabase.table("project_statuses")\
                            .update({"display_order": status_to_shift["display_order"] - 1})\
                            .eq("id", status_to_shift["id"])\
                            .execute()
                    except Exception as shift_error:
                        # Log error but don't fail the delete operation
                        print(f"Warning: Failed to shift status {status_to_shift['id']}: {str(shift_error)}")
        
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
    # Query separately for user_id and email to avoid .or_() issues
    try:
        # Try querying by user_id first
        if current_user.id:
            team_result = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("user_id", current_user.id).execute()
            if len(team_result.data) > 0:
                return True
        
        # Try querying by email
        if current_user.email:
            team_result = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("email", current_user.email).execute()
            if len(team_result.data) > 0:
                return True
        
        return False
    except Exception as e:
        # Log error but don't crash - return False to deny access on error
        print(f"[ERROR] check_user_has_project_access failed: {str(e)}")
        return False

def _get_checklist_group_for_status(status_name: str) -> Optional[str]:
    """
    Map project status name to checklist group name
    
    Args:
        status_name: Project status name (e.g., "THỎA THUẬN", "XƯỞNG SẢN XUẤT")
    
    Returns:
        Checklist group name (e.g., "Kế hoạch", "Sản xuất") or None
    """
    status_to_group = {
        "THỎA THUẬN": "Kế hoạch",
        "XƯỞNG SẢN XUẤT": "Sản xuất",
        "VẬN CHUYỂN": "Vận chuyển / lắp đặt",
        "LẮP ĐẶT": "Vận chuyển / lắp đặt",
        "CHĂM SÓC KHÁCH HÀNG": "Chăm sóc khách hàng",
        "BÁO CÁO / SỬA CHỮA": "Chăm sóc khách hàng",
        "HOÀN THÀNH": "Chăm sóc khách hàng",
    }
    # Case-insensitive lookup
    status_name_upper = status_name.strip().upper()
    return status_to_group.get(status_name_upper)


def _auto_assign_checklist_permissions_for_status(supabase, project_id: str, status_name: str):
    """
    Tự động gán quyền quản lý checklist items cho nhân viên accountable của trạng thái mới
    
    Logic:
    - Khi chuyển trạng thái dự án, tìm nhân viên accountable cho trạng thái đó
    - Tìm checklist group tương ứng với trạng thái
    - Gán quyền accountable cho tất cả checklist items trong nhóm đó
    
    Args:
        supabase: Supabase client
        project_id: Project ID
        status_name: Project status name (e.g., "THỎA THUẬN", "XƯỞNG SẢN XUẤT")
    """
    try:
        # 1. Map status name to checklist group
        checklist_group_name = _get_checklist_group_for_status(status_name)
        if not checklist_group_name:
            logger.info(f"No checklist group mapping for status '{status_name}'. Skipping permission assignment.")
            return
        
        logger.info(f"Mapping status '{status_name}' to checklist group '{checklist_group_name}'")
        
        # 2. Tìm nhân viên accountable cho trạng thái này
        mapping_result = supabase.table("checklist_status_responsible_mapping").select(
            "employee_id, status"
        ).eq("status", status_name).eq("responsibility_type", "accountable").eq("is_active", True).execute()
        
        if not mapping_result.data or len(mapping_result.data) == 0:
            logger.warning(f"No accountable employees found for status '{status_name}'. Skipping permission assignment.")
            return
        
        accountable_employee_ids = [item.get("employee_id") for item in mapping_result.data if item.get("employee_id")]
        if not accountable_employee_ids:
            logger.warning(f"No valid employee IDs found for status '{status_name}'. Skipping permission assignment.")
            return
        
        logger.info(f"Found {len(accountable_employee_ids)} accountable employee(s) for status '{status_name}'")
        
        # 3. Tìm parent task của project (nhiệm vụ lớn = tên dự án)
        parent_tasks_result = supabase.table("tasks").select("id").eq(
            "project_id", project_id
        ).is_("parent_id", "null").is_("deleted_at", "null").limit(1).execute()
        
        if not parent_tasks_result.data:
            logger.warning(f"No parent task found for project {project_id}. Skipping permission assignment.")
            return
        
        parent_task_id = parent_tasks_result.data[0].get("id")
        logger.info(f"Found parent task {parent_task_id} for project {project_id}")
        
        # 4. Tìm checklist trong nhóm tương ứng
        checklists_result = supabase.table("task_checklists").select("id").eq(
            "task_id", parent_task_id
        ).eq("title", checklist_group_name).limit(1).execute()
        
        if not checklists_result.data:
            logger.warning(f"No checklist found with title '{checklist_group_name}' for task {parent_task_id}. Skipping permission assignment.")
            return
        
        checklist_id = checklists_result.data[0].get("id")
        logger.info(f"Found checklist {checklist_id} with title '{checklist_group_name}'")
        
        # 5. Tìm tất cả checklist items trong checklist này
        checklist_items_result = supabase.table("task_checklist_items").select("id").eq(
            "checklist_id", checklist_id
        ).execute()
        
        if not checklist_items_result.data:
            logger.info(f"No checklist items found in checklist {checklist_id}. Nothing to assign.")
            return
        
        checklist_item_ids = [item.get("id") for item in checklist_items_result.data if item.get("id")]
        logger.info(f"Found {len(checklist_item_ids)} checklist items to assign permissions")
        
        # 6. Gán quyền accountable cho tất cả checklist items
        assignments_to_insert = []
        for item_id in checklist_item_ids:
            for employee_id in accountable_employee_ids:
                assignments_to_insert.append({
                    "checklist_item_id": item_id,
                    "employee_id": employee_id,
                    "responsibility_type": "accountable"
                })
        
        if assignments_to_insert:
            # Xóa các assignments cũ của các items này (tránh duplicate)
            for item_id in checklist_item_ids:
                supabase.table("task_checklist_item_assignments").delete().eq(
                    "checklist_item_id", item_id
                ).eq("responsibility_type", "accountable").execute()
            
            # Insert assignments mới
            supabase.table("task_checklist_item_assignments").insert(assignments_to_insert).execute()
            logger.info(f"✅ Successfully assigned permissions to {len(assignments_to_insert)} checklist items for status '{status_name}'")
        else:
            logger.warning(f"No assignments to insert for status '{status_name}'")
            
    except Exception as e:
        logger.error(f"Error in _auto_assign_checklist_permissions_for_status: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise


def check_user_can_update_progress(supabase, current_user: User, project_id: str) -> bool:
    """Check if user can update project progress - allows all project team members"""
    # Admin and manager roles can always update progress
    role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    role_value = role_value.lower()

    if role_value in ["admin", "manager"]:
        return True

    # For other roles, check if user is any member of the project team (not just accountable/responsible)
    try:
        # Query separately for user_id and email to avoid .or_() issues
        # Try querying by user_id first
        if current_user.id:
            team_result = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("user_id", current_user.id).execute()
            if len(team_result.data) > 0:
                return True
        
        # Try querying by email
        if current_user.email:
            team_result = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active").eq("email", current_user.email).execute()
            if len(team_result.data) > 0:
                return True
        
        return False

        return False
    except Exception as e:
        print(f"Error checking progress update permissions: {str(e)}")
        return False

def calculate_progress_from_status(supabase, project_id: str, new_status_id: str) -> float:
    """
    Calculate automatic progress based on status position
    Formula: (current_status_order / total_statuses) * 100
    """
    try:
        # Get project category
        project_data = supabase.table("projects").select("category_id").eq("id", project_id).execute()
        category_id = project_data.data[0].get('category_id') if project_data.data else None

        # Get all active statuses for this category (or global statuses if no category)
        status_query = supabase.table("project_statuses").select("id, display_order").eq("is_active", True)
        if category_id:
            status_query = status_query.eq("category_id", category_id)
        else:
            # If no category, get global statuses (category_id IS NULL)
            status_query = status_query.is_("category_id", "null")

        all_statuses = status_query.order("display_order", desc=False).execute()

        if not all_statuses.data or len(all_statuses.data) == 0:
            return 0.0

        total_statuses = len(all_statuses.data)

        # Find current status order
        current_status_order = None
        for status in all_statuses.data:
            if status['id'] == new_status_id:
                current_status_order = status.get('display_order', 0)
                break

        if current_status_order is None:
            return 0.0

        # Calculate progress: (current_position / total_statuses) * 100
        # display_order starts from 0, so we add 1 to get 1-based position
        progress = ((current_status_order + 1) / total_statuses) * 100

        # Round to 2 decimal places and ensure it's not over 100%
        return min(round(progress, 2), 100.0)

    except Exception as e:
        print(f"Error calculating progress from status: {str(e)}")
        return 0.0

# ============================================================================
# Project Categories Routes - Must be defined BEFORE /{project_id} route
# ============================================================================
# Note: Categories routes are handled by project_categories router at /api/projects/categories
# This comment ensures /categories doesn't conflict with /{project_id}
# The actual routes are in routers/project_categories.py

@router.get("/generate-code")
async def generate_project_code(
    current_user: User = Depends(get_current_user)
):
    """Generate a unique project code"""
    try:
        supabase = get_supabase_client()
        
        # Get all project codes to find the highest number
        all_projects = supabase.table("projects").select("project_code").execute()
        
        max_number = 0
        
        # Find the maximum number from all project codes
        if all_projects.data:
            for proj in all_projects.data:
                if proj.get('project_code'):
                    code = proj['project_code']
                    # Extract number from formats: PRJ001, #PRJ001, PRJ-001, etc.
                    match = re.search(r'#?PRJ[-_]?(\d+)', code, re.IGNORECASE)
                    if match:
                        num = int(match.group(1))
                        if num > max_number:
                            max_number = num
        
        # Generate next code and check if it exists
        attempts = 0
        new_code = ''
        
        while attempts < 100:  # Max 100 attempts to avoid infinite loop
            next_number = max_number + 1 + attempts
            new_code = f"PRJ{next_number:03d}"
            
            # Check if code already exists
            check_result = supabase.table("projects").select("id").eq("project_code", new_code).limit(1).execute()
            if not check_result.data or len(check_result.data) == 0:
                # Code is available
                break
            attempts += 1
        
        # If still can't find unique code, use timestamp
        if attempts >= 100 or not new_code:
            timestamp = int(datetime.utcnow().timestamp() * 1000) % 1000000
            new_code = f"PRJ{timestamp:06d}"
        
        return {"project_code": new_code}
        
    except Exception as e:
        logger.error(f"Error generating project code: {str(e)}")
        # Fallback to timestamp-based code
        timestamp = int(datetime.utcnow().timestamp() * 1000) % 1000000
        random_suffix = str(uuid.uuid4())[:3].replace('-', '')
        return {"project_code": f"PRJ{timestamp}{random_suffix}"}

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
        
        # Fix invalid date formats (e.g., '12026-03-10' -> '2026-03-10')
        def fix_invalid_date(date_value):
            """Fix invalid date format if year is too long (e.g., 12026 -> 2026)"""
            if not date_value:
                return date_value
            date_str = str(date_value)
            try:
                # Check if date string has invalid year (more than 4 digits)
                if '-' in date_str:
                    parts = date_str.split('-')
                    if len(parts) == 3 and len(parts[0]) > 4:
                        # Year is too long, fix it
                        year_str = parts[0]
                        # Remove leading '1' if year starts with '1' and is too long
                        if year_str.startswith('1') and len(year_str) > 4:
                            year = year_str.lstrip('1')[:4]
                            if len(year) < 4:
                                # If still invalid, try to extract valid 4-digit year
                                year = year_str[-4:] if len(year_str) >= 4 else '2026'
                            # Ensure year is reasonable (1900-2100)
                            try:
                                year_int = int(year)
                                if year_int < 1900 or year_int > 2100:
                                    year = '2026'  # Default to 2026 if out of range
                            except:
                                year = '2026'
                            return f"{year}-{parts[1]}-{parts[2]}"
            except:
                pass
            return date_value
        
        if 'start_date' in project_data:
            project_data['start_date'] = fix_invalid_date(project_data['start_date'])
        
        if 'end_date' in project_data:
            project_data['end_date'] = fix_invalid_date(project_data['end_date'])
        
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
        
        # Validate foreign key references before inserting
        # This prevents foreign key constraint violations
        if project_data.customer_id:
            customer_check = supabase.table("customers").select("id").eq("id", project_data.customer_id).limit(1).execute()
            if not customer_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Customer with ID {project_data.customer_id} does not exist"
                )
        
        if project_data.manager_id:
            manager_check = supabase.table("employees").select("id").eq("id", project_data.manager_id).limit(1).execute()
            if not manager_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee (manager) with ID {project_data.manager_id} does not exist"
                )
        
        if project_data.category_id:
            category_check = supabase.table("project_categories").select("id").eq("id", project_data.category_id).limit(1).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Project category with ID {project_data.category_id} does not exist"
                )
        
        if project_data.status_id:
            status_check = supabase.table("project_statuses").select("id").eq("id", project_data.status_id).limit(1).execute()
            if not status_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Project status with ID {project_data.status_id} does not exist"
                )
        
        # Create project record
        project_dict = project_data.dict(exclude_none=True)
        project_dict["id"] = str(uuid.uuid4())
        # Note: projects table doesn't have created_by column, so we don't set it
        # created_by is stored in project_team instead
        project_dict["created_at"] = datetime.utcnow().isoformat()
        project_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Ensure project_code is unique
        original_code = project_dict.get('project_code', '')
        if original_code:
            # Check if code already exists
            check_result = supabase.table("projects").select("id").eq("project_code", original_code).limit(1).execute()
            
            if check_result.data and len(check_result.data) > 0:
                # Code exists, generate a new unique code
                # Get all project codes to find max number
                all_projects = supabase.table("projects").select("project_code").execute()
                max_number = 0
                
                if all_projects.data:
                    for proj in all_projects.data:
                        if proj.get('project_code'):
                            code = proj['project_code']
                            # Extract number from formats: PRJ001, #PRJ001, PRJ-001, etc.
                            match = re.search(r'#?PRJ[-_]?(\d+)', code, re.IGNORECASE)
                            if match:
                                num = int(match.group(1))
                                if num > max_number:
                                    max_number = num
                
                # Generate new unique code
                attempts = 0
                new_code = original_code
                while attempts < 100:
                    next_number = max_number + 1 + attempts
                    new_code = f"PRJ{next_number:03d}"
                    
                    # Check if new code exists
                    check_new = supabase.table("projects").select("id").eq("project_code", new_code).limit(1).execute()
                    if not check_new.data or len(check_new.data) == 0:
                        break
                    attempts += 1
                
                # If still can't find unique, use timestamp
                if attempts >= 100:
                    timestamp = int(datetime.utcnow().timestamp() * 1000) % 1000000
                    new_code = f"PRJ{timestamp:06d}"
                
                project_dict['project_code'] = new_code
        
        # Convert date objects to strings for JSON serialization
        if 'start_date' in project_dict and isinstance(project_dict['start_date'], date):
            project_dict['start_date'] = project_dict['start_date'].isoformat()
        if 'end_date' in project_dict and isinstance(project_dict['end_date'], date):
            project_dict['end_date'] = project_dict['end_date'].isoformat()
        
        # Handle status: if status_id is provided, use it and set status enum to default
        # If status_id is not provided, use status enum
        if project_dict.get('status_id'):
            # If status_id is provided, set status enum to default (will be overridden by status_id)
            # Don't include status enum if status_id is present
            if 'status' in project_dict:
                del project_dict['status']
        else:
            # Convert enum objects to strings for JSON serialization
            if 'status' in project_dict and hasattr(project_dict['status'], 'value'):
                project_dict['status'] = project_dict['status'].value
            elif 'status' not in project_dict:
                # Default to planning if no status and no status_id
                project_dict['status'] = 'planning'
        
        if 'priority' in project_dict and hasattr(project_dict['priority'], 'value'):
            project_dict['priority'] = project_dict['priority'].value
        
        # Ensure actual_cost is set (default to 0.0 if not provided)
        if 'actual_cost' not in project_dict or project_dict.get('actual_cost') is None:
            project_dict['actual_cost'] = 0.0
        
        # Remove any fields that don't exist in the database schema
        # Keep only valid columns: id, project_code, name, description, customer_id, manager_id,
        # start_date, end_date, budget, actual_cost, status, status_id, priority, progress,
        # billing_type, hourly_rate, category_id, created_at, updated_at
        valid_columns = {
            'id', 'project_code', 'name', 'description', 'customer_id', 'manager_id',
            'start_date', 'end_date', 'budget', 'actual_cost', 'status', 'status_id',
            'priority', 'progress', 'billing_type', 'hourly_rate', 'category_id',
            'created_at', 'updated_at'
        }
        project_dict = {k: v for k, v in project_dict.items() if k in valid_columns}
        
        # Insert project - backend uses service role key
        # RLS is disabled on projects table, so this should work
        try:
            logger.info(f"Inserting project: {project_dict.get('name', 'N/A')} (code: {project_dict.get('project_code', 'N/A')})")
            logger.info(f"Using Supabase client with service role key")
            logger.info(f"Project data keys: {list(project_dict.keys())}")
            result = supabase.table("projects").insert(project_dict).execute()
            
            if result.data:
                logger.info(f"✅ Project inserted successfully: {result.data[0].get('id', 'N/A')}")
            else:
                logger.warning("⚠️ Project insert returned no data")
                
        except Exception as insert_error:
            error_msg = str(insert_error)
            logger.error(f"❌ Failed to insert project: {error_msg}")
            logger.error(f"   Project data keys: {list(project_dict.keys())}")
            logger.error(f"   Project code: {project_dict.get('project_code', 'N/A')}")
            
            # Check if it's an RLS error
            if "row-level security" in error_msg.lower() or "42501" in error_msg:
                logger.error("⚠️ RLS error detected! Even though RLS should be disabled.")
                logger.error("   This might indicate:")
                logger.error("   1. RLS was re-enabled after migration")
                logger.error("   2. Service key is not being used correctly")
                logger.error("   3. Need to restart backend server")
            
            # Re-raise to return proper error to frontend
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create project: {error_msg}"
            )
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project: No data returned"
            )
        
        if result.data:
            project = result.data[0]
            project_id = project["id"]
            
            # Tự động thêm manager vào project_team
            try:
                # Ưu tiên manager_id, nếu không có thì dùng created_by
                employee_id_to_add = project_data.manager_id
                if not employee_id_to_add:
                    # Nếu không có manager_id, lấy từ created_by (người tạo dự án)
                    # Tìm employee_id từ user_id (created_by)
                    if project_dict.get("created_by"):
                        employee_result = supabase.table("employees").select("id").eq("user_id", project_dict["created_by"]).limit(1).execute()
                        if employee_result.data:
                            employee_id_to_add = employee_result.data[0]["id"]
                
                if employee_id_to_add:
                    # Lấy thông tin employee
                    employee_result = supabase.table("employees").select("id, first_name, last_name, email, phone, user_id").eq("id", employee_id_to_add).single().execute()
                    
                    if employee_result.data:
                        employee = employee_result.data
                        employee_name = f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip()
                        
                        # Kiểm tra xem đã có trong project_team chưa
                        # Kiểm tra bằng user_id trước (nếu có)
                        existing_member = None
                        if employee.get("user_id"):
                            existing_member = supabase.table("project_team").select("id").eq("project_id", project_id).eq("user_id", employee.get("user_id")).execute()
                        
                        # Nếu không tìm thấy bằng user_id, kiểm tra bằng email
                        if (not existing_member or not existing_member.data) and employee.get("email"):
                            existing_member = supabase.table("project_team").select("id").eq("project_id", project_id).eq("email", employee.get("email")).execute()
                        
                        # Nếu vẫn không tìm thấy, kiểm tra bằng name
                        if (not existing_member or not existing_member.data) and employee_name:
                            existing_member = supabase.table("project_team").select("id").eq("project_id", project_id).eq("name", employee_name).execute()
                        
                        if not existing_member or not existing_member.data:
                            # Thêm vào project_team với role = "manager" hoặc "responsible"
                            # Lấy start_date từ project (đã được convert sang ISO format)
                            project_start_date = project_dict.get("start_date")
                            if not project_start_date:
                                # Nếu không có, dùng ngày hiện tại
                                project_start_date = datetime.utcnow().isoformat()
                            
                            # Đảm bảo start_date là date string (không phải datetime)
                            if isinstance(project_start_date, str) and 'T' in project_start_date:
                                # Nếu là datetime string, chỉ lấy phần date
                                project_start_date = project_start_date.split('T')[0]
                            
                            team_member_data = {
                                "project_id": project_id,
                                "name": employee_name,
                                "role": "manager",  # Đảm bảo role không null
                                "responsibility_type": "accountable",  # Manager là accountable
                                "email": employee.get("email"),
                                "phone": employee.get("phone"),
                                "start_date": project_start_date,  # Lấy từ project.start_date
                                "status": "active",
                                "user_id": employee.get("user_id"),
                                "created_at": datetime.utcnow().isoformat(),
                                "updated_at": datetime.utcnow().isoformat()
                            }
                            
                            supabase.table("project_team").insert(team_member_data).execute()
                            
                            # Tự động thêm vào task_participants cho tất cả tasks của project
                            # Trigger có thể tạo task sau khi insert project, nên cần retry
                            max_retries = 3
                            retry_delay = 0.5  # 500ms
                            
                            for retry in range(max_retries):
                                tasks_result = supabase.table("tasks").select("id").eq("project_id", project_id).is_("deleted_at", "null").execute()
                                
                                if tasks_result.data:
                                    participants_to_add = []
                                    for task in tasks_result.data:
                                        # Kiểm tra xem đã có trong task_participants chưa
                                        existing_participant = supabase.table("task_participants").select("id").eq("task_id", task["id"]).eq("employee_id", employee_id_to_add).execute()
                                        
                                        if not existing_participant.data:
                                            participants_to_add.append({
                                                "task_id": task["id"],
                                                "employee_id": employee_id_to_add,
                                                "role": "responsible",  # Manager là responsible
                                                "added_by": current_user.id
                                            })
                                    
                                    if participants_to_add:
                                        supabase.table("task_participants").insert(participants_to_add).execute()
                                    break  # Thành công, không cần retry nữa
                                else:
                                    # Chưa có tasks, đợi trigger tạo
                                    if retry < max_retries - 1:
                                        await asyncio.sleep(retry_delay)
            except Exception as team_error:
                # Log error nhưng không fail project creation
                print(f"Warning: Failed to add manager to project team: {str(team_error)}")
            
            # Tự động tạo các nhiệm vụ mặc định cho dự án
            # Đảm bảo logic này LUÔN được gọi, không bị skip
            logger.info(f"🔵 Starting to create default tasks for project {project_id}")
            logger.info(f"   Project name: {project.get('name', 'N/A')}")
            logger.info(f"   Created by user ID: {current_user.id}")
            
            try:
                # Đợi một chút để trigger hoàn thành (nếu có)
                await asyncio.sleep(0.2)
                
                # Kiểm tra xem đã có tasks chưa (có thể trigger đã tạo)
                existing_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
                existing_task_count = len(existing_tasks.data) if existing_tasks.data else 0
                
                logger.info(f"   Existing tasks count: {existing_task_count}")
                
                # Nếu có tasks từ trigger (cấu trúc cũ), xóa chúng trước
                # Trigger tạo tasks với parent_id = NULL (4 parent tasks: Kế hoạch, Sản xuất, etc.)
                # Backend code tạo 1 main parent task (tên dự án) + sub-tasks (cấu trúc mới)
                if existing_task_count > 0:
                    # Check if these are old trigger tasks
                    # Trigger creates tasks with parent_id = NULL and specific titles
                    trigger_task_titles = ["Kế hoạch", "Sản xuất", "Vận chuyển / lắp đặt", "Chăm sóc khách hàng"]
                    has_trigger_tasks = False
                    
                    for task in existing_tasks.data:
                        if task.get("parent_id") is None and task.get("title") in trigger_task_titles:
                            has_trigger_tasks = True
                            break
                    
                    # Also check if there are multiple parent tasks with same title (project name)
                    # This indicates both trigger and backend created tasks
                    parent_tasks = [t for t in existing_tasks.data if t.get("parent_id") is None]
                    if len(parent_tasks) > 1:
                        # Multiple parent tasks = both trigger and backend created tasks
                        has_trigger_tasks = True
                    
                    if has_trigger_tasks:
                        logger.info(f"   Found old trigger tasks, deleting all tasks for this project...")
                        # Delete ALL tasks for this project (both trigger and backend tasks)
                        # We'll recreate them with the correct structure
                        try:
                            delete_result = supabase.table("tasks").delete().eq("project_id", project_id).execute()
                            deleted_count = len(delete_result.data) if delete_result.data else 0
                            logger.info(f"   Deleted {deleted_count} old tasks")
                            await asyncio.sleep(0.3)  # Wait for deletion to complete
                            
                            # Verify deletion
                            verify_tasks = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
                            remaining_count = len(verify_tasks.data) if verify_tasks.data else 0
                            if remaining_count > 0:
                                logger.warning(f"   ⚠️  Still have {remaining_count} tasks after deletion. Retrying...")
                                # Try one more time
                                await asyncio.sleep(0.2)
                                supabase.table("tasks").delete().eq("project_id", project_id).execute()
                                logger.info(f"   Retry deletion completed")
                        except Exception as delete_error:
                            logger.error(f"   Error deleting old tasks: {str(delete_error)}")
                            import traceback
                            logger.error(f"   Traceback: {traceback.format_exc()}")
                            # Continue anyway - backend will try to create tasks
                
                # Tạo tasks mẫu với template đầy đủ (cấu trúc mới)
                # Đảm bảo đã xóa tasks cũ (nếu có) trước khi gọi service
                # Service sẽ kiểm tra lại nhưng nếu router đã xóa thì sẽ tạo mới
                logger.info(f"   Calling create_default_tasks_for_project()...")
                
                # Đợi một chút để đảm bảo deletion hoàn thành
                await asyncio.sleep(0.2)
                
                task_ids = create_default_tasks_for_project(
                    supabase=supabase,
                    project_id=project_id,
                    created_by=current_user.id,
                    default_responsibles=None  # Có thể mở rộng sau để cho phép truyền từ request
                )
                
                logger.info(f"   Function returned {len(task_ids)} task IDs")
                
                # Nếu không có tasks được tạo, thử lại một lần nữa (có thể do race condition)
                if len(task_ids) == 0:
                    logger.warning(f"⚠️ WARNING: No tasks were created for project {project_id}!")
                    logger.warning(f"   Retrying task creation...")
                    await asyncio.sleep(0.5)  # Đợi lâu hơn
                    
                    # Thử lại một lần nữa
                    task_ids = create_default_tasks_for_project(
                        supabase=supabase,
                        project_id=project_id,
                        created_by=current_user.id,
                        default_responsibles=None
                    )
                    logger.info(f"   Retry returned {len(task_ids)} task IDs")
                
                if len(task_ids) == 0:
                    logger.error(f"❌ ERROR: Failed to create tasks after retry for project {project_id}!")
                    logger.error(f"   This indicates a serious issue with task creation logic")
                    # Vẫn tiếp tục để project được tạo, nhưng log error rõ ràng
                else:
                    # Verify tasks were actually created in database
                    await asyncio.sleep(0.3)  # Đợi database commit
                    final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
                    final_task_count = len(final_tasks.data) if final_tasks.data else 0
                    
                    logger.info(f"✅ VERIFIED: Total tasks in database: {final_task_count}")
                    
                    if final_task_count == 0:
                        logger.error(f"❌ ERROR: Tasks were not actually created in database!")
                        logger.error(f"   Function returned {len(task_ids)} IDs but database has 0 tasks")
                        # Thử tạo lại một lần nữa
                        logger.warning(f"   Attempting final retry...")
                        await asyncio.sleep(0.5)
                        final_retry_ids = create_default_tasks_for_project(
                            supabase=supabase,
                            project_id=project_id,
                            created_by=current_user.id,
                            default_responsibles=None
                        )
                        await asyncio.sleep(0.3)
                        final_retry_check = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
                        final_retry_count = len(final_retry_check.data) if final_retry_check.data else 0
                        if final_retry_count > 0:
                            logger.info(f"   ✅ Final retry succeeded: {final_retry_count} tasks created")
                            final_task_count = final_retry_count
                            final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
                        else:
                            logger.error(f"   ❌ Final retry also failed. Tasks not created.")
                    else:
                        parent_tasks = [t for t in final_tasks.data if t.get('parent_id') is None]
                        sub_tasks = [t for t in final_tasks.data if t.get('parent_id') is not None]
                        logger.info(f"   Parent tasks: {len(parent_tasks)}, Sub tasks: {len(sub_tasks)}")
                        
                        # Đếm checklists và checklist items để trả về cho frontend
                        checklists_count = 0
                        checklist_items_count = 0
                        if parent_tasks:
                            parent_task_id = parent_tasks[0].get('id')
                            checklists_result = supabase.table("task_checklists").select("id").eq("task_id", parent_task_id).execute()
                            checklists_count = len(checklists_result.data) if checklists_result.data else 0
                            
                            for checklist in (checklists_result.data or []):
                                items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                                items = items_result.data if items_result.data else []
                                checklist_items_count += len(items)
                        
                        # Lưu thông tin tasks đã tạo vào project dict để trả về
                        project["tasks_created"] = {
                            "count": final_task_count,
                            "checklists": checklists_count,
                            "checklist_items": checklist_items_count
                        }
                        
                        logger.info(f"   ✅✅✅ TASKS CREATED SUCCESSFULLY: {final_task_count} tasks, {checklists_count} checklists, {checklist_items_count} checklist items")
                        logger.info(f"   ✅ Project {project_id} now has complete task structure with sample tasks")
                        
                        if final_tasks.data:
                            # Log some task titles for verification
                            task_titles = [t.get('title', 'N/A') for t in final_tasks.data[:5]]
                            logger.info(f"   Sample task titles: {task_titles}")
                    
            except Exception as tasks_error:
                # Log error chi tiết để debug - QUAN TRỌNG: Không được bỏ qua lỗi này
                import traceback
                error_details = traceback.format_exc()
                logger.error(f"❌ CRITICAL ERROR: Failed to create default tasks for project {project_id}")
                logger.error(f"   Error message: {str(tasks_error)}")
                logger.error(f"   Error type: {type(tasks_error).__name__}")
                logger.error(f"   Full traceback:\n{error_details}")
                
                # Kiểm tra xem có phải RLS error không
                error_msg = str(tasks_error).lower()
                if "row-level security" in error_msg or "42501" in error_msg or "rls" in error_msg:
                    logger.error("⚠️ RLS ERROR DETECTED!")
                    logger.error("   Backend should use service_role key to bypass RLS")
                    logger.error("   Check if supabase client is using service_role key")
                    logger.error("   Check RLS policies for tasks and task_participants tables")
                
                # Log error nhưng không fail project creation để user vẫn có thể tạo project
                # User có thể tạo tasks thủ công sau nếu cần
                # Tuy nhiên, cần log rõ ràng để developer biết có vấn đề
                # Tuy nhiên, cần log rõ ràng để debug
                # Đảm bảo project dict có tasks_created = None để frontend biết tasks không được tạo
                if "tasks_created" not in project:
                    project["tasks_created"] = None
            
            # Đảm bảo luôn có thông tin tasks_created trong response (ngay cả khi None)
            # Frontend sẽ hiển thị thông báo phù hợp
            logger.info(f"📋 Final project response includes tasks_created: {project.get('tasks_created')}")
            
            # Tạo thông báo cho đội ngũ dự án về việc tạo dự án mới
            try:
                # Lấy tên người tạo dự án
                creator_name = None
                if current_user:
                    user_result = supabase.table("users").select("full_name, email").eq("id", current_user.id).limit(1).execute()
                    if user_result.data:
                        creator_name = user_result.data[0].get("full_name") or user_result.data[0].get("email")
                
                # Gửi thông báo cho đội ngũ dự án
                # Await trực tiếp để đảm bảo thông báo được tạo
                try:
                    await notification_service.notify_project_created(
                        project_data=project,
                        creator_name=creator_name,
                        creator_user_id=current_user.id if current_user else None
                    )
                    logger.info(f"✅ Notification sent for project creation: {project.get('name', 'N/A')}")
                except Exception as notify_err:
                    logger.error(f"❌ Failed to send project creation notification: {str(notify_err)}")
                    import traceback
                    logger.error(traceback.format_exc())
            except Exception as notify_error:
                # Log error nhưng không fail project creation
                logger.warning(f"Failed to send project creation notification: {str(notify_error)}")
            
            return Project(**project)
        
        # If we reach here, project creation failed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project: No data returned"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating project: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.post("/{project_id}/create-default-tasks")
async def create_default_tasks_for_existing_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Create default tasks for an existing project"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        project_result = supabase.table("projects").select("id, name").eq("id", project_id).single().execute()
        if not project_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = project_result.data
        logger.info(f"🔵 Creating default tasks for existing project {project_id}: {project.get('name', 'N/A')}")
        
        # Check if tasks already exist
        existing_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        existing_task_count = len(existing_tasks.data) if existing_tasks.data else 0
        
        if existing_task_count > 0:
            # Check if already has complete structure
            parent_tasks = [t for t in existing_tasks.data if t.get('parent_id') is None]
            if len(parent_tasks) > 0:
                parent_task_id = parent_tasks[0].get('id')
                checklists_check = supabase.table("task_checklists").select("id").eq("task_id", parent_task_id).execute()
                checklists_count = len(checklists_check.data) if checklists_check.data else 0
                
                if len(parent_tasks) == 1 and checklists_count >= 4:
                    # Already has complete structure
                    return {
                        "success": True,
                        "message": "Project already has default tasks",
                        "tasks_count": existing_task_count,
                        "checklists": checklists_count
                    }
        
        # Create default tasks
        task_ids = create_default_tasks_for_project(
            supabase=supabase,
            project_id=project_id,
            created_by=current_user.id,
            default_responsibles=None
        )
        
        # Verify tasks were created
        await asyncio.sleep(0.3)
        final_tasks = supabase.table("tasks").select("id, title, parent_id").eq("project_id", project_id).execute()
        final_task_count = len(final_tasks.data) if final_tasks.data else 0
        
        # Count checklists and items
        checklists_count = 0
        checklist_items_count = 0
        if final_task_count > 0:
            parent_tasks = [t for t in final_tasks.data if t.get('parent_id') is None]
            if parent_tasks:
                parent_task_id = parent_tasks[0].get('id')
                checklists_result = supabase.table("task_checklists").select("id").eq("task_id", parent_task_id).execute()
                checklists_count = len(checklists_result.data) if checklists_result.data else 0
                
                for checklist in (checklists_result.data or []):
                    items_result = supabase.table("task_checklist_items").select("id").eq("checklist_id", checklist.get('id')).execute()
                    items = items_result.data if items_result.data else []
                    checklist_items_count += len(items)
        
        logger.info(f"✅ Created {final_task_count} tasks, {checklists_count} checklists, {checklist_items_count} items for project {project_id}")
        
        return {
            "success": True,
            "message": "Default tasks created successfully",
            "tasks_count": final_task_count,
            "checklists": checklists_count,
            "checklist_items": checklist_items_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating default tasks for project {project_id}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create default tasks: {str(e)}"
        )

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    # Debug authentication - comprehensive logging
    print("=== PROJECT UPDATE DEBUG ===")
    print(f"Project ID: {project_id}")
    print(f"Update data: {project_update.dict(exclude_unset=True)}")
    print(f"User ID: {current_user.id}")
    print(f"User email: {current_user.email}")
    print(f"User role: {current_user.role}")
    print(f"Request headers: {dict(request.headers)}")
    print("===========================")
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

        # Check if user has access to this project (project team member or admin/manager)
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this project"
            )

        # Additional validation for progress updates - allows all project team members
        if 'progress' in project_update.dict(exclude_unset=True):
            if not check_user_can_update_progress(supabase, current_user, project_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to update project progress. Only project team members can update progress."
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
        # Note: Database trigger will also handle this, but we do it here for consistency
        if 'progress' in update_data and 'status_id' not in update_data:
            progress = update_data['progress']
            
            # Normalize progress: if > 1, assume it's 0-100 scale and convert to 0-1
            progress_normalized = progress
            if progress > 1:
                progress_normalized = progress / 100.0
                update_data['progress'] = progress_normalized  # Update to normalized value
            
            # Get current project status
            current_project = supabase.table("projects").select("status, status_id").eq("id", project_id).execute()
            current_status = current_project.data[0]['status'] if current_project.data else 'planning'
            old_status_id = current_project.data[0].get('status_id') if current_project.data else None

            # Auto-change status based on progress (matching database trigger logic)
            # progress >= 0.999 (99.9%) -> completed
            # 0 < progress < 1 -> active  
            # progress <= 0 -> planning
            if progress_normalized >= 0.999:
                update_data['status'] = 'completed'
                # Try to find completed status_id
                completed_status = supabase.table("project_statuses")\
                    .select("id")\
                    .or_("code.ilike.completed,name.ilike.%completed%,name.ilike.%hoàn thành%")\
                    .limit(1)\
                    .execute()
                if completed_status.data:
                    update_data['status_id'] = completed_status.data[0]['id']
            elif progress_normalized > 0.0:
                update_data['status'] = 'active'
                # Try to find active status_id
                active_status = supabase.table("project_statuses")\
                    .select("id")\
                    .or_("code.ilike.active,name.ilike.%active%")\
                    .limit(1)\
                    .execute()
                if active_status.data:
                    update_data['status_id'] = active_status.data[0]['id']
            else:
                update_data['status'] = 'planning'
                # Try to find planning status_id
                planning_status = supabase.table("project_statuses")\
                    .select("id")\
                    .or_("code.ilike.planning,name.ilike.%planning%")\
                    .limit(1)\
                    .execute()
                if planning_status.data:
                    update_data['status_id'] = planning_status.data[0]['id']
        
        # Get old status_id before update
        old_project = supabase.table("projects").select("status_id").eq("id", project_id).execute()
        old_status_id = old_project.data[0].get('status_id') if old_project.data else None
        
        result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
        
        # Apply flow rules and auto-calculate progress if status_id changed
        new_status_id = update_data.get('status_id')
        if new_status_id and new_status_id != old_status_id:
            # Auto-calculate progress based on new status position
            auto_progress = calculate_progress_from_status(supabase, project_id, new_status_id)
            if auto_progress > 0:
                update_data['progress'] = auto_progress
                print(f"Auto-updating progress to {auto_progress}% based on status change")

            # Get active flow rules for the new status
            flow_rules = supabase.table("project_status_flow_rules")\
                .select("category_id, action_type, priority")\
                .eq("status_id", new_status_id)\
                .eq("is_active", True)\
                .order("priority", desc=True)\
                .execute()

            if flow_rules.data:
                for rule in flow_rules.data:
                    category_id = rule.get('category_id')
                    action_type = rule.get('action_type', 'add')

                    if action_type == 'add':
                        # Check if already in category
                        existing_member = supabase.table("project_category_members")\
                            .select("id")\
                            .eq("project_id", project_id)\
                            .eq("category_id", category_id)\
                            .execute()

                        if not existing_member.data:
                            supabase.table("project_category_members")\
                                .insert({
                                    "project_id": project_id,
                                    "category_id": category_id,
                                    "added_by": current_user.id
                                })\
                                .execute()
                    elif action_type == 'remove':
                        # Remove from category
                        supabase.table("project_category_members")\
                            .delete()\
                            .eq("project_id", project_id)\
                            .eq("category_id", category_id)\
                            .execute()

            # Also check for rules on old status (to handle remove actions)
            if old_status_id:
                old_flow_rules = supabase.table("project_status_flow_rules")\
                    .select("category_id, action_type")\
                    .eq("status_id", old_status_id)\
                    .eq("is_active", True)\
                    .eq("action_type", "add")\
                    .execute()

                # If old status had "add" rules, check if we should remove from those categories
                # (only if new status doesn't have "add" rule for same category)
                if old_flow_rules.data:
                    new_category_ids = {r.get('category_id') for r in flow_rules.data if r.get('action_type') == 'add'} if flow_rules.data else set()

                    for old_rule in old_flow_rules.data:
                        old_category_id = old_rule.get('category_id')
                        # Only remove if new status doesn't add to same category
                        if old_category_id not in new_category_ids:
                            supabase.table("project_category_members")\
                                .delete()\
                                .eq("project_id", project_id)\
                                .eq("category_id", old_category_id)\
                                .execute()
        
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

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a project and all related data"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        existing = supabase.table("projects").select("id, name, manager_id").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = existing.data[0]
        
        # Check permissions: Only admin, hr_manager, accountant, or project manager can delete
        is_manager = False
        if project.get("manager_id"):
            # Check if current user is the manager
            manager_employee = supabase.table("employees").select("user_id").eq("id", project["manager_id"]).execute()
            if manager_employee.data and manager_employee.data[0].get("user_id") == current_user.id:
                is_manager = True
        
        # Check if user is admin, hr_manager, or accountant
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        is_authorized = (
            user_role in ['admin', 'hr_manager', 'accountant'] or 
            is_manager
        )
        
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this project. Only admins, HR managers, accountants, or project managers can delete projects."
            )
        
        # Delete related data first (to avoid foreign key constraint violations)
        # Note: Some tables may have ON DELETE CASCADE, but we'll be explicit here
        
        # 1. Delete task participants
        try:
            # Get all tasks for this project
            tasks_result = supabase.table("tasks").select("id").eq("project_id", project_id).execute()
            if tasks_result.data:
                task_ids = [task["id"] for task in tasks_result.data]
                # Delete task participants
                for task_id in task_ids:
                    supabase.table("task_participants").delete().eq("task_id", task_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting task participants: {str(e)}")
        
        # 2. Delete tasks (may have CASCADE, but we'll do it explicitly)
        try:
            supabase.table("tasks").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting tasks: {str(e)}")
        
        # 3. Delete task groups
        try:
            supabase.table("task_groups").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting task groups: {str(e)}")
        
        # 4. Delete project team members
        try:
            supabase.table("project_team").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting project team: {str(e)}")
        
        # 5. Delete project category members
        try:
            supabase.table("project_category_members").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting project category members: {str(e)}")
        
        # 6. Delete time entries (if exists)
        try:
            supabase.table("time_entries").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting time entries: {str(e)}")
        
        # 7. Delete expenses (may have ON DELETE SET NULL, but we'll try to delete)
        try:
            supabase.table("expenses").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting expenses: {str(e)}")
        
        # 8. Delete invoices (may have ON DELETE SET NULL, but we'll try to delete)
        try:
            supabase.table("invoices").delete().eq("project_id", project_id).execute()
        except Exception as e:
            logger.warning(f"Error deleting invoices: {str(e)}")
        
        # 9. Finally, delete the project itself
        result = supabase.table("projects").delete().eq("id", project_id).execute()
        
        if result.data:
            logger.info(f"Project {project_id} ({project.get('name', 'N/A')}) deleted by user {current_user.id}")
            return {"message": "Project deleted successfully", "project_id": project_id}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete project"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
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
        invoices_result = supabase.table("invoices").select("*").eq("project_id", project_id).execute()
        invoices = invoices_result.data or []
        total_invoice_amount = sum(invoice.get("total_amount", 0) for invoice in invoices)
        total_paid_invoices = sum(invoice.get("paid_amount", 0) for invoice in invoices)
        
        # Get all sales receipts for this project
        # Note: sales_receipts table may not have project_id column in some databases
        # Try querying by project_id first, if that fails, query by customer_id
        sales_receipts = []
        try:
            receipts_result = supabase.table("sales_receipts").select("*").eq("project_id", project_id).execute()
            sales_receipts = receipts_result.data or []
        except Exception as e:
            # If project_id column doesn't exist, try customer_id
            if project.get("customer_id"):
                try:
                    receipts_result = supabase.table("sales_receipts").select("*").eq("customer_id", project["customer_id"]).execute()
                    sales_receipts = receipts_result.data or []
                except Exception:
                    sales_receipts = []
            else:
                sales_receipts = []
        total_sales_receipts = sum(receipt.get("total_amount", 0) for receipt in sales_receipts)
        
        # Total Income
        total_income = total_invoice_amount + total_sales_receipts
        total_paid_income = total_paid_invoices + total_sales_receipts
        
        # ============================================================================
        # CALCULATE TOTAL COSTS - Tính tổng chi phí
        # ============================================================================
        
        # Get time entries and calculate labor costs
        time_entries_result = supabase.table("time_entries").select("*").eq("project_id", project_id).execute()
        time_entries = time_entries_result.data or []
        total_hours = sum(entry.get("hours_worked", 0) for entry in time_entries)
        total_labor_cost = 0
        
        for entry in time_entries:
            if entry.get("hourly_rate"):
                total_labor_cost += entry.get("hours_worked", 0) * entry.get("hourly_rate", 0)
        
        # Get direct project expenses
        expenses_result = supabase.table("expenses").select("*").eq("project_id", project_id).execute()
        expenses = expenses_result.data or []
        total_expenses = sum(expense.get("amount", 0) for expense in expenses)
        
        # Get bills (vendor bills) for this project
        bills_result = supabase.table("bills").select("*").eq("project_id", project_id).execute()
        bills = bills_result.data or []
        total_bills = sum(bill.get("amount", 0) for bill in bills)
        total_paid_bills = sum(bill.get("paid_amount", 0) for bill in bills)
        
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
        recent_invoices_result = supabase.table("invoices").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
        recent_invoices = recent_invoices_result.data or []
        
        # Get recent sales receipts (last 10)
        # Try querying by project_id first, if that fails, query by customer_id
        recent_sales_receipts_data = []
        try:
            receipts_result = supabase.table("sales_receipts").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
            recent_sales_receipts_data = receipts_result.data or []
        except Exception:
            # If project_id column doesn't exist, try customer_id
            if project.get("customer_id"):
                try:
                    receipts_result = supabase.table("sales_receipts").select("*").eq("customer_id", project["customer_id"]).order("issue_date", desc=True).limit(10).execute()
                    recent_sales_receipts_data = receipts_result.data or []
                except Exception:
                    recent_sales_receipts_data = []
        # Create a mock result object to match expected structure
        class MockResult:
            def __init__(self, data):
                self.data = data
        recent_sales_receipts = MockResult(recent_sales_receipts_data)
        
        # Get recent expenses (last 10)
        recent_expenses_result = supabase.table("expenses").select("*").eq("project_id", project_id).order("expense_date", desc=True).limit(10).execute()
        recent_expenses = recent_expenses_result.data or []
        
        # Get recent bills (last 10)
        recent_bills_result = supabase.table("bills").select("*").eq("project_id", project_id).order("issue_date", desc=True).limit(10).execute()
        recent_bills = recent_bills_result.data or []
        
        # Get recent time entries (last 10)
        recent_time_entries_result = supabase.table("time_entries").select("*").eq("project_id", project_id).order("date", desc=True).limit(10).execute()
        recent_time_entries = recent_time_entries_result.data or []
        
        # Combine and sort recent transactions
        recent_transactions = []
        
        # Add invoices
        for invoice in recent_invoices:
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
        for expense in recent_expenses:
            recent_transactions.append({
                "type": "expense",
                "id": expense["id"],
                "date": expense["expense_date"],
                "description": expense["description"],
                "amount": -expense["amount"],  # Negative for costs
                "status": expense["status"]
            })
        
        # Add bills
        for bill in recent_bills:
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
                    "count": len(invoices)
                },
                "sales_receipts": {
                    "total_amount": total_sales_receipts,
                    "count": len(sales_receipts)  # sales_receipts is already a list, not an object with .data
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
                    "count": len(expenses)
                },
                "bills": {
                    "total_amount": total_bills,
                    "paid_amount": total_paid_bills,
                    "outstanding": total_bills - total_paid_bills,
                    "count": len(bills)
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
        
        recent_invoices_result = supabase.table("invoices").select("*").eq("project_id", project_id).gte("issue_date", thirty_days_ago).execute()
        recent_invoices = recent_invoices_result.data or []
        recent_time_entries_result = supabase.table("time_entries").select("*").eq("project_id", project_id).gte("date", thirty_days_ago).execute()
        recent_time_entries = recent_time_entries_result.data or []
        recent_expenses_result = supabase.table("expenses").select("*").eq("project_id", project_id).gte("expense_date", thirty_days_ago).execute()
        recent_expenses = recent_expenses_result.data or []
        
        # Calculate quick metrics
        total_hours_this_month = sum(te.get("hours_worked", 0) for te in recent_time_entries)
        total_expenses_this_month = sum(exp.get("amount", 0) for exp in recent_expenses)
        total_invoices_this_month = sum(inv.get("total_amount", 0) for inv in recent_invoices)
        
        # Get project team (employees who have logged time)
        team_members_result = supabase.table("time_entries").select("employee_id").eq("project_id", project_id).execute()
        team_members = team_members_result.data or []
        unique_employees = list(set(te.get("employee_id") for te in team_members if te.get("employee_id")))
        
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
                "invoices": recent_invoices[:5],  # Last 5 invoices
                "time_entries": recent_time_entries[:10],  # Last 10 time entries
                "expenses": recent_expenses[:5]  # Last 5 expenses
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
    status_name: Optional[str] = Query(None, description="Status name to update to"),
    status_id: Optional[str] = Query(None, description="Status ID to update to (preferred)"),
    current_user: User = Depends(get_current_user)
):
    """Update project status"""
    try:
        supabase = get_supabase_client()
        
        # Check if project exists
        existing = supabase.table("projects").select("id, status_id").eq("id", project_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Check if user can update status: Admin hoặc người chịu trách nhiệm (accountable)
        role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        role_value = role_value.lower()
        
        is_admin = role_value == "admin"
        is_accountable = False
        
        # Kiểm tra xem user có phải accountable member của project không
        if not is_admin:
            try:
                # Tìm employee_id từ user_id
                employee_result = supabase.table("employees").select("id").eq("user_id", current_user.id).limit(1).execute()
                if employee_result.data:
                    employee_id = employee_result.data[0].get('id')
                    
                    # Kiểm tra trong project_team với responsibility_type = 'accountable'
                    team_result = supabase.table("project_team")\
                        .select("id, responsibility_type")\
                        .eq("project_id", project_id)\
                        .eq("status", "active")\
                        .eq("user_id", current_user.id)\
                        .execute()
                    
                    # Nếu không tìm thấy bằng user_id, thử tìm bằng employee_id qua employees table
                    if not team_result.data:
                        # Tìm project_team members có employee_id tương ứng
                        # Note: project_team có thể không có employee_id trực tiếp, cần check qua employees
                        team_by_email = supabase.table("project_team")\
                            .select("id, responsibility_type")\
                            .eq("project_id", project_id)\
                            .eq("status", "active")\
                            .eq("email", current_user.email)\
                            .execute()
                        team_result = team_by_email
                    
                    # Kiểm tra xem có member nào với responsibility_type = 'accountable' không
                    for member in (team_result.data or []):
                        if member.get('responsibility_type') == 'accountable':
                            is_accountable = True
                            break
            except Exception as e:
                logger.error(f"Error checking accountable permission: {str(e)}")
        
        if not is_admin and not is_accountable:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update project status. Only admin or accountable members can change status."
            )

        old_status_id = existing.data[0].get('status_id')
        
        # Validate: Phải có status_id hoặc status_name
        if not status_id and not status_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'status_id' or 'status_name' must be provided"
            )
        
        new_status_id = None
        found_status_name = None
        normalized_status_name = None
        update_dict = {
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Ưu tiên dùng status_id nếu có (chính xác hơn)
        if status_id:
            # Verify status_id exists
            status_result = supabase.table("project_statuses")\
                .select("id, name")\
                .eq("id", status_id)\
                .limit(1)\
                .execute()
            
            if status_result.data:
                new_status_id = status_result.data[0].get('id')
                found_status_name = status_result.data[0].get('name')
                update_dict["status_id"] = new_status_id
                logger.info(f"✅ Using provided status_id {new_status_id} (status: '{found_status_name}')")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Status ID '{status_id}' not found. Please use a valid status ID."
                )
        else:
            # Fallback: Map status_name to status_id
            # Normalize status_name: trim whitespace và chuẩn hóa
            normalized_status_name = status_name.strip()
            
            # Thử tìm exact match (case-sensitive) trước
            status_result = supabase.table("project_statuses")\
                .select("id, name")\
                .eq("name", normalized_status_name)\
                .limit(1)\
                .execute()
            
            # Nếu không tìm thấy exact match, thử case-insensitive match
            # Lấy tất cả statuses và so sánh case-insensitive trong Python
            if not status_result.data:
                all_statuses_result = supabase.table("project_statuses")\
                    .select("id, name")\
                    .execute()
                
                if all_statuses_result.data:
                    # Tìm exact match case-insensitive
                    for status in all_statuses_result.data:
                        if status.get('name', '').strip().lower() == normalized_status_name.lower():
                            status_result.data = [status]
                            break
            
            if status_result.data:
                new_status_id = status_result.data[0].get('id')
                found_status_name = status_result.data[0].get('name')
                update_dict["status_id"] = new_status_id
                # Chỉ update status_id, KHÔNG update status enum (tránh lỗi enum)
                logger.info(f"✅ Found status_id {new_status_id} for status name '{normalized_status_name}' (matched: '{found_status_name}')")
                
                # Verify: Nếu tên không khớp chính xác (case-insensitive), log warning
                if found_status_name.strip().lower() != normalized_status_name.lower():
                    logger.warning(f"⚠️  Status name mismatch: requested '{normalized_status_name}' but matched '{found_status_name}'")
            else:
                logger.warning(f"⚠️  Could not find status_id for status name '{normalized_status_name}'. Cannot update status without status_id.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Status '{normalized_status_name}' not found. Please use a valid status name."
                )
        
        # Update project status
        result = supabase.table("projects").update(update_dict).eq("id", project_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update project status: No data returned"
            )
        
        # Use found_status_name if available, otherwise use normalized_status_name or status_name
        final_status_name = found_status_name if found_status_name else (normalized_status_name if normalized_status_name else status_name)
        logger.info(f"✅ Successfully updated project {project_id} status to '{final_status_name}' (status_id: {new_status_id})")

        # Auto-assign checklist permissions based on new status
        if new_status_id and new_status_id != old_status_id and final_status_name:
            try:
                _auto_assign_checklist_permissions_for_status(supabase, project_id, final_status_name)
            except Exception as e:
                logger.error(f"Error auto-assigning checklist permissions for project {project_id}: {str(e)}")
                # Don't fail the status update if permission assignment fails

        # Auto-calculate and update progress based on new status position
        if new_status_id and new_status_id != old_status_id:
            try:
                # Calculate automatic progress based on status position
                auto_progress = calculate_progress_from_status(supabase, project_id, new_status_id)

                if auto_progress >= 0:
                    # Update progress in the database
                    supabase.table("projects").update({
                        "progress": auto_progress,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", project_id).execute()
                    print(f"Auto-updated project {project_id} progress to {auto_progress}% based on status change to {new_status_id}")

            except Exception as e:
                print(f"Error auto-calculating progress for project {project_id}: {str(e)}")
                # Don't fail the status update if progress calculation fails

        # Apply flow rules if status_id changed (trigger will also handle this, but we do it here for immediate effect)
        if new_status_id and new_status_id != old_status_id:
            # Get active flow rules for the new status
            flow_rules = supabase.table("project_status_flow_rules")\
                .select("category_id, action_type, priority")\
                .eq("status_id", new_status_id)\
                .eq("is_active", True)\
                .order("priority", desc=True)\
                .execute()
            
            if flow_rules.data:
                for rule in flow_rules.data:
                    category_id = rule.get('category_id')
                    action_type = rule.get('action_type', 'add')
                    
                    if action_type == 'add':
                        # Check if already in category
                        existing_member = supabase.table("project_category_members")\
                            .select("id")\
                            .eq("project_id", project_id)\
                            .eq("category_id", category_id)\
                            .execute()
                        
                        if not existing_member.data:
                            supabase.table("project_category_members")\
                                .insert({
                                    "project_id": project_id,
                                    "category_id": category_id,
                                    "added_by": current_user.id
                                })\
                                .execute()
                    elif action_type == 'remove':
                        # Remove from category
                        supabase.table("project_category_members")\
                            .delete()\
                            .eq("project_id", project_id)\
                            .eq("category_id", category_id)\
                            .execute()
            
            # Also check for rules on old status (to handle remove actions)
            if old_status_id:
                old_flow_rules = supabase.table("project_status_flow_rules")\
                    .select("category_id, action_type")\
                    .eq("status_id", old_status_id)\
                    .eq("is_active", True)\
                    .eq("action_type", "add")\
                    .execute()
                
                # If old status had "add" rules, check if we should remove from those categories
                # (only if new status doesn't have "add" rule for same category)
                if old_flow_rules.data:
                    new_category_ids = {r.get('category_id') for r in flow_rules.data if r.get('action_type') == 'add'} if flow_rules.data else set()
                    
                    for old_rule in old_flow_rules.data:
                        old_category_id = old_rule.get('category_id')
                        # Only remove if new status doesn't add to same category
                        if old_category_id not in new_category_ids:
                            supabase.table("project_category_members")\
                                .delete()\
                                .eq("project_id", project_id)\
                                .eq("category_id", old_category_id)\
                                .execute()
        
        if result.data:
            updated_project = result.data[0]
            logger.info(f"✅ Project {project_id} status updated successfully to '{status_name}' (status_id: {new_status_id})")
            
            # Tạo thông báo cho đội ngũ dự án về việc thay đổi trạng thái
            try:
                # Lấy tên dự án
                project_name = updated_project.get('name', 'N/A')
                
                # Lấy tên trạng thái cũ
                old_status_name = None
                if old_status_id:
                    old_status_result = supabase.table("project_statuses").select("name").eq("id", old_status_id).limit(1).execute()
                    if old_status_result.data:
                        old_status_name = old_status_result.data[0].get('name')
                
                # Lấy tên người thay đổi
                changed_by_name = None
                if current_user:
                    user_result = supabase.table("users").select("full_name, email").eq("id", current_user.id).limit(1).execute()
                    if user_result.data:
                        changed_by_name = user_result.data[0].get("full_name") or user_result.data[0].get("email")
                
                # Gửi thông báo cho đội ngũ dự án
                # Await trực tiếp để đảm bảo thông báo được tạo
                try:
                    await notification_service.notify_project_status_changed(
                        project_id=project_id,
                        project_name=project_name,
                        old_status=old_status_name,
                        new_status=final_status_name,
                        changed_by_name=changed_by_name,
                        changed_by_user_id=current_user.id if current_user else None
                    )
                    logger.info(f"✅ Notification sent for project status change: {project_name} -> {final_status_name}")
                except Exception as notify_err:
                    logger.error(f"❌ Failed to send project status change notification: {str(notify_err)}")
                    import traceback
                    logger.error(traceback.format_exc())
            except Exception as notify_error:
                # Log error nhưng không fail status update
                logger.warning(f"Failed to send project status change notification: {str(notify_error)}")
            
            return {
                "message": "Project status updated successfully",
                "project_id": project_id,
                "status": status_name,
                "status_id": new_status_id
            }
        
        logger.error(f"❌ Failed to update project {project_id} status: No data returned from update")
        # Use status module from fastapi (not the parameter)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update project status: No data returned"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating project status: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Use status module from fastapi, not the parameter 'status'
        from fastapi import status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project status: {str(e)}"
        )