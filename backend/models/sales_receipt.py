from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal

class SalesReceiptItem(BaseModel):
    """Sales receipt line item"""
    product_id: Optional[str] = None
    product_name: str
    description: Optional[str] = None
    quantity: float
    unit_price: float
    discount_rate: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    line_total: float

class SalesReceipt(BaseModel):
    """Sales Receipt model"""
    id: Optional[str] = None
    receipt_number: str
    customer_id: Optional[str] = None
    issue_date: date
    line_items: List[SalesReceiptItem]
    subtotal: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    total_amount: float
    payment_method: str  # 'Cash', 'Credit Card', 'Bank Transfer', etc.
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SalesReceiptCreate(BaseModel):
    """Create sales receipt request"""
    customer_id: Optional[str] = None
    issue_date: date
    line_items: List[SalesReceiptItem]
    subtotal: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    total_amount: float
    payment_method: str
    notes: Optional[str] = None

class SalesReceiptUpdate(BaseModel):
    """Update sales receipt request"""
    customer_id: Optional[str] = None
    issue_date: Optional[date] = None
    line_items: Optional[List[SalesReceiptItem]] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None