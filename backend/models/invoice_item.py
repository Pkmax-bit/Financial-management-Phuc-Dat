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
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None

class InvoiceItemCreate(BaseModel):
    """Invoice item creation model"""
    invoice_id: str
    description: str
    quantity: float
    unit_price: float
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None

class InvoiceItemUpdate(BaseModel):
    """Invoice item update model"""
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None
