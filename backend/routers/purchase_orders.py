from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.purchase_order import (
    PurchaseOrder, 
    PurchaseOrderCreate, 
    PurchaseOrderUpdate,
    PurchaseOrderSummary,
    PurchaseOrderStats,
    PurchaseOrderApproval,
    PurchaseOrderStatus,
    ConvertToBillRequest
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/expenses/purchase-orders", tags=["Purchase Orders"])

# ============================================================================
# PURCHASE ORDERS MANAGEMENT - Quản lý đơn đặt hàng
# ============================================================================

@router.get("/", response_model=List[PurchaseOrderSummary])
async def get_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    vendor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all purchase orders with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        # Use the view for better performance
        query = supabase.table("purchase_order_summary").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"po_number.ilike.%{search}%,vendor_name.ilike.%{search}%")
        
        if vendor_id:
            query = query.eq("vendor_id", vendor_id)
        
        if status:
            query = query.eq("status", status)
        
        if created_by:
            query = query.eq("created_by", created_by)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [PurchaseOrderSummary(**po) for po in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch purchase orders: {str(e)}"
        )

@router.get("/{po_id}", response_model=PurchaseOrder)
async def get_purchase_order(
    po_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific purchase order by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        return PurchaseOrder(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch purchase order: {str(e)}"
        )

@router.post("/", response_model=PurchaseOrder, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    po_data: PurchaseOrderCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new purchase order"""
    try:
        supabase = get_supabase_client()
        
        # Create purchase order
        po_dict = po_data.dict()
        po_dict.update({
            "id": str(uuid.uuid4()),
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        # Convert date objects to strings for JSON serialization
        if 'issue_date' in po_dict and isinstance(po_dict['issue_date'], date):
            po_dict['issue_date'] = po_dict['issue_date'].isoformat()
        if 'delivery_date' in po_dict and isinstance(po_dict['delivery_date'], date):
            po_dict['delivery_date'] = po_dict['delivery_date'].isoformat()
        
        result = supabase.table("purchase_orders").insert(po_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create purchase order"
            )
        
        return PurchaseOrder(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating purchase order: {str(e)}"
        )

@router.put("/{po_id}", response_model=PurchaseOrder)
async def update_purchase_order(
    po_id: str,
    po_data: PurchaseOrderUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a purchase order (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if PO exists and is in draft status
        existing_po = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        if not existing_po.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        if existing_po.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be updated"
            )
        
        # Update purchase order
        update_data = {k: v for k, v in po_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert date objects to strings
        if 'issue_date' in update_data and isinstance(update_data['issue_date'], date):
            update_data['issue_date'] = update_data['issue_date'].isoformat()
        if 'delivery_date' in update_data and isinstance(update_data['delivery_date'], date):
            update_data['delivery_date'] = update_data['delivery_date'].isoformat()
        
        result = supabase.table("purchase_orders").update(update_data).eq("id", po_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update purchase order"
            )
        
        return PurchaseOrder(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating purchase order: {str(e)}"
        )

@router.delete("/{po_id}")
async def delete_purchase_order(
    po_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a purchase order (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if PO exists and is in draft status
        existing_po = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        if not existing_po.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        if existing_po.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be deleted"
            )
        
        # Delete purchase order
        result = supabase.table("purchase_orders").delete().eq("id", po_id).execute()
        
        return {"message": "Purchase order deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting purchase order: {str(e)}"
        )

# ============================================================================
# APPROVAL WORKFLOW - Luồng phê duyệt
# ============================================================================

@router.post("/{po_id}/submit")
async def submit_for_approval(
    po_id: str,
    current_user: User = Depends(get_current_user)
):
    """Submit purchase order for approval (Draft → Pending Approval)"""
    try:
        supabase = get_supabase_client()
        
        # Check if PO exists and is in draft status
        existing_po = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        if not existing_po.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        if existing_po.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be submitted for approval"
            )
        
        # Update status to pending approval
        update_data = {
            "status": "pending_approval",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("purchase_orders").update(update_data).eq("id", po_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit purchase order for approval"
            )
        
        return {
            "message": "Purchase order submitted for approval",
            "purchase_order": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting purchase order: {str(e)}"
        )

@router.post("/{po_id}/approve")
async def approve_purchase_order(
    po_id: str,
    approval_data: PurchaseOrderApproval,
    current_user: User = Depends(require_manager_or_admin)
):
    """Approve or reject a purchase order (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if PO exists and is pending approval
        existing_po = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        if not existing_po.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        if existing_po.data[0]["status"] != "pending_approval":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending approval purchase orders can be approved/rejected"
            )
        
        # Determine new status based on action
        new_status = "approved" if approval_data.action == "approve" else "rejected"
        
        # Update purchase order
        update_data = {
            "status": new_status,
            "approved_by": current_user.id,
            "approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add approval notes if provided
        if approval_data.notes:
            update_data["notes"] = existing_po.data[0].get("notes", "") + f"\n\nApproval Notes: {approval_data.notes}"
        
        result = supabase.table("purchase_orders").update(update_data).eq("id", po_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to {approval_data.action} purchase order"
            )
        
        return {
            "message": f"Purchase order {approval_data.action}d successfully",
            "purchase_order": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error {approval_data.action}ing purchase order: {str(e)}"
        )

@router.get("/pending-approval", response_model=List[PurchaseOrderSummary])
async def get_pending_approval_orders(
    current_user: User = Depends(require_manager_or_admin)
):
    """Get all purchase orders pending approval (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("purchase_order_summary").select("*").eq("status", "pending_approval").order("created_at", desc=True).execute()
        
        return [PurchaseOrderSummary(**po) for po in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending approval orders: {str(e)}"
        )

# ============================================================================
# CONVERSION TO BILL - Chuyển đổi thành hóa đơn
# ============================================================================

@router.post("/{po_id}/convert-to-bill")
async def convert_to_bill(
    po_id: str,
    convert_data: ConvertToBillRequest,
    current_user: User = Depends(get_current_user)
):
    """Convert an approved purchase order to a bill"""
    try:
        supabase = get_supabase_client()
        
        # Check if PO exists and is approved
        existing_po = supabase.table("purchase_orders").select("*").eq("id", po_id).execute()
        if not existing_po.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        po = existing_po.data[0]
        if po["status"] != "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be converted to bills"
            )
        
        # Create bill from PO data
        bill_data = {
            "id": str(uuid.uuid4()),
            "bill_number": convert_data.bill_number or f"BILL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "vendor_id": po["vendor_id"],
            "issue_date": (convert_data.issue_date or date.today()).isoformat(),
            "due_date": (convert_data.due_date or (date.today().replace(month=date.today().month + 1))).isoformat(),
            "line_items": po["line_items"],
            "subtotal": po["subtotal"],
            "tax_rate": po["tax_rate"],
            "tax_amount": po["tax_amount"],
            "discount_amount": po["discount_amount"],
            "total_amount": po["total_amount"],
            "currency": po["currency"],
            "status": "draft",
            "payment_status": "pending",
            "notes": convert_data.notes or f"Converted from PO {po['po_number']}",
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert bill
        bill_result = supabase.table("bills").insert(bill_data).execute()
        
        if not bill_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create bill from purchase order"
            )
        
        # Update PO status to closed
        supabase.table("purchase_orders").update({
            "status": "closed",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", po_id).execute()
        
        return {
            "message": "Purchase order converted to bill successfully",
            "bill": bill_result.data[0],
            "purchase_order_id": po_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting purchase order to bill: {str(e)}"
        )

# ============================================================================
# STATISTICS & REPORTS - Thống kê và báo cáo
# ============================================================================

@router.get("/stats", response_model=PurchaseOrderStats)
async def get_purchase_order_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get purchase order statistics"""
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("purchase_orders").select("*")
        
        if start_date:
            query = query.gte("issue_date", start_date.isoformat())
        if end_date:
            query = query.lte("issue_date", end_date.isoformat())
        
        result = query.execute()
        
        # Calculate statistics
        total_orders = len(result.data)
        total_amount = sum(po.get("total_amount", 0) for po in result.data)
        
        # Group by status
        by_status = {}
        for po in result.data:
            status = po.get("status", "unknown")
            by_status[status] = by_status.get(status, 0) + 1
        
        # Group by vendor
        by_vendor = {}
        for po in result.data:
            vendor_id = po.get("vendor_id", "unknown")
            by_vendor[vendor_id] = by_vendor.get(vendor_id, 0) + 1
        
        # Count pending approval
        pending_approval = sum(1 for po in result.data if po.get("status") == "pending_approval")
        
        # Count approved this month
        current_month = datetime.now().replace(day=1)
        approved_this_month = sum(
            1 for po in result.data 
            if po.get("status") == "approved" 
            and datetime.fromisoformat(po.get("approved_at", "1900-01-01").replace("Z", "+00:00")) >= current_month
        )
        
        # Count rejected this month
        rejected_this_month = sum(
            1 for po in result.data 
            if po.get("status") == "rejected" 
            and datetime.fromisoformat(po.get("approved_at", "1900-01-01").replace("Z", "+00:00")) >= current_month
        )
        
        return PurchaseOrderStats(
            total_orders=total_orders,
            total_amount=total_amount,
            by_status=by_status,
            by_vendor=by_vendor,
            pending_approval=pending_approval,
            approved_this_month=approved_this_month,
            rejected_this_month=rejected_this_month
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch purchase order statistics: {str(e)}"
        )
