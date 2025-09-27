"""
Authentication utilities
JWT token handling, password hashing, and user authentication
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt import PyJWTError
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
        # Use Supabase JWT secret for verification
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except PyJWTError:
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
        token = credentials.credentials
        print(f"🔍 DEBUG: Received token: {token[:50]}...")
        
        # Use anon client to verify JWT tokens from frontend
        from services.supabase_client import get_supabase_anon_client
        supabase = get_supabase_anon_client()
        
        try:
            # Get the user from Supabase using the JWT token
            user_response = supabase.auth.get_user(token)
            
            print(f"🔍 DEBUG: Supabase user response type: {type(user_response)}")
            print(f"🔍 DEBUG: Supabase user response: {user_response}")
            
            if not user_response or not hasattr(user_response, 'user') or not user_response.user:
                print("🔍 DEBUG: No user found in Supabase response")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            user_id = user_response.user.id
            email = user_response.user.email
            
            print(f"🔍 DEBUG: Extracted user_id: {user_id}, email: {email}")
            
            if not user_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
        except HTTPException:
            raise
        except Exception as auth_error:
            print(f"🔍 DEBUG: Supabase auth error: {str(auth_error)}")
            print(f"🔍 DEBUG: Auth error type: {type(auth_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(auth_error)}"
            )
        
        # Use service client for database operations
        supabase = get_supabase_client()
        
        # Get user profile from our users table
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            # Create user profile if it doesn't exist
            user_metadata = user_response.user.user_metadata or {}
            app_metadata = user_response.user.app_metadata or {}
            
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

def require_role_permission(required_permission: str):
    """Decorator to require specific permission based on role"""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        role_permissions = {
            "admin": ["read", "write", "delete", "approve", "manage_users", "system_config"],
            "manager": ["read", "write", "approve", "manage_team"],
            "employee": ["read", "write_own", "submit"],
            "viewer": ["read"]
        }
        
        user_permissions = role_permissions.get(current_user.role, [])
        
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_permission} permission"
            )
        return current_user
    return permission_checker

def can_access_entity(entity_type: str, entity_id: str):
    """Check if user can access specific entity based on business rules"""
    def access_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admin can access everything
        if current_user.role == "admin":
            return current_user
            
        # Add entity-specific access logic here
        # For example: employees can only access their own expenses
        if entity_type == "expense":
            # Check if expense belongs to current user
            from services.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            # Get employee record for current user
            employee_result = supabase.table("employees").select("id").eq("user_id", current_user.id).execute()
            if not employee_result.data:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee record not found")
            
            employee_id = employee_result.data[0]["id"]
            
            # Check if expense belongs to this employee
            expense_result = supabase.table("expenses").select("employee_id").eq("id", entity_id).execute()
            if not expense_result.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
                
            if expense_result.data[0]["employee_id"] != employee_id:
                if current_user.role not in ["manager", "admin"]:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return current_user
    return access_checker
