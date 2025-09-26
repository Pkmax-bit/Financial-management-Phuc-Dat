"""
Sales Management Router - Sales Center
Comprehensive sales management with quotes, invoices, sales receipts, and payments
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
from pydantic import BaseModel

from models.quote import Quote, QuoteCreate, QuoteUpdate, QuoteConvertToInvoice
from models.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItem
from models.sales_receipt import SalesReceipt, SalesReceiptCreate, SalesReceiptUpdate
from models.payment import Payment, PaymentCreate, PaymentUpdate, PaymentWithAllocations
from models.user import User
from utils.auth import get_current_user, require_manager_or_admin
from services.supabase_client import get_supabase_client

router = APIRouter()

# ============================================================================
# QUOTES MANAGEMENT - Báo giá
# ============================================================================

@router.get("/quotes", response_model=List[Quote])
async def get_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get all quotes with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("quotes").select("*")
        
        # Apply filters
        if search:
            query = query.or_(f"quote_number.ilike.%{search}%")
        
        if customer_id:
            query = query.eq("customer_id", customer_id)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination and ordering
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return [Quote(**quote) for quote in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quotes: {str(e)}"
        )

@router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific quote by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )
        
        return Quote(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quote: {str(e)}"
        )

@router.post("/quotes", response_model=Quote)
async def create_quote(
    quote_data: QuoteCreate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Create a new quote"""
    try:
        supabase = get_supabase_client()
        
        # Check if quote number already exists
        existing = supabase.table("quotes").select("id").eq("quote_number", quote_data.quote_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quote number already exists"
            )
        
        # Calculate tax amount
        tax_amount = quote_data.subtotal * (quote_data.tax_rate / 100)
        total_amount = quote_data.subtotal + tax_amount
        
        # Create quote record
        quote_dict = quote_data.dict()
        quote_dict["id"] = str(uuid.uuid4())
        quote_dict["tax_amount"] = tax_amount
        quote_dict["total_amount"] = total_amount
        quote_dict["created_by"] = current_user.id
        quote_dict["created_at"] = datetime.utcnow().isoformat()
        quote_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("quotes").insert(quote_dict).execute()
        
        if result.data:
            return Quote(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create quote: {str(e)}"
        )

