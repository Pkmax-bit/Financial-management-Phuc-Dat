"""
Permission models and role-based access control
"""

from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel
from .user import UserRole

class ProjectStage(str, Enum):
    """Project stages"""
    PLANNING = "planning"
    EXECUTION = "execution"
    COMPLETION = "completion"

class Permission(str, Enum):
    """System permissions"""
    # Project permissions
    CREATE_PROJECT = "create_project"
    VIEW_PROJECT = "view_project"
    EDIT_PROJECT = "edit_project"
    DELETE_PROJECT = "delete_project"
    
    # Quote permissions
    CREATE_QUOTE = "create_quote"
    VIEW_QUOTE = "view_quote"
    EDIT_QUOTE = "edit_quote"
    APPROVE_QUOTE = "approve_quote"
    
    # Invoice permissions
    CREATE_INVOICE = "create_invoice"
    VIEW_INVOICE = "view_invoice"
    EDIT_INVOICE = "edit_invoice"
    PAY_INVOICE = "pay_invoice"
    
    # Cost permissions
    CREATE_COST = "create_cost"
    VIEW_COST = "view_cost"
    EDIT_COST = "edit_cost"
    APPROVE_COST = "approve_cost"
    
    # Customer permissions
    VIEW_CUSTOMER_PROGRESS = "view_customer_progress"
    VIEW_CUSTOMER_PROJECTS = "view_customer_projects"
    
    # Report permissions
    VIEW_REPORTS = "view_reports"
    CREATE_REPORTS = "create_reports"
    
    # User management
    MANAGE_USERS = "manage_users"
    MANAGE_ROLES = "manage_roles"

class RolePermissions(BaseModel):
    """Role-based permissions configuration"""
    role: UserRole
    permissions: List[Permission]
    project_stage_access: Dict[ProjectStage, List[Permission]]

