"""
Products/Services model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ProductServiceType(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"

class ProductService(BaseModel):
    """Product/Service model"""
    id: str
    code: str
    name: str
    description: Optional[str] = None
    type: ProductServiceType
    unit: str = "piece"
    price: float
    cost: Optional[float] = None
    tax_rate: float = 0.0
    category: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ProductServiceCreate(BaseModel):
    """Product/Service creation model"""
    code: str
    name: str
    description: Optional[str] = None
    type: ProductServiceType
    unit: str = "piece"
    price: float
    cost: Optional[float] = None
    tax_rate: float = 0.0
    category: Optional[str] = None

class ProductServiceUpdate(BaseModel):
    """Product/Service update model"""
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ProductServiceType] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    tax_rate: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
