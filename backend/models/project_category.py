"""
Project Category model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectCategory(BaseModel):
    """Project Category model"""
    id: str
    name: str
    code: str
    description: Optional[str] = None
    color: Optional[str] = None  # Hex color code (e.g., #FF5733)
    icon: Optional[str] = None  # Icon name
    display_order: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ProjectCategoryCreate(BaseModel):
    """Project Category creation model"""
    name: str
    code: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class ProjectCategoryUpdate(BaseModel):
    """Project Category update model"""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


















