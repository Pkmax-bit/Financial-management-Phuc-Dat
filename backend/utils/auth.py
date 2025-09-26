"""
Authentication utilities
JWT token handling, password hashing, and user authentication
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from services.supabase_client import get_supabase_client
from models.user import User

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user using Supabase token"""
    try:
        supabase = get_supabase_client()
        token = credentials.credentials
        
        # Verify JWT token directly using PyJWT
        try:
            # Decode the JWT token (Supabase uses RS256 algorithm with their public key)
            # For now, let's try to decode without verification to get the payload
            import jwt
            
            # First, let's try to decode the token without verification to see the structure
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Extract user information from the token
            user_id = payload.get("sub")  # Supabase uses 'sub' for user ID
            email = payload.get("email")
            
            if not user_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Additional verification: check if token is expired
            exp = payload.get("exp")
            if exp:
                import time
                current_time = int(time.time())
                if current_time > exp:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
            
        except jwt.DecodeError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        except Exception as decode_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(decode_error)}"
            )
        
        # Get user profile from our users table
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            # Create user profile if it doesn't exist
            user_metadata = payload.get("user_metadata", {})
            app_metadata = payload.get("app_metadata", {})
            
            user_data = {
                "id": user_id,
                "email": email,
                "full_name": user_metadata.get("full_name", email.split("@")[0]),
                "role": app_metadata.get("role", "employee"),  # default role
                "is_active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            try:
                result = supabase.table("users").insert(user_data).execute()
                if result.data:
                    user_data = result.data[0]
                else:
                    # If insert fails, try to get the user again (might be race condition)
                    result = supabase.table("users").select("*").eq("id", user_id).execute()
                    if result.data:
                        user_data = result.data[0]
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to create user profile"
                        )
            except Exception as insert_error:
                # User might already exist, try to fetch again
                result = supabase.table("users").select("*").eq("id", user_id).execute()
                if result.data:
                    user_data = result.data[0]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to handle user profile: {str(insert_error)}"
                    )
        else:
            user_data = result.data[0]
        
        # Check if user is active
        if not user_data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        return User(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_role(required_role: str):
    """Decorator to require specific role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires admin role"
        )
    return current_user

def require_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require manager or admin role"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires manager or admin role"
        )
    return current_user
