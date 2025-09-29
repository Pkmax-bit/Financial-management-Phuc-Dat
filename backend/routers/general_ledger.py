"""
General Ledger Report Router
Handles chronological transaction records from JournalEntries
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from collections import defaultdict

from models.user import User
from models.general_ledger import (
    GeneralLedgerReport,
    GeneralLedgerRequest,
    GeneralLedgerSummary,
    GeneralLedgerEntry,
    JournalEntry,
    AccountBalance,
    GeneralLedgerAnalysis
)
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/general-ledger", response_model=GeneralLedgerReport)
async def get_general_ledger(
    start_date: date = Query(..., description="Start date for general ledger"),
    end_date: date = Query(..., description="End date for general ledger"),
    account_id: Optional[str] = Query(None, description="Filter by specific account ID"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    include_running_balance: bool = Query(True, description="Include running balance calculations"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive General Ledger report
    
    This endpoint:
    1. Queries JournalEntries table for all transactions in the period
    2. Sorts results by date and transaction_id
    3. Calculates running balances for each account
    4. Provides detailed transaction records with account information
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get journal entries with account information
        journal_entries = await get_journal_entries_with_accounts(
            supabase, start_date_str, end_date_str, account_id, transaction_type
        )
        
        # Sort by date and transaction_id
        journal_entries.sort(key=lambda x: (x.date, x.transaction_id, x.id))
        
        # Calculate running balances if requested
        ledger_entries = []
        if include_running_balance:
            ledger_entries = await calculate_running_balances(journal_entries)
        else:
            ledger_entries = [
                GeneralLedgerEntry(
                    journal_entry=entry,
                    running_balance=0.0,
                    balance_type="Debit"
                )
                for entry in journal_entries
            ]
        
        # Calculate summary statistics
        total_debits = sum(entry.journal_entry.debit_amount for entry in ledger_entries)
        total_credits = sum(entry.journal_entry.credit_amount for entry in ledger_entries)
        balance_check = abs(total_debits - total_credits) < 0.01  # Allow for small rounding differences
        
        # Get account summary
        account_summary = await get_account_summary(ledger_entries)
        
        # Create final report
        report = GeneralLedgerReport(
            report_period=f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now(),
            
            total_entries=len(ledger_entries),
            total_debits=total_debits,
            total_credits=total_credits,
            balance_check=balance_check,
            
            ledger_entries=ledger_entries,
            account_summary=account_summary
        )
        
        return report
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate General Ledger report: {str(e)}"
        )

@router.get("/general-ledger/summary", response_model=GeneralLedgerSummary)
async def get_general_ledger_summary(
    start_date: date = Query(..., description="Start date for general ledger summary"),
    end_date: date = Query(..., description="End date for general ledger summary"),
    current_user: User = Depends(get_current_user)
):
    """Get simplified General Ledger summary for dashboard"""
    try:
        # Get full report first
        full_report = await get_general_ledger(start_date, end_date, None, None, False, current_user)
        
        # Get unique accounts and transactions
        unique_accounts = len(set(entry.journal_entry.account_id for entry in full_report.ledger_entries))
        unique_transactions = len(set(entry.journal_entry.transaction_id for entry in full_report.ledger_entries))
        
        summary = GeneralLedgerSummary(
            period=full_report.report_period,
            total_entries=full_report.total_entries,
            total_debits=full_report.total_debits,
            total_credits=full_report.total_credits,
            balance_check=full_report.balance_check,
            unique_accounts=unique_accounts,
            unique_transactions=unique_transactions,
            currency=full_report.currency
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate General Ledger summary: {str(e)}"
        )

@router.get("/general-ledger/analysis", response_model=GeneralLedgerAnalysis)
async def get_general_ledger_analysis(
    start_date: date = Query(..., description="Start date for general ledger analysis"),
    end_date: date = Query(..., description="End date for general ledger analysis"),
    current_user: User = Depends(get_current_user)
):
    """Get advanced analysis of General Ledger"""
    try:
        # Get full report first
        full_report = await get_general_ledger(start_date, end_date, None, None, True, current_user)
        
        # Calculate account balances
        account_balances = await calculate_account_balances(full_report.ledger_entries)
        
        # Transaction type summary
        transaction_type_summary = defaultdict(int)
        for entry in full_report.ledger_entries:
            transaction_type_summary[entry.journal_entry.transaction_type] += 1
        
        # Daily activity
        daily_activity = await calculate_daily_activity(full_report.ledger_entries)
        
        # Balance analysis
        balance_difference = full_report.total_debits - full_report.total_credits
        is_balanced = abs(balance_difference) < 0.01
        
        # Most active accounts
        most_active_accounts = await get_most_active_accounts(full_report.ledger_entries)
        
        # Largest transactions
        largest_transactions = await get_largest_transactions(full_report.ledger_entries)
        
        analysis = GeneralLedgerAnalysis(
            account_balances=account_balances,
            transaction_type_summary=dict(transaction_type_summary),
            daily_activity=daily_activity,
            total_debits=full_report.total_debits,
            total_credits=full_report.total_credits,
            balance_difference=balance_difference,
            is_balanced=is_balanced,
            most_active_accounts=most_active_accounts,
            largest_transactions=largest_transactions
        )
        
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate General Ledger analysis: {str(e)}"
        )

async def get_journal_entries_with_accounts(
    supabase, 
    start_date: str, 
    end_date: str, 
    account_id: Optional[str] = None,
    transaction_type: Optional[str] = None
) -> List[JournalEntry]:
    """Get journal entries with account information"""
    try:
        # Build query
        query = supabase.table("journal_entries")\
            .select("""
                id,
                transaction_id,
                transaction_type,
                date,
                account_id,
                description,
                reference_number,
                debit_amount,
                credit_amount,
                created_at,
                created_by,
                accounts!inner(
                    id,
                    account_code,
                    account_name,
                    account_type
                )
            """)\
            .gte("date", start_date)\
            .lte("date", end_date)\
            .order("date")\
            .order("transaction_id")\
            .order("id")
        
        # Apply filters
        if account_id:
            query = query.eq("account_id", account_id)
        if transaction_type:
            query = query.eq("transaction_type", transaction_type)
        
        result = query.execute()
        
        journal_entries = []
        for row in result.data:
            account = row.get("accounts", {})
            journal_entry = JournalEntry(
                id=row["id"],
                transaction_id=row["transaction_id"],
                transaction_type=row["transaction_type"],
                date=datetime.fromisoformat(row["date"].replace('Z', '+00:00')).date(),
                account_id=row["account_id"],
                account_code=account.get("account_code", ""),
                account_name=account.get("account_name", ""),
                account_type=account.get("account_type", ""),
                description=row.get("description", ""),
                reference_number=row.get("reference_number"),
                debit_amount=float(row.get("debit_amount", 0)),
                credit_amount=float(row.get("credit_amount", 0)),
                currency="VND",
                created_at=datetime.fromisoformat(row["created_at"].replace('Z', '+00:00')),
                created_by=row.get("created_by")
            )
            journal_entries.append(journal_entry)
        
        return journal_entries
        
    except Exception as e:
        print(f"Error getting journal entries: {str(e)}")
        return []

async def calculate_running_balances(journal_entries: List[JournalEntry]) -> List[GeneralLedgerEntry]:
    """Calculate running balances for each account"""
    account_balances = defaultdict(float)  # Track balance for each account
    ledger_entries = []
    
    for entry in journal_entries:
        # Update account balance
        account_balances[entry.account_id] += entry.debit_amount - entry.credit_amount
        
        # Determine balance type
        balance = account_balances[entry.account_id]
        balance_type = "Debit" if balance >= 0 else "Credit"
        
        # Create ledger entry
        ledger_entry = GeneralLedgerEntry(
            journal_entry=entry,
            running_balance=abs(balance),
            balance_type=balance_type
        )
        ledger_entries.append(ledger_entry)
    
    return ledger_entries

async def get_account_summary(ledger_entries: List[GeneralLedgerEntry]) -> List[Dict[str, Any]]:
    """Get summary statistics by account"""
    account_stats = defaultdict(lambda: {
        "account_id": "",
        "account_code": "",
        "account_name": "",
        "account_type": "",
        "total_debits": 0.0,
        "total_credits": 0.0,
        "transaction_count": 0,
        "ending_balance": 0.0
    })
    
    for entry in ledger_entries:
        je = entry.journal_entry
        account_id = je.account_id
        
        if account_stats[account_id]["account_id"] == "":
            account_stats[account_id].update({
                "account_id": account_id,
                "account_code": je.account_code,
                "account_name": je.account_name,
                "account_type": je.account_type
            })
        
        account_stats[account_id]["total_debits"] += je.debit_amount
        account_stats[account_id]["total_credits"] += je.credit_amount
        account_stats[account_id]["transaction_count"] += 1
        account_stats[account_id]["ending_balance"] = entry.running_balance
    
    return list(account_stats.values())

async def calculate_account_balances(ledger_entries: List[GeneralLedgerEntry]) -> List[AccountBalance]:
    """Calculate detailed account balances"""
    account_data = defaultdict(lambda: {
        "account_id": "",
        "account_code": "",
        "account_name": "",
        "account_type": "",
        "beginning_balance": 0.0,
        "total_debits": 0.0,
        "total_credits": 0.0,
        "transaction_count": 0
    })
    
    # Process all entries
    for entry in ledger_entries:
        je = entry.journal_entry
        account_id = je.account_id
        
        if account_data[account_id]["account_id"] == "":
            account_data[account_id].update({
                "account_id": account_id,
                "account_code": je.account_code,
                "account_name": je.account_name,
                "account_type": je.account_type
            })
        
        account_data[account_id]["total_debits"] += je.debit_amount
        account_data[account_id]["total_credits"] += je.credit_amount
        account_data[account_id]["transaction_count"] += 1
    
    # Create AccountBalance objects
    account_balances = []
    for account_id, data in account_data.items():
        ending_balance = data["total_debits"] - data["total_credits"]
        balance_type = "Debit" if ending_balance >= 0 else "Credit"
        
        balance = AccountBalance(
            account_id=account_id,
            account_code=data["account_code"],
            account_name=data["account_name"],
            account_type=data["account_type"],
            beginning_balance=0.0,  # Would need historical data to calculate
            total_debits=data["total_debits"],
            total_credits=data["total_credits"],
            ending_balance=abs(ending_balance),
            balance_type=balance_type,
            transaction_count=data["transaction_count"]
        )
        account_balances.append(balance)
    
    return account_balances

async def calculate_daily_activity(ledger_entries: List[GeneralLedgerEntry]) -> List[Dict[str, Any]]:
    """Calculate daily transaction activity"""
    daily_stats = defaultdict(lambda: {
        "date": "",
        "transaction_count": 0,
        "total_debits": 0.0,
        "total_credits": 0.0,
        "unique_transactions": set()
    })
    
    for entry in ledger_entries:
        je = entry.journal_entry
        date_str = je.date.isoformat()
        
        daily_stats[date_str]["date"] = date_str
        daily_stats[date_str]["transaction_count"] += 1
        daily_stats[date_str]["total_debits"] += je.debit_amount
        daily_stats[date_str]["total_credits"] += je.credit_amount
        daily_stats[date_str]["unique_transactions"].add(je.transaction_id)
    
    # Convert to list and calculate unique transaction counts
    daily_activity = []
    for date_str, stats in daily_stats.items():
        daily_activity.append({
            "date": stats["date"],
            "transaction_count": stats["transaction_count"],
            "total_debits": stats["total_debits"],
            "total_credits": stats["total_credits"],
            "unique_transactions": len(stats["unique_transactions"])
        })
    
    return sorted(daily_activity, key=lambda x: x["date"])

async def get_most_active_accounts(ledger_entries: List[GeneralLedgerEntry], limit: int = 10) -> List[Dict[str, Any]]:
    """Get most active accounts by transaction count"""
    account_activity = defaultdict(lambda: {
        "account_id": "",
        "account_code": "",
        "account_name": "",
        "account_type": "",
        "transaction_count": 0,
        "total_amount": 0.0
    })
    
    for entry in ledger_entries:
        je = entry.journal_entry
        account_id = je.account_id
        
        if account_activity[account_id]["account_id"] == "":
            account_activity[account_id].update({
                "account_id": account_id,
                "account_code": je.account_code,
                "account_name": je.account_name,
                "account_type": je.account_type
            })
        
        account_activity[account_id]["transaction_count"] += 1
        account_activity[account_id]["total_amount"] += je.debit_amount + je.credit_amount
    
    # Sort by transaction count and return top accounts
    sorted_accounts = sorted(
        account_activity.values(),
        key=lambda x: x["transaction_count"],
        reverse=True
    )
    
    return sorted_accounts[:limit]

async def get_largest_transactions(ledger_entries: List[GeneralLedgerEntry], limit: int = 10) -> List[Dict[str, Any]]:
    """Get largest transactions by amount"""
    transaction_amounts = defaultdict(lambda: {
        "transaction_id": "",
        "transaction_type": "",
        "date": "",
        "description": "",
        "total_amount": 0.0,
        "entry_count": 0
    })
    
    for entry in ledger_entries:
        je = entry.journal_entry
        transaction_id = je.transaction_id
        
        if transaction_amounts[transaction_id]["transaction_id"] == "":
            transaction_amounts[transaction_id].update({
                "transaction_id": transaction_id,
                "transaction_type": je.transaction_type,
                "date": je.date.isoformat(),
                "description": je.description
            })
        
        transaction_amounts[transaction_id]["total_amount"] += je.debit_amount + je.credit_amount
        transaction_amounts[transaction_id]["entry_count"] += 1
    
    # Sort by total amount and return largest transactions
    sorted_transactions = sorted(
        transaction_amounts.values(),
        key=lambda x: x["total_amount"],
        reverse=True
    )
    
    return sorted_transactions[:limit]
