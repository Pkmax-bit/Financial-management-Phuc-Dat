"""
Position model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Position(BaseModel):
    """Position model"""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PositionCreate(BaseModel):
    """Position creation model"""
    name: str
    description: Optional[str] = None

class PositionUpdate(BaseModel):
    """Position update model"""
    name: Optional[str] = None
    description: Optional[str] = None
