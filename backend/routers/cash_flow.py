"""
Cash Flow Statement Router
Handles comprehensive Cash Flow statement generation and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from models.user import User
from models.cash_flow import (
    CashFlowStatement,
    CashFlowRequest,
    CashFlowSummary,
    CashFlowAnalysis,
    CashFlowSection,
    CashFlowItem,
    CashFlowCategory
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

# Account classifications for Cash Flow Statement
CASH_ACCOUNTS = ["101", "102"]  # Cash and Bank accounts
OPERATING_ACCOUNTS = {
    "revenue": ["511", "512", "515"],  # Revenue accounts
    "cogs": ["632"],  # Cost of Goods Sold
    "operating_expenses": ["641", "642", "635"],  # Operating expenses
    "current_assets": ["131", "133", "152"],  # AR, Other receivables, Inventory
    "current_liabilities": ["331", "333", "334", "338"],  # AP, Taxes, Payroll, Other payables
}

INVESTING_ACCOUNTS = {
    "fixed_assets": ["211", "213", "217"],  # Fixed assets
    "investments": ["121", "128"],  # Long-term investments
}

FINANCING_ACCOUNTS = {
    "equity": ["411", "412", "413"],  # Owner equity
    "long_term_debt": ["341", "342"],  # Long-term debt
    "dividends": ["421"],  # Retained earnings (for dividends)
}

@router.get("/cash-flow-demo")
async def get_cash_flow_statement_demo(
    start_date: date = Query(..., description="Start date for Cash Flow statement"),
    end_date: date = Query(..., description="End date for Cash Flow statement")
):
    """
    Generate Cash Flow report (Demo version - no auth required)
    """
    try:
        # Sample data for demo
        sample_data = {
            "report_period": f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "currency": "VND",
            "generated_at": datetime.now().isoformat(),
            "beginning_cash": 10000000,
            "ending_cash": 15000000,
            "net_change_in_cash": 5000000,
            "net_income": 25000000,
            "operating_activities": {
                "section_name": "Dòng tiền từ hoạt động kinh doanh",
                "section_type": "operating",
                "items": [
                    {
                        "item_name": "Lợi nhuận ròng",
                        "amount": 25000000,
                        "is_inflow": True,
                        "description": "Từ báo cáo Kết quả Kinh doanh"
                    },
                    {
                        "item_name": "Khấu hao và phân bổ",
                        "amount": 5000000,
                        "is_inflow": True,
                        "description": "Chi phí không dùng tiền mặt"
                    },
                    {
                        "item_name": "Thay đổi Phải thu khách hàng",
                        "item_code": "131",
                        "amount": 10000000,
                        "is_inflow": False,
                        "description": "Thay đổi trong Phải thu khách hàng"
                    },
                    {
                        "item_name": "Thay đổi Hàng tồn kho",
                        "item_code": "152",
                        "amount": 3000000,
                        "is_inflow": False,
                        "description": "Thay đổi trong Hàng tồn kho"
                    },
                    {
                        "item_name": "Thay đổi Phải trả nhà cung cấp",
                        "item_code": "331",
                        "amount": 8000000,
                        "is_inflow": True,
                        "description": "Thay đổi trong Phải trả nhà cung cấp"
                    }
                ],
                "subtotal": 51000000,
                "net_cash_flow": 20000000
            },
            "investing_activities": {
                "section_name": "Dòng tiền từ hoạt động đầu tư",
                "section_type": "investing",
                "items": [
                    {
                        "item_name": "Mua sắm Tài sản cố định",
                        "item_code": "211",
                        "amount": 15000000,
                        "is_inflow": False,
                        "description": "Giao dịch Tài sản cố định hữu hình"
                    },
                    {
                        "item_name": "Bán Tài sản cố định",
                        "item_code": "211",
                        "amount": 5000000,
                        "is_inflow": True,
                        "description": "Giao dịch Tài sản cố định hữu hình"
                    }
                ],
                "subtotal": 20000000,
                "net_cash_flow": -10000000
            },
            "financing_activities": {
                "section_name": "Dòng tiền từ hoạt động tài chính",
                "section_type": "financing",
                "items": [
                    {
                        "item_name": "Vay dài hạn",
                        "item_code": "341",
                        "amount": 20000000,
                        "is_inflow": True,
                        "description": "Giao dịch Vay dài hạn"
                    },
                    {
                        "item_name": "Trả nợ vay",
                        "item_code": "341",
                        "amount": 10000000,
                        "is_inflow": False,
                        "description": "Giao dịch Vay dài hạn"
                    },
                    {
                        "item_name": "Góp vốn",
                        "item_code": "411",
                        "amount": 5000000,
                        "is_inflow": True,
                        "description": "Giao dịch Vốn đầu tư của chủ sở hữu"
                    }
                ],
                "subtotal": 35000000,
                "net_cash_flow": 15000000
            },
            "total_operating_cash_flow": 20000000,
            "total_investing_cash_flow": -10000000,
            "total_financing_cash_flow": 15000000,
            "net_cash_flow": 25000000,
            "cash_flow_validation": True,
            "total_transactions": 45,
            "total_journal_entries": 45
        }
        
        return sample_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Cash Flow Statement demo: {str(e)}"
        )

@router.get("/cash-flow", response_model=CashFlowStatement)
async def get_cash_flow_statement(
    start_date: date = Query(..., description="Start date for Cash Flow statement"),
    end_date: date = Query(..., description="End date for Cash Flow statement"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive Cash Flow Statement
    
    This endpoint:
    1. Starts with Net Income from P&L
    2. Calculates Operating Activities cash flows
    3. Calculates Investing Activities cash flows
    4. Calculates Financing Activities cash flows
    5. Reconciles with actual cash balance changes
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Step 1: Get Net Income from P&L
        net_income = await get_net_income(supabase, start_date_str, end_date_str)
        
        # Step 2: Get beginning and ending cash balances
        beginning_cash = await get_cash_balance(supabase, start_date_str, is_beginning=True)
        ending_cash = await get_cash_balance(supabase, end_date_str, is_beginning=False)
        net_change_in_cash = ending_cash - beginning_cash
        
        # Step 3: Calculate Operating Activities
        operating_activities = await calculate_operating_activities(
            supabase, start_date_str, end_date_str, net_income
        )
        
        # Step 4: Calculate Investing Activities
        investing_activities = await calculate_investing_activities(
            supabase, start_date_str, end_date_str
        )
        
        # Step 5: Calculate Financing Activities
        financing_activities = await calculate_financing_activities(
            supabase, start_date_str, end_date_str
        )
        
        # Step 6: Calculate totals
        total_operating_cash_flow = operating_activities.net_cash_flow
        total_investing_cash_flow = investing_activities.net_cash_flow
        total_financing_cash_flow = financing_activities.net_cash_flow
        net_cash_flow = total_operating_cash_flow + total_investing_cash_flow + total_financing_cash_flow
        
        # Step 7: Validate cash flow
        cash_flow_validation = abs(net_cash_flow - net_change_in_cash) < 0.01
        
        # Get transaction counts
        total_transactions, total_journal_entries = await get_transaction_counts(
            supabase, start_date_str, end_date_str
        )
        
        # Create final statement
        statement = CashFlowStatement(
            report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now(),
            
            beginning_cash=beginning_cash,
            ending_cash=ending_cash,
            net_change_in_cash=net_change_in_cash,
            
            net_income=net_income,
            
            operating_activities=operating_activities,
            investing_activities=investing_activities,
            financing_activities=financing_activities,
            
            total_operating_cash_flow=total_operating_cash_flow,
            total_investing_cash_flow=total_investing_cash_flow,
            total_financing_cash_flow=total_financing_cash_flow,
            net_cash_flow=net_cash_flow,
            
            cash_flow_validation=cash_flow_validation,
            
            total_transactions=total_transactions,
            total_journal_entries=total_journal_entries
        )
        
        return statement
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Cash Flow Statement: {str(e)}"
        )

@router.get("/cash-flow/summary", response_model=CashFlowSummary)
async def get_cash_flow_summary(
    start_date: date = Query(..., description="Start date for Cash Flow summary"),
    end_date: date = Query(..., description="End date for Cash Flow summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified Cash Flow summary for dashboard"""
    try:
        # Get full statement first
        full_statement = await get_cash_flow_statement(start_date, end_date, current_user)
        
        # Create summary
        summary = CashFlowSummary(
            period=full_statement.report_period,
            net_income=full_statement.net_income,
            operating_cash_flow=full_statement.total_operating_cash_flow,
            investing_cash_flow=full_statement.total_investing_cash_flow,
            financing_cash_flow=full_statement.total_financing_cash_flow,
            net_cash_flow=full_statement.net_cash_flow,
            beginning_cash=full_statement.beginning_cash,
            ending_cash=full_statement.ending_cash,
            currency=full_statement.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Cash Flow summary: {str(e)}"
        )

