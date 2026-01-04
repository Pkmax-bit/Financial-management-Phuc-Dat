"""
Quote model definitions - Optimized Structure
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal
from .products_services import Dimensions

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    APPROVED = "approved"

class QuoteItem(BaseModel):
    """Optimized Quote item model - relational only, no JSONB"""
    id: str
    quote_id: str
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

class Quote(BaseModel):
    """Optimized Quote model - relational structure"""
    id: str
    quote_number: str = Field(..., description="Unique quote number")

    # Relationships
    customer_id: str = Field(..., description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")

    # Dates
    issue_date: date = Field(..., description="Quote issue date")
    valid_until: date = Field(..., description="Quote validity date")

    # Financial summary
    subtotal: Decimal = Field(..., ge=0, description="Subtotal before tax and discount")
    discount_amount: Decimal = Field(0.0, ge=0, description="Discount amount")
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    tax_amount: Decimal = Field(0.0, ge=0, description="Total tax amount")
    total_amount: Decimal = Field(..., ge=0, description="Final total amount")
    currency: str = Field("VND", description="Currency code")

    # Status and workflow
    status: QuoteStatus = Field(QuoteStatus.DRAFT, description="Quote status")
    approval_required: bool = Field(False, description="Whether approval is required")
    approved_by: Optional[str] = Field(None, description="Approver user ID")
    approved_at: Optional[datetime] = Field(None, description="Approval timestamp")

    # Content
    notes: Optional[str] = Field(None, description="Quote notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Metadata
    created_by: str = Field(..., description="Creator user ID")
    employee_in_charge: Optional[str] = Field(None, description="Employee responsible")

    # Related data (populated by joins)
    customer: Optional[dict] = Field(None, description="Customer details")
    project: Optional[dict] = Field(None, description="Project details")
    quote_items: Optional[List[QuoteItem]] = Field(None, description="Quote line items")

    # Audit
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }

class QuoteItemCreate(BaseModel):
    """Quote item creation model"""
    product_service_id: Optional[str] = Field(None, description="Reference to product/service")
    description: str = Field(..., description="Item description")
    quantity: Decimal = Field(..., gt=0, description="Quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")
    tax_rate: Decimal = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    sort_order: int = Field(0, description="Display order")
    notes: Optional[str] = Field(None, description="Additional notes")

class QuoteItemUpdate(BaseModel):
    """Quote item update model"""
    product_service_id: Optional[str] = Field(None, description="Reference to product/service")
    description: Optional[str] = Field(None, description="Item description")
    quantity: Optional[Decimal] = Field(None, gt=0, description="Quantity")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    dimensions: Optional[Dimensions] = Field(None, description="Physical dimensions")
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Tax rate percentage")
    sort_order: Optional[int] = Field(None, description="Display order")
    notes: Optional[str] = Field(None, description="Additional notes")

class QuoteCreate(BaseModel):
    """Quote creation model"""
    quote_number: str = Field(..., description="Unique quote number")
    customer_id: str = Field(..., description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")

    # Dates
    issue_date: date = Field(..., description="Quote issue date")
    valid_until: date = Field(..., description="Quote validity date")

    # Financial
    currency: str = Field("VND", description="Currency code")
    discount_amount: Decimal = Field(0.0, ge=0, description="Discount amount")

    # Content
    notes: Optional[str] = Field(None, description="Quote notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Items (relational only)
    items: List[QuoteItemCreate] = Field(..., description="Quote line items")

    # Workflow
    approval_required: bool = Field(False, description="Whether approval is required")
    employee_in_charge: Optional[str] = Field(None, description="Employee responsible")

class QuoteUpdate(BaseModel):
    """Quote update model"""
    quote_number: Optional[str] = Field(None, description="Unique quote number")
    customer_id: Optional[str] = Field(None, description="Customer reference")
    project_id: Optional[str] = Field(None, description="Project reference")

    # Dates
    issue_date: Optional[date] = Field(None, description="Quote issue date")
    valid_until: Optional[date] = Field(None, description="Quote validity date")

    # Financial
    currency: Optional[str] = Field(None, description="Currency code")
    discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")

    # Content
    notes: Optional[str] = Field(None, description="Quote notes")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Status
    status: Optional[QuoteStatus] = Field(None, description="Quote status")

    # Workflow
    approval_required: Optional[bool] = Field(None, description="Whether approval is required")
    employee_in_charge: Optional[str] = Field(None, description="Employee responsible")

class QuoteConvertToInvoice(BaseModel):
    """Convert quote to invoice model"""
    quote_id: str = Field(..., description="Quote to convert")
    invoice_number: str = Field(..., description="New invoice number")
    issue_date: date = Field(..., description="Invoice issue date")
    due_date: date = Field(..., description="Invoice due date")