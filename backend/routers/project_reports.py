"""
Project Reports Router
Handles project profitability comparison and financial reporting
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

class ProjectProfitabilityReport(BaseModel):
    """Project profitability report model"""
    project_id: str
    project_code: str
    project_name: str
    customer_name: str
    status: str
    start_date: date
    end_date: Optional[date]
    budget: Optional[float]
    progress: float
    
    # Financial metrics
    total_income: float
    total_costs: float
    profit: float
    profit_margin: float
    
    # Income breakdown
    invoice_amount: float
    sales_receipt_amount: float
    
    # Cost breakdown
    labor_cost: float
    expenses_cost: float
    bills_cost: float
    total_hours: float

@router.get("/projects/profitability", response_model=List[ProjectProfitabilityReport])
async def get_projects_profitability_report(
    status: Optional[str] = Query(None, description="Filter by project status"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    start_date: Optional[date] = Query(None, description="Filter projects started after this date"),
    end_date: Optional[date] = Query(None, description="Filter projects started before this date"),
    sort_by: str = Query("profit", description="Sort by: profit, profit_margin, income, costs, project_name"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive profitability comparison report for all projects"""
    try:
        supabase = get_supabase_client()
        
        # Build project filters
        project_query = supabase.table("projects").select("*")
        
        if status:
            project_query = project_query.eq("status", status)
        
        if customer_id:
            project_query = project_query.eq("customer_id", customer_id)
        
        if start_date:
            project_query = project_query.gte("start_date", start_date.isoformat())
        
        if end_date:
            project_query = project_query.lte("start_date", end_date.isoformat())
        
        # Get all projects
        projects_result = project_query.execute()
        projects = projects_result.data
        
        if not projects:
            return []
        
        project_ids = [project["id"] for project in projects]
        
        # Get all related financial data
        invoices = supabase.table("invoices").select("project_id, total_amount, paid_amount").in_("project_id", project_ids).execute()
        sales_receipts = supabase.table("sales_receipts").select("project_id, total_amount").in_("project_id", project_ids).execute()
        time_entries = supabase.table("time_entries").select("project_id, hours_worked, hourly_rate").in_("project_id", project_ids).execute()
        expenses = supabase.table("expenses").select("project_id, amount").in_("project_id", project_ids).execute()
        bills = supabase.table("bills").select("project_id, amount, paid_amount").in_("project_id", project_ids).execute()
        
        # Get customer information
        customer_ids = list(set(project["customer_id"] for project in projects if project["customer_id"]))
        customers = {}
        if customer_ids:
            customers_result = supabase.table("customers").select("id, name").in_("id", customer_ids).execute()
            customers = {customer["id"]: customer["name"] for customer in customers_result.data}
        
        # Pre-process financial data for efficiency
        invoices_by_project = {}
        sales_receipts_by_project = {}
        time_entries_by_project = {}
        expenses_by_project = {}
        bills_by_project = {}
        
        for invoice in invoices.data:
            project_id = invoice["project_id"]
            if project_id not in invoices_by_project:
                invoices_by_project[project_id] = []
            invoices_by_project[project_id].append(invoice)
        
        for receipt in sales_receipts.data:
            project_id = receipt["project_id"]
            if project_id not in sales_receipts_by_project:
                sales_receipts_by_project[project_id] = []
            sales_receipts_by_project[project_id].append(receipt)
        
        for entry in time_entries.data:
            project_id = entry["project_id"]
            if project_id not in time_entries_by_project:
                time_entries_by_project[project_id] = []
            time_entries_by_project[project_id].append(entry)
        
        for expense in expenses.data:
            project_id = expense["project_id"]
            if project_id not in expenses_by_project:
                expenses_by_project[project_id] = []
            expenses_by_project[project_id].append(expense)
        
        for bill in bills.data:
            project_id = bill["project_id"]
            if project_id not in bills_by_project:
                bills_by_project[project_id] = []
            bills_by_project[project_id].append(bill)
        
        # Process each project
        project_reports = []
        
        for project in projects:
            project_id = project["id"]
            
            # Calculate income
            project_invoices = invoices_by_project.get(project_id, [])
            project_sales_receipts = sales_receipts_by_project.get(project_id, [])
            
            invoice_amount = sum(inv["total_amount"] for inv in project_invoices)
            sales_receipt_amount = sum(sr["total_amount"] for sr in project_sales_receipts)
            total_income = invoice_amount + sales_receipt_amount
            
            # Calculate costs
            project_time_entries = time_entries_by_project.get(project_id, [])
            project_expenses = expenses_by_project.get(project_id, [])
            project_bills = bills_by_project.get(project_id, [])
            
            # Labor costs
            total_hours = sum(te["hours_worked"] for te in project_time_entries)
            labor_cost = sum(te["hours_worked"] * te["hourly_rate"] for te in project_time_entries if te["hourly_rate"])
            
            # Other costs
            expenses_cost = sum(exp["amount"] for exp in project_expenses)
            bills_cost = sum(bill["amount"] for bill in project_bills)
            
            total_costs = labor_cost + expenses_cost + bills_cost
            
            # Calculate profit
            profit = total_income - total_costs
            profit_margin = (profit / total_income * 100) if total_income > 0 else 0
            
            # Get customer name
            customer_name = customers.get(project["customer_id"], "Unknown Customer")
            
            project_report = ProjectProfitabilityReport(
                project_id=project_id,
                project_code=project["project_code"],
                project_name=project["name"],
                customer_name=customer_name,
                status=project["status"],
                start_date=project["start_date"],
                end_date=project["end_date"],
                budget=project["budget"],
                progress=project["progress"],
                
                # Financial metrics
                total_income=total_income,
                total_costs=total_costs,
                profit=profit,
                profit_margin=round(profit_margin, 2),
                
                # Income breakdown
                invoice_amount=invoice_amount,
                sales_receipt_amount=sales_receipt_amount,
                
                # Cost breakdown
                labor_cost=labor_cost,
                expenses_cost=expenses_cost,
                bills_cost=bills_cost,
                total_hours=total_hours
            )
            
            project_reports.append(project_report)
        
        # Sort projects
        reverse_order = sort_order.lower() == "desc"
        if sort_by == "profit":
            project_reports.sort(key=lambda x: x.profit, reverse=reverse_order)
        elif sort_by == "profit_margin":
            project_reports.sort(key=lambda x: x.profit_margin, reverse=reverse_order)
        elif sort_by == "income":
            project_reports.sort(key=lambda x: x.total_income, reverse=reverse_order)
        elif sort_by == "costs":
            project_reports.sort(key=lambda x: x.total_costs, reverse=reverse_order)
        elif sort_by == "project_name":
            project_reports.sort(key=lambda x: x.project_name, reverse=reverse_order)
        
        return project_reports
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate projects profitability report: {str(e)}"
        )