async def get_net_income(supabase, start_date: str, end_date: str) -> float:
    """Get Net Income from P&L for the period"""
    try:
        # Get revenue accounts
        revenue_accounts = OPERATING_ACCOUNTS["revenue"]
        revenue_query = supabase.table("journal_entry_lines")\
            .select("credit_amount, debit_amount")\
            .in_("account_code", revenue_accounts)
        
        # Get journal entries in date range
        journal_entries = supabase.table("journal_entries")\
            .select("id")\
            .gte("entry_date", start_date)\
            .lte("entry_date", end_date)\
            .eq("status", "posted")\
            .execute()
        
        if journal_entries.data:
            entry_ids = [entry["id"] for entry in journal_entries.data]
            revenue_query = revenue_query.in_("entry_id", entry_ids)
        
        revenue_result = revenue_query.execute()
        total_revenue = sum(
            float(line["credit_amount"] or 0) - float(line["debit_amount"] or 0)
            for line in revenue_result.data
        )
        
        # Get expense accounts
        expense_accounts = OPERATING_ACCOUNTS["cogs"] + OPERATING_ACCOUNTS["operating_expenses"]
        expense_query = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("account_code", expense_accounts)
        
        if journal_entries.data:
            expense_query = expense_query.in_("entry_id", entry_ids)
        
        expense_result = expense_query.execute()
        total_expenses = sum(
            float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
            for line in expense_result.data
        )
        
        return total_revenue - total_expenses
        
    except Exception:
        return 0.0

