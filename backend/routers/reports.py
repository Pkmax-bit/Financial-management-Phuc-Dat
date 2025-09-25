"""
Reports & Analytics Router
Handles financial reports, charts, graphs, and analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

class ReportData(BaseModel):
    period: str
    revenue: float
    expenses: float
    profit: float
    profit_margin: float

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]

@router.get("/financial/summary")
async def get_financial_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get financial summary report"""
    try:
        supabase = get_supabase_client()
        
        # Build date filter
        date_filter = ""
        if start_date and end_date:
            date_filter = f"issue_date.gte.{start_date},issue_date.lte.{end_date}"
        elif start_date:
            date_filter = f"issue_date.gte.{start_date}"
        elif end_date:
            date_filter = f"issue_date.lte.{end_date}"
        
        # Get revenue from paid invoices
        invoice_query = supabase.table("invoices").select("total_amount").eq("status", "paid")
        if date_filter:
            invoice_query = invoice_query.filter(date_filter)
        
        invoices = invoice_query.execute()
        total_revenue = sum(invoice["total_amount"] for invoice in invoices.data)
        
        # Get expenses
        expense_query = supabase.table("expenses").select("amount").eq("status", "approved")
        if date_filter:
            expense_query = expense_query.filter(date_filter)
        
        expenses = expense_query.execute()
        total_expenses = sum(expense["amount"] for expense in expenses.data)
        
        # Calculate profit
        profit = total_revenue - total_expenses
        profit_margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            "period": f"{start_date or 'All time'} to {end_date or 'Present'}",
            "revenue": total_revenue,
            "expenses": total_expenses,
            "profit": profit,
            "profit_margin": profit_margin,
            "invoice_count": len(invoices.data),
            "expense_count": len(expenses.data)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate financial summary: {str(e)}"
        )

@router.get("/revenue/monthly")
async def get_monthly_revenue(
    year: int = Query(2024),
    current_user: User = Depends(get_current_user)
):
    """Get monthly revenue data for charts"""
    try:
        supabase = get_supabase_client()
        
        # Get invoices for the year
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
        
        invoices = supabase.table("invoices").select("total_amount,issue_date").eq("status", "paid").gte("issue_date", start_date).lte("issue_date", end_date).execute()
        
        # Group by month
        monthly_revenue = {}
        for i in range(1, 13):
            monthly_revenue[i] = 0
        
        for invoice in invoices.data:
            month = int(invoice["issue_date"][5:7])  # Extract month from YYYY-MM-DD
            monthly_revenue[month] += invoice["total_amount"]
        
        # Format for chart
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        data = [monthly_revenue[i] for i in range(1, 13)]
        
        return {
            "labels": labels,
            "datasets": [{
                "label": "Revenue",
                "data": data,
                "backgroundColor": "rgba(59, 130, 246, 0.5)",
                "borderColor": "rgba(59, 130, 246, 1)",
                "borderWidth": 1
            }]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate monthly revenue data: {str(e)}"
        )

