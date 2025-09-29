from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class AccountingEntry(BaseModel):
    """Accounting Entry model"""
    id: Optional[str] = None
    entry_number: str
    entry_date: datetime
    description: str
    reference_type: str  # 'sales_receipt', 'invoice', 'payment', etc.
    reference_id: str
    total_debit: float
    total_credit: float
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AccountingEntryLine(BaseModel):
    """Accounting Entry Line model"""
    id: Optional[str] = None
    entry_id: str
    account_code: str
    account_name: str
    debit_amount: float
    credit_amount: float
    description: Optional[str] = None
    created_at: Optional[datetime] = None

class AccountingEntryCreate(BaseModel):
    """Create accounting entry request"""
    entry_date: datetime
    description: str
    reference_type: str
    reference_id: str
    lines: List[AccountingEntryLine]

class AccountingEntryLineCreate(BaseModel):
    """Create accounting entry line request"""
    account_code: str
    account_name: str
    debit_amount: float
    credit_amount: float
    description: Optional[str] = None
