"""
Employee Management Router
Handles CRUD operations for employees, departments, and positions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.employee import Employee, EmployeeCreate, EmployeeUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/", response_model=List[Employee])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all employees with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("employees").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"first_name.ilike.%{search}%,last_name.ilike.%{search}%,email.ilike.%{search}%")
        
        if department_id:
            query = query.eq("department_id", department_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        return [Employee(**emp) for emp in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employees: {str(e)}"
        )

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get employee by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("employees").select("*").eq("id", employee_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        return Employee(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employee: {str(e)}"
        )

@router.post("/", response_model=Employee)
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new employee"""
    try:
        supabase = get_supabase_client()
        
        # Check if employee code already exists
        existing = supabase.table("employees").select("id").eq("employee_code", employee_data.employee_code).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee code already exists"
            )
        
        # Check if email already exists
        existing_email = supabase.table("employees").select("id").eq("email", employee_data.email).execute()
        if existing_email.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Create employee record
        employee_dict = employee_data.dict()
        employee_dict["id"] = str(uuid.uuid4())
        employee_dict["created_at"] = datetime.utcnow().isoformat()
        employee_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("employees").insert(employee_dict).execute()
        
        if result.data:
            return Employee(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create employee"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )

@router.put("/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update employee information"""
    try:
        supabase = get_supabase_client()
        
        # Check if employee exists
        existing = supabase.table("employees").select("id").eq("id", employee_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check for duplicate employee code if being updated
        if employee_update.employee_code:
            duplicate = supabase.table("employees").select("id").eq("employee_code", employee_update.employee_code).neq("id", employee_id).execute()
            if duplicate.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee code already exists"
                )
        
        # Check for duplicate email if being updated
        if employee_update.email:
            duplicate_email = supabase.table("employees").select("id").eq("email", employee_update.email).neq("id", employee_id).execute()
            if duplicate_email.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        
        # Update employee
        update_data = employee_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("employees").update(update_data).eq("id", employee_id).execute()
        
        if result.data:
            return Employee(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update employee"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee: {str(e)}"
        )

@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete employee (soft delete by setting status to terminated)"""
    try:
        supabase = get_supabase_client()
        
        # Check if employee exists
        existing = supabase.table("employees").select("id").eq("id", employee_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Soft delete by setting status to terminated
        result = supabase.table("employees").update({
            "status": "terminated",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", employee_id).execute()
        
        if result.data:
            return {"message": "Employee deleted successfully"}
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete employee"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee: {str(e)}"
        )

@router.get("/departments/", response_model=List[dict])
async def get_departments(current_user: User = Depends(get_current_user)):
    """Get all departments"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("departments").select("*").execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch departments: {str(e)}"
        )

@router.get("/positions/", response_model=List[dict])
async def get_positions(current_user: User = Depends(get_current_user)):
    """Get all positions"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("positions").select("*").execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch positions: {str(e)}"
        )

@router.post("/departments/")
async def create_department(
    name: str,
    description: Optional[str] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new department"""
    try:
        supabase = get_supabase_client()
        
        department_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("departments").insert(department_data).execute()
        
        if result.data:
            return result.data[0]
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create department"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create department: {str(e)}"
        )

@router.post("/positions/")
async def create_position(
    title: str,
    description: Optional[str] = None,
    department_id: Optional[str] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new position"""
    try:
        supabase = get_supabase_client()
        
        position_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "department_id": department_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("positions").insert(position_data).execute()
        
        if result.data:
            return result.data[0]
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create position"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create position: {str(e)}"
        )

@router.get("/stats/overview")
async def get_employee_stats(current_user: User = Depends(get_current_user)):
    """Get employee statistics overview"""
    try:
        supabase = get_supabase_client()
        
        # Get total employees
        total_result = supabase.table("employees").select("id", count="exact").execute()
        total_employees = total_result.count or 0
        
        # Get active employees
        active_result = supabase.table("employees").select("id", count="exact").eq("status", "active").execute()
        active_employees = active_result.count or 0
        
        # Get employees by department
        dept_result = supabase.table("employees").select("department_id", count="exact").execute()
        
        # Get employees by status
        status_result = supabase.table("employees").select("status", count="exact").execute()
        
        return {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "inactive_employees": total_employees - active_employees,
            "departments": dept_result.data,
            "status_breakdown": status_result.data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employee stats: {str(e)}"
        )
