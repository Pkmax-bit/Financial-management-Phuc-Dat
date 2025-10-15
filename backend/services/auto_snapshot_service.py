"""
Auto Snapshot Service
Handles automatic snapshot creation when child expenses are created
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from services.supabase_client import get_supabase_client

class AutoSnapshotService:
    """Service for handling automatic snapshots"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def _get_short_table_name(self, table_name: str) -> str:
        """Convert long table names to shorter ones for snapshot_type field"""
        mapping = {
            'expenses': 'expenses',
            'project_expenses': 'project_actual',
            'project_expenses_quote': 'project_planned'
        }
        return mapping.get(table_name, table_name)
    
    async def create_auto_snapshot_for_child(
        self, 
        child_expense: Dict[str, Any], 
        table_name: str,
        created_by: str = None
    ) -> Optional[Dict[str, Any]]:
        """Create automatic snapshot when child expense is created"""
        try:
            # Check if this is a child expense (has id_parent)
            if not child_expense.get('id_parent'):
                return None
            
            parent_id = child_expense['id_parent']
            
            # Get parent expense data
            parent_data = await self._get_parent_expense_data(parent_id, table_name)
            
            if not parent_data:
                print(f"❌ Parent expense not found: {parent_id}")
                return None
            
            # Create snapshot data
            snapshot_data = {
                'parent_expense': parent_data,
                'child_expense': child_expense,
                'snapshot_type': table_name,
                'created_at': datetime.now().isoformat(),
                'trigger_reason': 'child_creation'
            }
            
            # Get short table name for snapshot_type field
            short_table_name = self._get_short_table_name(table_name)
            
            # Create snapshot name
            snapshot_name = f"Auto-snapshot-{short_table_name}-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}"
            
            # Insert snapshot with separate ID columns
            result = self.supabase.table('expense_snapshots').insert({
                'snapshot_name': snapshot_name,
                'snapshot_description': f'Auto-snapshot created when child expense was added to parent {parent_id}',
                'snapshot_type': short_table_name,
                'expenses_data': [snapshot_data],
                'parent_expense_id': parent_id,
                'child_expense_id': child_expense.get('id'),
                'project_id': parent_data.get('project_id'),
                'created_by': created_by,
                'is_active': True
            }).execute()
            
            if result.data:
                print(f"✅ Auto-snapshot created: {snapshot_name}")
                return result.data[0]
            else:
                print(f"❌ Failed to create auto-snapshot")
                return None
                
        except Exception as e:
            print(f"❌ Error creating auto-snapshot: {e}")
            return None
    
    async def _get_parent_expense_data(self, parent_id: str, table_name: str) -> Optional[Dict[str, Any]]:
        """Get parent expense data"""
        try:
            result = self.supabase.table(table_name).select('*').eq('id', parent_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                return None
                
        except Exception as e:
            print(f"❌ Error getting parent expense data: {e}")
            return None
    
    async def get_latest_auto_snapshot(
        self, 
        parent_id: str, 
        table_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get latest auto-snapshot for a parent expense"""
        try:
            short_table_name = self._get_short_table_name(table_name)
            result = self.supabase.table('expense_snapshots').select(
                'id, snapshot_name, expenses_data, created_at, parent_expense_id, child_expense_id, project_id'
            ).eq('snapshot_type', short_table_name).eq('parent_expense_id', parent_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting latest auto-snapshot: {e}")
            return None
    
    async def restore_parent_from_snapshot(
        self, 
        parent_id: str, 
        table_name: str
    ) -> bool:
        """Restore parent expense from latest snapshot"""
        try:
            # Get latest snapshot
            snapshot = await self.get_latest_auto_snapshot(parent_id, table_name)
            
            if not snapshot:
                print(f"❌ No snapshot found for parent: {parent_id}")
                return False
            
            expenses_data = snapshot.get('expenses_data', [])
            if not expenses_data or len(expenses_data) == 0:
                print(f"❌ No expense data in snapshot")
                return False
            
            parent_data = expenses_data[0].get('parent_expense')
            if not parent_data:
                print(f"❌ No parent data in snapshot")
                return False
            
            # Restore parent expense
            update_data = {
                'description': parent_data.get('description'),
                'amount': parent_data.get('amount'),
                'currency': parent_data.get('currency'),
                'expense_date': parent_data.get('expense_date'),
                'status': parent_data.get('status'),
                'notes': parent_data.get('notes'),
                'receipt_url': parent_data.get('receipt_url'),
                'updated_at': datetime.now().isoformat()
            }
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            result = self.supabase.table(table_name).update(update_data).eq('id', parent_id).execute()
            
            if result.data:
                print(f"✅ Parent expense restored from snapshot")
                return True
            else:
                print(f"❌ Failed to restore parent expense")
                return False
                
        except Exception as e:
            print(f"❌ Error restoring parent from snapshot: {e}")
            return False
    
    async def get_restore_history(
        self, 
        parent_id: str, 
        table_name: str
    ) -> List[Dict[str, Any]]:
        """Get restore history for a parent expense"""
        try:
            short_table_name = self._get_short_table_name(table_name)
            result = self.supabase.table('expense_snapshots').select(
                'id, snapshot_name, created_at, restored_at, parent_expense_id, child_expense_id, project_id'
            ).eq('snapshot_type', short_table_name).eq('parent_expense_id', parent_id).eq('is_active', True).order('created_at', desc=True).execute()
            
            history = []
            if result.data:
                for snapshot in result.data:
                    history.append({
                        'snapshot_id': snapshot['id'],
                        'snapshot_name': snapshot['snapshot_name'],
                        'created_at': snapshot['created_at'],
                        'restored_at': snapshot.get('restored_at'),
                        'can_restore': snapshot.get('restored_at') is None,
                        'parent_expense_id': snapshot.get('parent_expense_id'),
                        'child_expense_id': snapshot.get('child_expense_id'),
                        'project_id': snapshot.get('project_id')
                    })
            
            return history
            
        except Exception as e:
            print(f"❌ Error getting restore history: {e}")
            return []
    
    async def mark_snapshot_as_restored(self, snapshot_id: str, restored_by: str = None) -> bool:
        """Mark snapshot as restored"""
        try:
            result = self.supabase.table('expense_snapshots').update({
                'restored_at': datetime.now().isoformat(),
                'restored_by': restored_by
            }).eq('id', snapshot_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            print(f"❌ Error marking snapshot as restored: {e}")
            return False
