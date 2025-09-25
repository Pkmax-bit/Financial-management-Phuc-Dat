"""
Sales Receipt model definitions for Sales Center
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class SalesReceiptStatus(str, Enum):
    DRAFT = "draft"
    COMPLETED = "completed"
    VOIDED = "voided"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    OTHER = "other"

class SalesReceiptItem(BaseModel):
    """Sales receipt item model"""
    description: str
    quantity: float
    unit_price: float
    total: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    notes: Optional[str] = None

class SalesReceipt(BaseModel):
    """Sales receipt model"""
    id: str
    receipt_number: str
    customer_id: str
    project_id: Optional[str] = None
    sale_date: date
    payment_date: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: SalesReceiptStatus = SalesReceiptStatus.DRAFT
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    items: List[SalesReceiptItem] = []
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class SalesReceiptCreate(BaseModel):
    """Sales receipt creation model"""
    receipt_number: str
    customer_id: str
    project_id: Optional[str] = None
    sale_date: date
    payment_date: date
    subtotal: float
    tax_rate: float = 0.0
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    items: List[SalesReceiptItem] = []
    notes: Optional[str] = None

class SalesReceiptUpdate(BaseModel):
    """Sales receipt update model"""
    receipt_number: Optional[str] = None
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    sale_date: Optional[date] = None
    payment_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    status: Optional[SalesReceiptStatus] = None
    items: Optional[List[SalesReceiptItem]] = None
    notes: Optional[str] = None