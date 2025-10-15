"""
Expense Restore Router
Handles automatic snapshot and restore functionality for parent-child expenses
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client
from services.auto_snapshot_service import AutoSnapshotService

router = APIRouter()

@router.get("/history/{parent_id}")
async def get_restore_history(
    parent_id: str,
    table_name: str = Query(..., description="Table name: expenses, project_expenses, project_expenses_quote"),
    current_user: User = Depends(get_current_user)
):
    """Get restore history for a parent expense"""
    try:
        auto_snapshot_service = AutoSnapshotService()
        
        # Get restore history using service
        history = await auto_snapshot_service.get_restore_history(parent_id, table_name)
        
        return {
            'parent_id': parent_id,
            'table_name': table_name,
            'restore_history': history
        }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get restore history: {str(e)}"
        )

@router.get("/latest-snapshot/{parent_id}")
async def get_latest_snapshot(
    parent_id: str,
    table_name: str = Query(..., description="Table name: expenses, project_expenses, project_expenses_quote"),
    current_user: User = Depends(get_current_user)
):
    """Get latest auto-snapshot for a parent expense"""
    try:
        auto_snapshot_service = AutoSnapshotService()
        
        # Get latest snapshot using service
        snapshot = await auto_snapshot_service.get_latest_auto_snapshot(parent_id, table_name)
        
        if snapshot:
            return {
                'parent_id': parent_id,
                'table_name': table_name,
                'snapshot_data': snapshot,
                'has_snapshot': True
            }
        else:
            return {
                'parent_id': parent_id,
                'table_name': table_name,
                'snapshot_data': None,
                'has_snapshot': False
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get latest snapshot: {str(e)}"
        )

@router.post("/restore-parent/{parent_id}")
async def restore_parent_expense(
    parent_id: str,
    table_name: str = Query(..., description="Table name: expenses, project_expenses, project_expenses_quote"),
    current_user: User = Depends(get_current_user)
):
    """Restore parent expense from latest snapshot"""
    try:
        auto_snapshot_service = AutoSnapshotService()
        
        # Restore parent using service
        success = await auto_snapshot_service.restore_parent_from_snapshot(parent_id, table_name)
        
        if success:
            return {
                'message': 'Parent expense restored successfully',
                'parent_id': parent_id,
                'table_name': table_name,
                'restored_at': datetime.now().isoformat(),
                'restored_by': current_user.id
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No snapshot found or restore failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore parent expense: {str(e)}"
        )

@router.post("/create-manual-snapshot/{parent_id}")
async def create_manual_snapshot(
    parent_id: str,
    table_name: str = Query(..., description="Table name: expenses, project_expenses, project_expenses_quote"),
    snapshot_name: str = Query(..., description="Name for the snapshot"),
    current_user: User = Depends(get_current_user)
):
    """Create manual snapshot for a parent expense"""
    try:
        supabase = get_supabase_client()
        
        # Get parent expense data
        parent_data = await _get_parent_expense_data(supabase, parent_id, table_name)
        
        if not parent_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent expense not found"
            )
        
        # Create snapshot data
        snapshot_data = {
            'parent_expense': parent_data,
            'snapshot_type': table_name,
            'created_at': datetime.now().isoformat(),
            'trigger_reason': 'manual_creation'
        }
        
        # Insert snapshot
        result = supabase.table('expense_snapshots').insert({
            'snapshot_name': snapshot_name,
            'snapshot_description': f'Manual snapshot for parent expense {parent_id}',
            'snapshot_type': table_name,
            'expenses_data': [snapshot_data],
            'created_by': current_user.id,
            'is_active': True
        }).execute()
        
        if result.data:
            return {
                'message': 'Manual snapshot created successfully',
                'snapshot_id': result.data[0]['id'],
                'snapshot_name': snapshot_name,
                'parent_id': parent_id,
                'created_at': datetime.now().isoformat()
            }
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
            detail=f"Failed to create manual snapshot: {str(e)}"
        )

@router.get("/check-auto-snapshots")
async def check_auto_snapshots(
    limit: int = Query(10, ge=1, le=50, description="Limit number of results"),
    current_user: User = Depends(get_current_user)
):
    """Check recent auto-snapshots"""
    try:
        supabase = get_supabase_client()
        
        # Get recent auto-snapshots
        result = supabase.table('expense_snapshots').select(
            'id, snapshot_name, snapshot_description, snapshot_type, created_at, expenses_data'
        ).eq('is_active', True).order('created_at', desc=True).limit(limit).execute()
        
        auto_snapshots = []
        for snapshot in result.data or []:
            expenses_data = snapshot.get('expenses_data', [])
            if expenses_data and len(expenses_data) > 0:
                first_expense = expenses_data[0]
                if first_expense.get('trigger_reason') == 'child_creation':
                    auto_snapshots.append({
                        'snapshot_id': snapshot['id'],
                        'snapshot_name': snapshot['snapshot_name'],
                        'snapshot_type': snapshot['snapshot_type'],
                        'created_at': snapshot['created_at'],
                        'parent_id': first_expense.get('parent_expense', {}).get('id'),
                        'child_id': first_expense.get('child_expense', {}).get('id')
                    })
        
        return {
            'auto_snapshots': auto_snapshots,
            'total_count': len(auto_snapshots)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check auto-snapshots: {str(e)}"
        )

# Helper functions

async def _get_parent_expense_data(supabase, parent_id: str, table_name: str) -> Optional[Dict[str, Any]]:
    """Get parent expense data"""
    try:
        result = supabase.table(table_name).select('*').eq('id', parent_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            return None
            
    except Exception as e:
        print(f"Error getting parent expense data: {e}")
        return None
