"""
Bill model definitions
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

class Bill(BaseModel):
    """Bill model"""
    id: str
    bill_number: str
    vendor_id: str
    project_id: Optional[str] = None
    issue_date: date
    due_date: date
    amount: float
    currency: str = "VND"
    status: BillStatus = BillStatus.PENDING
    paid_amount: float = 0.0
    paid_date: Optional[date] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BillCreate(BaseModel):
    """Bill creation model"""
    bill_number: str
    vendor_id: str
    project_id: Optional[str] = None
    issue_date: date
    due_date: date
    amount: float
    currency: str = "VND"
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class BillUpdate(BaseModel):
    """Bill update model"""
    bill_number: Optional[str] = None
    vendor_id: Optional[str] = None
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[BillStatus] = None
    paid_amount: Optional[float] = None
    paid_date: Optional[date] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class BillPayment(BaseModel):
    """Bill payment model"""
    bill_id: str
    payment_date: date
    amount: float
    payment_method: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None