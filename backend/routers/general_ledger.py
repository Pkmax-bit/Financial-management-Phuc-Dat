"""
General Ledger Report Router
Handles general ledger report generation with journal entries and account balances
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/general-ledger")
async def get_general_ledger(
    start_date: date = Query(..., description="Start date for general ledger"),
    end_date: date = Query(..., description="End date for general ledger"),
    account_code: Optional[str] = Query(None, description="Filter by specific account code"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate General Ledger report
    
    This endpoint:
    1. Retrieves journal entries within date range
    2. Calculates account balances
    3. Provides detailed transaction history
    4. Supports filtering by account code
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get journal entries
        journal_entries = await get_journal_entries(supabase, start_date_str, end_date_str, account_code)
        
        # Get account balances
        account_balances = await get_account_balances(supabase, start_date_str, end_date_str)
        
        # Calculate summary
        total_entries = len(journal_entries)
        total_debit = sum(entry["total_debit"] for entry in journal_entries)
        total_credit = sum(entry["total_credit"] for entry in journal_entries)
        
        # Create general ledger report
        general_ledger = {
            "report_period": f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}",
            "start_date": start_date,
            "end_date": end_date,
            "currency": "VND",
            "generated_at": datetime.now(),
            
            # Journal entries
            "journal_entries": journal_entries,
            "total_entries": total_entries,
            
            # Account balances
            "account_balances": account_balances,
            "total_accounts": len(account_balances),
            
            # Summary
            "summary": {
                "total_entries": total_entries,
                "total_debit": total_debit,
                "total_credit": total_credit,
                "balance_check": abs(total_debit - total_credit) < 0.01  # Allow for small rounding differences
            }
        }
        
        return general_ledger
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate General Ledger: {str(e)}"
        )

async def get_journal_entries(supabase, start_date: str, end_date: str, account_code: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get journal entries within date range"""
    
    # Build query
    query = supabase.table("journal_entries")\
        .select("*, journal_entry_lines(*)")\
        .gte("entry_date", start_date)\
        .lte("entry_date", end_date)
    
    # Add account filter if specified
    if account_code:
        query = query.eq("journal_entry_lines.account_code", account_code)
    
    result = query.execute()
    
    # Format journal entries
    journal_entries = []
    for entry in result.data:
        # Calculate totals from lines
        total_debit = sum(float(line.get("debit_amount", 0) or 0) for line in entry.get("journal_entry_lines", []))
        total_credit = sum(float(line.get("credit_amount", 0) or 0) for line in entry.get("journal_entry_lines", []))
        
        journal_entries.append({
            "entry_id": entry["id"],
            "entry_number": entry["entry_number"],
            "entry_date": entry["entry_date"],
            "description": entry["description"],
            "transaction_type": entry["transaction_type"],
            "status": entry["status"],
            "total_debit": total_debit,
            "total_credit": total_credit,
            "lines": entry.get("journal_entry_lines", [])
        })
    
    return journal_entries

async def get_account_balances(supabase, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Get account balances"""
    
    # Get all journal entry lines in date range
    lines = supabase.table("journal_entry_lines")\
        .select("account_code, account_name, debit_amount, credit_amount")\
        .gte("created_at", start_date)\
        .lte("created_at", end_date)\
        .execute()
    
    # Group by account and calculate balances
    account_totals = {}
    for line in lines.data:
        account_code = line["account_code"]
        if account_code not in account_totals:
            account_totals[account_code] = {
                "account_code": account_code,
                "account_name": line["account_name"],
                "total_debit": 0,
                "total_credit": 0,
                "balance": 0
            }
        
        account_totals[account_code]["total_debit"] += float(line.get("debit_amount", 0) or 0)
        account_totals[account_code]["total_credit"] += float(line.get("credit_amount", 0) or 0)
    
    # Calculate balances
    account_balances = []
    for account_code, totals in account_totals.items():
        balance = totals["total_debit"] - totals["total_credit"]
        totals["balance"] = balance
        account_balances.append(totals)
    
    # Sort by account code
    account_balances.sort(key=lambda x: x["account_code"])
    
    return account_balances