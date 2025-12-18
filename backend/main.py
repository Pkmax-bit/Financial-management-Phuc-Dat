"""
Financial Management API - Main Application
FastAPI backend for financial management system
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import asyncio
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Background task for cleanup
# DISABLED on free tier to save memory - enable only on paid plans
async def periodic_cleanup():
    """Periodically cleanup old deleted tasks and groups"""
    # Skip cleanup on free tier to prevent memory issues
    if os.getenv("ENVIRONMENT") == "production" and os.getenv("RENDER_PLAN") == "free":
        return  # Disable on free tier
    
    from services.task_cleanup_service import task_cleanup_service
    while True:
        try:
            await asyncio.sleep(7200)  # Run every 2 hours instead of 1 hour
            await task_cleanup_service.cleanup_old_deleted_items()
        except Exception as e:
            print(f"Cleanup error: {str(e)}")
            # Continue even if cleanup fails
            await asyncio.sleep(3600)  # Wait before retry

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup: Start background cleanup task (only if not free tier)
    cleanup_task = None
    if os.getenv("ENVIRONMENT") != "production" or os.getenv("RENDER_PLAN") != "free":
        cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # Shutdown: Cancel cleanup task
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

# Initialize FastAPI app
app = FastAPI(
    title="Financial Management API",
    description="API for Financial Management System - Phuc Dat",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware - Dynamic configuration based on environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Define allowed origins
if ENVIRONMENT == "production":
    # Production: Only allow specific frontend domains
    allowed_origins = [
        os.getenv("FRONTEND_URL", "https://your-frontend.onrender.com"),
        "https://financial-management-frontend.onrender.com",
        # Add your custom domain if you have one
        # "https://yourdomain.com",
    ]
else:
    # Development: Allow local development origins
    allowed_origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://0.0.0.0:3000",
        "http://0.0.0.0:3001",
    ]

# HTTPS Redirect Middleware (only in production, add first to execute last)
from middleware.https_redirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware, environment=ENVIRONMENT)

# Security Headers Middleware (add after HTTPS redirect, will execute before)
from middleware.security_headers import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware, environment=ENVIRONMENT)

# CORS middleware (add first, will execute last due to reverse order)
# Enhanced CORS configuration for better security
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After"
    ],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Request Signing Middleware (add after security headers, will execute before)
from middleware.request_signing import RequestSigningMiddleware
app.add_middleware(RequestSigningMiddleware, environment=ENVIRONMENT)

# Request ID Middleware (add after CORS, will execute before CORS)
from middleware.request_id import RequestIDMiddleware
app.add_middleware(RequestIDMiddleware)

# Error Handler Middleware (catch all exceptions to prevent crashes)
from middleware.error_handler import ErrorHandlerMiddleware
app.add_middleware(ErrorHandlerMiddleware)

# Rate Limiting Middleware (import and add after CORS, will execute before CORS)
from middleware.rate_limit import rate_limiter, get_rate_limit_config

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to all requests"""
    
    async def dispatch(self, request: Request, call_next):
        # Get rate limit configuration
        config = get_rate_limit_config()
        
        # Skip rate limiting if disabled
        if not config["enabled"]:
            return await call_next(request)
        
        # Skip rate limiting for health check and documentation endpoints
        skip_paths = ["/", "/health", "/docs", "/redoc", "/openapi.json"]
        if request.url.path in skip_paths:
            return await call_next(request)
        
        # Check rate limit
        try:
            rate_limiter.check_rate_limit(
                request,
                max_requests=config["max_requests"],
                window_seconds=config["window_seconds"]
            )
        except HTTPException as e:
            # Add CORS headers manually to rate limit error response
            # This ensures CORS works even when rate limit is exceeded
            from fastapi.responses import JSONResponse
            error_response = JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail},
                headers={
                    **e.headers,
                    "Access-Control-Allow-Origin": allowed_origins[0] if ENVIRONMENT == "production" and allowed_origins else "*",
                    "Access-Control-Allow-Credentials": "true",
                }
            )
            return error_response
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        client_ip = request.client.host if request.client else 'unknown'
        rate_info = rate_limiter.get_rate_limit_info(f"ip:{client_ip}", config["window_seconds"])
        
        response.headers["X-RateLimit-Limit"] = str(config["max_requests"])
        response.headers["X-RateLimit-Remaining"] = str(max(0, config["max_requests"] - rate_info["requests_count"]))
        
        return response

