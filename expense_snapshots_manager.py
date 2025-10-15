#!/usr/bin/env python3
"""
Expense Snapshots Manager
Manages expense snapshots with parent-child relationships for all expense types
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

from services.supabase_client import get_supabase_client

class ExpenseSnapshotsManager:
    """Manager for expense snapshots with parent-child relationships"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def create_snapshot(
        self,
        snapshot_name: str,
        snapshot_description: str = None,
        snapshot_type: str = 'all',
        created_by: str = None
    ) -> Dict[str, Any]:
        """Create a new expense snapshot"""
        try:
            # Get current month
            current_month = datetime.now().strftime('%Y-%m')
            
            # Fetch expenses based on type
            expenses_data = self._fetch_expenses_by_type(snapshot_type)
            
            # Create snapshot record
            snapshot_data = {
                'snapshot_name': snapshot_name,
                'snapshot_description': snapshot_description,
                'snapshot_type': snapshot_type,
                'snapshot_month': current_month,
                'expenses_data': expenses_data,
                'created_by': created_by,
                'is_active': True
            }
            
            # Insert into database (trigger will calculate stats automatically)
            result = self.supabase.table('expense_snapshots').insert(snapshot_data).execute()
            
            if result.data:
                print(f"✅ Snapshot created successfully: {snapshot_name}")
                return result.data[0]
            else:
                raise Exception("Failed to create snapshot")
                
        except Exception as e:
            print(f"❌ Error creating snapshot: {e}")
            return None
    
    def _fetch_expenses_by_type(self, snapshot_type: str) -> List[Dict[str, Any]]:
        """Fetch expenses based on snapshot type"""
        try:
            expenses = []
            
            if snapshot_type in ['all', 'expenses']:
                # Fetch regular expenses
                result = self.supabase.table('expenses').select('*').execute()
                if result.data:
                    expenses.extend(result.data)
            
            if snapshot_type in ['all', 'project_planned']:
                # Fetch project planned expenses
                result = self.supabase.table('project_expenses_quote').select('*').execute()
                if result.data:
                    expenses.extend(result.data)
            
            if snapshot_type in ['all', 'project_actual']:
                # Fetch project actual expenses
                result = self.supabase.table('project_expenses').select('*').execute()
                if result.data:
                    expenses.extend(result.data)
            
            return expenses
            
        except Exception as e:
            print(f"❌ Error fetching expenses: {e}")
            return []
    
    def get_snapshot(self, snapshot_id: str) -> Dict[str, Any]:
        """Get a specific snapshot"""
        try:
            result = self.supabase.table('expense_snapshots').select('*').eq('id', snapshot_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                print(f"❌ Snapshot not found: {snapshot_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting snapshot: {e}")
            return None
    
    def get_snapshots(
        self,
        snapshot_type: str = None,
        is_active: bool = True,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get list of snapshots"""
        try:
            query = self.supabase.table('expense_snapshots').select('*')
            
            if snapshot_type:
                query = query.eq('snapshot_type', snapshot_type)
            
            if is_active is not None:
                query = query.eq('is_active', is_active)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            print(f"❌ Error getting snapshots: {e}")
            return []
    
    def restore_snapshot(self, snapshot_id: str, restored_by: str = None) -> bool:
        """Restore a snapshot"""
        try:
            # Get snapshot data
            snapshot = self.get_snapshot(snapshot_id)
            if not snapshot:
                return False
            
            # Restore expenses based on type
            expenses_data = snapshot.get('expenses_data', [])
            snapshot_type = snapshot.get('snapshot_type', 'all')
            
            # Clear existing data first
            self._clear_expenses_by_type(snapshot_type)
            
            # Insert restored data
            success = self._restore_expenses_data(expenses_data, snapshot_type)
            
            if success:
                # Update snapshot with restore info
                self.supabase.table('expense_snapshots').update({
                    'restored_at': datetime.now().isoformat(),
                    'restored_by': restored_by
                }).eq('id', snapshot_id).execute()
                
                print(f"✅ Snapshot restored successfully: {snapshot['snapshot_name']}")
                return True
            else:
                print(f"❌ Failed to restore snapshot: {snapshot['snapshot_name']}")
                return False
                
        except Exception as e:
            print(f"❌ Error restoring snapshot: {e}")
            return False
    
    def _clear_expenses_by_type(self, snapshot_type: str):
        """Clear existing expenses based on type"""
        try:
            if snapshot_type in ['all', 'expenses']:
                # Clear regular expenses
                self.supabase.table('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            if snapshot_type in ['all', 'project_planned']:
                # Clear project planned expenses
                self.supabase.table('project_expenses_quote').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            if snapshot_type in ['all', 'project_actual']:
                # Clear project actual expenses
                self.supabase.table('project_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
                
        except Exception as e:
            print(f"❌ Error clearing expenses: {e}")
    
    def _restore_expenses_data(self, expenses_data: List[Dict[str, Any]], snapshot_type: str) -> bool:
        """Restore expenses data"""
        try:
            for expense in expenses_data:
                # Determine table based on expense type or snapshot type
                table_name = self._get_table_name(expense, snapshot_type)
                
                if table_name:
                    # Remove id to let database generate new one
                    expense_copy = {k: v for k, v in expense.items() if k != 'id'}
                    
                    # Insert expense
                    result = self.supabase.table(table_name).insert(expense_copy).execute()
                    
                    if not result.data:
                        print(f"❌ Failed to restore expense: {expense.get('description', 'Unknown')}")
                        return False
            
            return True
            
        except Exception as e:
            print(f"❌ Error restoring expenses data: {e}")
            return False
    
    def _get_table_name(self, expense: Dict[str, Any], snapshot_type: str) -> Optional[str]:
        """Determine table name for expense"""
        # Check if expense has specific fields that indicate table type
        if 'project_id' in expense:
            if 'status' in expense and expense.get('status') in ['pending', 'approved', 'rejected']:
                return 'project_expenses_quote'  # Planned expenses
            else:
                return 'project_expenses'  # Actual expenses
        else:
            return 'expenses'  # Regular expenses
    
    def delete_snapshot(self, snapshot_id: str) -> bool:
        """Delete a snapshot"""
        try:
            result = self.supabase.table('expense_snapshots').delete().eq('id', snapshot_id).execute()
            
            if result.data:
                print(f"✅ Snapshot deleted successfully")
                return True
            else:
                print(f"❌ Snapshot not found or already deleted")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting snapshot: {e}")
            return False
    
    def get_snapshot_statistics(self, snapshot_id: str) -> Dict[str, Any]:
        """Get statistics for a snapshot"""
        try:
            snapshot = self.get_snapshot(snapshot_id)
            if not snapshot:
                return {}
            
            return {
                'snapshot_name': snapshot.get('snapshot_name'),
                'total_expenses_count': snapshot.get('total_expenses_count', 0),
                'root_expenses_count': snapshot.get('root_expenses_count', 0),
                'child_expenses_count': snapshot.get('child_expenses_count', 0),
                'total_amount': snapshot.get('total_amount', 0),
                'root_amount': snapshot.get('root_amount', 0),
                'child_amount': snapshot.get('child_amount', 0),
                'hierarchy_levels': snapshot.get('hierarchy_levels', 0),
                'max_depth': snapshot.get('max_depth', 0),
                'snapshot_type': snapshot.get('snapshot_type'),
                'created_at': snapshot.get('created_at')
            }
            
        except Exception as e:
            print(f"❌ Error getting snapshot statistics: {e}")
            return {}

def main():
    """Demo usage of ExpenseSnapshotsManager"""
    print("Expense Snapshots Manager Demo")
    print("=" * 50)
    
    manager = ExpenseSnapshotsManager()
    
    # Create a snapshot
    print("\n1. Creating snapshot...")
    snapshot = manager.create_snapshot(
        snapshot_name="Test Snapshot",
        snapshot_description="Test snapshot for all expenses",
        snapshot_type="all"
    )
    
    if snapshot:
        print(f"✅ Snapshot created: {snapshot['id']}")
        
        # Get statistics
        print("\n2. Getting snapshot statistics...")
        stats = manager.get_snapshot_statistics(snapshot['id'])
        print(f"📊 Statistics: {stats}")
        
        # List all snapshots
        print("\n3. Listing all snapshots...")
        snapshots = manager.get_snapshots()
        print(f"📋 Found {len(snapshots)} snapshots")
        
        for snap in snapshots:
            print(f"  - {snap['snapshot_name']} ({snap['snapshot_type']}) - {snap['total_expenses_count']} expenses")
    
    print("\n" + "=" * 50)
    print("Demo completed!")

if __name__ == "__main__":
    main()
