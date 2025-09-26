"""
Vendor model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Vendor(BaseModel):
    """Vendor model"""
    id: str
    vendor_code: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Vietnam"
    tax_id: Optional[str] = None
    payment_terms: int = 30  # days
    is_active: bool = True
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class VendorCreate(BaseModel):
    """Vendor creation model"""
    vendor_code: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Vietnam"
    tax_id: Optional[str] = None
    payment_terms: int = 30
    notes: Optional[str] = None

class VendorUpdate(BaseModel):
    """Vendor update model"""
    vendor_code: Optional[str] = None
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None