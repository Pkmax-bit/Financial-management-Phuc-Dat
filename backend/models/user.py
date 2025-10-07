"""
User model definitions
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    SALES = "sales"
    ACCOUNTANT = "accountant"
    WORKSHOP_EMPLOYEE = "workshop_employee"
    WORKER = "worker"
    TRANSPORT = "transport"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"
    
    @classmethod
    def _missing_(cls, value):
        """Handle aliases for role values"""
        if value == "Admin User":
            return cls.ADMIN
        return None

class User(BaseModel):
    """User model"""
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    password_hash: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.WORKER

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
