"""
Bill model definitions for Expenses Center
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class BillStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class BillCategory(str, Enum):
    UTILITIES = "utilities"
    RENT = "rent"
    SUPPLIES = "supplies"
    SOFTWARE = "software"
    SERVICES = "services"
    EQUIPMENT = "equipment"
    MAINTENANCE = "maintenance"
    MARKETING = "marketing"
    LEGAL = "legal"
    OTHER = "other"

class BillItem(BaseModel):
    """Bill item model"""
    description: str
    quantity: float = 1.0
    unit_price: float
    total: float
    category: BillCategory
    project_id: Optional[str] = None
    is_billable: bool = False  # Can be charged to customer
    billable_customer_id: Optional[str] = None

class Bill(BaseModel):
    """Bill model"""
    id: str
    bill_number: str
    vendor_id: str
    project_id: Optional[str] = None
    issue_date: date
    due_date: date
    received_date: Optional[date] = None
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: BillStatus = BillStatus.PENDING
    paid_amount: float = 0.0
    paid_date: Optional[date] = None
    items: List[BillItem] = []
    description: Optional[str] = None
    notes: Optional[str] = None
    attachment_url: Optional[str] = None
    created_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class BillCreate(BaseModel):
    """Bill creation model"""
    bill_number: str
    vendor_id: str
    project_id: Optional[str] = None
    issue_date: date
    due_date: date
    received_date: Optional[date] = None
    subtotal: float
    tax_rate: float = 0.0
    items: List[BillItem] = []
    description: Optional[str] = None
    notes: Optional[str] = None
    attachment_url: Optional[str] = None

class BillUpdate(BaseModel):
    """Bill update model"""
    bill_number: Optional[str] = None
    vendor_id: Optional[str] = None
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    received_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    status: Optional[BillStatus] = None
    paid_amount: Optional[float] = None
    paid_date: Optional[date] = None
    items: Optional[List[BillItem]] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    attachment_url: Optional[str] = None

class BillPayment(BaseModel):
    """Bill payment model"""
    bill_id: str
    payment_amount: float
    payment_date: date
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    notes: Optional[str] = None