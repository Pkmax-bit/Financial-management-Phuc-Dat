"""
Project model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Project(BaseModel):
    """Project model"""
    id: str
    project_code: str
    name: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    manager_id: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    budget: Optional[float] = None
    actual_cost: float = 0.0
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    progress: float = 0.0
    billing_type: str = "fixed"  # fixed, hourly, milestone
    hourly_rate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class ProjectCreate(BaseModel):
    """Project creation model"""
    project_code: str
    name: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    manager_id: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    budget: Optional[float] = None
    priority: ProjectPriority = ProjectPriority.MEDIUM
    billing_type: str = "fixed"
    hourly_rate: Optional[float] = None

class ProjectUpdate(BaseModel):
    """Project update model"""
    project_code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    customer_id: Optional[str] = None
    manager_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    actual_cost: Optional[float] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    progress: Optional[float] = None
    billing_type: Optional[str] = None
    hourly_rate: Optional[float] = None