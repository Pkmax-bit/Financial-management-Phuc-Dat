"""
Expenses by Vendor Report Models
Models for generating expense reports grouped by vendor
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class VendorRanking(BaseModel):
    """Individual vendor ranking in expense report"""
    vendor_id: str
    vendor_name: str
    vendor_code: Optional[str] = None
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    vendor_address: Optional[str] = None
    total_expenses: float
    total_bills: int
    total_expense_claims: int
    average_transaction_value: float
    largest_transaction: float
    smallest_transaction: float
    first_transaction_date: Optional[date] = None
    last_transaction_date: Optional[date] = None
    currency: str = "VND"
    ranking: int  # Position in ranking (1, 2, 3, ...)

class ExpensesByVendorReport(BaseModel):
    """Complete Expenses by Vendor Report"""
    # Report metadata
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: datetime
    
    # Summary statistics
    total_vendors: int
    total_expenses: float
    average_expenses_per_vendor: float
    top_vendor_percentage: float  # Top vendor's share of total expenses
    
    # Vendor rankings
    vendor_rankings: List[VendorRanking]
    
    # Additional insights
    new_vendors: int  # Vendors with first transaction in period
    active_vendors: int  # Vendors with multiple transactions
    inactive_vendors: int  # Vendors with no transactions in period (if applicable)
    
    # Performance metrics
    total_transactions: int
    total_bills: int
    total_expense_claims: int

class ExpensesByVendorRequest(BaseModel):
    """Request parameters for Expenses by Vendor Report"""
    start_date: date
    end_date: date
    limit: Optional[int] = 100  # Limit number of vendors returned
    include_inactive: bool = False  # Include vendors with no expenses
    currency: str = "VND"

class ExpensesByVendorSummary(BaseModel):
    """Summary version of Expenses by Vendor Report for dashboard"""
    period: str
    total_vendors: int
    total_expenses: float
    top_vendor_name: str
    top_vendor_expenses: float
    top_vendor_percentage: float
    average_expenses_per_vendor: float
    new_vendors: int
    currency: str = "VND"

class VendorExpenseTrend(BaseModel):
    """Vendor expense trend over time"""
    vendor_id: str
    vendor_name: str
    monthly_expenses: List[Dict[str, Any]]  # [{"month": "2024-01", "expenses": 100000}, ...]
    trend_direction: str  # "increasing", "decreasing", "stable"
    growth_rate: float  # Percentage growth from first to last month

class ExpensesByVendorAnalysis(BaseModel):
    """Advanced analysis of expenses by vendor"""
    # Vendor segmentation
    major_vendors: List[VendorRanking]  # Top 10% by expenses
    regular_vendors: List[VendorRanking]  # Middle 80%
    small_vendors: List[VendorRanking]  # Bottom 10%
    
    # Expense concentration
    concentration_ratio: float  # Top 5 vendors' share of total expenses
    gini_coefficient: float  # Measure of expense inequality
    
    # Vendor lifecycle
    vendor_lifecycle_stage: Dict[str, int]  # {"new": 5, "growing": 10, "mature": 15, "declining": 2}
    
    # Category distribution (if available)
    category_distribution: Optional[Dict[str, float]] = None
    
    # Payment terms analysis
    payment_terms_analysis: Optional[Dict[str, int]] = None

class VendorExpenseCategory(BaseModel):
    """Vendor expense by category"""
    vendor_id: str
    vendor_name: str
    category_expenses: Dict[str, float]  # {"Office Supplies": 100000, "Travel": 50000}
    total_expenses: float
    category_count: int