# Define role-based permissions
ROLE_PERMISSIONS = {
    UserRole.ADMIN: RolePermissions(
        role=UserRole.ADMIN,
        permissions=[
            Permission.CREATE_PROJECT,
            Permission.VIEW_PROJECT,
            Permission.EDIT_PROJECT,
            Permission.DELETE_PROJECT,
            Permission.CREATE_QUOTE,
            Permission.VIEW_QUOTE,
            Permission.EDIT_QUOTE,
            Permission.APPROVE_QUOTE,
            Permission.CREATE_INVOICE,
            Permission.VIEW_INVOICE,
            Permission.EDIT_INVOICE,
            Permission.PAY_INVOICE,
            Permission.CREATE_COST,
            Permission.VIEW_COST,
            Permission.EDIT_COST,
            Permission.APPROVE_COST,
            Permission.VIEW_CUSTOMER_PROGRESS,
            Permission.VIEW_CUSTOMER_PROJECTS,
            Permission.VIEW_REPORTS,
            Permission.CREATE_REPORTS,
            Permission.MANAGE_USERS,
            Permission.MANAGE_ROLES
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.CREATE_PROJECT,
                Permission.VIEW_PROJECT,
                Permission.EDIT_PROJECT,
                Permission.CREATE_QUOTE,
                Permission.VIEW_QUOTE,
                Permission.EDIT_QUOTE,
                Permission.APPROVE_QUOTE
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.EDIT_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST,
                Permission.APPROVE_COST,
                Permission.VIEW_CUSTOMER_PROGRESS
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST,
                Permission.VIEW_REPORTS,
                Permission.CREATE_REPORTS
            ]
        }
    ),
    
    UserRole.SALES: RolePermissions(
        role=UserRole.SALES,
        permissions=[
            Permission.CREATE_PROJECT,
            Permission.VIEW_PROJECT,
            Permission.EDIT_PROJECT,
            Permission.CREATE_QUOTE,
            Permission.VIEW_QUOTE,
            Permission.EDIT_QUOTE,
            Permission.APPROVE_QUOTE,
            Permission.CREATE_COST,
            Permission.VIEW_COST,
            Permission.EDIT_COST,
            Permission.APPROVE_COST,
            Permission.VIEW_CUSTOMER_PROGRESS,
            Permission.VIEW_CUSTOMER_PROJECTS
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.CREATE_PROJECT,
                Permission.VIEW_PROJECT,
                Permission.EDIT_PROJECT,
                Permission.CREATE_QUOTE,
                Permission.VIEW_QUOTE,
                Permission.EDIT_QUOTE,
                Permission.APPROVE_QUOTE,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_CUSTOMER_PROGRESS,
                Permission.CREATE_QUOTE,
                Permission.VIEW_QUOTE,
                Permission.EDIT_QUOTE,
                Permission.APPROVE_QUOTE,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST,
                Permission.APPROVE_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_CUSTOMER_PROGRESS,
                Permission.VIEW_COST,
                Permission.VIEW_QUOTE
            ]
        }
    ),
    
    UserRole.ACCOUNTANT: RolePermissions(
        role=UserRole.ACCOUNTANT,
        permissions=[
            Permission.VIEW_PROJECT,
            Permission.CREATE_INVOICE,
            Permission.VIEW_INVOICE,
            Permission.EDIT_INVOICE,
            Permission.CREATE_COST,
            Permission.VIEW_COST,
            Permission.EDIT_COST,
            Permission.APPROVE_COST,
            Permission.VIEW_REPORTS,
            Permission.CREATE_REPORTS
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_INVOICE,
                Permission.VIEW_INVOICE,
                Permission.EDIT_INVOICE
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST,
                Permission.APPROVE_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST,
                Permission.VIEW_REPORTS,
                Permission.CREATE_REPORTS
            ]
        }
    ),
    
    UserRole.WORKSHOP_EMPLOYEE: RolePermissions(
        role=UserRole.WORKSHOP_EMPLOYEE,
        permissions=[
            Permission.VIEW_PROJECT,
            Permission.CREATE_COST,
            Permission.VIEW_COST,
            Permission.EDIT_COST
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_PROJECT
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST
            ]
        }
    ),
    
    UserRole.WORKER: RolePermissions(
        role=UserRole.WORKER,
        permissions=[
            Permission.VIEW_PROJECT,
            Permission.CREATE_COST,
            Permission.VIEW_COST
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_PROJECT
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST
            ]
        }
    ),
    
    UserRole.TRANSPORT: RolePermissions(
        role=UserRole.TRANSPORT,
        permissions=[
            Permission.VIEW_PROJECT,
            Permission.CREATE_COST,
            Permission.VIEW_COST
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_PROJECT
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST
            ]
        }
    ),
    
    UserRole.EMPLOYEE: RolePermissions(
        role=UserRole.EMPLOYEE,
        permissions=[
            Permission.VIEW_PROJECT,
            Permission.CREATE_COST,
            Permission.VIEW_COST,
            Permission.EDIT_COST
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_PROJECT
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_PROJECT,
                Permission.CREATE_COST,
                Permission.VIEW_COST,
                Permission.EDIT_COST
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_PROJECT,
                Permission.VIEW_COST
            ]
        }
    ),
    
    UserRole.CUSTOMER: RolePermissions(
        role=UserRole.CUSTOMER,
        permissions=[
            Permission.VIEW_CUSTOMER_PROGRESS,
            Permission.VIEW_CUSTOMER_PROJECTS,
            Permission.VIEW_QUOTE,
            Permission.APPROVE_QUOTE,
            Permission.VIEW_INVOICE,
            Permission.PAY_INVOICE
        ],
        project_stage_access={
            ProjectStage.PLANNING: [
                Permission.VIEW_CUSTOMER_PROJECTS,
                Permission.VIEW_QUOTE,
                Permission.APPROVE_QUOTE
            ],
            ProjectStage.EXECUTION: [
                Permission.VIEW_CUSTOMER_PROGRESS,
                Permission.VIEW_CUSTOMER_PROJECTS,
                Permission.VIEW_INVOICE,
                Permission.PAY_INVOICE
            ],
            ProjectStage.COMPLETION: [
                Permission.VIEW_CUSTOMER_PROGRESS,
                Permission.VIEW_CUSTOMER_PROJECTS
            ]
        }
    )
}

def get_user_permissions(role: UserRole, project_stage: ProjectStage = None) -> List[Permission]:
    """Get permissions for a user role and optional project stage"""
    if role not in ROLE_PERMISSIONS:
        return []
    
    role_permissions = ROLE_PERMISSIONS[role]
    
    if project_stage:
        return role_permissions.project_stage_access.get(project_stage, [])
    else:
        return role_permissions.permissions

def has_permission(user_role: UserRole, permission: Permission, project_stage: ProjectStage = None) -> bool:
    """Check if a user role has a specific permission"""
    user_permissions = get_user_permissions(user_role, project_stage)
    return permission in user_permissions

def get_role_hierarchy() -> Dict[UserRole, int]:
    """Get role hierarchy for permission inheritance"""
    return {
        UserRole.ADMIN: 100,
        UserRole.ACCOUNTANT: 80,
        UserRole.SALES: 70,
        UserRole.WORKSHOP_EMPLOYEE: 60,
        UserRole.EMPLOYEE: 55,
        UserRole.TRANSPORT: 50,
        UserRole.WORKER: 40,
        UserRole.CUSTOMER: 10
    }
