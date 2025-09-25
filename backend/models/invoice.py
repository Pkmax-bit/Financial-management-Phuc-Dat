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
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    VOIDED = "voided"

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
    quote_id: Optional[str] = None  # If created from quote
    invoice_type: InvoiceType = InvoiceType.STANDARD
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_amount: float = 0.0
    payment_terms: Optional[str] = None
    items: List[InvoiceItem] = []
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    
    # Tracking fields
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    last_reminder_sent: Optional[datetime] = None
    reminder_count: int = 0
    
    # Recurring invoice fields
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None  # monthly, quarterly, yearly
    recurring_end_date: Optional[date] = None
    next_recurring_date: Optional[date] = None
    
    # Metadata
    created_by: str
    created_at: datetime
    updated_at: datetime

class InvoiceCreate(BaseModel):
    """Invoice creation model"""
    invoice_number: str
    customer_id: str
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    invoice_type: InvoiceType = InvoiceType.STANDARD
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 0.0
    discount_amount: float = 0.0
    payment_terms: Optional[str] = None
    items: List[InvoiceItem] = []
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    
    # Recurring invoice fields
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    recurring_end_date: Optional[date] = None

class InvoiceUpdate(BaseModel):
    """Invoice update model"""
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    status: Optional[InvoiceStatus] = None
    payment_status: Optional[PaymentStatus] = None
    paid_amount: Optional[float] = None
    items: Optional[List[InvoiceItem]] = None
    notes: Optional[str] = None
