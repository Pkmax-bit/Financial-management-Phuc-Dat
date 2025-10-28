"""
Expense Management Router - Expenses Center
Comprehensive expense management with expenses, bills, vendors, and expense analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
from pydantic import BaseModel

from models.expense import Expense, ExpenseCreate, ExpenseUpdate, ExpenseReimbursement
from models.bill import Bill, BillCreate, BillUpdate, BillPayment
from models.vendor import Vendor, VendorCreate, VendorUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client
from services.project_validation_service import ProjectValidationService
from services.auto_snapshot_service import AutoSnapshotService

router = APIRouter()

# ============================================================================
# PROJECT INTEGRATION - Tích hợp dự án
# ============================================================================

@router.get("/projects/by-customer/{customer_id}")
async def get_projects_for_expenses(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get projects for a specific customer - used for dropdown selection in expense forms"""
    try:
        service = ProjectValidationService()
        return await service.get_projects_for_customer(customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects for customer: {str(e)}"
        )

@router.get("/projects/dropdown-options/{customer_id}")
async def get_project_dropdown_options(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get formatted project options for dropdown selection"""
    try:
        service = ProjectValidationService()
        return await service.get_project_dropdown_options(customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project dropdown options: {str(e)}"
        )

@router.get("/validate-project-customer")
async def validate_project_for_expenses(
    project_id: str,
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Validate that a project belongs to a specific customer for expense transactions"""
    try:
        service = ProjectValidationService()
        return await service.validate_project_customer(project_id, customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate project-customer relationship: {str(e)}"
        )

# ============================================================================
# EXPENSES MANAGEMENT - Quản lý chi phí
# ============================================================================

@router.get("/expenses", response_model=List[Expense])
async def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    is_billable: Optional[bool] = Query(None),
    is_reimbursable: Optional[bool] = Query(None),
    payment_method: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all expenses with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("expenses").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"description.ilike.%{search}%,expense_code.ilike.%{search}%,tags.ilike.%{search}%")
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if category:
            query = query.eq("category", category)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        if is_billable is not None:
            query = query.eq("is_billable", is_billable)
        
        if is_reimbursable is not None:
            query = query.eq("is_reimbursable", is_reimbursable)
        
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        # Apply pagination and ordering
        result = query.order("expense_date", desc=True).range(skip, skip + limit - 1).execute()

        # Normalize records to match pydantic model (category required)
        normalized = []
        for expense in result.data:
            if "category" not in expense:
                # Fallback if only category_id exists or missing entirely
                expense["category"] = expense.get("category", "other")
            normalized.append(expense)

        return [Expense(**expense) for expense in normalized]
        
    except Exception as e:
        # Ensure we reference FastAPI status, not a shadowed variable
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expenses: {str(e)}"
        )

# ============================================================================
# PUBLIC ENDPOINTS - Các endpoint công khai (không cần authentication)
# ============================================================================

@router.get("/expenses/public", response_model=List[Expense])
async def get_expenses_public():
    """Get all expenses (public endpoint - no authentication required)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("expenses").select("*").order("created_at", desc=True).execute()
        
        return [Expense(**expense) for expense in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expenses: {str(e)}"
        )

@router.get("/bills/public", response_model=List[Bill])
async def get_bills_public():
    """Get all bills (public endpoint - no authentication required)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("bills").select("*").order("created_at", desc=True).execute()
        
        return [Bill(**bill) for bill in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bills: {str(e)}"
        )