async def get_cash_balance(supabase, date_str: str, is_beginning: bool = False) -> float:
    """Get cash balance at a specific date"""
    try:
        # Get all journal entries up to the date
        query = supabase.table("journal_entries")\
            .select("id")\
            .eq("status", "posted")
        
        if is_beginning:
            query = query.lt("entry_date", date_str)
        else:
            query = query.lte("entry_date", date_str)
        
        journal_entries = query.execute()
        
        if not journal_entries.data:
            return 0.0
        
        # Get cash account balances
        entry_ids = [entry["id"] for entry in journal_entries.data]
        cash_lines = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .in_("account_code", CASH_ACCOUNTS)\
            .execute()
        
        total_cash = sum(
            float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
            for line in cash_lines.data
        )
        
        return total_cash
        
    except Exception:
        return 0.0

async def calculate_operating_activities(supabase, start_date: str, end_date: str, net_income: float) -> CashFlowSection:
    """Calculate Operating Activities cash flows"""
    items = []
    
    # Start with Net Income
    items.append(CashFlowItem(
        item_name="Lợi nhuận ròng",
        amount=net_income,
        is_inflow=net_income >= 0,
        description="Từ báo cáo Kết quả Kinh doanh"
    ))
    
    # Add depreciation and amortization (simplified - would need more detailed tracking)
    depreciation = await get_depreciation(supabase, start_date, end_date)
    if depreciation > 0:
        items.append(CashFlowItem(
            item_name="Khấu hao và phân bổ",
            amount=depreciation,
            is_inflow=True,
            description="Chi phí không dùng tiền mặt"
        ))
    
    # Changes in current assets and liabilities
    current_asset_changes = await get_current_asset_changes(supabase, start_date, end_date)
    for account, change in current_asset_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change < 0,  # Decrease in assets is cash inflow
                description=f"Thay đổi trong {get_account_name(account)}"
            ))
    
    current_liability_changes = await get_current_liability_changes(supabase, start_date, end_date)
    for account, change in current_liability_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change > 0,  # Increase in liabilities is cash inflow
                description=f"Thay đổi trong {get_account_name(account)}"
            ))
    
    # Calculate subtotal and net cash flow
    subtotal = sum(item.amount for item in items)
    net_cash_flow = sum(
        item.amount if item.is_inflow else -item.amount
        for item in items
    )
    
    return CashFlowSection(
        section_name="Dòng tiền từ hoạt động kinh doanh",
        section_type=CashFlowCategory.OPERATING,
        items=items,
        subtotal=subtotal,
        net_cash_flow=net_cash_flow
    )

