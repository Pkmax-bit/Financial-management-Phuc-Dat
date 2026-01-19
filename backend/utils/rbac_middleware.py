"""
Role-Based Access Control (RBAC) Middleware
Enhanced authentication and authorization system
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from functools import wraps
import jwt
from datetime import datetime

from models.user import User, UserRole
from models.permissions import Permission, ProjectStage, ROLE_PERMISSIONS, has_permission
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

security = HTTPBearer()

class RBACManager:
    """Role-Based Access Control Manager"""
    
    def __init__(self):
        self.role_hierarchy = {
            UserRole.ADMIN: 100,
            UserRole.HR_MANAGER: 85,  # Cao hơn ACCOUNTANT vì có thêm quyền quản lý nhân viên
            UserRole.SALES: 80,
            UserRole.ACCOUNTANT: 70,
            UserRole.WORKSHOP_EMPLOYEE: 60,
            UserRole.WORKER: 50,
            UserRole.TRANSPORT: 40,
            UserRole.CUSTOMER: 30,
            UserRole.EMPLOYEE: 20
        }
    
    def get_role_level(self, role: UserRole) -> int:
        """Get hierarchy level for a role"""
        return self.role_hierarchy.get(role, 0)
    
    def has_higher_or_equal_role(self, user_role: UserRole, required_role: UserRole) -> bool:
        """Check if user has higher or equal role level"""
        return self.get_role_level(user_role) >= self.get_role_level(required_role)
    
    def get_user_permissions(self, user: User, project_stage: Optional[ProjectStage] = None) -> List[Permission]:
        """Get all permissions for a user based on their role"""
        if user.role not in ROLE_PERMISSIONS:
            return []
        
        role_permissions = ROLE_PERMISSIONS[user.role]
        permissions = role_permissions.permissions.copy()
        
        if project_stage and project_stage in role_permissions.project_stage_access:
            permissions.extend(role_permissions.project_stage_access[project_stage])
        
        return list(set(permissions))  # Remove duplicates
    
    def can_access_feature(self, user: User, feature: str) -> bool:
        """Check if user can access a specific feature"""
        feature_permissions = {
            'customers': [Permission.VIEW_CUSTOMER_PROGRESS, Permission.VIEW_CUSTOMER_PROJECTS],
            'projects': [Permission.VIEW_PROJECT, Permission.CREATE_PROJECT],
            'quotes': [Permission.VIEW_QUOTE, Permission.CREATE_QUOTE],
            'invoices': [Permission.VIEW_INVOICE, Permission.CREATE_INVOICE],
            'expenses': [Permission.VIEW_COST, Permission.CREATE_COST],
            'reports': [Permission.VIEW_REPORTS, Permission.CREATE_REPORTS],
            'users': [Permission.MANAGE_USERS, Permission.MANAGE_ROLES]
        }
        
        if feature not in feature_permissions:
            return True  # Allow access to unknown features
        
        required_permissions = feature_permissions[feature]
        user_permissions = self.get_user_permissions(user)
        
        return any(perm in user_permissions for perm in required_permissions)

# Global RBAC manager instance
rbac_manager = RBACManager()

def require_role(allowed_roles: List[UserRole]):
    """Decorator to require specific roles"""
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
            
            # Check if user has required role
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}. Your role: {current_user.role.value}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_permission(permission: Permission, project_stage: Optional[ProjectStage] = None):
    """Decorator to require specific permission"""
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
            if not has_permission(current_user.role, permission, project_stage):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission.value}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_feature_access(feature: str):
    """Decorator to require access to a specific feature"""
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
            
            # Check if user can access feature
            if not rbac_manager.can_access_feature(current_user, feature):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied to feature '{feature}'"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Common role-based dependencies
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require manager (sales/accountant) or admin role"""
    # Convert role to string for comparison (UserRole enum has string value)
    user_role_str = str(current_user.role.value) if isinstance(current_user.role, UserRole) else str(current_user.role)
    print(f"[RBAC] Checking permissions for user: {current_user.email}, Role: {current_user.role} (value: {user_role_str})")
    
    allowed_roles = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SALES, UserRole.ACCOUNTANT]
    allowed_role_values = [role.value for role in allowed_roles]  # Get string values: ["admin", "hr_manager", "sales", "accountant"]
    
    # Compare by value (string) instead of enum object
    if user_role_str not in allowed_role_values:
        print(f"[RBAC] Access denied. User role '{user_role_str}' not in allowed roles: {allowed_role_values}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Manager or admin access required. Current role: {user_role_str}"
        )
    print(f"[RBAC] Access granted for user: {current_user.email} with role: {user_role_str}")
    return current_user

def require_employee_or_higher(current_user: User = Depends(get_current_user)) -> User:
    """Require employee role or higher"""
    allowed_roles = [
        UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SALES, UserRole.ACCOUNTANT,
        UserRole.WORKSHOP_EMPLOYEE, UserRole.WORKER, UserRole.TRANSPORT, UserRole.EMPLOYEE
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access or higher required"
        )
    return current_user

def require_customer_or_higher(current_user: User = Depends(get_current_user)) -> User:
    """Require customer role or higher (allows all roles)"""
    return current_user

# Feature-specific access controls
def require_customer_management(current_user: User = Depends(get_current_user)) -> User:
    """Require permission to manage customers"""
    if not rbac_manager.can_access_feature(current_user, 'customers'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer management access required"
        )
    return current_user

def require_project_management(current_user: User = Depends(get_current_user)) -> User:
    """Require permission to manage projects"""
    if not rbac_manager.can_access_feature(current_user, 'projects'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project management access required"
        )
    return current_user

def require_financial_access(current_user: User = Depends(get_current_user)) -> User:
    """Require permission to access financial data"""
    allowed_roles = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTANT, UserRole.SALES]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Financial access required"
        )
    return current_user

def require_reporting_access(current_user: User = Depends(get_current_user)) -> User:
    """Require permission to access reports"""
    if not rbac_manager.can_access_feature(current_user, 'reports'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reporting access required"
        )
    return current_user

def require_user_management(current_user: User = Depends(get_current_user)) -> User:
    """Require permission to manage users"""
    if not rbac_manager.can_access_feature(current_user, 'users'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User management access required"
        )
    return current_user

# Utility functions
def get_user_role_info(user: User) -> Dict[str, Any]:
    """Get comprehensive role information for a user"""
    permissions = rbac_manager.get_user_permissions(user)
    role_level = rbac_manager.get_role_level(user.role)
    
    return {
        "role": user.role.value,
        "role_level": role_level,
        "permissions": [perm.value for perm in permissions],
        "can_manage_customers": rbac_manager.can_access_feature(user, 'customers'),
        "can_manage_projects": rbac_manager.can_access_feature(user, 'projects'),
        "can_access_financial": user.role in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTANT, UserRole.SALES],
        "can_view_reports": rbac_manager.can_access_feature(user, 'reports'),
        "can_manage_users": rbac_manager.can_access_feature(user, 'users')
    }

def check_permission_for_user(user: User, permission: Permission, project_stage: Optional[ProjectStage] = None) -> bool:
    """Check if a user has a specific permission"""
    return has_permission(user.role, permission, project_stage)

def get_accessible_features(user: User) -> List[str]:
    """Get list of features accessible to a user"""
    features = ['customers', 'projects', 'quotes', 'invoices', 'expenses', 'reports', 'users']
    accessible = []
    
    for feature in features:
        if rbac_manager.can_access_feature(user, feature):
            accessible.append(feature)
    
    return accessible
