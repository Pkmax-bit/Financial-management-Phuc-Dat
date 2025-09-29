"""
General Ledger Report Models
Models for generating chronological transaction records from JournalEntries
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum
from decimal import Decimal

class JournalEntry(BaseModel):
    """Individual journal entry in the general ledger"""
    id: str
    transaction_id: str
    transaction_type: str
    date: date
    account_id: str
    account_code: str
    account_name: str
    account_type: str
    description: str
    reference_number: Optional[str] = None
    debit_amount: float
    credit_amount: float
    currency: str = "VND"
    created_at: datetime
    created_by: Optional[str] = None

class GeneralLedgerEntry(BaseModel):
    """General Ledger entry with running balance"""
    journal_entry: JournalEntry
    running_balance: float  # Cumulative balance after this entry
    balance_type: str  # "Debit" or "Credit"

class GeneralLedgerReport(BaseModel):
    """Complete General Ledger Report"""
    # Report metadata
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: datetime
    
    # Summary statistics
    total_entries: int
    total_debits: float
    total_credits: float
    balance_check: bool  # Whether debits = credits
    
    # Ledger entries
    ledger_entries: List[GeneralLedgerEntry]
    
    # Account summary
    account_summary: List[Dict[str, Any]]  # Summary by account

class GeneralLedgerRequest(BaseModel):
    """Request parameters for General Ledger Report"""
    start_date: date
    end_date: date
    account_id: Optional[str] = None  # Filter by specific account
    transaction_type: Optional[str] = None  # Filter by transaction type
    include_running_balance: bool = True
    currency: str = "VND"

class GeneralLedgerSummary(BaseModel):
    """Summary version of General Ledger Report for dashboard"""
    period: str
    total_entries: int
    total_debits: float
    total_credits: float
    balance_check: bool
    unique_accounts: int
    unique_transactions: int
    currency: str = "VND"

class AccountBalance(BaseModel):
    """Account balance information"""
    account_id: str
    account_code: str
    account_name: str
    account_type: str
    beginning_balance: float
    total_debits: float
    total_credits: float
    ending_balance: float
    balance_type: str  # "Debit" or "Credit"
    transaction_count: int

class GeneralLedgerAnalysis(BaseModel):
    """Advanced analysis of General Ledger"""
    # Account analysis
    account_balances: List[AccountBalance]
    
    # Transaction analysis
    transaction_type_summary: Dict[str, int]  # Count by transaction type
    daily_activity: List[Dict[str, Any]]  # Daily transaction counts
    
    # Balance analysis
    total_debits: float
    total_credits: float
    balance_difference: float
    is_balanced: bool
    
    # Top accounts by activity
    most_active_accounts: List[Dict[str, Any]]
    largest_transactions: List[Dict[str, Any]]

class GeneralLedgerExport(BaseModel):
    """Export format for General Ledger"""
    report_info: Dict[str, Any]
    entries: List[Dict[str, Any]]
    summary: Dict[str, Any]
    export_format: str  # "excel", "pdf", "csv"
    generated_at: datetime
