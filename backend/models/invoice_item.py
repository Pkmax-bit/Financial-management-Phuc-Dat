"""
Invoice Item model definitions
"""

from pydantic import BaseModel
from typing import Optional

class InvoiceItem(BaseModel):
    """Invoice item model"""
    id: str
    invoice_id: str
    description: str
    quantity: float
    unit_price: float
    subtotal: float

class InvoiceItemCreate(BaseModel):
    """Invoice item creation model"""
    invoice_id: str
    description: str
    quantity: float
    unit_price: float

class InvoiceItemUpdate(BaseModel):
    """Invoice item update model"""
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
