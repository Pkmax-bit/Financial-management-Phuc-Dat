"""
P&L (Profit & Loss) Report Router
Handles P&L report generation with revenue, expenses, and net income
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/pl")
async def get_pl_report(
    start_date: date = Query(..., description="Start date for P&L report"),
    end_date: date = Query(..., description="End date for P&L report"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate P&L (Profit & Loss) report
    
    This endpoint:
    1. Calculates total revenue from invoices and sales receipts
    2. Calculates total expenses from bills and expenses
    3. Computes net income (revenue - expenses)
    4. Provides detailed breakdown by category
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get revenue data
        revenue_data = await get_revenue_data(supabase, start_date_str, end_date_str)
        
        # Get expense data
        expense_data = await get_expense_data(supabase, start_date_str, end_date_str)
        
        # Calculate net income
        total_revenue = revenue_data["total_revenue"]
        total_expenses = expense_data["total_expenses"]
        net_income = total_revenue - total_expenses
        
        # Create P&L report
        pl_report = {
            "report_period": f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            "start_date": start_date,
            "end_date": end_date,
            "currency": "VND",
            "generated_at": datetime.now(),
            
            # Revenue section
            "revenue": {
                "total_revenue": total_revenue,
                "invoice_revenue": revenue_data["invoice_revenue"],
                "sales_receipt_revenue": revenue_data["sales_receipt_revenue"],
                "revenue_breakdown": revenue_data["revenue_breakdown"]
            },
            
            # Expense section
            "expenses": {
                "total_expenses": total_expenses,
                "bill_expenses": expense_data["bill_expenses"],
                "direct_expenses": expense_data["direct_expenses"],
                "expense_breakdown": expense_data["expense_breakdown"]
            },
            
            # Net income
            "net_income": net_income,
            "profit_margin": (net_income / total_revenue * 100) if total_revenue > 0 else 0,
            
            # Summary
            "summary": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "net_income": net_income,
                "profit_margin_percentage": (net_income / total_revenue * 100) if total_revenue > 0 else 0
            }
        }
        
        return pl_report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate P&L report: {str(e)}"
        )

async def get_revenue_data(supabase, start_date: str, end_date: str) -> Dict[str, Any]:
    """Get revenue data from invoices and sales receipts"""
    
    # Get invoice revenue
    invoices = supabase.table("invoices")\
        .select("total_amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    invoice_revenue = sum(float(invoice["total_amount"] or 0) for invoice in invoices.data)
    
    # Get sales receipt revenue
    sales_receipts = supabase.table("sales_receipts")\
        .select("total_amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    sales_receipt_revenue = sum(float(receipt["total_amount"] or 0) for receipt in sales_receipts.data)
    
    total_revenue = invoice_revenue + sales_receipt_revenue
    
    # Revenue breakdown
    revenue_breakdown = [
        {
            "category": "Invoice Revenue",
            "amount": invoice_revenue,
            "percentage": (invoice_revenue / total_revenue * 100) if total_revenue > 0 else 0
        },
        {
            "category": "Sales Receipt Revenue", 
            "amount": sales_receipt_revenue,
            "percentage": (sales_receipt_revenue / total_revenue * 100) if total_revenue > 0 else 0
        }
    ]
    
    return {
        "total_revenue": total_revenue,
        "invoice_revenue": invoice_revenue,
        "sales_receipt_revenue": sales_receipt_revenue,
        "revenue_breakdown": revenue_breakdown
    }

async def get_expense_data(supabase, start_date: str, end_date: str) -> Dict[str, Any]:
    """Get expense data from bills and expenses"""
    
    # Get bill expenses
    bills = supabase.table("bills")\
        .select("amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    bill_expenses = sum(float(bill["amount"] or 0) for bill in bills.data)
    
    # Get direct expenses
    expenses = supabase.table("expenses")\
        .select("amount, expense_date")\
        .gte("expense_date", start_date)\
        .lte("expense_date", end_date)\
        .execute()
    
    direct_expenses = sum(float(expense["amount"] or 0) for expense in expenses.data)
    
    total_expenses = bill_expenses + direct_expenses
    
    # Expense breakdown
    expense_breakdown = [
        {
            "category": "Bill Expenses",
            "amount": bill_expenses,
            "percentage": (bill_expenses / total_expenses * 100) if total_expenses > 0 else 0
        },
        {
            "category": "Direct Expenses",
            "amount": direct_expenses,
            "percentage": (direct_expenses / total_expenses * 100) if total_expenses > 0 else 0
        }
    ]
    
    return {
        "total_expenses": total_expenses,
        "bill_expenses": bill_expenses,
        "direct_expenses": direct_expenses,
        "expense_breakdown": expense_breakdown
    }



