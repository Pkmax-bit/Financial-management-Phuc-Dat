"""
QR Code Login Router
Handles QR code generation for web login and verification from mobile app
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import uuid
import secrets

from config import settings
from services.supabase_client import get_supabase_client
from models.user import User
from utils.auth import get_current_user, get_current_user_optional, security

router = APIRouter()

# Pydantic models
class QRGenerateRequest(BaseModel):
    """Request to generate QR code session"""
    pass

class QRGenerateResponse(BaseModel):
    """Response with QR code data"""
    session_id: str
    qr_code: str  # JSON string containing session_id and timestamp
    expires_at: datetime

class QRVerifyRequest(BaseModel):
    """Request to verify QR code from mobile"""
    session_id: str
    secret_token: Optional[str] = None  # Required for complete endpoint

class QRVerifyResponse(BaseModel):
    """Response after QR verification"""
    success: bool
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None
    message: str

class QRStatusResponse(BaseModel):
    """Response for QR status check"""
    status: str  # "pending", "verified", "completed", "expired"
    verified_at: Optional[datetime] = None
    user_email: Optional[str] = None
    access_token: Optional[str] = None  # Return token when completed

# In-memory storage for QR sessions (can be moved to Redis or database)
qr_sessions = {}

def generate_qr_session(user: Optional[User] = None) -> dict:
    """Generate a new QR code session for authenticated web user or anonymous"""
    session_id = str(uuid.uuid4())
    secret_token = secrets.token_urlsafe(32)  # Random secret for verification
    expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5 minutes expiry
    
    session_data = {
        "session_id": session_id,
        "secret_token": secret_token,
        "user_id": user.id if user else None,  # Will be set when mobile completes login
        "user_email": user.email if user else None,  # Will be set when mobile completes login
        "status": "pending",
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "verified_at": None,
        "access_token": None
    }
    
    # Store in memory (in production, use Redis or database)
    qr_sessions[session_id] = session_data
    
    # Also store in Supabase for persistence across server restarts
    try:
        supabase = get_supabase_client()
        supabase.table("qr_login_sessions").insert({
            "id": session_id,
            "secret_token": secret_token,
            "user_id": user.id if user else None,
            "user_email": user.email if user else None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "verified_at": None
        }).execute()
    except Exception as e:
        print(f"⚠️ Warning: Failed to store QR session in database: {e}")
        # Continue with in-memory storage
    
    return session_data

def get_qr_session(session_id: str) -> Optional[dict]:
    """Get QR session by ID"""
    # Check in-memory first
    if session_id in qr_sessions:
        session = qr_sessions[session_id]
        # Check expiry
        if datetime.utcnow() > session["expires_at"]:
            session["status"] = "expired"
            return None
        return session
    
    # Check database
    try:
        supabase = get_supabase_client()
        result = supabase.table("qr_login_sessions").select("*").eq("id", session_id).execute()
        if result.data:
            session = result.data[0]
            # Check expiry
            expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at:
                # Update status
                supabase.table("qr_login_sessions").update({
                    "status": "expired"
                }).eq("id", session_id).execute()
                return None
            
            # Convert to dict format
            return {
                "session_id": session["id"],
                "secret_token": session.get("secret_token"),
                "user_id": session["user_id"],
                "user_email": session["user_email"],
                "status": session["status"],
                "created_at": datetime.fromisoformat(session["created_at"].replace("Z", "+00:00")),
                "expires_at": expires_at,
                "verified_at": datetime.fromisoformat(session["verified_at"].replace("Z", "+00:00")) if session.get("verified_at") else None,
                "access_token": None
            }
    except Exception as e:
        print(f"⚠️ Warning: Failed to get QR session from database: {e}")
    
    return None

def update_qr_session(session_id: str, status: str, access_token: Optional[str] = None, user_id: Optional[str] = None, user_email: Optional[str] = None):
    """Update QR session status"""
    # Update in-memory
    if session_id in qr_sessions:
        qr_sessions[session_id]["status"] = status
        if status in ["verified", "completed"]:
            qr_sessions[session_id]["verified_at"] = datetime.utcnow()
        if access_token:
            qr_sessions[session_id]["access_token"] = access_token
        if user_id:
            qr_sessions[session_id]["user_id"] = user_id
        if user_email:
            qr_sessions[session_id]["user_email"] = user_email
    
    # Update database
    try:
        supabase = get_supabase_client()
        update_data = {
            "status": status,
        }
        if status in ["verified", "completed"]:
            update_data["verified_at"] = datetime.utcnow().isoformat()
        if user_id:
            update_data["user_id"] = user_id
        if user_email:
            update_data["user_email"] = user_email
        if access_token:
            # Store access_token in a separate field if needed (or in memory only)
            pass  # We don't store access_token in DB for security, only in memory
        
        supabase.table("qr_login_sessions").update(update_data).eq("id", session_id).execute()
    except Exception as e:
        print(f"⚠️ Warning: Failed to update QR session in database: {e}")

@router.post("/qr/generate", response_model=QRGenerateResponse)
async def generate_qr_code(current_user: User = Depends(get_current_user)):
    """
    Generate QR code for login (requires web user to be authenticated)
    Web app calls this after user logs in, then displays QR code
    """
    try:
        session_data = generate_qr_session(current_user)
        
        # Create QR code data (JSON string)
        import json
        qr_data = {
            "session_id": session_data["session_id"],
            "secret_token": session_data["secret_token"],
            "timestamp": datetime.utcnow().isoformat(),
            "type": "login"
        }
        qr_code = json.dumps(qr_data)
        
        return QRGenerateResponse(
            session_id=session_data["session_id"],
            qr_code=qr_code,
            expires_at=session_data["expires_at"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )

@router.post("/qr/generate-anonymous", response_model=QRGenerateResponse)
async def generate_anonymous_qr_code():
    """
    Generate QR code for login without authentication
    Web login page calls this to display QR code for mobile to scan
    """
    try:
        session_data = generate_qr_session(None)  # No user yet
        
        # Create QR code data (JSON string)
        import json
        qr_data = {
            "session_id": session_data["session_id"],
            "secret_token": session_data["secret_token"],
            "timestamp": datetime.utcnow().isoformat(),
            "type": "web_login"  # Different type for web login
        }
        qr_code = json.dumps(qr_data)
        
        return QRGenerateResponse(
            session_id=session_data["session_id"],
            qr_code=qr_code,
            expires_at=session_data["expires_at"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )

@router.post("/qr/verify", response_model=QRVerifyResponse)
async def verify_qr_code(request: QRVerifyRequest):
    """
    Verify QR code from mobile app (just checks if valid)
    Mobile app calls this after scanning QR code to check validity
    """
    try:
        session = get_qr_session(request.session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code session not found or expired"
            )
        
        if session["status"] == "expired":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has expired"
            )
        
        if session["status"] == "verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has already been used"
            )
        
        # Return success - QR is valid, mobile can proceed to complete
        return QRVerifyResponse(
            success=True,
            message="QR code is valid. Proceed to complete login.",
            access_token=None,
            token_type=None,
            expires_in=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify QR code: {str(e)}"
        )

@router.post("/qr/complete", response_model=QRVerifyResponse)
async def complete_qr_login(
    request: QRVerifyRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Complete QR login and get access token
    Mobile app calls this after verify to get the actual auth token
    Requires secret_token from QR code and mobile user authentication
    """
    try:
        if not request.secret_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="secret_token is required"
            )
        
        session = get_qr_session(request.session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code session not found or expired"
            )
        
        # Verify secret token
        if session.get("secret_token") != request.secret_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid secret token"
            )
        
        if session["status"] == "expired":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has expired"
            )
        
        if session["status"] == "verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has already been used"
            )
        
        # Get user - either from session (if web user created QR) or from mobile user (if anonymous QR)
        supabase = get_supabase_client()
        user = None
        user_id_to_use = None
        
        if session.get("user_id"):
            # QR was created by authenticated web user
            user_id_to_use = session["user_id"]
            user_result = supabase.table("users").select("*").eq("id", user_id_to_use).execute()
            if user_result.data:
                user = user_result.data[0]
        elif current_user:
            # QR was created anonymously, use mobile user's info
            user_id_to_use = current_user.id
            user_result = supabase.table("users").select("*").eq("id", user_id_to_use).execute()
            if user_result.data:
                user = user_result.data[0]
                # Update session with mobile user info
                update_qr_session(
                    request.session_id, 
                    "verified",
                    user_id=current_user.id,
                    user_email=current_user.email
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please login on mobile app first."
            )
        
        if not user or not user_id_to_use:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get Supabase auth user to create a proper session
        auth_user = supabase.auth.admin.get_user_by_id(user_id_to_use)
        if not auth_user or not auth_user.user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auth user not found"
            )
        
        # Generate a Supabase-compatible JWT token
        # This token will be accepted by Supabase auth
        import jwt
        from datetime import timedelta
        
        # Get user email - handle both dict and object
        if isinstance(user, dict):
            user_email = user.get("email")
        else:
            user_email = getattr(user, 'email', None)
        
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email not found"
            )
        
        # Create a token that Supabase will accept
        # Using the same format as Supabase auth tokens
        # Get Supabase URL from settings or use default
        supabase_url = getattr(settings, 'SUPABASE_URL', 'https://mfmijckzlhevduwfigkl.supabase.co')
        if not supabase_url.startswith('http'):
            supabase_url = f"https://{supabase_url}"
        
        payload = {
            "sub": user_id_to_use,
            "email": user_email,
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int((datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
            "iat": int(datetime.utcnow().timestamp()),
            "iss": f"{supabase_url}/auth/v1"
        }
        
        # Sign with Supabase JWT secret
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # Update session status to completed
        update_qr_session(request.session_id, "completed", token, user_id_to_use, user_email)
        
        # Update last login
        supabase.table("users").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", user_id_to_use).execute()
        
        return QRVerifyResponse(
            success=True,
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete QR login: {str(e)}"
        )

@router.get("/qr/status/{session_id}", response_model=QRStatusResponse)
async def get_qr_status(session_id: str):
    """
    Get QR code session status (for web polling)
    Web app polls this to check if mobile has scanned and verified
    """
    try:
        session = get_qr_session(session_id)
        
        if not session:
            return QRStatusResponse(
                status="expired",
                verified_at=None,
                user_email=None
            )
        
        return QRStatusResponse(
            status=session["status"],
            verified_at=session.get("verified_at"),
            user_email=session.get("user_email") if session["status"] in ["verified", "completed"] else None,
            access_token=session.get("access_token") if session["status"] == "completed" else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get QR status: {str(e)}"
        )

# ========== MOBILE TO WEB QR LOGIN ==========

@router.post("/mobile/generate", response_model=QRGenerateResponse)
async def generate_mobile_qr_code(current_user: User = Depends(get_current_user)):
    """
    Generate QR code from mobile app for web login
    Mobile user must be authenticated to call this
    """
    try:
        session_data = generate_qr_session(current_user)
        
        # Create QR code data (JSON string)
        import json
        qr_data = {
            "session_id": session_data["session_id"],
            "secret_token": session_data["secret_token"],
            "timestamp": datetime.utcnow().isoformat(),
            "type": "mobile_to_web_login"  # Different type to distinguish from web-to-mobile
        }
        qr_code = json.dumps(qr_data)
        
        return QRGenerateResponse(
            session_id=session_data["session_id"],
            qr_code=qr_code,
            expires_at=session_data["expires_at"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )

@router.post("/web/verify", response_model=QRVerifyResponse)
async def verify_web_qr_code(request: QRVerifyRequest):
    """
    Verify QR code from web app (web scans QR from mobile)
    Web app calls this after scanning QR code to check validity
    """
    try:
        session = get_qr_session(request.session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code session not found or expired"
            )
        
        if session["status"] == "expired":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has expired"
            )
        
        if session["status"] == "verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has already been used"
            )
        
        # Verify secret token
        if session.get("secret_token") != request.secret_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid secret token"
            )
        
        # Mark as verified (web has scanned it)
        update_qr_session(request.session_id, "verified")
        
        return QRVerifyResponse(
            success=True,
            message="QR code verified. Proceed to complete login.",
            access_token=None,
            token_type=None,
            expires_in=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify QR code: {str(e)}"
        )

