"""
Expenses by Vendor Report Router
Handles expense reports grouped by vendor with ranking and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from models.user import User
from models.expenses_vendor import (
    ExpensesByVendorReport,
    ExpensesByVendorRequest,
    ExpensesByVendorSummary,
    VendorRanking,
    ExpensesByVendorAnalysis,
    VendorExpenseTrend,
    VendorExpenseCategory
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/by-vendor", response_model=ExpensesByVendorReport)
async def get_expenses_by_vendor(
    start_date: date = Query(..., description="Start date for expense report"),
    end_date: date = Query(..., description="End date for expense report"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of vendors to return"),
    include_inactive: bool = Query(False, description="Include vendors with no expenses in period"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive Expenses by Vendor report
    
    This endpoint:
    1. Queries Bills and Expenses tables
    2. Groups transactions by vendor
    3. Calculates total expenses, transaction counts, and averages
    4. Ranks vendors by total expenses
    5. Provides vendor insights and analysis
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get vendor expense data
        vendor_expenses = await get_vendor_expense_data(supabase, start_date_str, end_date_str)
        
        # Get vendor information
        vendor_info = await get_vendor_information(supabase, list(vendor_expenses.keys()))
        
        # Create vendor rankings
        vendor_rankings = await create_vendor_rankings(
            vendor_expenses, vendor_info, start_date_str, end_date_str
        )
        
        # Sort by total expenses (descending)
        vendor_rankings.sort(key=lambda x: x.total_expenses, reverse=True)
        
        # Add ranking positions
        for i, vendor in enumerate(vendor_rankings, 1):
            vendor.ranking = i
        
        # Apply limit
        if limit < len(vendor_rankings):
            vendor_rankings = vendor_rankings[:limit]
        
        # Calculate summary statistics
        total_expenses = sum(vendor.total_expenses for vendor in vendor_rankings)
        total_vendors = len(vendor_rankings)
        average_expenses_per_vendor = total_expenses / total_vendors if total_vendors > 0 else 0
        
        # Calculate top vendor percentage
        top_vendor_percentage = 0
        if vendor_rankings and total_expenses > 0:
            top_vendor_percentage = (vendor_rankings[0].total_expenses / total_expenses) * 100
        
        # Calculate additional insights
        new_vendors = await count_new_vendors(supabase, start_date_str, end_date_str)
        active_vendors = len([v for v in vendor_rankings if v.total_bills + v.total_expense_claims > 1])
        
        # Get transaction counts
        total_transactions, total_bills, total_expense_claims = await get_transaction_counts(
            supabase, start_date_str, end_date_str
        )
        
        # Create final report
        report = ExpensesByVendorReport(
            report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now(),
            
            total_vendors=total_vendors,
            total_expenses=total_expenses,
            average_expenses_per_vendor=average_expenses_per_vendor,
            top_vendor_percentage=top_vendor_percentage,
            
            vendor_rankings=vendor_rankings,
            
            new_vendors=new_vendors,
            active_vendors=active_vendors,
            inactive_vendors=0,  # Would need additional logic to calculate
            
            total_transactions=total_transactions,
            total_bills=total_bills,
            total_expense_claims=total_expense_claims
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Expenses by Vendor report: {str(e)}"
        )

@router.get("/by-vendor/summary", response_model=ExpensesByVendorSummary)
async def get_expenses_by_vendor_summary(
    start_date: date = Query(..., description="Start date for expense summary"),
    end_date: date = Query(..., description="End date for expense summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified Expenses by Vendor summary for dashboard"""
    try:
        # Get full report first
        full_report = await get_expenses_by_vendor(start_date, end_date, 10, False, current_user)
        
        # Create summary
        top_vendor_name = ""
        top_vendor_expenses = 0
        if full_report.vendor_rankings:
            top_vendor = full_report.vendor_rankings[0]
            top_vendor_name = top_vendor.vendor_name
            top_vendor_expenses = top_vendor.total_expenses
        
        summary = ExpensesByVendorSummary(
            period=full_report.report_period,
            total_vendors=full_report.total_vendors,
            total_expenses=full_report.total_expenses,
            top_vendor_name=top_vendor_name,
            top_vendor_expenses=top_vendor_expenses,
            top_vendor_percentage=full_report.top_vendor_percentage,
            average_expenses_per_vendor=full_report.average_expenses_per_vendor,
            new_vendors=full_report.new_vendors,
            currency=full_report.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Expenses by Vendor summary: {str(e)}"
        )

