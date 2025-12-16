"""
Quote model definitions
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

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
    notes: Optional[str] = None
    created_by: Optional[str] = None
    product_components: Optional[List[dict]] = None
    quote_items: Optional[List[dict]] = None  # Chi tiết sản phẩm của báo giá
    created_at: datetime
    updated_at: datetime

class QuoteItem(BaseModel):
    """Quote item model"""
    id: str
    quote_id: str
    product_service_id: Optional[str] = None
    description: str
    quantity: float
    unit_price: float
    total_price: float
    created_at: datetime

class QuoteCreate(BaseModel):
    """Quote creation model"""
    quote_number: str
    customer_id: str
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    valid_until: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: str = "draft"
    notes: Optional[str] = None
    terms: Optional[str] = None
    discount_rate: float = 0.0
    discount_amount: float = 0.0
    items: Optional[List[dict]] = None
    product_components: Optional[List[dict]] = None

class QuoteUpdate(BaseModel):
    """Quote update model"""
    quote_number: Optional[str] = None
    customer_id: Optional[str] = None
    project_id: Optional[str] = None
    issue_date: Optional[date] = None
    valid_until: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[QuoteStatus] = None
    notes: Optional[str] = None
    product_components: Optional[List[dict]] = None

class QuoteConvertToInvoice(BaseModel):
    """Convert quote to invoice model"""
    quote_id: str
    invoice_number: str
    issue_date: date
    due_date: date