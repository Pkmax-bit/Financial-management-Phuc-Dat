"""
Drill-Down Reports Router
Handles detailed transaction drill-down functionality for all reports
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta

from models.user import User
from models.drill_down import (
    DrillDownReport,
    DrillDownRequest,
    DrillDownResponse,
    DrillDownTransaction,
    DrillDownSummary,
    ReportType,
    TransactionType
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/report-details", response_model=DrillDownResponse)
async def get_report_details(
    report_type: str = Query(..., description="Type of report (pnl, balance-sheet, ar-aging, etc.)"),
    account_id: str = Query(..., description="Account ID or code to drill down into"),
    start_date: Optional[date] = Query(None, description="Start date for period reports"),
    end_date: Optional[date] = Query(None, description="End date for period reports"),
    as_of_date: Optional[date] = Query(None, description="As of date for balance sheet reports"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of transactions to return"),
    offset: int = Query(0, ge=0, description="Number of transactions to skip"),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed transactions for a specific account in a report
    
    This endpoint provides drill-down functionality for all financial reports.
    Users can click on any summary number to see the underlying transactions.
    """
    try:
        # Validate report type
        try:
            report_type_enum = ReportType(report_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report type: {report_type}. Valid types: {[t.value for t in ReportType]}"
            )
        
        supabase = get_supabase_client()
        
        # Get account information
        account_info = await get_account_info(supabase, account_id)
        if not account_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account not found: {account_id}"
            )
        
        # Determine date range based on report type
        date_range = determine_date_range(report_type_enum, start_date, end_date, as_of_date)
        
        # Get transactions based on report type
        transactions = await get_transactions_for_report(
            supabase, 
            report_type_enum, 
            account_id, 
            date_range,
            limit,
            offset
        )
        
        # Calculate summary
        summary = calculate_drill_down_summary(transactions, account_info, date_range)
        
        # Create report
        report = DrillDownReport(
            report_type=report_type_enum,
            account_id=account_id,
            account_code=account_info["account_code"],
            account_name=account_info["account_name"],
            start_date=date_range.get("start_date"),
            end_date=date_range.get("end_date"),
            as_of_date=date_range.get("as_of_date"),
            currency="VND",
            generated_at=datetime.now(),
            summary=summary,
            transactions=transactions,
            report_title=f"Chi tiết giao dịch - {account_info['account_name']}",
            report_description=f"Danh sách các giao dịch chi tiết cho tài khoản {account_info['account_code']} - {account_info['account_name']}"
        )
        
        return DrillDownResponse(
            success=True,
            data=report,
            total_count=len(transactions),
            has_more=len(transactions) == limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate drill-down report: {str(e)}"
        )

async def get_account_info(supabase, account_id: str) -> Optional[Dict[str, Any]]:
    """Get account information by ID or code"""
    try:
        # Try to get account from journal_entry_lines (most common case)
        result = supabase.table("journal_entry_lines")\
            .select("account_code, account_name")\
            .eq("account_code", account_id)\
            .limit(1)\
            .execute()
        
        if result.data:
            return {
                "account_code": result.data[0]["account_code"],
                "account_name": result.data[0]["account_name"]
            }
        
        # If not found, try other tables or return default
        return {
            "account_code": account_id,
            "account_name": f"Tài khoản {account_id}"
        }
        
    except Exception:
        return {
            "account_code": account_id,
            "account_name": f"Tài khoản {account_id}"
        }

def determine_date_range(report_type: ReportType, start_date: Optional[date], 
                        end_date: Optional[date], as_of_date: Optional[date]) -> Dict[str, Any]:
    """Determine the appropriate date range based on report type"""
    if report_type == ReportType.BALANCE_SHEET:
        # For balance sheet, use as_of_date or today
        target_date = as_of_date or date.today()
        return {
            "as_of_date": target_date,
            "start_date": None,
            "end_date": target_date
        }
    else:
        # For period reports (P&L, etc.), use start_date and end_date
        if not start_date or not end_date:
            # Default to last 30 days if not specified
            end_date = end_date or date.today()
            start_date = start_date or (end_date - timedelta(days=30))
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "as_of_date": None
        }

