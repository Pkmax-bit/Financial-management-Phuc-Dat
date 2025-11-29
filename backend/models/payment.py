"""
Payment model definitions
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CARD = "card"
    OTHER = "other"

class Payment(BaseModel):
    """Payment model"""
    id: str
    payment_number: str
    invoice_id: str
    customer_id: str
    amount: float
    payment_date: datetime  # Changed from date to datetime to include time
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

class PaymentCreate(BaseModel):
    """Payment creation model"""
    payment_number: str
    invoice_id: str
    customer_id: str
    amount: float
    payment_date: datetime  # Changed from date to datetime to include time
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    """Payment update model"""
    payment_number: Optional[str] = None
    invoice_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: Optional[float] = None
    payment_date: Optional[datetime] = None  # Changed from date to datetime
    payment_method: Optional[PaymentMethod] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentWithAllocations(BaseModel):
    """Payment with allocations model"""
    payment: Payment
    allocations: List[dict]  # List of invoice allocations