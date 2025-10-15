"""
Expense Snapshots Router
Manages expense snapshots with parent-child relationships
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.post("/expense-snapshots")
async def create_expense_snapshot(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense snapshot"""
    try:
        supabase = get_supabase_client()
        
        # Prepare snapshot data
        snapshot_data = {
            'id': str(uuid.uuid4()),
            'snapshot_name': payload.get('snapshot_name'),
            'snapshot_description': payload.get('snapshot_description'),
            'snapshot_type': payload.get('snapshot_type', 'all'),
            'snapshot_month': datetime.now().strftime('%Y-%m'),
            'created_by': current_user.id,
            'is_active': True
        }
        
        # Fetch expenses based on type
        expenses_data = await _fetch_expenses_by_type(
            supabase, 
            snapshot_data['snapshot_type']
        )
        snapshot_data['expenses_data'] = expenses_data
        
        # Insert snapshot (trigger will calculate stats automatically)
        result = supabase.table('expense_snapshots').insert(snapshot_data).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create snapshot"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create snapshot: {str(e)}"
        )

@router.get("/expense-snapshots")
async def get_expense_snapshots(
    snapshot_type: Optional[str] = Query(None, description="Filter by snapshot type"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100, description="Limit number of results"),
    current_user: User = Depends(get_current_user)
):
    """Get list of expense snapshots"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table('expense_snapshots').select('*')
        
        if snapshot_type:
            query = query.eq('snapshot_type', snapshot_type)
        
        if is_active is not None:
            query = query.eq('is_active', is_active)
        
        result = query.order('created_at', desc=True).limit(limit).execute()
        
        return result.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch snapshots: {str(e)}"
        )

@router.get("/expense-snapshots/{snapshot_id}")
async def get_expense_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense snapshot"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('expense_snapshots').select('*').eq('id', snapshot_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch snapshot: {str(e)}"
        )

@router.get("/expense-snapshots/{snapshot_id}/statistics")
async def get_snapshot_statistics(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get statistics for a specific snapshot"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('expense_snapshots').select(
            'snapshot_name, total_expenses_count, root_expenses_count, child_expenses_count, '
            'total_amount, root_amount, child_amount, hierarchy_levels, max_depth, '
            'snapshot_type, created_at'
        ).eq('id', snapshot_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found"
            )
        
        snapshot = result.data[0]
        
        return {
            'snapshot_name': snapshot.get('snapshot_name'),
            'total_expenses_count': snapshot.get('total_expenses_count', 0),
            'root_expenses_count': snapshot.get('root_expenses_count', 0),
            'child_expenses_count': snapshot.get('child_expenses_count', 0),
            'total_amount': float(snapshot.get('total_amount', 0)),
            'root_amount': float(snapshot.get('root_amount', 0)),
            'child_amount': float(snapshot.get('child_amount', 0)),
            'hierarchy_levels': snapshot.get('hierarchy_levels', 0),
            'max_depth': snapshot.get('max_depth', 0),
            'snapshot_type': snapshot.get('snapshot_type'),
            'created_at': snapshot.get('created_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch snapshot statistics: {str(e)}"
        )

@router.post("/expense-snapshots/{snapshot_id}/restore")
async def restore_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Restore a snapshot"""
    try:
        supabase = get_supabase_client()
        
        # Get snapshot data
        result = supabase.table('expense_snapshots').select('*').eq('id', snapshot_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found"
            )
        
        snapshot = result.data[0]
        expenses_data = snapshot.get('expenses_data', [])
        snapshot_type = snapshot.get('snapshot_type', 'all')
        
        # Clear existing data first
        await _clear_expenses_by_type(supabase, snapshot_type)
        
        # Restore expenses data
        success = await _restore_expenses_data(supabase, expenses_data, snapshot_type)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to restore expenses data"
            )
        
        # Update snapshot with restore info
        supabase.table('expense_snapshots').update({
            'restored_at': datetime.now().isoformat(),
            'restored_by': current_user.id
        }).eq('id', snapshot_id).execute()
        
        return {
            'message': 'Snapshot restored successfully',
            'snapshot_name': snapshot.get('snapshot_name'),
            'restored_at': datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore snapshot: {str(e)}"
        )

@router.delete("/expense-snapshots/{snapshot_id}")
async def delete_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a snapshot"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('expense_snapshots').delete().eq('id', snapshot_id).execute()
        
        if result.data:
            return {'message': 'Snapshot deleted successfully'}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Snapshot not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete snapshot: {str(e)}"
        )

# Helper functions

async def _fetch_expenses_by_type(supabase, snapshot_type: str) -> List[Dict[str, Any]]:
    """Fetch expenses based on snapshot type"""
    try:
        expenses = []
        
        if snapshot_type in ['all', 'expenses']:
            # Fetch regular expenses
            result = supabase.table('expenses').select('*').execute()
            if result.data:
                expenses.extend(result.data)
        
        if snapshot_type in ['all', 'project_planned']:
            # Fetch project planned expenses
            result = supabase.table('project_expenses_quote').select('*').execute()
            if result.data:
                expenses.extend(result.data)
        
        if snapshot_type in ['all', 'project_actual']:
            # Fetch project actual expenses
            result = supabase.table('project_expenses').select('*').execute()
            if result.data:
                expenses.extend(result.data)
        
        return expenses
        
    except Exception as e:
        print(f"Error fetching expenses: {e}")
        return []

async def _clear_expenses_by_type(supabase, snapshot_type: str):
    """Clear existing expenses based on type"""
    try:
        if snapshot_type in ['all', 'expenses']:
            # Clear regular expenses
            supabase.table('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        if snapshot_type in ['all', 'project_planned']:
            # Clear project planned expenses
            supabase.table('project_expenses_quote').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        if snapshot_type in ['all', 'project_actual']:
            # Clear project actual expenses
            supabase.table('project_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
    except Exception as e:
        print(f"Error clearing expenses: {e}")

async def _restore_expenses_data(supabase, expenses_data: List[Dict[str, Any]], snapshot_type: str) -> bool:
    """Restore expenses data"""
    try:
        for expense in expenses_data:
            # Determine table based on expense type or snapshot type
            table_name = _get_table_name(expense, snapshot_type)
            
            if table_name:
                # Remove id to let database generate new one
                expense_copy = {k: v for k, v in expense.items() if k != 'id'}
                
                # Insert expense
                result = supabase.table(table_name).insert(expense_copy).execute()
                
                if not result.data:
                    print(f"Failed to restore expense: {expense.get('description', 'Unknown')}")
                    return False
        
        return True
        
    except Exception as e:
        print(f"Error restoring expenses data: {e}")
        return False

def _get_table_name(expense: Dict[str, Any], snapshot_type: str) -> Optional[str]:
    """Determine table name for expense"""
    # Check if expense has specific fields that indicate table type
    if 'project_id' in expense:
        if 'status' in expense and expense.get('status') in ['pending', 'approved', 'rejected']:
            return 'project_expenses_quote'  # Planned expenses
        else:
            return 'project_expenses'  # Actual expenses
    else:
        return 'expenses'  # Regular expenses