@router.get("/projects/profitability/summary")
async def get_projects_profitability_summary(
    status: Optional[str] = Query(None, description="Filter by project status"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    start_date: Optional[date] = Query(None, description="Filter projects started after this date"),
    end_date: Optional[date] = Query(None, description="Filter projects started before this date"),
    current_user: User = Depends(get_current_user)
):
    """Get summary statistics for projects profitability report"""
    try:
        supabase = get_supabase_client()
        
        # Build project filters
        project_query = supabase.table("projects").select("*")
        
        if status:
            project_query = project_query.eq("status", status)
        
        if customer_id:
            project_query = project_query.eq("customer_id", customer_id)
        
        if start_date:
            project_query = project_query.gte("start_date", start_date.isoformat())
        
        if end_date:
            project_query = project_query.lte("start_date", end_date.isoformat())
        
        # Get all projects
        projects_result = project_query.execute()
        projects = projects_result.data
        
        if not projects:
            return {
                "total_projects": 0,
                "total_income": 0,
                "total_costs": 0,
                "total_profit": 0,
                "average_profit_margin": 0,
                "profitable_projects": 0,
                "loss_projects": 0
            }
        
        project_ids = [project["id"] for project in projects]
        
        # Get all related financial data
        invoices = supabase.table("invoices").select("total_amount").in_("project_id", project_ids).execute()
        sales_receipts = supabase.table("sales_receipts").select("total_amount").in_("project_id", project_ids).execute()
        time_entries = supabase.table("time_entries").select("hours_worked, hourly_rate").in_("project_id", project_ids).execute()
        expenses = supabase.table("expenses").select("amount").in_("project_id", project_ids).execute()
        bills = supabase.table("bills").select("amount").in_("project_id", project_ids).execute()
        
        # Calculate totals
        total_income = sum(inv["total_amount"] for inv in invoices.data) + sum(sr["total_amount"] for sr in sales_receipts.data)
        
        total_labor_cost = sum(te["hours_worked"] * te["hourly_rate"] for te in time_entries.data if te["hourly_rate"])
        total_expenses = sum(exp["amount"] for exp in expenses.data)
        total_bills = sum(bill["amount"] for bill in bills.data)
        total_costs = total_labor_cost + total_expenses + total_bills
        
        total_profit = total_income - total_costs
        average_profit_margin = (total_profit / total_income * 100) if total_income > 0 else 0
        
        # Count profitable vs loss projects
        profitable_projects = 0
        loss_projects = 0
        
        for project in projects:
            project_id = project["id"]
            
            # Calculate project-specific metrics
            project_invoices = [inv for inv in invoices.data if inv.get("project_id") == project_id]
            project_sales_receipts = [sr for sr in sales_receipts.data if sr.get("project_id") == project_id]
            project_time_entries = [te for te in time_entries.data if te.get("project_id") == project_id]
            project_expenses = [exp for exp in expenses.data if exp.get("project_id") == project_id]
            project_bills = [bill for bill in bills.data if bill.get("project_id") == project_id]
            
            project_income = sum(inv["total_amount"] for inv in project_invoices) + sum(sr["total_amount"] for sr in project_sales_receipts)
            project_labor_cost = sum(te["hours_worked"] * te["hourly_rate"] for te in project_time_entries if te["hourly_rate"])
            project_expenses_cost = sum(exp["amount"] for exp in project_expenses)
            project_bills_cost = sum(bill["amount"] for bill in project_bills)
            project_costs = project_labor_cost + project_expenses_cost + project_bills_cost
            
            project_profit = project_income - project_costs
            
            if project_profit > 0:
                profitable_projects += 1
            elif project_profit < 0:
                loss_projects += 1
        
        return {
            "total_projects": len(projects),
            "total_income": total_income,
            "total_costs": total_costs,
            "total_profit": total_profit,
            "average_profit_margin": round(average_profit_margin, 2),
            "profitable_projects": profitable_projects,
            "loss_projects": loss_projects,
            "break_even_projects": len(projects) - profitable_projects - loss_projects,
            "filters_applied": {
                "status": status,
                "customer_id": customer_id,
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate projects profitability summary: {str(e)}"
        )