@router.post("/web/complete", response_model=QRVerifyResponse)
async def complete_web_qr_login(request: QRVerifyRequest):
    """
    Complete QR login for web app (web scans QR from mobile)
    Web app calls this after verify to get the actual auth token
    Requires secret_token from QR code
    """
    try:
        if not request.secret_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="secret_token is required"
            )
        
        session = get_qr_session(request.session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code session not found or expired"
            )
        
        # Verify secret token
        if session.get("secret_token") != request.secret_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid secret token"
            )
        
        if session["status"] != "verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code must be verified first"
            )
        
        # Get user from session (this is the mobile user who generated the QR)
        supabase = get_supabase_client()
        user_result = supabase.table("users").select("*").eq("id", session["user_id"]).execute()
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = user_result.data[0]
        
        # Generate a Supabase-compatible JWT token for web
        import jwt
        from datetime import timedelta
        
        supabase_url = getattr(settings, 'SUPABASE_URL', 'https://mfmijckzlhevduwfigkl.supabase.co')
        if not supabase_url.startswith('http'):
            supabase_url = f"https://{supabase_url}"
        
        payload = {
            "sub": session["user_id"],
            "email": session["user_email"],
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int((datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
            "iat": int(datetime.utcnow().timestamp()),
            "iss": f"{supabase_url}/auth/v1"
        }
        
        # Sign with Supabase JWT secret
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        
        # Update session status to completed
        update_qr_session(request.session_id, "completed", token)
        
        # Update last login
        supabase.table("users").update({
            "last_login": datetime.utcnow().isoformat()
        }).eq("id", session["user_id"]).execute()
        
        return QRVerifyResponse(
            success=True,
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete QR login: {str(e)}"
        )

@router.get("/mobile/status/{session_id}", response_model=QRStatusResponse)
async def get_mobile_qr_status(session_id: str):
    """
    Get QR code session status (for mobile polling)
    Mobile app polls this to check if web has scanned and logged in
    """
    try:
        session = get_qr_session(session_id)
        
        if not session:
            return QRStatusResponse(
                status="expired",
                verified_at=None,
                user_email=None
            )
        
        return QRStatusResponse(
            status=session["status"],
            verified_at=session.get("verified_at"),
            user_email=session.get("user_email") if session["status"] in ["verified", "completed"] else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get QR status: {str(e)}"
        )

