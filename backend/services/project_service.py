"""
Project Service Layer
Handles all project-related business logic
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from models.project import Project, ProjectCreate, ProjectUpdate
from services.supabase_client import get_supabase_client
from fastapi import HTTPException, status


class ProjectService:
    """Service class for project operations"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_projects(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        customer_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get projects with filters and role-based access control
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            search: Search query for project name
            customer_id: Filter by customer ID
            status_filter: Filter by project status
            user_id: Current user ID for access control
            user_role: Current user role
            
        Returns:
            List of projects with customer and manager info
        """
        # Build base query with joins
        query = self.supabase.from_('projects').select(
            '''
            *,
            customers!inner (
                id,
                name,
                email
            ),
            employees!inner (
                id,
                first_name,
                last_name,
                email
            )
            '''
        )
        
        # Apply search filter
        if search:
            query = query.ilike('name', f'%{search}%')
        
        # Apply customer filter
        if customer_id:
            query = query.eq('customer_id', customer_id)
        
        # Apply status filter
        if status_filter:
            query = query.eq('status', status_filter)
        
        # Apply role-based filtering
        # Admins and accountants see all projects
        if user_role not in ['admin', 'accountant']:
            # Other users only see projects they're assigned to
            query = query.eq('manager_id', user_id)
        
        # Apply pagination
        query = query.range(skip, skip + limit - 1)
        
        # Order by creation date (most recent first)
        query = query.order('created_at', desc=True)
        
        # Execute query
        result = query.execute()
        
        return result.data
    
    async def get_project_by_id(self, project_id: str) -> Dict[str, Any]:
        """
        Get a single project by ID
        
        Args:
            project_id: Project ID
            
        Returns:
            Project data with related information
            
        Raises:
            HTTPException: If project not found
        """
        result = self.supabase.from_('projects').select(
            '''
            *,
            customers (
                id,
                name,
                email,
                phone
            ),
            employees (
                id,
                first_name,
                last_name,
                email
            )
            '''
        ).eq('id', project_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return result.data
    
    async def create_project(self, project_data: ProjectCreate, user_id: str) -> Dict[str, Any]:
        """
        Create a new project
        
        Args:
            project_data: Project creation data
            user_id: ID of user creating the project
            
        Returns:
            Created project data
            
        Raises:
            HTTPException: If creation fails
        """
        # Prepare data for insertion
        insert_data = project_data.dict()
        insert_data['created_by'] = user_id
        insert_data['updated_by'] = user_id
        
        # Ensure actual_cost is set
        if 'actual_cost' not in insert_data:
            insert_data['actual_cost'] = 0.0
        
        # Insert project
        result = self.supabase.from_('projects').insert(insert_data).select().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project"
            )
        
        return result.data[0]
    
    async def update_project(
        self,
        project_id: str,
        project_data: ProjectUpdate,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Update an existing project
        
        Args:
            project_id: Project ID
            project_data: Project update data
            user_id: ID of user updating the project
            
        Returns:
            Updated project data
            
        Raises:
            HTTPException: If project not found or update fails
        """
        # Check if project exists
        await self.get_project_by_id(project_id)
        
        # Prepare update data
        update_data = project_data.dict(exclude_unset=True)
        update_data['updated_by'] = user_id
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Update project
        result = self.supabase.from_('projects').update(
            update_data
        ).eq('id', project_id).select().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update project"
            )
        
        return result.data[0]
    
    async def delete_project(self, project_id: str, user_id: str) -> Dict[str, str]:
        """
        Delete a project (soft delete)
        
        Args:
            project_id: Project ID
            user_id: ID of user deleting the project
            
        Returns:
            Success message
            
        Raises:
            HTTPException: If project not found or deletion fails
        """
        # Check if project exists
        await self.get_project_by_id(project_id)
        
        # Soft delete by setting deleted_at
        result = self.supabase.from_('projects').update({
            'deleted_at': datetime.utcnow().isoformat(),
            'updated_by': user_id
        }).eq('id', project_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete project"
            )
        
        return {"message": "Project deleted successfully"}
    
    async def get_projects_by_customer(
        self,
        customer_id: str,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all projects for a specific customer
        
        Args:
            customer_id: Customer ID
            status_filter: Optional status filter
            
        Returns:
            List of projects for the customer
        """
        query = self.supabase.from_('projects').select('*').eq('customer_id', customer_id)
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        return result.data
    
    async def get_project_stats(self) -> Dict[str, int]:
        """
        Get project statistics
        
        Returns:
            Dictionary with project counts by status
        """
        result = self.supabase.from_('projects').select('status').execute()
        
        projects = result.data or []
        
        stats = {
            'total': len(projects),
            'active': len([p for p in projects if p['status'] == 'active']),
            'completed': len([p for p in projects if p['status'] == 'completed']),
            'on_hold': len([p for p in projects if p['status'] == 'on_hold']),
            'planning': len([p for p in projects if p['status'] == 'planning']),
            'cancelled': len([p for p in projects if p['status'] == 'cancelled']),
        }
        
        return stats


# Singleton instance
_project_service = None

def get_project_service() -> ProjectService:
    """Get or create project service instance"""
    global _project_service
    if _project_service is None:
        _project_service = ProjectService()
    return _project_service