async def get_transactions_for_report(supabase, report_type: ReportType, account_id: str, 
                                    date_range: Dict[str, Any], limit: int, offset: int) -> List[DrillDownTransaction]:
    """Get transactions for a specific report type and account"""
    
    if report_type == ReportType.BALANCE_SHEET:
        return await get_balance_sheet_transactions(supabase, account_id, date_range, limit, offset)
    elif report_type == ReportType.PNL:
        return await get_pnl_transactions(supabase, account_id, date_range, limit, offset)
    else:
        # For other report types, use general journal entry approach
        return await get_general_transactions(supabase, account_id, date_range, limit, offset)

async def get_balance_sheet_transactions(supabase, account_id: str, date_range: Dict[str, Any], 
                                       limit: int, offset: int) -> List[DrillDownTransaction]:
    """Get transactions for balance sheet drill-down"""
    as_of_date = date_range["as_of_date"]
    
    # Get journal entries up to as_of_date
    journal_entries = supabase.table("journal_entries")\
        .select("id, entry_number, entry_date, description, transaction_type, transaction_id, status, created_at")\
        .lte("entry_date", as_of_date.isoformat())\
        .eq("status", "posted")\
        .order("entry_date", desc=True)\
        .limit(limit)\
        .offset(offset)\
        .execute()
    
    if not journal_entries.data:
        return []
    
    # Get journal entry lines for the account
    entry_ids = [entry["id"] for entry in journal_entries.data]
    journal_lines = supabase.table("journal_entry_lines")\
        .select("*")\
        .in_("entry_id", entry_ids)\
        .eq("account_code", account_id)\
        .execute()
    
    # Create transaction objects
    transactions = []
    for line in journal_lines.data:
        # Find the corresponding journal entry
        entry = next((e for e in journal_entries.data if e["id"] == line["entry_id"]), None)
        if not entry:
            continue
            
        transaction = DrillDownTransaction(
            transaction_id=entry["transaction_id"],
            transaction_type=TransactionType.JOURNAL_ENTRY,
            transaction_number=entry["entry_number"],
            transaction_date=datetime.fromisoformat(entry["entry_date"].replace('Z', '+00:00')).date(),
            description=line.get("description") or entry["description"],
            reference=line.get("reference_id"),
            amount=float(line["debit_amount"] or 0) + float(line["credit_amount"] or 0),
            debit_amount=float(line["debit_amount"] or 0),
            credit_amount=float(line["credit_amount"] or 0),
            account_code=line["account_code"],
            account_name=line["account_name"],
            status=entry["status"],
            created_at=datetime.fromisoformat(entry["created_at"].replace('Z', '+00:00'))
        )
        transactions.append(transaction)
    
    return transactions

async def get_pnl_transactions(supabase, account_id: str, date_range: Dict[str, Any], 
                             limit: int, offset: int) -> List[DrillDownTransaction]:
    """Get transactions for P&L drill-down"""
    start_date = date_range["start_date"]
    end_date = date_range["end_date"]
    
    # Get journal entries in date range
    journal_entries = supabase.table("journal_entries")\
        .select("id, entry_number, entry_date, description, transaction_type, transaction_id, status, created_at")\
        .gte("entry_date", start_date.isoformat())\
        .lte("entry_date", end_date.isoformat())\
        .eq("status", "posted")\
        .order("entry_date", desc=True)\
        .limit(limit)\
        .offset(offset)\
        .execute()
    
    if not journal_entries.data:
        return []
    
    # Get journal entry lines for the account
    entry_ids = [entry["id"] for entry in journal_entries.data]
    journal_lines = supabase.table("journal_entry_lines")\
        .select("*")\
        .in_("entry_id", entry_ids)\
        .eq("account_code", account_id)\
        .execute()
    
    # Create transaction objects
    transactions = []
    for line in journal_lines.data:
        # Find the corresponding journal entry
        entry = next((e for e in journal_entries.data if e["id"] == line["entry_id"]), None)
        if not entry:
            continue
            
        # Determine transaction type based on journal entry type
        transaction_type = determine_transaction_type(entry["transaction_type"])
        
        transaction = DrillDownTransaction(
            transaction_id=entry["transaction_id"],
            transaction_type=transaction_type,
            transaction_number=entry["entry_number"],
            transaction_date=datetime.fromisoformat(entry["entry_date"].replace('Z', '+00:00')).date(),
            description=line.get("description") or entry["description"],
            reference=line.get("reference_id"),
            amount=float(line["debit_amount"] or 0) + float(line["credit_amount"] or 0),
            debit_amount=float(line["debit_amount"] or 0),
            credit_amount=float(line["credit_amount"] or 0),
            account_code=line["account_code"],
            account_name=line["account_name"],
            status=entry["status"],
            created_at=datetime.fromisoformat(entry["created_at"].replace('Z', '+00:00'))
        )
        transactions.append(transaction)
    
    return transactions

