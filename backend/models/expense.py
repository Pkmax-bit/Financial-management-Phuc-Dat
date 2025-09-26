"""
Expense model definitions
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class ExpenseCategory(str, Enum):
    TRAVEL = "travel"
    MEALS = "meals"
    ACCOMMODATION = "accommodation"
    TRANSPORTATION = "transportation"
    SUPPLIES = "supplies"
    EQUIPMENT = "equipment"
    TRAINING = "training"
    OTHER = "other"

class ExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Expense(BaseModel):
    """Expense model"""
    id: str
    expense_code: str
    employee_id: str
    project_id: Optional[str] = None
    vendor_id: Optional[str] = None
    category: ExpenseCategory
    description: str
    amount: float
    currency: str = "VND"
    expense_date: date
    receipt_url: Optional[str] = None
    status: ExpenseStatus = ExpenseStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ExpenseCreate(BaseModel):
    """Expense creation model"""
    employee_id: str
    project_id: Optional[str] = None
    vendor_id: Optional[str] = None
    category: ExpenseCategory
    description: str
    amount: float
    currency: str = "VND"
    expense_date: date
    receipt_url: Optional[str] = None
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    """Expense update model"""
    project_id: Optional[str] = None
    vendor_id: Optional[str] = None
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    expense_date: Optional[date] = None
    receipt_url: Optional[str] = None
    status: Optional[ExpenseStatus] = None
    rejected_reason: Optional[str] = None
    notes: Optional[str] = None

class ExpenseReimbursement(BaseModel):
    """Expense reimbursement model"""
    expense_ids: List[str]
    reimbursement_date: date
    total_amount: float
    notes: Optional[str] = None