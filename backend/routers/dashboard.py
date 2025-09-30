"""
Dashboard API endpoints
Provides comprehensive dashboard statistics and overview data
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, List, Any
from datetime import datetime, timedelta
from services.supabase_client import get_supabase_client
from models.user import User
from utils.auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics
    
    Returns:
        Dict containing financial overview, counts, and breakdown data
    """
    try:
        supabase = get_supabase_client()
        
        # Date ranges
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        start_of_month = now.replace(day=1)
        
        # Financial Overview - Last 30 Days
        # Revenue (Paid invoices) - Use issue_date since paid_date is often null
        paid_invoices = supabase.table("invoices")\
            .select("total_amount")\
            .eq("payment_status", "paid")\
            .gte("issue_date", thirty_days_ago.isoformat())\
            .execute()
        total_revenue = sum(invoice["total_amount"] for invoice in paid_invoices.data)
        
        # Expenses (Approved expenses)
        approved_expenses = supabase.table("expenses")\
            .select("amount")\
            .eq("status", "approved")\
            .gte("expense_date", thirty_days_ago.isoformat())\
            .execute()
        total_expenses = sum(expense["amount"] for expense in approved_expenses.data)
        
        # Profit/Loss calculation
        profit_loss = total_revenue - total_expenses
        
        # Cash Balance (sum of all bank accounts)
        # For now, we'll calculate from paid invoices minus expenses
        # In a real system, this would come from bank account integrations
        cash_balance = total_revenue - total_expenses
        
        # Invoice Counts
        open_invoices = supabase.table("invoices")\
            .select("id", count="exact")\
            .neq("payment_status", "paid")\
            .execute()
        open_count = open_invoices.count or 0
        
        overdue_invoices = supabase.table("invoices")\
            .select("id", count="exact")\
            .eq("payment_status", "overdue")\
            .execute()
        overdue_count = overdue_invoices.count or 0
        
        # Bills Count
        pending_bills = supabase.table("bills")\
            .select("id", count="exact")\
            .eq("status", "pending")\
            .execute()
        pending_bills_count = pending_bills.count or 0
        
        # Paid amount in last 30 days
        paid_last_30 = total_revenue
        
        # Expenses by Category
        expense_categories = supabase.table("expenses")\
            .select("category, amount")\
            .eq("status", "approved")\
            .gte("expense_date", thirty_days_ago.isoformat())\
            .execute()
        
        # Group expenses by category
        category_totals = {}
        colors = [
            "#3B82F6", "#EF4444", "#F59E0B", "#10B981", 
            "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"
        ]
        
        for expense in expense_categories.data:
            category = expense["category"] or "Other"
            amount = expense["amount"] or 0
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += amount
        
        expenses_by_category = []
        for i, (category, amount) in enumerate(category_totals.items()):
            expenses_by_category.append({
                "category": category,
                "amount": amount,
                "color": colors[i % len(colors)]
            })
        
        # Monthly Revenue Data (last 12 months)
        monthly_revenue_data = []
        for i in range(12):
            month_start = (now - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            # Revenue for this month
            month_revenue = supabase.table("invoices")\
                .select("total_amount")\
                .eq("payment_status", "paid")\
                .gte("paid_date", month_start.isoformat())\
                .lte("paid_date", month_end.isoformat())\
                .execute()
            
            # Expenses for this month
            month_expenses = supabase.table("expenses")\
                .select("amount")\
                .eq("status", "approved")\
                .gte("expense_date", month_start.isoformat())\
                .lte("expense_date", month_end.isoformat())\
                .execute()
            
            revenue = sum(inv["total_amount"] for inv in month_revenue.data)
            expenses = sum(exp["amount"] for exp in month_expenses.data)
            
            monthly_revenue_data.append({
                "month": month_start.strftime("%b"),
                "revenue": revenue,
                "expenses": expenses
            })
        
        # Reverse to get chronological order
        monthly_revenue_data.reverse()
        
        # Top Customers (last 30 days)
        top_customers = supabase.table("invoices")\
            .select("customer_id, total_amount, customers(name)")\
            .eq("payment_status", "paid")\
            .gte("paid_date", thirty_days_ago.isoformat())\
            .execute()
        
        # Group by customer and sum revenue
        customer_totals = {}
        for invoice in top_customers.data:
            customer_id = invoice["customer_id"]
            customer_name = invoice.get("customers", {}).get("name", f"Customer {customer_id}")
            amount = invoice["total_amount"]
            
            if customer_id not in customer_totals:
                customer_totals[customer_id] = {"name": customer_name, "revenue": 0}
            customer_totals[customer_id]["revenue"] += amount
        
        # Sort and get top 5
        top_customers_list = sorted(
            customer_totals.values(), 
            key=lambda x: x["revenue"], 
            reverse=True
        )[:5]
        
        # Recent Transactions (placeholder)
        recent_transactions = []
        
        # Bank Accounts (placeholder - in real system would integrate with banks)
        bank_accounts = [
            {
                "name": "Tài khoản chính",
                "balance": cash_balance,
                "type": "Tài khoản thanh toán"
            }
        ]
        
        # If we have actual bank account data in the system
        try:
            actual_accounts = supabase.table("bank_accounts").select("*").execute()
            if actual_accounts.data:
                bank_accounts = []
                for account in actual_accounts.data:
                    bank_accounts.append({
                        "name": account.get("account_name", "Unknown Account"),
                        "balance": account.get("balance", 0),
                        "type": account.get("account_type", "Banking Account")
                    })
        except Exception as e:
            # If bank_accounts table doesn't exist, use placeholder
            print(f"Bank accounts not available: {e}")
            pass
        
        return {
            "totalRevenue": total_revenue,
            "totalExpenses": total_expenses,
            "profitLoss": profit_loss,
            "cashBalance": cash_balance,
            "openInvoices": open_count,
            "overdueInvoices": overdue_count,
            "paidLast30Days": paid_last_30,
            "pendingBills": pending_bills_count,
            "expensesByCategory": expenses_by_category,
            "monthlyRevenueData": monthly_revenue_data,
            "topCustomers": top_customers_list,
            "recentTransactions": recent_transactions,
            "bankAccounts": bank_accounts
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )

@router.get("/cashflow/projection")
async def get_cashflow_projection(
    months: int = 6,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get cash flow projection for specified number of months
    
    Args:
        months: Number of months to project (default: 6)
        
    Returns:
        Dict containing projected cash flow data
    """
    try:
        supabase = get_supabase_client()
        
        # Get historical data for the last 12 months to calculate trends
        now = datetime.now()
        twelve_months_ago = now - timedelta(days=365)
        
        # Calculate 3-month average once outside the loop
        last_three_months = now - timedelta(days=90)
        
        avg_revenue = supabase.table("invoices")\
            .select("total_amount")\
            .eq("payment_status", "paid")\
            .gte("payment_date", last_three_months.isoformat())\
            .execute()
        
        avg_expenses = supabase.table("expenses")\
            .select("amount")\
            .eq("status", "approved")\
            .gte("expense_date", last_three_months.isoformat())\
            .execute()
        
        monthly_revenue_avg = sum(inv["total_amount"] for inv in avg_revenue.data) / 3
        monthly_expense_avg = sum(exp["amount"] for exp in avg_expenses.data) / 3
        
        # Generate projections using pre-calculated averages
        monthly_data = []
        for i in range(months):
            future_month = now + timedelta(days=30 * i)
            
            monthly_data.append({
                "month": future_month.strftime("%Y-%m"),
                "projectedRevenue": monthly_revenue_avg,
                "projectedExpenses": monthly_expense_avg,
                "projectedCashFlow": monthly_revenue_avg - monthly_expense_avg
            })
        
        return {
            "projections": monthly_data,
            "confidence": "medium",  # Based on historical data availability
            "basedOn": "3-month historical average"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cash flow projection: {str(e)}"
        )

@router.get("/planner/events")
async def get_planner_events(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get upcoming financial events and deadlines
    
    Returns:
        List of upcoming events, bills, invoice due dates, etc.
    """
    try:
        supabase = get_supabase_client()
        
        now = datetime.now()
        next_month = now + timedelta(days=30)
        
        events = []
        
        # Upcoming invoice due dates
        upcoming_invoices = supabase.table("invoices")\
            .select("*")\
            .neq("payment_status", "paid")\
            .lte("due_date", next_month.isoformat())\
            .gte("due_date", now.isoformat())\
            .execute()
        
        for invoice in upcoming_invoices.data:
            events.append({
                "id": f"invoice_{invoice['id']}",
                "title": f"Invoice #{invoice['invoice_number']} Due",
                "date": invoice["due_date"],
                "type": "invoice",
                "amount": invoice["total_amount"],
                "status": "pending"
            })
        
        # Upcoming bill payments
        upcoming_bills = supabase.table("bills")\
            .select("*")\
            .eq("status", "pending")\
            .lte("due_date", next_month.isoformat())\
            .gte("due_date", now.isoformat())\
            .execute()
        
        for bill in upcoming_bills.data:
            events.append({
                "id": f"bill_{bill['id']}",
                "title": f"Bill Payment - {bill['vendor_name']}",
                "date": bill["due_date"],
                "type": "bill",
                "amount": bill["amount"],
                "status": "pending"
            })
        
        # Sort events by date
        events.sort(key=lambda x: x["date"])
        
        return events
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch planner events: {str(e)}"
        )

@router.post("/planner/scenario")
async def calculate_what_if_scenario(
    scenario_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Calculate what-if scenarios for financial planning
    
    Args:
        scenario_data: Dict containing scenario parameters
        
    Returns:
        Dict containing scenario analysis results
    """
    try:
        # Extract scenario parameters
        revenue_change = scenario_data.get("revenue_change", 0)  # Percentage change
        expense_change = scenario_data.get("expense_change", 0)  # Percentage change
        new_expense = scenario_data.get("new_expense", 0)  # New monthly expense
        months = scenario_data.get("months", 6)  # Analysis period
        
        # Get current baseline (reuse data from dashboard stats if available)
        supabase = get_supabase_client()
        now = datetime.now()
        last_month = now - timedelta(days=30)
        
        # Use single query to get both revenue and expenses
        baseline_data = supabase.table("invoices")\
            .select("total_amount")\
            .eq("payment_status", "paid")\
            .gte("payment_date", last_month.isoformat())\
            .execute()
        
        baseline_expenses_data = supabase.table("expenses")\
            .select("amount")\
            .eq("status", "approved")\
            .gte("expense_date", last_month.isoformat())\
            .execute()
        
        baseline_revenue = sum(inv["total_amount"] for inv in baseline_data.data)
        baseline_expenses = sum(exp["amount"] for exp in baseline_expenses_data.data)
        
        # Calculate scenario projections
        projected_revenue = baseline_revenue * (1 + revenue_change / 100)
        projected_expenses = (baseline_expenses * (1 + expense_change / 100)) + new_expense
        
        projections = []
        cumulative_change = 0
        
        for month in range(months):
            monthly_change = projected_revenue - projected_expenses - (baseline_revenue - baseline_expenses)
            cumulative_change += monthly_change
            
            projections.append({
                "month": month + 1,
                "revenue": projected_revenue,
                "expenses": projected_expenses,
                "net_change": monthly_change,
                "cumulative_impact": cumulative_change
            })
        
        return {
            "scenario": {
                "revenue_change": revenue_change,
                "expense_change": expense_change,
                "new_expense": new_expense
            },
            "baseline": {
                "revenue": baseline_revenue,
                "expenses": baseline_expenses,
                "net": baseline_revenue - baseline_expenses
            },
            "projected": {
                "revenue": projected_revenue,
                "expenses": projected_expenses,
                "net": projected_revenue - projected_expenses
            },
            "projections": projections,
            "total_impact": cumulative_change
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate scenario: {str(e)}"
        )