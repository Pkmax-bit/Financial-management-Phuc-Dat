"""
Sales by Customer Report Router
Handles sales reports grouped by customer with ranking and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from models.user import User
from models.sales_customer import (
    SalesByCustomerReport,
    SalesByCustomerRequest,
    SalesByCustomerSummary,
    CustomerRanking,
    SalesByCustomerAnalysis,
    CustomerSalesTrend
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/customer-demo")
async def get_sales_by_customer_demo(
    start_date: date = Query(..., description="Start date for sales report"),
    end_date: date = Query(..., description="End date for sales report")
):
    """
    Generate Sales by Customer report (Demo version - no auth required)
    """
    try:
        # Sample data for demo
        sample_data = {
            "report_period": f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "currency": "VND",
            "generated_at": datetime.now().isoformat(),
            "total_customers": 15,
            "total_sales": 187000000,
            "total_invoices": 25,
            "total_sales_receipts": 12,
            "average_order_value": 5054054,
            "top_customers": [
                {
                    "customer_id": "11111111-1111-1111-1111-111111111111",
                    "customer_name": "Công ty ABC",
                    "customer_code": "KH001",
                    "customer_email": "contact@abc.com",
                    "customer_phone": "0123456789",
                    "total_sales": 55000000,
                    "total_invoices": 8,
                    "total_sales_receipts": 3,
                    "average_order_value": 5000000,
                    "last_transaction_date": "2024-03-15",
                    "growth_rate": 15.5,
                    "rank": 1
                },
                {
                    "customer_id": "22222222-2222-2222-2222-222222222222",
                    "customer_name": "Doanh nghiệp XYZ",
                    "customer_code": "KH002",
                    "customer_email": "info@xyz.com",
                    "customer_phone": "0987654321",
                    "total_sales": 45000000,
                    "total_invoices": 6,
                    "total_sales_receipts": 4,
                    "average_order_value": 4500000,
                    "last_transaction_date": "2024-03-10",
                    "growth_rate": 8.2,
                    "rank": 2
                },
                {
                    "customer_id": "33333333-3333-3333-3333-333333333333",
                    "customer_name": "Cá nhân Nguyễn C",
                    "customer_code": "KH003",
                    "customer_email": "nguyenc@email.com",
                    "customer_phone": "0369852147",
                    "total_sales": 35000000,
                    "total_invoices": 5,
                    "total_sales_receipts": 2,
                    "average_order_value": 5000000,
                    "last_transaction_date": "2024-03-08",
                    "growth_rate": -2.1,
                    "rank": 3
                },
                {
                    "customer_id": "44444444-4444-4444-4444-444444444444",
                    "customer_name": "Công ty DEF",
                    "customer_code": "KH004",
                    "customer_email": "sales@def.com",
                    "customer_phone": "0147258369",
                    "total_sales": 25000000,
                    "total_invoices": 4,
                    "total_sales_receipts": 2,
                    "average_order_value": 4166667,
                    "last_transaction_date": "2024-03-05",
                    "growth_rate": 22.8,
                    "rank": 4
                },
                {
                    "customer_id": "55555555-5555-5555-5555-555555555555",
                    "customer_name": "Doanh nghiệp GHI",
                    "customer_code": "KH005",
                    "customer_email": "contact@ghi.com",
                    "customer_phone": "0258147369",
                    "total_sales": 15000000,
                    "total_invoices": 2,
                    "total_sales_receipts": 1,
                    "average_order_value": 5000000,
                    "last_transaction_date": "2024-03-01",
                    "growth_rate": 5.5,
                    "rank": 5
                }
            ],
            "customer_segments": [
                {
                    "segment_name": "Khách hàng VIP",
                    "customer_count": 3,
                    "total_sales": 135000000,
                    "percentage": 72.2
                },
                {
                    "segment_name": "Khách hàng thường",
                    "customer_count": 8,
                    "total_sales": 40000000,
                    "percentage": 21.4
                },
                {
                    "segment_name": "Khách hàng mới",
                    "customer_count": 4,
                    "total_sales": 12000000,
                    "percentage": 6.4
                }
            ],
            "summary_stats": {
                "highest_sales": 55000000,
                "lowest_sales": 2000000,
                "median_sales": 15000000,
                "growth_rate": 12.3
            }
        }
        
        return sample_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Sales by Customer report demo: {str(e)}"
        )

@router.get("/by-customer", response_model=SalesByCustomerReport)
async def get_sales_by_customer(
    start_date: date = Query(..., description="Start date for sales report"),
    end_date: date = Query(..., description="End date for sales report"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of customers to return"),
    include_inactive: bool = Query(False, description="Include customers with no sales in period"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive Sales by Customer report
    
    This endpoint:
    1. Queries Invoices and SalesReceipts tables
    2. Groups transactions by customer
    3. Calculates total sales, order counts, and averages
    4. Ranks customers by total sales
    5. Provides customer insights and analysis
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get customer sales data
        customer_sales = await get_customer_sales_data(supabase, start_date_str, end_date_str)
        
        # Get customer information
        customer_info = await get_customer_information(supabase, list(customer_sales.keys()))
        
        # Create customer rankings
        customer_rankings = await create_customer_rankings(
            customer_sales, customer_info, start_date_str, end_date_str
        )
        
        # Sort by total sales (descending)
        customer_rankings.sort(key=lambda x: x.total_sales, reverse=True)
        
        # Add ranking positions
        for i, customer in enumerate(customer_rankings, 1):
            customer.ranking = i
        
        # Apply limit
        if limit < len(customer_rankings):
            customer_rankings = customer_rankings[:limit]
        
        # Calculate summary statistics
        total_sales = sum(customer.total_sales for customer in customer_rankings)
        total_customers = len(customer_rankings)
        average_sales_per_customer = total_sales / total_customers if total_customers > 0 else 0
        
        # Calculate top customer percentage
        top_customer_percentage = 0
        if customer_rankings and total_sales > 0:
            top_customer_percentage = (customer_rankings[0].total_sales / total_sales) * 100
        
        # Calculate additional insights
        new_customers = await count_new_customers(supabase, start_date_str, end_date_str)
        returning_customers = len([c for c in customer_rankings if c.total_invoices + c.total_sales_receipts > 1])
        
        # Get transaction counts
        total_transactions, total_invoices, total_sales_receipts = await get_transaction_counts(
            supabase, start_date_str, end_date_str
        )
        
        # Create final report
        report = SalesByCustomerReport(
            report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now(),
            
            total_customers=total_customers,
            total_sales=total_sales,
            average_sales_per_customer=average_sales_per_customer,
            top_customer_percentage=top_customer_percentage,
            
            customer_rankings=customer_rankings,
            
            new_customers=new_customers,
            returning_customers=returning_customers,
            inactive_customers=0,  # Would need additional logic to calculate
            
            total_transactions=total_transactions,
            total_invoices=total_invoices,
            total_sales_receipts=total_sales_receipts
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Sales by Customer report: {str(e)}"
        )

@router.get("/by-customer/summary", response_model=SalesByCustomerSummary)
async def get_sales_by_customer_summary(
    start_date: date = Query(..., description="Start date for sales summary"),
    end_date: date = Query(..., description="End date for sales summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified Sales by Customer summary for dashboard"""
    try:
        # Get full report first
        full_report = await get_sales_by_customer(start_date, end_date, 10, False, current_user)
        
        # Create summary
        top_customer_name = ""
        top_customer_sales = 0
        if full_report.customer_rankings:
            top_customer = full_report.customer_rankings[0]
            top_customer_name = top_customer.customer_name
            top_customer_sales = top_customer.total_sales
        
        summary = SalesByCustomerSummary(
            period=full_report.report_period,
            total_customers=full_report.total_customers,
            total_sales=full_report.total_sales,
            top_customer_name=top_customer_name,
            top_customer_sales=top_customer_sales,
            top_customer_percentage=full_report.top_customer_percentage,
            average_sales_per_customer=full_report.average_sales_per_customer,
            new_customers=full_report.new_customers,
            currency=full_report.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Sales by Customer summary: {str(e)}"
        )

