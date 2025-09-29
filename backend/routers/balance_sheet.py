"""
Balance Sheet Reports Router
Handles comprehensive Balance Sheet statement generation and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

from models.user import User
from models.balance_sheet import (
    BalanceSheetReport, 
    BalanceSheetRequest, 
    BalanceSheetSummary,
    BalanceSheetSection,
    BalanceSheetAccount,
    AccountCategory,
    AssetType,
    LiabilityType,
    EquityType
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

# Chart of Accounts mapping for Balance Sheet classification
BALANCE_SHEET_CLASSIFICATION = {
    # Assets (Tài sản) - 1xx, 2xx series
    "101": {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Tiền mặt"},
    "102": {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Tiền gửi ngân hàng"},
    "131": {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Phải thu khách hàng"},
    "133": {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Phải thu khác"},
    "152": {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Hàng tồn kho"},
    "211": {"category": AccountCategory.ASSET, "type": AssetType.FIXED_ASSET, "name": "Tài sản cố định hữu hình"},
    "213": {"category": AccountCategory.ASSET, "type": AssetType.FIXED_ASSET, "name": "Tài sản cố định vô hình"},
    "217": {"category": AccountCategory.ASSET, "type": AssetType.FIXED_ASSET, "name": "Tài sản cố định thuê tài chính"},
    
    # Liabilities (Nợ phải trả) - 3xx series
    "331": {"category": AccountCategory.LIABILITY, "type": LiabilityType.CURRENT_LIABILITY, "name": "Phải trả nhà cung cấp"},
    "333": {"category": AccountCategory.LIABILITY, "type": LiabilityType.CURRENT_LIABILITY, "name": "Thuế và các khoản phải nộp nhà nước"},
    "334": {"category": AccountCategory.LIABILITY, "type": LiabilityType.CURRENT_LIABILITY, "name": "Phải trả người lao động"},
    "338": {"category": AccountCategory.LIABILITY, "type": LiabilityType.CURRENT_LIABILITY, "name": "Phải trả, phải nộp khác"},
    "341": {"category": AccountCategory.LIABILITY, "type": LiabilityType.LONG_TERM_LIABILITY, "name": "Vay dài hạn"},
    "342": {"category": AccountCategory.LIABILITY, "type": LiabilityType.LONG_TERM_LIABILITY, "name": "Nợ dài hạn khác"},
    
    # Equity (Vốn chủ sở hữu) - 4xx series
    "411": {"category": AccountCategory.EQUITY, "type": EquityType.OWNER_EQUITY, "name": "Vốn đầu tư của chủ sở hữu"},
    "412": {"category": AccountCategory.EQUITY, "type": EquityType.OWNER_EQUITY, "name": "Thặng dư vốn cổ phần"},
    "413": {"category": AccountCategory.EQUITY, "type": EquityType.OWNER_EQUITY, "name": "Vốn khác của chủ sở hữu"},
    "421": {"category": AccountCategory.EQUITY, "type": EquityType.RETAINED_EARNINGS, "name": "Lợi nhuận chưa phân phối"},
    "422": {"category": AccountCategory.EQUITY, "type": EquityType.RETAINED_EARNINGS, "name": "Các quỹ thuộc vốn chủ sở hữu"},
}

def classify_account(account_code: str) -> Dict[str, Any]:
    """Classify account code into Balance Sheet category"""
    # Check exact match first
    if account_code in BALANCE_SHEET_CLASSIFICATION:
        return BALANCE_SHEET_CLASSIFICATION[account_code]
    
    # Check by prefix for assets (1xx, 2xx)
    if account_code.startswith(("1", "2")):
        if account_code.startswith(("1", "2")) and account_code[1:3] in ["01", "02", "31", "33", "52"]:
            return {"category": AccountCategory.ASSET, "type": AssetType.CURRENT_ASSET, "name": "Tài sản ngắn hạn"}
        elif account_code.startswith(("2")):
            return {"category": AccountCategory.ASSET, "type": AssetType.FIXED_ASSET, "name": "Tài sản dài hạn"}
        else:
            return {"category": AccountCategory.ASSET, "type": AssetType.OTHER_ASSET, "name": "Tài sản khác"}
    
    # Check by prefix for liabilities (3xx)
    if account_code.startswith("3"):
        if account_code[1:3] in ["31", "33", "34", "38"]:
            return {"category": AccountCategory.LIABILITY, "type": LiabilityType.CURRENT_LIABILITY, "name": "Nợ ngắn hạn"}
        elif account_code[1:3] in ["41", "42"]:
            return {"category": AccountCategory.LIABILITY, "type": LiabilityType.LONG_TERM_LIABILITY, "name": "Nợ dài hạn"}
        else:
            return {"category": AccountCategory.LIABILITY, "type": LiabilityType.OTHER_LIABILITY, "name": "Nợ khác"}
    
    # Check by prefix for equity (4xx)
    if account_code.startswith("4"):
        if account_code[1:3] in ["11", "12", "13"]:
            return {"category": AccountCategory.EQUITY, "type": EquityType.OWNER_EQUITY, "name": "Vốn chủ sở hữu"}
        elif account_code[1:3] in ["21", "22"]:
            return {"category": AccountCategory.EQUITY, "type": EquityType.RETAINED_EARNINGS, "name": "Lợi nhuận giữ lại"}
        else:
            return {"category": AccountCategory.EQUITY, "type": EquityType.OTHER_EQUITY, "name": "Vốn khác"}
    
    # Default classification
    return {"category": AccountCategory.ASSET, "type": AssetType.OTHER_ASSET, "name": "Tài khoản khác"}

@router.get("/balance-sheet", response_model=BalanceSheetReport)
async def get_balance_sheet(
    as_of_date: date = Query(..., description="As of date for Balance Sheet report"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive Balance Sheet statement
    
    This endpoint:
    1. Queries all journal entries from beginning to as_of_date
    2. Classifies accounts into Assets, Liabilities, and Equity
    3. Calculates ending balances for each account
    4. Groups accounts by subcategories
    5. Validates that Assets = Liabilities + Equity
    """
    try:
        supabase = get_supabase_client()
        
        # Convert date to ISO format for database query
        as_of_date_str = as_of_date.isoformat()
        
        # Query all journal entries up to as_of_date
        journal_entries = supabase.table("journal_entries")\
            .select("id, entry_date, description, total_debit, total_credit")\
            .lte("entry_date", as_of_date_str)\
            .eq("status", "posted")\
            .execute()
        
        if not journal_entries.data:
            # Return empty balance sheet if no data
            return create_empty_balance_sheet(as_of_date)
        
        # Query journal entry lines for all entries
        entry_ids = [entry["id"] for entry in journal_entries.data]
        
        journal_lines = supabase.table("journal_entry_lines")\
            .select("entry_id, account_code, account_name, debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .execute()
        
        # Process and calculate account balances
        account_balances = {}
        total_transactions = len(journal_entries.data)
        
        for line in journal_lines.data:
            account_code = line["account_code"]
            account_name = line["account_name"]
            debit_amount = float(line["debit_amount"] or 0)
            credit_amount = float(line["credit_amount"] or 0)
            
            # Initialize account if not exists
            if account_code not in account_balances:
                account_balances[account_code] = {
                    "account_name": account_name,
                    "debit_total": 0.0,
                    "credit_total": 0.0,
                    "balance": 0.0
                }
            
            # Add to totals
            account_balances[account_code]["debit_total"] += debit_amount
            account_balances[account_code]["credit_total"] += credit_amount
        
        # Calculate ending balances for each account
        for account_code, data in account_balances.items():
            # For assets: balance = debit - credit (positive balance)
            # For liabilities/equity: balance = credit - debit (positive balance)
            classification = classify_account(account_code)
            category = classification["category"]
            
            if category == AccountCategory.ASSET:
                # Assets have debit balances
                balance = data["debit_total"] - data["credit_total"]
                data["balance"] = balance
                data["is_debit_balance"] = True
            else:
                # Liabilities and Equity have credit balances
                balance = data["credit_total"] - data["debit_total"]
                data["balance"] = balance
                data["is_debit_balance"] = False
            
            # Add classification info
            data.update(classification)
        
        # Group accounts by categories and subcategories
        assets = []
        current_assets = []
        fixed_assets = []
        other_assets = []
        
        liabilities = []
        current_liabilities = []
        long_term_liabilities = []
        other_liabilities = []
        
        equity = []
        owner_equity = []
        retained_earnings = []
        other_equity = []
        
        # Process each account
        for account_code, data in account_balances.items():
            if data["balance"] == 0:  # Skip zero balance accounts
                continue
                
            account = BalanceSheetAccount(
                account_code=account_code,
                account_name=data["account_name"],
                account_category=data["category"],
                subcategory=data.get("type"),
                balance=abs(data["balance"]),  # Always positive for display
                is_debit_balance=data["is_debit_balance"]
            )
            
            # Categorize accounts
            if data["category"] == AccountCategory.ASSET:
                assets.append(account)
                if data.get("type") == AssetType.CURRENT_ASSET:
                    current_assets.append(account)
                elif data.get("type") == AssetType.FIXED_ASSET:
                    fixed_assets.append(account)
                else:
                    other_assets.append(account)
                    
            elif data["category"] == AccountCategory.LIABILITY:
                liabilities.append(account)
                if data.get("type") == LiabilityType.CURRENT_LIABILITY:
                    current_liabilities.append(account)
                elif data.get("type") == LiabilityType.LONG_TERM_LIABILITY:
                    long_term_liabilities.append(account)
                else:
                    other_liabilities.append(account)
                    
            elif data["category"] == AccountCategory.EQUITY:
                equity.append(account)
                if data.get("type") == EquityType.OWNER_EQUITY:
                    owner_equity.append(account)
                elif data.get("type") == EquityType.RETAINED_EARNINGS:
                    retained_earnings.append(account)
                else:
                    other_equity.append(account)
        
        # Calculate totals
        total_assets = sum(account.balance for account in assets)
        total_liabilities = sum(account.balance for account in liabilities)
        total_equity = sum(account.balance for account in equity)
        total_liabilities_and_equity = total_liabilities + total_equity
        
        # Create sections
        current_assets_section = BalanceSheetSection(
            section_name="Tài sản ngắn hạn",
            section_type="asset",
            accounts=current_assets,
            total_amount=sum(account.balance for account in current_assets)
        )
        
        fixed_assets_section = BalanceSheetSection(
            section_name="Tài sản dài hạn",
            section_type="asset",
            accounts=fixed_assets,
            total_amount=sum(account.balance for account in fixed_assets)
        )
        
        other_assets_section = None
        if other_assets:
            other_assets_section = BalanceSheetSection(
                section_name="Tài sản khác",
                section_type="asset",
                accounts=other_assets,
                total_amount=sum(account.balance for account in other_assets)
            )
        
        current_liabilities_section = BalanceSheetSection(
            section_name="Nợ ngắn hạn",
            section_type="liability",
            accounts=current_liabilities,
            total_amount=sum(account.balance for account in current_liabilities)
        )
        
        long_term_liabilities_section = BalanceSheetSection(
            section_name="Nợ dài hạn",
            section_type="liability",
            accounts=long_term_liabilities,
            total_amount=sum(account.balance for account in long_term_liabilities)
        )
        
        other_liabilities_section = None
        if other_liabilities:
            other_liabilities_section = BalanceSheetSection(
                section_name="Nợ khác",
                section_type="liability",
                accounts=other_liabilities,
                total_amount=sum(account.balance for account in other_liabilities)
            )
        
        owner_equity_section = BalanceSheetSection(
            section_name="Vốn chủ sở hữu",
            section_type="equity",
            accounts=owner_equity,
            total_amount=sum(account.balance for account in owner_equity)
        )
        
        retained_earnings_section = None
        if retained_earnings:
            retained_earnings_section = BalanceSheetSection(
                section_name="Lợi nhuận giữ lại",
                section_type="equity",
                accounts=retained_earnings,
                total_amount=sum(account.balance for account in retained_earnings)
            )
        
        # Validate balance (should be equal)
        is_balanced = abs(total_assets - total_liabilities_and_equity) < 0.01  # Allow for small rounding differences
        
        # Create final report
        report = BalanceSheetReport(
            report_date=as_of_date.strftime('%d/%m/%Y'),
            as_of_date=as_of_date,
            currency="VND",
            generated_at=datetime.now().isoformat(),
            
            total_assets=total_assets,
            current_assets=current_assets_section,
            fixed_assets=fixed_assets_section,
            other_assets=other_assets_section,
            
            total_liabilities=total_liabilities,
            current_liabilities=current_liabilities_section,
            long_term_liabilities=long_term_liabilities_section,
            other_liabilities=other_liabilities_section,
            
            total_equity=total_equity,
            owner_equity=owner_equity_section,
            retained_earnings=retained_earnings_section,
            
            total_liabilities_and_equity=total_liabilities_and_equity,
            is_balanced=is_balanced,
            
            total_accounts=len(account_balances),
            total_journal_entries=len(journal_entries.data),
            total_transactions=total_transactions
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Balance Sheet: {str(e)}"
        )

@router.get("/balance-sheet/summary", response_model=BalanceSheetSummary)
async def get_balance_sheet_summary(
    as_of_date: date = Query(..., description="As of date for Balance Sheet summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified Balance Sheet summary for dashboard"""
    try:
        # Get full report first
        full_report = await get_balance_sheet(as_of_date, current_user)
        
        # Calculate financial ratios
        current_ratio = None
        if full_report.current_liabilities.total_amount > 0:
            current_ratio = full_report.current_assets.total_amount / full_report.current_liabilities.total_amount
        
        debt_to_equity_ratio = None
        if full_report.total_equity > 0:
            debt_to_equity_ratio = full_report.total_liabilities / full_report.total_equity
        
        # Create summary
        summary = BalanceSheetSummary(
            as_of_date=full_report.report_date,
            total_assets=full_report.total_assets,
            total_liabilities=full_report.total_liabilities,
            total_equity=full_report.total_equity,
            is_balanced=full_report.is_balanced,
            current_ratio=current_ratio,
            debt_to_equity_ratio=debt_to_equity_ratio,
            currency=full_report.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Balance Sheet summary: {str(e)}"
        )

def create_empty_balance_sheet(as_of_date: date) -> BalanceSheetReport:
    """Create empty Balance Sheet when no data is available"""
    return BalanceSheetReport(
        report_date=as_of_date.strftime('%d/%m/%Y'),
        as_of_date=as_of_date,
        currency="VND",
        generated_at=datetime.now().isoformat(),
        
        total_assets=0.0,
        current_assets=BalanceSheetSection(
            section_name="Tài sản ngắn hạn",
            section_type="asset",
            accounts=[],
            total_amount=0.0
        ),
        fixed_assets=BalanceSheetSection(
            section_name="Tài sản dài hạn",
            section_type="asset",
            accounts=[],
            total_amount=0.0
        ),
        
        total_liabilities=0.0,
        current_liabilities=BalanceSheetSection(
            section_name="Nợ ngắn hạn",
            section_type="liability",
            accounts=[],
            total_amount=0.0
        ),
        long_term_liabilities=BalanceSheetSection(
            section_name="Nợ dài hạn",
            section_type="liability",
            accounts=[],
            total_amount=0.0
        ),
        
        total_equity=0.0,
        owner_equity=BalanceSheetSection(
            section_name="Vốn chủ sở hữu",
            section_type="equity",
            accounts=[],
            total_amount=0.0
        ),
        
        total_liabilities_and_equity=0.0,
        is_balanced=True,
        
        total_accounts=0,
        total_journal_entries=0,
        total_transactions=0
    )