@router.get("/by-vendor/analysis", response_model=ExpensesByVendorAnalysis)
async def get_expenses_by_vendor_analysis(
    start_date: date = Query(..., description="Start date for expense analysis"),
    end_date: date = Query(..., description="End date for expense analysis"),
    current_user: User = Depends(get_current_user)
):
    """Get advanced analysis of expenses by vendor"""
    try:
        # Get full report first
        full_report = await get_expenses_by_vendor(start_date, end_date, 1000, False, current_user)
        
        # Vendor segmentation
        total_vendors = len(full_report.vendor_rankings)
        major_count = max(1, int(total_vendors * 0.1))  # Top 10%
        small_count = max(1, int(total_vendors * 0.1))  # Bottom 10%
        
        major_vendors = full_report.vendor_rankings[:major_count]
        small_vendors = full_report.vendor_rankings[-small_count:]
        regular_vendors = full_report.vendor_rankings[major_count:-small_count] if total_vendors > 2 else []
        
        # Expense concentration (Top 5 vendors)
        top_5_expenses = sum(v.total_expenses for v in full_report.vendor_rankings[:5])
        concentration_ratio = (top_5_expenses / full_report.total_expenses * 100) if full_report.total_expenses > 0 else 0
        
        # Simplified Gini coefficient calculation
        gini_coefficient = calculate_gini_coefficient(full_report.vendor_rankings)
        
        # Vendor lifecycle stages (simplified)
        vendor_lifecycle_stage = {
            "new": full_report.new_vendors,
            "growing": len([v for v in full_report.vendor_rankings if 2 <= v.total_bills + v.total_expense_claims <= 5]),
            "mature": len([v for v in full_report.vendor_rankings if v.total_bills + v.total_expense_claims > 5]),
            "declining": 0  # Would need historical data to calculate
        }
        
        analysis = ExpensesByVendorAnalysis(
            major_vendors=major_vendors,
            regular_vendors=regular_vendors,
            small_vendors=small_vendors,
            concentration_ratio=concentration_ratio,
            gini_coefficient=gini_coefficient,
            vendor_lifecycle_stage=vendor_lifecycle_stage
        )
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Expenses by Vendor analysis: {str(e)}"
        )