# Add rate limiting middleware (will execute before CORS due to reverse order)
app.add_middleware(RateLimitMiddleware)

# Security
security = HTTPBearer()

# Health check endpoint
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root endpoint - Health check"""
    return {
        "message": "Financial Management API is running!",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint for Render deployment - must be fast and always return 200"""
    # Simple health check - always return 200 quickly
    # Render needs a fast response to know the service is up
    return {
        "status": "healthy",
        "service": "financial-management-api",
        "version": "1.0.0"
    }

# Import routers
from routers import auth, employees, employee_excel, customers, sales, expenses, projects, reports, notifications, dashboard, sales_receipts, credit_memos, purchase_orders, expense_claims, budgeting, pl_report, balance_sheet, drill_down, cash_flow, cash_flow_vietnamese, sales_customer, expenses_vendor, general_ledger, project_reports, projects_financial, project_team, project_timeline, customer_view, project_expenses, emotions_comments, journal, expense_objects, expense_snapshots, expense_restore, system_feedback, product_import, material_adjustment_rules, file_upload, tasks, products, product_categories, chat, app_updates, qr_login

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(qr_login.router, prefix="/api/auth", tags=["QR Login"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(employee_excel.router, prefix="/api/employee-excel", tags=["Employee Excel"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(products.router, prefix="/api/sales", tags=["Products"])
# Alias endpoint for mobile app compatibility (/api/products-services)
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(product_categories.router, prefix="/api/sales", tags=["Product Categories"])
app.include_router(sales_receipts.router, prefix="/api/sales", tags=["Sales Receipts"])
app.include_router(credit_memos.router, tags=["Credit Memos"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(project_expenses.router, prefix="/api", tags=["Project Expenses"])
app.include_router(purchase_orders.router, tags=["Purchase Orders"])
app.include_router(expense_claims.router, tags=["Expense Claims"])
app.include_router(budgeting.router, tags=["Budgeting"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(projects_financial.router, prefix="/api/projects", tags=["Project Financial"])
app.include_router(project_team.router, prefix="/api", tags=["Project Team"])
app.include_router(project_timeline.router, prefix="/api", tags=["Project Timeline"])
app.include_router(project_reports.router, prefix="/api/reports", tags=["Project Reports"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(pl_report.router, prefix="/api/reports/financial", tags=["P&L Reports"])
app.include_router(balance_sheet.router, prefix="/api/reports/financial", tags=["Balance Sheet"])
app.include_router(drill_down.router, prefix="/api/reports/financial", tags=["Drill-Down Reports"])
app.include_router(cash_flow.router, prefix="/api/reports/financial", tags=["Cash Flow Statement"])
app.include_router(cash_flow_vietnamese.router, prefix="/api/reports/financial", tags=["Cash Flow Vietnamese"])
app.include_router(sales_customer.router, prefix="/api/reports/sales", tags=["Sales by Customer"])
app.include_router(expenses_vendor.router, prefix="/api/reports/expenses", tags=["Expenses by Vendor"])
app.include_router(general_ledger.router, prefix="/api/reports/accountant", tags=["General Ledger"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(customer_view.router, prefix="/api/customer-view", tags=["Customer View"])
app.include_router(emotions_comments.router, tags=["Emotions & Comments"])
app.include_router(journal.router, prefix="/api/accounting", tags=["Journal Entries"])
app.include_router(expense_objects.router, prefix="/api/expense-objects", tags=["Expense Objects"])
app.include_router(expense_snapshots.router, prefix="/api/expense-snapshots", tags=["Expense Snapshots"])
app.include_router(expense_restore.router, prefix="/api/expense-restore", tags=["Expense Restore"])
app.include_router(system_feedback.router, tags=["System Feedback"])
app.include_router(product_import.router, prefix="/api/sales/products/import", tags=["Product Import"])
app.include_router(material_adjustment_rules.router, prefix="/api/material-adjustment-rules", tags=["Material Adjustment Rules"])
app.include_router(file_upload.router, tags=["File Upload"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(chat.router, tags=["Internal Chat"])
app.include_router(app_updates.router, prefix="/api/app-updates", tags=["App Updates"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="10.0.2.15",
        port=8000,
        reload=True,
        log_level="info"
    )
