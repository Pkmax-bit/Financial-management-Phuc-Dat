from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

class BudgetPeriod(str, Enum):
    """Budget period types"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class BudgetStatus(str, Enum):
    """Budget status"""
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"

class BudgetLineItem(BaseModel):
    """Individual budget line item"""
    expense_category: str
    expense_category_name: str
    budgeted_amount: float
    actual_amount: float = 0.0
    variance_amount: float = 0.0
    variance_percentage: float = 0.0
    notes: Optional[str] = None

class BudgetBase(BaseModel):
    """Base budget model"""
    budget_name: str
    period: BudgetPeriod
    start_date: date
    end_date: date
    budget_lines: List[BudgetLineItem]
    total_budget_amount: float
    currency: str = "VND"
    description: Optional[str] = None

class BudgetCreate(BudgetBase):
    """Model for creating a new budget"""
    pass

class BudgetUpdate(BaseModel):
    """Model for updating a budget"""
    budget_name: Optional[str] = None
    period: Optional[BudgetPeriod] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_lines: Optional[List[BudgetLineItem]] = None
    total_budget_amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    status: Optional[BudgetStatus] = None

class Budget(BudgetBase):
    """Complete budget model"""
    id: str
    status: BudgetStatus = BudgetStatus.DRAFT
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BudgetSummary(BaseModel):
    """Summary model for budget lists"""
    id: str
    budget_name: str
    period: BudgetPeriod
    start_date: date
    end_date: date
    total_budget_amount: float
    currency: str
    status: BudgetStatus
    description: Optional[str] = None
    created_by: Optional[str] = None
    created_by_email: Optional[str] = None
    created_by_name: Optional[str] = None
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    line_count: int = 0
    total_actual_amount: float = 0.0
    total_variance_amount: float = 0.0

    class Config:
        orm_mode = True

class BudgetLine(BaseModel):
    """Detailed budget line model"""
    id: str
    budget_id: str
    expense_category: str
    expense_category_name: str
    budgeted_amount: float
    actual_amount: float
    variance_amount: float
    variance_percentage: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BudgetWithLines(Budget):
    """Budget with detailed lines"""
    lines: List[BudgetLine] = []

    class Config:
        orm_mode = True

class BudgetVariance(BaseModel):
    """Budget variance analysis"""
    expense_category: str
    budgeted_amount: float
    actual_amount: float
    variance_amount: float
    variance_percentage: float

class BudgetReport(BaseModel):
    """Budget report data"""
    budget_id: str
    budget_name: str
    period: BudgetPeriod
    start_date: date
    end_date: date
    total_budgeted: float
    total_actual: float
    total_variance: float
    total_variance_percentage: float
    variances: List[BudgetVariance]
    currency: str

class BudgetStats(BaseModel):
    """Budget statistics"""
    total_budgets: int
    total_budgeted_amount: float
    total_actual_amount: float
    total_variance_amount: float
    active_budgets: int
    draft_budgets: int
    closed_budgets: int
    by_period: dict
    by_status: dict

class BudgetApproval(BaseModel):
    """Model for approving budgets"""
    action: str  # 'approve' or 'close'
    notes: Optional[str] = None

class BudgetLineCreate(BaseModel):
    """Model for creating budget lines"""
    expense_category: str
    expense_category_name: str
    budgeted_amount: float
    notes: Optional[str] = None

class BudgetLineUpdate(BaseModel):
    """Model for updating budget lines"""
    budgeted_amount: Optional[float] = None
    notes: Optional[str] = None
