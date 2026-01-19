"""
Permission checking utilities and decorators
"""

from functools import wraps
from typing import List, Optional
from fastapi import HTTPException, Depends, status
from models.user import User
from models.permissions import Permission, UserRole, ProjectStage, has_permission
from utils.auth import get_current_user

def require_permission(permission: Permission, project_stage: Optional[ProjectStage] = None):
    """
    Decorator to require specific permission
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user has permission
            user_role = UserRole(current_user.role)
            if not has_permission(user_role, permission, project_stage):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required for role '{user_role}'"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(allowed_roles: List[UserRole]):
    """
    Decorator to require specific roles
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user role is allowed
            user_role = UserRole(current_user.role)
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{user_role}' not allowed. Required roles: {allowed_roles}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_project_stage_access(project_stage: ProjectStage):
    """
    Decorator to require access to specific project stage
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user has access to project stage
            user_role = UserRole(current_user.role)
            from models.permissions import get_user_permissions
            
            stage_permissions = get_user_permissions(user_role, project_stage)
            if not stage_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{user_role}' does not have access to project stage '{project_stage}'"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class PermissionChecker:
    """Permission checking class for dependency injection"""
    
    def __init__(self, required_permission: Permission, project_stage: Optional[ProjectStage] = None):
        self.required_permission = required_permission
        self.project_stage = project_stage
    
    def __call__(self, current_user: User = Depends(get_current_user)):
        user_role = UserRole(current_user.role)
        
        if not has_permission(user_role, self.required_permission, self.project_stage):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{self.required_permission}' required for role '{user_role}'"
            )
        
        return current_user

class RoleChecker:
    """Role checking class for dependency injection"""
    
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)):
        user_role = UserRole(current_user.role)
        
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' not allowed. Required roles: {self.allowed_roles}"
            )
        
        return current_user

# Common permission checkers
require_admin = RoleChecker([UserRole.ADMIN])
require_sales = RoleChecker([UserRole.SALES])
require_accountant = RoleChecker([UserRole.ACCOUNTANT])
require_hr_manager = RoleChecker([UserRole.HR_MANAGER])
require_employee = RoleChecker([
    UserRole.SALES, 
    UserRole.ACCOUNTANT,
    UserRole.HR_MANAGER,
    UserRole.WORKSHOP_EMPLOYEE, 
    UserRole.WORKER, 
    UserRole.TRANSPORT
])
require_customer = RoleChecker([UserRole.CUSTOMER])

# Project stage checkers
require_planning_access = PermissionChecker(Permission.VIEW_PROJECT, ProjectStage.PLANNING)
require_execution_access = PermissionChecker(Permission.VIEW_PROJECT, ProjectStage.EXECUTION)
require_completion_access = PermissionChecker(Permission.VIEW_PROJECT, ProjectStage.COMPLETION)

# Specific permission checkers
require_create_project = PermissionChecker(Permission.CREATE_PROJECT)
require_edit_project = PermissionChecker(Permission.EDIT_PROJECT)
require_view_reports = PermissionChecker(Permission.VIEW_REPORTS)
require_manage_users = PermissionChecker(Permission.MANAGE_USERS)