@router.get("/by-customer/analysis", response_model=SalesByCustomerAnalysis)
async def get_sales_by_customer_analysis(
    start_date: date = Query(..., description="Start date for sales analysis"),
    end_date: date = Query(..., description="End date for sales analysis"),
    current_user: User = Depends(get_current_user)
):
    """Get advanced analysis of sales by customer"""
    try:
        # Get full report first
        full_report = await get_sales_by_customer(start_date, end_date, 1000, False, current_user)
        
        # Customer segmentation
        total_customers = len(full_report.customer_rankings)
        vip_count = max(1, int(total_customers * 0.1))  # Top 10%
        small_count = max(1, int(total_customers * 0.1))  # Bottom 10%
        
        vip_customers = full_report.customer_rankings[:vip_count]
        small_customers = full_report.customer_rankings[-small_count:]
        regular_customers = full_report.customer_rankings[vip_count:-small_count] if total_customers > 2 else []
        
        # Market concentration (Top 5 customers)
        top_5_sales = sum(c.total_sales for c in full_report.customer_rankings[:5])
        concentration_ratio = (top_5_sales / full_report.total_sales * 100) if full_report.total_sales > 0 else 0
        
        # Simplified Gini coefficient calculation
        gini_coefficient = calculate_gini_coefficient(full_report.customer_rankings)
        
        # Customer lifecycle stages (simplified)
        customer_lifecycle_stage = {
            "new": full_report.new_customers,
            "growing": len([c for c in full_report.customer_rankings if 2 <= c.total_invoices + c.total_sales_receipts <= 5]),
            "mature": len([c for c in full_report.customer_rankings if c.total_invoices + c.total_sales_receipts > 5]),
            "declining": 0  # Would need historical data to calculate
        }
        
        analysis = SalesByCustomerAnalysis(
            vip_customers=vip_customers,
            regular_customers=regular_customers,
            small_customers=small_customers,
            concentration_ratio=concentration_ratio,
            gini_coefficient=gini_coefficient,
            customer_lifecycle_stage=customer_lifecycle_stage
        )
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Sales by Customer analysis: {str(e)}"
        )

