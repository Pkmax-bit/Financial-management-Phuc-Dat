"""
Time Entry model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class TimeEntry(BaseModel):
    """Time Entry model"""
    id: int
    user_id: str
    project_id: str
    entry_date: date
    hours_worked: float
    description: Optional[str] = None
    is_billable: bool = True
    created_at: datetime

class TimeEntryCreate(BaseModel):
    """Time Entry creation model"""
    project_id: str
    entry_date: date
    hours_worked: float
    description: Optional[str] = None
    is_billable: bool = True

class TimeEntryUpdate(BaseModel):
    """Time Entry update model"""
    project_id: Optional[str] = None
    entry_date: Optional[date] = None
    hours_worked: Optional[float] = None
    description: Optional[str] = None
    is_billable: Optional[bool] = None
