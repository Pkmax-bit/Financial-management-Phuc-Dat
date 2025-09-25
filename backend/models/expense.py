"""
Expense model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class ExpenseCategory(str, Enum):
    # Business Expenses
    TRAVEL = "travel"
    MEALS = "meals"
    ACCOMMODATION = "accommodation"
    TRANSPORTATION = "transportation"
    FUEL = "fuel"
    
    # Office Expenses
    OFFICE_SUPPLIES = "office_supplies"
    EQUIPMENT = "equipment"
    SOFTWARE = "software"
    SUBSCRIPTIONS = "subscriptions"
    
    # Marketing & Advertising
    ADVERTISING = "advertising"
    MARKETING = "marketing"
    
    # Professional Services
    TRAINING = "training"
    CONSULTING = "consulting"
    LEGAL = "legal"
    ACCOUNTING = "accounting"
    
    # Operational
    UTILITIES = "utilities"
    RENT = "rent"
    MAINTENANCE = "maintenance"
    INSURANCE = "insurance"
    
    # Other
    MISCELLANEOUS = "miscellaneous"
    OTHER = "other"

class ExpenseStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REIMBURSED = "reimbursed"
    PAID = "paid"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    COMPANY_CARD = "company_card"
    PERSONAL = "personal"  # Personal payment to be reimbursed

class Expense(BaseModel):
    """Expense model"""
    id: str
    expense_code: str
    employee_id: str
    vendor_id: Optional[str] = None  # Vendor who provided goods/services
    project_id: Optional[str] = None
    customer_id: Optional[str] = None  # If billable to specific customer
    category: ExpenseCategory
    description: str
    amount: float
    currency: str = "VND"
    expense_date: date
    payment_method: PaymentMethod = PaymentMethod.PERSONAL
    payment_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    status: ExpenseStatus = ExpenseStatus.DRAFT
    is_billable: bool = False  # Can be charged to customer
    billable_amount: Optional[float] = None
    is_reimbursable: bool = True  # Should be reimbursed to employee
    tax_amount: Optional[float] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    paid_by: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[str] = None  # Comma-separated tags
    created_at: datetime
    updated_at: datetime

class ExpenseCreate(BaseModel):
    """Expense creation model"""
    expense_code: str
    employee_id: str
    vendor_id: Optional[str] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None
    category: ExpenseCategory
    description: str
    amount: float
    currency: str = "VND"
    expense_date: date
    payment_method: PaymentMethod = PaymentMethod.PERSONAL
    payment_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    is_billable: bool = False
    billable_amount: Optional[float] = None
    is_reimbursable: bool = True
    tax_amount: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class ExpenseUpdate(BaseModel):
    """Expense update model"""
    expense_code: Optional[str] = None
    vendor_id: Optional[str] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    expense_date: Optional[date] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    status: Optional[ExpenseStatus] = None
    is_billable: Optional[bool] = None
    billable_amount: Optional[float] = None
    is_reimbursable: Optional[bool] = None
    tax_amount: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class ExpenseReimbursement(BaseModel):
    """Expense reimbursement model"""
    expense_ids: list[str]
    reimbursement_amount: float
    reimbursement_date: date
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
