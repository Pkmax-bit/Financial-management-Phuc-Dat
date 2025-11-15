"""
Authentication and Authorization Router
Handles login, registration, user management, and role-based access
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt import PyJWTError
from pydantic import BaseModel, EmailStr
import asyncio

from config import settings
from services.supabase_client import get_supabase_client
from services.email_service import email_service
from models.user import User, UserCreate, UserUpdate, UserLogin, UserResponse
from utils.auth import (
    create_access_token,
    verify_token,
    get_current_user,
    hash_password,
    create_password_reset_token,
    verify_password_reset_token,
)

router = APIRouter()
security = HTTPBearer()

# Pydantic models for API
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str


async def _handle_password_reset_request(email: str):
    """Shared handler for password reset requests (avoids account enumeration)."""
    normalized_email = email.strip().lower()
    success_message = "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."
    
    try:
        supabase = get_supabase_client()
        user_result = (
            supabase
            .table("users")
            .select("id, email, full_name")
            .eq("email", normalized_email)
            .limit(1)
            .execute()
        )
        
        if not user_result.data:
            # Small delay to make response timing uniform
            await asyncio.sleep(0.2)
            return {"message": success_message}
        
        user = user_result.data[0]
        token = create_password_reset_token(user["id"], user["email"])
        frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
        reset_link = f"{frontend_base}/reset-password?token={token}"
        
        email_sent = await email_service.send_password_reset_email(
            user_email=user["email"],
            user_name=user.get("full_name"),
            reset_link=reset_link
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau."
            )
        
        return {"message": success_message}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(e)}"
        )


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        supabase = get_supabase_client()
        
        # Check if user already exists
        existing_user = supabase.table("users").select("*").eq("email", user_data.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "role": user_data.role
                }
            }
        })
        
        if auth_response.user:
            # Create user record in custom users table
            user_record = {
                "id": auth_response.user.id,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "role": user_data.role,
                "password_hash": hashed_password,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("users").insert(user_record).execute()
            
            if result.data:
                return UserResponse(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Login user with email and password"""
    try:
        supabase = get_supabase_client()
        
        # Authenticate with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        if auth_response.user:
            # Get user details from custom users table
            user_result = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
            
            if user_result.data:
                user = user_result.data[0]
                
                # Update last login
                supabase.table("users").update({
                    "last_login": datetime.utcnow().isoformat()
                }).eq("id", user["id"]).execute()
                
                # Return Supabase JWT token instead of creating our own
                return Token(
                    access_token=auth_response.session.access_token,
                    token_type="bearer",
                    expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
                )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user"""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    try:
        supabase = get_supabase_client()
        
        update_data = user_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("users").update(update_data).eq("id", current_user.id).execute()
        
        if result.data:
            return UserResponse(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        supabase = get_supabase_client()
        
        # Verify current password
        auth_response = supabase.auth.sign_in_with_password({
            "email": current_user.email,
            "password": password_data.current_password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không đúng"
            )
        
        if len(password_data.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải có ít nhất 6 ký tự"
            )
        
        if len(password_data.new_password) > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới không được vượt quá 128 ký tự"
            )
        
        if password_data.current_password == password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải khác mật khẩu hiện tại"
            )
        
        # Update password in Supabase Auth
        try:
            supabase.auth.update_user({
                "password": password_data.new_password
            })
        except Exception as update_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Không thể cập nhật mật khẩu: {str(update_error)}"
            )
        
        # Update stored hash for reference
        supabase.table("users").update({
            "password_hash": hash_password(password_data.new_password),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_user.id).execute()
        
        await email_service.send_password_change_confirmation(
            user_email=current_user.email,
            user_name=current_user.full_name,
            via="manual"
        )
        
        return {"message": "Mật khẩu đã được cập nhật thành công"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )

@router.post("/password-reset/request")
async def request_password_reset(password_reset: PasswordReset):
    """Request password reset email with secure token"""
    return await _handle_password_reset_request(password_reset.email)


@router.post("/forgot-password")
async def forgot_password(password_reset: PasswordReset):
    """Backward-compatible endpoint for password reset requests"""
    return await _handle_password_reset_request(password_reset.email)

@router.post("/reset-password")
async def reset_password(password_reset_confirm: PasswordResetConfirm):
    """Reset password with token"""
    try:
        if len(password_reset_confirm.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải có ít nhất 6 ký tự"
            )
        
        if len(password_reset_confirm.new_password) > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới không được vượt quá 128 ký tự"
            )
        
        payload = verify_password_reset_token(password_reset_confirm.token)
        user_id = payload.get("sub")
        user_email = payload.get("email")
        
        if not user_id or not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token"
            )
        
        supabase = get_supabase_client()
        
        # Update password via admin API
        try:
            supabase.auth.admin.update_user_by_id(
                user_id,
                {"password": password_reset_confirm.new_password}
            )
        except Exception as update_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Không thể cập nhật mật khẩu: {str(update_error)}"
            )
        
        # Update stored hash
        try:
            supabase.table("users").update({
                "password_hash": hash_password(password_reset_confirm.new_password),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
        except Exception as hash_error:
            # Log error but don't fail the request since password is already updated in Supabase Auth
            print(f"Warning: Failed to update password hash: {str(hash_error)}")
        
        user_full_name = None
        try:
            user_result = supabase.table("users").select("full_name").eq("id", user_id).limit(1).execute()
            if user_result.data:
                user_full_name = user_result.data[0].get("full_name")
        except Exception:
            pass
        
        await email_service.send_password_change_confirmation(
            user_email=user_email,
            user_name=user_full_name,
            via="reset"
        )
        
        return {"message": "Mật khẩu đã được đặt lại thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )

@router.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get all users (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("users").select("*").range(skip, skip + limit - 1).execute()
        
        return [UserResponse(**user) for user in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        supabase = get_supabase_client()
        
        update_data = user_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if result.data:
            return UserResponse(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete user (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    try:
        supabase = get_supabase_client()
        
        # Deactivate user instead of deleting
        supabase.table("users").update({
            "is_active": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        
        return {"message": "User deactivated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )

@router.get("/debug-token")
async def debug_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug endpoint to test JWT token verification"""
    try:
        token = credentials.credentials
        
        # Try to verify with Supabase JWT secret
        try:
            payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
            return {
                "status": "success",
                "message": "Token verified successfully",
                "payload": payload
            }
        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Token has expired"}
        except PyJWTError as e:
            return {"status": "error", "message": f"Invalid token: {str(e)}"}
        
    except Exception as e:
        return {"status": "error", "message": f"Debug failed: {str(e)}"}
