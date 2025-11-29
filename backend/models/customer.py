"""
Customer model definitions
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from utils.validators import sanitize_string, validate_email, validate_phone, validate_name

class CustomerType(str, Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"
    GOVERNMENT = "government"

class CustomerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"

class Customer(BaseModel):
    """Customer model"""
    id: str
    customer_code: str
    name: str
    type: CustomerType
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: CustomerStatus = CustomerStatus.ACTIVE
    credit_limit: float = 0.0
    payment_terms: int = 30  # days
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    level: Optional[str] = None  # Customer level (bronze, silver, gold, platinum)
    alternative_name: Optional[str] = None  # Alternative customer name
    created_at: datetime
    updated_at: datetime

class CustomerCreate(BaseModel):
    """Customer creation model"""
    customer_code: Optional[str] = None  # Optional - sẽ được auto-generate nếu không cung cấp
    name: str
    type: CustomerType
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    credit_limit: float = 0.0
    payment_terms: int = 30
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    alternative_name: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate and sanitize customer name"""
        return validate_name(v, max_length=255)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate email format"""
        if v is None:
            return None
        return validate_email(v)
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format"""
        if v is None:
            return None
        # Default to Vietnam phone format
        return validate_phone(v, country='VN')
    
    @field_validator('address', 'city', 'country', 'tax_id', 'notes')
    @classmethod
    def sanitize_string_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize string fields"""
        if v is None:
            return None
        return sanitize_string(v, max_length=500)

class CustomerUpdate(BaseModel):
    """Customer update model"""
    customer_code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[CustomerType] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[CustomerStatus] = None
    credit_limit: Optional[float] = None
    payment_terms: Optional[int] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    alternative_name: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize customer name"""
        if v is None:
            return None
        return validate_name(v, max_length=255)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate email format"""
        if v is None:
            return None
        return validate_email(v)
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone format"""
        if v is None:
            return None
        # Default to Vietnam phone format
        return validate_phone(v, country='VN')
    
    @field_validator('address', 'city', 'country', 'tax_id', 'notes')
    @classmethod
    def sanitize_string_fields(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize string fields"""
        if v is None:
            return None
        return sanitize_string(v, max_length=500)
