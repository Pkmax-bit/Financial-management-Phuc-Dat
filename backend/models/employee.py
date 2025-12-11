"""
Employee model definitions
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, date
from enum import Enum
from .user import UserRole
from utils.validators import sanitize_string, validate_email, validate_phone, validate_name

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"

class Employee(BaseModel):
    """Employee model"""
    id: str
    user_id: Optional[str] = None
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: date
    salary: Optional[float] = None
    status: EmploymentStatus = EmploymentStatus.ACTIVE
    manager_id: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    # Computed field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

class EmployeeCreate(BaseModel):
    """Employee creation model"""
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: date
    salary: Optional[float] = Field(None, ge=0)
    manager_id: Optional[str] = None
    user_role: UserRole = Field(default=UserRole.EMPLOYEE, description="User role for the employee")
    # Auto-generated fields
    employee_code: Optional[str] = None  # Will be generated automatically
    password: Optional[str] = Field(default="123456", description="Default password is 123456")
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v: str) -> str:
        """Validate and sanitize name fields"""
        return validate_name(v, max_length=255)
    
    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v: str) -> str:
        """Validate email format"""
        return validate_email(v)
    
    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format"""
        if v is None:
            return None
        return validate_phone(v, country='VN')

class EmployeeUpdate(BaseModel):
    """Employee update model"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=255)
    last_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: Optional[date] = None
    salary: Optional[float] = Field(None, ge=0)
    status: Optional[EmploymentStatus] = None
    manager_id: Optional[str] = None
    avatar_url: Optional[str] = None
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_names(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize name fields"""
        if v is None:
            return None
        return validate_name(v, max_length=255)
    
    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v: Optional[str]) -> Optional[str]:
        """Validate email format"""
        if v is None:
            return None
        return validate_email(v)
    
    @field_validator('phone')
    @classmethod
    def validate_phone_field(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format"""
        if v is None:
            return None
        return validate_phone(v, country='VN')

class EmployeeResponse(BaseModel):
    """Employee response model"""
    id: str
    user_id: Optional[str]
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str]
    department_id: Optional[str]
    department_name: Optional[str] = None
    position_id: Optional[str] 
    position_title: Optional[str] = None
    hire_date: date
    salary: Optional[float]
    status: EmploymentStatus
    manager_id: Optional[str]
    manager_name: Optional[str] = None
    user_role: Optional[str] = None  # Role from users table
    created_at: datetime
    updated_at: datetime

class Department(BaseModel):
    """Department model"""
    id: str
    name: str
    code: str
    description: Optional[str] = None
    budget: Optional[float] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class DepartmentCreate(BaseModel):
    """Department creation model"""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    budget: Optional[float] = Field(None, ge=0)

class DepartmentUpdate(BaseModel):
    """Department update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    budget: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

class PositionCreate(BaseModel):
    """Position creation model"""
    title: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    department_id: Optional[str] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)

class PositionUpdate(BaseModel):
    """Position update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    department_id: Optional[str] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

class Position(BaseModel):
    """Position model"""
    id: str
    title: str
    code: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
