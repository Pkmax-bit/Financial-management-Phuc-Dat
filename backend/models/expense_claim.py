from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

class ExpenseClaimStatus(str, Enum):
    """Status of expense claims"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class ExpenseCategory(str, Enum):
    """Categories of expenses"""
    TRAVEL = "travel"
    MEALS = "meals"
    OFFICE_SUPPLIES = "office_supplies"
    TRANSPORTATION = "transportation"
    ACCOMMODATION = "accommodation"
    ENTERTAINMENT = "entertainment"
    COMMUNICATION = "communication"
    TRAINING = "training"
    OTHER = "other"

class PaymentMethod(str, Enum):
    """Payment methods for expense claims"""
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"

class ExpenseClaimItem(BaseModel):
    """Individual expense item in a claim"""
    expense_category: ExpenseCategory
    description: str
    expense_date: date
    amount: float
    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None
    receipt_size: Optional[int] = None
    notes: Optional[str] = None

class ExpenseClaimBase(BaseModel):
    """Base expense claim model"""
    employee_id: str
    submission_date: date
    description: str
    line_items: List[ExpenseClaimItem]
    total_amount: float
    currency: str = "VND"
    notes: Optional[str] = None

class ExpenseClaimCreate(ExpenseClaimBase):
    """Model for creating a new expense claim"""
    pass

class ExpenseClaimUpdate(BaseModel):
    """Model for updating an expense claim"""
    description: Optional[str] = None
    line_items: Optional[List[ExpenseClaimItem]] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None

class ExpenseClaimApproval(BaseModel):
    """Model for approving/rejecting expense claims"""
    action: str  # 'approve' or 'reject'
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ExpenseClaimPayment(BaseModel):
    """Model for processing payment of expense claims"""
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    notes: Optional[str] = None

class ExpenseClaim(ExpenseClaimBase):
    """Complete expense claim model"""
    id: str
    claim_number: str
    status: ExpenseClaimStatus = ExpenseClaimStatus.DRAFT
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_by: Optional[str] = None
    paid_at: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ExpenseClaimSummary(BaseModel):
    """Summary model for expense claim lists"""
    id: str
    claim_number: str
    employee_id: str
    employee_email: Optional[str] = None
    employee_name: Optional[str] = None
    submission_date: date
    description: str
    total_amount: float
    currency: str
    status: ExpenseClaimStatus
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_by_email: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_by: Optional[str] = None
    paid_by_email: Optional[str] = None
    paid_by_name: Optional[str] = None
    paid_at: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    item_count: int = 0

    class Config:
        orm_mode = True

class ExpenseClaimStats(BaseModel):
    """Statistics for expense claims"""
    total_claims: int
    total_amount: float
    pending_claims: int
    approved_claims: int
    rejected_claims: int
    paid_claims: int
    by_status: dict
    by_category: dict

class ExpenseClaimItemDetail(BaseModel):
    """Detailed model for expense claim items"""
    id: str
    claim_id: str
    expense_category: ExpenseCategory
    description: str
    expense_date: date
    amount: float
    receipt_url: Optional[str] = None
    receipt_filename: Optional[str] = None
    receipt_size: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ExpenseClaimWithItems(ExpenseClaim):
    """Expense claim with detailed items"""
    items: List[ExpenseClaimItemDetail] = []

    class Config:
        orm_mode = True
