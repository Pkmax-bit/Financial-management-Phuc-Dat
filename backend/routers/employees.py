"""
Employee Management Router
Handles CRUD operations for employees, departments, and positions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.employee import (
    Employee, EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    Department, Position, DepartmentCreate, DepartmentUpdate, 
    PositionCreate, PositionUpdate
)
from models.user import User, UserRole
from utils.auth import get_current_user, require_manager_or_admin, hash_password
from utils.simple_auth import get_current_user_simple
from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/test")
async def test_employees_endpoint():
    """Test endpoint to verify employees router is working"""
    return {"message": "Employees router is working!", "status": "success"}

@router.get("/simple-test")
async def simple_employees_test(current_user: User = Depends(get_current_user_simple)):
    """Simple test endpoint with auth using simple_auth"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("employees").select("id, first_name, last_name, email, status").limit(5).execute()
        
        return {
            "message": "Simple employees test successful",
            "user": current_user.email,
            "employees_count": len(result.data) if result.data else 0,
            "sample_employees": result.data or [],
            "status": "success"
        }
    except Exception as e:
        return {
            "message": f"Error: {str(e)}",
            "user": current_user.email if current_user else "Unknown",
            "status": "error"
        }

@router.get("/public-list")
async def get_employees_public():
    """Public endpoint to test employees without authentication"""
    try:
        supabase = get_supabase_client()
        
        # Get employee info with department and position names
        result = supabase.table("employees").select("""
            *,
            departments:department_id(id, name, code),
            positions:position_id(id, name, code),
            users:user_id(role)
        """).limit(100).execute()
        
        # Process data to add department_name and position_name
        processed_employees = []
        for emp in result.data or []:
            emp_data = dict(emp)
            
            # Handle department_name - Supabase join returns dict or None
            departments = emp.get('departments')
            if departments and isinstance(departments, dict):
                emp_data['department_name'] = departments.get('name')
            else:
                emp_data['department_name'] = None
            
            # Handle position_name - Supabase join returns dict or None
            positions = emp.get('positions')
            if positions and isinstance(positions, dict):
                emp_data['position_name'] = positions.get('name')
            else:
                emp_data['position_name'] = None
            
            processed_employees.append(emp_data)
        
        return processed_employees
        
    except Exception as e:
        return {
            "message": f"Error fetching employees: {str(e)}",
            "employees_count": 0,
            "employees": [],
            "status": "error"
        }


@router.get("/public-departments")
async def get_departments_public():
    """Public endpoint to get departments without authentication"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("departments").select("*").execute()
        
        return {
            "message": "Departments fetched successfully",
            "departments": result.data or [],
            "status": "success"
        }
        
    except Exception as e:
        return {
            "message": f"Error fetching departments: {str(e)}",
            "departments": [],
            "status": "error"
        }

@router.get("/public-positions")
async def get_positions_public():
    """Public endpoint to get positions without authentication"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("positions").select("*").execute()
        
        return {
            "message": "Positions fetched successfully",
            "positions": result.data or [],
            "status": "success"
        }
        
    except Exception as e:
        return {
            "message": f"Error fetching positions: {str(e)}",
            "positions": [],
            "status": "error"
        }

