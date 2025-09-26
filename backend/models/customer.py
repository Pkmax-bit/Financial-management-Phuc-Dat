"""
Customer model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

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
    created_at: datetime
    updated_at: datetime

class CustomerCreate(BaseModel):
    """Customer creation model"""
    customer_code: str
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
