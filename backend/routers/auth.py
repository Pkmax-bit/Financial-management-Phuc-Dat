"""
Authentication and Authorization Router
Handles login, registration, user management, and role-based access
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from pydantic import BaseModel, EmailStr

from config import settings
from services.supabase_client import get_supabase_client
from models.user import User, UserCreate, UserUpdate, UserLogin, UserResponse
from utils.auth import create_access_token, verify_token, get_current_user

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

@router.post("/create-demo-user")
async def create_demo_user():
    """Create demo user for testing"""
    try:
        supabase = get_supabase_client()
        
        demo_email = "admin@example.com"
        demo_password = "admin123"
        
        # Check if demo user already exists
        existing_user = supabase.table("users").select("*").eq("email", demo_email).execute()
        if existing_user.data:
            return {"message": "Demo user already exists", "email": demo_email}
        
        # Create user in Supabase Auth
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": demo_email,
                "password": demo_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": "Admin User",
                    "role": "admin"
                }
            })
            
            if auth_response.user:
                # Create user record in custom users table
                user_record = {
                    "id": auth_response.user.id,
                    "email": demo_email,
                    "full_name": "Admin User",
                    "role": "admin",
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("users").insert(user_record).execute()
                
                if result.data:
                    return {
                        "message": "Demo user created successfully",
                        "email": demo_email,
                        "password": demo_password,
                        "user_id": auth_response.user.id
                    }
        
        except Exception as create_error:
            # If user creation fails, it might be because the user already exists in auth but not in our table
            # Try to get the auth user
            try:
                users = supabase.auth.admin.list_users()
                auth_user = None
                for user in users:
                    if user.email == demo_email:
                        auth_user = user
                        break
                
                if auth_user:
                    # Create user record in our table
                    user_record = {
                        "id": auth_user.id,
                        "email": demo_email,
                        "full_name": "Admin User",
                        "role": "admin",
                        "is_active": True,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    
                    result = supabase.table("users").insert(user_record).execute()
                    
                    if result.data:
                        return {
                            "message": "Demo user profile created successfully",
                            "email": demo_email,
                            "password": demo_password,
                            "user_id": auth_user.id
                        }
            except Exception as e2:
                pass
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create demo user: {str(create_error)}"
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create demo user"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo user creation failed: {str(e)}"
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
        hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
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
                
                # Create JWT token
                access_token = create_access_token(data={"sub": user["email"], "user_id": user["id"]})
                
                return Token(
                    access_token=access_token,
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
                detail="Current password is incorrect"
            )
        
        # Update password in Supabase Auth
        supabase.auth.update_user({
            "password": password_data.new_password
        })
        
        return {"message": "Password updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )

@router.post("/forgot-password")
async def forgot_password(password_reset: PasswordReset):
    """Send password reset email"""
    try:
        supabase = get_supabase_client()
        
        # Send password reset email
        supabase.auth.reset_password_email(password_reset.email)
        
        return {"message": "Password reset email sent"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )

@router.post("/reset-password")
async def reset_password(password_reset_confirm: PasswordResetConfirm):
    """Reset password with token"""
    try:
        supabase = get_supabase_client()
        
        # Update password with token
        supabase.auth.update_user({
            "password": password_reset_confirm.new_password
        })
        
        return {"message": "Password reset successfully"}
        
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
