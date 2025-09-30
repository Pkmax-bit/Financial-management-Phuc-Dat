"""
Project Validation Service
Handles validation of project-customer relationships and project selection logic
"""

from typing import Optional, Dict, List
from fastapi import HTTPException, status
from services.supabase_client import get_supabase_client


class ProjectValidationService:
    """Service for validating project-customer relationships"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def validate_project_customer(self, project_id: str, customer_id: str) -> Dict:
        """Validate that a project belongs to a specific customer"""
        try:
            # Check if project exists and belongs to customer
            result = self.supabase.table("projects").select("id, name, customer_id, status").eq("id", project_id).eq("customer_id", customer_id).execute()
            
            if not result.data:
                return {
                    "valid": False,
                    "message": "Project not found or does not belong to the specified customer"
                }
            
            project = result.data[0]
            return {
                "valid": True,
                "project": {
                    "id": project["id"],
                    "name": project["name"],
                    "customer_id": project["customer_id"],
                    "status": project["status"]
                }
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to validate project-customer relationship: {str(e)}"
            )
    
    async def get_projects_for_customer(self, customer_id: str, status_filter: Optional[str] = None) -> Dict:
        """Get projects for a specific customer with optional status filtering"""
        try:
            # Verify customer exists
            customer_result = self.supabase.table("customers").select("id, name").eq("id", customer_id).execute()
            if not customer_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Customer not found"
                )
            
            customer = customer_result.data[0]
            
            # Get projects for this customer
            query = self.supabase.table("projects").select("id, project_code, name, status, start_date, end_date").eq("customer_id", customer_id)
            
            if status_filter:
                query = query.eq("status", status_filter)
            else:
                # Only get active projects for dropdown selection
                query = query.in_("status", ["planning", "active"])
            
            result = query.order("name").execute()
            
            return {
                "customer": {
                    "id": customer["id"],
                    "name": customer["name"]
                },
                "projects": [
                    {
                        "id": project["id"],
                        "project_code": project["project_code"],
                        "name": project["name"],
                        "status": project["status"],
                        "start_date": project["start_date"],
                        "end_date": project["end_date"]
                    }
                    for project in result.data
                ],
                "count": len(result.data)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch projects for customer: {str(e)}"
            )
    
    async def validate_transaction_project(self, transaction_type: str, transaction_data: Dict) -> Dict:
        """Validate project selection for various transaction types"""
        try:
            customer_id = transaction_data.get("customer_id")
            project_id = transaction_data.get("project_id")
            
            # If no project_id provided, it's optional
            if not project_id:
                return {
                    "valid": True,
                    "message": "No project selected (optional)"
                }
            
            # If project_id provided but no customer_id, it's invalid
            if not customer_id:
                return {
                    "valid": False,
                    "message": "Customer ID is required when project is selected"
                }
            
            # Validate project-customer relationship
            validation_result = await self.validate_project_customer(project_id, customer_id)
            
            if not validation_result["valid"]:
                return {
                    "valid": False,
                    "message": f"Project validation failed: {validation_result['message']}"
                }
            
            # Check if project is in a valid status for transactions
            project_status = validation_result["project"]["status"]
            if project_status not in ["planning", "active"]:
                return {
                    "valid": False,
                    "message": f"Project is in '{project_status}' status and cannot accept new transactions"
                }
            
            return {
                "valid": True,
                "message": "Project validation successful",
                "project": validation_result["project"]
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to validate transaction project: {str(e)}"
            )
    
    async def get_project_dropdown_options(self, customer_id: str) -> List[Dict]:
        """Get formatted project options for dropdown selection"""
        try:
            projects_data = await self.get_projects_for_customer(customer_id)
            
            return [
                {
                    "value": project["id"],
                    "label": f"{project['project_code']} - {project['name']}",
                    "project_code": project["project_code"],
                    "name": project["name"],
                    "status": project["status"]
                }
                for project in projects_data["projects"]
            ]
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get project dropdown options: {str(e)}"
            )
