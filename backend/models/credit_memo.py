"""
Credit Memo model definitions
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class CreditMemoStatus(str, Enum):
    """Credit Memo status"""
    OPEN = "open"
    APPLIED = "applied"
    CLOSED = "closed"

class CreditMemoItem(BaseModel):
    """Credit Memo line item"""
    product_id: Optional[str] = None
    product_name: str
    description: Optional[str] = None
    quantity: float
    unit_price: float
    discount_rate: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    line_total: float
    reason: Optional[str] = None  # Lý do trả lại

class CreditMemo(BaseModel):
    """Credit Memo model"""
    id: Optional[str] = None
    credit_memo_number: str
    customer_id: str
    original_invoice_id: Optional[str] = None
    issue_date: date
    returned_items: List[CreditMemoItem]
    subtotal: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    total_amount: float
    currency: str = "VND"
    status: CreditMemoStatus = CreditMemoStatus.OPEN
    reason: Optional[str] = None  # Lý do chung cho credit memo
    applied_amount: float = 0.0  # Số tiền đã áp dụng
    remaining_amount: float = 0.0  # Số tiền còn lại
    applied_to_invoices: Optional[List[str]] = None  # Danh sách invoice đã áp dụng
    refund_amount: float = 0.0  # Số tiền đã hoàn
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreditMemoCreate(BaseModel):
    """Create credit memo request"""
    customer_id: str
    original_invoice_id: Optional[str] = None
    issue_date: date
    returned_items: List[CreditMemoItem]
    subtotal: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    total_amount: float
    currency: str = "VND"
    reason: Optional[str] = None
    notes: Optional[str] = None

class CreditMemoUpdate(BaseModel):
    """Update credit memo request"""
    customer_id: Optional[str] = None
    original_invoice_id: Optional[str] = None
    issue_date: Optional[date] = None
    returned_items: Optional[List[CreditMemoItem]] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[CreditMemoStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class CreditMemoApplication(BaseModel):
    """Apply credit memo to invoice"""
    credit_memo_id: str
    invoice_id: str
    applied_amount: float
    notes: Optional[str] = None

class CreditMemoRefund(BaseModel):
    """Refund credit memo"""
    credit_memo_id: str
    refund_amount: float
    refund_method: str  # 'cash', 'bank_transfer', 'check'
    refund_reference: Optional[str] = None
    notes: Optional[str] = None
