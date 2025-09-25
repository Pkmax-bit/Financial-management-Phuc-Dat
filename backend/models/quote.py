"""
Quote model definitions for Sales Center
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CLOSED = "closed"

class QuoteItem(BaseModel):
    """Quote item model"""
    description: str
    quantity: float
    unit_price: float
    total: float
    notes: Optional[str] = None

class Quote(BaseModel):
    """Quote model"""
    id: str
    quote_number: str
    customer_id: str
    project_id: Optional[str] = None
    issue_date: date
    valid_until: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: QuoteStatus = QuoteStatus.DRAFT
    items: List[QuoteItem] = []
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class QuoteCreate(BaseModel):
    """Quote creation model"""
    quote_number: str
    customer_id: str
    project_id: Optional[str] = None
    issue_date: date
    valid_until: date
    subtotal: float
    tax_rate: float = 0.0
    items: List[QuoteItem] = []
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None

class QuoteUpdate(BaseModel):
    """Quote update model"""
    quote_number: Optional[str] = None
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    valid_until: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    status: Optional[QuoteStatus] = None
    items: Optional[List[QuoteItem]] = None
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None

class QuoteConvertToInvoice(BaseModel):
    """Model for converting quote to invoice"""
    invoice_number: Optional[str] = None
    due_days: int = 30
    payment_terms: Optional[str] = None