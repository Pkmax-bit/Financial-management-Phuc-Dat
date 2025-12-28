"""
Custom Products models for customizable product system
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Categories
class CustomProductCategory(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    order_index: int = 0
    is_active: bool = True
    is_primary: bool = False
    created_at: datetime
    updated_at: datetime

class CustomProductCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CustomProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

# Columns
class CustomProductColumn(BaseModel):
    id: str
    category_id: str
    name: str
    description: Optional[str] = None
    order_index: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class CustomProductColumnCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None

class CustomProductColumnUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

# Options
class CustomProductOption(BaseModel):
    id: str
    column_id: str
    name: str
    description: Optional[str] = None
    order_index: int = 0

    # Dimensions
    width: Optional[float] = None
    height: Optional[float] = None
    depth: Optional[float] = None
    has_dimensions: bool = False

    # Visuals
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None

    # Pricing
    unit_price: Optional[float] = 0
    unit: str = "cái"

    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class CustomProductOptionCreate(BaseModel):
    column_id: str
    name: str
    description: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    depth: Optional[float] = None
    has_dimensions: bool = False
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    unit_price: Optional[float] = 0
    unit: str = "cái"

class CustomProductOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    width: Optional[float] = None
    height: Optional[float] = None
    depth: Optional[float] = None
    has_dimensions: Optional[bool] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    unit_price: Optional[float] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None

# Combined Products
class SelectedOption(BaseModel):
    column_id: str
    column_name: str
    option_id: str
    option_name: str
    quantity: int = 1
    unit_price: Optional[float] = None

class CustomProduct(BaseModel):
    id: str
    category_id: str
    name: str
    description: Optional[str] = None
    column_options: Dict[str, Any]  # JSON structure

    # Calculated dimensions
    total_width: Optional[float] = None
    total_height: Optional[float] = None
    total_depth: Optional[float] = None

    # Calculated pricing
    total_price: Optional[float] = None
    quantity: int = 1
    total_amount: Optional[float] = None

    # Images
    image_urls: Optional[List[str]] = None

    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class CustomProductCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    column_options: Dict[str, Any]
    total_width: Optional[float] = None
    total_height: Optional[float] = None
    total_depth: Optional[float] = None
    total_price: Optional[float] = None
    quantity: int = 1
    total_amount: Optional[float] = None
    image_urls: Optional[List[str]] = None

class CustomProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    column_options: Optional[Dict[str, Any]] = None
    total_width: Optional[float] = None
    total_height: Optional[float] = None
    total_depth: Optional[float] = None
    total_price: Optional[float] = None
    quantity: Optional[int] = None
    total_amount: Optional[float] = None
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Structures
class CustomProductStructure(BaseModel):
    id: str
    category_id: str
    name: str
    description: Optional[str] = None
    column_order: List[str]  # UUIDs of columns
    separator: str = " "
    column_combinations: Optional[List[str]] = None  # Combinations between columns
    primary_column_id: Optional[str] = None  # Primary column for dimensions
    is_default: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class CustomProductStructureCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    column_order: List[str]
    separator: str = " "
    column_combinations: Optional[List[str]] = None
    primary_column_id: Optional[str] = None
    is_default: bool = False

class CustomProductStructureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    column_order: Optional[List[str]] = None
    separator: Optional[str] = None
    column_combinations: Optional[List[str]] = None
    primary_column_id: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None




