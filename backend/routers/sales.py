"""
Sales Management Router - Sales Center
Comprehensive sales management with quotes, invoices, sales receipts, and payments
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import uuid
import asyncio
import pandas as pd
import io
import json
from pydantic import BaseModel

from models.quote import Quote, QuoteCreate, QuoteUpdate, QuoteConvertToInvoice
from models.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItem
from models.sales_receipt import SalesReceipt, SalesReceiptCreate, SalesReceiptUpdate
from models.payment import Payment, PaymentCreate, PaymentUpdate, PaymentWithAllocations
from models.expense import Expense, ExpenseCreate, ExpenseUpdate
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from utils.permissions import require_permission, Permission, PermissionChecker
from services.supabase_client import get_supabase_client
from services.journal_service import journal_service
from services.project_validation_service import ProjectValidationService
# Temporarily disabled email service
# from services.email_service import email_service
email_service = None  # Email service temporarily disabled
from services.notification_service import notification_service
from services.quote_service import quote_service
from utils.file_utils import get_company_logo_path
from utils.customer_code_generator import get_next_available_customer_code

router = APIRouter()

# HELPER FUNCTIONS - Hàm hỗ trợ
# ============================================================================

def map_quote_from_db(quote_dict: dict) -> dict:
    """
    Map quote data from database format to API model format.
    - expiry_date -> valid_until (for compatibility with Quote model)
    - quote_date -> issue_date (if issue_date is missing)
    """
    if not quote_dict:
        return quote_dict
    
    # Map expiry_date to valid_until (database has expiry_date, model expects valid_until)
    if "expiry_date" in quote_dict and "valid_until" not in quote_dict:
        quote_dict["valid_until"] = quote_dict["expiry_date"]
    
    # Map quote_date to issue_date if issue_date is missing (for mobile compatibility)
    if "quote_date" in quote_dict and ("issue_date" not in quote_dict or not quote_dict.get("issue_date")):
        quote_dict["issue_date"] = quote_dict["quote_date"]
    
    return quote_dict

def get_user_accessible_project_ids(supabase, current_user: User) -> List[str]:
    """Get list of project_ids that user has access to via project_team"""
    # Admin and accountant have access to all projects
    if current_user.role in ["admin", "accountant"]:
        return None  # None means all projects
    
    # Get project_ids where user is in team (by user_id or email)
    team_query = supabase.table("project_team").select("project_id").eq("status", "active")
    
    # Match by user_id or email using OR condition
    or_conditions = []
    if current_user.id:
        or_conditions.append(f"user_id.eq.{current_user.id}")
    if current_user.email:
        or_conditions.append(f"email.eq.{current_user.email}")
    
    if not or_conditions:
        # If no user_id or email, return empty list
        return []
    
    # Apply OR condition if we have multiple conditions
    if len(or_conditions) > 1:
        team_query = team_query.or_(",".join(or_conditions))
    else:
        # Single condition - apply directly
        condition = or_conditions[0]
        if condition.startswith("user_id.eq."):
            team_query = team_query.eq("user_id", current_user.id)
        elif condition.startswith("email.eq."):
            team_query = team_query.eq("email", current_user.email)
    
    team_result = team_query.execute()
    
    if not team_result.data:
        # User is not in any project team
        return []
    
    # Get unique project_ids
    project_ids = list(set([member["project_id"] for member in team_result.data]))
    return project_ids

def check_user_has_project_access(supabase, current_user: User, project_id: Optional[str]) -> bool:
    """Check if user has access to a specific project"""
    if not project_id:
        return True  # No project_id means no restriction
    
    # Admin and accountant have access to all projects
    if current_user.role in ["admin", "accountant"]:
        return True
    
    # Check if user is in project_team for this project
    team_query = supabase.table("project_team").select("id").eq("project_id", project_id).eq("status", "active")
    
    # Match by user_id or email
    or_conditions = []
    if current_user.id:
        or_conditions.append(f"user_id.eq.{current_user.id}")
    if current_user.email:
        or_conditions.append(f"email.eq.{current_user.email}")
    
    if or_conditions:
        if len(or_conditions) > 1:
            team_query = team_query.or_(",".join(or_conditions))
        else:
            condition = or_conditions[0]
            if condition.startswith("user_id.eq."):
                team_query = team_query.eq("user_id", current_user.id)
            elif condition.startswith("email.eq."):
                team_query = team_query.eq("email", current_user.email)
        
        team_result = team_query.execute()
        return len(team_result.data) > 0
    
    return False

# ============================================================================
# PROJECT INTEGRATION - Tích hợp dự án
# ============================================================================

@router.get("/projects/by-customer/{customer_id}")
async def get_projects_for_sales(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get projects for a specific customer - used for dropdown selection in sales forms"""
    try:
        service = ProjectValidationService()
        return await service.get_projects_for_customer(customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects for customer: {str(e)}"
        )

