from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from services.supabase_client import get_supabase
from utils.auth import get_current_user
from models.user import User

router = APIRouter()

@router.get("/customers")
async def get_customers_with_stats(current_user: User = Depends(get_current_user)):
    """Get all customers with project statistics"""
    try:
        supabase = get_supabase()
        
        # Get customers with project counts and total values
        query = supabase.table("customers").select("""
            *,
            projects:customer_id(count),
            project_totals:customer_id(budget, actual_cost)
        """)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        # Process the data to include statistics
        customers_with_stats = []
        for customer in result.data:
            projects = customer.get('projects', [])
            project_totals = customer.get('project_totals', [])
            
            projects_count = len(projects) if projects else 0
            total_budget = sum(project.get('budget', 0) for project in project_totals) if project_totals else 0
            total_actual_cost = sum(project.get('actual_cost', 0) for project in project_totals) if project_totals else 0
            
            customers_with_stats.append({
                **customer,
                'projects_count': projects_count,
                'total_projects_value': total_budget,
                'total_actual_cost': total_actual_cost
            })
        
        return customers_with_stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customers: {str(e)}")

@router.get("/customers/{customer_id}")
async def get_customer_details(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed customer information"""
    try:
        supabase = get_supabase()
        
        # Get customer details
        customer_result = supabase.table("customers").select("*").eq("id", customer_id).execute()
        
        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer = customer_result.data[0]
        
        # Get customer projects
        projects_result = supabase.table("projects").select("""
            *,
            employees:manager_id(first_name, last_name)
        """).eq("customer_id", customer_id).execute()
        
        projects = []
        if projects_result.data:
            for project in projects_result.data:
                manager = project.get('employees', {})
                manager_name = f"{manager.get('first_name', '')} {manager.get('last_name', '')}".strip()
                
                projects.append({
                    **project,
                    'manager_name': manager_name or 'Chưa xác định'
                })
        
        # Calculate statistics
        total_budget = sum(project.get('budget', 0) for project in projects)
        total_actual_cost = sum(project.get('actual_cost', 0) for project in projects)
        average_progress = sum(project.get('progress', 0) for project in projects) / len(projects) if projects else 0
        
        return {
            **customer,
            'projects': projects,
            'projects_count': len(projects),
            'total_budget': total_budget,
            'total_actual_cost': total_actual_cost,
            'average_progress': round(average_progress, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer details: {str(e)}")

@router.get("/customers/{customer_id}/projects")
async def get_customer_projects(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get all projects for a specific customer"""
    try:
        supabase = get_supabase()
        
        # Get projects with manager information
        result = supabase.table("projects").select("""
            *,
            employees:manager_id(first_name, last_name)
        """).eq("customer_id", customer_id).execute()
        
        if not result.data:
            return []
        
        projects = []
        for project in result.data:
            manager = project.get('employees', {})
            manager_name = f"{manager.get('first_name', '')} {manager.get('last_name', '')}".strip()
            
            projects.append({
                **project,
                'manager_name': manager_name or 'Chưa xác định'
            })
        
        return projects
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer projects: {str(e)}")

@router.get("/customers/{customer_id}/timeline")
async def get_customer_timeline(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get timeline entries for all customer projects"""
    try:
        supabase = get_supabase()
        
        # First get all project IDs for this customer
        projects_result = supabase.table("projects").select("id").eq("customer_id", customer_id).execute()
        
        if not projects_result.data:
            return []
        
        project_ids = [project['id'] for project in projects_result.data]
        
        # Get timeline entries for all projects
        timeline_result = supabase.table("project_timeline").select("""
            *,
            timeline_attachments(*)
        """).in_("project_id", project_ids).order("date", desc=True).execute()
        
        if not timeline_result.data:
            return []
        
        # Process timeline entries
        timeline_entries = []
        for entry in timeline_result.data:
            attachments = entry.get('timeline_attachments', [])
            processed_attachments = []
            
            for attachment in attachments:
                processed_attachments.append({
                    'id': attachment['id'],
                    'name': attachment['name'],
                    'url': attachment['url'],
                    'type': attachment['type'],
                    'size': attachment['size'],
                    'uploaded_at': attachment['uploaded_at']
                })
            
            timeline_entries.append({
                'id': entry['id'],
                'title': entry['title'],
                'description': entry['description'],
                'date': entry['date'],
                'type': entry['type'],
                'status': entry['status'],
                'created_by': entry['created_by'],
                'attachments': processed_attachments
            })
        
        return timeline_entries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer timeline: {str(e)}")

@router.get("/customers/{customer_id}/timeline/images")
async def get_customer_timeline_images(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get all images from customer timeline"""
    try:
        supabase = get_supabase()
        
        # First get all project IDs for this customer
        projects_result = supabase.table("projects").select("id").eq("customer_id", customer_id).execute()
        
        if not projects_result.data:
            return []
        
        project_ids = [project['id'] for project in projects_result.data]
        
        # Get only image attachments
        attachments_result = supabase.table("timeline_attachments").select("""
            *,
            project_timeline!inner(project_id, title, date, type)
        """).in_("project_timeline.project_id", project_ids).eq("type", "image").order("uploaded_at", desc=True).execute()
        
        if not attachments_result.data:
            return []
        
        # Process image attachments
        images = []
        for attachment in attachments_result.data:
            timeline_entry = attachment.get('project_timeline', {})
            
            images.append({
                'id': attachment['id'],
                'name': attachment['name'],
                'url': attachment['url'],
                'size': attachment['size'],
                'uploaded_at': attachment['uploaded_at'],
                'timeline_entry': {
                    'title': timeline_entry.get('title', ''),
                    'date': timeline_entry.get('date', ''),
                    'type': timeline_entry.get('type', '')
                }
            })
        
        return images
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer timeline images: {str(e)}")

@router.get("/customers/{customer_id}/statistics")
async def get_customer_statistics(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get comprehensive statistics for a customer"""
    try:
        supabase = get_supabase()
        
        # Get customer projects
        projects_result = supabase.table("projects").select("*").eq("customer_id", customer_id).execute()
        
        if not projects_result.data:
            return {
                'projects_count': 0,
                'total_budget': 0,
                'total_actual_cost': 0,
                'average_progress': 0,
                'active_projects': 0,
                'completed_projects': 0,
                'timeline_entries_count': 0,
                'images_count': 0
            }
        
        projects = projects_result.data
        
        # Calculate basic statistics
        projects_count = len(projects)
        total_budget = sum(project.get('budget', 0) for project in projects)
        total_actual_cost = sum(project.get('actual_cost', 0) for project in projects)
        average_progress = sum(project.get('progress', 0) for project in projects) / projects_count if projects_count > 0 else 0
        
        # Count projects by status
        active_projects = len([p for p in projects if p.get('status') == 'active'])
        completed_projects = len([p for p in projects if p.get('status') == 'completed'])
        
        # Get timeline statistics
        project_ids = [project['id'] for project in projects]
        
        timeline_result = supabase.table("project_timeline").select("id").in_("project_id", project_ids).execute()
        timeline_entries_count = len(timeline_result.data) if timeline_result.data else 0
        
        # Get images count
        images_result = supabase.table("timeline_attachments").select("id").in_("timeline_entry_id", [entry['id'] for entry in timeline_result.data] if timeline_result.data else []).eq("type", "image").execute()
        images_count = len(images_result.data) if images_result.data else 0
        
        return {
            'projects_count': projects_count,
            'total_budget': total_budget,
            'total_actual_cost': total_actual_cost,
            'average_progress': round(average_progress, 2),
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'timeline_entries_count': timeline_entries_count,
            'images_count': images_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customer statistics: {str(e)}")
