from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.budget import (
    Budget, 
    BudgetCreate, 
    BudgetUpdate,
    BudgetSummary,
    BudgetStats,
    BudgetWithLines,
    BudgetReport,
    BudgetVariance,
    BudgetApproval,
    BudgetLineCreate,
    BudgetLineUpdate,
    BudgetStatus,
    BudgetPeriod
)
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/expenses/budgets", tags=["Budgeting"])

# ============================================================================
# BUDGET MANAGEMENT - Quản lý ngân sách
# ============================================================================

@router.get("/", response_model=List[BudgetSummary])
async def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all budgets with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        # Use the view for better performance
        query = supabase.table("budget_summary").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"budget_name.ilike.%{search}%,description.ilike.%{search}%")
        
        if period:
            query = query.eq("period", period)
        
        if status:
            query = query.eq("status", status)
        
        if start_date:
            query = query.gte("start_date", start_date.isoformat())
        
        if end_date:
            query = query.lte("end_date", end_date.isoformat())
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [BudgetSummary(**budget) for budget in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch budgets: {str(e)}"
        )

@router.get("/{budget_id}", response_model=BudgetWithLines)
async def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific budget by ID with detailed lines"""
    try:
        supabase = get_supabase_client()
        
        # Get budget details
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        budget = budget_result.data[0]
        
        # Get budget lines
        lines_result = supabase.table("budget_lines").select("*").eq("budget_id", budget_id).execute()
        
        budget["lines"] = lines_result.data or []
        
        return BudgetWithLines(**budget)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch budget: {str(e)}"
        )

@router.post("/", response_model=Budget, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new budget (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Create budget
        budget_dict = budget_data.dict()
        budget_dict.update({
            "id": str(uuid.uuid4()),
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        # Convert date objects to strings for JSON serialization
        if 'start_date' in budget_dict and isinstance(budget_dict['start_date'], date):
            budget_dict['start_date'] = budget_dict['start_date'].isoformat()
        if 'end_date' in budget_dict and isinstance(budget_dict['end_date'], date):
            budget_dict['end_date'] = budget_dict['end_date'].isoformat()
        
        result = supabase.table("budgets").insert(budget_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create budget"
            )
        
        created_budget = result.data[0]
        
        # Create budget lines
        if budget_data.budget_lines:
            lines_data = []
            for line in budget_data.budget_lines:
                line_dict = line.dict()
                line_dict.update({
                    "id": str(uuid.uuid4()),
                    "budget_id": created_budget["id"],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
                lines_data.append(line_dict)
            
            supabase.table("budget_lines").insert(lines_data).execute()
        
        return Budget(**created_budget)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating budget: {str(e)}"
        )

@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: str,
    budget_data: BudgetUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a budget (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists and is in draft status
        existing_budget = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not existing_budget.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        if existing_budget.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be updated"
            )
        
        # Update budget
        update_data = {k: v for k, v in budget_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert date objects to strings
        if 'start_date' in update_data and isinstance(update_data['start_date'], date):
            update_data['start_date'] = update_data['start_date'].isoformat()
        if 'end_date' in update_data and isinstance(update_data['end_date'], date):
            update_data['end_date'] = update_data['end_date'].isoformat()
        
        result = supabase.table("budgets").update(update_data).eq("id", budget_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update budget"
            )
        
        return Budget(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating budget: {str(e)}"
        )

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a budget (only if status is 'draft')"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists and is in draft status
        existing_budget = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not existing_budget.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        if existing_budget.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be deleted"
            )
        
        # Delete budget (lines will be deleted by CASCADE)
        result = supabase.table("budgets").delete().eq("id", budget_id).execute()
        
        return {"message": "Budget deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting budget: {str(e)}"
        )

# ============================================================================
# BUDGET APPROVAL - Phê duyệt ngân sách
# ============================================================================

@router.post("/{budget_id}/approve")
async def approve_budget(
    budget_id: str,
    approval_data: BudgetApproval,
    current_user: User = Depends(require_manager_or_admin)
):
    """Approve or close a budget (Manager/Admin only)"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists
        existing_budget = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not existing_budget.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        current_status = existing_budget.data[0]["status"]
        
        # Validate status transition
        if approval_data.action == "approve" and current_status != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be approved"
            )
        
        if approval_data.action == "close" and current_status not in ["active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active budgets can be closed"
            )
        
        # Determine new status
        new_status = "active" if approval_data.action == "approve" else "closed"
        
        # Update budget
        update_data = {
            "status": new_status,
            "approved_by": current_user.id if approval_data.action == "approve" else existing_budget.data[0].get("approved_by"),
            "approved_at": datetime.utcnow().isoformat() if approval_data.action == "approve" else existing_budget.data[0].get("approved_at"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add approval notes
        if approval_data.notes:
            update_data["description"] = existing_budget.data[0].get("description", "") + f"\n\n{approval_data.action.title()} Notes: {approval_data.notes}"
        
        result = supabase.table("budgets").update(update_data).eq("id", budget_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to {approval_data.action} budget"
            )
        
        return {
            "message": f"Budget {approval_data.action}d successfully",
            "budget": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error {approval_data.action}ing budget: {str(e)}"
        )

# ============================================================================
# BUDGET REPORTS - Báo cáo ngân sách
# ============================================================================

@router.get("/{budget_id}/report", response_model=BudgetReport)
async def get_budget_report(
    budget_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get budget report with actual vs budgeted amounts"""
    try:
        supabase = get_supabase_client()
        
        # Get budget details
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        budget = budget_result.data[0]
        
        # Get budget lines with actual amounts
        lines_result = supabase.table("budget_lines").select("*").eq("budget_id", budget_id).execute()
        
        # Calculate totals
        total_budgeted = sum(line.get("budgeted_amount", 0) for line in lines_result.data)
        total_actual = sum(line.get("actual_amount", 0) for line in lines_result.data)
        total_variance = total_actual - total_budgeted
        total_variance_percentage = (total_variance / total_budgeted * 100) if total_budgeted > 0 else 0
        
        # Create variance list
        variances = []
        for line in lines_result.data:
            variances.append(BudgetVariance(
                expense_category=line.get("expense_category", ""),
                budgeted_amount=line.get("budgeted_amount", 0),
                actual_amount=line.get("actual_amount", 0),
                variance_amount=line.get("variance_amount", 0),
                variance_percentage=line.get("variance_percentage", 0)
            ))
        
        return BudgetReport(
            budget_id=budget_id,
            budget_name=budget.get("budget_name", ""),
            period=budget.get("period", ""),
            start_date=budget.get("start_date", ""),
            end_date=budget.get("end_date", ""),
            total_budgeted=total_budgeted,
            total_actual=total_actual,
            total_variance=total_variance,
            total_variance_percentage=total_variance_percentage,
            variances=variances,
            currency=budget.get("currency", "VND")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate budget report: {str(e)}"
        )

@router.post("/{budget_id}/update-actuals")
async def update_budget_actuals(
    budget_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update actual amounts from expenses and bills"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        budget = budget_result.data[0]
        
        # Call the database function to update actual amounts
        result = supabase.rpc("update_budget_actual_amounts", {
            "budget_id": budget_id
        }).execute()
        
        if result.data is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update budget actuals"
            )
        
        return {
            "message": "Budget actuals updated successfully",
            "budget_id": budget_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating budget actuals: {str(e)}"
        )

# ============================================================================
# BUDGET LINES MANAGEMENT - Quản lý dòng ngân sách
# ============================================================================

@router.post("/{budget_id}/lines", response_model=dict)
async def add_budget_line(
    budget_id: str,
    line_data: BudgetLineCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Add a new line to a budget"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists and is in draft status
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        if budget_result.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be modified"
            )
        
        # Create budget line
        line_dict = line_data.dict()
        line_dict.update({
            "id": str(uuid.uuid4()),
            "budget_id": budget_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })
        
        result = supabase.table("budget_lines").insert(line_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add budget line"
            )
        
        return {
            "message": "Budget line added successfully",
            "line": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding budget line: {str(e)}"
        )

@router.put("/{budget_id}/lines/{line_id}", response_model=dict)
async def update_budget_line(
    budget_id: str,
    line_id: str,
    line_data: BudgetLineUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a budget line"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists and is in draft status
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        if budget_result.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be modified"
            )
        
        # Update budget line
        update_data = {k: v for k, v in line_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("budget_lines").update(update_data).eq("id", line_id).eq("budget_id", budget_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget line not found"
            )
        
        return {
            "message": "Budget line updated successfully",
            "line": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating budget line: {str(e)}"
        )

@router.delete("/{budget_id}/lines/{line_id}")
async def delete_budget_line(
    budget_id: str,
    line_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a budget line"""
    try:
        supabase = get_supabase_client()
        
        # Check if budget exists and is in draft status
        budget_result = supabase.table("budgets").select("*").eq("id", budget_id).execute()
        if not budget_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        if budget_result.data[0]["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft budgets can be modified"
            )
        
        # Delete budget line
        result = supabase.table("budget_lines").delete().eq("id", line_id).eq("budget_id", budget_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget line not found"
            )
        
        return {"message": "Budget line deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting budget line: {str(e)}"
        )

# ============================================================================
# STATISTICS & REPORTS - Thống kê và báo cáo
# ============================================================================

@router.get("/stats", response_model=BudgetStats)
async def get_budget_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    period: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get budget statistics"""
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("budgets").select("*")
        
        if start_date:
            query = query.gte("start_date", start_date.isoformat())
        if end_date:
            query = query.lte("end_date", end_date.isoformat())
        if period:
            query = query.eq("period", period)
        
        result = query.execute()
        
        # Calculate statistics
        total_budgets = len(result.data)
        total_budgeted_amount = sum(budget.get("total_budget_amount", 0) for budget in result.data)
        
        # Get actual amounts from budget lines
        budget_ids = [budget["id"] for budget in result.data]
        if budget_ids:
            lines_result = supabase.table("budget_lines").select("actual_amount").in_("budget_id", budget_ids).execute()
            total_actual_amount = sum(line.get("actual_amount", 0) for line in lines_result.data)
        else:
            total_actual_amount = 0
        
        total_variance_amount = total_actual_amount - total_budgeted_amount
        
        # Group by status
        by_status = {}
        for budget in result.data:
            status = budget.get("status", "unknown")
            by_status[status] = by_status.get(status, 0) + 1
        
        # Group by period
        by_period = {}
        for budget in result.data:
            period = budget.get("period", "unknown")
            by_period[period] = by_period.get(period, 0) + 1
        
        return BudgetStats(
            total_budgets=total_budgets,
            total_budgeted_amount=total_budgeted_amount,
            total_actual_amount=total_actual_amount,
            total_variance_amount=total_variance_amount,
            active_budgets=by_status.get("active", 0),
            draft_budgets=by_status.get("draft", 0),
            closed_budgets=by_status.get("closed", 0),
            by_period=by_period,
            by_status=by_status
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch budget statistics: {str(e)}"
        )