@router.get("/projects/dropdown-options/{customer_id}")
async def get_project_dropdown_options(
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get formatted project options for dropdown selection"""
    try:
        service = ProjectValidationService()
        return await service.get_project_dropdown_options(customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project dropdown options: {str(e)}"
        )

@router.get("/validate-project-customer")
async def validate_project_for_sales(
    project_id: str,
    customer_id: str,
    current_user: User = Depends(get_current_user)
):
    """Validate that a project belongs to a specific customer for sales transactions"""
    try:
        service = ProjectValidationService()
        return await service.validate_project_customer(project_id, customer_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate project-customer relationship: {str(e)}"
        )

# ============================================================================
# QUOTES MANAGEMENT - Báo giá
# ============================================================================

# Pydantic models for quote email customization
class PaymentTermItem(BaseModel):
    description: str
    amount: str
    received: bool

class AttachmentItem(BaseModel):
    name: str
    content: str  # base64 encoded file content
    mimeType: str

class QuoteSendRequest(BaseModel):
    # Payment terms
    custom_payment_terms: Optional[List[PaymentTermItem]] = None
    additional_notes: Optional[str] = None
    default_notes: Optional[List[str]] = None
    
    # Company info
    company_name: Optional[str] = None
    company_showroom: Optional[str] = None
    company_factory: Optional[str] = None
    company_website: Optional[str] = None
    company_hotline: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_logo_base64: Optional[str] = None
    company_info: Optional[Dict[str, Any]] = None
    
    # Bank info
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_info: Optional[Dict[str, Any]] = None
    
    # File attachments
    attachments: Optional[List[AttachmentItem]] = None
    
    # Raw HTML
    raw_html: Optional[str] = None

@router.get("/quotes")
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all quotes with optional filtering. Only shows quotes for projects where user is in project_team, except for admin and accountant who see all quotes."""
    try:
        supabase = get_supabase_client()
        
        # Get accessible project_ids for current user
        accessible_project_ids = get_user_accessible_project_ids(supabase, current_user)
        
        query = supabase.table("quotes").select("""
            *,
            customers!quotes_customer_id_fkey(id, name, email, phone, company),
            projects!quotes_project_id_fkey(id, name, project_code),
            quote_items(*)
        """)
        
        # Filter by accessible projects if user is not admin/accountant
        if accessible_project_ids is not None:  # None means all projects (admin/accountant)
            if not accessible_project_ids:
                # User has no access to any projects - only show quotes with NULL project_id
                query = query.is_("project_id", "null")
            else:
                # Filter quotes to only show quotes for projects user has access to
                # Also include quotes with NULL project_id (quotes not linked to any project)
                # First filter by project_ids, then we'll add NULL project_id in post-processing
                query = query.in_("project_id", accessible_project_ids)
        
        # Apply filters
        if search:
            query = query.or_(f"quote_number.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        # If user is not admin/accountant and has accessible projects,
        # also include quotes with NULL project_id
        if accessible_project_ids is not None and accessible_project_ids:
            null_quotes_query = supabase.table("quotes").select("*").is_("project_id", "null")
            if search:
                null_quotes_query = null_quotes_query.or_(f"quote_number.ilike.%{search}%")
            if customer_id:
                null_quotes_query = null_quotes_query.eq("customer_id", customer_id)
            if status:
                null_quotes_query = null_quotes_query.eq("status", status)
            null_quotes_result = null_quotes_query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
            
            # Combine results and remove duplicates
            all_quotes = (result.data or []) + (null_quotes_result.data or [])
            # Remove duplicates by id
            seen_ids = set()
            unique_quotes = []
            for quote in all_quotes:
                if quote.get('id') not in seen_ids:
                    seen_ids.add(quote.get('id'))
                    unique_quotes.append(quote)
            result.data = unique_quotes
        
        # Return empty list if no data
        if not result.data:
            return []
        
        # Collect all project_ids and customer_ids to fetch related data
        project_ids = set()
        customer_ids = set()
        for quote in result.data:
            if quote.get('project_id'):
                project_ids.add(quote.get('project_id'))
            if quote.get('customer_id'):
                customer_ids.add(quote.get('customer_id'))
        
        # Fetch projects and customers in bulk
        projects_map = {}
        customers_map = {}
        
        if project_ids:
            try:
                projects_result = supabase.table("projects").select("id, name, project_code").in_("id", list(project_ids)).execute()
                if projects_result.data:
                    for project in projects_result.data:
                        projects_map[project.get('id')] = project
            except Exception as e:
                print(f"Error fetching projects: {e}")
        
        if customer_ids:
            try:
                customers_result = supabase.table("customers").select("id, name, email, phone, company").in_("id", list(customer_ids)).execute()
                if customers_result.data:
                    for customer in customers_result.data:
                        customers_map[customer.get('id')] = customer
            except Exception as e:
                print(f"Error fetching customers: {e}")
        
        # Process quotes data to handle None values
        processed_quotes = []
        for quote in result.data:
            try:
                # Handle None values for required fields
                if quote.get('quote_number') is None:
                    quote['quote_number'] = f"QUO-{quote.get('id', 'UNKNOWN')[:8]}"
                
                if quote.get('issue_date') is None:
                    quote['issue_date'] = quote.get('created_at', datetime.now()).date()
                
                # Convert datetime to date if needed
                if isinstance(quote.get('issue_date'), datetime):
                    quote['issue_date'] = quote['issue_date'].date()
                
                # Map database fields to model fields
                quote = map_quote_from_db(quote)
                
                if isinstance(quote.get('valid_until'), datetime):
                    quote['valid_until'] = quote['valid_until'].date()
                
                # Get project and customer data from maps
                project_data = None
                customer_data = None
                
                if quote.get('project_id') and quote.get('project_id') in projects_map:
                    project_data = projects_map[quote.get('project_id')]
                
                if quote.get('customer_id') and quote.get('customer_id') in customers_map:
                    customer_data = customers_map[quote.get('customer_id')]
                
                # Build quote dict directly (don't use Quote model to avoid serialization issues)
                quote_dict = {
                    'id': quote.get('id', ''),
                    'quote_number': quote.get('quote_number', ''),
                    'customer_id': quote.get('customer_id', ''),
                    'project_id': quote.get('project_id'),
                    'issue_date': quote.get('issue_date'),
                    'valid_until': quote.get('valid_until'),
                    'subtotal': quote.get('subtotal', 0.0),
                    'tax_rate': quote.get('tax_rate', 0.0),
                    'tax_amount': quote.get('tax_amount', 0.0),
                    'total_amount': quote.get('total_amount', 0.0),
                    'currency': quote.get('currency', 'VND'),
                    'status': quote.get('status', 'draft'),
                    'notes': quote.get('notes'),
                    'created_by': quote.get('created_by'),
                    'product_components': quote.get('product_components'),
                    'created_at': quote.get('created_at', datetime.now()),
                    'updated_at': quote.get('updated_at', datetime.now())
                }
                
                # Add project information if available
                if project_data:
                    # Handle both dict and list formats
                    if isinstance(project_data, list) and len(project_data) > 0:
                        project_data = project_data[0]
                    
                    quote_dict['project'] = {
                        'id': project_data.get('id'),
                        'name': project_data.get('name'),
                        'project_code': project_data.get('project_code')
                    }
                
                # Add customer information if available
                if customer_data:
                    # Handle both dict and list formats
                    if isinstance(customer_data, list) and len(customer_data) > 0:
                        customer_data = customer_data[0]
                    
                    quote_dict['customer'] = {
                        'id': customer_data.get('id'),
                        'name': customer_data.get('name'),
                        'email': customer_data.get('email'),
                        'phone': customer_data.get('phone'),
                        'company': customer_data.get('company')
                    }
                
                processed_quotes.append(quote_dict)
            except Exception as quote_error:
                print(f"Error processing quote {quote.get('id', 'unknown')}: {quote_error}")
                continue
        
        return processed_quotes
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch quotes: {str(e)}"
        )

@router.get("/quotes/{quote_id}")
async def get_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific quote by ID with full details including items, customer, and project. Only accessible if user is in project_team for that project, except for admin and accountant."""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("quotes").select("""
            *,
            customers!quotes_customer_id_fkey(id, name, email, phone, company),
            projects!quotes_project_id_fkey(id, name, project_code),
            quote_items(*)
        """).eq("id", quote_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = result.data[0]
        
        # Map database fields to model fields
        quote = map_quote_from_db(quote)
        
        # Ensure required fields have default values if None
        if not quote.get("issue_date"):
            quote["issue_date"] = quote.get("created_at", datetime.now().date())
        if not quote.get("valid_until"):
            # Default to 30 days from issue_date
            issue_date = quote.get("issue_date")
            if isinstance(issue_date, date):
                quote["valid_until"] = issue_date + timedelta(days=30)
            else:
                quote["valid_until"] = datetime.now().date() + timedelta(days=30)
        if not quote.get("created_at"):
            quote["created_at"] = datetime.now()
        if not quote.get("updated_at"):
            quote["updated_at"] = quote.get("created_at", datetime.now())
        
        # Ensure numeric fields have default values
        if quote.get("subtotal") is None:
            quote["subtotal"] = 0.0
        if quote.get("tax_rate") is None:
            quote["tax_rate"] = 0.0
        if quote.get("tax_amount") is None:
            quote["tax_amount"] = 0.0
        if quote.get("total_amount") is None:
            quote["total_amount"] = quote.get("subtotal", 0.0) + quote.get("tax_amount", 0.0)
        
        project_id = quote.get("project_id")
        
        # Check if user has access to this project
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this quote"
            )
        
        # Get quote items with product information (category, images, etc.)
        quote_items_with_products = await quote_service.get_quote_items_with_categories(quote_id)
        
        # Replace quote_items in the response with enriched items
        # Use 'items' key for Android compatibility (some apps expect 'items' instead of 'quote_items')
        quote["quote_items"] = quote_items_with_products
        quote["items"] = quote_items_with_products  # Also include as 'items' for compatibility
        
        # Ensure customers and projects are properly formatted (handle None cases)
        if quote.get("customers") is None:
            quote["customers"] = None
        if quote.get("projects") is None:
            quote["projects"] = None
        
        # Return the full quote dict with all fields (customers, projects, items)
        # This ensures Android app receives all necessary data
        return quote
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch quote: {str(e)}"
        )

@router.get("/quotes/{quote_id}/items")
async def get_quote_items(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get quote items for a specific quote"""
    try:
        supabase = get_supabase_client()
        
        # Get quote items
        items_result = supabase.table("quote_items").select("*").eq("quote_id", quote_id).execute()
        
        return {
            "items": items_result.data if items_result.data else []
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get quote items: {str(e)}"
        )

@router.post("/quotes", response_model=Quote)
async def create_quote(
    quote_data: QuoteCreate,
    current_user: User = Depends(PermissionChecker(Permission.CREATE_QUOTE))
):
    """Create a new quote"""
    try:
        supabase = get_supabase_client()
        
        # Check if quote number already exists
        existing = supabase.table("quotes").select("id").eq("quote_number", quote_data.quote_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="Quote number already exists"
            )
        
        # Calculate tax amount
        tax_amount = quote_data.subtotal * (quote_data.tax_rate / 100)
        total_amount = quote_data.subtotal + tax_amount
        
        # Get employee ID for created_by
        employee_result = supabase.table("employees").select("id").eq("user_id", current_user.id).execute()
        created_by = employee_result.data[0]["id"] if employee_result.data else None
        
        # Create quote record
        quote_dict = quote_data.dict()
        
        # Remove fields that are not in the quotes table
        if "items" in quote_dict:
            del quote_dict["items"]
        if "terms" in quote_dict:
            del quote_dict["terms"]
        if "discount_rate" in quote_dict:
            del quote_dict["discount_rate"]
        if "discount_amount" in quote_dict:
            del quote_dict["discount_amount"]
        if "product_components" in quote_dict:
            del quote_dict["product_components"]
        
        # Map description to notes (for mobile compatibility)
        if "description" in quote_dict:
            if "notes" not in quote_dict or not quote_dict["notes"]:
                quote_dict["notes"] = quote_dict["description"]
            del quote_dict["description"]
        
        # Map quote_date to issue_date (for mobile compatibility)
        if "quote_date" in quote_dict and quote_dict["quote_date"]:
            if "issue_date" not in quote_dict or not quote_dict["issue_date"]:
                quote_dict["issue_date"] = quote_dict["quote_date"]
            del quote_dict["quote_date"]
        
        # Map valid_until to expiry_date (for mobile compatibility)
        # Handle both expiry_date and valid_until - database may have both columns
        # Priority: expiry_date > valid_until (mobile sends both, web sends valid_until)
        expiry_value = None
        if "expiry_date" in quote_dict and quote_dict["expiry_date"]:
            expiry_value = quote_dict["expiry_date"]
        elif "valid_until" in quote_dict and quote_dict["valid_until"]:
            expiry_value = quote_dict["valid_until"]
        
        # Set both expiry_date and valid_until to ensure compatibility
        # Database may have both columns, and valid_until might have NOT NULL constraint
        if expiry_value:
            quote_dict["expiry_date"] = expiry_value
            quote_dict["valid_until"] = expiry_value  # Set both to same value for compatibility
        # If neither exists, this will cause an error which is expected (required field)
            
        quote_dict["id"] = str(uuid.uuid4())
        quote_dict["tax_amount"] = tax_amount
        quote_dict["total_amount"] = total_amount
        quote_dict["created_by"] = created_by
        # Persist selected employee in charge if provided; fallback to created_by
        selected_emp = getattr(quote_data, 'employee_in_charge_id', None)
        quote_dict["employee_in_charge_id"] = selected_emp or created_by
        quote_dict["created_at"] = datetime.utcnow().isoformat()
        quote_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Helper to convert date to string for JSON serialization
        if quote_dict.get("issue_date"):
            if isinstance(quote_dict["issue_date"], str):
                # Already a string, keep as is
                pass
            else:
                quote_dict["issue_date"] = quote_dict["issue_date"].isoformat()
        if quote_dict.get("expiry_date"):
            if isinstance(quote_dict["expiry_date"], str):
                # Already a string, keep as is
                pass
            else:
                quote_dict["expiry_date"] = quote_dict["expiry_date"].isoformat()
        # Also ensure valid_until is a string if it exists
        if quote_dict.get("valid_until"):
            if isinstance(quote_dict["valid_until"], str):
                # Already a string, keep as is
                pass
            else:
                quote_dict["valid_until"] = quote_dict["valid_until"].isoformat()
        
        result = supabase.table("quotes").insert(quote_dict).execute()
        
        if result.data:
            quote = result.data[0]
            
            # Map database fields to model fields before returning
            quote = map_quote_from_db(quote)
            
            # Handle quote items if provided
            if quote_data.items:
                quote_items = []
                for item in quote_data.items:
                    quote_item = {
                        "id": str(uuid.uuid4()),
                        "quote_id": quote["id"],
                        "product_service_id": item.get("product_service_id"),
                        "name_product": item.get("name_product", ""),
                        "description": item.get("description", ""),
                        "quantity": item.get("quantity", 0),
                        "unit": item.get("unit", ""),
                        "unit_price": item.get("unit_price", 0),
                        "total_price": item.get("total_price", 0),
                        "area": item.get("area"),
                        "volume": item.get("volume"),
                        "height": item.get("height"),
                        "length": item.get("length"),
                        "depth": item.get("depth"),
                        "created_at": datetime.utcnow().isoformat()
                    }
                    quote_items.append(quote_item)
                
                if quote_items:
                    supabase.table("quote_items").insert(quote_items).execute()
            
            # Create notification for the employee who created the quote
            if created_by:
                await notification_service.create_quote_notification(quote, created_by)
            
            # Notify all admin users about the new quote
            try:
                # Get creator name for notification
                creator_name = None
                if created_by:
                    employee_info = supabase.table("employees").select("full_name, first_name, last_name").eq("id", created_by).execute()
                    if employee_info.data:
                        emp = employee_info.data[0]
                        creator_name = emp.get("full_name") or f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
                
                # Notify all admins
                await notification_service.notify_admins_quote_created(quote, creator_name)
            except Exception as e:
                # Don't fail quote creation if notification fails
                print(f"Error notifying admins about quote creation: {e}")
            
            return Quote(**quote)
        
        raise HTTPException(
            status_code=400,
            detail="Failed to create quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create quote: {str(e)}"
        )

@router.delete("/quotes/{quote_id}")
async def delete_quote(
    quote_id: str,
    force: bool = Query(False, description="Force delete even if related records exist"),
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete a quote and its items. Prevent delete if linked invoices exist (unless force=true)."""
    try:
        supabase = get_supabase_client()

        # Ensure quote exists
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Check if there are invoices linked to this quote
        invoices_result = supabase.table("invoices").select("id, invoice_number, status").eq("quote_id", quote_id).limit(1).execute()
        if invoices_result.data and not force:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete quote because an invoice has been created from this quote. Set force=true to override."
            )

        # Delete quote_items first to avoid FK constraint errors
        supabase.table("quote_items").delete().eq("quote_id", quote_id).execute()

        # Delete the quote
        delete_result = supabase.table("quotes").delete().eq("id", quote_id).execute()
        if delete_result.data is None:
            # Some Supabase clients return None on successful delete; verify by re-query
            verify = supabase.table("quotes").select("id").eq("id", quote_id).execute()
            if verify.data:
                raise HTTPException(status_code=400, detail="Failed to delete quote")

        return {"message": "Quote deleted successfully", "quote_id": quote_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete quote: {str(e)}"
        )

@router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(
    quote_id: str,
    quote_data: QuoteUpdate,
    current_user: User = Depends(PermissionChecker(Permission.EDIT_QUOTE))
):
    """Update a quote"""
    try:
        supabase = get_supabase_client()
        
        # Check if quote exists
        existing = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in quote_data.dict().items() if v is not None}
        
        # Recalculate totals if needed
        if "subtotal" in update_dict or "tax_rate" in update_dict:
            current_quote = existing.data[0]
            subtotal = update_dict.get("subtotal", current_quote["subtotal"])
            tax_rate = update_dict.get("tax_rate", current_quote["tax_rate"])
            
            tax_amount = subtotal * (tax_rate / 100)
            total_amount = subtotal + tax_amount
            
            update_dict["tax_amount"] = tax_amount
            update_dict["total_amount"] = total_amount
        
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("quotes").update(update_dict).eq("id", quote_id).execute()
        
        if result.data:
            quote = map_quote_from_db(result.data[0])
            return Quote(**quote)
        
        raise HTTPException(
            status_code=400,
            detail="Failed to update quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update quote: {str(e)}"
        )

@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    """Get notifications for current user"""
    try:
        # Get user ID from current user
        user_id = current_user.id
        
        # Get notifications
        notifications = await notification_service.get_employee_notifications(user_id, limit)
        
        return {
            "notifications": notifications,
            "total": len(notifications)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get notifications: {str(e)}"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        success = await notification_service.mark_notification_as_read(notification_id)
        
        if success:
            return {"message": "Notification marked as read"}
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to mark notification as read"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

# Helper function to create invoice from approved quote (runs in background)
async def create_invoice_from_quote(quote_id: str, quote: dict, approver_user_id: str):
    """Create invoice from approved quote - runs in background to avoid timeout"""
    try:
        supabase = get_supabase_client()
        
        # 1. Prepare Invoice Data
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        due_date = (datetime.now() + timedelta(days=30)).date() # Default 30 days
        
        # Resolve approver's Employee ID from User ID
        approver_employee_id = None
        try:
            emp_res = supabase.table("employees").select("id").eq("user_id", approver_user_id).execute()
            if emp_res.data:
                approver_employee_id = emp_res.data[0]["id"]
        except Exception:
            pass # Keep None if not found

        invoice_id = str(uuid.uuid4())
        invoice_data = {
            "id": invoice_id,
            "invoice_number": invoice_number,
            "customer_id": quote.get("customer_id"),
            "project_id": quote.get("project_id"),
            "quote_id": quote_id,
            "issue_date": datetime.now().date().isoformat(),
            "due_date": due_date.isoformat(),
            "subtotal": quote.get("subtotal", 0),
            "tax_rate": quote.get("tax_rate", 0),
            "tax_amount": quote.get("tax_amount", 0),
            "total_amount": quote.get("total_amount", 0),
            "currency": quote.get("currency", "VND"),
            "status": "draft", # Start as draft
            "payment_status": "pending",
            "paid_amount": 0.0,
            "items": [], 
            "notes": f"Hóa đơn được tạo tự động từ báo giá {quote.get('quote_number', 'N/A')}",
            "terms_and_conditions": quote.get("terms_and_conditions"),
            "payment_terms": None,
            "created_by": approver_employee_id,
            "employee_in_charge_id": quote.get("employee_in_charge_id") or quote.get("created_by"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        # 2. Insert Invoice
        inv_result = supabase.table("invoices").insert(invoice_data).execute()
        
        if inv_result.data:
            # 3. Create Invoice Items from Quote Items
            raw_items_res = supabase.table("quote_items").select("*").eq("quote_id", quote_id).execute()
            if raw_items_res.data:
                invoice_items = []
                
                # Collect all product_service_ids to validate
                product_ids = [q_item.get("product_service_id") for q_item in raw_items_res.data if q_item.get("product_service_id")]
                
                # Get existing product IDs in one query
                valid_product_ids = set()
                if product_ids:
                    products_res = supabase.table("products_services").select("id").in_("id", product_ids).execute()
                    if products_res.data:
                        valid_product_ids = {p.get("id") for p in products_res.data}
                
                for q_item in raw_items_res.data:
                    # Safely handle product_components
                    product_components = q_item.get("product_components")
                    if not product_components or not isinstance(product_components, list):
                        product_components = []

                    # Validate product_service_id - set to None if product doesn't exist
                    product_service_id = q_item.get("product_service_id")
                    if product_service_id and product_service_id not in valid_product_ids:
                        print(f"⚠️ Warning: Product {product_service_id} not found, setting to None for invoice item")
                        product_service_id = None

                    inv_item = {
                        "id": str(uuid.uuid4()),
                        "invoice_id": invoice_id,
                        "product_service_id": product_service_id,
                        "description": q_item.get("description", ""),
                        "quantity": q_item.get("quantity", 0),
                        "unit_price": q_item.get("unit_price", 0),
                        "total_price": q_item.get("total_price", 0),
                        "name_product": q_item.get("name_product"),
                        "unit": q_item.get("unit"),
                        "tax_rate": q_item.get("tax_rate", quote.get("tax_rate", 10.0)),  # Copy tax_rate from quote_item or use quote default
                        "discount_rate": q_item.get("discount_rate", 0.0),
                        "area": q_item.get("area"),
                        "volume": q_item.get("volume"),
                        "height": q_item.get("height"),
                        "length": q_item.get("length"),
                        "depth": q_item.get("depth"),
                        "product_components": product_components,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    invoice_items.append(inv_item)
                
                if invoice_items:
                    supabase.table("invoice_items").insert(invoice_items).execute()
            
            print(f"✅ Auto-created invoice {invoice_number} for approved quote {quote_id}")
            return True
        else:
            print(f"❌ Failed to auto-create invoice: No data returned from insert")
            return False

    except Exception as inv_error:
        print(f"❌ Failed to auto-create invoice: {inv_error}")
        import traceback
        traceback.print_exc()
        return False

# Helper function to send email notification (runs in background)
async def send_quote_approved_email_background(quote_id: str, quote: dict, employee_email: str, employee_name: str):
    """Send quote approved email notification - runs in background"""
    try:
        if not email_service:
            print(f"⚠️ Email service disabled - skipping quote approved notification email")
            return
        quote_items = await quote_service.get_quote_items_with_categories(quote_id)
        await email_service.send_quote_approved_notification_email(
            quote,
            employee_email,
            employee_name,
            quote_items
        )
        print(f"Quote approved notification email sent to employee {employee_name}")
    except Exception as email_error:
        print(f"Failed to send quote approved notification email: {email_error}")

@router.post("/quotes/{quote_id}/approve")
async def approve_quote(
    quote_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Approve quote and create notification for manager - optimized to avoid timeout"""
    try:
        supabase = get_supabase_client()
        
        # Get quote details with relations in one query
        quote_result = supabase.table("quotes").select("""
            *,
            customers!quotes_customer_id_fkey(id, name, email, phone, company),
            projects!quotes_project_id_fkey(id, name, project_code)
        """).eq("id", quote_id).execute()
        
        if not quote_result.data:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        quote = quote_result.data[0]
        
        # Update quote status to approved
        update_data = {
            "status": "approved",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to approve quote")
        
        # Update quote object with new status for background tasks
        quote["status"] = "approved"
        
        # Get employee and manager info in parallel (optimized)
        created_by = quote.get("created_by")
        employee_name = "Nhân viên"
        employee_user_id = None
        employee_email = None
        
        # Get employee details if exists
        if created_by:
            try:
                employee_result = supabase.table("employees").select("user_id, first_name, last_name, email").eq("id", created_by).execute()
                if employee_result.data:
                    employee = employee_result.data[0]
                    employee_user_id = employee.get("user_id")
                    first_name = employee.get("first_name", "")
                    last_name = employee.get("last_name", "")
                    employee_name = f"{first_name} {last_name}".strip() or "Nhân viên"
                    employee_email = employee.get("email")
                    
                    # Create notification for the employee who created the quote (Background)
                    if employee_user_id:
                        background_tasks.add_task(
                            notification_service.create_quote_approved_notification,
                            quote, 
                            employee_user_id,
                            employee_name
                        )
                    
                    # Send email notification to employee in background
                    if employee_email:
                        background_tasks.add_task(
                            send_quote_approved_email_background,
                            quote_id,
                            quote,
                            employee_email,
                            employee_name
                        )
                        print(f"Quote approved notification email queued for employee {employee_name}")
            except Exception as emp_error:
                print(f"Failed to get employee details: {emp_error}")
                # Continue without employee details
        
        # Create invoice in background (heavy operation)
        background_tasks.add_task(
            create_invoice_from_quote,
            quote_id,
            quote,
            current_user.id
        )
        print(f"Invoice creation queued for approved quote {quote_id}")
        
        # Get all admins to notify them (treating admins as managers) - in background
        try:
            managers_result = supabase.table("users").select("id, full_name").eq("role", "admin").execute()
            if managers_result.data:
                for manager in managers_result.data:
                    manager_user_id = manager.get("id")
                    manager_name = manager.get("full_name") or "Quản lý"
                    
                    # Create notification for managers (Background)
                    background_tasks.add_task(
                        notification_service.create_quote_approved_manager_notification,
                        quote,
                        manager_user_id,
                        manager_name,
                        employee_name
                    )
        except Exception as manager_error:
            print(f"Failed to notify managers: {manager_error}")
            # Continue without manager notifications
        
        # Return immediately with updated quote (invoice will be created in background)
        final_quote = quote_result.data[0]
        final_quote["status"] = "approved"
        final_quote["updated_at"] = update_data["updated_at"]

        return {
            "message": "Quote approved successfully. Invoice is being created in the background.",
            "quote": final_quote,
            "invoice": None,  # Will be created in background
            "notifications_sent": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve quote: {str(e)}"
        )

@router.get("/default-logo")
async def get_default_logo(
    current_user: User = Depends(require_manager_or_admin)
):
    """Get default company logo file"""
    from fastapi.responses import FileResponse
    import os
    
    try:
        # Use centralized logo path logic
        logo_path = get_company_logo_path()
        
        if os.path.exists(logo_path):
            return FileResponse(
                logo_path,
                media_type="image/jpeg",
                filename="logo_phucdat.jpg"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Logo file not found at {logo_path}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load logo: {str(e)}"
        )

@router.get("/quotes/{quote_id}/preview")
@router.post("/quotes/{quote_id}/preview")
async def preview_quote_email(
    quote_id: str,
    request: Optional[QuoteSendRequest] = None,
    current_user: User = Depends(get_current_user)
):
    """Preview quote email HTML before sending (GET for load, POST for preview with custom data)"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Fetch quote items with categories concurrently with other data if possible
        # But here we need quote first to get customer_id (though we could fetch quote items in parallel with customer info)
        
        # Parallel fetch: Customer Info and Quote Items
        async def get_customer_info(c_id):
            if not c_id: return None
            try:
                res = supabase.table("customers").select("*").eq("id", c_id).single().execute()
                return res.data
            except Exception:
                return None

        # Execute parallel tasks
        customer_task = get_customer_info(quote.get("customer_id"))
        items_task = quote_service.get_quote_items_with_categories(quote_id)
        
        customer_data, quote_items = await asyncio.gather(customer_task, items_task)
        
        # Process customer data
        customer_name = ""
        customer_email = ""
        customer_phone = ""
        customer_address = ""
        
        if customer_data:
            customer_name = customer_data.get("name", "")
            customer_email = customer_data.get("email", "")
            customer_phone = customer_data.get("phone", "")
            customer_address = customer_data.get("address", "")
        
        # Get employee information from created_by -> employees -> users
        employee_name = None
        employee_phone = None
        emp_id = quote.get("employee_in_charge_id") or quote.get("created_by")
        if emp_id:
            try:
                # Step 1: Get employee info including user_id
                emp_res = supabase.table("employees").select("id, user_id, first_name, last_name, phone").eq("id", emp_id).single().execute()
                if emp_res.data:
                    emp = emp_res.data
                    employee_phone = emp.get("phone")
                    # Candidate name from employees table (first_name + last_name)
                    candidate_name = f"{emp.get('first_name','')} {emp.get('last_name','')}".strip()
                    
                    # Step 2: Prefer users.full_name if available
                    user_id = emp.get("user_id")
                    if user_id:
                        try:
                            user_res = supabase.table("users").select("full_name").eq("id", user_id).single().execute()
                            if user_res.data and user_res.data.get("full_name"):
                                employee_name = user_res.data.get("full_name")
                            else:
                                employee_name = candidate_name
                        except Exception:
                            employee_name = candidate_name
                    else:
                        employee_name = candidate_name
            except Exception as e:
                print(f"Error fetching employee info: {e}")
                pass
        
        # Add customer info to quote data
        quote_data = {
            **quote,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": customer_phone,
            "customer_address": customer_address
        }
        
        # Check for active email customization
        customization = None
        try:
            customization_result = supabase.table("email_customizations").select("*").eq("quote_id", quote_id).eq("is_active", True).order("version", desc=True).limit(1).execute()
            if customization_result.data and len(customization_result.data) > 0:
                customization = customization_result.data[0]
                print(f"📝 Found active customization version {customization.get('version')}")
        except Exception as e:
            print(f"Error fetching customization: {e}")
        
        # Extract customization data
        custom_payment_terms = None
        additional_notes = None
        default_notes = None
        company_info = {}
        bank_info = {}
        
        # If request body provided (POST), use it for preview, otherwise use saved customization
        if request:
            # Use request data for preview
            if request.custom_payment_terms is not None:
                # Always use request payment terms if provided (even if empty list)
                custom_payment_terms = request.custom_payment_terms if isinstance(request.custom_payment_terms, list) else None
            if request.additional_notes:
                additional_notes = request.additional_notes
            if request.default_notes:
                default_notes = request.default_notes
            
            # Company info from request
            if request.company_name:
                company_info["company_name"] = request.company_name
            if request.company_showroom:
                company_info["company_showroom"] = request.company_showroom
            if request.company_factory:
                company_info["company_factory"] = request.company_factory
            if request.company_website:
                company_info["company_website"] = request.company_website
            if request.company_hotline:
                company_info["company_hotline"] = request.company_hotline
            if request.company_logo_url:
                company_info["company_logo_url"] = request.company_logo_url
            if request.company_logo_base64:
                company_info["company_logo_base64"] = request.company_logo_base64
            if request.company_info:
                if isinstance(request.company_info, dict):
                    company_info.update(request.company_info)
            
            # Bank info from request
            if request.bank_account_name:
                bank_info["bank_account_name"] = request.bank_account_name
            if request.bank_account_number:
                bank_info["bank_account_number"] = request.bank_account_number
            if request.bank_name:
                bank_info["bank_name"] = request.bank_name
            if request.bank_branch:
                bank_info["bank_branch"] = request.bank_branch
            if request.bank_account_info:
                if isinstance(request.bank_account_info, dict):
                    bank_info.update(request.bank_account_info)
        
        # Fallback to saved customization if no request data (for GET requests)
        if not request and customization:
            # Payment terms - only if not set from request
            if custom_payment_terms is None:
                cpt = customization.get("custom_payment_terms")
                if isinstance(cpt, str):
                    try:
                        import json as _json
                        cpt = _json.loads(cpt)
                    except Exception:
                        pass
                if cpt is not None:
                    custom_payment_terms = cpt if isinstance(cpt, list) else None
            
            # Additional notes - only if not set from request
            if additional_notes is None:
                additional_notes = customization.get("additional_notes")
            
            # Default notes (GHI CHÚ section) - load from company_info JSONB - only if not set from request
            if default_notes is None:
                company_info_json = customization.get("company_info")
                if company_info_json:
                    if isinstance(company_info_json, str):
                        try:
                            import json as _json
                            company_info_json = _json.loads(company_info_json)
                        except Exception:
                            pass
                    if isinstance(company_info_json, dict):
                        default_notes = company_info_json.get("default_notes")
            
            # Company info - only if not set from request
            if not company_info.get("company_name") and customization.get("company_name"):
                company_info["company_name"] = customization.get("company_name")
            if not company_info.get("company_showroom") and customization.get("company_showroom"):
                company_info["company_showroom"] = customization.get("company_showroom")
            if not company_info.get("company_factory") and customization.get("company_factory"):
                company_info["company_factory"] = customization.get("company_factory")
            if not company_info.get("company_website") and customization.get("company_website"):
                company_info["company_website"] = customization.get("company_website")
            if not company_info.get("company_hotline") and customization.get("company_hotline"):
                company_info["company_hotline"] = customization.get("company_hotline")
            if not company_info.get("company_logo_url") and customization.get("company_logo_url"):
                company_info["company_logo_url"] = customization.get("company_logo_url")
            if not company_info.get("company_logo_base64") and customization.get("company_logo_base64"):
                company_info["company_logo_base64"] = customization.get("company_logo_base64")
            if customization.get("company_info"):
                company_info_json = customization.get("company_info")
                if isinstance(company_info_json, str):
                    try:
                        import json as _json
                        company_info_json = _json.loads(company_info_json)
                    except Exception:
                        pass
                if isinstance(company_info_json, dict):
                    # Merge but don't override existing keys from request
                    for key, value in company_info_json.items():
                        if key != "default_notes" and key not in company_info:
                            company_info[key] = value
            
            # Bank info - only if not set from request
            if not bank_info.get("bank_account_name") and customization.get("bank_account_name"):
                bank_info["bank_account_name"] = customization.get("bank_account_name")
            if not bank_info.get("bank_account_number") and customization.get("bank_account_number"):
                bank_info["bank_account_number"] = customization.get("bank_account_number")
            if not bank_info.get("bank_name") and customization.get("bank_name"):
                bank_info["bank_name"] = customization.get("bank_name")
            if not bank_info.get("bank_branch") and customization.get("bank_branch"):
                bank_info["bank_branch"] = customization.get("bank_branch")
            if customization.get("bank_account_info"):
                bank_info_json = customization.get("bank_account_info")
                if isinstance(bank_info_json, str):
                    try:
                        import json as _json
                        bank_info_json = _json.loads(bank_info_json)
                    except Exception:
                        pass
                if isinstance(bank_info_json, dict):
                    # Merge but don't override existing keys from request
                    for key, value in bank_info_json.items():
                        if key not in bank_info:
                            bank_info[key] = value
        
        # Use raw_html: priority: request.raw_html > customization.raw_html > generated HTML
        html_content = None
        if request and request.raw_html:
            # Use raw_html from request (highest priority)
            html_content = request.raw_html
            print(f"📝 Using raw_html from request")
        elif customization and customization.get("raw_html"):
            # Use raw_html from email_customizations table
            html_content = customization.get("raw_html")
            print(f"📝 Using raw_html from email_customizations table")
        else:
            # Generate HTML (will be updated to use company_info and bank_info)
            if not email_service:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Email service is temporarily disabled"
                )
            html_content = email_service.generate_quote_email_html(
                quote_data=quote_data,
                customer_name=customer_name,
                employee_name=employee_name,
                employee_phone=employee_phone,
                quote_items=quote_items,
                custom_payment_terms=custom_payment_terms,
                additional_notes=additional_notes,
                company_info=company_info if company_info else None,
                bank_info=bank_info if bank_info else None,
                default_notes=default_notes
            )
            print(f"📝 Generated HTML from template")
        
        return {
            "html": html_content,
            "customization": customization if customization else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview quote email: {str(e)}"
        )

@router.post("/quotes/{quote_id}/email-draft")
async def save_quote_email_draft(
    quote_id: str,
    request: QuoteSendRequest,
    current_user: User = Depends(require_manager_or_admin)
):
    """Save draft email edits for a quote (without sending) - using email_customizations table"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Get current active customization to determine next version
        existing_active = supabase.table("email_customizations").select("*").eq("quote_id", quote_id).eq("is_active", True).order("version", desc=True).limit(1).execute()
        
        next_version = 1
        if existing_active.data and len(existing_active.data) > 0:
            next_version = (existing_active.data[0].get("version", 0) or 0) + 1
        
        # Prepare customization data
        customization_data = {
            "quote_id": quote_id,
            "version": next_version,
            "is_active": True,
            "edited_by_user_id": current_user.id,
            "edited_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Company info fields
        if request.company_name is not None:
            customization_data["company_name"] = request.company_name
        if request.company_showroom is not None:
            customization_data["company_showroom"] = request.company_showroom
        if request.company_factory is not None:
            customization_data["company_factory"] = request.company_factory
        if request.company_website is not None:
            customization_data["company_website"] = request.company_website
        if request.company_hotline is not None:
            customization_data["company_hotline"] = request.company_hotline
        if request.company_logo_url is not None:
            customization_data["company_logo_url"] = request.company_logo_url
        if request.company_logo_base64 is not None:
            customization_data["company_logo_base64"] = request.company_logo_base64
        if request.company_info is not None:
            customization_data["company_info"] = request.company_info
        
        # Bank info fields
        if request.bank_account_name is not None:
            customization_data["bank_account_name"] = request.bank_account_name
        if request.bank_account_number is not None:
            customization_data["bank_account_number"] = request.bank_account_number
        if request.bank_name is not None:
            customization_data["bank_name"] = request.bank_name
        if request.bank_branch is not None:
            customization_data["bank_branch"] = request.bank_branch
        if request.bank_account_info is not None:
            customization_data["bank_account_info"] = request.bank_account_info
        
        # Custom payment terms
        if request.custom_payment_terms is not None:
            try:
                payment_terms_list = []
                for term in request.custom_payment_terms:
                    if hasattr(term, 'model_dump'):
                        payment_terms_list.append(term.model_dump())
                    elif hasattr(term, 'dict'):
                        payment_terms_list.append(term.dict())
                    elif isinstance(term, dict):
                        payment_terms_list.append(term)
                    else:
                        payment_terms_list.append({
                            "description": getattr(term, 'description', ''),
                            "amount": getattr(term, 'amount', ''),
                            "received": getattr(term, 'received', False)
                        })
                customization_data["custom_payment_terms"] = payment_terms_list
                print(f"✅ Saved draft custom_payment_terms: {payment_terms_list}")
            except Exception as e:
                print(f"❌ Error converting payment terms: {e}")
                import traceback
                traceback.print_exc()
        
        # Additional notes
        if request.additional_notes is not None:
            customization_data["additional_notes"] = request.additional_notes
        
        # Default notes (GHI CHÚ section) - store in company_info JSONB
        if request.default_notes is not None:
            # Store default_notes in company_info JSONB field
            if "company_info" not in customization_data or customization_data["company_info"] is None:
                customization_data["company_info"] = {}
            if not isinstance(customization_data["company_info"], dict):
                customization_data["company_info"] = {}
            if isinstance(customization_data["company_info"], dict):
                customization_data["company_info"]["default_notes"] = request.default_notes
        
        # Raw HTML
        if request.raw_html is not None:
            customization_data["raw_html"] = request.raw_html
        
        print(f"📝 Saving email customization with data: {customization_data}")
        
        # Deactivate existing active customizations (trigger will handle this, but we do it explicitly)
        if existing_active.data and len(existing_active.data) > 0:
            for existing in existing_active.data:
                supabase.table("email_customizations").update({"is_active": False}).eq("id", existing["id"]).execute()
        
        # Create new customization
        result = supabase.table("email_customizations").insert(customization_data).execute()
        print(f"✅ Created new email customization version {next_version}")
        
        if result.data:
            return {
                "message": "Email customization saved successfully",
                "customization": result.data[0] if isinstance(result.data, list) else result.data
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to save email customization"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving email customization: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save email customization: {str(e)}"
        )

@router.post("/quotes/{quote_id}/send")
async def send_quote_to_customer(
    quote_id: str,
    background_tasks: BackgroundTasks,
    request: Optional[QuoteSendRequest] = None,
    current_user: User = Depends(get_current_user)
):
    """Send quote to customer via email"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        # Update quote status to sent
        update_data = {
            "status": "sent",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
        
        if result.data:
            # Get customer information for email
            customer_result = supabase.table("customers").select("name, email").eq("id", quote_result.data[0]["customer_id"]).execute()
            
            email_sent = False
            email_error = None
            
            if customer_result.data:
                customer = customer_result.data[0]
                customer_name = customer.get("name", "Khách hàng")
                customer_email = customer.get("email")
                
                # Fetch project name if available
                project_name = None
                try:
                    project_id = quote_result.data[0].get("project_id")
                    if project_id:
                        project_res = supabase.table("projects").select("name").eq("id", project_id).single().execute()
                        if project_res.data:
                            project_name = project_res.data.get("name")
                except Exception as _:
                    project_name = None
                
                if customer_email:
                    try:
                        # Get quote items for email
                        quote_items_result = supabase.table("quote_items").select("*").eq("quote_id", quote_id).execute()
                        quote_items = quote_items_result.data if quote_items_result.data else []
                        
                        # Get category names and product images from product_service_id -> products -> product_categories
                        category_map = {}
                        product_ids = [item.get('product_service_id') for item in quote_items if item.get('product_service_id')]
                        if product_ids:
                            try:
                                # Get products with their category_id, image_url, and image_urls
                                products_result = supabase.table("products").select("id, category_id, image_url, image_urls").in_("id", product_ids).execute()
                                if products_result.data:
                                    # Map product_id -> product data
                                    product_map = {p['id']: p for p in products_result.data}
                                    # Map product_id -> category_id
                                    product_category_map = {p['id']: p.get('category_id') for p in products_result.data if p.get('category_id')}
                                    # Get unique category_ids
                                    category_ids = list(set([cat_id for cat_id in product_category_map.values() if cat_id]))
                                    if category_ids:
                                        # Get category names
                                        categories_result = supabase.table("product_categories").select("id, name").in_("id", category_ids).execute()
                                        if categories_result.data:
                                            # Map category_id -> category_name
                                            category_map = {cat['id']: cat.get('name', '') for cat in categories_result.data}
                                    
                                    # Add category_name and product images to each item based on product_service_id
                                    for item in quote_items:
                                        product_id = item.get('product_service_id')
                                        if product_id and product_id in product_map:
                                            product = product_map[product_id]
                                            # Add category_name
                                            category_id = product.get('category_id')
                                            if category_id and category_id in category_map:
                                                item['category_name'] = category_map[category_id]
                                            # Add product images
                                            if product.get('image_url'):
                                                item['product_image_url'] = product.get('image_url')
                                            if product.get('image_urls'):
                                                item['product_image_urls'] = product.get('image_urls')
                            except Exception as e:
                                print(f"Error fetching category names and product images from product_service_id: {e}")
                                pass
                        
                        # Fallback: if category_name not set, try to get from product_category_id (backward compatibility)
                        for item in quote_items:
                            if not item.get('category_name') and item.get('product_category_id'):
                                # Try to get from product_category_id if not already set
                                if item.get('product_category_id') not in category_map:
                                    try:
                                        cat_result = supabase.table("product_categories").select("name").eq("id", item.get('product_category_id')).single().execute()
                                        if cat_result.data:
                                            category_map[item.get('product_category_id')] = cat_result.data.get('name', '')
                                    except Exception:
                                        pass
                                if item.get('product_category_id') in category_map:
                                    item['category_name'] = category_map[item.get('product_category_id')]
                        
                        # Get employee in charge from created_by -> employees -> users
                        employee_name = None
                        employee_phone = None
                        emp_id = quote_result.data[0].get("employee_in_charge_id") or quote_result.data[0].get("created_by")
                        if emp_id:
                            try:
                                # Step 1: Get employee info including user_id
                                emp_res = supabase.table("employees").select("id, user_id, first_name, last_name, phone").eq("id", emp_id).single().execute()
                                if emp_res.data:
                                    emp = emp_res.data
                                    employee_phone = emp.get("phone")
                                    # Candidate name from employees table (first_name + last_name)
                                    candidate_name = f"{emp.get('first_name','')} {emp.get('last_name','')}".strip()
                                    
                                    # Step 2: Prefer users.full_name if available
                                    user_id = emp.get("user_id")
                                    if user_id:
                                        try:
                                            user_res = supabase.table("users").select("full_name").eq("id", user_id).single().execute()
                                            if user_res.data and user_res.data.get("full_name"):
                                                employee_name = user_res.data.get("full_name")
                                            else:
                                                employee_name = candidate_name
                                        except Exception:
                                            employee_name = candidate_name
                                    else:
                                        employee_name = candidate_name
                            except Exception as e:
                                print(f"Error fetching employee info: {e}")
                                pass
                        
                        # Prepare custom content: load from email_customizations (active), then fallback to request body
                        custom_payment_terms = None
                        additional_notes = None
                        default_notes = None
                        company_info = {}
                        bank_info = {}
                        
                        try:
                            # Load active customization from email_customizations
                            customization_res = (
                                supabase
                                .table("email_customizations")
                                .select("*")
                                .eq("quote_id", quote_id)
                                .eq("is_active", True)
                                .order("version", desc=True)
                                .limit(1)
                                .execute()
                            )
                            
                            if customization_res.data and len(customization_res.data) > 0:
                                customization = customization_res.data[0]
                                
                                # Payment terms
                                cpt = customization.get("custom_payment_terms")
                                if isinstance(cpt, str):
                                    try:
                                        import json as _json
                                        cpt = _json.loads(cpt)
                                    except Exception:
                                        pass
                                if cpt is not None:
                                    custom_payment_terms = cpt if isinstance(cpt, list) else None
                                
                                # Additional notes
                                if customization.get("additional_notes") is not None:
                                    additional_notes = customization.get("additional_notes")
                                
                                # Default notes (GHI CHÚ section) - load from company_info JSONB
                                if customization.get("company_info"):
                                    ci = customization.get("company_info")
                                    if isinstance(ci, str):
                                        try:
                                            import json as _json
                                            ci = _json.loads(ci)
                                        except Exception:
                                            pass
                                    if isinstance(ci, dict):
                                        dn = ci.get("default_notes")
                                        if dn and isinstance(dn, list):
                                            default_notes = dn
                                
                                # Company info
                                if customization.get("company_name"):
                                    company_info["company_name"] = customization.get("company_name")
                                if customization.get("company_showroom"):
                                    company_info["company_showroom"] = customization.get("company_showroom")
                                if customization.get("company_factory"):
                                    company_info["company_factory"] = customization.get("company_factory")
                                if customization.get("company_website"):
                                    company_info["company_website"] = customization.get("company_website")
                                if customization.get("company_hotline"):
                                    company_info["company_hotline"] = customization.get("company_hotline")
                                if customization.get("company_logo_url"):
                                    company_info["company_logo_url"] = customization.get("company_logo_url")
                                if customization.get("company_logo_base64"):
                                    company_info["company_logo_base64"] = customization.get("company_logo_base64")
                                if customization.get("company_info"):
                                    ci = customization.get("company_info")
                                    if isinstance(ci, str):
                                        try:
                                            import json as _json
                                            ci = _json.loads(ci)
                                        except Exception:
                                            pass
                                    if isinstance(ci, dict):
                                        company_info.update(ci)
                                
                                # Bank info
                                if customization.get("bank_account_name"):
                                    bank_info["bank_account_name"] = customization.get("bank_account_name")
                                if customization.get("bank_account_number"):
                                    bank_info["bank_account_number"] = customization.get("bank_account_number")
                                if customization.get("bank_name"):
                                    bank_info["bank_name"] = customization.get("bank_name")
                                if customization.get("bank_branch"):
                                    bank_info["bank_branch"] = customization.get("bank_branch")
                                if customization.get("bank_account_info"):
                                    bi = customization.get("bank_account_info")
                                    if isinstance(bi, str):
                                        try:
                                            import json as _json
                                            bi = _json.loads(bi)
                                        except Exception:
                                            pass
                                    if isinstance(bi, dict):
                                        bank_info.update(bi)
                            
                            # Fallback to request body if not found in email_customizations
                            if custom_payment_terms is None and request and request.custom_payment_terms:
                                custom_payment_terms = request.custom_payment_terms
                            
                            if additional_notes is None and request and request.additional_notes and request.additional_notes.strip():
                                additional_notes = request.additional_notes
                            
                            # Fallback to quotes.notes if not found in customization or request
                            if additional_notes is None and quote_data.get('notes'):
                                additional_notes = quote_data.get('notes')
                                print(f"📝 Using notes from quotes.notes: {additional_notes[:100] if additional_notes else 'None'}...")
                            
                            if default_notes is None and request and request.default_notes:
                                default_notes = request.default_notes
                            
                            # Override with request company info if provided
                            if request:
                                if request.company_name is not None:
                                    company_info["company_name"] = request.company_name
                                if request.company_showroom is not None:
                                    company_info["company_showroom"] = request.company_showroom
                                if request.company_factory is not None:
                                    company_info["company_factory"] = request.company_factory
                                if request.company_website is not None:
                                    company_info["company_website"] = request.company_website
                                if request.company_hotline is not None:
                                    company_info["company_hotline"] = request.company_hotline
                                if request.company_logo_url is not None:
                                    company_info["company_logo_url"] = request.company_logo_url
                                if request.company_logo_base64 is not None:
                                    company_info["company_logo_base64"] = request.company_logo_base64
                                if request.company_info is not None:
                                    if isinstance(request.company_info, dict):
                                        company_info.update(request.company_info)
                                
                                # Override with request bank info if provided
                                if request.bank_account_name is not None:
                                    bank_info["bank_account_name"] = request.bank_account_name
                                if request.bank_account_number is not None:
                                    bank_info["bank_account_number"] = request.bank_account_number
                                if request.bank_name is not None:
                                    bank_info["bank_name"] = request.bank_name
                                if request.bank_branch is not None:
                                    bank_info["bank_branch"] = request.bank_branch
                                if request.bank_account_info is not None:
                                    if isinstance(request.bank_account_info, dict):
                                        bank_info.update(request.bank_account_info)
                                
                        except Exception as _e:
                            print(f"⚠️ Error loading email customizations from email_customizations: {_e}")
                            import traceback
                            traceback.print_exc()
                            # Fallback to request body on error
                            if request:
                                if custom_payment_terms is None:
                                    custom_payment_terms = request.custom_payment_terms if request.custom_payment_terms else None
                                if additional_notes is None:
                                    additional_notes = request.additional_notes if (request.additional_notes and request.additional_notes.strip()) else None

                        print(f"📧 Final email customizations - payment_terms: {custom_payment_terms}, additional_notes: {additional_notes}, company_info: {company_info}, bank_info: {bank_info}")
                        
                        # Build quote data with customization info
                        quote_data_with_custom = {
                                **quote_result.data[0],
                                **({"project_name": project_name} if project_name else {}),
                                **({"employee_in_charge_name": employee_name} if employee_name else {}),
                                **({"employee_in_charge_phone": employee_phone} if employee_phone else {})
                        }
                        
                        # Determine final HTML: priority: request.raw_html > customization.raw_html > generated HTML
                        final_html = None
                        if request and request.raw_html:
                            # Use raw_html from request (highest priority)
                            final_html = request.raw_html
                            print(f"📝 Using raw_html from request")
                        elif customization and customization.get("raw_html"):
                            # Use raw_html from email_customizations table
                            final_html = customization.get("raw_html")
                            print(f"📝 Using raw_html from email_customizations table")
                        else:
                            # Generate HTML with customization data
                            if not email_service:
                                raise HTTPException(
                                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                    detail="Email service is temporarily disabled"
                                )
                            final_html = email_service.generate_quote_email_html(
                                quote_data=quote_data_with_custom,
                                customer_name=customer_name,
                                employee_name=employee_name,
                                employee_phone=employee_phone,
                                quote_items=quote_items,
                                custom_payment_terms=custom_payment_terms,
                                additional_notes=additional_notes,
                                company_info=company_info if company_info else None,
                                bank_info=bank_info if bank_info else None,
                                default_notes=default_notes
                            )
                            print(f"📝 Generated HTML from template")
                        
                        # Prepare attachments from request
                        attachments_list = None
                        if request and request.attachments:
                            # Convert AttachmentItem to dict format
                            attachments_list = [
                                {
                                    'name': att.name,
                                    'content': att.content,
                                    'mimeType': att.mimeType
                                }
                                for att in request.attachments
                            ]
                        
                        if email_service:
                            background_tasks.add_task(
                                email_service.send_quote_email,
                                quote_data_with_custom,
                                customer_email,
                                customer_name,
                                quote_items,
                                custom_payment_terms,
                                additional_notes,
                                final_html,
                                company_info if company_info else None,
                                bank_info if bank_info else None,
                                default_notes,
                                attachments_list
                            )
                        else:
                            print(f"⚠️ Email service disabled - skipping quote email to {customer_email}")
                        
                        # Save email log with custom content
                        try:
                            log_data = {
                                "to_email": customer_email,
                                "subject": f"Báo giá {quote_result.data[0].get('quote_number', '')} - {customer_name}",
                                # Save the exact HTML if provided, else a short note
                                "body": final_html if final_html else f"Email báo giá cho quote {quote_id}",
                                "status": "sent",
                                "entity_type": "quote",
                                "entity_id": quote_id,
                                "sent_at": datetime.utcnow().isoformat(),
                                "edited_at": datetime.utcnow().isoformat(),
                                "edited_by": current_user.id
                            }
                            
                            # Always save custom_payment_terms (even if null/empty) - loaded from email_logs or request
                            if custom_payment_terms is not None:
                                # Convert Pydantic models to dict for JSONB storage
                                try:
                                    payment_terms_list = []
                                    for term in custom_payment_terms:
                                        if hasattr(term, 'model_dump'):
                                            payment_terms_list.append(term.model_dump())
                                        elif hasattr(term, 'dict'):
                                            payment_terms_list.append(term.dict())
                                        elif isinstance(term, dict):
                                            payment_terms_list.append(term)
                                        else:
                                            payment_terms_list.append({
                                                "description": getattr(term, 'description', ''),
                                                "amount": getattr(term, 'amount', ''),
                                                "received": getattr(term, 'received', False)
                                            })
                                    log_data["custom_payment_terms"] = payment_terms_list
                                    print(f"✅ Saved custom_payment_terms: {payment_terms_list}")
                                except Exception as e:
                                    print(f"❌ Error converting payment terms: {e}")
                                    import traceback
                                    traceback.print_exc()
                            else:
                                # Explicitly set to null if not found
                                log_data["custom_payment_terms"] = None
                                print(f"📝 Saved custom_payment_terms as null (not found in email_logs or request)")
                            
                            # Always save additional_notes (even if null/empty) - loaded from email_logs or request
                            if additional_notes is not None:
                                log_data["additional_notes"] = additional_notes
                                print(f"✅ Saved additional_notes: {additional_notes}")
                            else:
                                # Explicitly set to null if not found
                                log_data["additional_notes"] = None
                                print(f"📝 Saved additional_notes as null (not found in email_logs or request)")
                            
                            print(f"📝 Saving email log with data: {log_data}")
                            supabase.table("email_logs").insert(log_data).execute()
                            print("✅ Email log saved successfully")
                        except Exception as log_error:
                            print(f"Failed to save email log: {log_error}")
                        email_sent = True
                        print(f"Quote email queued for {customer_email}")
                    except Exception as e:
                        email_error = str(e)
                        print(f"Failed to queue email: {e}")
                else:
                    email_error = "Customer email not found"
                    print("Customer email not found, skipping email send")
            else:
                email_error = "Customer not found"
                print("Customer not found, skipping email send")
            
            # Create notification for quote sent
            if result.data:
                quote = result.data[0]
                created_by = quote.get("created_by")
                if created_by:
                    await notification_service.create_quote_sent_notification(quote, created_by)
            
            return {
                "message": "Quote sent successfully",
                "quote": result.data[0],
                "email_sent": email_sent,
                "email_error": email_error,
                "customer_email": customer_result.data[0].get("email") if customer_result.data else None
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to send quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send quote: {str(e)}"
        )

@router.post("/quotes/{quote_id}/approve")
async def approve_quote(
    quote_id: str,
    current_user: User = Depends(require_permission(Permission.APPROVE_QUOTE))
):
    """Approve a quote (requires APPROVE_QUOTE permission)"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Check if quote can be approved
        if quote["status"] not in ["draft", "sent", "viewed"]:
            raise HTTPException(
                status_code=400,
                detail="Quote cannot be approved in current status"
            )
        
        # Update quote status to approved
        update_data = {
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": current_user.id,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
        
        if result.data:
            return {
                "message": "Quote approved successfully",
                "quote": result.data[0]
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to approve quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve quote: {str(e)}"
        )

@router.post("/quotes/{quote_id}/accept")
async def accept_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Accept a quote (can be used by customer or staff)"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Check if quote is still valid
        if quote["status"] not in ["sent", "viewed"]:
            raise HTTPException(
                status_code=400,
                detail="Quote cannot be accepted in current status"
            )
        
        # Update quote status
        update_data = {
            "status": "accepted",
            "accepted_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
        
        if result.data:
            return {
                "message": "Quote accepted successfully",
                "quote": result.data[0]
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to accept quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to accept quote: {str(e)}"
        )

@router.post("/quotes/{quote_id}/convert-to-invoice")
async def convert_quote_to_invoice(
    quote_id: str,
    convert_data: Optional[QuoteConvertToInvoice] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Convert a quote to an invoice"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Check if quote can be converted
        if quote["status"] not in ["accepted", "sent", "viewed"]:
            raise HTTPException(
                status_code=400,
                detail="Quote must be accepted before conversion"
            )
        
        # Generate invoice number if not provided
        if convert_data and convert_data.invoice_number:
            invoice_number = convert_data.invoice_number
        else:
            invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate due date
        due_days = convert_data.due_days if convert_data else 30
        due_date = (datetime.now() + timedelta(days=due_days)).date()
        
        # Get quote items from quote_items table
        quote_items_result = supabase.table("quote_items").select("*").eq("quote_id", quote_id).execute()
        quote_items = quote_items_result.data if quote_items_result.data else []
        
        # Convert quote items to invoice items
        converted_items = []
        
        for item in quote_items:
            # Get product_components from quote_item (copy to invoice_item, not to invoice table)
            product_components = item.get("product_components")
            if not product_components or not isinstance(product_components, list):
                product_components = []
            
            # Create new invoice item from quote item
            invoice_item = {
                "id": str(uuid.uuid4()),
                "invoice_id": "",  # Will be set after invoice creation
                "product_service_id": item.get("product_service_id"),
                "description": item.get("description", ""),
                "quantity": item.get("quantity", 0),
                "unit_price": item.get("unit_price", 0),
                "total_price": item.get("total_price", 0),
                "name_product": item.get("name_product"),
                "unit": item.get("unit"),
                "tax_rate": item.get("tax_rate", quote.get("tax_rate", 10.0)),  # Copy tax_rate from quote_item or use quote default
                "discount_rate": item.get("discount_rate", 0.0),
                "area": item.get("area"),
                "volume": item.get("volume"),
                "height": item.get("height"),
                "length": item.get("length"),
                "depth": item.get("depth"),
                "product_components": product_components,  # Copy product_components to invoice_item
                "created_at": datetime.utcnow().isoformat()
            }
            converted_items.append(invoice_item)
        
        # Create invoice from quote
        invoice_id = str(uuid.uuid4())
        invoice_data = {
            "id": invoice_id,
            "invoice_number": invoice_number,
            "customer_id": quote["customer_id"],
            "project_id": quote["project_id"],
            "quote_id": quote_id,
            "issue_date": datetime.now().date().isoformat(),
            "due_date": due_date.isoformat(),
            "subtotal": quote["subtotal"],
            "tax_rate": quote["tax_rate"],
            "tax_amount": quote["tax_amount"],
            "total_amount": quote["total_amount"],
            "currency": quote["currency"],
            "status": "draft",
            "payment_status": "pending",
            "paid_amount": 0.0,
            "items": [],  # Empty JSONB field, items will be in invoice_items table
            "notes": f"Hóa đơn được tạo từ báo giá {quote.get('quote_number', 'N/A')}",
            "terms_and_conditions": quote.get("terms_and_conditions"),
            "payment_terms": convert_data.payment_terms if convert_data else None,
            "created_by": current_user.id,
            "employee_in_charge_id": quote.get("employee_in_charge_id") or quote.get("created_by"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert invoice
        invoice_result = supabase.table("invoices").insert(invoice_data).execute()
        
        if invoice_result.data:
            # Create invoice items in invoice_items table
            if converted_items:
                # Update invoice_id for all converted items
                for item in converted_items:
                    item["invoice_id"] = invoice_id
                
                # Insert invoice items
                invoice_items_result = supabase.table("invoice_items").insert(converted_items).execute()
                
                if not invoice_items_result.data:
                    # If invoice items creation failed, we should handle this
                    print(f"Warning: Failed to create invoice items for invoice {invoice_id}")
            
            # Update quote status to closed
            supabase.table("quotes").update({
                "status": "closed",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", quote_id).execute()
            
            return {
                "message": "Quote converted to invoice successfully",
                "invoice": invoice_result.data[0],
                "quote": quote_result.data[0],
                "converted_items": {
                    "count": len(converted_items),
                    "items": converted_items,
                    "total_amount": sum(item.get("total_price", 0) for item in converted_items)
                }
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to convert quote to invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert quote: {str(e)}"
        )

# ============================================================================
# INVOICES MANAGEMENT - Hóa đơn
# ============================================================================

@router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    invoice_type: Optional[str] = Query(None),
    overdue_only: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Get all invoices with optional filtering. Only shows invoices for projects where user is in project_team, except for admin and accountant who see all invoices."""
    try:
        supabase = get_supabase_client()
        
        # Get accessible project_ids for current user
        accessible_project_ids = get_user_accessible_project_ids(supabase, current_user)
        
        query = supabase.table("invoices").select("""
            *,
            customers!invoices_customer_id_fkey(id, name, email, phone, company),
            projects!invoices_project_id_fkey(id, name, project_code)
        """)
        
        # Filter by accessible projects if user is not admin/accountant
        if accessible_project_ids is not None:  # None means all projects (admin/accountant)
            if not accessible_project_ids:
                # User has no access to any projects - only show invoices with NULL project_id
                query = query.is_("project_id", "null")
            else:
                # Filter invoices to only show invoices for projects user has access to
                # Also include invoices with NULL project_id (invoices not linked to any project)
                # First filter by project_ids, then we'll add NULL project_id in post-processing
                query = query.in_("project_id", accessible_project_ids)
        
        # Apply filters
        if search:
            query = query.or_(f"invoice_number.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        if payment_status:
            query = query.eq("payment_status", payment_status)
        
        if invoice_type:
            query = query.eq("invoice_type", invoice_type)
        
        if overdue_only:
            today = datetime.now().date().isoformat()
            query = query.lt("due_date", today).neq("payment_status", "paid")
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        # If user is not admin/accountant and has accessible projects,
        # also include invoices with NULL project_id
        if accessible_project_ids is not None and accessible_project_ids:
            null_invoices_query = supabase.table("invoices").select("*").is_("project_id", "null")
            if search:
                null_invoices_query = null_invoices_query.or_(f"invoice_number.ilike.%{search}%")
            if customer_id:
                null_invoices_query = null_invoices_query.eq("customer_id", customer_id)
            if status:
                null_invoices_query = null_invoices_query.eq("status", status)
            if payment_status:
                null_invoices_query = null_invoices_query.eq("payment_status", payment_status)
            if invoice_type:
                null_invoices_query = null_invoices_query.eq("invoice_type", invoice_type)
            if overdue_only:
                today = datetime.now().date().isoformat()
                null_invoices_query = null_invoices_query.lt("due_date", today).neq("payment_status", "paid")
            null_invoices_result = null_invoices_query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
            
            # Combine results and remove duplicates
            all_invoices = (result.data or []) + (null_invoices_result.data or [])
            # Remove duplicates by id
            seen_ids = set()
            unique_invoices = []
            for invoice in all_invoices:
                if invoice.get('id') not in seen_ids:
                    seen_ids.add(invoice.get('id'))
                    unique_invoices.append(invoice)
            result.data = unique_invoices
        
        return [Invoice(**invoice) for invoice in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch invoices: {str(e)}"
        )

@router.get("/variance")
async def get_variance_data(
    current_user: User = Depends(get_current_user)
):
    """Get variance data between quotes and invoices with customer and project names"""
    try:
        supabase = get_supabase_client()
        
        # Get quotes with customer and project names
        quotes_result = supabase.table("quotes").select("""
            id, project_id, customer_id, total_amount, created_at,
            customers!quotes_customer_id_fkey(name),
            projects!quotes_project_id_fkey(name, description)
        """).execute()
        
        # Get invoices with customer and project names  
        invoices_result = supabase.table("invoices").select("""
            id, project_id, customer_id, total_amount, created_at,
            customers!invoices_customer_id_fkey(name),
            projects!invoices_project_id_fkey(name, description)
        """).execute()
        
        return {
            "quotes": quotes_result.data or [],
            "invoices": invoices_result.data or []
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch variance data: {str(e)}"
        )

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific invoice by ID. Only accessible if user is in project_team for that project, except for admin and accountant."""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("invoices").select("""
            *,
            *,
            customers!invoices_customer_id_fkey(id, name, email, phone, company),
            projects!invoices_project_id_fkey(id, name, project_code),
            invoice_items(*),
            payments(*)
        """).eq("id", invoice_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found"
            )
        
        invoice = result.data[0]
        project_id = invoice.get("project_id")
        
        # Check if user has access to this project
        if not check_user_has_project_access(supabase, current_user, project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this invoice"
            )
        
        # Get invoice items with product information (category, images, etc.)
        invoice_items_with_products = await quote_service.get_invoice_items_with_categories(invoice_id)
        
        # Replace invoice_items in the response with enriched items
        invoice["invoice_items"] = invoice_items_with_products
        
        return Invoice(**invoice)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch invoice: {str(e)}"
        )

@router.post("/invoices", response_model=Invoice)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new invoice"""
    try:
        supabase = get_supabase_client()
        
        # Check if invoice number already exists
        existing = supabase.table("invoices").select("id").eq("invoice_number", invoice_data.invoice_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="Invoice number already exists"
            )
        
        # Calculate amounts
        tax_amount = invoice_data.subtotal * (invoice_data.tax_rate / 100)
        discount_amount = getattr(invoice_data, 'discount_amount', 0.0)
        total_amount = invoice_data.subtotal + tax_amount - discount_amount
        
        # Create invoice record
        invoice_dict = invoice_data.dict()
        invoice_dict["id"] = str(uuid.uuid4())
        invoice_dict["tax_amount"] = tax_amount
        invoice_dict["total_amount"] = total_amount
        invoice_dict["created_by"] = None  # Allow null for testing
        invoice_dict["created_at"] = datetime.utcnow().isoformat()
        invoice_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert date objects to strings for JSON serialization
        if 'issue_date' in invoice_dict and isinstance(invoice_dict['issue_date'], date):
            invoice_dict['issue_date'] = invoice_dict['issue_date'].isoformat()
        if 'due_date' in invoice_dict and isinstance(invoice_dict['due_date'], date):
            invoice_dict['due_date'] = invoice_dict['due_date'].isoformat()
        
        # Set up recurring invoice
        is_recurring = getattr(invoice_data, 'is_recurring', False)
        recurring_frequency = getattr(invoice_data, 'recurring_frequency', None)
        if is_recurring and recurring_frequency:
            if recurring_frequency == "monthly":
                next_date = invoice_data.issue_date.replace(month=invoice_data.issue_date.month + 1)
            elif recurring_frequency == "quarterly":
                next_date = invoice_data.issue_date.replace(month=invoice_data.issue_date.month + 3)
            elif recurring_frequency == "yearly":
                next_date = invoice_data.issue_date.replace(year=invoice_data.issue_date.year + 1)
            
            invoice_dict["next_recurring_date"] = next_date.isoformat()
        
        result = supabase.table("invoices").insert(invoice_dict).execute()
        
        if result.data:
            return Invoice(**result.data[0])
        
        raise HTTPException(
            status_code=400,
            detail="Failed to create invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create invoice: {str(e)}"
        )

@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    force: bool = Query(False, description="Force delete even if related payments/allocations exist"),
    current_user: User = Depends(require_manager_or_admin)
):
    """Delete an invoice and its items. Prevent delete if payments/allocations exist (unless force=true)."""
    try:
        supabase = get_supabase_client()

        # Ensure invoice exists
        inv_res = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not inv_res.data:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Check for related payments or allocations if such tables exist
        has_blocking_refs = False
        try:
            payments_ref = supabase.table("payments").select("id").eq("invoice_id", invoice_id).limit(1).execute()
            if payments_ref.data:
                has_blocking_refs = True
        except Exception:
            # payments may be allocated via another table; ignore if table/column not present
            pass

        if has_blocking_refs and not force:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete invoice because payments/allocations reference it. Set force=true to override."
            )

        # Delete invoice_items first
        try:
            supabase.table("invoice_items").delete().eq("invoice_id", invoice_id).execute()
        except Exception:
            # Table may not exist in some setups; continue
            pass

        # Delete the invoice
        del_res = supabase.table("invoices").delete().eq("id", invoice_id).execute()
        if del_res.data is None:
            verify = supabase.table("invoices").select("id").eq("id", invoice_id).execute()
            if verify.data:
                raise HTTPException(status_code=400, detail="Failed to delete invoice")

        return {"message": "Invoice deleted successfully", "invoice_id": invoice_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")

@router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update an invoice"""
    try:
        supabase = get_supabase_client()
        
        # Check if invoice exists
        existing = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in invoice_data.dict().items() if v is not None}
        
        # Handle empty string UUIDs - convert to None
        if 'project_id' in update_dict and update_dict['project_id'] == '':
            update_dict['project_id'] = None
        if 'customer_id' in update_dict and update_dict['customer_id'] == '':
            update_dict['customer_id'] = None
        if 'quote_id' in update_dict and update_dict['quote_id'] == '':
            update_dict['quote_id'] = None
        
        # Convert date objects to strings for JSON serialization
        if 'issue_date' in update_dict and isinstance(update_dict['issue_date'], date):
            update_dict['issue_date'] = update_dict['issue_date'].isoformat()
        if 'due_date' in update_dict and isinstance(update_dict['due_date'], date):
            update_dict['due_date'] = update_dict['due_date'].isoformat()
        
        # Recalculate totals if needed
        if any(field in update_dict for field in ["subtotal", "tax_rate", "discount_amount"]):
            current_invoice = existing.data[0]
            subtotal = update_dict.get("subtotal", current_invoice["subtotal"])
            tax_rate = update_dict.get("tax_rate", current_invoice["tax_rate"])
            discount_amount = update_dict.get("discount_amount", current_invoice["discount_amount"])
            
            tax_amount = subtotal * (tax_rate / 100)
            total_amount = subtotal + tax_amount - discount_amount
            
            update_dict["tax_amount"] = tax_amount
            update_dict["total_amount"] = total_amount
        
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("invoices").update(update_dict).eq("id", invoice_id).execute()
        
        if result.data:
            return Invoice(**result.data[0])
        
        raise HTTPException(
            status_code=400,
            detail="Failed to update invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update invoice: {str(e)}"
        )

@router.post("/invoices/{invoice_id}/send")
async def send_invoice_to_customer(
    invoice_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send invoice to customer via email and create journal entries"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not invoice_result.data:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found"
            )
        
        invoice_data = invoice_result.data[0]
        
        # Check if invoice is already sent
        if invoice_data["status"] == "sent":
            raise HTTPException(
                status_code=400,
                detail="Invoice already sent"
            )
        
        # Update invoice status to sent
        update_data = {
            "status": "sent",
            "sent_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        if result.data:
            # Create journal entry for invoice (double-entry accounting)
            try:
                journal_entry = await journal_service.create_invoice_journal_entry(
                    invoice_data, 
                    current_user.id
                )
                print(f"✅ Created journal entry {journal_entry.entry_number} for invoice {invoice_data['invoice_number']}")
            except Exception as journal_error:
                print(f"⚠️ Warning: Failed to create journal entry: {journal_error}")
                # Don't fail the invoice sending if journal entry creation fails
                # This ensures business continuity
            
            # TODO: Add email sending functionality
            # background_tasks.add_task(send_invoice_email, invoice_data, customer_email)
            
            return {
                "message": "Invoice sent successfully",
                "invoice": result.data[0],
                "journal_entry_created": True
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to send invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invoice: {str(e)}"
        )

# ============================================================================
# PAYMENTS MANAGEMENT - Ghi nhận thanh toán
# ============================================================================

@router.get("/payments", response_model=List[Payment])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all payments with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("payments").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"payment_number.ilike.%{search}%,payment_reference.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [Payment(**payment) for payment in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch payments: {str(e)}"
        )

# PAYMENT METHODS - Phương thức thanh toán theo dự án
# ============================================================================

@router.get("/payment-methods/projects")
async def get_projects_with_payment_info(
    current_user: User = Depends(get_current_user)
):
    """Get all projects with payment status and summary"""
    try:
        supabase = get_supabase_client()
        
        # Get accessible project_ids for current user
        accessible_project_ids = get_user_accessible_project_ids(supabase, current_user)
        
        # Get all projects (filtered by access)
        projects_query = supabase.table("projects").select("id, name, project_code, customer_id, customers!projects_customer_id_fkey(name)")
        
        if accessible_project_ids is not None:
            if not accessible_project_ids:
                return []
            projects_query = projects_query.in_("id", accessible_project_ids)
        
        projects_result = projects_query.execute()
        
        if not projects_result.data:
            return []
        
        # For each project, get invoices and calculate payment info
        projects_with_payments = []
        for project in projects_result.data:
            project_id = project["id"]
            
            # Get all invoices for this project
            invoices_result = supabase.table("invoices").select(
                "id, invoice_number, total_amount, paid_amount, payment_status"
            ).eq("project_id", project_id).execute()
            
            invoices = invoices_result.data or []
            
            # Calculate totals
            total_invoice_amount = sum(float(inv.get("total_amount", 0)) for inv in invoices)
            paid_amount = sum(float(inv.get("paid_amount", 0)) for inv in invoices)
            remaining_amount = total_invoice_amount - paid_amount
            
            # Determine payment status
            if len(invoices) == 0:
                payment_status = "pending"
            elif remaining_amount <= 0:
                payment_status = "paid"
            elif paid_amount > 0:
                payment_status = "partial"
            else:
                payment_status = "pending"
            
            # Get payments count for all invoices in this project
            all_payment_ids = set()
            for invoice in invoices:
                invoice_payments = supabase.table("payments").select("id").eq("invoice_id", invoice["id"]).execute()
                if invoice_payments.data:
                    all_payment_ids.update(p["id"] for p in invoice_payments.data)
            payments_count = len(all_payment_ids)
            
            projects_with_payments.append({
                "id": project_id,
                "name": project.get("name", ""),
                "project_code": project.get("project_code"),
                "customer_id": project.get("customer_id"),
                "customer_name": project.get("customers", {}).get("name") if project.get("customers") else None,
                "total_invoice_amount": total_invoice_amount,
                "paid_amount": paid_amount,
                "remaining_amount": remaining_amount,
                "payment_status": payment_status,
                "invoices_count": len(invoices),
                "payments_count": payments_count
            })
        
        return projects_with_payments
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch projects with payment info: {str(e)}"
        )

@router.get("/payment-methods/projects/{project_id}/payments")
async def get_project_payments(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get payment history for a specific project"""
    try:
        supabase = get_supabase_client()
        
        # Verify user has access to this project
        accessible_project_ids = get_user_accessible_project_ids(supabase, current_user)
        if accessible_project_ids is not None:
            if project_id not in accessible_project_ids:
                raise HTTPException(status_code=403, detail="Access denied to this project")
        
        # Get all invoices for this project
        invoices_result = supabase.table("invoices").select("id, invoice_number").eq("project_id", project_id).execute()
        
        if not invoices_result.data:
            return []
        
        invoice_ids = [inv["id"] for inv in invoices_result.data]
        invoice_map = {inv["id"]: inv["invoice_number"] for inv in invoices_result.data}
        
        # Get all payments for these invoices
        all_payments = []
        for invoice_id in invoice_ids:
            payments_result = supabase.table("payments").select(
                "id, payment_number, payment_date, amount, payment_method, reference_number, notes, invoice_id"
            ).eq("invoice_id", invoice_id).order("payment_date", desc=True).execute()
            
            if payments_result.data:
                for payment in payments_result.data:
                    payment["invoice_number"] = invoice_map.get(payment["invoice_id"])
                    all_payments.append(payment)
        
        # Sort by payment_date descending
        all_payments.sort(key=lambda x: x.get("payment_date", ""), reverse=True)
        
        return all_payments
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project payments: {str(e)}"
        )

@router.get("/payment-methods/projects/{project_id}/invoices")
async def get_project_invoices(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all invoices for a specific project"""
    try:
        supabase = get_supabase_client()
        
        # Verify user has access to this project
        accessible_project_ids = get_user_accessible_project_ids(supabase, current_user)
        if accessible_project_ids is not None:
            if project_id not in accessible_project_ids:
                raise HTTPException(status_code=403, detail="Access denied to this project")
        
        # Get all invoices for this project
        invoices_result = supabase.table("invoices").select(
            "id, invoice_number, total_amount, paid_amount, payment_status, issue_date, due_date"
        ).eq("project_id", project_id).order("issue_date", desc=True).execute()
        
        return invoices_result.data or []
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project invoices: {str(e)}"
        )

@router.post("/payments", response_model=Payment)
async def create_payment(
    payment_data: PaymentWithAllocations,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new payment and allocate to invoices"""
    try:
        supabase = get_supabase_client()
        
        # Validate total allocation
        total_allocated = sum(allocation.allocated_amount for allocation in payment_data.allocations)
        if abs(total_allocated - payment_data.payment.amount) > 0.01:
            raise HTTPException(
                status_code=400,
                detail="Total allocated amount must equal payment amount"
            )
        
        # Create payment record
        payment_dict = payment_data.payment.dict()
        payment_dict["id"] = str(uuid.uuid4())
        payment_dict["created_by"] = current_user.id
        payment_dict["status"] = "completed"
        payment_dict["processed_by"] = current_user.id
        payment_dict["processed_at"] = datetime.utcnow().isoformat()
        payment_dict["created_at"] = datetime.utcnow().isoformat()
        payment_dict["updated_at"] = datetime.utcnow().isoformat()
        
        payment_result = supabase.table("payments").insert(payment_dict).execute()
        
        if not payment_result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create payment"
            )
        
        # Update each invoice
        for allocation in payment_data.allocations:
            invoice_result = supabase.table("invoices").select("*").eq("id", allocation.invoice_id).execute()
            if not invoice_result.data:
                continue
            
            invoice = invoice_result.data[0]
            current_paid = invoice["paid_amount"]
            new_paid = current_paid + allocation.allocated_amount
            total_amount = invoice["total_amount"]
            
            # Determine payment status
            if new_paid >= total_amount:
                payment_status = "paid"
                invoice_status = "paid"
            elif new_paid > 0:
                payment_status = "partial"
                invoice_status = "sent"
            else:
                payment_status = "pending"
                invoice_status = "sent"
            
            # Update invoice
            update_data = {
                "paid_amount": new_paid,
                "payment_status": payment_status,
                "status": invoice_status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("invoices").update(update_data).eq("id", allocation.invoice_id).execute()
        
        # Create journal entry for payment (double-entry accounting)
        try:
            payment_dict = payment_result.data[0]
            journal_entry = await journal_service.create_payment_journal_entry(
                payment_dict, 
                current_user.id
            )
            print(f"✅ Created journal entry {journal_entry.entry_number} for payment {payment_dict['payment_number']}")
        except Exception as journal_error:
            print(f"⚠️ Warning: Failed to create journal entry: {journal_error}")
            # Don't fail the payment creation if journal entry creation fails
            # This ensures business continuity
        
        return Payment(**payment_result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create payment: {str(e)}"
        )

@router.put("/invoices/{invoice_id}/payment")
async def record_simple_payment(
    invoice_id: str,
    payment_amount: float,
    payment_method: str = "bank_transfer",
    payment_reference: Optional[str] = None,
    payment_date: Optional[str] = None,  # Accept ISO datetime string or date string
    notes: Optional[str] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Record a payment for an invoice and save to payment history with full details"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not invoice_result.data:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found"
            )
        
        invoice = invoice_result.data[0]
        current_paid = invoice.get("paid_amount", 0) or 0
        new_paid = current_paid + payment_amount
        total_amount = invoice["total_amount"]
        
        # Validate payment amount
        if new_paid > total_amount:
            raise HTTPException(
                status_code=400,
                detail="Payment amount exceeds invoice total"
            )
        
        # Determine payment status
        if new_paid >= total_amount:
            payment_status = "paid"
            invoice_status = "paid"
        elif new_paid > 0:
            payment_status = "partial"
            invoice_status = "sent"
        else:
            payment_status = "pending"
            invoice_status = "sent"
        
        # Create payment record with FULL information for payment history
        payment_number = f"PAY-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Parse payment_date: if provided as date string, combine with current time; if datetime string, use it; otherwise use now
        if payment_date:
            try:
                # Try parsing as datetime first
                payment_datetime = datetime.fromisoformat(payment_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                try:
                    # Try parsing as date and combine with current time
                    from datetime import date as date_type
                    payment_date_obj = datetime.strptime(payment_date, '%Y-%m-%d').date()
                    payment_datetime = datetime.combine(payment_date_obj, datetime.now().time())
                except (ValueError, AttributeError):
                    payment_datetime = datetime.now()
        else:
            payment_datetime = datetime.now()
        
        payment_data = {
            "id": str(uuid.uuid4()),
            "payment_number": payment_number,
            "invoice_id": invoice_id,  # IMPORTANT: Link payment to invoice for history
            "customer_id": invoice["customer_id"],
            "amount": float(payment_amount),
            "currency": invoice.get("currency", "VND"),
            "payment_date": payment_datetime.isoformat(),  # Now includes date and time (hour, minute, second)
            "payment_method": payment_method,
            "reference_number": payment_reference,  # Mã tham chiếu (VD: số giao dịch ngân hàng)
            "notes": notes,  # Ghi chú về thanh toán
            "status": "completed",  # Payment is completed when recorded
            "created_by": current_user.id,
            "processed_by": current_user.id,
            "processed_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert payment into payment history table
        payment_result = supabase.table("payments").insert(payment_data).execute()
        
        # Update invoice
        update_data = {
            "paid_amount": new_paid,
            "payment_status": payment_status,
            "status": invoice_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        invoice_result = supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        if invoice_result.data:
            # Create journal entry for payment (double-entry accounting)
            try:
                if payment_result.data:
                    journal_entry = await journal_service.create_payment_journal_entry(
                        payment_result.data[0], 
                        current_user.id
                    )
                    print(f"✅ Created journal entry {journal_entry.entry_number} for payment {payment_result.data[0]['payment_number']}")
            except Exception as journal_error:
                print(f"⚠️ Warning: Failed to create journal entry: {journal_error}")
                # Don't fail the payment recording if journal entry creation fails
                # This ensures business continuity
            
            return {
                "message": "Payment recorded successfully",
                "invoice": invoice_result.data[0],
                "payment": payment_result.data[0] if payment_result.data else None,
                "journal_entry_created": True
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to record payment"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record payment: {str(e)}"
        )

# ============================================================================
# JOURNAL ENTRIES MANAGEMENT - Bút toán kế toán
# ============================================================================

@router.get("/journal-entries")
async def get_journal_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    transaction_type: Optional[str] = Query(None),
    transaction_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get journal entries with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("journal_entries").select("*")
        
        # Apply filters
        if transaction_type:
            query = query.eq("transaction_type", transaction_type)
        
        if transaction_id:
            query = query.eq("transaction_id", transaction_id)
        
        # Apply pagination and ordering
        result = query.order("entry_date", desc=True).range(skip, skip + limit - 1).execute()
        
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journal entries: {str(e)}"
        )

@router.get("/journal-entries/{entry_id}")
async def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get journal entry with lines"""
    try:
        supabase = get_supabase_client()
        
        # Get journal entry
        entry_result = supabase.table("journal_entries").select("*").eq("id", entry_id).execute()
        if not entry_result.data:
            raise HTTPException(
                status_code=404,
                detail="Journal entry not found"
            )
        
        # Get journal entry lines
        lines_result = supabase.table("journal_entry_lines").select("*").eq("entry_id", entry_id).execute()
        
        entry = entry_result.data[0]
        entry["lines"] = lines_result.data
        
        return entry
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journal entry: {str(e)}"
        )

@router.post("/journal-entries/{entry_id}/reverse")
async def reverse_journal_entry(
    entry_id: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Reverse a journal entry"""
    try:
        reversing_entry = await journal_service.reverse_journal_entry(entry_id, current_user.id)
        
        return {
            "message": "Journal entry reversed successfully",
            "reversing_entry": reversing_entry
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reverse journal entry: {str(e)}"
        )

# ============================================================================
# SALES RECEIPTS MANAGEMENT - Phiếu bán hàng
# ============================================================================

@router.get("/sales-receipts", response_model=List[SalesReceipt])
async def get_sales_receipts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all sales receipts with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("sales_receipts").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"receipt_number.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        if payment_method:
            query = query.eq("payment_method", payment_method)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [SalesReceipt(**receipt) for receipt in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch sales receipts: {str(e)}"
        )

@router.post("/sales-receipts", response_model=SalesReceipt)
async def create_sales_receipt(
    receipt_data: SalesReceiptCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new sales receipt (for immediate sales with payment)"""
    try:
        supabase = get_supabase_client()
        
        # Check if receipt number already exists
        existing = supabase.table("sales_receipts").select("id").eq("receipt_number", receipt_data.receipt_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="Receipt number already exists"
            )
        
        # Calculate amounts
        tax_amount = receipt_data.subtotal * (receipt_data.tax_rate / 100)
        total_amount = receipt_data.subtotal + tax_amount
        
        # Create receipt record
        receipt_dict = receipt_data.dict()
        receipt_dict["id"] = str(uuid.uuid4())
        receipt_dict["tax_amount"] = tax_amount
        receipt_dict["total_amount"] = total_amount
        receipt_dict["status"] = "completed"
        receipt_dict["created_by"] = current_user.id
        receipt_dict["created_at"] = datetime.utcnow().isoformat()
        receipt_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("sales_receipts").insert(receipt_dict).execute()
        
        if result.data:
            return SalesReceipt(**result.data[0])
        
        raise HTTPException(
            status_code=400,
            detail="Failed to create sales receipt"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create sales receipt: {str(e)}"
        )

@router.get("/test")
async def test_sales_endpoint():
    """Test endpoint to verify sales router is working"""
    return {"message": "Sales router is working!", "status": "success"}


@router.post("/quotes/{quote_id}/test-email")
async def test_quote_email(
    quote_id: str,
    test_email: Optional[str] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Test endpoint to send quote email via n8n (for testing purposes)"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=404,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Get customer information
        customer_id = quote.get('customer_id')
        if not customer_id:
            raise HTTPException(
                status_code=400,
                detail="Quote has no customer assigned"
            )
        
        customer_result = supabase.table("customers").select("*").eq("id", customer_id).execute()
        if not customer_result.data:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )
        
        customer = customer_result.data[0]
        customer_email = test_email or customer.get('email')
        customer_name = customer.get('name', 'Khách hàng')
        
        if not customer_email:
            raise HTTPException(
                status_code=400,
                detail="Customer email is required. Provide test_email parameter or ensure customer has email."
            )
        
        # Get quote items
        quote_items_result = supabase.table("quote_items").select("*").eq("quote_id", quote_id).execute()
        quote_items = quote_items_result.data if quote_items_result.data else []
        
        # Prepare quote data
        quote_data = {
            **quote,
            'employee_in_charge_name': None,
            'employee_in_charge_phone': None,
            'employee_in_charge_id': quote.get('created_by')
        }
        
        # Get employee info if available
        if quote.get('created_by'):
            try:
                emp_result = supabase.table("employees").select("*, users!inner(full_name)").eq("user_id", quote.get('created_by')).execute()
                if emp_result.data:
                    emp = emp_result.data[0]
                    quote_data['employee_in_charge_name'] = emp.get('users', {}).get('full_name') if isinstance(emp.get('users'), dict) else None
                    quote_data['employee_in_charge_phone'] = emp.get('phone')
            except Exception:
                pass
        
        # Send test email via email service (will use n8n if configured)
        if not email_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Email service is temporarily disabled"
            )
        
        email_sent = await email_service.send_quote_email(
            quote_data=quote_data,
            customer_email=customer_email,
            customer_name=customer_name,
            quote_items=quote_items
        )
        
        if email_sent:
            return {
                "status": "success",
                "message": f"Test quote email sent successfully to {customer_email}",
                "email_provider": email_service.email_provider if email_service else "disabled",
                "quote_number": quote.get('quote_number'),
                "note": "This is a test email. Quote status was not changed."
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send test email to {customer_email}. Check email configuration."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Test email failed: {str(e)}"
        )

@router.get("/dashboard/stats")
async def get_sales_dashboard_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get sales dashboard statistics"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice statistics
        invoice_query = supabase.table("invoices").select("*")
        if start_date and end_date:
            invoice_query = invoice_query.gte("issue_date", start_date.isoformat()).lte("issue_date", end_date.isoformat())
        elif start_date:
            invoice_query = invoice_query.gte("issue_date", start_date.isoformat())
        elif end_date:
            invoice_query = invoice_query.lte("issue_date", end_date.isoformat())
        
        invoices = invoice_query.execute()
        
        # Calculate statistics
        total_revenue = sum(invoice["total_amount"] for invoice in invoices.data)
        paid_revenue = sum(invoice["paid_amount"] for invoice in invoices.data)
        pending_revenue = total_revenue - paid_revenue
        
        # Count invoices by status
        status_counts = {}
        for invoice in invoices.data:
            status = invoice["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count overdue invoices
        today = datetime.now().date()
        overdue_count = 0
        for invoice in invoices.data:
            if invoice["due_date"] and invoice["payment_status"] != "paid":
                due_date = datetime.fromisoformat(invoice["due_date"]).date()
                if due_date < today:
                    overdue_count += 1
        
        # Get quote statistics
        quote_query = supabase.table("quotes").select("*")
        if start_date and end_date:
            quote_query = quote_query.gte("created_at", start_date.isoformat()).lte("created_at", end_date.isoformat())
        elif start_date:
            quote_query = quote_query.gte("created_at", start_date.isoformat())
        elif end_date:
            quote_query = quote_query.lte("created_at", end_date.isoformat())
        
        quotes = quote_query.execute()
        
        quote_status_counts = {}
        for quote in quotes.data:
            status = quote["status"]
            quote_status_counts[status] = quote_status_counts.get(status, 0) + 1
        
        return {
            "revenue": {
                "total": total_revenue,
                "paid": paid_revenue,
                "pending": pending_revenue
            },
            "invoices": {
                "total": len(invoices.data),
                "by_status": status_counts,
                "overdue": overdue_count
            },
            "quotes": {
                "total": len(quotes.data),
                "by_status": quote_status_counts
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch sales stats: {str(e)}"
        )

@router.get("/payment-reminders")
async def get_payment_reminders(current_user: User = Depends(get_current_user)):
    """Get invoices that need payment reminders"""
    try:
        supabase = get_supabase_client()
        
        # Get overdue invoices
        today = datetime.now().date()
        overdue_invoices = supabase.table("invoices").select("*").eq("payment_status", "pending").lt("due_date", today.isoformat()).execute()
        
        # Get invoices due soon (within 7 days)
        soon_date = (today + timedelta(days=7)).isoformat()
        due_soon_invoices = supabase.table("invoices").select("*").eq("payment_status", "pending").gte("due_date", today.isoformat()).lte("due_date", soon_date).execute()
        
        return {
            "overdue": overdue_invoices.data,
            "due_soon": due_soon_invoices.data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch payment reminders: {str(e)}"
        )

@router.get("/quotes/simple")
async def get_quotes_simple():
    """Simple endpoint to get quotes without complex processing"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("quotes").select("*").limit(10).execute()
        
        if not result.data:
            return {"quotes": [], "message": "No quotes found"}
        
        # Return raw data without Pydantic validation
        return {
            "quotes": result.data,
            "count": len(result.data),
            "message": "Success"
        }
    except Exception as e:
        return {
            "quotes": [],
            "error": str(e),
            "message": "Error fetching quotes"
        }

# ============================================================================
# COST MANAGEMENT - Quản lý chi phí cho SALES
# ============================================================================

@router.get("/costs", response_model=List[Expense])
async def get_costs(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    current_user: User = Depends(require_permission(Permission.VIEW_COST))
):
    """Get costs for projects - SALES can view all costs"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("project_costs").select("*")
        
        if project_id:
            query = query.eq("project_id", project_id)
        
        result = query.order("created_at", desc=True).execute()
        
        if result.data:
            return [Expense(**cost) for cost in result.data]
        
        return []
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch costs: {str(e)}"
        )

@router.post("/costs", response_model=Expense)
async def create_cost(
    cost_data: ExpenseCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_COST))
):
    """Create a new cost - SALES can create planned and actual costs"""
    try:
        supabase = get_supabase_client()
        
        # Create cost record
        cost_dict = cost_data.dict()
        cost_dict["id"] = str(uuid.uuid4())
        cost_dict["created_by"] = current_user.id
        cost_dict["created_at"] = datetime.utcnow().isoformat()
        cost_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("project_costs").insert(cost_dict).execute()
        
        if result.data:
            return Expense(**result.data[0])
        
        raise HTTPException(
            status_code=400,
            detail="Failed to create cost"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create cost: {str(e)}"
        )

@router.put("/costs/{cost_id}", response_model=Expense)
async def update_cost(
    cost_id: str,
    cost_data: ExpenseUpdate,
    current_user: User = Depends(require_permission(Permission.EDIT_COST))
):
    """Update a cost - SALES can edit costs during project execution"""
    try:
        supabase = get_supabase_client()
        
        # Check if cost exists
        existing = supabase.table("project_costs").select("*").eq("id", cost_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Cost not found"
            )
        
        # Update cost
        update_data = cost_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("project_costs").update(update_data).eq("id", cost_id).execute()
        
        if result.data:
            return Expense(**result.data[0])
        
        raise HTTPException(
            status_code=400,
            detail="Failed to update cost"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update cost: {str(e)}"
        )

@router.post("/costs/{cost_id}/approve")
async def approve_cost(
    cost_id: str,
    current_user: User = Depends(require_permission(Permission.APPROVE_COST))
):
    """Approve a cost - SALES can approve actual costs"""
    try:
        supabase = get_supabase_client()
        
        # Check if cost exists
        existing = supabase.table("project_costs").select("*").eq("id", cost_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Cost not found"
            )
        
        cost = existing.data[0]
        
        # Check if cost can be approved
        if cost.get("status") == "approved":
            raise HTTPException(
                status_code=400,
                detail="Cost is already approved"
            )
        
        # Update cost status to approved
        update_data = {
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": current_user.id,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("project_costs").update(update_data).eq("id", cost_id).execute()
        
        if result.data:
            return {
                "message": "Cost approved successfully",
                "cost": result.data[0]
            }
        
        raise HTTPException(
            status_code=400,
            detail="Failed to approve cost"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve cost: {str(e)}"
        )

# ============================================================================
# EXCEL IMPORT - Import báo giá từ Excel
# ============================================================================

def calculate_string_similarity(str1: str, str2: str) -> float:
    """Calculate similarity between two strings using Levenshtein distance"""
    s1 = str1.lower().strip()
    s2 = str2.lower().strip()
    
    if s1 == s2:
        return 100.0
    
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    
    # Create matrix
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j
    
    # Calculate Levenshtein distance
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,      # deletion
                matrix[i][j - 1] + 1,      # insertion
                matrix[i - 1][j - 1] + cost  # substitution
            )
    
    distance = matrix[len1][len2]
    max_len = max(len1, len2)
    similarity = ((max_len - distance) / max_len) * 100
    
    return similarity

def find_best_product_match(product_name: str, products: List[Dict]) -> Optional[Dict]:
    """Find best matching product using fuzzy matching"""
    if not product_name or not product_name.strip():
        return None
    
    best_match = None
    best_score = 0
    
    # Clean product name for better matching
    search_name = product_name.lower().strip()
    
    # Remove common prefixes/suffixes that don't affect matching
    search_name = search_name.replace('cửa sổ', '').replace('cửa', '').strip()
    
    for product in products:
        db_product_name = product.get('name', '').lower().strip()
        
        # Try exact match first (case insensitive)
        if search_name == db_product_name or search_name in db_product_name or db_product_name in search_name:
            return {
                'id': product.get('id'),
                'name': product.get('name'),
                'similarity': 100,
                'match_type': 'exact'
            }
        
        # Try fuzzy matching
        similarity = calculate_string_similarity(search_name, db_product_name)
        if similarity > best_score and similarity >= 60:  # Minimum 60% similarity
            best_score = similarity
            best_match = {
                'id': product.get('id'),
                'name': product.get('name'),
                'similarity': round(similarity, 2),
                'match_type': 'fuzzy'
            }
    
    return best_match

@router.post("/quotes/import-excel")
async def import_quotes_from_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager_or_admin)
):
    """Import quotes from Excel file - creates customers, projects, products, and quotes"""
    try:
        supabase = get_supabase_client()
        
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail="File phải là Excel (.xlsx hoặc .xls)"
            )
        
        # Read file content
        content = await file.read()
        
        # Parse Excel file
        try:
            df = pd.read_excel(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Lỗi khi đọc file Excel: {str(e)}"
            )
        
        # Validate required columns - support both old and new format
        available_columns = [col for col in df.columns]
        has_required = False
        column_mapping = {}
        
        # Map Vietnamese and non-accent columns for customer name
        for req_col in ['Tên khách hàng', 'Ten khach hang']:
            if req_col in available_columns:
                column_mapping['customer_name'] = req_col
                has_required = True
                break
        
        for req_col in ['Địa chỉ khách hàng', 'Dia chi khach hang']:
            if req_col in available_columns:
                column_mapping['customer_address'] = req_col
                break
        
        for req_col in ['Tên dự án', 'Ten du an']:
            if req_col in available_columns:
                column_mapping['project_name'] = req_col
                has_required = True
                break
        
        # Try to find product name column - can be "Hạng mục thi công" or "Tên sản phẩm"
        for req_col in ['Hạng mục thi công', 'Hang muc thi cong', 'Tên sản phẩm', 'Ten san pham']:
            if req_col in available_columns:
                column_mapping['product_name'] = req_col
                has_required = True
                break
        
        for req_col in ['Số lượng', 'So luong']:
            if req_col in available_columns:
                column_mapping['quantity'] = req_col
                has_required = True
                break
        
        for req_col in ['Đơn giá (VNĐ/ĐVT)', 'Don gia', 'Đơn giá']:
            if req_col in available_columns:
                column_mapping['unit_price'] = req_col
                has_required = True
                break
        
        for req_col in ['ĐVT', 'Đơn vị', 'Don vi']:
            if req_col in available_columns:
                column_mapping['unit'] = req_col
                break
        
        for req_col in ['Mô tả', 'Mo ta']:
            if req_col in available_columns:
                column_mapping['description'] = req_col
                break
        
        for req_col in ['Tạo sản phẩm mới', 'Tao san pham moi']:
            if req_col in available_columns:
                column_mapping['create_new'] = req_col
                break
        
        # Check if we have product name (either from "Hạng mục thi công" or "Tên sản phẩm")
        if 'product_name' not in column_mapping:
            has_required = False
        
        if not has_required:
            raise HTTPException(
                status_code=400,
                detail="File thiếu các cột bắt buộc: Tên khách hàng, Tên dự án, Hạng mục thi công (hoặc Tên sản phẩm), Số lượng, Đơn giá"
            )
        
        # Get all products for matching
        products_result = supabase.table("products").select("id, name, category_id, price, unit").eq("is_active", True).execute()
        products = products_result.data if products_result.data else []
        
        # Get all categories
        categories_result = supabase.table("product_categories").select("id, name").eq("is_active", True).execute()
        categories = {cat['name']: cat['id'] for cat in (categories_result.data or [])}
        
        # Track created entities
        customer_map = {}  # customer_name -> customer_id
        project_map = {}  # (customer_id, project_name) -> project_id
        product_map = {}  # product_name -> product_id
        created_customers = 0
        created_projects = 0
        created_products = 0
        created_quotes = 0
        errors = []
        
        # Group rows by customer and project
        quote_groups = {}  # (customer_id, project_id) -> list of items
        
        # Process each row
        for index, row in df.iterrows():
            try:
                # Extract data
                customer_name = str(row.get(column_mapping.get('customer_name', ''), '')).strip()
                customer_address = str(row.get(column_mapping.get('customer_address', ''), '')).strip()
                project_name = str(row.get(column_mapping.get('project_name', ''), '')).strip()
                
                # Get product name from "Hạng mục thi công" - take first line
                construction_item = str(row.get(column_mapping.get('product_name', ''), '')).strip()
                product_name = construction_item.split('\n')[0] if '\n' in construction_item else construction_item
                if not product_name:
                    product_name = construction_item
                
                quantity = float(row.get(column_mapping.get('quantity', ''), 1)) or 1
                unit_price = float(row.get(column_mapping.get('unit_price', ''), 0)) or 0
                unit = str(row.get(column_mapping.get('unit', ''), 'cái')).strip() or 'cái'
                description = construction_item  # Use full construction item as description
                create_new = str(row.get(column_mapping.get('create_new', ''), 'Không')).lower() == 'có'
                
                # Get dimensions - convert from meters to mm if needed
                area = None
                height = None
                length = None
                
                # Try to get area from "Diện tích (m²)"
                for area_col in ['Diện tích (m²)', 'Dien tich', 'Diện tích']:
                    if area_col in available_columns:
                        area_val = row.get(area_col, '')
                        if pd.notna(area_val) and str(area_val).strip():
                            try:
                                area = float(area_val)
                            except:
                                pass
                        break
                
                # Try to get height from "Cao (m)" - convert to mm
                for height_col in ['Cao (m)', 'Cao']:
                    if height_col in available_columns:
                        height_val = row.get(height_col, '')
                        if pd.notna(height_val) and str(height_val).strip():
                            try:
                                height = float(height_val) * 1000  # Convert m to mm
                            except:
                                pass
                        break
                
                # Try to get length from "Ngang (m)" - convert to mm
                for length_col in ['Ngang (m)', 'Ngang', 'Dài (m)', 'Dai']:
                    if length_col in available_columns:
                        length_val = row.get(length_col, '')
                        if pd.notna(length_val) and str(length_val).strip():
                            try:
                                length = float(length_val) * 1000  # Convert m to mm
                            except:
                                pass
                        break
                
                # Validate required fields
                if not customer_name:
                    errors.append(f"Dòng {index + 2}: Thiếu tên khách hàng")
                    continue
                if not project_name:
                    errors.append(f"Dòng {index + 2}: Thiếu tên dự án")
                    continue
                if not product_name:
                    errors.append(f"Dòng {index + 2}: Thiếu tên sản phẩm")
                    continue
                if unit_price <= 0:
                    errors.append(f"Dòng {index + 2}: Đơn giá phải lớn hơn 0")
                    continue
                
                # Get or create customer
                if customer_name not in customer_map:
                    # Check if customer exists
                    existing_customer = supabase.table("customers").select("id").ilike("name", customer_name).limit(1).execute()
                    if existing_customer.data:
                        customer_id = existing_customer.data[0]['id']
                    else:
                        # Create new customer
                        customer_code = get_next_available_customer_code()
                        customer_data = {
                            "id": str(uuid.uuid4()),
                            "customer_code": customer_code,
                            "name": customer_name,
                            "type": "individual",
                            "address": customer_address if customer_address else None,
                            "status": "active",
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        result = supabase.table("customers").insert(customer_data).execute()
                        if result.data:
                            customer_id = result.data[0]['id']
                            created_customers += 1
                        else:
                            errors.append(f"Dòng {index + 2}: Không thể tạo khách hàng")
                            continue
                    customer_map[customer_name] = customer_id
                
                customer_id = customer_map[customer_name]
                
                # Get or create project
                project_key = (customer_id, project_name)
                if project_key not in project_map:
                    # Check if project exists
                    existing_project = supabase.table("projects").select("id").eq("customer_id", customer_id).ilike("name", project_name).limit(1).execute()
                    if existing_project.data:
                        project_id = existing_project.data[0]['id']
                    else:
                        # Create new project
                        project_code = f"PRJ{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
                        project_data = {
                            "id": str(uuid.uuid4()),
                            "project_code": project_code,
                            "name": project_name,
                            "customer_id": customer_id,
                            "start_date": datetime.now().date().isoformat(),
                            "status": "planning",
                            "priority": "medium",
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        result = supabase.table("projects").insert(project_data).execute()
                        if result.data:
                            project_id = result.data[0]['id']
                            created_projects += 1
                        else:
                            errors.append(f"Dòng {index + 2}: Không thể tạo dự án")
                            continue
                    project_map[project_key] = project_id
                
                project_id = project_map[project_key]
                
                # Get or create product
                if product_name not in product_map:
                    if create_new:
                        # Create new product
                        # Try to find category (use first available or create default)
                        category_id = None
                        if categories:
                            category_id = list(categories.values())[0]
                        
                        product_data = {
                            "id": str(uuid.uuid4()),
                            "name": product_name,
                            "price": unit_price,
                            "unit": unit,
                            "description": description if description else None,
                            "category_id": category_id,
                            "is_active": True,
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        
                        # Add dimensions if available
                        if area is not None:
                            product_data['area'] = area
                        if height is not None:
                            product_data['height'] = height
                        if length is not None:
                            product_data['length'] = length
                        
                        result = supabase.table("products").insert(product_data).execute()
                        if result.data:
                            product_id = result.data[0]['id']
                            product_map[product_name] = product_id
                            created_products += 1
                        else:
                            errors.append(f"Dòng {index + 2}: Không thể tạo sản phẩm")
                            continue
                    else:
                        # Find matching product
                        match = find_best_product_match(product_name, products)
                        if match:
                            product_id = match['id']
                            product_map[product_name] = product_id
                        else:
                            errors.append(f"Dòng {index + 2}: Không tìm thấy sản phẩm tương tự cho '{product_name}'")
                            continue
                
                product_id = product_map[product_name]
                
                # Add to quote group
                quote_key = (customer_id, project_id)
                if quote_key not in quote_groups:
                    quote_groups[quote_key] = []
                
                quote_groups[quote_key].append({
                    "product_id": product_id,
                    "product_name": product_name,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "unit": unit,
                    "description": description
                })
                
            except Exception as e:
                errors.append(f"Dòng {index + 2}: Lỗi xử lý - {str(e)}")
                continue
        
        # Create quotes
        for (customer_id, project_id), items in quote_groups.items():
            try:
                # Calculate totals
                subtotal = sum(item['quantity'] * item['unit_price'] for item in items)
                tax_rate = 0.08  # 8% VAT
                tax_amount = subtotal * tax_rate
                total_amount = subtotal + tax_amount
                
                # Generate quote number
                quote_number = f"BG{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
                
                # Create quote
                quote_data = {
                    "id": str(uuid.uuid4()),
                    "quote_number": quote_number,
                    "customer_id": customer_id,
                    "project_id": project_id,
                    "issue_date": datetime.now().date().isoformat(),
                    "valid_until": (datetime.now() + timedelta(days=7)).date().isoformat(),
                    "subtotal": subtotal,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amount,
                    "total_amount": total_amount,
                    "currency": "VND",
                    "status": "draft",
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                quote_result = supabase.table("quotes").insert(quote_data).execute()
                if not quote_result.data:
                    errors.append(f"Không thể tạo báo giá cho dự án {project_id}")
                    continue
                
                quote_id = quote_result.data[0]['id']
                created_quotes += 1
                
                # Create quote items
                quote_items = []
                for item in items:
                    quote_item = {
                        "id": str(uuid.uuid4()),
                        "quote_id": quote_id,
                        "product_service_id": item['product_id'],
                        "description": item['description'] or item['product_name'],
                        "quantity": item['quantity'],
                        "unit_price": item['unit_price'],
                        "total_price": item['quantity'] * item['unit_price'],
                        "created_at": datetime.utcnow().isoformat()
                    }
                    quote_items.append(quote_item)
                
                if quote_items:
                    supabase.table("quote_items").insert(quote_items).execute()
                    
            except Exception as e:
                errors.append(f"Lỗi khi tạo báo giá: {str(e)}")
                continue
        
        return {
            "success": len(errors) == 0,
            "message": f"Import hoàn thành. Đã tạo {created_customers} khách hàng, {created_projects} dự án, {created_quotes} báo giá, {created_products} sản phẩm mới",
            "createdCustomers": created_customers,
            "createdProjects": created_projects,
            "createdQuotes": created_quotes,
            "createdProducts": created_products,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi import file: {str(e)}"
        )

@router.post("/quotes/import-from-analysis")
async def import_quote_from_ai_analysis(
    analysis_data: Dict[str, Any],
    current_user: User = Depends(require_manager_or_admin)
):
    """Import quote from AI analysis result"""
    try:
        supabase = get_supabase_client()
        
        # Extract data from analysis
        customer_info = analysis_data.get('customer', {}) or {}
        project_info = analysis_data.get('project', {}) or {}
        items = analysis_data.get('items', []) or []
        is_new_customer = analysis_data.get('is_new_customer', True)
        is_new_project = analysis_data.get('is_new_project', True)
        employee_id = analysis_data.get('employee_id')
        created_by = analysis_data.get('created_by')  # User ID from frontend
        created_by_name = analysis_data.get('created_by_name')  # User name from frontend
        
        # Ensure customer_info and project_info are dictionaries
        if not isinstance(customer_info, dict):
            customer_info = {}
        if not isinstance(project_info, dict):
            project_info = {}
        if not isinstance(items, list):
            items = []
        
        print(f"📋 Import request: is_new_customer={is_new_customer}, is_new_project={is_new_project}")
        print(f"📋 Customer ID provided: {customer_info.get('id') if customer_info else None}")
        print(f"📋 Project ID provided: {project_info.get('id') if project_info else None}")
        print(f"👤 Created by: {created_by_name or current_user.email} (ID: {created_by or current_user.id})")
        print(f"👷 Employee ID: {employee_id}")
        
        # Get customer name safely
        customer_name_value = (customer_info.get('name') if customer_info else None) or ''
        if not customer_name_value or not str(customer_name_value).strip():
            raise HTTPException(
                status_code=400,
                detail="Thiếu thông tin khách hàng"
            )
        
        # Get project name from project info or create from customer
        project_name = (project_info.get('name') if project_info else None) or ''
        if not project_name:
            # Create project name from customer name + address
            customer_name = str((customer_info.get('name') or '') if customer_info else '').strip()
            customer_address = str((customer_info.get('address') or '') if customer_info else '').strip()
            project_name = f"{customer_name}{' - ' + customer_address if customer_address else ''}"
        
        project_address = (project_info.get('address') if project_info else None) or (customer_info.get('address') if customer_info else None) or None
        project_supervisor = (project_info.get('supervisor') if project_info else None) or None
        
        if not items or len(items) == 0:
            raise HTTPException(
                status_code=400,
                detail="Không có hạng mục nào"
            )
        
        # Get all products for matching
        products_result = supabase.table("products").select("id, name, category_id, price, unit").eq("is_active", True).execute()
        products = products_result.data if products_result.data else []
        
        # Get all categories
        categories_result = supabase.table("product_categories").select("id, name").eq("is_active", True).execute()
        categories = {cat['name']: cat['id'] for cat in (categories_result.data or [])}
        
        # Get all expense objects for cost matching
        expense_objects_result = supabase.table("expense_objects").select("id, name, description, level, role").eq("is_active", True).execute()
        expense_objects = expense_objects_result.data if expense_objects_result.data else []
        print(f"📋 Loaded {len(expense_objects)} expense objects for cost matching")
        
        created_customers = 0
        created_projects = 0
        created_products = 0
        created_quotes = 0
        product_map = {}  # product_name -> product_id
        
        # Get or create customer
        customer_name = str(customer_name_value).strip()
        customer_id = customer_info.get('id') if customer_info else None  # Check if customer ID is provided
        
        if customer_id and not is_new_customer:
            # Use existing customer (ID provided from frontend)
            print(f"✅ Using existing customer ID: {customer_id}")
            # Verify customer exists
            verify_customer = supabase.table("customers").select("id, name").eq("id", customer_id).limit(1).execute()
            if not verify_customer.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Khách hàng với ID {customer_id} không tồn tại"
                )
            print(f"✅ Verified customer: {verify_customer.data[0]['name']}")
        else:
            # Search for existing customer by name, phone, or email
            print(f"🔍 Searching for existing customer: {customer_name}")
            
            # Get phone and email for duplicate checking
            customer_phone = (customer_info.get('phone') or '').strip() if customer_info else ''
            customer_email = (customer_info.get('email') or '').strip() if customer_info else ''
            
            existing_customer = None
            
            # 1. Check by name (fuzzy match)
            if customer_name:
                name_result = supabase.table("customers").select("id, name, phone, email").ilike("name", customer_name).limit(5).execute()
                if name_result.data:
                    # Try exact match first
                    for cust in name_result.data:
                        if cust.get('name', '').lower().strip() == customer_name.lower().strip():
                            existing_customer = cust
                            print(f"✅ Found exact name match: {cust.get('name')}")
                            break
                    
                    # If no exact match, use first result (fuzzy match)
                    if not existing_customer:
                        existing_customer = name_result.data[0]
                        print(f"✅ Found fuzzy name match: {existing_customer.get('name')}")
            
            # 2. Check by phone (if provided and no match found yet)
            if not existing_customer and customer_phone:
                phone_result = supabase.table("customers").select("id, name, phone, email").eq("phone", customer_phone).limit(1).execute()
                if phone_result.data:
                    existing_customer = phone_result.data[0]
                    print(f"✅ Found phone match: {existing_customer.get('phone')} - {existing_customer.get('name')}")
            
            # 3. Check by email (if provided and no match found yet)
            if not existing_customer and customer_email:
                email_result = supabase.table("customers").select("id, name, phone, email").eq("email", customer_email).limit(1).execute()
                if email_result.data:
                    existing_customer = email_result.data[0]
                    print(f"✅ Found email match: {existing_customer.get('email')} - {existing_customer.get('name')}")
            
            # Use existing customer if found and not forcing new customer
            if existing_customer and not is_new_customer:
                customer_id = existing_customer['id']
                print(f"✅ Using existing customer: {existing_customer.get('name')} (ID: {customer_id})")
            elif existing_customer and is_new_customer:
                # Found duplicate but user wants to create new - warn but still create
                print(f"⚠️ Found duplicate customer but creating new: {existing_customer.get('name')} (ID: {existing_customer.get('id')})")
                # Still create new customer as requested
                customer_code = get_next_available_customer_code()
                customer_data = {
                    "id": str(uuid.uuid4()),
                    "customer_code": customer_code,
                    "name": customer_name,
                    "type": "individual",
                    "address": (customer_info.get('address') or '').strip() if customer_info else None,
                    "phone": customer_phone if customer_phone else None,
                    "email": customer_email if customer_email else None,
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                result = supabase.table("customers").insert(customer_data).execute()
                if result.data:
                    customer_id = result.data[0]['id']
                    created_customers = 1
                    print(f"✅ Created new customer with ID: {customer_id} (duplicate exists: {existing_customer.get('id')})")
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Không thể tạo khách hàng"
                    )
            else:
                # No duplicate found, create new customer
                print(f"✨ Creating new customer: {customer_name}")
                customer_code = get_next_available_customer_code()
                customer_data = {
                    "id": str(uuid.uuid4()),
                    "customer_code": customer_code,
                    "name": customer_name,
                    "type": "individual",
                    "address": (customer_info.get('address') or '').strip() if customer_info else None,
                    "phone": customer_phone if customer_phone else None,
                    "email": customer_email if customer_email else None,
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                result = supabase.table("customers").insert(customer_data).execute()
                if result.data:
                    customer_id = result.data[0]['id']
                    created_customers = 1
                    print(f"✅ Created new customer with ID: {customer_id}")
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Không thể tạo khách hàng"
                    )
        
        # Get or create project
        project_id = project_info.get('id')  # Check if project ID is provided
        
        if project_id and not is_new_project:
            # Use existing project (ID provided from frontend)
            print(f"✅ Using existing project ID: {project_id}")
            # Verify project exists and belongs to customer
            verify_project = supabase.table("projects").select("id, name, customer_id").eq("id", project_id).eq("customer_id", customer_id).limit(1).execute()
            if not verify_project.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Dự án với ID {project_id} không tồn tại hoặc không thuộc khách hàng này"
                )
            print(f"✅ Verified project: {verify_project.data[0]['name']}")
        else:
            # Search for existing project by name
            print(f"🔍 Searching for existing project: {project_name}")
            existing_project = supabase.table("projects").select("id, name").eq("customer_id", customer_id).ilike("name", project_name).limit(1).execute()
            
            if existing_project.data and not is_new_project:
                project_id = existing_project.data[0]['id']
                print(f"✅ Found existing project: {existing_project.data[0]['name']}")
            else:
                # Create new project
                print(f"✨ Creating new project: {project_name}")
                project_code = f"PRJ{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
                project_data = {
                    "id": str(uuid.uuid4()),
                    "project_code": project_code,
                    "name": project_name,
                    "customer_id": customer_id,
                    "description": project_address if project_address else None,
                    "start_date": datetime.now().date().isoformat(),
                    "status": "planning",
                    "priority": "medium",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Use employee_id if provided, otherwise try to find supervisor by name
                if employee_id:
                    project_data["manager_id"] = employee_id
                elif project_supervisor:
                    # Try to find employee by name (employees table has first_name and last_name, not full_name)
                    supervisor_employee = supabase.table("employees").select("id").or_(f"first_name.ilike.%{project_supervisor}%,last_name.ilike.%{project_supervisor}%").limit(1).execute()
                    if supervisor_employee.data:
                        project_data["manager_id"] = supervisor_employee.data[0]['id']
                
                result = supabase.table("projects").insert(project_data).execute()
                if result.data:
                    project_id = result.data[0]['id']
                    created_projects = 1
                    print(f"✅ Created new project with ID: {project_id}")
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Không thể tạo dự án"
                    )
        
        # Helper function to check if item is a cost/material expense
        def is_cost_item(item: dict) -> bool:
            """Check if item is a cost/material expense based on category or name"""
            loai_san_pham = str(item.get('loai_san_pham', '')).lower()
            ten_san_pham = str(item.get('ten_san_pham', '')).lower()
            hang_muc = str(item.get('hang_muc_thi_cong', '')).lower()
            
            cost_keywords = ['chi phí', 'vật tư', 'nguyên vật liệu', 'vật liệu', 'phụ kiện', 'nhôm', 'kính', 'inox', 'sắt', 'nhựa', 'gỗ']
            return any(keyword in loai_san_pham or keyword in ten_san_pham or keyword in hang_muc for keyword in cost_keywords)
        
        # Helper function to find matching expense object
        def find_expense_object(item: dict, expense_objects: list) -> Optional[str]:
            """Find matching expense object ID for the item using fuzzy matching"""
            if not expense_objects:
                return None
            
            ten_san_pham = str(item.get('ten_san_pham', '')).lower().strip()
            hang_muc = str(item.get('hang_muc_thi_cong', '')).lower().strip()
            search_text = f"{ten_san_pham} {hang_muc}".strip()
            
            if not search_text:
                return None
            
            best_match = None
            best_score = 0
            
            for exp_obj in expense_objects:
                exp_name = str(exp_obj.get('name', '')).lower().strip()
                exp_desc = str(exp_obj.get('description', '')).lower().strip() if exp_obj.get('description') else ''
                
                # Skip if expense object name is empty
                if not exp_name:
                    continue
                
                # 1. Try exact match first (highest priority)
                if exp_name == ten_san_pham or exp_name == search_text:
                    print(f"✅ Exact match found: '{search_text[:50]}' → '{exp_name}' (expense_object_id: {exp_obj['id']})")
                    return exp_obj['id']
                
                # 2. Try contains match (high priority)
                if exp_name in search_text or search_text in exp_name:
                    score = len(exp_name) * 1.5  # Longer match = better, with higher weight
                    if score > best_score:
                        best_score = score
                        best_match = exp_obj['id']
                        print(f"📌 Contains match: '{search_text[:50]}' contains '{exp_name}' (score: {score})")
                
                # 3. Try fuzzy matching using similarity (medium priority)
                similarity = calculate_string_similarity(ten_san_pham, exp_name)
                if similarity >= 70:  # Minimum 70% similarity
                    score = similarity * 0.8  # Slightly less important than contains
                    if score > best_score:
                        best_score = score
                        best_match = exp_obj['id']
                        print(f"🔍 Fuzzy match: '{ten_san_pham}' ~ '{exp_name}' (similarity: {similarity}%, score: {score})")
                
                # 4. Also check description (lower priority)
                if exp_desc:
                    if exp_desc in search_text or search_text in exp_desc:
                        score = len(exp_desc) * 0.5  # Description match is less important
                        if score > best_score:
                            best_score = score
                            best_match = exp_obj['id']
                            print(f"📝 Description match: '{search_text[:50]}' matches description '{exp_desc[:30]}' (score: {score})")
            
            if best_match:
                matched_obj = next((eo for eo in expense_objects if eo['id'] == best_match), None)
                matched_name = matched_obj.get('name', 'Unknown') if matched_obj else 'Unknown'
                print(f"✅ Best match found: '{search_text[:50]}' → '{matched_name}' (expense_object_id: {best_match}, score: {best_score:.2f})")
            else:
                print(f"❌ No match found for: '{search_text[:50]}'")
            
            return best_match
        
        # Process items and create products if needed
        quote_items = []
        matched_products = []  # Track which products were matched
        new_products = []      # Track which products were created
        cost_items = []        # Track items that are costs for material cost tracking
        
        for item in items:
            # Ensure item is a dictionary
            if not isinstance(item, dict):
                print(f"⚠️ Skipping invalid item (not a dict): {item}")
                continue
            
            # Handle None values safely
            hang_muc = item.get('hang_muc_thi_cong')
            product_name = str(hang_muc).strip() if hang_muc else ''
            if not product_name:
                print(f"⚠️ Skipping item with empty hang_muc_thi_cong")
                continue
            
            # Use ten_san_pham if available, otherwise extract from hang_muc_thi_cong
            ten_san_pham = item.get('ten_san_pham')
            product_name_short = str(ten_san_pham).strip() if ten_san_pham else ''
            if not product_name_short:
                product_name_short = product_name.split('\n')[0] if '\n' in product_name else product_name
            
            # Get category name for matching
            loai_san_pham = item.get('loai_san_pham')
            category_name = str(loai_san_pham).strip() if loai_san_pham else ''
            
            # Find or create product
            if product_name_short not in product_map:
                # Try to find matching product (use ten_san_pham for better matching)
                match = find_best_product_match(product_name_short, products)
                
                if match:
                    product_id = match['id']
                    matched_products.append({
                        'input_name': product_name_short,
                        'matched_name': match['name'],
                        'similarity': match.get('similarity'),
                        'match_type': match.get('match_type')
                    })
                    print(f"✅ Matched product: '{product_name_short}' → '{match['name']}' (similarity: {match.get('similarity')}%)")
                else:
                    # Create new product
                    category_id = None
                    
                    # Try to find matching category based on loai_san_pham
                    if category_name:
                        for cat_name, cat_id in categories.items():
                            # Fuzzy match category
                            cat_similarity = calculate_string_similarity(category_name, cat_name)
                            if cat_similarity >= 60:
                                category_id = cat_id
                                print(f"✅ Matched category: '{category_name}' → '{cat_name}' (similarity: {cat_similarity}%)")
                                break
                    
                    # If no match, use first category or None
                    if not category_id and categories:
                        category_id = list(categories.values())[0]
                    
                    # Use mo_ta if available, otherwise full hang_muc_thi_cong
                    mo_ta = item.get('mo_ta')
                    description = str(mo_ta).strip() if mo_ta else ''
                    if not description:
                        description = product_name
                    
                    # Get unit safely - ensure it's not None
                    dvt = item.get('dvt')
                    unit = str(dvt).strip() if dvt else 'cái'
                    if not unit:
                        unit = 'cái'  # Default unit
                    
                    product_data = {
                        "id": str(uuid.uuid4()),
                        "name": product_name_short,
                        "price": item.get('don_gia', 0),
                        "unit": unit,  # Always has a value, never None
                        "description": description,
                        "category_id": category_id,
                        "is_active": True,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    
                    # Add dimensions - safely handle None values
                    if item.get('dien_tich') is not None and item.get('dien_tich') != '':
                        try:
                            product_data['area'] = float(item['dien_tich'])
                        except (ValueError, TypeError):
                            pass
                    if item.get('cao') is not None and item.get('cao') != '':
                        try:
                            product_data['height'] = float(item['cao']) * 1000  # Convert m to mm
                        except (ValueError, TypeError):
                            pass
                    if item.get('ngang') is not None and item.get('ngang') != '':
                        try:
                            product_data['length'] = float(item['ngang']) * 1000  # Convert m to mm
                        except (ValueError, TypeError):
                            pass
                    
                    result = supabase.table("products").insert(product_data).execute()
                    if result.data:
                        product_id = result.data[0]['id']
                        created_products += 1
                        new_products.append({
                            'name': product_name_short,
                            'category': category_name or 'Chưa phân loại',
                            'price': item.get('don_gia', 0),
                            'unit': unit  # Use the safe unit variable
                        })
                        print(f"✨ Created new product: '{product_name_short}' (price: {item.get('don_gia', 0)}, unit: {unit})")
                    else:
                        continue  # Skip this item if product creation failed
                
                product_map[product_name_short] = product_id
            
            product_id = product_map[product_name_short]
            
            # Check if item is a cost/material expense based on item_type from frontend
            item_type = item.get('item_type', 'product')  # Default to 'product' if not specified
            is_cost = item_type == 'material_cost'
            
            # Also check using legacy method if item_type is not provided
            if not is_cost and is_cost_item(item):
                is_cost = True
                print(f"⚠️ Item '{product_name_short}' detected as cost using legacy method (item_type not set)")
            
            # Initialize expense_object_id for quote items
            expense_object_id_for_quote = None
            
            # Save to actual_material_components if it's a cost
            if is_cost:
                expense_object_id = find_expense_object(item, expense_objects)
                
                # If expense object not found, create it under "Đối tượng chi phí khác"
                if not expense_object_id:
                    print(f"⚠️ Expense object not found for '{product_name_short}', creating new one under 'Đối tượng chi phí khác'")
                    
                    # Find or create "Đối tượng chi phí khác" or "Khác" parent
                    other_cost_parent = None
                    other_cost_names = ['đối tượng chi phí khác', 'chi phí khác', 'khác']
                    
                    for exp_obj in expense_objects:
                        exp_name_lower = str(exp_obj.get('name', '')).lower().strip()
                        # Check exact match first
                        if exp_name_lower in other_cost_names:
                            other_cost_parent = exp_obj['id']
                            print(f"✅ Found existing 'Khác' parent: '{exp_obj.get('name')}' (ID: {other_cost_parent})")
                            break
                        # Also try fuzzy match for similar names
                        for name_variant in other_cost_names:
                            similarity = calculate_string_similarity(exp_name_lower, name_variant)
                            if similarity >= 80:  # 80% similarity threshold
                                other_cost_parent = exp_obj['id']
                                print(f"✅ Found similar 'Khác' parent: '{exp_obj.get('name')}' (ID: {other_cost_parent}, similarity: {similarity}%)")
                                break
                        if other_cost_parent:
                            break
                    
                    # If parent not found, create it
                    if not other_cost_parent:
                        print(f"📋 Creating parent 'Đối tượng chi phí khác'...")
                        parent_data = {
                            "id": str(uuid.uuid4()),
                            "name": "Đối tượng chi phí khác",
                            "description": "Các đối tượng chi phí khác không phân loại",
                            "level": 1,
                            "role": "other",
                            "is_active": True,
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        parent_result = supabase.table("expense_objects").insert(parent_data).execute()
                        if parent_result.data:
                            other_cost_parent = parent_result.data[0]['id']
                            print(f"✅ Created parent expense object: {other_cost_parent}")
                            # Reload expense objects to include the new parent
                            expense_objects_result = supabase.table("expense_objects").select("id, name, description, level, role").eq("is_active", True).execute()
                            expense_objects = expense_objects_result.data if expense_objects_result.data else []
                    
                    # Create new expense object for this cost
                    if other_cost_parent:
                        expense_object_name = product_name_short or f"Chi phí {item.get('loai_san_pham', '')}"
                        expense_object_data = {
                            "id": str(uuid.uuid4()),
                            "name": expense_object_name,
                            "description": item.get('mo_ta') or product_name,
                            "parent_id": other_cost_parent,
                            "level": 2,
                            "role": "material",
                            "is_active": True,
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        expense_result = supabase.table("expense_objects").insert(expense_object_data).execute()
                        if expense_result.data:
                            expense_object_id = expense_result.data[0]['id']
                            print(f"✅ Created new expense object: '{expense_object_name}' (ID: {expense_object_id})")
                            # Add to expense_objects list for future lookups
                        expense_objects.append({
                            "id": expense_object_id,
                            "name": expense_object_name,
                            "description": expense_object_data["description"],
                            "level": 2,
                            "role": "material"
                        })
                
                # Save expense_object_id for quote item
                expense_object_id_for_quote = expense_object_id
                
                if expense_object_id:
                    # Determine which product to update actual_material_components
                    # If belongs_to_product_id is provided, use that product
                    # Otherwise, use the current product (product_id)
                    target_product_id = product_id
                    belongs_to_product_id = item.get('belongs_to_product_id')
                    
                    if belongs_to_product_id:
                        # Find the product by index in items array
                        try:
                            belongs_index = int(belongs_to_product_id)
                            if belongs_index < len(items):
                                belongs_item = items[belongs_index]
                                belongs_product_name = str(belongs_item.get('ten_san_pham', '')).strip()
                                if belongs_product_name and belongs_product_name in product_map:
                                    target_product_id = product_map[belongs_product_name]
                                    print(f"✅ Cost '{product_name_short}' belongs to product '{belongs_product_name}' (ID: {target_product_id})")
                        except (ValueError, IndexError) as e:
                            print(f"⚠️ Invalid belongs_to_product_id: {belongs_to_product_id}, using current product")
                    
                    # Get current product to update actual_material_components
                    product_result = supabase.table("products").select("actual_material_components, actual_material_cost").eq("id", target_product_id).single().execute()
                    current_components = product_result.data.get('actual_material_components', []) if product_result.data else []
                    current_cost = float(product_result.data.get('actual_material_cost', 0)) if product_result.data else 0.0
                    
                    # Calculate cost for this item - safely handle None values
                    so_luong_val = item.get('so_luong') or 1
                    quantity = float(so_luong_val) if so_luong_val is not None else 1.0
                    
                    don_gia_val = item.get('don_gia') or 0
                    unit_price = float(don_gia_val) if don_gia_val is not None else 0.0
                    
                    item_cost = quantity * unit_price
                    
                    # Create component entry
                    component = {
                        "expense_object_id": expense_object_id,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "unit": str(item.get('dvt', 'cái')).strip() or 'cái',
                        "description": product_name_short,
                        "total_cost": item_cost
                    }
                    
                    # Add to components list
                    if not isinstance(current_components, list):
                        current_components = []
                    current_components.append(component)
                    
                    # Update total cost
                    new_total_cost = current_cost + item_cost
                    
                    # Update product with actual_material_components
                    supabase.table("products").update({
                        "actual_material_components": current_components,
                        "actual_material_cost": new_total_cost,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", target_product_id).execute()
                    
                    cost_items.append({
                        'product_id': target_product_id,
                        'product_name': product_name_short,
                        'belongs_to_product_id': belongs_to_product_id,
                        'expense_object_id': expense_object_id,
                        'cost': item_cost
                    })
                    print(f"💰 Saved cost to product material components: {product_name_short} → expense_object_id: {expense_object_id}, cost: {item_cost}, target_product_id: {target_product_id}")
                else:
                    print(f"⚠️ Cost item detected but no matching expense object found: {product_name_short}")
            
            # Add to quote items with full details
            # Get unit safely for quote item
            quote_unit = item.get('dvt')
            quote_unit = str(quote_unit).strip() if quote_unit else 'cái'
            if not quote_unit:
                quote_unit = 'cái'
            
            # Safely convert values to float, handling None
            so_luong_val = item.get('so_luong') or 1
            quantity_val = float(so_luong_val) if so_luong_val is not None else 1.0
            
            don_gia_val = item.get('don_gia') or 0
            unit_price_val = float(don_gia_val) if don_gia_val is not None else 0.0
            
            # Handle dimensions safely
            ngang_val = item.get('ngang')
            ngang_float = None
            if ngang_val is not None and ngang_val != '':
                try:
                    ngang_float = float(ngang_val)
                except (ValueError, TypeError):
                    pass
            
            cao_val = item.get('cao')
            cao_float = None
            if cao_val is not None and cao_val != '':
                try:
                    cao_float = float(cao_val)
                except (ValueError, TypeError):
                    pass
            
            dien_tich_val = item.get('dien_tich')
            dien_tich_float = None
            if dien_tich_val is not None and dien_tich_val != '':
                try:
                    dien_tich_float = float(dien_tich_val)
                except (ValueError, TypeError):
                    pass
            
            quote_item_data = {
                "product_id": product_id,
                "product_name": product_name_short,
                "quantity": quantity_val,
                "unit_price": unit_price_val,
                "unit": quote_unit,  # Always has a value, never None
                "description": product_name,
                # Add dimensions
                "ngang": ngang_float,
                "cao": cao_float,
                "dien_tich": dien_tich_float,
                "ky_hieu": item.get('ky_hieu') or None,
                "hang_muc_thi_cong": product_name,
                "ten_san_pham": product_name_short,
                "loai_san_pham": category_name or None,
                "mo_ta": item.get('mo_ta') or None
            }
            
            # Add expense_object_id if it's a cost
            if expense_object_id_for_quote:
                quote_item_data["expense_object_id"] = expense_object_id_for_quote
            quote_items.append(quote_item_data)
        
        if not quote_items:
            raise HTTPException(
                status_code=400,
                detail="Không có hạng mục hợp lệ để tạo báo giá"
            )
        
        # Helper function to calculate item total
        def calculate_item_total(item):
            """Calculate item total: unit_price × dien_tich × quantity if dien_tich exists, otherwise unit_price × quantity"""
            # Safely get and convert to float, handling None values
            quantity_val = item.get('quantity') or item.get('so_luong') or 1
            quantity = float(quantity_val) if quantity_val is not None else 1.0
            
            unit_price_val = item.get('unit_price') or item.get('don_gia') or 0
            unit_price = float(unit_price_val) if unit_price_val is not None else 0.0
            
            dien_tich = item.get('dien_tich')
            
            if dien_tich is not None and dien_tich != '':
                try:
                    dien_tich_float = float(dien_tich)
                    if dien_tich_float > 0:
                        # Formula: đơn giá × diện tích × số lượng
                        return unit_price * dien_tich_float * quantity
                except (ValueError, TypeError):
                    pass
            
            # Formula: đơn giá × số lượng
            return unit_price * quantity
        
        # Calculate totals from quote_items using correct formula
        subtotal = sum(calculate_item_total(item) for item in quote_items)
        
        # Get tax rate from analysis or use default
        tax_rate = analysis_data.get('tax_rate', 0.08)
        if tax_rate is None:
            tax_rate = 0.08
        elif isinstance(tax_rate, str):
            # Handle percentage string like "8%" or "0.08"
            try:
                tax_rate = float(tax_rate.replace('%', '')) / 100 if '%' in tax_rate else float(tax_rate)
            except (ValueError, TypeError):
                tax_rate = 0.08
        else:
            try:
                tax_rate = float(tax_rate)
            except (ValueError, TypeError):
                tax_rate = 0.08
        
        # Calculate tax amount only for items with has_tax = true
        taxable_subtotal = sum(
            calculate_item_total(item)
            for item in quote_items 
            if item.get('has_tax', True)  # Default to True if not specified
        )
        tax_amount = taxable_subtotal * tax_rate
        total_amount = subtotal + tax_amount
        
        print(f"💰 Financial summary:")
        print(f"  - Subtotal (all items): {subtotal:,.0f} VNĐ")
        print(f"  - Taxable subtotal (items with tax): {taxable_subtotal:,.0f} VNĐ")
        print(f"  - Tax rate: {tax_rate * 100}%")
        print(f"  - Tax amount: {tax_amount:,.0f} VNĐ")
        print(f"  - Total: {total_amount:,.0f} VNĐ")
        
        print(f"💰 Financial summary:")
        print(f"  - Subtotal: {subtotal:,.0f} VNĐ")
        print(f"  - Tax rate: {tax_rate * 100}%")
        print(f"  - Tax amount: {tax_amount:,.0f} VNĐ")
        print(f"  - Total: {total_amount:,.0f} VNĐ")
        
        # Generate quote number
        quote_number = f"BG{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
        
        # Prepare notes and terms
        notes_parts = []
        if analysis_data.get('notes'):
            notes_parts.append(analysis_data.get('notes'))
        if analysis_data.get('terms'):
            notes_parts.append(analysis_data.get('terms'))
        
        # Add import metadata
        import_metadata = []
        if created_by_name:
            import_metadata.append(f"Người tạo: {created_by_name}")
        elif current_user.email:
            import_metadata.append(f"Người tạo: {current_user.email}")
        if created_by:
            import_metadata.append(f"User ID: {created_by}")
        if employee_id:
            # Try to get employee name (employees table has first_name and last_name, not full_name)
            try:
                emp_result = supabase.table("employees").select("first_name, last_name").eq("id", employee_id).limit(1).execute()
                if emp_result.data and emp_result.data[0]:
                    first_name = emp_result.data[0].get('first_name', '')
                    last_name = emp_result.data[0].get('last_name', '')
                    full_name = f"{first_name} {last_name}".strip()
                    if full_name:
                        import_metadata.append(f"Nhân viên phụ trách: {full_name}")
            except Exception as e:
                print(f"⚠️ Could not get employee name: {e}")
                pass
        
        if import_metadata:
            notes_parts.append(f"\n[Import từ AI Analysis]\n" + "\n".join(import_metadata))
        
        notes = '\n\n'.join(notes_parts) if notes_parts else None
        
        # Parse dates
        issue_date = analysis_data.get('date')
        if issue_date:
            try:
                # Try parsing ISO format or other common formats
                if isinstance(issue_date, str):
                    issue_date = datetime.fromisoformat(issue_date.replace('Z', '+00:00')).date()
                elif isinstance(issue_date, date):
                    issue_date = issue_date
                else:
                    issue_date = datetime.now().date()
            except:
                issue_date = datetime.now().date()
        else:
            issue_date = datetime.now().date()
        
        # Parse valid_until date
        valid_until = analysis_data.get('valid_until')
        if valid_until:
            try:
                if isinstance(valid_until, str):
                    # Try to parse ISO format
                    valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00')).date()
                elif isinstance(valid_until, date):
                    valid_until = valid_until
                elif isinstance(valid_until, datetime):
                    valid_until = valid_until.date()
                else:
                    # Invalid type, use default
                    valid_until = (datetime.now() + timedelta(days=7)).date()
            except Exception as e:
                print(f"⚠️ Error parsing valid_until: {e}, using default")
                valid_until = (datetime.now() + timedelta(days=7)).date()
        else:
            # No valid_until provided, use default (7 days from now)
            valid_until = (datetime.now() + timedelta(days=7)).date()
        
        # Final check: ensure valid_until is always a valid date object
        if not valid_until or not isinstance(valid_until, date):
            print(f"⚠️ valid_until is invalid: {valid_until}, using default")
            valid_until = (datetime.now() + timedelta(days=7)).date()
        
        print(f"📅 Valid until date: {valid_until.isoformat()}")
        
        # Safely convert financial values to float
        subtotal_float = float(subtotal) if subtotal is not None else 0.0
        tax_rate_float = float(tax_rate) if tax_rate is not None else 0.08
        tax_amount_float = float(tax_amount) if tax_amount is not None else 0.0
        total_amount_float = float(total_amount) if total_amount is not None else 0.0
        
        quote_data = {
            "id": str(uuid.uuid4()),
            "quote_number": quote_number,
            "customer_id": customer_id,
            "project_id": project_id,
            "issue_date": issue_date.isoformat(),
            "expiry_date": valid_until.isoformat(),  # Use expiry_date as per schema
            "valid_until": valid_until.isoformat(),  # Also set valid_until in case schema has this column
            "subtotal": subtotal_float,
            "tax_rate": tax_rate_float,
            "tax_amount": tax_amount_float,
            "total_amount": total_amount_float,
            "currency": "VND",
            "status": "draft",
            "notes": notes,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Set employee_in_charge: priority: employee_id > supervisor from project > None
        quote_employee_id = None
        if employee_id:
            quote_employee_id = employee_id
            print(f"✅ Using provided employee_id for quote: {employee_id}")
        elif project_supervisor:
            # Try to find supervisor employee by name
            print(f"🔍 Searching for supervisor employee: {project_supervisor}")
            supervisor_employee = supabase.table("employees").select("id, first_name, last_name").or_(f"first_name.ilike.%{project_supervisor}%,last_name.ilike.%{project_supervisor}%").limit(1).execute()
            if supervisor_employee.data:
                quote_employee_id = supervisor_employee.data[0]['id']
                print(f"✅ Found supervisor employee: {supervisor_employee.data[0].get('first_name', '')} {supervisor_employee.data[0].get('last_name', '')} (ID: {quote_employee_id})")
            else:
                print(f"⚠️ Supervisor '{project_supervisor}' not found in employees table")
        
        if quote_employee_id:
            quote_data["employee_in_charge_id"] = quote_employee_id
        else:
            print(f"⚠️ No employee_in_charge_id set for quote (no employee_id or supervisor found)")
        
        print(f"📄 Creating quote:")
        print(f"  - Quote number: {quote_number}")
        print(f"  - Customer: {customer_id}")
        print(f"  - Project: {project_id}")
        print(f"  - Issue date: {issue_date}")
        print(f"  - Expiry date: {valid_until}")
        print(f"  - Items count: {len(quote_items)}")
        print(f"  - Created by: {created_by_name or current_user.email} (ID: {created_by or current_user.id})")
        print(f"  - Employee in charge: {employee_id}")
        
        quote_result = supabase.table("quotes").insert(quote_data).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=400,
                detail="Không thể tạo báo giá"
            )
        
        quote_id = quote_result.data[0]['id']
        created_quotes = 1
        
        # Create quote items with full details
        quote_item_records = []
        for idx, item in enumerate(quote_items):
            # Calculate total price
            # Formula: If dien_tich exists: unit_price × dien_tich × quantity
            # Otherwise: unit_price × quantity
            # Safely convert values to float, handling None
            quantity_val = item.get('quantity') or item.get('so_luong') or 1
            quantity = float(quantity_val) if quantity_val is not None else 1.0
            
            unit_price_val = item.get('unit_price') or item.get('don_gia') or 0
            unit_price = float(unit_price_val) if unit_price_val is not None else 0.0
            
            dien_tich = item.get('dien_tich')
            
            if dien_tich is not None and dien_tich != '':
                try:
                    dien_tich_float = float(dien_tich)
                    if dien_tich_float > 0:
                        # Use formula: đơn giá × diện tích × số lượng
                        total_price = unit_price * dien_tich_float * quantity
                        print(f"💰 Item {idx + 1}: Using formula (đơn giá × diện tích × số lượng): {unit_price} × {dien_tich_float} × {quantity} = {total_price}")
                    else:
                        # Use formula: đơn giá × số lượng
                        total_price = unit_price * quantity
                        print(f"💰 Item {idx + 1}: Using formula (đơn giá × số lượng): {unit_price} × {quantity} = {total_price}")
                except (ValueError, TypeError):
                    # Use formula: đơn giá × số lượng
                    total_price = unit_price * quantity
                    print(f"💰 Item {idx + 1}: Using formula (đơn giá × số lượng): {unit_price} × {quantity} = {total_price}")
            else:
                # Use formula: đơn giá × số lượng
                total_price = unit_price * quantity
                print(f"💰 Item {idx + 1}: Using formula (đơn giá × số lượng): {unit_price} × {quantity} = {total_price}")
            
            # Build comprehensive description with all details
            description_parts = []
            
            # Main description (hang_muc_thi_cong)
            main_desc = item.get('hang_muc_thi_cong') or item.get('description') or item.get('product_name', '')
            if main_desc:
                description_parts.append(main_desc)
            
            # Add ký hiệu if available
            if item.get('ky_hieu'):
                description_parts.append(f"Ký hiệu: {item['ky_hieu']}")
            
            # Add dimensions
            dim_parts = []
            if item.get('ngang'):
                dim_parts.append(f"Ngang: {item['ngang']}m")
            if item.get('cao'):
                dim_parts.append(f"Cao: {item['cao']}m")
            if item.get('dien_tich'):
                dim_parts.append(f"Diện tích: {item['dien_tich']}m²")
            if dim_parts:
                description_parts.append(f"Quy cách: {', '.join(dim_parts)}")
            
            # Add product type if available
            if item.get('loai_san_pham'):
                description_parts.append(f"Loại: {item['loai_san_pham']}")
            
            # Add detailed description (mo_ta) if available
            if item.get('mo_ta'):
                description_parts.append(f"Chi tiết: {item['mo_ta']}")
            
            # Join all parts
            full_description = '\n'.join(description_parts) if description_parts else item.get('description', '')
            
            # Get unit safely for quote_item
            quote_item_unit = item.get('unit')
            quote_item_unit = str(quote_item_unit).strip() if quote_item_unit else 'cái'
            if not quote_item_unit:
                quote_item_unit = 'cái'
            
            # Prepare quote item data - match structure used in create_quote endpoint
            # Note: tax_rate is handled at quote level, not item level
            # has_tax flag is used for calculating taxable_subtotal, not stored in quote_items
            # Use same columns as regular quote creation to ensure compatibility
            quote_item = {
                "id": str(uuid.uuid4()),
                "quote_id": quote_id,
                "product_service_id": item['product_id'],
                "name_product": product_name_short,  # Product name
                "description": full_description,
                "quantity": float(item['quantity']),
                "unit": quote_item_unit,  # Always has a value, never None
                "unit_price": float(item['unit_price']),
                "total_price": float(total_price),  # Use total_price (not line_total)
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Add optional dimension fields if available
            if item.get('dien_tich'):
                quote_item["area"] = float(item['dien_tich'])
            if item.get('cao'):
                quote_item["height"] = float(item['cao']) * 1000  # Convert m to mm
            if item.get('ngang'):
                quote_item["length"] = float(item['ngang']) * 1000  # Convert m to mm
            
            # Note: tax_rate is handled at quote level, not item level
            # Note: sort_order doesn't exist in actual schema, so we skip it
            
            quote_item_records.append(quote_item)
            
            print(f"📦 Quote item {idx + 1}: {item.get('product_name', 'N/A')} - Qty: {item['quantity']}, Price: {item['unit_price']}, Total: {total_price}")
        
        if quote_item_records:
            supabase.table("quote_items").insert(quote_item_records).execute()
        
        return {
            "success": True,
            "message": f"Import thành công. Đã tạo {created_customers} khách hàng, {created_projects} dự án, {created_quotes} báo giá, {created_products} sản phẩm mới. Sử dụng {len(matched_products)} sản phẩm có sẵn. Đã lưu {len(cost_items)} chi phí vật tư vào sản phẩm.",
            "createdCustomers": created_customers,
            "createdProjects": created_projects,
            "createdQuotes": created_quotes,
            "createdProducts": created_products,
            "matchedProducts": len(matched_products),
            "costItems": len(cost_items),
            "costItemsDetails": cost_items,
            "quoteId": quote_id,
            "quoteNumber": quote_number,
            "matchedProductDetails": matched_products,
            "newProductDetails": new_products
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi import từ phân tích AI: {str(e)}"
        )
