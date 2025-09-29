"""
Profit and Loss (P&L) Report Models
Models for generating comprehensive P&L statements
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
from enum import Enum

class AccountType(str, Enum):
    """Account types for P&L classification"""
    REVENUE = "revenue"
    COGS = "cogs"  # Cost of Goods Sold
    OPERATING_EXPENSE = "operating_expense"
    OTHER_INCOME = "other_income"
    OTHER_EXPENSE = "other_expense"

class PLAccount(BaseModel):
    """Individual account in P&L statement"""
    account_code: str
    account_name: str
    account_type: AccountType
    amount: float
    percentage: Optional[float] = None  # Percentage of total revenue

class PLSection(BaseModel):
    """Section of P&L statement (e.g., Revenue, COGS, Operating Expenses)"""
    section_name: str
    accounts: List[PLAccount]
    total_amount: float
    percentage: Optional[float] = None

class ProfitLossReport(BaseModel):
    """Complete Profit and Loss statement"""
    # Report metadata
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: str
    
    # Revenue section
    total_revenue: float
    revenue_section: PLSection
    
    # Cost of Goods Sold
    total_cogs: float
    cogs_section: PLSection
    
    # Gross Profit
    gross_profit: float
    gross_profit_margin: float  # Percentage
    
    # Operating Expenses
    total_operating_expenses: float
    operating_expenses_section: PLSection
    
    # Operating Income
    operating_income: float
    operating_income_margin: float  # Percentage
    
    # Other Income/Expenses
    other_income: float
    other_expenses: float
    
    # Net Income
    net_income: float
    net_income_margin: float  # Percentage
    
    # Summary statistics
    total_transactions: int
    total_journal_entries: int

class PLReportRequest(BaseModel):
    """Request parameters for P&L report"""
    start_date: date
    end_date: date
    include_details: bool = True
    currency: str = "VND"

class PLReportSummary(BaseModel):
    """Summary version of P&L report for dashboard"""
    period: str
    total_revenue: float
    total_expenses: float
    net_income: float
    gross_profit_margin: float
    net_income_margin: float
    currency: str = "VND"