async def get_general_transactions(supabase, account_id: str, date_range: Dict[str, Any], 
                                 limit: int, offset: int) -> List[DrillDownTransaction]:
    """Get transactions for general drill-down (fallback method)"""
    start_date = date_range.get("start_date")
    end_date = date_range.get("end_date")
    
    # Build query based on available dates
    query = supabase.table("journal_entries")\
        .select("id, entry_number, entry_date, description, transaction_type, transaction_id, status, created_at")\
        .eq("status", "posted")
    
    if start_date:
        query = query.gte("entry_date", start_date.isoformat())
    if end_date:
        query = query.lte("entry_date", end_date.isoformat())
    
    journal_entries = query.order("entry_date", desc=True)\
        .limit(limit)\
        .offset(offset)\
        .execute()
    
    if not journal_entries.data:
        return []
    
    # Get journal entry lines for the account
    entry_ids = [entry["id"] for entry in journal_entries.data]
    journal_lines = supabase.table("journal_entry_lines")\
        .select("*")\
        .in_("entry_id", entry_ids)\
        .eq("account_code", account_id)\
        .execute()
    
    # Create transaction objects
    transactions = []
    for line in journal_lines.data:
        # Find the corresponding journal entry
        entry = next((e for e in journal_entries.data if e["id"] == line["entry_id"]), None)
        if not entry:
            continue
            
        transaction_type = determine_transaction_type(entry["transaction_type"])
        
        transaction = DrillDownTransaction(
            transaction_id=entry["transaction_id"],
            transaction_type=transaction_type,
            transaction_number=entry["entry_number"],
            transaction_date=datetime.fromisoformat(entry["entry_date"].replace('Z', '+00:00')).date(),
            description=line.get("description") or entry["description"],
            reference=line.get("reference_id"),
            amount=float(line["debit_amount"] or 0) + float(line["credit_amount"] or 0),
            debit_amount=float(line["debit_amount"] or 0),
            credit_amount=float(line["credit_amount"] or 0),
            account_code=line["account_code"],
            account_name=line["account_name"],
            status=entry["status"],
            created_at=datetime.fromisoformat(entry["created_at"].replace('Z', '+00:00'))
        )
        transactions.append(transaction)
    
    return transactions

def determine_transaction_type(transaction_type: str) -> TransactionType:
    """Determine the transaction type enum from string"""
    type_mapping = {
        "invoice": TransactionType.INVOICE,
        "payment": TransactionType.PAYMENT,
        "sales_receipt": TransactionType.SALES_RECEIPT,
        "credit_memo": TransactionType.CREDIT_MEMO,
        "expense": TransactionType.EXPENSE,
        "bill": TransactionType.BILL,
        "bill_payment": TransactionType.BILL_PAYMENT,
        "journal_entry": TransactionType.JOURNAL_ENTRY,
        "purchase_order": TransactionType.PURCHASE_ORDER,
        "expense_claim": TransactionType.EXPENSE_CLAIM,
    }
    
    return type_mapping.get(transaction_type, TransactionType.JOURNAL_ENTRY)

def calculate_drill_down_summary(transactions: List[DrillDownTransaction], 
                               account_info: Dict[str, Any], date_range: Dict[str, Any]) -> DrillDownSummary:
    """Calculate summary statistics for drill-down results"""
    total_amount = sum(t.amount for t in transactions)
    total_debit = sum(t.debit_amount for t in transactions)
    total_credit = sum(t.credit_amount for t in transactions)
    
    # Create date range string
    if date_range.get("as_of_date"):
        date_range_str = f"Tính đến ngày {date_range['as_of_date'].strftime('%d/%m/%Y')}"
    elif date_range.get("start_date") and date_range.get("end_date"):
        date_range_str = f"Từ {date_range['start_date'].strftime('%d/%m/%Y')} đến {date_range['end_date'].strftime('%d/%m/%Y')}"
    else:
        date_range_str = "Tất cả thời gian"
    
    return DrillDownSummary(
        total_transactions=len(transactions),
        total_amount=total_amount,
        total_debit=total_debit,
        total_credit=total_credit,
        date_range=date_range_str,
        account_info=account_info
    )