async def get_customer_sales_data(supabase, start_date: str, end_date: str) -> Dict[str, Dict[str, Any]]:
    """Get sales data grouped by customer from Invoices and SalesReceipts"""
    customer_sales = {}
    
    # Get invoice data
    invoices = supabase.table("invoices")\
        .select("customer_id, total_amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    for invoice in invoices.data:
        customer_id = invoice["customer_id"]
        if customer_id not in customer_sales:
            customer_sales[customer_id] = {
                "total_sales": 0,
                "invoices": [],
                "sales_receipts": [],
                "order_amounts": []
            }
        
        amount = float(invoice["total_amount"] or 0)
        customer_sales[customer_id]["total_sales"] += amount
        customer_sales[customer_id]["invoices"].append({
            "amount": amount,
            "date": invoice["issue_date"]
        })
        customer_sales[customer_id]["order_amounts"].append(amount)
    
    # Get sales receipt data
    sales_receipts = supabase.table("sales_receipts")\
        .select("customer_id, total_amount, issue_date")\
        .gte("issue_date", start_date)\
        .lte("issue_date", end_date)\
        .execute()
    
    for receipt in sales_receipts.data:
        customer_id = receipt["customer_id"]
        if customer_id not in customer_sales:
            customer_sales[customer_id] = {
                "total_sales": 0,
                "invoices": [],
                "sales_receipts": [],
                "order_amounts": []
            }
        
        amount = float(receipt["total_amount"] or 0)
        customer_sales[customer_id]["total_sales"] += amount
        customer_sales[customer_id]["sales_receipts"].append({
            "amount": amount,
            "date": receipt["issue_date"]
        })
        customer_sales[customer_id]["order_amounts"].append(amount)
    
    return customer_sales

async def get_customer_information(supabase, customer_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get customer information from customers table"""
    if not customer_ids:
        return {}
    
    customers = supabase.table("customers")\
        .select("id, name, email, phone, customer_code")\
        .in_("id", customer_ids)\
        .execute()
    
    customer_info = {}
    for customer in customers.data:
        customer_info[customer["id"]] = {
            "name": customer["name"],
            "email": customer.get("email"),
            "phone": customer.get("phone"),
            "customer_code": customer.get("customer_code")
        }
    
    return customer_info

async def create_customer_rankings(
    customer_sales: Dict[str, Dict[str, Any]], 
    customer_info: Dict[str, Dict[str, Any]],
    start_date: str,
    end_date: str
) -> List[CustomerRanking]:
    """Create customer ranking objects from sales data"""
    rankings = []
    
    for customer_id, sales_data in customer_sales.items():
        info = customer_info.get(customer_id, {})
        order_amounts = sales_data["order_amounts"]
        
        # Calculate statistics
        total_invoices = len(sales_data["invoices"])
        total_sales_receipts = len(sales_data["sales_receipts"])
        average_order_value = sales_data["total_sales"] / (total_invoices + total_sales_receipts) if (total_invoices + total_sales_receipts) > 0 else 0
        largest_order = max(order_amounts) if order_amounts else 0
        smallest_order = min(order_amounts) if order_amounts else 0
        
        # Get first and last order dates
        all_dates = []
        for invoice in sales_data["invoices"]:
            all_dates.append(invoice["date"])
        for receipt in sales_data["sales_receipts"]:
            all_dates.append(receipt["date"])
        
        first_order_date = min(all_dates) if all_dates else None
        last_order_date = max(all_dates) if all_dates else None
        
        # Convert dates
        first_order_date_obj = None
        last_order_date_obj = None
        if first_order_date:
            first_order_date_obj = datetime.fromisoformat(first_order_date.replace('Z', '+00:00')).date()
        if last_order_date:
            last_order_date_obj = datetime.fromisoformat(last_order_date.replace('Z', '+00:00')).date()
        
        ranking = CustomerRanking(
            customer_id=customer_id,
            customer_name=info.get("name", f"Customer {customer_id[:8]}"),
            customer_code=info.get("customer_code"),
            customer_email=info.get("email"),
            customer_phone=info.get("phone"),
            total_sales=sales_data["total_sales"],
            total_invoices=total_invoices,
            total_sales_receipts=total_sales_receipts,
            average_order_value=average_order_value,
            largest_order=largest_order,
            smallest_order=smallest_order,
            first_order_date=first_order_date_obj,
            last_order_date=last_order_date_obj,
            currency="VND",
            ranking=0  # Will be set later
        )
        
        rankings.append(ranking)
    
    return rankings

async def count_new_customers(supabase, start_date: str, end_date: str) -> int:
    """Count customers with their first order in the period"""
    try:
        # Get all customers who made their first order in this period
        # This is a simplified approach - in reality, you'd need to check against historical data
        
        # Get all invoices in period
        invoices = supabase.table("invoices")\
            .select("customer_id, issue_date")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        # Get all sales receipts in period
        sales_receipts = supabase.table("sales_receipts")\
            .select("customer_id, issue_date")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        # Combine and get unique customers
        customer_dates = {}
        
        for invoice in invoices.data:
            customer_id = invoice["customer_id"]
            date = invoice["issue_date"]
            if customer_id not in customer_dates or date < customer_dates[customer_id]:
                customer_dates[customer_id] = date
        
        for receipt in sales_receipts.data:
            customer_id = receipt["customer_id"]
            date = receipt["issue_date"]
            if customer_id not in customer_dates or date < customer_dates[customer_id]:
                customer_dates[customer_id] = date
        
        # For simplicity, assume all customers in this period are "new"
        # In a real implementation, you'd check against historical data
        return len(customer_dates)
        
    except Exception:
        return 0

async def get_transaction_counts(supabase, start_date: str, end_date: str) -> tuple[int, int, int]:
    """Get total transaction counts for the period"""
    try:
        # Count invoices
        invoices = supabase.table("invoices")\
            .select("id")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        # Count sales receipts
        sales_receipts = supabase.table("sales_receipts")\
            .select("id")\
            .gte("issue_date", start_date)\
            .lte("issue_date", end_date)\
            .execute()
        
        total_invoices = len(invoices.data)
        total_sales_receipts = len(sales_receipts.data)
        total_transactions = total_invoices + total_sales_receipts
        
        return total_transactions, total_invoices, total_sales_receipts
        
    except Exception:
        return 0, 0, 0

def calculate_gini_coefficient(customer_rankings: List[CustomerRanking]) -> float:
    """Calculate Gini coefficient for sales inequality"""
    if not customer_rankings:
        return 0.0
    
    # Sort by sales amount
    sorted_customers = sorted(customer_rankings, key=lambda x: x.total_sales)
    n = len(sorted_customers)
    
    if n == 0:
        return 0.0
    
    # Calculate Gini coefficient
    total_sales = sum(customer.total_sales for customer in sorted_customers)
    if total_sales == 0:
        return 0.0
    
    # Simplified Gini calculation
    cumsum = 0
    gini = 0
    
    for i, customer in enumerate(sorted_customers):
        cumsum += customer.total_sales
        gini += (2 * (i + 1) - n - 1) * customer.total_sales
    
    gini = gini / (n * total_sales)
    
    return max(0.0, min(1.0, gini))  # Ensure between 0 and 1