@router.get("/expenses/by-category")
async def get_expenses_by_category(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get expenses grouped by category"""
    try:
        supabase = get_supabase_client()
        
        # Build date filter
        date_filter = ""
        if start_date and end_date:
            date_filter = f"expense_date.gte.{start_date},expense_date.lte.{end_date}"
        elif start_date:
            date_filter = f"expense_date.gte.{start_date}"
        elif end_date:
            date_filter = f"expense_date.lte.{end_date}"
        
        # Get expenses
        expense_query = supabase.table("expenses").select("amount,category").eq("status", "approved")
        if date_filter:
            expense_query = expense_query.filter(date_filter)
        
        expenses = expense_query.execute()
        
        # Group by category
        category_totals = {}
        for expense in expenses.data:
            category = expense["category"]
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += expense["amount"]
        
        # Format for chart
        labels = list(category_totals.keys())
        data = list(category_totals.values())
        
        # Generate colors for each category
        colors = [
            "rgba(239, 68, 68, 0.5)",   # red
            "rgba(245, 158, 11, 0.5)",  # yellow
            "rgba(16, 185, 129, 0.5)",  # green
            "rgba(59, 130, 246, 0.5)",  # blue
            "rgba(139, 92, 246, 0.5)",  # purple
            "rgba(236, 72, 153, 0.5)",  # pink
            "rgba(6, 182, 212, 0.5)",   # cyan
            "rgba(34, 197, 94, 0.5)",   # emerald
        ]
        
        return {
            "labels": labels,
            "datasets": [{
                "label": "Expenses by Category",
                "data": data,
                "backgroundColor": colors[:len(labels)],
                "borderColor": [color.replace("0.5", "1") for color in colors[:len(labels)]],
                "borderWidth": 1
            }]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate expense category data: {str(e)}"
        )

@router.get("/customers/top-revenue")
async def get_top_revenue_customers(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get top customers by revenue"""
    try:
        supabase = get_supabase_client()
        
        # Build date filter
        date_filter = ""
        if start_date and end_date:
            date_filter = f"issue_date.gte.{start_date},issue_date.lte.{end_date}"
        elif start_date:
            date_filter = f"issue_date.gte.{start_date}"
        elif end_date:
            date_filter = f"issue_date.lte.{end_date}"
        
        # Get invoices with customer data
        invoice_query = supabase.table("invoices").select("customer_id,total_amount").eq("status", "paid")
        if date_filter:
            invoice_query = invoice_query.filter(date_filter)
        
        invoices = invoice_query.execute()
        
        # Group by customer
        customer_revenue = {}
        for invoice in invoices.data:
            customer_id = invoice["customer_id"]
            if customer_id not in customer_revenue:
                customer_revenue[customer_id] = 0
            customer_revenue[customer_id] += invoice["total_amount"]
        
        # Get customer details
        customer_ids = list(customer_revenue.keys())
        customers = supabase.table("customers").select("id,name").in_("id", customer_ids).execute()
        
        # Create customer lookup
        customer_lookup = {customer["id"]: customer["name"] for customer in customers.data}
        
        # Sort by revenue and limit
        sorted_customers = sorted(customer_revenue.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        # Format for chart
        labels = [customer_lookup.get(customer_id, f"Customer {customer_id}") for customer_id, _ in sorted_customers]
        data = [revenue for _, revenue in sorted_customers]
        
        return {
            "labels": labels,
            "datasets": [{
                "label": "Revenue by Customer",
                "data": data,
                "backgroundColor": "rgba(16, 185, 129, 0.5)",
                "borderColor": "rgba(16, 185, 129, 1)",
                "borderWidth": 1
            }]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate top customers data: {str(e)}"
        )

@router.get("/projects/profitability")
async def get_project_profitability(
    current_user: User = Depends(get_current_user)
):
    """Get project profitability analysis"""
    try:
        supabase = get_supabase_client()
        
        # Get all projects
        projects = supabase.table("projects").select("id,name,budget,status").execute()
        
        project_data = []
        for project in projects.data:
            project_id = project["id"]
            
            # Get time entries
            time_entries = supabase.table("time_entries").select("hours_worked,hourly_rate").eq("project_id", project_id).execute()
            
            # Calculate labor cost
            labor_cost = 0
            for entry in time_entries.data:
                if entry["hourly_rate"]:
                    labor_cost += entry["hours_worked"] * entry["hourly_rate"]
            
            # Get expenses
            expenses = supabase.table("expenses").select("amount").eq("project_id", project_id).eq("status", "approved").execute()
            expense_total = sum(expense["amount"] for expense in expenses.data)
            
            # Calculate profitability
            budget = project["budget"] or 0
            actual_cost = labor_cost + expense_total
            profit = budget - actual_cost
            profit_margin = (profit / budget * 100) if budget > 0 else 0
            
            project_data.append({
                "name": project["name"],
                "budget": budget,
                "actual_cost": actual_cost,
                "profit": profit,
                "profit_margin": profit_margin,
                "status": project["status"]
            })
        
        # Sort by profit margin
        project_data.sort(key=lambda x: x["profit_margin"], reverse=True)
        
        return {
            "projects": project_data,
            "summary": {
                "total_projects": len(project_data),
                "profitable_projects": len([p for p in project_data if p["profit"] > 0]),
                "total_budget": sum(p["budget"] for p in project_data),
                "total_actual_cost": sum(p["actual_cost"] for p in project_data),
                "total_profit": sum(p["profit"] for p in project_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate project profitability data: {str(e)}"
        )

@router.get("/dashboard/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user)
):
    """Get dashboard overview data"""
    try:
        supabase = get_supabase_client()
        
        # Get current month data
        current_date = datetime.now()
        start_of_month = current_date.replace(day=1).date()
        
        # Revenue this month
        monthly_invoices = supabase.table("invoices").select("total_amount").eq("status", "paid").gte("issue_date", start_of_month.isoformat()).execute()
        monthly_revenue = sum(invoice["total_amount"] for invoice in monthly_invoices.data)
        
        # Expenses this month
        monthly_expenses = supabase.table("expenses").select("amount").eq("status", "approved").gte("expense_date", start_of_month.isoformat()).execute()
        monthly_expense = sum(expense["amount"] for expense in monthly_expenses.data)
        
        # Counts
        total_customers = supabase.table("customers").select("id", count="exact").execute().count or 0
        total_projects = supabase.table("projects").select("id", count="exact").execute().count or 0
        active_projects = supabase.table("projects").select("id", count="exact").eq("status", "active").execute().count or 0
        total_employees = supabase.table("employees").select("id", count="exact").eq("status", "active").execute().count or 0
        
        # Pending invoices
        pending_invoices = supabase.table("invoices").select("total_amount").eq("payment_status", "pending").execute()
        pending_amount = sum(invoice["total_amount"] for invoice in pending_invoices.data)
        
        return {
            "monthly_revenue": monthly_revenue,
            "monthly_expenses": monthly_expense,
            "monthly_profit": monthly_revenue - monthly_expense,
            "total_customers": total_customers,
            "total_projects": total_projects,
            "active_projects": active_projects,
            "total_employees": total_employees,
            "pending_invoices": len(pending_invoices.data),
            "pending_amount": pending_amount
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard overview: {str(e)}"
        )
