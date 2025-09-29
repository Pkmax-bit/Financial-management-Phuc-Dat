"""
Credit Memo Management Router
Handles credit memo creation, application, and refunds
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.credit_memo import (
    CreditMemo, CreditMemoCreate, CreditMemoUpdate, 
    CreditMemoApplication, CreditMemoRefund, CreditMemoStatus
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client
from services.journal_service import journal_service

router = APIRouter(prefix="/api/sales/credit-memos", tags=["credit-memos"])

@router.get("/", response_model=List[CreditMemo])
async def get_credit_memos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all credit memos with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("credit_memos").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"credit_memo_number.ilike.%{search}%,reason.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [CreditMemo(**memo) for memo in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching credit memos: {str(e)}"
        )

@router.get("/{memo_id}", response_model=CreditMemo)
async def get_credit_memo(
    memo_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get credit memo by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("credit_memos").select("*").eq("id", memo_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credit memo not found"
            )
        
        return CreditMemo(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching credit memo: {str(e)}"
        )

@router.post("/", response_model=CreditMemo)
async def create_credit_memo(
    memo_data: CreditMemoCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create new credit memo with journal entries"""
    try:
        supabase = get_supabase_client()
        
        # Generate credit memo number
        credit_memo_number = f"CM-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create credit memo record
        memo_dict = memo_data.dict()
        memo_dict.update({
            "id": str(uuid.uuid4()),
            "credit_memo_number": credit_memo_number,
            "status": CreditMemoStatus.OPEN.value,
            "applied_amount": 0.0,
            "remaining_amount": memo_data.total_amount,
            "refund_amount": 0.0,
            "applied_to_invoices": [],
            "created_by": current_user.id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
        
        # Convert date to string for JSON serialization
        if 'issue_date' in memo_dict and isinstance(memo_dict['issue_date'], date):
            memo_dict['issue_date'] = memo_dict['issue_date'].isoformat()
        
        result = supabase.table("credit_memos").insert(memo_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create credit memo"
            )
        
        created_memo = result.data[0]
        
        # Create journal entry for credit memo (double-entry accounting)
        try:
            journal_entry = await create_credit_memo_journal_entry(
                created_memo, 
                current_user.id
            )
            print(f"✅ Created journal entry {journal_entry.entry_number} for credit memo {created_memo['credit_memo_number']}")
        except Exception as journal_error:
            print(f"⚠️ Warning: Failed to create journal entry: {journal_error}")
            # Don't fail the credit memo creation if journal entry creation fails
            # This ensures business continuity
        
        return CreditMemo(**created_memo)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating credit memo: {str(e)}"
        )

@router.put("/{memo_id}", response_model=CreditMemo)
async def update_credit_memo(
    memo_id: str,
    memo_data: CreditMemoUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update credit memo"""
    try:
        supabase = get_supabase_client()
        
        # Check if memo exists
        existing = supabase.table("credit_memos").select("*").eq("id", memo_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credit memo not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in memo_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now().isoformat()
        
        # Convert date to string if present
        if 'issue_date' in update_dict and isinstance(update_dict['issue_date'], date):
            update_dict['issue_date'] = update_dict['issue_date'].isoformat()
        
        result = supabase.table("credit_memos").update(update_dict).eq("id", memo_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update credit memo"
            )
        
        return CreditMemo(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating credit memo: {str(e)}"
        )

@router.post("/{memo_id}/apply", response_model=dict)
async def apply_credit_memo(
    memo_id: str,
    application_data: CreditMemoApplication,
    current_user: User = Depends(require_manager_or_admin)
):
    """Apply credit memo to invoice"""
    try:
        supabase = get_supabase_client()
        
        # Get credit memo
        memo_result = supabase.table("credit_memos").select("*").eq("id", memo_id).execute()
        if not memo_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credit memo not found"
            )
        
        memo = memo_result.data[0]
        
        # Validate application amount
        if application_data.applied_amount > memo["remaining_amount"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Applied amount exceeds remaining amount"
            )
        
        # Get invoice
        invoice_result = supabase.table("invoices").select("*").eq("id", application_data.invoice_id).execute()
        if not invoice_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        invoice = invoice_result.data[0]
        
        # Validate invoice belongs to same customer
        if invoice["customer_id"] != memo["customer_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice does not belong to the same customer"
            )
        
        # Create application record
        application_dict = {
            "id": str(uuid.uuid4()),
            "credit_memo_id": memo_id,
            "invoice_id": application_data.invoice_id,
            "applied_amount": application_data.applied_amount,
            "applied_date": datetime.now().isoformat(),
            "notes": application_data.notes,
            "created_by": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("credit_memo_applications").insert(application_dict).execute()
        
        # Update credit memo
        new_applied_amount = memo["applied_amount"] + application_data.applied_amount
        new_remaining_amount = memo["remaining_amount"] - application_data.applied_amount
        new_status = CreditMemoStatus.CLOSED.value if new_remaining_amount <= 0 else CreditMemoStatus.APPLIED.value
        
        # Update applied_to_invoices array
        applied_invoices = memo.get("applied_to_invoices", [])
        if application_data.invoice_id not in applied_invoices:
            applied_invoices.append(application_data.invoice_id)
        
        supabase.table("credit_memos").update({
            "applied_amount": new_applied_amount,
            "remaining_amount": new_remaining_amount,
            "status": new_status,
            "applied_to_invoices": applied_invoices,
            "updated_at": datetime.now().isoformat()
        }).eq("id", memo_id).execute()
        
        # Update invoice (reduce amount owed)
        new_invoice_balance = invoice["total_amount"] - invoice.get("paid_amount", 0) - application_data.applied_amount
        invoice_status = "paid" if new_invoice_balance <= 0 else invoice["status"]
        
        supabase.table("invoices").update({
            "paid_amount": invoice.get("paid_amount", 0) + application_data.applied_amount,
            "status": invoice_status,
            "updated_at": datetime.now().isoformat()
        }).eq("id", application_data.invoice_id).execute()
        
        return {
            "message": "Credit memo applied successfully",
            "applied_amount": application_data.applied_amount,
            "remaining_amount": new_remaining_amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error applying credit memo: {str(e)}"
        )

@router.post("/{memo_id}/refund", response_model=dict)
async def refund_credit_memo(
    memo_id: str,
    refund_data: CreditMemoRefund,
    current_user: User = Depends(require_manager_or_admin)
):
    """Process refund for credit memo"""
    try:
        supabase = get_supabase_client()
        
        # Get credit memo
        memo_result = supabase.table("credit_memos").select("*").eq("id", memo_id).execute()
        if not memo_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credit memo not found"
            )
        
        memo = memo_result.data[0]
        
        # Validate refund amount
        if refund_data.refund_amount > memo["remaining_amount"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund amount exceeds remaining amount"
            )
        
        # Create refund record
        refund_dict = {
            "id": str(uuid.uuid4()),
            "credit_memo_id": memo_id,
            "refund_amount": refund_data.refund_amount,
            "refund_method": refund_data.refund_method,
            "refund_reference": refund_data.refund_reference,
            "refund_date": datetime.now().isoformat(),
            "notes": refund_data.notes,
            "created_by": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("credit_memo_refunds").insert(refund_dict).execute()
        
        # Update credit memo
        new_refund_amount = memo["refund_amount"] + refund_data.refund_amount
        new_remaining_amount = memo["remaining_amount"] - refund_data.refund_amount
        new_status = CreditMemoStatus.CLOSED.value if new_remaining_amount <= 0 else CreditMemoStatus.APPLIED.value
        
        supabase.table("credit_memos").update({
            "refund_amount": new_refund_amount,
            "remaining_amount": new_remaining_amount,
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        }).eq("id", memo_id).execute()
        
        # Create journal entry for refund
        try:
            refund_journal_entry = await create_refund_journal_entry(
                memo, refund_data, current_user.id
            )
            print(f"✅ Created refund journal entry {refund_journal_entry.entry_number}")
        except Exception as journal_error:
            print(f"⚠️ Warning: Failed to create refund journal entry: {journal_error}")
        
        return {
            "message": "Refund processed successfully",
            "refund_amount": refund_data.refund_amount,
            "remaining_amount": new_remaining_amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing refund: {str(e)}"
        )

@router.delete("/{memo_id}")
async def delete_credit_memo(
    memo_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete credit memo"""
    try:
        supabase = get_supabase_client()
        
        # Check if memo exists
        existing = supabase.table("credit_memos").select("*").eq("id", memo_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credit memo not found"
            )
        
        memo = existing.data[0]
        
        # Check if memo can be deleted (only if status is OPEN)
        if memo["status"] != CreditMemoStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete credit memo that has been applied or refunded"
            )
        
        # Delete related records first
        supabase.table("credit_memo_applications").delete().eq("credit_memo_id", memo_id).execute()
        supabase.table("credit_memo_refunds").delete().eq("credit_memo_id", memo_id).execute()
        
        # Delete credit memo
        result = supabase.table("credit_memos").delete().eq("id", memo_id).execute()
        
        return {"message": "Credit memo deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting credit memo: {str(e)}"
        )

async def create_credit_memo_journal_entry(memo_data: dict, user_id: str):
    """Create journal entry for credit memo"""
    try:
        from models.journal_entry import JournalEntryCreate, JournalEntryLine, TransactionType, ChartOfAccounts
        
        # Create journal entry lines for credit memo
        lines = [
            JournalEntryLine(
                account_code=ChartOfAccounts.EXPENSES_SALES,  # Sales Returns and Allowances
                account_name="Hàng bán bị trả lại",
                debit_amount=memo_data["total_amount"],
                credit_amount=0.0,
                description=f"Credit memo {memo_data['credit_memo_number']}",
                reference_id=memo_data["id"],
                reference_type="credit_memo"
            ),
            JournalEntryLine(
                account_code=ChartOfAccounts.ASSETS_RECEIVABLE,
                account_name="Phải thu khách hàng",
                debit_amount=0.0,
                credit_amount=memo_data["total_amount"],
                description=f"Giảm công nợ từ credit memo {memo_data['credit_memo_number']}",
                reference_id=memo_data["id"],
                reference_type="credit_memo"
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.now(),
            description=f"Credit memo {memo_data['credit_memo_number']}",
            transaction_type=TransactionType.REFUND,
            transaction_id=memo_data["id"],
            lines=lines
        )
        
        return await journal_service.create_journal_entry(entry_data, user_id)
        
    except Exception as e:
        raise Exception(f"Error creating credit memo journal entry: {str(e)}")

async def create_refund_journal_entry(memo_data: dict, refund_data: CreditMemoRefund, user_id: str):
    """Create journal entry for refund"""
    try:
        from models.journal_entry import JournalEntryCreate, JournalEntryLine, TransactionType, ChartOfAccounts
        
        # Determine cash account based on refund method
        cash_account_code = ChartOfAccounts.ASSETS_CASH
        cash_account_name = "Tiền mặt"
        
        if refund_data.refund_method.lower() in ["bank_transfer", "chuyển khoản"]:
            cash_account_code = ChartOfAccounts.ASSETS_BANK
            cash_account_name = "Tiền gửi ngân hàng"
        
        # Create journal entry lines for refund
        lines = [
            JournalEntryLine(
                account_code=cash_account_code,
                account_name=cash_account_name,
                debit_amount=0.0,
                credit_amount=refund_data.refund_amount,
                description=f"Hoàn tiền credit memo {memo_data['credit_memo_number']}",
                reference_id=memo_data["id"],
                reference_type="credit_memo_refund"
            ),
            JournalEntryLine(
                account_code=ChartOfAccounts.EXPENSES_SALES,
                account_name="Hàng bán bị trả lại",
                debit_amount=0.0,
                credit_amount=refund_data.refund_amount,
                description=f"Giảm hàng bán bị trả lại từ hoàn tiền {memo_data['credit_memo_number']}",
                reference_id=memo_data["id"],
                reference_type="credit_memo_refund"
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.now(),
            description=f"Hoàn tiền credit memo {memo_data['credit_memo_number']}",
            transaction_type=TransactionType.REFUND,
            transaction_id=memo_data["id"],
            lines=lines
        )
        
        return await journal_service.create_journal_entry(entry_data, user_id)
        
    except Exception as e:
        raise Exception(f"Error creating refund journal entry: {str(e)}")
