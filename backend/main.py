"""
Financial Management API - Main Application
FastAPI backend for financial management system
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Financial Management API",
    description="API for Financial Management System - Phuc Dat",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    """Health check endpoint"""
    return {"status": "healthy", "service": "financial-management-api"}

# Import routers
from routers import auth, employees, customers, sales, expenses, projects, reports, notifications, dashboard, sales_receipts, credit_memos, purchase_orders, expense_claims, budgeting, pl_report, balance_sheet, drill_down, cash_flow, cash_flow_vietnamese, sales_customer, expenses_vendor, general_ledger, project_reports, projects_financial, project_team, project_timeline, customer_view, project_expenses, emotions_comments, journal, expense_objects, expense_snapshots, expense_restore, system_feedback, product_import, material_adjustment_rules

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
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
app.include_router(product_import.router, prefix="/api/sales/products", tags=["Product Import"])
app.include_router(material_adjustment_rules.router, prefix="/api/material-adjustment-rules", tags=["Material Adjustment Rules"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="10.0.2.15",
        port=8000,
        reload=True,
        log_level="info"
    )