async def calculate_investing_activities(supabase, start_date: str, end_date: str) -> CashFlowSection:
    """Calculate Investing Activities cash flows"""
    items = []
    
    # Fixed asset transactions
    fixed_asset_changes = await get_fixed_asset_changes(supabase, start_date, end_date)
    for account, change in fixed_asset_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change < 0,  # Decrease in fixed assets is cash inflow
                description=f"Giao dịch {get_account_name(account)}"
            ))
    
    # Investment transactions
    investment_changes = await get_investment_changes(supabase, start_date, end_date)
    for account, change in investment_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change < 0,  # Decrease in investments is cash inflow
                description=f"Giao dịch {get_account_name(account)}"
            ))
    
    # Calculate subtotal and net cash flow
    subtotal = sum(item.amount for item in items)
    net_cash_flow = sum(
        item.amount if item.is_inflow else -item.amount
        for item in items
    )
    
    return CashFlowSection(
        section_name="Dòng tiền từ hoạt động đầu tư",
        section_type=CashFlowCategory.INVESTING,
        items=items,
        subtotal=subtotal,
        net_cash_flow=net_cash_flow
    )

async def calculate_financing_activities(supabase, start_date: str, end_date: str) -> CashFlowSection:
    """Calculate Financing Activities cash flows"""
    items = []
    
    # Equity transactions
    equity_changes = await get_equity_changes(supabase, start_date, end_date)
    for account, change in equity_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change > 0,  # Increase in equity is cash inflow
                description=f"Giao dịch {get_account_name(account)}"
            ))
    
    # Long-term debt transactions
    debt_changes = await get_debt_changes(supabase, start_date, end_date)
    for account, change in debt_changes.items():
        if abs(change) > 0.01:  # Only include significant changes
            items.append(CashFlowItem(
                item_name=f"Thay đổi {get_account_name(account)}",
                item_code=account,
                amount=abs(change),
                is_inflow=change > 0,  # Increase in debt is cash inflow
                description=f"Giao dịch {get_account_name(account)}"
            ))
    
    # Calculate subtotal and net cash flow
    subtotal = sum(item.amount for item in items)
    net_cash_flow = sum(
        item.amount if item.is_inflow else -item.amount
        for item in items
    )
    
    return CashFlowSection(
        section_name="Dòng tiền từ hoạt động tài chính",
        section_type=CashFlowCategory.FINANCING,
        items=items,
        subtotal=subtotal,
        net_cash_flow=net_cash_flow
    )

# Helper functions for calculating changes in account balances
async def get_depreciation(supabase, start_date: str, end_date: str) -> float:
    """Get depreciation and amortization (simplified)"""
    # This would need more detailed tracking of depreciation entries
    # For now, return 0
    return 0.0

