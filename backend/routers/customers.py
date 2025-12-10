"""
Customer Management Router
Handles CRUD operations for customers, customer levels, and transaction history
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import uuid

from models.customer import Customer, CustomerCreate, CustomerUpdate
from models.user import User
from utils.auth import get_current_user
from utils.rbac_middleware import (
    require_manager_or_admin, 
    require_customer_management,
    require_financial_access,
    get_user_role_info,
    rbac_manager
)
from utils.customer_code_generator import (
    get_next_available_customer_code,
    validate_customer_code,
    check_customer_code_exists
)
from services.supabase_client import get_supabase_client

router = APIRouter()

# Customer levels and their criteria
CUSTOMER_LEVELS = {
    "bronze": {"min_revenue": 0, "discount": 0.0},
    "silver": {"min_revenue": 10000000, "discount": 0.05},  # 10M VND
    "gold": {"min_revenue": 50000000, "discount": 0.10},    # 50M VND
    "platinum": {"min_revenue": 100000000, "discount": 0.15}  # 100M VND
}

@router.get("/test")
async def test_customers_endpoint():
    """Test endpoint to verify customers router is working"""
    return {"message": "Customers router is working!", "status": "success"}

@router.get("/auth-test")
async def test_auth(current_user: User = Depends(get_current_user)):
    """Test endpoint to verify authentication is working"""
    return {
        "message": "Authentication is working!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role
        }
    }

@router.get("/debug-permissions")
async def debug_permissions(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check user permissions"""
    try:
        # Check various permissions
        can_access_customers = rbac_manager.can_access_feature(current_user, 'customers')
        can_access_projects = rbac_manager.can_access_feature(current_user, 'projects')
        can_access_financial = rbac_manager.can_access_feature(current_user, 'financial')
        
        # Get role info
        role_info = get_user_role_info(current_user)
        
        return {
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role
            },
            "permissions": {
                "customers": can_access_customers,
                "projects": can_access_projects,
                "financial": can_access_financial
            },
            "role_info": role_info
        }
    except Exception as e:
        return {
            "error": str(e),
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "role": current_user.role
            }
        }

@router.get("/user-permissions")
async def get_user_permissions(current_user: User = Depends(get_current_user)):
    """Get current user's role and permissions information"""
    role_info = get_user_role_info(current_user)
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value
        },
        "permissions": role_info
    }

@router.get("/next-customer-code")
async def get_next_customer_code():
    """Get the next available customer code (no authentication required)"""
    try:
        next_code = get_next_available_customer_code()
        return {
            "next_customer_code": next_code,
            "format": "CUS000",
            "description": "Auto-generated customer code in format CUS + 3 digits"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate customer code: {str(e)}"
        )

@router.get("/test-public")
async def test_public():
    """Test public endpoint without authentication"""
    return {"message": "This is a public endpoint", "status": "success"}

