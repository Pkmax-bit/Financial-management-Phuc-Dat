from fastapi import HTTPException, Depends
from typing import List
from backend.api.role_permissions import check_permission

async def require_permissions(required_permissions: List[str]):
    async def permission_dependency(user_role: str):
        for permission in required_permissions:
            has_permission = await check_permission(user_role, permission)
            if not has_permission:
                raise HTTPException(
                    status_code=403,
                    detail=f"User does not have required permission: {permission}"
                )
        return True
    return permission_dependency
