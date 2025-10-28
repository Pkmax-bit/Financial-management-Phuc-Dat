from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

class PurchaseOrderStatus(str, Enum):
    """Status of purchase orders"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLOSED = "closed"

class PurchaseOrderItem(BaseModel):
    """Individual item in a purchase order"""
    product_id: Optional[str] = None
    product_name: str
    description: Optional[str] = None
    quantity: int
    unit_price: float
    discount_rate: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    line_total: float

class PurchaseOrderBase(BaseModel):
    """Base purchase order model"""
    vendor_id: str
    issue_date: date
    delivery_date: Optional[date] = None
    line_items: List[PurchaseOrderItem]
    subtotal: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    total_amount: float
    currency: str = "VND"
    notes: Optional[str] = None
    terms: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    """Model for creating a new purchase order"""
    pass

class PurchaseOrderUpdate(BaseModel):
    """Model for updating a purchase order"""
    vendor_id: Optional[str] = None
    issue_date: Optional[date] = None
    delivery_date: Optional[date] = None
    line_items: Optional[List[PurchaseOrderItem]] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    """Complete purchase order model"""
    id: str
    po_number: str
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PurchaseOrderApproval(BaseModel):
    """Model for approving/rejecting purchase orders"""
    action: str  # 'approve' or 'reject'
    notes: Optional[str] = None

class PurchaseOrderSummary(BaseModel):
    """Summary model for purchase order lists"""
    id: str
    po_number: str
    vendor_id: str
    vendor_name: str
    vendor_email: Optional[str] = None
    issue_date: date
    delivery_date: Optional[date] = None
    total_amount: float
    currency: str
    status: PurchaseOrderStatus
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_by_email: Optional[str] = None
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    item_count: int = 0

    class Config:
        from_attributes = True

class PurchaseOrderStats(BaseModel):
    """Statistics for purchase orders"""
    total_orders: int
    total_amount: float
    by_status: dict
    by_vendor: dict
    pending_approval: int
    approved_this_month: int
    rejected_this_month: int

class ConvertToBillRequest(BaseModel):
    """Request model for converting PO to Bill"""
    bill_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
