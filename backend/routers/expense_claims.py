from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.expense_claim import (
    ExpenseClaim, 
    ExpenseClaimCreate, 
    ExpenseClaimUpdate,
    ExpenseClaimSummary,
    ExpenseClaimStats,
    ExpenseClaimApproval,
    ExpenseClaimPayment,
    ExpenseClaimWithItems,
    ExpenseClaimStatus,
    PaymentMethod
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client
from services.journal_service import journal_service

router = APIRouter(prefix="/api/expenses/claims", tags=["Expense Claims"])

# ============================================================================
# EXPENSE CLAIMS MANAGEMENT - Quản lý đề nghị hoàn ứng
# ============================================================================

@router.get("/", response_model=List[ExpenseClaimSummary])
async def get_expense_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all expense claims with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        # Use the view for better performance
        query = supabase.table("expense_claim_summary").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"claim_number.ilike.%{search}%,description.ilike.%{search}%")
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        if status:
            query = query.eq("status", status)
        
        if start_date:
            query = query.gte("submission_date", start_date.isoformat())
        
        if end_date:
            query = query.lte("submission_date", end_date.isoformat())
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [ExpenseClaimSummary(**claim) for claim in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense claims: {str(e)}"
        )

@router.get("/{claim_id}", response_model=ExpenseClaimWithItems)
async def get_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense claim by ID with detailed items"""
    try:
        supabase = get_supabase_client()
        
        # Get claim details
        claim_result = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        
        if not claim_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        claim = claim_result.data[0]
        
        # Get claim items
        items_result = supabase.table("expense_claim_items").select("*").eq("claim_id", claim_id).execute()
        
        claim["items"] = items_result.data or []
        
        return ExpenseClaimWithItems(**claim)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense claim: {str(e)}"
        )

@router.post("/", response_model=ExpenseClaim, status_code=status.HTTP_201_CREATED)
async def create_expense_claim(
    claim_data: ExpenseClaimCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense claim"""
    try:
        supabase = get_supabase_client()
        
        # Create expense claim
        claim_dict = claim_data.dict()
        claim_dict.update({
            "id": str(uuid.uuid4()),
            "employee_id": current_user.id,  # Use current user as employee
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        # Convert date objects to strings for JSON serialization
        if 'submission_date' in claim_dict and isinstance(claim_dict['submission_date'], date):
            claim_dict['submission_date'] = claim_dict['submission_date'].isoformat()
        
        # Convert line items dates
        if 'line_items' in claim_dict:
            for item in claim_dict['line_items']:
                if 'expense_date' in item and isinstance(item['expense_date'], date):
                    item['expense_date'] = item['expense_date'].isoformat()
        
        result = supabase.table("expense_claims").insert(claim_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create expense claim"
            )
        
        created_claim = result.data[0]
        
        # Create claim items
        if claim_data.line_items:
            items_data = []
            for item in claim_data.line_items:
                item_dict = item.dict()
                item_dict.update({
                    "id": str(uuid.uuid4()),
                    "claim_id": created_claim["id"],
                    "created_at": datetime.utcnow().isoformat()
                })
                
                # Convert date objects
                if 'expense_date' in item_dict and isinstance(item_dict['expense_date'], date):
                    item_dict['expense_date'] = item_dict['expense_date'].isoformat()
                
                items_data.append(item_dict)
            
            supabase.table("expense_claim_items").insert(items_data).execute()
        
        return ExpenseClaim(**created_claim)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating expense claim: {str(e)}"
        )

@router.put("/{claim_id}", response_model=ExpenseClaim)
async def update_expense_claim(
    claim_id: str,
    claim_data: ExpenseClaimUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an expense claim (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if claim exists and is in draft status
        existing_claim = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        if not existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        if existing_claim.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft expense claims can be updated"
            )
        
        # Check if user owns the claim
        if existing_claim.data[0]["employee_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own expense claims"
            )
        
        # Update expense claim
        update_data = {k: v for k, v in claim_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert date objects to strings
        if 'submission_date' in update_data and isinstance(update_data['submission_date'], date):
            update_data['submission_date'] = update_data['submission_date'].isoformat()
        
        result = supabase.table("expense_claims").update(update_data).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update expense claim"
            )
        
        return ExpenseClaim(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating expense claim: {str(e)}"
        )

@router.delete("/{claim_id}")
async def delete_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense claim (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if claim exists and is in draft status
        existing_claim = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        if not existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        if existing_claim.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft expense claims can be deleted"
            )
        
        # Check if user owns the claim
        if existing_claim.data[0]["employee_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own expense claims"
            )
        
        # Delete expense claim (items will be deleted by CASCADE)
        result = supabase.table("expense_claims").delete().eq("id", claim_id).execute()
        
        return {"message": "Expense claim deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting expense claim: {str(e)}"
        )

# ============================================================================
# APPROVAL WORKFLOW - Luồng phê duyệt
# ============================================================================

@router.post("/{claim_id}/submit")
async def submit_for_approval(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Submit expense claim for approval (Draft → Submitted)"""
    try:
        supabase = get_supabase_client()
        
        # Check if claim exists and is in draft status
        existing_claim = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        if not existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        if existing_claim.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft expense claims can be submitted for approval"
            )
        
        # Check if user owns the claim
        if existing_claim.data[0]["employee_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only submit your own expense claims"
            )
        
        # Update status to submitted
        update_data = {
            "status": "submitted",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("expense_claims").update(update_data).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit expense claim for approval"
            )
        
        return {
            "message": "Expense claim submitted for approval",
            "expense_claim": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting expense claim: {str(e)}"
        )

@router.post("/{claim_id}/approve")
async def approve_expense_claim(
    claim_id: str,
    approval_data: ExpenseClaimApproval,
    current_user: User = Depends(require_manager_or_admin)
):
    """Approve or reject an expense claim (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if claim exists and is submitted
        existing_claim = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        if not existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        if existing_claim.data[0]["status"] != "submitted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only submitted expense claims can be approved/rejected"
            )
        
        # Determine new status based on action
        new_status = "approved" if approval_data.action == "approve" else "rejected"
        
        # Update expense claim
        update_data = {
            "status": new_status,
            "approved_by": current_user.id,
            "approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add approval notes or rejection reason
        if approval_data.action == "approve" and approval_data.notes:
            update_data["notes"] = existing_claim.data[0].get("notes", "") + f"\n\nApproval Notes: {approval_data.notes}"
        elif approval_data.action == "reject" and approval_data.rejection_reason:
            update_data["rejection_reason"] = approval_data.rejection_reason
        
        result = supabase.table("expense_claims").update(update_data).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to {approval_data.action} expense claim"
            )
        
        # Create journal entry if approved
        if approval_data.action == "approve":
            try:
                journal_entry = await journal_service.create_expense_claim_approval_journal_entry(
                    result.data[0], 
                    current_user.id
                )
                print(f"✅ Created journal entry {journal_entry.entry_number} for approved expense claim {result.data[0]['claim_number']}")
            except Exception as journal_error:
                print(f"⚠️ Warning: Failed to create journal entry for approved expense claim: {journal_error}")
        
        return {
            "message": f"Expense claim {approval_data.action}d successfully",
            "expense_claim": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error {approval_data.action}ing expense claim: {str(e)}"
        )

@router.get("/pending-approval", response_model=List[ExpenseClaimSummary])
async def get_pending_approval_claims(
    current_user: User = Depends(require_manager_or_admin)
):
    """Get all expense claims pending approval (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("expense_claim_summary").select("*").eq("status", "submitted").order("created_at", desc=True).execute()
        
        return [ExpenseClaimSummary(**claim) for claim in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending approval claims: {str(e)}"
        )

# ============================================================================
# PAYMENT PROCESSING - Xử lý thanh toán
# ============================================================================

@router.post("/{claim_id}/pay")
async def process_payment(
    claim_id: str,
    payment_data: ExpenseClaimPayment,
    current_user: User = Depends(require_manager_or_admin)
):
    """Process payment for an approved expense claim (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if claim exists and is approved
        existing_claim = supabase.table("expense_claims").select("*").eq("id", claim_id).execute()
        if not existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense claim not found"
            )
        
        if existing_claim.data[0]["status"] != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved expense claims can be paid"
            )
        
        # Update expense claim
        update_data = {
            "status": "paid",
            "paid_by": current_user.id,
            "paid_at": datetime.utcnow().isoformat(),
            "payment_method": payment_data.payment_method.value,
            "payment_reference": payment_data.payment_reference,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add payment notes
        if payment_data.notes:
            update_data["notes"] = existing_claim.data[0].get("notes", "") + f"\n\nPayment Notes: {payment_data.notes}"
        
        result = supabase.table("expense_claims").update(update_data).eq("id", claim_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process payment"
            )
        
        # Create journal entry for payment
        try:
            journal_entry = await journal_service.create_expense_claim_payment_journal_entry(
                result.data[0], 
                current_user.id
            )
            print(f"✅ Created journal entry {journal_entry.entry_number} for paid expense claim {result.data[0]['claim_number']}")
        except Exception as journal_error:
            print(f"⚠️ Warning: Failed to create journal entry for paid expense claim: {journal_error}")
        
        return {
            "message": "Expense claim payment processed successfully",
            "expense_claim": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing payment: {str(e)}"
        )

# ============================================================================
# STATISTICS & REPORTS - Thống kê và báo cáo
# ============================================================================

@router.get("/stats", response_model=ExpenseClaimStats)
async def get_expense_claim_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    employee_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get expense claim statistics"""
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("expense_claims").select("*")
        
        if start_date:
            query = query.gte("submission_date", start_date.isoformat())
        if end_date:
            query = query.lte("submission_date", end_date.isoformat())
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        result = query.execute()
        
        # Calculate statistics
        total_claims = len(result.data)
        total_amount = sum(claim.get("total_amount", 0) for claim in result.data)
        
        # Group by status
        by_status = {}
        for claim in result.data:
            status = claim.get("status", "unknown")
            by_status[status] = by_status.get(status, 0) + 1
        
        # Count by status
        pending_claims = sum(1 for claim in result.data if claim.get("status") == "submitted")
        approved_claims = sum(1 for claim in result.data if claim.get("status") == "approved")
        rejected_claims = sum(1 for claim in result.data if claim.get("status") == "rejected")
        paid_claims = sum(1 for claim in result.data if claim.get("status") == "paid")
        
        # Group by category (simplified)
        by_category = {}
        for claim in result.data:
            # This would need to be enhanced to get actual categories from line items
            by_category["general"] = by_category.get("general", 0) + 1
        
        return ExpenseClaimStats(
            total_claims=total_claims,
            total_amount=total_amount,
            pending_claims=pending_claims,
            approved_claims=approved_claims,
            rejected_claims=rejected_claims,
            paid_claims=paid_claims,
            by_status=by_status,
            by_category=by_category
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense claim statistics: {str(e)}"
        )

@router.get("/my-claims", response_model=List[ExpenseClaimSummary])
async def get_my_expense_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get current user's expense claims"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("expense_claim_summary").select("*").eq("employee_id", current_user.id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [ExpenseClaimSummary(**claim) for claim in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user's expense claims: {str(e)}"
        )
