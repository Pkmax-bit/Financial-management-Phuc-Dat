"""
Product Category model definitions - Hierarchical Structure
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .products_services import BaseEntity

class ProductCategory(BaseEntity):
    """Hierarchical Product Category model"""
    name: str = Field(..., description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    category_code: Optional[str] = Field(None, description="Unique category code")

    # Hierarchical structure
    parent_id: Optional[str] = Field(None, description="Parent category ID")
    category_level: int = Field(1, ge=1, le=5, description="Category level in hierarchy")
    sort_order: int = Field(0, description="Sort order within same level")

    # Visual properties
    icon_name: Optional[str] = Field(None, description="Icon name for UI")
    color_code: Optional[str] = Field(None, description="Color code for UI")

    # System fields
    path: Optional[str] = Field(None, description="Materialized path")
    is_active: bool = Field(True, description="Whether category is active")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class ProductCategoryCreate(BaseModel):
    """Product Category creation model"""
    name: str = Field(..., description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    category_code: Optional[str] = Field(None, description="Unique category code")
    parent_id: Optional[str] = Field(None, description="Parent category ID")
    sort_order: int = Field(0, description="Sort order within same level")
    icon_name: Optional[str] = Field(None, description="Icon name for UI")
    color_code: Optional[str] = Field(None, description="Color code for UI")

class ProductCategoryUpdate(BaseModel):
    """Product Category update model"""
    name: Optional[str] = Field(None, description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    category_code: Optional[str] = Field(None, description="Unique category code")
    parent_id: Optional[str] = Field(None, description="Parent category ID")
    sort_order: Optional[int] = Field(None, description="Sort order within same level")
    icon_name: Optional[str] = Field(None, description="Icon name for UI")
    color_code: Optional[str] = Field(None, description="Color code for UI")
    is_active: Optional[bool] = Field(None, description="Whether category is active")

class ProductCategoryTree(BaseModel):
    """Product Category tree node with children"""
    id: str
    name: str
    description: Optional[str]
    category_code: Optional[str]
    parent_id: Optional[str]
    category_level: int
    sort_order: int
    icon_name: Optional[str]
    color_code: Optional[str]
    path: Optional[str]
    is_active: bool
    children_count: int = Field(0, description="Number of child categories")
    children: List['ProductCategoryTree'] = Field(default_factory=list, description="Child categories")
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Update forward reference
ProductCategoryTree.update_forward_refs()
