"""
Drill-Down Report Models
Models for detailed transaction drill-down functionality
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class ReportType(str, Enum):
    """Types of reports that support drill-down"""
    PNL = "pnl"
    BALANCE_SHEET = "balance-sheet"
    AR_AGING = "ar-aging"
    AP_AGING = "ap-aging"
    CASH_FLOW = "cash-flow"

class TransactionType(str, Enum):
    """Types of transactions"""
    INVOICE = "invoice"
    PAYMENT = "payment"
    SALES_RECEIPT = "sales_receipt"
    CREDIT_MEMO = "credit_memo"
    EXPENSE = "expense"
    BILL = "bill"
    BILL_PAYMENT = "bill_payment"
    JOURNAL_ENTRY = "journal_entry"
    PURCHASE_ORDER = "purchase_order"
    EXPENSE_CLAIM = "expense_claim"

class DrillDownTransaction(BaseModel):
    """Individual transaction in drill-down"""
    transaction_id: str
    transaction_type: TransactionType
    transaction_number: str
    transaction_date: date
    description: str
    reference: Optional[str] = None
    amount: float
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    account_code: str
    account_name: str
    customer_name: Optional[str] = None
    vendor_name: Optional[str] = None
    employee_name: Optional[str] = None
    project_name: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime

class DrillDownSummary(BaseModel):
    """Summary of drill-down results"""
    total_transactions: int
    total_amount: float
    total_debit: float
    total_credit: float
    date_range: str
    account_info: Dict[str, Any]

class DrillDownReport(BaseModel):
    """Complete drill-down report"""
    # Report metadata
    report_type: ReportType
    account_id: str
    account_code: str
    account_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    as_of_date: Optional[date] = None
    currency: str = "VND"
    generated_at: datetime
    
    # Summary information
    summary: DrillDownSummary
    
    # Detailed transactions
    transactions: List[DrillDownTransaction]
    
    # Additional context
    report_title: str
    report_description: str

class DrillDownRequest(BaseModel):
    """Request parameters for drill-down report"""
    report_type: ReportType
    account_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    as_of_date: Optional[date] = None
    limit: int = 100
    offset: int = 0

class DrillDownResponse(BaseModel):
    """Response for drill-down API"""
    success: bool
    data: Optional[DrillDownReport] = None
    error: Optional[str] = None
    total_count: int = 0
    has_more: bool = False
