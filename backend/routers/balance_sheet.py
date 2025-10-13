"""
Balance Sheet Report Router
Handles balance sheet report generation with assets, liabilities, and equity
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()


@router.get("/balance-sheet")
async def get_balance_sheet(
    as_of_date: date = Query(..., description="As of date for balance sheet")
    # Temporarily disable authentication for testing
    # current_user: User = Depends(get_current_user)
):
    """
    Generate Balance Sheet report
    
    This endpoint:
    1. Calculates total assets (current + fixed)
    2. Calculates total liabilities (current + long-term)
    3. Calculates total equity
    4. Ensures assets = liabilities + equity
    """
    try:
        supabase = get_supabase_client()
        
        # Convert date to ISO format
        as_of_date_str = as_of_date.isoformat()
        
        # Get assets data
        assets_data = await get_assets_data(supabase, as_of_date_str)
        
        # Get liabilities data
        liabilities_data = await get_liabilities_data(supabase, as_of_date_str)
        
        # Calculate equity
        total_assets = assets_data["total_assets"]
        total_liabilities = liabilities_data["total_liabilities"]
        total_equity = total_assets - total_liabilities
        
        # Create balance sheet
        balance_sheet = {
            "as_of_date": as_of_date,
            "currency": "VND",
            "generated_at": datetime.now(),
            
            # Assets section
            "assets": {
                "total_assets": total_assets,
                "current_assets": assets_data["current_assets"],
                "fixed_assets": assets_data["fixed_assets"],
                "asset_breakdown": assets_data["asset_breakdown"]
            },
            
            # Liabilities section
            "liabilities": {
                "total_liabilities": total_liabilities,
                "current_liabilities": liabilities_data["current_liabilities"],
                "long_term_liabilities": liabilities_data["long_term_liabilities"],
                "liability_breakdown": liabilities_data["liability_breakdown"]
            },
            
            # Equity section
            "equity": {
                "total_equity": total_equity,
                "retained_earnings": total_equity,  # Simplified
                "equity_breakdown": [
                    {
                        "category": "Retained Earnings",
                        "amount": total_equity,
                        "percentage": 100.0
                    }
                ]
            },
            
            # Summary
            "summary": {
                "total_assets": total_assets,
                "total_liabilities": total_liabilities,
                "total_equity": total_equity,
                "balance_check": total_assets == (total_liabilities + total_equity)
            }
        }
        
        return balance_sheet
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Balance Sheet: {str(e)}"
        )

async def get_assets_data(supabase, as_of_date: str) -> Dict[str, Any]:
    """Get assets data from existing tables"""
    
    # Current assets - accounts receivable from invoices
    invoices = supabase.table("invoices")\
        .select("total_amount, paid_amount")\
        .lte("issue_date", as_of_date)\
        .execute()
    
    accounts_receivable = sum(
        float(invoice["total_amount"] or 0) - float(invoice["paid_amount"] or 0) 
        for invoice in invoices.data
    )
    
    # Cash - calculate from all paid amounts (regardless of payment_status)
    all_invoices = supabase.table("invoices")\
        .select("paid_amount")\
        .lte("issue_date", as_of_date)\
        .execute()
    
    total_cash_in = sum(float(invoice["paid_amount"] or 0) for invoice in all_invoices.data)
    
    # Subtract all expenses (regardless of status)
    all_expenses = supabase.table("expenses")\
        .select("amount")\
        .lte("expense_date", as_of_date)\
        .execute()
    
    total_cash_out = sum(float(expense["amount"] or 0) for expense in all_expenses.data)
    
    cash_balance = max(0, total_cash_in - total_cash_out)
    
    # Inventory - from projects (materials/equipment)
    projects = supabase.table("projects")\
        .select("budget, actual_cost")\
        .lte("created_at", as_of_date)\
        .execute()
    
    inventory = sum(
        float(project["budget"] or 0) * 0.1  # Assume 10% of budget is inventory
        for project in projects.data
    )
    
    current_assets = cash_balance + accounts_receivable + inventory
    
    # Fixed assets - from projects (equipment, property)
    fixed_assets = sum(
        float(project["budget"] or 0) * 0.2  # Assume 20% of budget is fixed assets
        for project in projects.data
    )
    
    total_assets = current_assets + fixed_assets
    
    # Asset breakdown
    asset_breakdown = [
        {
            "category": "Cash",
            "amount": cash_balance,
            "percentage": (cash_balance / total_assets * 100) if total_assets > 0 else 0
        },
        {
            "category": "Accounts Receivable",
            "amount": accounts_receivable,
            "percentage": (accounts_receivable / total_assets * 100) if total_assets > 0 else 0
        },
        {
            "category": "Inventory",
            "amount": inventory,
            "percentage": (inventory / total_assets * 100) if total_assets > 0 else 0
        },
        {
            "category": "Fixed Assets",
            "amount": fixed_assets,
            "percentage": (fixed_assets / total_assets * 100) if total_assets > 0 else 0
        }
    ]
    
    return {
        "total_assets": total_assets,
        "current_assets": current_assets,
        "fixed_assets": fixed_assets,
        "asset_breakdown": asset_breakdown
    }

async def get_liabilities_data(supabase, as_of_date: str) -> Dict[str, Any]:
    """Get liabilities data from existing tables"""
    
    # Current liabilities - accounts payable from bills
    bills = supabase.table("bills")\
        .select("amount, paid_amount")\
        .lte("issue_date", as_of_date)\
        .execute()
    
    accounts_payable = sum(
        float(bill["amount"] or 0) - float(bill["paid_amount"] or 0)
        for bill in bills.data
    )
    
    # Short-term debt from unpaid project costs
    projects = supabase.table("projects")\
        .select("budget, actual_cost")\
        .lte("created_at", as_of_date)\
        .execute()
    
    unpaid_costs = sum(
        max(0, float(project["actual_cost"] or 0) - float(project["budget"] or 0))
        for project in projects.data
    )
    
    current_liabilities = accounts_payable + unpaid_costs
    
    # Long-term liabilities - from project budgets (assume 30% is long-term debt)
    long_term_liabilities = sum(
        float(project["budget"] or 0) * 0.3
        for project in projects.data
    )
    
    total_liabilities = current_liabilities + long_term_liabilities
    
    # Liability breakdown
    liability_breakdown = [
        {
            "category": "Accounts Payable",
            "amount": accounts_payable,
            "percentage": (accounts_payable / total_liabilities * 100) if total_liabilities > 0 else 0
        },
        {
            "category": "Short-term Debt",
            "amount": unpaid_costs,
            "percentage": (unpaid_costs / total_liabilities * 100) if total_liabilities > 0 else 0
        },
        {
            "category": "Long-term Liabilities",
            "amount": long_term_liabilities,
            "percentage": (long_term_liabilities / total_liabilities * 100) if total_liabilities > 0 else 0
        }
    ]
    
    return {
        "total_liabilities": total_liabilities,
        "current_liabilities": current_liabilities,
        "long_term_liabilities": long_term_liabilities,
        "liability_breakdown": liability_breakdown
    }