@router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(
    quote_id: str,
    quote_data: QuoteUpdate,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update a quote"""
    try:
        supabase = get_supabase_client()
        
        # Check if quote exists
        existing = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
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
            return Quote(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update quote: {str(e)}"
        )

@router.post("/quotes/{quote_id}/send")
async def send_quote_to_customer(
    quote_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send quote to customer via email"""
    try:
        supabase = get_supabase_client()
        
        # Get quote
        quote_result = supabase.table("quotes").select("*").eq("id", quote_id).execute()
        if not quote_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )
        
        # Update quote status to sent
        update_data = {
            "status": "sent",
            "sent_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("quotes").update(update_data).eq("id", quote_id).execute()
        
        if result.data:
            # TODO: Add email sending functionality
            # background_tasks.add_task(send_quote_email, quote_data, customer_email)
            
            return {
                "message": "Quote sent successfully",
                "quote": result.data[0]
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send quote: {str(e)}"
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Check if quote is still valid
        if quote["status"] not in ["sent", "viewed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to accept quote"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quote not found"
            )
        
        quote = quote_result.data[0]
        
        # Check if quote can be converted
        if quote["status"] not in ["accepted", "sent", "viewed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
        
        # Create invoice from quote
        invoice_data = {
            "id": str(uuid.uuid4()),
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
            "items": quote["items"],
            "notes": quote["notes"],
            "terms_and_conditions": quote.get("terms_and_conditions"),
            "payment_terms": convert_data.payment_terms if convert_data else None,
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert invoice
        invoice_result = supabase.table("invoices").insert(invoice_data).execute()
        
        if invoice_result.data:
            # Update quote status to closed
            supabase.table("quotes").update({
                "status": "closed",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", quote_id).execute()
            
            return {
                "message": "Quote converted to invoice successfully",
                "invoice": invoice_result.data[0],
                "quote": quote_result.data[0]
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to convert quote to invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
    """Get all invoices with optional filtering"""
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("invoices").select("*")
        
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
        
        return [Invoice(**invoice) for invoice in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch invoices: {str(e)}"
        )

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific invoice by ID"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        return Invoice(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice number already exists"
            )
        
        # Calculate amounts
        tax_amount = invoice_data.subtotal * (invoice_data.tax_rate / 100)
        total_amount = invoice_data.subtotal + tax_amount - invoice_data.discount_amount
        
        # Create invoice record
        invoice_dict = invoice_data.dict()
        invoice_dict["id"] = str(uuid.uuid4())
        invoice_dict["tax_amount"] = tax_amount
        invoice_dict["total_amount"] = total_amount
        invoice_dict["created_by"] = current_user.id
        invoice_dict["created_at"] = datetime.utcnow().isoformat()
        invoice_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Set up recurring invoice
        if invoice_data.is_recurring and invoice_data.recurring_frequency:
            if invoice_data.recurring_frequency == "monthly":
                next_date = invoice_data.issue_date.replace(month=invoice_data.issue_date.month + 1)
            elif invoice_data.recurring_frequency == "quarterly":
                next_date = invoice_data.issue_date.replace(month=invoice_data.issue_date.month + 3)
            elif invoice_data.recurring_frequency == "yearly":
                next_date = invoice_data.issue_date.replace(year=invoice_data.issue_date.year + 1)
            
            invoice_dict["next_recurring_date"] = next_date.isoformat()
        
        result = supabase.table("invoices").insert(invoice_dict).execute()
        
        if result.data:
            return Invoice(**result.data[0])
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invoice: {str(e)}"
        )

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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Prepare update data
        update_dict = {k: v for k, v in invoice_data.dict().items() if v is not None}
        
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update invoice: {str(e)}"
        )

@router.post("/invoices/{invoice_id}/send")
async def send_invoice_to_customer(
    invoice_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_manager_or_admin)
):
    """Send invoice to customer via email"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not invoice_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Update invoice status to sent
        update_data = {
            "status": "sent",
            "sent_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("invoices").update(update_data).eq("id", invoice_id).execute()
        
        if result.data:
            # TODO: Add email sending functionality
            # background_tasks.add_task(send_invoice_email, invoice_data, customer_email)
            
            return {
                "message": "Invoice sent successfully",
                "invoice": result.data[0]
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send invoice"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payments: {str(e)}"
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
                status_code=status.HTTP_400_BAD_REQUEST,
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
                status_code=status.HTTP_400_BAD_REQUEST,
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
        
        return Payment(**payment_result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )

@router.put("/invoices/{invoice_id}/payment")
async def record_simple_payment(
    invoice_id: str,
    payment_amount: float,
    payment_method: str = "bank_transfer",
    payment_reference: Optional[str] = None,
    payment_date: Optional[date] = None,
    current_user: User = Depends(require_manager_or_admin)
):
    """Record a simple payment for a single invoice"""
    try:
        supabase = get_supabase_client()
        
        # Get invoice
        invoice_result = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
        if not invoice_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        invoice = invoice_result.data[0]
        current_paid = invoice["paid_amount"]
        new_paid = current_paid + payment_amount
        total_amount = invoice["total_amount"]
        
        # Validate payment amount
        if new_paid > total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
        
        # Create payment record
        payment_number = f"PAY-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        payment_data = {
            "id": str(uuid.uuid4()),
            "payment_number": payment_number,
            "customer_id": invoice["customer_id"],
            "invoice_ids": [invoice_id],
            "payment_date": (payment_date or datetime.now().date()).isoformat(),
            "amount": payment_amount,
            "currency": invoice["currency"],
            "payment_method": payment_method,
            "payment_reference": payment_reference,
            "status": "completed",
            "created_by": current_user.id,
            "processed_by": current_user.id,
            "processed_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert payment
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
            return {
                "message": "Payment recorded successfully",
                "invoice": invoice_result.data[0],
                "payment": payment_result.data[0] if payment_result.data else None
            }
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record payment"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record payment: {str(e)}"
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
                status_code=status.HTTP_400_BAD_REQUEST,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create sales receipt"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sales receipt: {str(e)}"
        )

@router.get("/test")
async def test_sales_endpoint():
    """Test endpoint to verify sales router is working"""
    return {"message": "Sales router is working!", "status": "success"}

@router.get("/dashboard/stats")
async def get_sales_dashboard_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get sales dashboard statistics"""
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
        
        # Get invoice statistics
        invoice_query = supabase.table("invoices").select("*")
        if date_filter:
            invoice_query = invoice_query.filter(date_filter)
        
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
        if date_filter:
            quote_query = quote_query.filter(date_filter)
        
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payment reminders: {str(e)}"
        )
