"""
Vendor model definitions for Expenses Center
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class VendorType(str, Enum):
    SUPPLIER = "supplier"
    SERVICE_PROVIDER = "service_provider"
    CONTRACTOR = "contractor"
    UTILITY = "utility"
    GOVERNMENT = "government"
    OTHER = "other"

class VendorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class PaymentTerms(str, Enum):
    NET_15 = "net_15"
    NET_30 = "net_30"
    NET_45 = "net_45"
    NET_60 = "net_60"
    COD = "cod"  # Cash on Delivery
    PREPAID = "prepaid"

class Vendor(BaseModel):
    """Vendor model"""
    id: str
    vendor_code: str
    name: str
    vendor_type: VendorType = VendorType.SUPPLIER
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "Vietnam"
    tax_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    credit_limit: Optional[float] = None
    status: VendorStatus = VendorStatus.ACTIVE
    notes: Optional[str] = None
    website: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class VendorCreate(BaseModel):
    """Vendor creation model"""
    vendor_code: str
    name: str
    vendor_type: VendorType = VendorType.SUPPLIER
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "Vietnam"
    tax_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    website: Optional[str] = None

class VendorUpdate(BaseModel):
    """Vendor update model"""
    vendor_code: Optional[str] = None
    name: Optional[str] = None
    vendor_type: Optional[VendorType] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    payment_terms: Optional[PaymentTerms] = None
    credit_limit: Optional[float] = None
    status: Optional[VendorStatus] = None
    notes: Optional[str] = None
    website: Optional[str] = None