"""
Invoice model definitions - Optimized Structure
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal
from .products_services import Dimensions

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
    """Optimized Invoice item model - relational only, no JSONB"""
    id: str
    invoice_id: str
    product_service_id: Optional[str] = Field(None, description="Reference to product/service")

    # Item details
    description: str = Field(..., description="Item description")
    quantity: Decimal = Field(..., gt=0, description="Quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")

    # Dimensions (inherited from product or custom)
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")

    # Financial calculations
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    line_total: Decimal = Field(..., ge=0, description="Line total before tax")
    tax_amount: Decimal = Field(0.0, ge=0, description="Tax amount")
    total_with_tax: Decimal = Field(..., ge=0, description="Total including tax")

    # Metadata
    sort_order: int = Field(0, description="Display order")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }

class Invoice(BaseModel):
    """Optimized Invoice model - relational structure"""
    id: str
    invoice_number: str = Field(..., description="Unique invoice number")

    # Relationships
    customer_id: str = Field(..., description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")
    quote_id: Optional[str] = Field(None, description="Quote reference")

    # Invoice type
    invoice_type: InvoiceType = Field(InvoiceType.STANDARD, description="Type of invoice")

    # Dates
    issue_date: date = Field(..., description="Invoice issue date")
    due_date: date = Field(..., description="Payment due date")

    # Financial summary
    subtotal: Decimal = Field(..., ge=0, description="Subtotal before tax and discount")
    discount_amount: Decimal = Field(0.0, ge=0, description="Discount amount")
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    tax_amount: Decimal = Field(0.0, ge=0, description="Total tax amount")
    total_amount: Decimal = Field(..., ge=0, description="Final total amount")
    currency: str = Field("VND", description="Currency code")

    # Status
    status: InvoiceStatus = Field(InvoiceStatus.DRAFT, description="Invoice status")
    payment_status: PaymentStatus = Field(PaymentStatus.PENDING, description="Payment status")

    # Payment tracking
    paid_amount: Decimal = Field(0.0, ge=0, description="Amount paid")
    paid_date: Optional[date] = Field(None, description="Payment date")
    payment_date: Optional[date] = Field(None, description="Payment date")

    # Content
    notes: Optional[str] = Field(None, description="Invoice notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Metadata
    created_by: str = Field(..., description="Creator user ID")

    # Related data (populated by joins)
    customer: Optional[dict] = Field(None, description="Customer details")
    project: Optional[dict] = Field(None, description="Project details")
    quote: Optional[dict] = Field(None, description="Quote details")
    invoice_items: Optional[List[InvoiceItem]] = Field(None, description="Invoice line items")

    # Reminders
    reminder_sent_at: Optional[datetime] = Field(None, description="Last reminder sent")
    reminder_count: int = Field(0, description="Number of reminders sent")

    # Audit
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }

class InvoiceItemCreate(BaseModel):
    """Invoice item creation model"""
    product_service_id: Optional[str] = Field(None, description="Reference to product/service")
    description: str = Field(..., description="Item description")
    quantity: Decimal = Field(..., gt=0, description="Quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    sort_order: int = Field(0, description="Display order")
    notes: Optional[str] = Field(None, description="Additional notes")

class InvoiceItemUpdate(BaseModel):
    """Invoice item update model"""
    product_service_id: Optional[str] = Field(None, description="Reference to product/service")
    description: Optional[str] = Field(None, description="Item description")
    quantity: Optional[Decimal] = Field(None, gt=0, description="Quantity")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Tax rate percentage")
    sort_order: Optional[int] = Field(None, description="Display order")
    notes: Optional[str] = Field(None, description="Additional notes")

class InvoiceCreate(BaseModel):
    """Invoice creation model"""
    invoice_number: str = Field(..., description="Unique invoice number")
    customer_id: str = Field(..., description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")
    quote_id: Optional[str] = Field(None, description="Quote reference")

    # Invoice type
    invoice_type: InvoiceType = Field(InvoiceType.STANDARD, description="Type of invoice")

    # Dates
    issue_date: date = Field(..., description="Invoice issue date")
    due_date: date = Field(..., description="Payment due date")

    # Financial
    currency: str = Field("VND", description="Currency code")
    discount_amount: Decimal = Field(0.0, ge=0, description="Discount amount")

    # Content
    notes: Optional[str] = Field(None, description="Invoice notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Items (relational only)
    items: List[InvoiceItemCreate] = Field(..., description="Invoice line items")

class InvoiceUpdate(BaseModel):
    """Invoice update model"""
    invoice_number: Optional[str] = Field(None, description="Unique invoice number")
    customer_id: Optional[str] = Field(None, description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")
    quote_id: Optional[str] = Field(None, description="Quote reference")

    # Invoice type
    invoice_type: Optional[InvoiceType] = Field(None, description="Type of invoice")

    # Dates
    issue_date: Optional[date] = Field(None, description="Invoice issue date")
    due_date: Optional[date] = Field(None, description="Payment due date")

    # Financial
    currency: Optional[str] = Field(None, description="Currency code")
    discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")

    # Status
    status: Optional[InvoiceStatus] = Field(None, description="Invoice status")
    payment_status: Optional[PaymentStatus] = Field(None, description="Payment status")

    # Payment tracking
    paid_amount: Optional[Decimal] = Field(None, ge=0, description="Amount paid")
    paid_date: Optional[date] = Field(None, description="Payment date")
    payment_date: Optional[date] = Field(None, description="Payment date")

    # Content
    notes: Optional[str] = Field(None, description="Invoice notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")