@router.get("/")
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all employees with optional filtering - returns dict with joined data"""
    try:
        supabase = get_supabase_client()
        
        # Select with JOIN to get department and position names
        query = supabase.table("employees").select("""
            *,
            departments:department_id(id, name, code),
            positions:position_id(id, name, code)
        """)
        
        # Apply filters
        if search:
            query = query.or_(f"first_name.ilike.%{search}%,last_name.ilike.%{search}%,email.ilike.%{search}%")
        
        if department_id:
            query = query.eq("department_id", department_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        if not result.data:
            return []
        
        # Process data to add department_name and position_name
        processed_employees = []
        for emp in result.data:
            emp_data = dict(emp)
            
            # Handle department_name - Supabase join returns dict or None
            departments = emp.get('departments')
            if departments and isinstance(departments, dict):
                emp_data['department_name'] = departments.get('name')
            else:
                emp_data['department_name'] = None
            
            # Handle position_name - Supabase join returns dict or None
            positions = emp.get('positions')
            if positions and isinstance(positions, dict):
                emp_data['position_name'] = positions.get('name')
            else:
                emp_data['position_name'] = None
            
            processed_employees.append(emp_data)
        
        return processed_employees
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employees: {str(e)}"
        )

@router.get("/simple", response_model=List[dict])
async def get_employees_simple(current_user: User = Depends(get_current_user_simple)):
    """Get employees with simple auth - returns raw dict instead of Employee model"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("employees").select("""
            id,
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            department_id,
            position_id,
            hire_date,
            salary,
            status,
            created_at,
            users:user_id(role)
        """).execute()
        
        
        return result.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employees: {str(e)}"
        )

@router.get("/{employee_id}")
async def get_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get employee by ID with department and position names"""
    try:
        supabase = get_supabase_client()
        
        # Select with JOIN to get department and position names
        result = supabase.table("employees").select("""
            *,
            departments:department_id(id, name, code),
            positions:position_id(id, name, code)
        """).eq("id", employee_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        emp = result.data[0]
        emp_data = dict(emp)
        
        # Handle department_name - Supabase join returns dict or None
        departments = emp.get('departments')
        if departments and isinstance(departments, dict):
            emp_data['department_name'] = departments.get('name')
        else:
            emp_data['department_name'] = None
        
        # Handle position_name - Supabase join returns dict or None
        positions = emp.get('positions')
        if positions and isinstance(positions, dict):
            emp_data['position_name'] = positions.get('name')
        else:
            emp_data['position_name'] = None
        
        return emp_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employee: {str(e)}"
        )