@router.get("/vendors/public", response_model=List[Vendor])
async def get_vendors_public():
    """Get all vendors (public endpoint - no authentication required)"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("vendors").select("*").order("name", desc=False).execute()
        
        return [Vendor(**vendor) for vendor in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch vendors: {str(e)}"
        )

@router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("expenses").select("*").eq("id", expense_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        return Expense(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense: {str(e)}"
        )

@router.post("/expenses", response_model=Expense)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense code already exists
        existing = supabase.table("expenses").select("id").eq("expense_code", expense_data.expense_code).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense code already exists"
            )
        
        # Create expense record
        expense_dict = expense_data.dict()
        expense_dict["id"] = str(uuid.uuid4())
        expense_dict["status"] = "draft"  # Default status
        expense_dict["created_at"] = datetime.utcnow().isoformat()
        expense_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("expenses").insert(expense_dict).execute()
        
        if result.data:
            created_expense = result.data[0]
            
            # Auto-create snapshot if this is a child expense
            if expense_dict.get('id_parent'):
                try:
                    auto_snapshot_service = AutoSnapshotService()
                    await auto_snapshot_service.create_auto_snapshot_for_child(
                        created_expense, 
                        'expenses',
                        current_user.id
                    )
                except Exception as e:
                    print(f"Warning: Failed to create auto-snapshot: {e}")
            
            return Expense(**created_expense)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create expense: {str(e)}"
        )

@router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an expense"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense exists
        existing = supabase.table("expenses").select("*").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        # Check if user can edit this expense
        expense = existing.data[0]
        if expense["employee_id"] != current_user.id and not current_user.is_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to edit this expense"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in expense_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("expenses").update(update_dict).eq("id", expense_id).execute()
        
        if result.data:
            return Expense(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update expense: {str(e)}"
        )

@router.post("/expenses/{expense_id}/submit")
async def submit_expense_for_approval(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Submit expense for approval"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense exists and belongs to user
        existing = supabase.table("expenses").select("*").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = existing.data[0]
        if expense["employee_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to submit this expense"
            )
        
        if expense["status"] not in ["draft"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense cannot be submitted in current status"
            )
        
        # Update status to pending
        update_data = {
            "status": "pending",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
        
        if result.data:
            return {
                "message": "Expense submitted for approval successfully",
                "expense": result.data[0]
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to submit expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit expense: {str(e)}"
        )

@router.put("/expenses/{expense_id}/approve")
async def approve_expense(
    expense_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Approve an expense and all its children"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense exists
        existing = supabase.table("expenses").select("id, status").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = existing.data[0]
        
        # Check if expense can be approved
        if expense["status"] not in ["pending", "draft"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense cannot be approved in current status"
            )
        
        # Get employee ID for the current user
        employee_result = supabase.table("employees").select("id").eq("user_id", current_user.id).execute()
        approved_by_employee_id = employee_result.data[0]["id"] if employee_result.data else None
        
        # Get all child expenses
        child_expenses = supabase.table("expenses").select("id").eq("id_parent", expense_id).execute()
        child_ids = [child["id"] for child in child_expenses.data]
        
        # Update parent expense status
        update_data = {
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        if approved_by_employee_id:
            update_data["approved_by"] = approved_by_employee_id
            
        result = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
        
        # Update all child expenses status
        if child_ids:
            supabase.table("expenses").update(update_data).in_("id", child_ids).execute()
        
        if result.data:
            return {
                "message": "Expense and all children approved successfully",
                "approved_count": 1 + len(child_ids)
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to approve expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve expense: {str(e)}"
        )

@router.put("/expenses/{expense_id}/reject")
async def reject_expense(
    expense_id: str,
    reason: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Reject an expense"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense exists
        existing = supabase.table("expenses").select("id").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        # Update expense status
        result = supabase.table("expenses").update({
            "status": "rejected",
            "approved_by": current_user.id,
            "approved_at": datetime.utcnow().isoformat(),
            "notes": reason,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", expense_id).execute()
        
        if result.data:
            return {"message": "Expense rejected successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reject expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject expense: {str(e)}"
        )

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense"""
    try:
        supabase = get_supabase_client()
        
        # Check if expense exists
        existing = supabase.table("expenses").select("*").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )
        
        expense = existing.data[0]
        
        # Check if user can delete this expense
        if expense["employee_id"] != current_user.id and not current_user.is_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this expense"
            )
        
        # Allow deletion at any status - no restriction
        
        # Delete the expense
        result = supabase.table("expenses").delete().eq("id", expense_id).execute()
        
        if result.data:
            return {"message": "Expense deleted successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete expense"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete expense: {str(e)}"
        )

