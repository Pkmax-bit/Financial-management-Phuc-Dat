"""
Invoice model definitions
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"

class InvoiceType(str, Enum):
    STANDARD = "standard"
    RECURRING = "recurring"
    PROFORMA = "proforma"
    CREDIT_NOTE = "credit_note"

class InvoiceItem(BaseModel):
    """Invoice item model"""
    description: str
    quantity: float
    unit_price: float
    total: float

class Invoice(BaseModel):
    """Invoice model"""
    id: str
    invoice_number: str
    customer_id: str
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_amount: float = 0.0
    paid_date: Optional[date] = None
    payment_date: Optional[date] = None
    items: Optional[List[dict]] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    product_components: Optional[List[dict]] = None
    reminder_sent_at: Optional[datetime] = None
    reminder_count: int = 0
    created_at: datetime
    updated_at: datetime
    # Related objects from joins
    projects: Optional[dict] = None  # Project info from join
    customers: Optional[dict] = None  # Customer info from join
    invoice_items: Optional[List[dict]] = None  # Invoice items from join

class InvoiceCreate(BaseModel):
    """Invoice creation model"""
    invoice_number: str
    customer_id: str
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    items: Optional[List[dict]] = None
    notes: Optional[str] = None
    product_components: Optional[List[dict]] = None

class InvoiceUpdate(BaseModel):
    """Invoice update model"""
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    payment_status: Optional[PaymentStatus] = None
    paid_amount: Optional[float] = None
    paid_date: Optional[date] = None
    payment_date: Optional[date] = None
    items: Optional[List[dict]] = None
    notes: Optional[str] = None
    product_components: Optional[List[dict]] = None
    terms_and_conditions: Optional[str] = None
    payment_terms: Optional[str] = None
    discount_amount: Optional[float] = None

    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }
