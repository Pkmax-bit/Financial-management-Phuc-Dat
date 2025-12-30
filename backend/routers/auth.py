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
import os
import requests
from concurrent.futures import ThreadPoolExecutor

from config import settings
from services.supabase_client import get_supabase_client
# Email service
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

class TestPasswordResetEmail(BaseModel):
    test_email: EmailStr


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
        
        # Get frontend URL with validation
        frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
        if not frontend_base or frontend_base == "http://localhost:3000":
            # Log warning if using default localhost URL in production
            if settings.ENVIRONMENT == "production":
                print(f"⚠️ WARNING: FRONTEND_URL is not set or using default localhost. Current value: {frontend_base}")
        
        reset_link = f"{frontend_base}/reset-password?token={token}"
        print(f"📧 Password reset link generated: {reset_link[:50]}... (truncated for security)")
        
        try:
            # Email service temporarily disabled
            if email_service:
                email_sent = await email_service.send_password_reset_email(
                    user_email=user["email"],
                    user_name=user.get("full_name"),
                    reset_link=reset_link
                )
                
                if not email_sent:
                    print(f"❌ Failed to send password reset email to {user['email']}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Không thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra cấu hình email hoặc thử lại sau."
                    )
                
                print(f"✅ Password reset email sent successfully to {user['email']}")
            else:
                print(f"⚠️ Email service disabled - skipping password reset email to {user['email']}")
        except Exception as email_error:
            print(f"❌ Error sending password reset email: {str(email_error)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Không thể gửi email đặt lại mật khẩu: {str(email_error)}"
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

@router.get("/users/me", response_model=UserResponse)
async def get_current_user_with_employee(
    include_employee: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get current user information (compatible with Android API)"""
    # For now, just return current_user
    # TODO: Add employee information if include_employee is True
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
        
        # Email service temporarily disabled
        if email_service:
            try:
                await email_service.send_password_change_confirmation(
                    user_email=current_user.email,
                    user_name=current_user.full_name,
                    via="manual"
                )
            except Exception as e:
                print(f"⚠️ Email service disabled - skipping password change confirmation: {e}")
        
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
        
        # Email service temporarily disabled
        if email_service:
            try:
                await email_service.send_password_change_confirmation(
                    user_email=user_email,
                    user_name=user_full_name,
                    via="reset"
                )
            except Exception as e:
                print(f"⚠️ Email service disabled - skipping password change confirmation: {e}")
        
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


@router.get("/email-config")
async def get_email_config():
    """Get current email configuration (for debugging)"""
    import os
    
    # Email service temporarily disabled
    if not email_service:
        return {
            "email_provider": "disabled",
            "daily_email_limit": "N/A",
            "limit_details": {"note": "Email service is temporarily disabled"},
            "status": "Email service is temporarily disabled"
        }
    
    # Determine daily email limit based on provider
    email_provider = email_service.email_provider
    daily_limit = "Unknown"
    limit_details = {}
    
    if email_provider == "n8n":
        # n8n limit depends on SMTP provider configured in n8n workflow
        # Most common: Gmail SMTP (~500 emails/day)
        daily_limit = "~500 emails/ngày"
        limit_details = {
            "provider": "n8n",
            "note": "Giới hạn phụ thuộc vào SMTP provider trong n8n workflow",
            "common_limits": {
                "Gmail SMTP": "~500 emails/ngày",
                "Resend": "~100 emails/ngày (free tier)",
                "SendGrid": "100 emails/ngày (free tier)",
                "Mailgun": "~166 emails/ngày (free tier)"
            },
            "recommendation": "Kiểm tra SMTP provider trong n8n workflow để biết chính xác"
        }
    elif email_provider == "resend":
        daily_limit = "~100 emails/ngày"
        limit_details = {
            "provider": "resend",
            "free_tier": "3,000 emails/tháng (~100 emails/ngày)",
            "note": "Free tier limit. Có thể nâng cấp gói paid để tăng giới hạn"
        }
    elif email_provider == "smtp":
        # Gmail SMTP default
        daily_limit = "~500 emails/ngày"
        limit_details = {
            "provider": "smtp (Gmail)",
            "personal_gmail": "~500 emails/ngày",
            "workspace": "~2,000 emails/ngày",
            "note": "⚠️ Không hoạt động trên Render (SMTP bị chặn)"
        }
    else:
        daily_limit = "Unknown"
        limit_details = {
            "provider": email_provider,
            "note": "Provider không xác định"
        }
    
    return {
        "email_provider": email_provider,
        "daily_email_limit": daily_limit,
        "limit_details": limit_details,
        "n8n_webhook_url": email_service.n8n_webhook_url if email_service.n8n_webhook_url else "NOT SET",
        "n8n_webhook_id": email_service.n8n_webhook_id if email_service.n8n_webhook_id else "NOT SET",
        "n8n_api_key": "SET" if email_service.n8n_api_key else "NOT SET",
        "resend_api_key": "SET" if email_service.resend_api_key else "NOT SET",
        "smtp_configured": bool(email_service.smtp_username and email_service.smtp_password),
        "debug_mode": email_service.debug,
        "env_email_provider": os.getenv("EMAIL_PROVIDER", "NOT SET"),
        "env_n8n_webhook_url": os.getenv("N8N_WEBHOOK_URL", "NOT SET")
    }


@router.post("/test-password-reset-email")
async def test_password_reset_email(request: TestPasswordResetEmail):
    """Test endpoint to send password reset email via n8n (for testing purposes)
    
    Note: This endpoint does NOT require authentication, allowing testing from forgot-password page.
    FORCE sends via n8n regardless of EMAIL_PROVIDER setting.
    """
    try:
        email_to_test = request.test_email
        
        # Check n8n webhook URL
        n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "")
        if not n8n_webhook_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="N8N_WEBHOOK_URL is not set. Please set it in environment variables (backend/.env file)."
            )
        
        print("=" * 60)
        print("🧪 TEST EMAIL VIA N8N (FORCE)")
        print("=" * 60)
        print(f"📧 Email to: {email_to_test}")
        print(f"🔗 n8n Webhook URL: {n8n_webhook_url}")
        if email_service:
            print(f"⚙️  Current EMAIL_PROVIDER setting: {email_service.email_provider}")
        else:
            print(f"⚙️  Email service is temporarily disabled")
        print("=" * 60)
        
        # Generate a test reset link
        frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
        test_token = "test_token_" + str(datetime.now().timestamp())
        reset_link = f"{frontend_base}/reset-password?token={test_token}"
        
        # Try to get user name from database (optional)
        user_name = "Test User"
        try:
            supabase = get_supabase_client()
            user_result = supabase.table("users").select("full_name").eq("email", email_to_test).limit(1).execute()
            if user_result.data and user_result.data[0].get('full_name'):
                user_name = user_result.data[0]['full_name']
        except Exception:
            pass  # Use default "Test User"
        
        # Prepare email content
        expire_minutes = settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        subject = "Hướng dẫn đặt lại mật khẩu tài khoản Phúc Đạt (TEST)"
        
        greeting_name = user_name or "bạn"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border: 1px solid #000;">
            <div style="padding: 16px; border-bottom: 1px solid #000;">
              <h2 style="margin: 0; color: #0f172a;">Đặt lại mật khẩu (TEST)</h2>
            </div>
            <div style="padding: 16px;">
              <p>Xin chào {greeting_name},</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống Quản lý tài chính Phúc Đạt.</p>
              <p>Vui lòng nhấn nút bên dưới để đặt lại mật khẩu mới. Liên kết có hiệu lực trong {expire_minutes} phút.</p>
              <div style="text-align:center; margin: 24px 0;">
                <a href="{reset_link}" style="background:#0f172a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
                  Đặt lại mật khẩu
                </a>
              </div>
              <p><strong>⚠️ LƯU Ý:</strong> Đây là email TEST. Link reset password không hợp lệ.</p>
              <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn vẫn an toàn.</p>
            </div>
            <div style="padding: 12px; border-top: 1px solid #000; text-align: center; color:#000000; font-size:12px;">
              Bộ phận Công ty Phúc Đạt
            </div>
          </div>
        </body>
        </html>
        """
        
        text_body = f"""Xin chào {greeting_name},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống Quản lý tài chính Phúc Đạt.

Vui lòng nhấn vào nút "Đặt lại mật khẩu" trong email HTML. Liên kết có hiệu lực trong {expire_minutes} phút.

⚠️ LƯU Ý: Đây là email TEST. Link reset password không hợp lệ.

Nếu bạn không yêu cầu, hãy bỏ qua email này.
"""
        
        # FORCE send via n8n (bypass EMAIL_PROVIDER setting)
        print(f"🚀 Sending email via n8n webhook...")
        
        # Prepare payload for n8n webhook
        payload = {
            "to_email": email_to_test,
            "subject": subject,
            "html_content": html_body,
            "text_content": text_body,
            "email_type": "password_reset",
            "metadata": {
                "user_name": user_name,
                "reset_link": reset_link,
                "expire_minutes": expire_minutes
            }
        }
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided
        n8n_api_key = os.getenv("N8N_API_KEY", "")
        if n8n_api_key:
            headers["X-N8N-API-KEY"] = n8n_api_key
        
        # Add webhook ID if provided
        n8n_webhook_id = os.getenv("N8N_WEBHOOK_ID", "")
        if n8n_webhook_id:
            payload["webhook_id"] = n8n_webhook_id
        
        # Send request to n8n webhook
        try:
            print(f"📤 Sending POST request to: {n8n_webhook_url}")
            print(f"📦 Payload keys: {list(payload.keys())}")
            
            # Run HTTP request in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            executor = ThreadPoolExecutor(max_workers=1)
            response = await loop.run_in_executor(
                executor,
                lambda: requests.post(n8n_webhook_url, headers=headers, json=payload, timeout=30)
            )
            
            print(f"📥 Response Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                try:
                    result = response.json()
                    print(f"📥 Response Body: {result}")
                except:
                    print(f"📥 Response Text: {response.text[:200]}")
                email_sent = True
            else:
                error_msg = response.text
                print(f"❌ n8n Webhook Error ({response.status_code}): {error_msg}")
                email_sent = False
                
        except requests.exceptions.Timeout:
            print(f"❌ n8n Webhook Timeout - Request took longer than 30s")
            email_sent = False
        except requests.exceptions.RequestException as e:
            print(f"❌ n8n Webhook Request Error: {e}")
            email_sent = False
        except Exception as e:
            print(f"❌ Unexpected n8n Webhook Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            email_sent = False
        
        print("=" * 60)
        if email_sent:
            print(f"✅ Email sent successfully via n8n!")
        else:
            print(f"❌ Failed to send email via n8n")
        print("=" * 60)
        
        if email_sent:
            return {
                "status": "success",
                "message": f"Test password reset email sent successfully to {email_to_test} via n8n",
                "email_provider": "n8n",
                "n8n_webhook_url": n8n_webhook_url,
                "note": "This is a test email sent via n8n. The reset link is not valid."
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send test email to {email_to_test} via n8n. Check n8n webhook configuration."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test email failed: {str(e)}"
        )