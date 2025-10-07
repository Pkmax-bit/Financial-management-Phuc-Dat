"""
Demo router showing how to use the permission system
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.user import User
from models.permissions import Permission, UserRole, ProjectStage
from utils.auth import get_current_user
from utils.permissions import (
    require_permission, 
    require_role, 
    require_project_stage_access,
    require_admin,
    require_sales,
    require_accountant,
    require_employee,
    require_customer,
    PermissionChecker,
    RoleChecker
)

router = APIRouter()

# Example 1: Using decorators
@router.get("/admin-only")
@require_role([UserRole.ADMIN])
async def admin_only_endpoint(current_user: User = Depends(get_current_user)):
    """Only admin can access"""
    return {"message": f"Hello admin {current_user.full_name}!"}

@router.get("/sales-only")
@require_role([UserRole.SALES])
async def sales_only_endpoint(current_user: User = Depends(get_current_user)):
    """Only sales can access"""
    return {"message": f"Hello sales {current_user.full_name}!"}

@router.get("/create-project")
@require_permission(Permission.CREATE_PROJECT)
async def create_project_endpoint(current_user: User = Depends(get_current_user)):
    """Users with CREATE_PROJECT permission can access"""
    return {"message": f"Creating project as {current_user.role}"}

# Example 2: Using dependency injection
@router.get("/view-reports")
async def view_reports_endpoint(
    current_user: User = Depends(PermissionChecker(Permission.VIEW_REPORTS))
):
    """Users with VIEW_REPORTS permission can access"""
    return {"message": f"Viewing reports as {current_user.role}"}

@router.get("/manage-users")
async def manage_users_endpoint(
    current_user: User = Depends(require_admin)
):
    """Only admin can manage users"""
    return {"message": f"Managing users as {current_user.role}"}

# Example 3: Project stage specific permissions
@router.get("/planning-stage")
@require_project_stage_access(ProjectStage.PLANNING)
async def planning_stage_endpoint(current_user: User = Depends(get_current_user)):
    """Users with planning stage access can access"""
    return {"message": f"Accessing planning stage as {current_user.role}"}

@router.get("/execution-stage")
@require_project_stage_access(ProjectStage.EXECUTION)
async def execution_stage_endpoint(current_user: User = Depends(get_current_user)):
    """Users with execution stage access can access"""
    return {"message": f"Accessing execution stage as {current_user.role}"}

@router.get("/completion-stage")
@require_project_stage_access(ProjectStage.COMPLETION)
async def completion_stage_endpoint(current_user: User = Depends(get_current_user)):
    """Users with completion stage access can access"""
    return {"message": f"Accessing completion stage as {current_user.role}"}

# Example 4: Role-based endpoints
@router.get("/employee-dashboard")
async def employee_dashboard(
    current_user: User = Depends(require_employee)
):
    """All employees can access"""
    return {
        "message": f"Employee dashboard for {current_user.full_name}",
        "role": current_user.role
    }

@router.get("/customer-portal")
async def customer_portal(
    current_user: User = Depends(require_customer)
):
    """Only customers can access"""
    return {
        "message": f"Customer portal for {current_user.full_name}",
        "role": current_user.role
    }

# Example 5: Complex permission checking
@router.post("/approve-quote/{quote_id}")
async def approve_quote(
    quote_id: str,
    current_user: User = Depends(PermissionChecker(Permission.APPROVE_QUOTE))
):
    """Users with APPROVE_QUOTE permission can access"""
    return {
        "message": f"Quote {quote_id} approved by {current_user.role}",
        "quote_id": quote_id
    }

@router.post("/create-cost")
async def create_cost(
    current_user: User = Depends(PermissionChecker(Permission.CREATE_COST))
):
    """Users with CREATE_COST permission can access"""
    return {
        "message": f"Cost created by {current_user.role}",
        "user": current_user.full_name
    }

# Example 6: Multiple role access
@router.get("/financial-reports")
async def financial_reports(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.ACCOUNTANT]))
):
    """Admin and accountant can access financial reports"""
    return {
        "message": f"Financial reports accessed by {current_user.role}",
        "user": current_user.full_name
    }

# Example 7: Customer-specific endpoints
@router.get("/my-projects")
async def get_my_projects(
    current_user: User = Depends(require_customer)
):
    """Customers can view their own projects"""
    return {
        "message": f"Projects for customer {current_user.full_name}",
        "user_id": current_user.id
    }

@router.get("/project-progress/{project_id}")
async def get_project_progress(
    project_id: str,
    current_user: User = Depends(PermissionChecker(Permission.VIEW_CUSTOMER_PROGRESS))
):
    """Users with VIEW_CUSTOMER_PROGRESS permission can access"""
    return {
        "message": f"Project {project_id} progress for {current_user.role}",
        "project_id": project_id
    }
