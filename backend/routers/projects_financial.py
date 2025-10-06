"""
Project Financial Dashboard API
Provides financial data for project dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, List, Any
from datetime import date, datetime, timedelta
from utils.auth import get_current_user
from models.user import User
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/{project_id}/financial-dashboard")
async def get_project_financial_dashboard(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get comprehensive financial dashboard data for a project"""
    try:
        supabase = get_supabase_client()
        
        # Get project basic info
        project_result = supabase.table("projects").select("*, customers(name), employees(first_name, last_name)").eq("id", project_id).execute()
        
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = project_result.data[0]
        
        # Calculate planned vs actual revenue
        revenue_data = await calculate_project_revenue(supabase, project_id)
        
        # Calculate planned vs actual costs
        costs_data = await calculate_project_costs(supabase, project_id)
        
        # Calculate profit margins
        planned_profit = revenue_data["planned"] - costs_data["planned"]
        actual_profit = revenue_data["actual"] - costs_data["actual"]
        
        planned_margin = (planned_profit / revenue_data["planned"] * 100) if revenue_data["planned"] > 0 else 0
        actual_margin = (actual_profit / revenue_data["actual"] * 100) if revenue_data["actual"] > 0 else 0
        
        # Get cost breakdown
        cost_breakdown = await get_cost_breakdown(supabase, project_id)
        
        # Get revenue breakdown
        revenue_breakdown = await get_revenue_breakdown(supabase, project_id)
        
        # Get monthly data for timeline
        monthly_data = await get_monthly_financial_data(supabase, project_id)
        
        return {
            "project_id": project_id,
            "project_name": project["name"],
            "planned_revenue": revenue_data["planned"],
            "actual_revenue": revenue_data["actual"],
            "planned_costs": costs_data["planned"],
            "actual_costs": costs_data["actual"],
            "profit_margin_planned": planned_margin,
            "profit_margin_actual": actual_margin,
            "cost_breakdown": cost_breakdown,
            "revenue_breakdown": revenue_breakdown,
            "monthly_data": monthly_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching financial dashboard: {str(e)}")

async def calculate_project_revenue(supabase, project_id: str) -> Dict[str, float]:
    """Calculate planned and actual revenue for a project"""
    try:
        # Get project budget as planned revenue
        project_result = supabase.table("projects").select("budget").eq("id", project_id).execute()
        planned_revenue = float(project_result.data[0]["budget"]) if project_result.data and project_result.data[0]["budget"] else 0.0
        
        # Calculate actual revenue from invoices and sales receipts
        actual_revenue = 0.0
        
        # From invoices
        invoice_result = supabase.table("invoices").select("total_amount").eq("project_id", project_id).neq("status", "draft").execute()
        if invoice_result.data:
            actual_revenue += sum(float(invoice["total_amount"]) for invoice in invoice_result.data)
        
        # From sales receipts
        receipt_result = supabase.table("sales_receipts").select("total_amount").eq("project_id", project_id).neq("status", "draft").execute()
        if receipt_result.data:
            actual_revenue += sum(float(receipt["total_amount"]) for receipt in receipt_result.data)
        
        return {
            "planned": planned_revenue,
            "actual": actual_revenue
        }
        
    except Exception as e:
        print(f"Error calculating revenue: {e}")
        return {"planned": 0.0, "actual": 0.0}

async def calculate_project_costs(supabase, project_id: str) -> Dict[str, float]:
    """Calculate planned and actual costs for a project"""
    try:
        # Get project budget as planned costs (assuming 70% of budget is costs)
        project_result = supabase.table("projects").select("budget").eq("id", project_id).execute()
        planned_costs = float(project_result.data[0]["budget"] * 0.7) if project_result.data and project_result.data[0]["budget"] else 0.0
        
        # Calculate actual costs from various sources
        actual_costs = 0.0
        
        # From expenses
        expense_result = supabase.table("expenses").select("amount").eq("project_id", project_id).eq("status", "approved").execute()
        if expense_result.data:
            actual_costs += sum(float(expense["amount"]) for expense in expense_result.data)
        
        # From bills
        bill_result = supabase.table("bills").select("amount").eq("project_id", project_id).neq("status", "draft").execute()
        if bill_result.data:
            actual_costs += sum(float(bill["amount"]) for bill in bill_result.data)
        
        # From time entries (labor costs)
        time_result = supabase.table("time_entries").select("hours_worked, hourly_rate").eq("project_id", project_id).execute()
        if time_result.data:
            labor_costs = sum(float(entry["hours_worked"] * entry["hourly_rate"]) for entry in time_result.data if entry["hourly_rate"])
            actual_costs += labor_costs
        
        return {
            "planned": planned_costs,
            "actual": actual_costs
        }
        
    except Exception as e:
        print(f"Error calculating costs: {e}")
        return {"planned": 0.0, "actual": 0.0}

async def get_cost_breakdown(supabase, project_id: str) -> Dict[str, float]:
    """Get cost breakdown by category"""
    try:
        breakdown = {
            "labor": 0.0,
            "materials": 0.0,
            "overhead": 0.0,
            "other": 0.0
        }
        
        # Labor costs from time entries
        labor_result = supabase.table("time_entries").select("hours_worked, hourly_rate").eq("project_id", project_id).execute()
        if labor_result.data:
            breakdown["labor"] = sum(float(entry["hours_worked"] * entry["hourly_rate"]) for entry in labor_result.data if entry["hourly_rate"])
        
        # Other costs from expenses and bills
        expense_result = supabase.table("expenses").select("amount").eq("project_id", project_id).eq("status", "approved").execute()
        if expense_result.data:
            breakdown["other"] += sum(float(expense["amount"]) for expense in expense_result.data)
        
        bill_result = supabase.table("bills").select("amount").eq("project_id", project_id).neq("status", "draft").execute()
        if bill_result.data:
            breakdown["other"] += sum(float(bill["amount"]) for bill in bill_result.data)
        
        return breakdown
        
    except Exception as e:
        print(f"Error getting cost breakdown: {e}")
        return {"labor": 0.0, "materials": 0.0, "overhead": 0.0, "other": 0.0}

async def get_revenue_breakdown(supabase, project_id: str) -> Dict[str, float]:
    """Get revenue breakdown by source"""
    try:
        breakdown = {
            "invoices": 0.0,
            "sales_receipts": 0.0,
            "other": 0.0
        }
        
        # From invoices
        invoice_result = supabase.table("invoices").select("total_amount").eq("project_id", project_id).neq("status", "draft").execute()
        if invoice_result.data:
            breakdown["invoices"] = sum(float(invoice["total_amount"]) for invoice in invoice_result.data)
        
        # From sales receipts
        receipt_result = supabase.table("sales_receipts").select("total_amount").eq("project_id", project_id).neq("status", "draft").execute()
        if receipt_result.data:
            breakdown["sales_receipts"] = sum(float(receipt["total_amount"]) for receipt in receipt_result.data)
        
        return breakdown
        
    except Exception as e:
        print(f"Error getting revenue breakdown: {e}")
        return {"invoices": 0.0, "sales_receipts": 0.0, "other": 0.0}

async def get_monthly_financial_data(supabase, project_id: str) -> List[Dict[str, Any]]:
    """Get monthly financial data for timeline"""
    try:
        # Get project start date
        project_result = supabase.table("projects").select("start_date").eq("id", project_id).execute()
        if not project_result.data:
            return []
        
        start_date = datetime.fromisoformat(project_result.data[0]["start_date"].replace('Z', '+00:00'))
        monthly_data = []
        
        # Generate monthly data for the last 6 months
        for i in range(6):
            month_date = start_date + timedelta(days=30 * i)
            month_name = month_date.strftime("%B %Y")
            
            # Calculate monthly revenue
            invoice_result = supabase.table("invoices").select("total_amount").eq("project_id", project_id).gte("created_at", month_date.strftime("%Y-%m-01")).lt("created_at", (month_date + timedelta(days=30)).strftime("%Y-%m-01")).execute()
            receipt_result = supabase.table("sales_receipts").select("total_amount").eq("project_id", project_id).gte("created_at", month_date.strftime("%Y-%m-01")).lt("created_at", (month_date + timedelta(days=30)).strftime("%Y-%m-01")).execute()
            
            actual_revenue = 0.0
            if invoice_result.data:
                actual_revenue += sum(float(invoice["total_amount"]) for invoice in invoice_result.data)
            if receipt_result.data:
                actual_revenue += sum(float(receipt["total_amount"]) for receipt in receipt_result.data)
            
            # Calculate monthly costs
            expense_result = supabase.table("expenses").select("amount").eq("project_id", project_id).gte("created_at", month_date.strftime("%Y-%m-01")).lt("created_at", (month_date + timedelta(days=30)).strftime("%Y-%m-01")).execute()
            bill_result = supabase.table("bills").select("amount").eq("project_id", project_id).gte("created_at", month_date.strftime("%Y-%m-01")).lt("created_at", (month_date + timedelta(days=30)).strftime("%Y-%m-01")).execute()
            
            actual_costs = 0.0
            if expense_result.data:
                actual_costs += sum(float(expense["amount"]) for expense in expense_result.data)
            if bill_result.data:
                actual_costs += sum(float(bill["amount"]) for bill in bill_result.data)
            
            # Estimate planned values (simplified)
            planned_revenue = actual_revenue * 1.1  # Assume 10% over actual
            planned_costs = actual_costs * 0.9  # Assume 10% under actual
            
            monthly_data.append({
                "month": month_name,
                "planned_revenue": planned_revenue,
                "actual_revenue": actual_revenue,
                "planned_costs": planned_costs,
                "actual_costs": actual_costs
            })
        
        return monthly_data
        
    except Exception as e:
        print(f"Error getting monthly data: {e}")
        return []

@router.get("/{project_id}/cost-breakdown")
async def get_project_cost_breakdown(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get detailed cost breakdown for a project"""
    try:
        supabase = get_supabase_client()
        
        # Get cost breakdown
        breakdown = await get_cost_breakdown(supabase, project_id)
        
        # Get detailed cost items
        cost_items = await get_cost_items(supabase, project_id)
        
        return {
            "project_id": project_id,
            "breakdown": breakdown,
            "items": cost_items
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cost breakdown: {str(e)}")

@router.get("/{project_id}/revenue-analysis")
async def get_project_revenue_analysis(
    project_id: str
    # Temporarily disable authentication
    # current_user: User = Depends(get_current_user)
):
    """Get detailed revenue analysis for a project"""
    try:
        supabase = get_supabase_client()
        
        # Get revenue breakdown
        breakdown = await get_revenue_breakdown(supabase, project_id)
        
        # Get detailed revenue items
        revenue_items = await get_revenue_items(supabase, project_id)
        
        return {
            "project_id": project_id,
            "breakdown": breakdown,
            "items": revenue_items
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching revenue analysis: {str(e)}")

async def get_cost_items(supabase, project_id: str) -> List[Dict[str, Any]]:
    """Get detailed cost items for a project"""
    try:
        items = []
        
        # Get expenses
        expense_result = supabase.table("expenses").select("id, description, amount, created_at, status, vendor").eq("project_id", project_id).order("created_at", desc=True).execute()
        
        for expense in expense_result.data:
            items.append({
                "id": expense["id"],
                "category": "other",
                "description": expense["description"] or "Chi phí khác",
                "amount": float(expense["amount"]),
                "date": expense["created_at"],
                "status": expense["status"],
                "vendor": expense["vendor"]
            })
        
        # Get bills
        bill_result = supabase.table("bills").select("id, description, amount, created_at, status, vendor_name").eq("project_id", project_id).order("created_at", desc=True).execute()
        
        for bill in bill_result.data:
            items.append({
                "id": bill["id"],
                "category": "other",
                "description": bill["description"] or "Hóa đơn nhà cung cấp",
                "amount": float(bill["amount"]),
                "date": bill["created_at"],
                "status": bill["status"],
                "vendor": bill["vendor_name"]
            })
        
        # Get time entries (labor costs)
        time_result = supabase.table("time_entries").select("id, description, hours_worked, hourly_rate, date_worked, employee_name").eq("project_id", project_id).order("date_worked", desc=True).execute()
        
        for entry in time_result.data:
            amount = float(entry["hours_worked"] * entry["hourly_rate"]) if entry["hourly_rate"] else 0.0
            items.append({
                "id": entry["id"],
                "category": "labor",
                "description": entry["description"] or "Chi phí nhân công",
                "amount": amount,
                "date": entry["date_worked"],
                "status": "approved",
                "vendor": entry["employee_name"]
            })
        
        return items
        
    except Exception as e:
        print(f"Error getting cost items: {e}")
        return []

async def get_revenue_items(supabase, project_id: str) -> List[Dict[str, Any]]:
    """Get detailed revenue items for a project"""
    try:
        items = []
        
        # Get invoices
        invoice_result = supabase.table("invoices").select("id, description, total_amount, created_at, status, customer_name").eq("project_id", project_id).order("created_at", desc=True).execute()
        
        for invoice in invoice_result.data:
            items.append({
                "id": invoice["id"],
                "type": "invoice",
                "description": invoice["description"] or "Hóa đơn",
                "amount": float(invoice["total_amount"]),
                "date": invoice["created_at"],
                "status": invoice["status"],
                "customer": invoice["customer_name"]
            })
        
        # Get sales receipts
        receipt_result = supabase.table("sales_receipts").select("id, description, total_amount, created_at, status, customer_name").eq("project_id", project_id).order("created_at", desc=True).execute()
        
        for receipt in receipt_result.data:
            items.append({
                "id": receipt["id"],
                "type": "sales_receipt",
                "description": receipt["description"] or "Biên lai bán hàng",
                "amount": float(receipt["total_amount"]),
                "date": receipt["created_at"],
                "status": receipt["status"],
                "customer": receipt["customer_name"]
            })
        
        return items
        
    except Exception as e:
        print(f"Error getting revenue items: {e}")
        return []