async def get_vendor_expense_data(supabase, start_date: str, end_date: str) -> Dict[str, Dict[str, Any]]:
    """Get expense data grouped by vendor from Bills and Expenses"""
    vendor_expenses = {}
    
    # Get bill data
    bills = supabase.table("bills")\
        .select("vendor_id, total_amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    for bill in bills.data:
        vendor_id = bill["vendor_id"]
        if vendor_id not in vendor_expenses:
            vendor_expenses[vendor_id] = {
                "total_expenses": 0,
                "bills": [],
                "expense_claims": [],
                "transaction_amounts": []
            }
        
        amount = float(bill["total_amount"] or 0)
        vendor_expenses[vendor_id]["total_expenses"] += amount
        vendor_expenses[vendor_id]["bills"].append({
            "amount": amount,
            "date": bill["issue_date"]
        })
        vendor_expenses[vendor_id]["transaction_amounts"].append(amount)
    
    # Get expense data
    expenses = supabase.table("expenses")\
        .select("vendor_id, amount, expense_date")\
        .gte("expense_date", start_date)\
        .lte("expense_date", end_date)\
        .execute()
    
    for expense in expenses.data:
        vendor_id = expense["vendor_id"]
        if vendor_id not in vendor_expenses:
            vendor_expenses[vendor_id] = {
                "total_expenses": 0,
                "bills": [],
                "expense_claims": [],
                "transaction_amounts": []
            }
        
        amount = float(expense["amount"] or 0)
        vendor_expenses[vendor_id]["total_expenses"] += amount
        vendor_expenses[vendor_id]["expense_claims"].append({
            "amount": amount,
            "date": expense["expense_date"]
        })
        vendor_expenses[vendor_id]["transaction_amounts"].append(amount)
    
    return vendor_expenses

async def get_vendor_information(supabase, vendor_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get vendor information from vendors table"""
    if not vendor_ids:
        return {}
    
    vendors = supabase.table("vendors")\
        .select("id, name, email, phone, address, vendor_code")\
        .in_("id", vendor_ids)\
        .execute()
    
    vendor_info = {}
    for vendor in vendors.data:
        vendor_info[vendor["id"]] = {
            "name": vendor["name"],
            "email": vendor.get("email"),
            "phone": vendor.get("phone"),
            "address": vendor.get("address"),
            "vendor_code": vendor.get("vendor_code")
        }
    
    return vendor_info

async def create_vendor_rankings(
    vendor_expenses: Dict[str, Dict[str, Any]], 
    vendor_info: Dict[str, Dict[str, Any]],
    start_date: str,
    end_date: str
) -> List[VendorRanking]:
    """Create vendor ranking objects from expense data"""
    rankings = []
    
    for vendor_id, expense_data in vendor_expenses.items():
        info = vendor_info.get(vendor_id, {})
        transaction_amounts = expense_data["transaction_amounts"]
        
        # Calculate statistics
        total_bills = len(expense_data["bills"])
        total_expense_claims = len(expense_data["expense_claims"])
        average_transaction_value = expense_data["total_expenses"] / (total_bills + total_expense_claims) if (total_bills + total_expense_claims) > 0 else 0
        largest_transaction = max(transaction_amounts) if transaction_amounts else 0
        smallest_transaction = min(transaction_amounts) if transaction_amounts else 0
        
        # Get first and last transaction dates
        all_dates = []
        for bill in expense_data["bills"]:
            all_dates.append(bill["date"])
        for expense in expense_data["expense_claims"]:
            all_dates.append(expense["date"])
        
        first_transaction_date = min(all_dates) if all_dates else None
        last_transaction_date = max(all_dates) if all_dates else None
        
        # Convert dates
        first_transaction_date_obj = None
        last_transaction_date_obj = None
        if first_transaction_date:
            first_transaction_date_obj = datetime.fromisoformat(first_transaction_date.replace('Z', '+00:00')).date()
        if last_transaction_date:
            last_transaction_date_obj = datetime.fromisoformat(last_transaction_date.replace('Z', '+00:00')).date()
        
        ranking = VendorRanking(
            vendor_id=vendor_id,
            vendor_name=info.get("name", f"Vendor {vendor_id[:8]}"),
            vendor_code=info.get("vendor_code"),
            vendor_email=info.get("email"),
            vendor_phone=info.get("phone"),
            vendor_address=info.get("address"),
            total_expenses=expense_data["total_expenses"],
            total_bills=total_bills,
            total_expense_claims=total_expense_claims,
            average_transaction_value=average_transaction_value,
            largest_transaction=largest_transaction,
            smallest_transaction=smallest_transaction,
            first_transaction_date=first_transaction_date_obj,
            last_transaction_date=last_transaction_date_obj,
            currency="VND",
            ranking=0  # Will be set later
        )
        
        rankings.append(ranking)
    
    return rankings

async def count_new_vendors(supabase, start_date: str, end_date: str) -> int:
    """Count vendors with their first transaction in the period"""
    try:
        # Get all vendors who made their first transaction in this period
        # This is a simplified approach - in reality, you'd need to check against historical data
        
        # Get all bills in period
        bills = supabase.table("bills")\
            .select("vendor_id, issue_date")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        # Get all expenses in period
        expenses = supabase.table("expenses")\
            .select("vendor_id, expense_date")\
            .gte("expense_date", start_date)\
            .lte("expense_date", end_date)\
            .execute()
        
        # Combine and get unique vendors
        vendor_dates = {}
        
        for bill in bills.data:
            vendor_id = bill["vendor_id"]
            date = bill["issue_date"]
            if vendor_id not in vendor_dates or date < vendor_dates[vendor_id]:
                vendor_dates[vendor_id] = date
        
        for expense in expenses.data:
            vendor_id = expense["vendor_id"]
            date = expense["expense_date"]
            if vendor_id not in vendor_dates or date < vendor_dates[vendor_id]:
                vendor_dates[vendor_id] = date
        
        # For simplicity, assume all vendors in this period are "new"
        # In a real implementation, you'd check against historical data
        return len(vendor_dates)
        
    except Exception:
        return 0

async def get_transaction_counts(supabase, start_date: str, end_date: str) -> tuple[int, int, int]:
    """Get total transaction counts for the period"""
    try:
        # Count bills
        bills = supabase.table("bills")\
            .select("id")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        # Count expenses
        expenses = supabase.table("expenses")\
            .select("id")\
            .gte("expense_date", start_date)\
            .lte("expense_date", end_date)\
            .execute()
        
        total_bills = len(bills.data)
        total_expense_claims = len(expenses.data)
        total_transactions = total_bills + total_expense_claims
        
        return total_transactions, total_bills, total_expense_claims
        
    except Exception:
        return 0, 0, 0

def calculate_gini_coefficient(vendor_rankings: List[VendorRanking]) -> float:
    """Calculate Gini coefficient for expense inequality"""
    if not vendor_rankings:
        return 0.0
    
    # Sort by expenses
    sorted_vendors = sorted(vendor_rankings, key=lambda x: x.total_expenses)
    n = len(sorted_vendors)
    
    if n == 0:
        return 0.0
    
    # Calculate Gini coefficient
    total_expenses = sum(vendor.total_expenses for vendor in sorted_vendors)
    if total_expenses == 0:
        return 0.0
    
    # Simplified Gini calculation
    cumsum = 0
    gini = 0
    
    for i, vendor in enumerate(sorted_vendors):
        cumsum += vendor.total_expenses
        gini += (2 * (i + 1) - n - 1) * vendor.total_expenses
    
    gini = gini / (n * total_expenses)
    
    return max(0.0, min(1.0, gini))  # Ensure between 0 and 1
