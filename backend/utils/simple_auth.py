"""
Simple authentication for testing
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.supabase_client import get_supabase_client
from models.user import User

security = HTTPBearer()

async def get_current_user_simple(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Simple authentication that just checks if token is valid with Supabase"""
    try:
        token = credentials.credentials
        supabase = get_supabase_client()
        
        print(f"🔍 SIMPLE AUTH: Checking token: {token[:30]}...")
        
        # Get user from Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            print("🔍 SIMPLE AUTH: Invalid token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        supabase_user = user_response.user
        print(f"🔍 SIMPLE AUTH: Valid user: {supabase_user.email}")
        
        # Return a minimal user object
        return User(
            id=supabase_user.id,
            email=supabase_user.email,
            full_name=supabase_user.email.split('@')[0],  # Use email prefix as name
            role="employee",  # Default role
            is_active=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔍 SIMPLE AUTH: Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )