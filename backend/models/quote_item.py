"""
Quote Item model definitions
"""

from pydantic import BaseModel
from typing import Optional

class QuoteItem(BaseModel):
    """Quote item model"""
    id: str
    quote_id: str
    description: str
    quantity: float
    unit_price: float
    subtotal: float
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None

class QuoteItemCreate(BaseModel):
    """Quote item creation model"""
    quote_id: str
    description: str
    quantity: float
    unit_price: float
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None

class QuoteItemUpdate(BaseModel):
    """Quote item update model"""
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    area: Optional[float] = None
    volume: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    depth: Optional[float] = None