@router.post("/", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new employee with default password 123456"""
    try:
        # Log current user info for debugging
        print(f"[CREATE_EMPLOYEE] Current user: {current_user.email}, Role: {current_user.role}")
        print(f"[CREATE_EMPLOYEE] Creating employee: {employee_data.email}")
        
        # Get service key and create a fresh client for admin operations
        from config import settings
        from supabase import create_client as create_supabase_client
        
        # Create a new client with service key for admin operations
        admin_supabase = create_supabase_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        supabase = get_supabase_client()  # Keep regular client for database operations
        
        # Check if email already exists in users table
        existing_user = supabase.table("users").select("id").eq("email", employee_data.email).execute()
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Check if email already exists in employees table
        existing_employee = supabase.table("employees").select("id").eq("email", employee_data.email).execute()
        if existing_employee.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee with this email already exists"
            )
        
        # Generate employee code if not provided
        if not employee_data.employee_code:
            # Generate employee code: EMP + year + month + random 4 digits
            import random
            now = datetime.now()
            employee_code = f"EMP{now.year}{now.month:02d}{random.randint(1000, 9999)}"
            
            # Ensure unique employee code
            while True:
                existing_code = supabase.table("employees").select("id").eq("employee_code", employee_code).execute()
                if not existing_code.data:
                    break
                employee_code = f"EMP{now.year}{now.month:02d}{random.randint(1000, 9999)}"
        else:
            employee_code = employee_data.employee_code
            # Check if employee code already exists
            existing_code = supabase.table("employees").select("id").eq("employee_code", employee_code).execute()
            if existing_code.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee code already exists"
                )
        
        # Get password for employee (use provided password or default)
        plain_password = employee_data.password or "123456"
        
        try:
            # Verify service key is configured correctly
            from config import settings
            service_key = settings.SUPABASE_SERVICE_KEY
            if not service_key or service_key == "your_supabase_service_key_here":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_SERVICE_KEY chưa được cấu hình. Vui lòng kiểm tra file .env và đảm bảo SUPABASE_SERVICE_KEY có giá trị đúng."
                )
            
            # Check if service key has service_role (decode JWT to check)
            try:
                import jwt
                import json
                # Decode without verification to check role
                decoded = jwt.decode(service_key, options={"verify_signature": False})
                if decoded.get("role") != "service_role":
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"SUPABASE_SERVICE_KEY không có quyền service_role. Role hiện tại: {decoded.get('role')}. Vui lòng lấy service_role key từ Supabase Dashboard > Settings > API."
                    )
            except jwt.DecodeError:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_SERVICE_KEY không hợp lệ. Vui lòng kiểm tra lại key trong Supabase Dashboard."
                )
            except Exception as jwt_error:
                # If jwt library not available, skip check but log warning
                print(f"Warning: Could not verify service key role: {jwt_error}")
            
            # Check if user already exists in Supabase Auth by trying to create first
            # If user exists, it will throw an error which we'll catch
            try:
                # Try to create new user in Supabase Auth
                print(f"[CREATE_USER] Attempting to create user: {employee_data.email}")
                print(f"[CREATE_USER] Using Supabase URL: {supabase.url if hasattr(supabase, 'url') else 'N/A'}")
                print(f"[CREATE_USER] Service key configured: {bool(service_key)}")
                
                # Create user with admin API
                user_data = {
                    "email": employee_data.email,
                    "password": plain_password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": f"{employee_data.first_name} {employee_data.last_name}",
                        "role": employee_data.user_role
                    }
                }
                print(f"[CREATE_USER] User data: {user_data}")
                
                # Use admin client for creating user
                auth_response = admin_supabase.auth.admin.create_user(user_data)
                
                if not auth_response.user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to create user account"
                    )
                
                user_id = auth_response.user.id
                print(f"Created new user: {employee_data.email}")
                
            except Exception as create_error:
                error_str = str(create_error).lower()
                
                # If user already exists, try to get user by listing all users
                if "already been registered" in error_str or "already exists" in error_str or "user already registered" in error_str:
                    print(f"User already exists, trying to find: {employee_data.email}")
                    
                    try:
                        # List all users and find by email
                        users_response = admin_supabase.auth.admin.list_users()
                        user_id = None
                        
                        for user in users_response:
                            if user.email == employee_data.email:
                                user_id = user.id
                                print(f"Found existing user: {employee_data.email}")
                                break
                        
                        if not user_id:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"User {employee_data.email} exists but cannot be found"
                            )
                    except Exception as list_error:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Failed to list users: {str(list_error)}"
                        )
                elif "not allowed" in error_str or "user not allowed" in error_str or "forbidden" in error_str or "permission" in error_str:
                    # This is a permission issue with Supabase Auth
                    print(f"[CREATE_USER] Permission error detected. Service key role check needed.")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Không có quyền tạo tài khoản người dùng. Vui lòng kiểm tra:\n1. SUPABASE_SERVICE_KEY trong file .env có đúng không\n2. Service key phải có quyền service_role (lấy từ Supabase Dashboard > Settings > API > service_role key)\n3. Đảm bảo service key không phải là anon key"
                    )
                else:
                    # Re-raise if it's a different error with more details
                    print(f"[CREATE_USER] Unexpected error creating user: {create_error}")
                    print(f"[CREATE_USER] Error type: {type(create_error)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to create user account: {str(create_error)}"
                    )
            
        except HTTPException:
            # Re-raise HTTP exceptions as they are
            raise
        except Exception as auth_error:
            error_str = str(auth_error).lower()
            # Check for specific Supabase Auth permission errors
            if "not allowed" in error_str or "user not allowed" in error_str or "forbidden" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Không có quyền tạo tài khoản người dùng. Vui lòng kiểm tra:\n1. SUPABASE_SERVICE_KEY trong file .env có đúng không\n2. Service key phải có quyền admin (service_role)\n3. Kiểm tra cấu hình trong Supabase Dashboard"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create user account: {str(auth_error)}"
                )
        
        try:
            # Check if user already exists in users table
            existing_user = supabase.table("users").select("*").eq("id", user_id).execute()
            
            if existing_user.data:
                # User already exists in users table, update the record
                user_update_data = {
                    "email": employee_data.email,
                    "full_name": f"{employee_data.first_name} {employee_data.last_name}",
                    "role": employee_data.user_role,
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat()
                }
                supabase.table("users").update(user_update_data).eq("id", user_id).execute()
                print(f"Updated existing user: {employee_data.email}")
            else:
                # Hash password for storage in custom users table
                hashed_password = hash_password(plain_password)
                
                # Create new user record in users table
                user_record = {
                    "id": user_id,
                    "email": employee_data.email,
                    "full_name": f"{employee_data.first_name} {employee_data.last_name}",
                    "role": employee_data.user_role,
                    "password_hash": hashed_password,
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                supabase.table("users").insert(user_record).execute()
                print(f"Created new user: {employee_data.email}")
            
        except Exception as user_error:
            # If user table creation fails, don't delete auth user since it might already exist
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create/update user record: {str(user_error)}"
            )
        
        try:
            # Check if employee already exists
            existing_employee = supabase.table("employees").select("*").eq("user_id", user_id).execute()
            
            if existing_employee.data:
                # Employee already exists, update the record
                employee_update_data = {
                    "employee_code": employee_code,
                    "first_name": employee_data.first_name,
                    "last_name": employee_data.last_name,
                    "email": employee_data.email,
                    "phone": employee_data.phone,
                    "department_id": employee_data.department_id,
                    "position_id": employee_data.position_id,
                    "hire_date": employee_data.hire_date.isoformat(),
                    "salary": employee_data.salary,
                    "status": "active",
                    "manager_id": employee_data.manager_id,
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("employees").update(employee_update_data).eq("user_id", user_id).execute()
                print(f"Updated existing employee: {employee_data.email}")
            else:
                # Create new employee record
                employee_dict = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "employee_code": employee_code,
                    "first_name": employee_data.first_name,
                    "last_name": employee_data.last_name,
                    "email": employee_data.email,
                    "phone": employee_data.phone,
                    "department_id": employee_data.department_id,
                    "position_id": employee_data.position_id,
                    "hire_date": employee_data.hire_date.isoformat(),
                    "salary": employee_data.salary,
                    "status": "active",
                    "manager_id": employee_data.manager_id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("employees").insert(employee_dict).execute()
                print(f"Created new employee: {employee_data.email}")
            
            if not result.data:
                raise Exception("No data returned from insert")
            
            # Get the created employee with joined data
            employee_with_details = supabase.table("employees")\
                .select("""
                    *,
                    departments:department_id(name),
                    positions:position_id(name),
                    managers:manager_id(first_name, last_name),
                    users:user_id(role)
                """)\
                .eq("id", result.data[0]["id"])\
                .execute()
            
            if employee_with_details.data:
                emp_data = employee_with_details.data[0]
                return EmployeeResponse(
                    id=emp_data["id"],
                    user_id=emp_data["user_id"],
                    employee_code=emp_data["employee_code"],
                    first_name=emp_data["first_name"],
                    last_name=emp_data["last_name"],
                    full_name=f"{emp_data['first_name']} {emp_data['last_name']}",
                    email=emp_data["email"],
                    phone=emp_data["phone"],
                    department_id=emp_data["department_id"],
                    department_name=emp_data["departments"]["name"] if emp_data.get("departments") else None,
                    position_id=emp_data["position_id"],
                    position_title=emp_data["positions"]["name"] if emp_data.get("positions") else None,
                    hire_date=datetime.fromisoformat(emp_data["hire_date"].replace('Z', '+00:00')).date(),
                    salary=emp_data["salary"],
                    status=emp_data["status"],
                    manager_id=emp_data["manager_id"],
                    manager_name=f"{emp_data['managers']['first_name']} {emp_data['managers']['last_name']}" if emp_data.get("managers") else None,
                    user_role=emp_data["users"]["role"] if emp_data.get("users") else None,
                    created_at=datetime.fromisoformat(emp_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(emp_data["updated_at"].replace('Z', '+00:00'))
                )
            
            return Employee(**result.data[0])
            
        except Exception as emp_error:
            # If employee creation fails, clean up user and auth
            try:
                supabase.table("users").delete().eq("id", user_id).execute()
                admin_supabase.auth.admin.delete_user(user_id)
            except:
                pass
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create employee: {str(emp_error)}"
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

@router.post("/departments/", response_model=Department)
async def create_department(
    department_data: DepartmentCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new department"""
    try:
        supabase = get_supabase_client()
        
        # Check if department name already exists
        existing = supabase.table("departments").select("id").eq("name", department_data.name).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name already exists"
            )
        
        department_dict = {
            "id": str(uuid.uuid4()),
            "name": department_data.name,
            "description": department_data.description,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("departments").insert(department_dict).execute()
        
        if result.data:
            return Department(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create department"
        )
        
    except HTTPException:
        raise
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
            "name": title,
            "code": f"POS{datetime.now().strftime('%Y%m%d%H%M%S')}",
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
