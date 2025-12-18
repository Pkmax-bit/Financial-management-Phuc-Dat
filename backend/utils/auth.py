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
from models.user import User, UserRole

security = HTTPBearer()

def create_password_reset_token(user_id: str, email: str) -> str:
    """Create a short-lived token for password reset emails"""
    expire = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "type": "password_reset",
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password_reset_token(token: str) -> dict:
    """Validate password reset token and return its payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token"
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired"
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token"
        )

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
        # Only log in debug mode or on errors
        # print(f"[AUTH] Received token: {token[:30]}..." if token and len(token) > 30 else f"[AUTH] Token: {token}")
        
        if not token:
            print("[AUTH] ERROR: No token provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No token provided"
            )
        
        # Validate token format (should be JWT with 3 parts)
        token_parts = token.split('.')
        if len(token_parts) != 3:
            print(f"[AUTH] ERROR: Invalid token format (expected 3 parts, got {len(token_parts)})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # Use anon client to verify JWT tokens from frontend
        from services.supabase_client import get_supabase_anon_client
        supabase = get_supabase_anon_client()
        
        try:
            # Only log in debug mode
            # print("[AUTH] Verifying token with Supabase...")
            # Get the user from Supabase using the JWT token
            user_response = supabase.auth.get_user(token)
            # Only log in debug mode
            # print(f"[AUTH] Token verified successfully for user: {user_response.user.email if user_response and user_response.user else 'unknown'}")

            if not user_response or not hasattr(user_response, 'user') or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            user_id = user_response.user.id
            email = user_response.user.email
            
            
            if not user_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
        except HTTPException:
            raise
        except Exception as auth_error:
            error_msg = str(auth_error)
            print(f"[AUTH] ERROR: Token verification failed: {error_msg}")
            print(f"[AUTH] Error type: {type(auth_error).__name__}")
            
            # Provide more specific error messages
            if "expired" in error_msg.lower() or "exp" in error_msg.lower():
                detail = "Token has expired. Please login again."
            elif "invalid" in error_msg.lower() or "signature" in error_msg.lower():
                detail = f"Invalid token: {error_msg}"
            else:
                detail = f"Token verification failed: {error_msg}"
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail
            )
        
        # Use service client for database operations
        supabase = get_supabase_client()
        
        # Get user profile from our users table
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            # Create user profile if it doesn't exist
            user_metadata = user_response.user.user_metadata or {}
            app_metadata = user_response.user.app_metadata or {}
            
            # Determine role: check app_metadata first, then check email for admin test
            default_role = UserRole.EMPLOYEE
            if app_metadata.get("role"):
                try:
                    default_role = UserRole(app_metadata.get("role").lower())
                except ValueError:
                    pass
            elif email.lower() == "admin@test.com":
                # Admin test account should have admin role
                default_role = UserRole.ADMIN
            
            user_data = {
                "id": user_id,
                "email": email,
                "full_name": user_metadata.get("full_name", email.split("@")[0]),
                "role": default_role,
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
            # Fix role for admin test account if it's wrong
            if email.lower() == "admin@test.com":
                current_role = user_data.get("role")
                if current_role != "admin" and current_role != UserRole.ADMIN:
                    # Update role to admin for admin test account
                    try:
                        supabase.table("users").update({
                            "role": UserRole.ADMIN.value,
                            "updated_at": datetime.utcnow().isoformat()
                        }).eq("id", user_id).execute()
                        user_data["role"] = UserRole.ADMIN.value
                    except Exception as update_error:
                        print(f"[AUTH] Warning: Failed to update role for admin test: {str(update_error)}")
        
        # Check if user is active
        if not user_data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        # Ensure role is converted to UserRole enum
        role_value = user_data.get("role")
        if isinstance(role_value, str):
            try:
                user_data["role"] = UserRole(role_value.lower())
            except ValueError:
                print(f"[AUTH] Invalid role '{role_value}', defaulting to EMPLOYEE")
                user_data["role"] = UserRole.EMPLOYEE
        elif not isinstance(role_value, UserRole):
            print(f"[AUTH] Role is not string or enum: {type(role_value)}, defaulting to EMPLOYEE")
            user_data["role"] = UserRole.EMPLOYEE
        
        # Only log in debug mode
        # print(f"[AUTH] User role after conversion: {user_data['role']} (type: {type(user_data['role'])})")
        
        return User(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[User]:
    """Get current authenticated user if token is provided, otherwise return None"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        if not token:
            return None
        
        # Validate token format
        token_parts = token.split('.')
        if len(token_parts) != 3:
            return None
        
        # Use anon client to verify JWT tokens
        from services.supabase_client import get_supabase_anon_client
        supabase = get_supabase_anon_client()
        
        try:
            user_response = supabase.auth.get_user(token)
            if not user_response or not hasattr(user_response, 'user') or not user_response.user:
                return None
            
            user_id = user_response.user.id
            email = user_response.user.email
            
            if not user_id or not email:
                return None
            
        except Exception:
            return None
        
        # Use service client for database operations
        supabase = get_supabase_client()
        
        # Get user profile from our users table
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            return None
        
        user_data = result.data[0]
        
        # Check if user is active
        if not user_data.get("is_active", True):
            return None
        
        # Ensure role is converted to UserRole enum
        role_value = user_data.get("role")
        if isinstance(role_value, str):
            try:
                user_data["role"] = UserRole(role_value.lower())
            except ValueError:
                user_data["role"] = UserRole.EMPLOYEE
        elif not isinstance(role_value, UserRole):
            user_data["role"] = UserRole.EMPLOYEE
        
        return User(**user_data)
        
    except Exception:
        return None

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
    """Require manager, sales, accountant, employee, or admin role"""
    # Handle both enum and string role values
    role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    role_value = role_value.lower()
    
    if role_value not in ["admin", "manager", "sales", "accountant", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires manager, sales, accountant, employee, or admin role"
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
