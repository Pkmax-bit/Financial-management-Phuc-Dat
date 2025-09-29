"""
Balance Sheet Report Models
Models for generating comprehensive Balance Sheet statements
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
from enum import Enum

class AccountCategory(str, Enum):
    """Account categories for Balance Sheet classification"""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"

class AssetType(str, Enum):
    """Asset subcategories"""
    CURRENT_ASSET = "current_asset"
    FIXED_ASSET = "fixed_asset"
    INTANGIBLE_ASSET = "intangible_asset"
    OTHER_ASSET = "other_asset"

class LiabilityType(str, Enum):
    """Liability subcategories"""
    CURRENT_LIABILITY = "current_liability"
    LONG_TERM_LIABILITY = "long_term_liability"
    OTHER_LIABILITY = "other_liability"

class EquityType(str, Enum):
    """Equity subcategories"""
    OWNER_EQUITY = "owner_equity"
    RETAINED_EARNINGS = "retained_earnings"
    OTHER_EQUITY = "other_equity"

class BalanceSheetAccount(BaseModel):
    """Individual account in Balance Sheet"""
    account_code: str
    account_name: str
    account_category: AccountCategory
    subcategory: Optional[str] = None
    balance: float
    is_debit_balance: bool = True  # True for assets, False for liabilities/equity

class BalanceSheetSection(BaseModel):
    """Section of Balance Sheet (e.g., Current Assets, Liabilities)"""
    section_name: str
    section_type: str  # asset, liability, equity
    accounts: List[BalanceSheetAccount]
    total_amount: float
    percentage: Optional[float] = None

class BalanceSheetReport(BaseModel):
    """Complete Balance Sheet statement"""
    # Report metadata
    report_date: str
    as_of_date: date
    currency: str = "VND"
    generated_at: str
    
    # Assets section
    total_assets: float
    current_assets: BalanceSheetSection
    fixed_assets: BalanceSheetSection
    other_assets: Optional[BalanceSheetSection] = None
    
    # Liabilities section
    total_liabilities: float
    current_liabilities: BalanceSheetSection
    long_term_liabilities: BalanceSheetSection
    other_liabilities: Optional[BalanceSheetSection] = None
    
    # Equity section
    total_equity: float
    owner_equity: BalanceSheetSection
    retained_earnings: Optional[BalanceSheetSection] = None
    
    # Balance validation
    total_liabilities_and_equity: float
    is_balanced: bool  # Should always be True for valid balance sheet
    
    # Summary statistics
    total_accounts: int
    total_journal_entries: int
    total_transactions: int

class BalanceSheetRequest(BaseModel):
    """Request parameters for Balance Sheet report"""
    as_of_date: date
    include_details: bool = True
    currency: str = "VND"

class BalanceSheetSummary(BaseModel):
    """Summary version of Balance Sheet for dashboard"""
    as_of_date: str
    total_assets: float
    total_liabilities: float
    total_equity: float
    is_balanced: bool
    current_ratio: Optional[float] = None  # Current Assets / Current Liabilities
    debt_to_equity_ratio: Optional[float] = None  # Total Liabilities / Total Equity
    currency: str = "VND"
