"""
Bank Account model definitions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BankAccount(BaseModel):
    """Bank Account model"""
    id: str
    account_name: str
    account_number: Optional[str] = None
    bank_name: str
    account_type: str = "checking"  # checking, savings, business
    balance: float = 0.0
    currency: str = "VND"
    is_primary: bool = False
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class BankAccountCreate(BaseModel):
    """Bank Account creation model"""
    account_name: str
    account_number: Optional[str] = None
    bank_name: str
    account_type: str = "checking"
    balance: float = 0.0
    currency: str = "VND"
    is_primary: bool = False

class BankAccountUpdate(BaseModel):
    """Bank Account update model"""
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