@router.post("/expenses/reimbursement")
async def create_expense_reimbursement(
    reimbursement_data: ExpenseReimbursement,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create reimbursement for approved expenses"""
    try:
        supabase = get_supabase_client()
        
        # Validate all expenses exist and are approved
        for expense_id in reimbursement_data.expense_ids:
            expense_result = supabase.table("expenses").select("*").eq("id", expense_id).execute()
            if not expense_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Expense {expense_id} not found"
                )
            
            expense = expense_result.data[0]
            if expense["status"] != "approved":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Expense {expense_id} is not approved"
                )
        
        # Update expenses to reimbursed status
        for expense_id in reimbursement_data.expense_ids:
            supabase.table("expenses").update({
                "status": "reimbursed",
                "paid_by": current_user.id,
                "paid_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", expense_id).execute()
        
        return {
            "message": "Expense reimbursement processed successfully",
            "reimbursement": reimbursement_data.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process reimbursement: {str(e)}"
        )

@router.get("/expenses/billable")
async def get_billable_expenses(
    customer_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    unbilled_only: bool = Query(True),
    current_user: User = Depends(get_current_user)
):
    """Get expenses that can be billed to customers"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("expenses").select("*").eq("is_billable", True).eq("status", "approved")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        # TODO: Add logic to filter unbilled expenses if needed
        # This would require tracking which expenses have been added to invoices
        
        result = query.order("expense_date", desc=True).execute()
        
        return {
            "billable_expenses": [Expense(**expense) for expense in result.data],
            "total_amount": sum(expense["billable_amount"] or expense["amount"] for expense in result.data)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch billable expenses: {str(e)}"
        )

# ============================================================================
# BILLS MANAGEMENT - Quản lý hóa đơn phải trả
# ============================================================================

# ============================================================================
# VENDORS MANAGEMENT - Quản lý nhà cung cấp
# ============================================================================

@router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    vendor_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all vendors with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("vendors").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"name.ilike.%{search}%,vendor_code.ilike.%{search}%,contact_person.ilike.%{search}%")
        
        if vendor_type:
            query = query.eq("vendor_type", vendor_type)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination and ordering
        result = query.order("name", desc=False).range(skip, skip + limit - 1).execute()
        
        return [Vendor(**vendor) for vendor in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch vendors: {str(e)}"
        )

