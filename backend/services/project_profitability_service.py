"""
Project Profitability Service
Handles all financial calculations and data aggregation for projects
"""

from typing import Dict, List, Optional, Tuple
from datetime import date, datetime
from services.supabase_client import get_supabase_client


class ProjectProfitabilityService:
    """Service for calculating project profitability and financial metrics"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def calculate_project_revenue(self, project_id: str) -> Dict:
        """Calculate total revenue for a project"""
        # Get invoices for this project
        invoices = self.supabase.table("invoices").select("total_amount, status, payment_status, paid_amount").eq("project_id", project_id).execute()
        total_invoice_amount = sum(invoice["total_amount"] for invoice in invoices.data)
        total_paid_invoices = sum(invoice["paid_amount"] for invoice in invoices.data)
        
        # Get sales receipts for this project
        sales_receipts = self.supabase.table("sales_receipts").select("total_amount, status").eq("project_id", project_id).execute()
        total_sales_receipts = sum(receipt["total_amount"] for receipt in sales_receipts.data)
        
        # Total revenue
        total_revenue = total_invoice_amount + total_sales_receipts
        total_paid_revenue = total_paid_invoices + total_sales_receipts
        
        return {
            "total": total_revenue,
            "paid": total_paid_revenue,
            "outstanding": total_revenue - total_paid_revenue,
            "breakdown": {
                "invoices": {
                    "total_amount": total_invoice_amount,
                    "paid_amount": total_paid_invoices,
                    "outstanding": total_invoice_amount - total_paid_invoices,
                    "count": len(invoices.data)
                },
                "sales_receipts": {
                    "total_amount": total_sales_receipts,
                    "count": len(sales_receipts.data)
                }
            }
        }
    
    async def calculate_project_costs(self, project_id: str) -> Dict:
        """Calculate total costs for a project"""
        # Get time entries and calculate labor costs
        time_entries = self.supabase.table("time_entries").select("*").eq("project_id", project_id).execute()
        total_hours = sum(entry["hours_worked"] for entry in time_entries.data)
        total_labor_cost = 0
        
        for entry in time_entries.data:
            if entry["hourly_rate"]:
                total_labor_cost += entry["hours_worked"] * entry["hourly_rate"]
        
        # Get direct project expenses
        expenses = self.supabase.table("expenses").select("amount, status").eq("project_id", project_id).execute()
        total_expenses = sum(expense["amount"] for expense in expenses.data)
        
        # Get bills (vendor bills) for this project
        bills = self.supabase.table("bills").select("amount, status, paid_amount").eq("project_id", project_id).execute()
        total_bills = sum(bill["amount"] for bill in bills.data)
        total_paid_bills = sum(bill["paid_amount"] for bill in bills.data)
        
        # Total costs
        total_costs = total_labor_cost + total_expenses + total_bills
        
        return {
            "total": total_costs,
            "breakdown": {
                "labor": {
                    "total_hours": total_hours,
                    "total_cost": total_labor_cost,
                    "average_hourly_rate": total_labor_cost / total_hours if total_hours > 0 else 0
                },
                "expenses": {
                    "total_cost": total_expenses,
                    "count": len(expenses.data)
                },
                "bills": {
                    "total_amount": total_bills,
                    "paid_amount": total_paid_bills,
                    "outstanding": total_bills - total_paid_bills,
                    "count": len(bills.data)
                }
            }
        }
    
    async def calculate_project_profitability(self, project_id: str) -> Dict:
        """Calculate comprehensive profitability for a single project"""
        # Get project details
        project_result = self.supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_result.data:
            return None
        
        project = project_result.data[0]
        
        # Calculate revenue and costs
        revenue_data = await self.calculate_project_revenue(project_id)
        costs_data = await self.calculate_project_costs(project_id)
        
        # Calculate profitability metrics
        gross_profit = revenue_data["total"] - costs_data["total"]
        net_profit = revenue_data["paid"] - costs_data["total"]
        
        # Profit margins
        gross_profit_margin = (gross_profit / revenue_data["total"] * 100) if revenue_data["total"] > 0 else 0
        net_profit_margin = (net_profit / revenue_data["paid"] * 100) if revenue_data["paid"] > 0 else 0
        
        # Budget analysis
        budget = project["budget"] or 0
        budget_variance = budget - costs_data["total"]
        budget_utilization = (costs_data["total"] / budget * 100) if budget > 0 else 0
        
        return {
            "project_id": project_id,
            "project_name": project["name"],
            "project_code": project["project_code"],
            "status": project["status"],
            "start_date": project["start_date"],
            "end_date": project["end_date"],
            
            # Revenue Summary
            "revenue": revenue_data,
            
            # Cost Summary
            "costs": costs_data,
            
            # Profitability Metrics
            "profitability": {
                "gross_profit": gross_profit,
                "net_profit": net_profit,
                "gross_profit_margin": round(gross_profit_margin, 2),
                "net_profit_margin": round(net_profit_margin, 2)
            },
            
            # Budget Analysis
            "budget": {
                "allocated": budget,
                "actual_costs": costs_data["total"],
                "variance": budget_variance,
                "utilization_percentage": round(budget_utilization, 2)
            },
            
            # Project Metrics
            "metrics": {
                "total_hours": costs_data["breakdown"]["labor"]["total_hours"],
                "average_hourly_rate": round(costs_data["breakdown"]["labor"]["average_hourly_rate"], 2),
                "cost_per_hour": round(costs_data["total"] / costs_data["breakdown"]["labor"]["total_hours"], 2) if costs_data["breakdown"]["labor"]["total_hours"] > 0 else 0,
                "revenue_per_hour": round(revenue_data["total"] / costs_data["breakdown"]["labor"]["total_hours"], 2) if costs_data["breakdown"]["labor"]["total_hours"] > 0 else 0
            }
        }
    
    async def calculate_projects_comparison(self, filters: Dict = None) -> Dict:
        """Calculate profitability comparison across multiple projects"""
        # Build filters
        filter_conditions = []
        if filters:
            if filters.get("start_date"):
                filter_conditions.append(f"start_date.gte.{filters['start_date']}")
            if filters.get("end_date"):
                filter_conditions.append(f"start_date.lte.{filters['end_date']}")
            if filters.get("status"):
                filter_conditions.append(f"status.eq.{filters['status']}")
        
        # Get all projects
        query = self.supabase.table("projects").select("*")
        for condition in filter_conditions:
            query = query.filter(condition)
        
        projects_result = query.execute()
        projects = projects_result.data
        
        if not projects:
            return {
                "projects": [],
                "summary": {
                    "total_projects": 0,
                    "total_revenue": 0,
                    "total_costs": 0,
                    "total_profit": 0,
                    "average_profit_margin": 0
                }
            }
        
        # Pre-process transaction data for efficiency
        project_ids = [project["id"] for project in projects]
        
        # Get all related data in parallel
        invoices = self.supabase.table("invoices").select("project_id, total_amount, paid_amount").in_("project_id", project_ids).execute()
        sales_receipts = self.supabase.table("sales_receipts").select("project_id, total_amount").in_("project_id", project_ids).execute()
        time_entries = self.supabase.table("time_entries").select("project_id, hours_worked, hourly_rate").in_("project_id", project_ids).execute()
        expenses = self.supabase.table("expenses").select("project_id, amount").in_("project_id", project_ids).execute()
        bills = self.supabase.table("bills").select("project_id, amount, paid_amount").in_("project_id", project_ids).execute()
        
        # Pre-process data into hash maps for O(1) lookup
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
        project_profitability = []
        
        for project in projects:
            project_id = project["id"]
            
            # Calculate revenue
            project_invoices = invoices_by_project.get(project_id, [])
            project_sales_receipts = sales_receipts_by_project.get(project_id, [])
            
            total_invoice_amount = sum(inv["total_amount"] for inv in project_invoices)
            total_paid_invoices = sum(inv["paid_amount"] for inv in project_invoices)
            total_sales_receipts = sum(sr["total_amount"] for sr in project_sales_receipts)
            
            total_revenue = total_invoice_amount + total_sales_receipts
            total_paid_revenue = total_paid_invoices + total_sales_receipts
            
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
            
            # Calculate profitability
            gross_profit = total_revenue - total_costs
            net_profit = total_paid_revenue - total_costs
            profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
            net_profit_margin = (net_profit / total_paid_revenue * 100) if total_paid_revenue > 0 else 0
            
            # Budget analysis
            budget = project["budget"] or 0
            budget_variance = budget - total_costs
            budget_utilization = (total_costs / budget * 100) if budget > 0 else 0
            
            project_data = {
                "project_id": project_id,
                "project_code": project["project_code"],
                "project_name": project["name"],
                "customer_id": project["customer_id"],
                "manager_id": project["manager_id"],
                "status": project["status"],
                "priority": project["priority"],
                "start_date": project["start_date"],
                "end_date": project["end_date"],
                "progress": project["progress"],
                
                # Financial metrics
                "revenue": {
                    "total": total_revenue,
                    "paid": total_paid_revenue,
                    "outstanding": total_revenue - total_paid_revenue,
                    "invoices": total_invoice_amount,
                    "sales_receipts": total_sales_receipts
                },
                
                "costs": {
                    "total": total_costs,
                    "labor": labor_cost,
                    "expenses": expenses_cost,
                    "bills": bills_cost,
                    "hours": total_hours
                },
                
                "profitability": {
                    "gross_profit": gross_profit,
                    "net_profit": net_profit,
                    "gross_profit_margin": round(profit_margin, 2),
                    "net_profit_margin": round(net_profit_margin, 2)
                },
                
                "budget": {
                    "allocated": budget,
                    "actual_costs": total_costs,
                    "variance": budget_variance,
                    "utilization_percentage": round(budget_utilization, 2)
                }
            }
            
            project_profitability.append(project_data)
        
        # Calculate summary statistics
        total_revenue = sum(p["revenue"]["total"] for p in project_profitability)
        total_costs = sum(p["costs"]["total"] for p in project_profitability)
        total_profit = total_revenue - total_costs
        average_profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Performance metrics
        profitable_projects = len([p for p in project_profitability if p["profitability"]["gross_profit"] > 0])
        loss_projects = len([p for p in project_profitability if p["profitability"]["gross_profit"] < 0])
        
        return {
            "projects": project_profitability,
            "summary": {
                "total_projects": len(project_profitability),
                "profitable_projects": profitable_projects,
                "loss_projects": loss_projects,
                "total_revenue": total_revenue,
                "total_costs": total_costs,
                "total_profit": total_profit,
                "average_profit_margin": round(average_profit_margin, 2),
                "most_profitable": project_profitability[0] if project_profitability else None,
                "least_profitable": project_profitability[-1] if project_profitability else None
            },
            "filters_applied": filters or {}
        }
