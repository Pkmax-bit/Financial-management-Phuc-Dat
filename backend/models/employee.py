"""
Employee model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"

class Employee(BaseModel):
    """Employee model"""
    id: str
    user_id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: date
    salary: Optional[float] = None
    status: EmploymentStatus = EmploymentStatus.ACTIVE
    manager_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class EmployeeCreate(BaseModel):
    """Employee creation model"""
    user_id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: date
    salary: Optional[float] = None
    manager_id: Optional[str] = None

class EmployeeUpdate(BaseModel):
    """Employee update model"""
    employee_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: Optional[date] = None
    salary: Optional[float] = None
    status: Optional[EmploymentStatus] = None
    manager_id: Optional[str] = None
