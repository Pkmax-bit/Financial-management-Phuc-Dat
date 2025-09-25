"""
Payment model definitions for Sales Center
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    DIGITAL_WALLET = "digital_wallet"
    OTHER = "other"

class Payment(BaseModel):
    """Payment model"""
    id: str
    payment_number: str
    customer_id: str
    invoice_ids: List[str]  # Can apply to multiple invoices
    payment_date: date
    amount: float
    currency: str = "VND"
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    bank_details: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None
    created_by: str
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PaymentCreate(BaseModel):
    """Payment creation model"""
    payment_number: str
    customer_id: str
    invoice_ids: List[str]
    payment_date: date
    amount: float
    currency: str = "VND"
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    bank_details: Optional[str] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    """Payment update model"""
    payment_number: Optional[str] = None
    customer_id: Optional[str] = None
    invoice_ids: Optional[List[str]] = None
    payment_date: Optional[date] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    bank_details: Optional[str] = None
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class PaymentAllocation(BaseModel):
    """Model for allocating payment to specific invoices"""
    invoice_id: str
    allocated_amount: float

class PaymentWithAllocations(BaseModel):
    """Payment with specific invoice allocations"""
    payment: PaymentCreate
    allocations: List[PaymentAllocation]