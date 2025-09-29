"""
Cash Flow Statement Models
Models for generating comprehensive Cash Flow statements
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class CashFlowCategory(str, Enum):
    """Cash flow categories"""
    OPERATING = "operating"
    INVESTING = "investing"
    FINANCING = "financing"

class CashFlowItem(BaseModel):
    """Individual cash flow item"""
    item_name: str
    item_code: Optional[str] = None
    amount: float
    is_inflow: bool = True  # True for cash inflow, False for outflow
    description: Optional[str] = None
    account_codes: List[str] = []  # Related account codes

class CashFlowSection(BaseModel):
    """Section of Cash Flow Statement (Operating, Investing, Financing)"""
    section_name: str
    section_type: CashFlowCategory
    items: List[CashFlowItem]
    subtotal: float
    net_cash_flow: float  # Net cash flow for this section

class CashFlowStatement(BaseModel):
    """Complete Cash Flow Statement"""
    # Report metadata
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: datetime
    
    # Starting and ending cash balances
    beginning_cash: float
    ending_cash: float
    net_change_in_cash: float
    
    # Net Income from P&L
    net_income: float
    
    # Cash Flow Sections
    operating_activities: CashFlowSection
    investing_activities: CashFlowSection
    financing_activities: CashFlowSection
    
    # Summary
    total_operating_cash_flow: float
    total_investing_cash_flow: float
    total_financing_cash_flow: float
    net_cash_flow: float  # Total net cash flow
    
    # Validation
    cash_flow_validation: bool  # Should equal net_change_in_cash
    
    # Additional information
    total_transactions: int
    total_journal_entries: int

class CashFlowRequest(BaseModel):
    """Request parameters for Cash Flow Statement"""
    start_date: date
    end_date: date
    include_details: bool = True
    currency: str = "VND"

class CashFlowSummary(BaseModel):
    """Summary version of Cash Flow Statement for dashboard"""
    period: str
    net_income: float
    operating_cash_flow: float
    investing_cash_flow: float
    financing_cash_flow: float
    net_cash_flow: float
    beginning_cash: float
    ending_cash: float
    currency: str = "VND"

class CashFlowAnalysis(BaseModel):
    """Cash Flow Analysis and Ratios"""
    operating_cash_flow_margin: float  # Operating CF / Revenue
    free_cash_flow: float  # Operating CF - Capital Expenditures
    cash_conversion_cycle: Optional[float] = None  # Days
    cash_flow_coverage_ratio: Optional[float] = None  # Operating CF / Total Debt
