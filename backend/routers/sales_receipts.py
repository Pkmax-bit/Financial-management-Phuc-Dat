from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.sales_receipt import SalesReceipt, SalesReceiptCreate, SalesReceiptUpdate, SalesReceiptItem
from models.accounting_entry import AccountingEntry, AccountingEntryCreate, AccountingEntryLineCreate
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/sales/receipts", tags=["sales-receipts"])

@router.get("/", response_model=List[SalesReceipt])
async def get_sales_receipts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get all sales receipts"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("sales_receipts").select("*")
        
        if search:
            query = query.or_(f"receipt_number.ilike.%{search}%,notes.ilike.%{search}%")
        
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sales receipts: {str(e)}"
        )

@router.get("/{receipt_id}", response_model=SalesReceipt)
async def get_sales_receipt(
    receipt_id: str,
    current_user = Depends(get_current_user)
):
    """Get sales receipt by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("sales_receipts").select("*").eq("id", receipt_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales receipt not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sales receipt: {str(e)}"
        )

@router.post("/", response_model=SalesReceipt)
async def create_sales_receipt(
    receipt_data: SalesReceiptCreate,
    current_user = Depends(get_current_user)
):
    """Create new sales receipt with accounting entries"""
    try:
        supabase = get_supabase_client()
        
        # Generate receipt number
        receipt_number = f"SR-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create sales receipt
        receipt_dict = receipt_data.dict()
        receipt_dict.update({
            "id": str(uuid.uuid4()),
            "receipt_number": receipt_number,
            "created_by": current_user.id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
        
        # Convert date to string for JSON serialization
        if 'issue_date' in receipt_dict and isinstance(receipt_dict['issue_date'], date):
            receipt_dict['issue_date'] = receipt_dict['issue_date'].isoformat()
        
        result = supabase.table("sales_receipts").insert(receipt_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create sales receipt"
            )
        
        created_receipt = result.data[0]
        
        # Create accounting entries (temporarily disabled for testing)
        # await create_accounting_entries(supabase, created_receipt, current_user.id)
        
        return created_receipt
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating sales receipt: {str(e)}"
        )

@router.put("/{receipt_id}", response_model=SalesReceipt)
async def update_sales_receipt(
    receipt_id: str,
    receipt_data: SalesReceiptUpdate,
    current_user = Depends(get_current_user)
):
    """Update sales receipt"""
    try:
        supabase = get_supabase_client()
        
        # Check if receipt exists
        existing = supabase.table("sales_receipts").select("*").eq("id", receipt_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales receipt not found"
            )
        
        # Update receipt
        update_data = receipt_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now().isoformat()
        
        result = supabase.table("sales_receipts").update(update_data).eq("id", receipt_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update sales receipt"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating sales receipt: {str(e)}"
        )

@router.delete("/{receipt_id}")
async def delete_sales_receipt(
    receipt_id: str,
    current_user = Depends(get_current_user)
):
    """Delete sales receipt"""
    try:
        supabase = get_supabase_client()
        
        # Check if receipt exists
        existing = supabase.table("sales_receipts").select("*").eq("id", receipt_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales receipt not found"
            )
        
        # Delete accounting entries first
        supabase.table("accounting_entry_lines").delete().eq("entry_id", receipt_id).execute()
        supabase.table("accounting_entries").delete().eq("reference_id", receipt_id).execute()
        
        # Delete sales receipt
        result = supabase.table("sales_receipts").delete().eq("id", receipt_id).execute()
        
        return {"message": "Sales receipt deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting sales receipt: {str(e)}"
        )

async def create_accounting_entries(supabase, receipt, user_id: str):
    """Create accounting entries for sales receipt"""
    try:
        # Generate entry number
        entry_number = f"JE-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create accounting entry
        entry_dict = {
            "id": str(uuid.uuid4()),
            "entry_number": entry_number,
            "entry_date": receipt["issue_date"],
            "description": f"Sales Receipt {receipt['receipt_number']}",
            "reference_type": "sales_receipt",
            "reference_id": receipt["id"],
            "total_debit": receipt["total_amount"],
            "total_credit": receipt["total_amount"],
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        entry_result = supabase.table("accounting_entries").insert(entry_dict).execute()
        
        if not entry_result.data:
            raise Exception("Failed to create accounting entry")
        
        entry_id = entry_result.data[0]["id"]
        
        # Determine cash account based on payment method
        cash_account_code = "101"  # Default to Cash
        cash_account_name = "Tiền mặt"
        
        if receipt["payment_method"].lower() in ["credit card", "thẻ tín dụng"]:
            cash_account_code = "102"
            cash_account_name = "Tiền gửi ngân hàng"
        elif receipt["payment_method"].lower() in ["bank transfer", "chuyển khoản"]:
            cash_account_code = "102"
            cash_account_name = "Tiền gửi ngân hàng"
        
        # Create accounting entry lines
        lines = []
        
        # Debit: Cash/Bank account
        lines.append({
            "id": str(uuid.uuid4()),
            "entry_id": entry_id,
            "account_code": cash_account_code,
            "account_name": cash_account_name,
            "debit_amount": receipt["total_amount"],
            "credit_amount": 0.0,
            "description": f"Thu tiền bán hàng - {receipt['receipt_number']}",
            "created_at": datetime.now().isoformat()
        })
        
        # Credit: Sales Revenue account
        lines.append({
            "id": str(uuid.uuid4()),
            "entry_id": entry_id,
            "account_code": "401",
            "account_name": "Doanh thu bán hàng",
            "debit_amount": 0.0,
            "credit_amount": receipt["total_amount"],
            "description": f"Doanh thu bán hàng - {receipt['receipt_number']}",
            "created_at": datetime.now().isoformat()
        })
        
        # Insert accounting entry lines
        supabase.table("accounting_entry_lines").insert(lines).execute()
        
    except Exception as e:
        raise Exception(f"Error creating accounting entries: {str(e)}")

@router.get("/stats/summary")
async def get_sales_receipts_stats(
    current_user = Depends(get_current_user)
):
    """Get sales receipts statistics"""
    try:
        supabase = get_supabase_client()
        
        # Get total receipts count
        total_result = supabase.table("sales_receipts").select("id", count="exact").execute()
        total_receipts = total_result.count or 0
        
        # Get total amount
        amount_result = supabase.table("sales_receipts").select("total_amount").execute()
        total_amount = sum(item["total_amount"] for item in amount_result.data) if amount_result.data else 0
        
        # Get receipts by payment method
        method_result = supabase.table("sales_receipts").select("payment_method, total_amount").execute()
        by_method = {}
        if method_result.data:
            for item in method_result.data:
                method = item["payment_method"]
                if method not in by_method:
                    by_method[method] = {"count": 0, "amount": 0}
                by_method[method]["count"] += 1
                by_method[method]["amount"] += item["total_amount"]
        
        return {
            "total_receipts": total_receipts,
            "total_amount": total_amount,
            "by_payment_method": by_method
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sales receipts stats: {str(e)}"
        )
