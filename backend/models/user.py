"""
User model definitions
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    VIEWER = "viewer"

class User(BaseModel):
    """User model"""
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE

class UserUpdate(BaseModel):
    """User update model"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """User response model (without sensitive data)"""
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