@router.get("/public")
async def get_customers_public():
    """Public endpoint to get customers without authentication"""
    try:
        # Use service client to bypass RLS
        from services.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        # Get customers from database
        result = supabase.table("customers").select("*").limit(10).execute()
        
        return {
            "message": "Public customers endpoint (real data)",
            "customers": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        return {
            "message": "Error fetching customers from database",
            "error": str(e),
            "customers": []
        }

@router.get("/public-list")
async def get_customers_public_list():
    """Public endpoint to get customers list without authentication - compatible with frontend API"""
    try:
        supabase = get_supabase_client()
        
        # Get basic customer info without authentication
        result = supabase.table("customers").select("""
            id,
            customer_code,
            name,
            email,
            type,
            status,
            created_at
        """).limit(100).execute()
        
        return {
            "message": "Customers fetched successfully (public)",
            "customers_count": len(result.data) if result.data else 0,
            "customers": result.data or [],
            "status": "success"
        }
        
    except Exception as e:
        return {
            "message": f"Error fetching customers: {str(e)}",
            "customers_count": 0,
            "customers": [],
            "status": "error"
        }


@router.get("/", response_model=List[Customer])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    current_user: User = Depends(require_customer_management)
):
    """Get all customers with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("customers").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,customer_code.ilike.%{search}%")
        
        if customer_type:
            query = query.eq("type", customer_type)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination
        result = query.range(skip, skip + limit - 1).execute()
        
        # Add customer level calculation
        customers_with_level = []
        for customer in result.data:
            customer_dict = dict(customer)
            customer_dict["level"] = await calculate_customer_level(customer["id"])
            customers_with_level.append(customer_dict)
        
        return [Customer(**customer) for customer in customers_with_level]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customers: {str(e)}"
        )

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get customer by ID with detailed information"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("customers").select("*").eq("id", customer_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        customer_data = result.data[0]
        customer_data["level"] = await calculate_customer_level(customer_id)
        
        return Customer(**customer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customer: {str(e)}"
        )

@router.post("/", response_model=Customer)
async def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new customer with auto-generated customer code"""
    try:
        supabase = get_supabase_client()
        
        # Auto-generate customer code if not provided
        if not customer_data.customer_code:
            customer_data.customer_code = get_next_available_customer_code()
        else:
            # Validate provided customer code format
            if not validate_customer_code(customer_data.customer_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer code must be in format CUS000 (e.g., CUS001, CUS002, etc.)"
                )
            
            # Check if provided customer code already exists
            if check_customer_code_exists(customer_data.customer_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer code already exists"
                )
        
        # Check if email already exists (if provided)
        if customer_data.email:
            existing_email = supabase.table("customers").select("id").eq("email", customer_data.email).execute()
            if existing_email.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        
        # Create customer record
        customer_dict = customer_data.dict()
        customer_dict["id"] = str(uuid.uuid4())
        customer_dict["created_at"] = datetime.utcnow().isoformat()
        customer_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("customers").insert(customer_dict).execute()
        
        if result.data:
            customer_data = result.data[0]
            customer_data["level"] = "bronze"  # New customers start as bronze
            return Customer(**customer_data)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create customer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create customer: {str(e)}"
        )

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update customer information"""
    try:
        supabase = get_supabase_client()
        
        # Check if customer exists
        existing = supabase.table("customers").select("id").eq("id", customer_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Check for duplicate customer code if being updated
        if customer_update.customer_code:
            duplicate = supabase.table("customers").select("id").eq("customer_code", customer_update.customer_code).neq("id", customer_id).execute()
            if duplicate.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer code already exists"
                )
        
        # Check for duplicate email if being updated
        if customer_update.email:
            duplicate_email = supabase.table("customers").select("id").eq("email", customer_update.email).neq("id", customer_id).execute()
            if duplicate_email.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        
        # Update customer
        update_data = customer_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("customers").update(update_data).eq("id", customer_id).execute()
        
        if result.data:
            customer_data = result.data[0]
            customer_data["level"] = await calculate_customer_level(customer_id)
            return Customer(**customer_data)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update customer"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update customer: {str(e)}"
        )

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    hard_delete: bool = Query(False, description="Permanently delete customer from database"),
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete customer (soft delete by default, hard delete if hard_delete=true)"""
    try:
        supabase = get_supabase_client()
        
        # Check if customer exists
        existing = supabase.table("customers").select("id").eq("id", customer_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        if hard_delete:
            # Hard delete - permanently remove from database
            # Delete related records first to ensure complete deletion
            try:
                # 1. Delete payments related to this customer
                try:
                    supabase.table("payments").delete().eq("customer_id", customer_id).execute()
                    print(f"✅ Deleted payments for customer {customer_id}")
                except Exception as e:
                    print(f"⚠️ Error deleting payments (may not exist): {str(e)}")
                
                # 2. Delete invoice items (via invoices)
                try:
                    invoices = supabase.table("invoices").select("id").eq("customer_id", customer_id).execute()
                    if invoices.data:
                        invoice_ids = [inv['id'] for inv in invoices.data]
                        for invoice_id in invoice_ids:
                            supabase.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
                        print(f"✅ Deleted invoice items for {len(invoice_ids)} invoices")
                except Exception as e:
                    print(f"⚠️ Error deleting invoice items (may not exist): {str(e)}")
                
                # 3. Delete invoices
                try:
                    supabase.table("invoices").delete().eq("customer_id", customer_id).execute()
                    print(f"✅ Deleted invoices for customer {customer_id}")
                except Exception as e:
                    print(f"⚠️ Error deleting invoices (may not exist): {str(e)}")
                
                # 4. Delete quote items (via quotes)
                try:
                    quotes = supabase.table("quotes").select("id").eq("customer_id", customer_id).execute()
                    if quotes.data:
                        quote_ids = [q['id'] for q in quotes.data]
                        for quote_id in quote_ids:
                            supabase.table("quote_items").delete().eq("quote_id", quote_id).execute()
                        print(f"✅ Deleted quote items for {len(quote_ids)} quotes")
                except Exception as e:
                    print(f"⚠️ Error deleting quote items (may not exist): {str(e)}")
                
                # 5. Delete quotes
                try:
                    supabase.table("quotes").delete().eq("customer_id", customer_id).execute()
                    print(f"✅ Deleted quotes for customer {customer_id}")
                except Exception as e:
                    print(f"⚠️ Error deleting quotes (may not exist): {str(e)}")
                
                # 6. Delete expenses related to projects of this customer
                try:
                    projects = supabase.table("projects").select("id").eq("customer_id", customer_id).execute()
                    if projects.data:
                        project_ids = [p['id'] for p in projects.data]
                        for project_id in project_ids:
                            supabase.table("expenses").delete().eq("project_id", project_id).execute()
                        print(f"✅ Deleted expenses for {len(project_ids)} projects")
                except Exception as e:
                    print(f"⚠️ Error deleting expenses (may not exist): {str(e)}")
                
                # 7. Delete projects
                try:
                    supabase.table("projects").delete().eq("customer_id", customer_id).execute()
                    print(f"✅ Deleted projects for customer {customer_id}")
                except Exception as e:
                    print(f"⚠️ Error deleting projects (may not exist): {str(e)}")
                
                # 8. Finally, delete the customer
                result = supabase.table("customers").delete().eq("id", customer_id).execute()
                
                # Verify deletion - Supabase sometimes returns empty data even on success
                # So we check if customer still exists
                verification = supabase.table("customers").select("id").eq("id", customer_id).execute()
                
                if verification.data and len(verification.data) > 0:
                    # Customer still exists - deletion failed
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to permanently delete customer - customer still exists in database"
                    )
                else:
                    # Customer successfully deleted
                    return {
                        "message": "Customer permanently deleted successfully along with all related records",
                        "deleted": True,
                        "customer_id": customer_id
                    }
            except HTTPException:
                raise
            except Exception as db_error:
                # If deletion fails, return detailed error
                error_msg = str(db_error)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to permanently delete customer: {error_msg}"
                )
        else:
            # Soft delete by setting status to inactive
            # Check if customer has active projects (only for soft delete)
            active_projects = supabase.table("projects").select("id").eq("customer_id", customer_id).eq("status", "active").execute()
            if active_projects.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete customer with active projects. Please complete or cancel projects first."
                )
            
            result = supabase.table("customers").update({
                "status": "inactive",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", customer_id).execute()
            
            if result.data:
                return {"message": "Customer deleted successfully (soft delete)"}
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete customer"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete customer: {str(e)}"
        )

@router.get("/{customer_id}/transactions")
async def get_customer_transactions(
    customer_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get customer transaction history"""
    try:
        supabase = get_supabase_client()
        
        # Get invoices
        invoices = supabase.table("invoices").select("*").eq("customer_id", customer_id).range(skip, skip + limit - 1).execute()
        
        # Get projects
        projects = supabase.table("projects").select("*").eq("customer_id", customer_id).execute()
        
        transactions = []
        
        # Add invoices as transactions
        for invoice in invoices.data:
            transactions.append({
                "id": invoice["id"],
                "type": "invoice",
                "date": invoice["issue_date"],
                "amount": invoice["total_amount"],
                "status": invoice["status"],
                "description": f"Invoice {invoice['invoice_number']}"
            })
        
        # Add project milestones as transactions
        for project in projects.data:
            transactions.append({
                "id": project["id"],
                "type": "project",
                "date": project["start_date"],
                "amount": project["budget"] or 0,
                "status": project["status"],
                "description": f"Project: {project['name']}"
            })
        
        # Sort by date
        transactions.sort(key=lambda x: x["date"], reverse=True)
        
        return {
            "transactions": transactions[:limit],
            "total": len(transactions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customer transactions: {str(e)}"
        )

@router.get("/{customer_id}/revenue")
async def get_customer_revenue(
    customer_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get customer revenue statistics"""
    try:
        supabase = get_supabase_client()
        
        # Build date filter
        date_filter = ""
        if start_date and end_date:
            date_filter = f"issue_date.gte.{start_date},issue_date.lte.{end_date}"
        elif start_date:
            date_filter = f"issue_date.gte.{start_date}"
        elif end_date:
            date_filter = f"issue_date.lte.{end_date}"
        
        # Get paid invoices
        query = supabase.table("invoices").select("total_amount,issue_date").eq("customer_id", customer_id).eq("status", "paid")
        
        if date_filter:
            query = query.filter(date_filter)
        
        result = query.execute()
        
        total_revenue = sum(invoice["total_amount"] for invoice in result.data)
        
        # Calculate monthly revenue
        monthly_revenue = {}
        for invoice in result.data:
            month_key = invoice["issue_date"][:7]  # YYYY-MM
            if month_key not in monthly_revenue:
                monthly_revenue[month_key] = 0
            monthly_revenue[month_key] += invoice["total_amount"]
        
        return {
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "invoice_count": len(result.data),
            "customer_level": await calculate_customer_level(customer_id)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customer revenue: {str(e)}"
        )

@router.get("/stats/overview")
async def get_customer_stats(current_user: User = Depends(get_current_user)):
    """Get customer statistics overview"""
    try:
        supabase = get_supabase_client()
        
        # Get total customers
        total_result = supabase.table("customers").select("id", count="exact").execute()
        total_customers = total_result.count or 0
        
        # Get active customers
        active_result = supabase.table("customers").select("id", count="exact").eq("status", "active").execute()
        active_customers = active_result.count or 0
        
        # Get customers by type
        type_result = supabase.table("customers").select("type", count="exact").execute()
        
        # Get customers by level
        level_stats = {}
        for level in CUSTOMER_LEVELS.keys():
            # This would require a more complex query to calculate based on revenue
            level_stats[level] = 0
        
        return {
            "total_customers": total_customers,
            "active_customers": active_customers,
            "inactive_customers": total_customers - active_customers,
            "type_breakdown": type_result.data,
            "level_breakdown": level_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customer stats: {str(e)}"
        )

async def calculate_customer_level(customer_id: str) -> str:
    """Calculate customer level based on total revenue"""
    try:
        supabase = get_supabase_client()
        
        # Get total revenue from paid invoices
        result = supabase.table("invoices").select("total_amount").eq("customer_id", customer_id).eq("status", "paid").execute()
        
        total_revenue = sum(float(invoice.get("total_amount", 0) or 0) for invoice in result.data)
        
        # Determine level based on revenue
        if total_revenue >= CUSTOMER_LEVELS["platinum"]["min_revenue"]:
            return "platinum"
        elif total_revenue >= CUSTOMER_LEVELS["gold"]["min_revenue"]:
            return "gold"
        elif total_revenue >= CUSTOMER_LEVELS["silver"]["min_revenue"]:
            return "silver"
        else:
            return "bronze"
            
    except Exception:
        return "bronze"  # Default to bronze if calculation fails