async def get_current_asset_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in current asset accounts"""
    changes = {}
    
    for account in OPERATING_ACCOUNTS["current_assets"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_current_liability_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in current liability accounts"""
    changes = {}
    
    for account in OPERATING_ACCOUNTS["current_liabilities"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_fixed_asset_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in fixed asset accounts"""
    changes = {}
    
    for account in INVESTING_ACCOUNTS["fixed_assets"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_investment_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in investment accounts"""
    changes = {}
    
    for account in INVESTING_ACCOUNTS["investments"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_equity_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in equity accounts"""
    changes = {}
    
    for account in FINANCING_ACCOUNTS["equity"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_debt_changes(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Get changes in debt accounts"""
    changes = {}
    
    for account in FINANCING_ACCOUNTS["long_term_debt"]:
        beginning_balance = await get_account_balance(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_account_balance(supabase, account_code: str, date_str: str, is_beginning: bool = False) -> float:
    """Get account balance at a specific date"""
    try:
        # Get all journal entries up to the date
        query = supabase.table("journal_entries")\
            .select("id")\
            .eq("status", "posted")
        
        if is_beginning:
            query = query.lt("entry_date", date_str)
        else:
            query = query.lte("entry_date", date_str)
        
        journal_entries = query.execute()
        
        if not journal_entries.data:
            return 0.0
        
        # Get account balance
        entry_ids = [entry["id"] for entry in journal_entries.data]
        account_lines = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .eq("account_code", account_code)\
            .execute()
        
        # Calculate balance (assets: debit - credit, liabilities/equity: credit - debit)
        if account_code.startswith(("1", "2")):  # Assets
            balance = sum(
                float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
                for line in account_lines.data
            )
        else:  # Liabilities and Equity
            balance = sum(
                float(line["credit_amount"] or 0) - float(line["debit_amount"] or 0)
                for line in account_lines.data
            )
        
        return balance
        
    except Exception:
        return 0.0

async def get_transaction_counts(supabase, start_date: str, end_date: str) -> tuple[int, int]:
    """Get total transaction and journal entry counts"""
    try:
        # Get journal entries count
        journal_entries = supabase.table("journal_entries")\
            .select("id")\
            .gte("entry_date", start_date)\
            .lte("entry_date", end_date)\
            .eq("status", "posted")\
            .execute()
        
        return len(journal_entries.data), len(journal_entries.data)
        
    except Exception:
        return 0, 0

def get_account_name(account_code: str) -> str:
    """Get human-readable account name"""
    account_names = {
        "101": "Tiền mặt",
        "102": "Tiền gửi ngân hàng",
        "131": "Phải thu khách hàng",
        "133": "Phải thu khác",
        "152": "Hàng tồn kho",
        "211": "Tài sản cố định hữu hình",
        "213": "Tài sản cố định vô hình",
        "217": "Tài sản cố định thuê tài chính",
        "331": "Phải trả nhà cung cấp",
        "333": "Thuế và các khoản phải nộp nhà nước",
        "334": "Phải trả người lao động",
        "338": "Phải trả, phải nộp khác",
        "341": "Vay dài hạn",
        "342": "Nợ dài hạn khác",
        "411": "Vốn đầu tư của chủ sở hữu",
        "412": "Thặng dư vốn cổ phần",
        "413": "Vốn khác của chủ sở hữu",
        "421": "Lợi nhuận chưa phân phối",
        "511": "Doanh thu bán hàng",
        "512": "Doanh thu cung cấp dịch vụ",
        "515": "Doanh thu hoạt động tài chính",
        "632": "Giá vốn hàng bán",
        "641": "Chi phí bán hàng",
        "642": "Chi phí quản lý doanh nghiệp",
        "635": "Chi phí tài chính"
    }
    
    return account_names.get(account_code, f"Tài khoản {account_code}")
