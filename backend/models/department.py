"""
Department model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Department(BaseModel):
    """Department model"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DepartmentCreate(BaseModel):
    """Department creation model"""
    name: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    """Department update model"""
    name: Optional[str] = None
    description: Optional[str] = None
