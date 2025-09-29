"""
Profit and Loss (P&L) Reports Router
Handles comprehensive P&L statement generation and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from models.user import User
from models.pl_report import (
    ProfitLossReport, 
    PLReportRequest, 
    PLReportSummary,
    PLSection,
    PLAccount,
    AccountType
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

# Chart of Accounts mapping for P&L classification
ACCOUNT_CLASSIFICATION = {
    # Revenue accounts (5xx series)
    "511": AccountType.REVENUE,  # Doanh thu bán hàng
    "512": AccountType.REVENUE,  # Doanh thu cung cấp dịch vụ
    "515": AccountType.REVENUE,  # Doanh thu hoạt động tài chính
    "521": AccountType.REVENUE,  # Các khoản giảm trừ doanh thu
    
    # Cost of Goods Sold (6xx series - COGS)
    "632": AccountType.COGS,    # Giá vốn hàng bán
    
    # Operating Expenses (6xx series - Operating)
    "641": AccountType.OPERATING_EXPENSE,  # Chi phí bán hàng
    "642": AccountType.OPERATING_EXPENSE,  # Chi phí quản lý doanh nghiệp
    "635": AccountType.OPERATING_EXPENSE,  # Chi phí tài chính
    "811": AccountType.OPERATING_EXPENSE,  # Chi phí hoạt động khác
    
    # Other Income/Expenses
    "711": AccountType.OTHER_INCOME,   # Thu nhập khác
    "811": AccountType.OTHER_EXPENSE,  # Chi phí khác
}

def classify_account(account_code: str) -> AccountType:
    """Classify account code into P&L category"""
    # Check exact match first
    if account_code in ACCOUNT_CLASSIFICATION:
        return ACCOUNT_CLASSIFICATION[account_code]
    
    # Check by prefix for revenue (5xx)
    if account_code.startswith("5") and account_code[1:3] in ["11", "12", "15", "21"]:
        return AccountType.REVENUE
    
    # Check by prefix for COGS (632)
    if account_code.startswith("632"):
        return AccountType.COGS
    
    # Check by prefix for operating expenses (6xx)
    if account_code.startswith("6") and account_code not in ["632"]:
        return AccountType.OPERATING_EXPENSE
    
    # Check by prefix for other income (7xx)
    if account_code.startswith("7"):
        return AccountType.OTHER_INCOME
    
    # Check by prefix for other expenses (8xx)
    if account_code.startswith("8"):
        return AccountType.OTHER_EXPENSE
    
    # Default to operating expense for unknown accounts
    return AccountType.OPERATING_EXPENSE

@router.get("/profit-and-loss", response_model=ProfitLossReport)
async def get_profit_and_loss_report(
    start_date: date = Query(..., description="Start date for P&L report"),
    end_date: date = Query(..., description="End date for P&L report"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive Profit and Loss statement
    
    This endpoint:
    1. Queries all journal entries within the date range
    2. Classifies accounts into Revenue, COGS, and Operating Expenses
    3. Calculates Gross Profit, Operating Income, and Net Income
    4. Returns structured P&L statement
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format for database query
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Query journal entries within date range
        journal_entries = supabase.table("journal_entries")\
            .select("id, entry_date, description, total_debit, total_credit")\
            .gte("entry_date", start_date_str)\
            .lte("entry_date", end_date_str)\
            .eq("status", "posted")\
            .execute()
        
        if not journal_entries.data:
            # Return empty report if no data
            return create_empty_pl_report(start_date, end_date)
        
        # Query journal entry lines for all entries
        entry_ids = [entry["id"] for entry in journal_entries.data]
        
        journal_lines = supabase.table("journal_entry_lines")\
            .select("entry_id, account_code, account_name, debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .execute()
        
        # Process and classify accounts
        account_totals = {}
        total_transactions = len(journal_entries.data)
        
        for line in journal_lines.data:
            account_code = line["account_code"]
            account_name = line["account_name"]
            debit_amount = float(line["debit_amount"] or 0)
            credit_amount = float(line["credit_amount"] or 0)
            
            # Net amount (positive for revenue/income, negative for expenses)
            net_amount = credit_amount - debit_amount
            
            # Classify account
            account_type = classify_account(account_code)
            
            # Initialize account if not exists
            if account_code not in account_totals:
                account_totals[account_code] = {
                    "account_name": account_name,
                    "account_type": account_type,
                    "total_amount": 0.0,
                    "debit_total": 0.0,
                    "credit_total": 0.0
                }
            
            # Add to totals
            account_totals[account_code]["total_amount"] += net_amount
            account_totals[account_code]["debit_total"] += debit_amount
            account_totals[account_code]["credit_total"] += credit_amount
        
        # Build P&L sections
        revenue_accounts = []
        cogs_accounts = []
        operating_expense_accounts = []
        other_income_accounts = []
        other_expense_accounts = []
        
        total_revenue = 0.0
        total_cogs = 0.0
        total_operating_expenses = 0.0
        other_income = 0.0
        other_expenses = 0.0
        
        for account_code, data in account_totals.items():
            amount = data["total_amount"]
            account_name = data["account_name"]
            account_type = data["account_type"]
            
            # Create account object
            account = PLAccount(
                account_code=account_code,
                account_name=account_name,
                account_type=account_type,
                amount=abs(amount)  # Always positive for display
            )
            
            # Categorize by account type
            if account_type == AccountType.REVENUE:
                revenue_accounts.append(account)
                total_revenue += amount
            elif account_type == AccountType.COGS:
                cogs_accounts.append(account)
                total_cogs += abs(amount)  # COGS is always positive
            elif account_type == AccountType.OPERATING_EXPENSE:
                operating_expense_accounts.append(account)
                total_operating_expenses += abs(amount)  # Expenses are always positive
            elif account_type == AccountType.OTHER_INCOME:
                other_income_accounts.append(account)
                other_income += amount
            elif account_type == AccountType.OTHER_EXPENSE:
                other_expense_accounts.append(account)
                other_expenses += abs(amount)
        
        # Calculate key metrics
        gross_profit = total_revenue - total_cogs
        gross_profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        operating_income = gross_profit - total_operating_expenses
        operating_income_margin = (operating_income / total_revenue * 100) if total_revenue > 0 else 0
        
        net_income = operating_income + other_income - other_expenses
        net_income_margin = (net_income / total_revenue * 100) if total_revenue > 0 else 0
        
        # Calculate percentages for each account
        for account in revenue_accounts:
            account.percentage = (account.amount / total_revenue * 100) if total_revenue > 0 else 0
        
        for account in cogs_accounts:
            account.percentage = (account.amount / total_revenue * 100) if total_revenue > 0 else 0
        
        for account in operating_expense_accounts:
            account.percentage = (account.amount / total_revenue * 100) if total_revenue > 0 else 0
        
        # Create sections
        revenue_section = PLSection(
            section_name="Doanh thu",
            accounts=revenue_accounts,
            total_amount=total_revenue,
            percentage=100.0
        )
        
        cogs_section = PLSection(
            section_name="Giá vốn hàng bán",
            accounts=cogs_accounts,
            total_amount=total_cogs,
            percentage=(total_cogs / total_revenue * 100) if total_revenue > 0 else 0
        )
        
        operating_expenses_section = PLSection(
            section_name="Chi phí hoạt động",
            accounts=operating_expense_accounts,
            total_amount=total_operating_expenses,
            percentage=(total_operating_expenses / total_revenue * 100) if total_revenue > 0 else 0
        )
        
        # Create final report
        report = ProfitLossReport(
            report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now().isoformat(),
            
            total_revenue=total_revenue,
            revenue_section=revenue_section,
            
            total_cogs=total_cogs,
            cogs_section=cogs_section,
            
            gross_profit=gross_profit,
            gross_profit_margin=gross_profit_margin,
            
            total_operating_expenses=total_operating_expenses,
            operating_expenses_section=operating_expenses_section,
            
            operating_income=operating_income,
            operating_income_margin=operating_income_margin,
            
            other_income=other_income,
            other_expenses=other_expenses,
            
            net_income=net_income,
            net_income_margin=net_income_margin,
            
            total_transactions=total_transactions,
            total_journal_entries=len(journal_entries.data)
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate P&L report: {str(e)}"
        )

@router.get("/profit-and-loss/summary", response_model=PLReportSummary)
async def get_pl_summary(
    start_date: date = Query(..., description="Start date for P&L summary"),
    end_date: date = Query(..., description="End date for P&L summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified P&L summary for dashboard"""
    try:
        # Get full report first
        full_report = await get_profit_and_loss_report(start_date, end_date, current_user)
        
        # Create summary
        summary = PLReportSummary(
            period=full_report.report_period,
            total_revenue=full_report.total_revenue,
            total_expenses=full_report.total_cogs + full_report.total_operating_expenses + full_report.other_expenses,
            net_income=full_report.net_income,
            gross_profit_margin=full_report.gross_profit_margin,
            net_income_margin=full_report.net_income_margin,
            currency=full_report.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate P&L summary: {str(e)}"
        )

def create_empty_pl_report(start_date: date, end_date: date) -> ProfitLossReport:
    """Create empty P&L report when no data is available"""
    return ProfitLossReport(
        report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
        start_date=start_date,
        end_date=end_date,
        currency="VND",
        generated_at=datetime.now().isoformat(),
        
        total_revenue=0.0,
        revenue_section=PLSection(
            section_name="Doanh thu",
            accounts=[],
            total_amount=0.0,
            percentage=0.0
        ),
        
        total_cogs=0.0,
        cogs_section=PLSection(
            section_name="Giá vốn hàng bán",
            accounts=[],
            total_amount=0.0,
            percentage=0.0
        ),
        
        gross_profit=0.0,
        gross_profit_margin=0.0,
        
        total_operating_expenses=0.0,
        operating_expenses_section=PLSection(
            section_name="Chi phí hoạt động",
            accounts=[],
            total_amount=0.0,
            percentage=0.0
        ),
        
        operating_income=0.0,
        operating_income_margin=0.0,
        
        other_income=0.0,
        other_expenses=0.0,
        
        net_income=0.0,
        net_income_margin=0.0,
        
        total_transactions=0,
        total_journal_entries=0
    )
