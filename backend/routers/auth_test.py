"""
Authentication test router
Simple endpoints to test authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import jwt

from services.supabase_client import get_supabase_client
from config import settings

router = APIRouter(prefix="/auth-test", tags=["auth-test"])
security = HTTPBearer()

@router.get("/public")
async def public_endpoint():
    """Public endpoint - no authentication required"""
    return {
        "message": "This is a public endpoint",
        "status": "success",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@router.get("/token-info")
async def token_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Debug endpoint to show token information"""
    token = credentials.credentials
    
    try:
        # Try to decode the token without verification first
        decoded_no_verify = jwt.decode(token, options={"verify_signature": False})
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Try to verify with Supabase
        try:
            user_response = supabase.auth.get_user(token)
            supabase_user = user_response.user if user_response else None
        except Exception as supabase_error:
            supabase_user = None
            
        return {
            "token_preview": f"{token[:20]}...",
            "token_length": len(token),
            "decoded_payload": decoded_no_verify,
            "supabase_user": {
                "id": supabase_user.id if supabase_user else None,
                "email": supabase_user.email if supabase_user else None,
                "verified": supabase_user is not None
            },
            "status": "success"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "token_preview": f"{token[:20]}...",
            "token_length": len(token),
            "status": "error"
        }

@router.get("/simple-auth")
async def simple_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple authentication test"""
    token = credentials.credentials
    
    try:
        supabase = get_supabase_client()
        
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return {
            "message": "Authentication successful",
            "user": {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "verified": True
            },
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/employees-simple")
async def test_employees_simple():
    """Test employees simple endpoint indirectly"""
    try:
        import requests
        
        # This is just a test to see if the endpoint exists
        return {
            "message": "Use /api/employees/simple-test with proper auth header",
            "endpoint": "/api/employees/simple-test",
            "status": "info"
        }
    except Exception as e:
        return {
            "message": f"Error: {str(e)}",
            "status": "error"
        }