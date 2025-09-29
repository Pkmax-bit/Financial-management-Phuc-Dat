"""
Sales by Customer Report Models
Models for generating sales reports grouped by customer
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class CustomerRanking(BaseModel):
    """Individual customer ranking in sales report"""
    customer_id: str
    customer_name: str
    customer_code: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    total_sales: float
    total_invoices: int
    total_sales_receipts: int
    average_order_value: float
    largest_order: float
    smallest_order: float
    first_order_date: Optional[date] = None
    last_order_date: Optional[date] = None
    currency: str = "VND"
    ranking: int  # Position in ranking (1, 2, 3, ...)

class SalesByCustomerReport(BaseModel):
    """Complete Sales by Customer Report"""
    # Report metadata
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: datetime
    
    # Summary statistics
    total_customers: int
    total_sales: float
    average_sales_per_customer: float
    top_customer_percentage: float  # Top customer's share of total sales
    
    # Customer rankings
    customer_rankings: List[CustomerRanking]
    
    # Additional insights
    new_customers: int  # Customers with first order in period
    returning_customers: int  # Customers with multiple orders
    inactive_customers: int  # Customers with no orders in period (if applicable)
    
    # Performance metrics
    total_transactions: int
    total_invoices: int
    total_sales_receipts: int

class SalesByCustomerRequest(BaseModel):
    """Request parameters for Sales by Customer Report"""
    start_date: date
    end_date: date
    limit: Optional[int] = 100  # Limit number of customers returned
    include_inactive: bool = False  # Include customers with no sales
    currency: str = "VND"

class SalesByCustomerSummary(BaseModel):
    """Summary version of Sales by Customer Report for dashboard"""
    period: str
    total_customers: int
    total_sales: float
    top_customer_name: str
    top_customer_sales: float
    top_customer_percentage: float
    average_sales_per_customer: float
    new_customers: int
    currency: str = "VND"

class CustomerSalesTrend(BaseModel):
    """Customer sales trend over time"""
    customer_id: str
    customer_name: str
    monthly_sales: List[Dict[str, Any]]  # [{"month": "2024-01", "sales": 100000}, ...]
    trend_direction: str  # "increasing", "decreasing", "stable"
    growth_rate: float  # Percentage growth from first to last month

class SalesByCustomerAnalysis(BaseModel):
    """Advanced analysis of sales by customer"""
    # Customer segmentation
    vip_customers: List[CustomerRanking]  # Top 10% by sales
    regular_customers: List[CustomerRanking]  # Middle 80%
    small_customers: List[CustomerRanking]  # Bottom 10%
    
    # Market concentration
    concentration_ratio: float  # Top 5 customers' share of total sales
    gini_coefficient: float  # Measure of sales inequality
    
    # Customer lifecycle
    customer_lifecycle_stage: Dict[str, int]  # {"new": 5, "growing": 10, "mature": 15, "declining": 2}
    
    # Geographic distribution (if available)
    geographic_distribution: Optional[Dict[str, float]] = None