@router.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific vendor by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("vendors").select("*").eq("id", vendor_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        return Vendor(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch vendor: {str(e)}"
        )

@router.post("/vendors", response_model=Vendor)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new vendor"""
    try:
        supabase = get_supabase_client()
        
        # Check if vendor code already exists
        existing = supabase.table("vendors").select("id").eq("vendor_code", vendor_data.vendor_code).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vendor code already exists"
            )
        
        # Create vendor record
        vendor_dict = vendor_data.dict()
        vendor_dict["id"] = str(uuid.uuid4())
        vendor_dict["created_by"] = current_user.id
        vendor_dict["created_at"] = datetime.utcnow().isoformat()
        vendor_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("vendors").insert(vendor_dict).execute()
        
        if result.data:
            return Vendor(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create vendor"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vendor: {str(e)}"
        )

@router.put("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(
    vendor_id: str,
    vendor_data: VendorUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a vendor"""
    try:
        supabase = get_supabase_client()
        
        # Check if vendor exists
        existing = supabase.table("vendors").select("*").eq("id", vendor_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in vendor_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("vendors").update(update_dict).eq("id", vendor_id).execute()
        
        if result.data:
            return Vendor(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update vendor"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update vendor: {str(e)}"
        )

@router.get("/vendors/{vendor_id}/bills")
async def get_vendor_bills(
    vendor_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all bills for a specific vendor"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("bills").select("*").eq("vendor_id", vendor_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("due_date", desc=False).range(skip, skip + limit - 1).execute()
        
        return {
            "bills": [Bill(**bill) for bill in result.data],
            "total_count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch vendor bills: {str(e)}"
        )

@router.get("/bills", response_model=List[Bill])
async def get_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    vendor_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    overdue_only: bool = Query(False),
    due_soon: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get all bills with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("bills").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"bill_number.ilike.%{search}%,description.ilike.%{search}%")
        
        if vendor_id:
            query = query.eq("vendor_id", vendor_id)
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        if status:
            query = query.eq("status", status)
        
        # Special filters
        today = datetime.now().date()
        if overdue_only:
            query = query.lt("due_date", today.isoformat()).neq("status", "paid")
        
        if due_soon:
            # Bills due within next 7 days
            soon_date = (today + timedelta(days=7)).isoformat()
            query = query.gte("due_date", today.isoformat()).lte("due_date", soon_date).neq("status", "paid")
        
        # Apply pagination and ordering
        result = query.order("due_date", desc=False).range(skip, skip + limit - 1).execute()
        
        return [Bill(**bill) for bill in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bills: {str(e)}"
        )

@router.get("/bills/{bill_id}", response_model=Bill)
async def get_bill(
    bill_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific bill by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("bills").select("*").eq("id", bill_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        return Bill(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bill: {str(e)}"
        )

@router.post("/bills", response_model=Bill)
async def create_bill(
    bill_data: BillCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new bill"""
    try:
        supabase = get_supabase_client()
        
        # Check if bill number already exists
        existing = supabase.table("bills").select("id").eq("bill_number", bill_data.bill_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bill number already exists"
            )
        
        # Calculate amounts
        tax_amount = bill_data.subtotal * (bill_data.tax_rate / 100)
        total_amount = bill_data.subtotal + tax_amount
        
        # Create bill record
        bill_dict = bill_data.dict()
        bill_dict["id"] = str(uuid.uuid4())
        bill_dict["tax_amount"] = tax_amount
        bill_dict["total_amount"] = total_amount
        bill_dict["created_by"] = current_user.id
        bill_dict["created_at"] = datetime.utcnow().isoformat()
        bill_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("bills").insert(bill_dict).execute()
        
        if result.data:
            return Bill(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create bill"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bill: {str(e)}"
        )

@router.put("/bills/{bill_id}", response_model=Bill)
async def update_bill(
    bill_id: str,
    bill_data: BillUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a bill"""
    try:
        supabase = get_supabase_client()
        
        # Check if bill exists
        existing = supabase.table("bills").select("*").eq("id", bill_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in bill_data.dict().items() if v is not None}
        
        # Recalculate totals if needed
        if any(field in update_dict for field in ["subtotal", "tax_rate"]):
            current_bill = existing.data[0]
            subtotal = update_dict.get("subtotal", current_bill["subtotal"])
            tax_rate = update_dict.get("tax_rate", current_bill["tax_rate"])
            
            tax_amount = subtotal * (tax_rate / 100)
            total_amount = subtotal + tax_amount
            
            update_dict["tax_amount"] = tax_amount
            update_dict["total_amount"] = total_amount
        
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("bills").update(update_dict).eq("id", bill_id).execute()
        
        if result.data:
            return Bill(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update bill"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bill: {str(e)}"
        )

@router.put("/bills/{bill_id}/payment")
async def record_bill_payment(
    bill_id: str,
    payment_amount: float,
    payment_date: Optional[date] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Record a payment for a bill"""
    try:
        supabase = get_supabase_client()
        
        # Get bill
        bill_result = supabase.table("bills").select("*").eq("id", bill_id).execute()
        if not bill_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bill not found"
            )
        
        bill = bill_result.data[0]
        current_paid = bill["paid_amount"]
        new_paid = current_paid + payment_amount
        total_amount = bill["amount"]
        
        # Determine payment status
        if new_paid >= total_amount:
            payment_status = "paid"
        elif new_paid > 0:
            payment_status = "partial"
        else:
            payment_status = "pending"
        
        # Update bill
        update_data = {
            "paid_amount": new_paid,
            "status": payment_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if payment_date:
            update_data["paid_date"] = payment_date.isoformat()
        
        result = supabase.table("bills").update(update_data).eq("id", bill_id).execute()
        
        if result.data:
            return {
                "message": "Payment recorded successfully",
                "bill": result.data[0]
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record payment"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record payment: {str(e)}"
        )

# ============================================================================
# DASHBOARD & ANALYTICS - Dashboard chi phí
# ============================================================================

@router.get("/dashboard/stats")
async def get_expense_dashboard_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive expense dashboard statistics"""
    try:
        supabase = get_supabase_client()
        
        # Get expense statistics
        expense_query = supabase.table("expenses").select("*")
        if start_date and end_date:
            expense_query = expense_query.gte("expense_date", start_date.isoformat()).lte("expense_date", end_date.isoformat())
        elif start_date:
            expense_query = expense_query.gte("expense_date", start_date.isoformat())
        elif end_date:
            expense_query = expense_query.lte("expense_date", end_date.isoformat())
        
        expenses = expense_query.execute()
        
        # Calculate expense statistics
        total_expenses = sum(expense["amount"] for expense in expenses.data)
        reimbursable_expenses = sum(expense["amount"] for expense in expenses.data if expense["is_reimbursable"])
        billable_expenses = sum(expense["billable_amount"] or expense["amount"] for expense in expenses.data if expense["is_billable"])
        
        # Count expenses by status
        status_counts = {}
        for expense in expenses.data:
            status = expense["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count expenses by category
        category_amounts = {}
        for expense in expenses.data:
            category = expense["category"]
            category_amounts[category] = category_amounts.get(category, 0) + expense["amount"]
        
        # Count expenses by payment method
        payment_method_counts = {}
        for expense in expenses.data:
            method = expense["payment_method"]
            payment_method_counts[method] = payment_method_counts.get(method, 0) + 1
        
        # Get bill statistics
        bill_query = supabase.table("bills").select("*")
        if start_date and end_date:
            bill_query = bill_query.gte("issue_date", start_date.isoformat()).lte("issue_date", end_date.isoformat())
        elif start_date:
            bill_query = bill_query.gte("issue_date", start_date.isoformat())
        elif end_date:
            bill_query = bill_query.lte("issue_date", end_date.isoformat())
        
        bills = bill_query.execute()
        
        total_bills = sum(bill["total_amount"] for bill in bills.data)
        paid_bills = sum(bill["paid_amount"] for bill in bills.data)
        pending_bills = total_bills - paid_bills
        
        # Count overdue bills
        today = datetime.now().date()
        overdue_count = 0
        overdue_amount = 0
        for bill in bills.data:
            if bill["due_date"] and bill["status"] != "paid":
                due_date = datetime.fromisoformat(bill["due_date"]).date()
                if due_date < today:
                    overdue_count += 1
                    overdue_amount += (bill["total_amount"] - bill["paid_amount"])
        
        # Count bills due soon (within 7 days)
        soon_date = today + timedelta(days=7)
        due_soon_count = 0
        due_soon_amount = 0
        for bill in bills.data:
            if bill["due_date"] and bill["status"] != "paid":
                due_date = datetime.fromisoformat(bill["due_date"]).date()
                if today <= due_date <= soon_date:
                    due_soon_count += 1
                    due_soon_amount += (bill["total_amount"] - bill["paid_amount"])
        
        # Get vendor statistics
        vendor_stats = supabase.table("vendors").select("status").execute()
        active_vendors = sum(1 for v in vendor_stats.data if v["status"] == "active")
        
        return {
            "expenses": {
                "total_amount": total_expenses,
                "total_count": len(expenses.data),
                "reimbursable_amount": reimbursable_expenses,
                "billable_amount": billable_expenses,
                "by_status": status_counts,
                "by_category": category_amounts,
                "by_payment_method": payment_method_counts
            },
            "bills": {
                "total_amount": total_bills,
                "paid_amount": paid_bills,
                "pending_amount": pending_bills,
                "total_count": len(bills.data),
                "overdue": {
                    "count": overdue_count,
                    "amount": overdue_amount
                },
                "due_soon": {
                    "count": due_soon_count,
                    "amount": due_soon_amount
                }
            },
            "vendors": {
                "total_count": len(vendor_stats.data),
                "active_count": active_vendors
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense dashboard stats: {str(e)}"
        )

@router.get("/bills/due-reminders")
async def get_bill_due_reminders(
    current_user: User = Depends(get_current_user)
):
    """Get bills that need payment attention"""
    try:
        supabase = get_supabase_client()
        
        today = datetime.now().date()
        
        # Get overdue bills
        overdue_bills = supabase.table("bills").select("*").lt("due_date", today.isoformat()).neq("status", "paid").execute()
        
        # Get bills due soon (within 7 days)
        soon_date = (today + timedelta(days=7)).isoformat()
        due_soon_bills = supabase.table("bills").select("*").gte("due_date", today.isoformat()).lte("due_date", soon_date).neq("status", "paid").execute()
        
        # Get bills due today
        due_today_bills = supabase.table("bills").select("*").eq("due_date", today.isoformat()).neq("status", "paid").execute()
        
        return {
            "overdue": {
                "bills": [Bill(**bill) for bill in overdue_bills.data],
                "count": len(overdue_bills.data),
                "total_amount": sum(bill["total_amount"] - bill["paid_amount"] for bill in overdue_bills.data)
            },
            "due_today": {
                "bills": [Bill(**bill) for bill in due_today_bills.data],
                "count": len(due_today_bills.data),
                "total_amount": sum(bill["total_amount"] - bill["paid_amount"] for bill in due_today_bills.data)
            },
            "due_soon": {
                "bills": [Bill(**bill) for bill in due_soon_bills.data],
                "count": len(due_soon_bills.data),
                "total_amount": sum(bill["total_amount"] - bill["paid_amount"] for bill in due_soon_bills.data)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bill due reminders: {str(e)}"
        )

@router.get("/expenses/categories/summary")
async def get_expense_category_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get expense summary by category"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("expenses").select("*").eq("status", "approved")
        
        if start_date and end_date:
            query = query.gte("expense_date", start_date.isoformat()).lte("expense_date", end_date.isoformat())
        elif start_date:
            query = query.gte("expense_date", start_date.isoformat())
        elif end_date:
            query = query.lte("expense_date", end_date.isoformat())
        
        expenses = query.execute()
        
        # Group by category
        category_summary = {}
        for expense in expenses.data:
            category = expense["category"]
            if category not in category_summary:
                category_summary[category] = {
                    "total_amount": 0,
                    "count": 0,
                    "billable_amount": 0,
                    "reimbursable_amount": 0
                }
            
            category_summary[category]["total_amount"] += expense["amount"]
            category_summary[category]["count"] += 1
            
            if expense["is_billable"]:
                category_summary[category]["billable_amount"] += expense["billable_amount"] or expense["amount"]
            
            if expense["is_reimbursable"]:
                category_summary[category]["reimbursable_amount"] += expense["amount"]
        
        return category_summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch expense category summary: {str(e)}"
        )