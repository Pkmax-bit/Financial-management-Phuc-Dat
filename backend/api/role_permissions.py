from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class RolePermissionBase(BaseModel):
    role_name: str
    permissions: List[str]

class RolePermissionResponse(BaseModel):
    role_name: str
    permissions: List[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

@router.get("/role-permissions", response_model=List[RolePermissionResponse])
async def get_role_permissions():
    try:
        response = supabase.table('role_permissions') \
            .select('*') \
            .execute()
        
        if not response.data:
            return []
        
        # Group permissions by role
        role_permissions = {}
        for item in response.data:
            role = item['role_name']
            if role not in role_permissions:
                role_permissions[role] = {
                    'role_name': role,
                    'permissions': [],
                    'created_at': item['created_at'],
                    'updated_at': item['updated_at']
                }
            role_permissions[role]['permissions'].append(item['permission_id'])
        
        return list(role_permissions.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/role-permissions")
async def create_role_permissions(role_permission: RolePermissionBase):
    try:
        # Check if this is a system role
        from utils.rolePermissions import ROLE_HIERARCHY
        is_system_role = role_permission.role_name in ROLE_HIERARCHY.keys()
        
        # Delete existing permissions for this role
        await delete_role_permissions(role_permission.role_name)
        
        # Insert new permissions
        data = [
            {
                'role_name': role_permission.role_name,
                'permission_id': permission,
                'role_type': 'system' if is_system_role else 'custom'
            }
            for permission in role_permission.permissions
        ]
        
        response = supabase.table('role_permissions') \
            .insert(data) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create role permissions")
        
        return {"message": "Role permissions created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/role-permissions/{role_name}")
async def update_role_permissions(role_name: str, role_permission: RolePermissionBase):
    try:
        if role_name != role_permission.role_name:
            raise HTTPException(status_code=400, detail="Role name mismatch")
        
        # Delete existing permissions
        await delete_role_permissions(role_name)
        
        # Insert new permissions
        data = [
            {
                'role_name': role_permission.role_name,
                'permission_id': permission
            }
            for permission in role_permission.permissions
        ]
        
        response = supabase.table('role_permissions') \
            .insert(data) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update role permissions")
        
        return {"message": "Role permissions updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/role-permissions/{role_name}")
async def delete_role_permissions(role_name: str):
    try:
        response = supabase.table('role_permissions') \
            .delete() \
            .eq('role_name', role_name) \
            .execute()
        
        return {"message": "Role permissions deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to check permissions
async def check_permission(role_name: str, permission_id: str) -> bool:
    try:
        response = supabase.table('role_permissions') \
            .select('*') \
            .eq('role_name', role_name) \
            .eq('permission_id', permission_id) \
            .execute()
        
        return bool(response.data)
    except Exception:
        return False
