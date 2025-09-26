"""
Additional Pydantic models for new database tables
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

# =====================================================
# CHAT MODELS
# =====================================================

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    context_data: Dict[str, Any] = {}

class ChatSession(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    context_data: Dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ChatMessageCreate(BaseModel):
    session_id: str
    message: str
    context_entities: List[Dict[str, Any]] = []

class ChatMessage(BaseModel):
    id: str
    session_id: str
    user_id: str
    message: str
    response: Optional[str] = None
    message_type: str = "user"
    tokens_used: int = 0
    response_time_ms: Optional[int] = None
    context_entities: List[Dict[str, Any]] = []
    created_at: datetime

# =====================================================
# BUDGET MODELS
# =====================================================

class BudgetType(str, Enum):
    PROJECT = "project"
    DEPARTMENT = "department" 
    ANNUAL = "annual"
    MONTHLY = "monthly"

class BudgetStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class BudgetCreate(BaseModel):
    name: str
    type: BudgetType
    entity_id: Optional[str] = None
    period_start: date
    period_end: date
    planned_amount: Decimal
    
class Budget(BaseModel):
    id: str
    name: str
    type: BudgetType
    entity_id: Optional[str] = None
    period_start: date
    period_end: date
    planned_amount: Decimal
    actual_amount: Decimal = Decimal('0')
    variance: Decimal = Decimal('0')
    status: BudgetStatus = BudgetStatus.ACTIVE
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BudgetItemCreate(BaseModel):
    budget_id: str
    category: str
    description: Optional[str] = None
    planned_amount: Decimal

class BudgetItem(BaseModel):
    id: str
    budget_id: str
    category: str
    description: Optional[str] = None
    planned_amount: Decimal
    actual_amount: Decimal = Decimal('0')
    created_at: datetime

# =====================================================
# CASH FLOW MODELS
# =====================================================

class CashFlowType(str, Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"

class CashFlowEntryCreate(BaseModel):
    date: date
    type: CashFlowType
    category: str
    amount: Decimal
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    bank_account_id: Optional[str] = None

class CashFlowEntry(BaseModel):
    id: str
    date: date
    type: CashFlowType
    category: str
    amount: Decimal
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    bank_account_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

# =====================================================
# APPROVAL MODELS
# =====================================================

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class ApprovalWorkflowCreate(BaseModel):
    name: str
    entity_type: str
    conditions: Dict[str, Any]
    steps: List[Dict[str, Any]]

class ApprovalWorkflow(BaseModel):
    id: str
    name: str
    entity_type: str
    conditions: Dict[str, Any]
    steps: List[Dict[str, Any]]
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class ApprovalRequestCreate(BaseModel):
    entity_type: str
    entity_id: str
    workflow_id: Optional[str] = None

class ApprovalRequest(BaseModel):
    id: str
    workflow_id: str
    entity_type: str
    entity_id: str
    requested_by: Optional[str] = None
    current_step: int = 1
    status: ApprovalStatus = ApprovalStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# =====================================================
# REPORT MODELS
# =====================================================

class ReportType(str, Enum):
    FINANCIAL = "financial"
    PROJECT = "project"
    CUSTOMER = "customer"
    EMPLOYEE = "employee"

class ReportTemplateCreate(BaseModel):
    name: str
    type: ReportType
    description: Optional[str] = None
    query_config: Dict[str, Any]
    chart_config: Optional[Dict[str, Any]] = None
    filters: List[Dict[str, Any]] = []
    schedule: Optional[Dict[str, Any]] = None
    is_public: bool = False

class ReportTemplate(BaseModel):
    id: str
    name: str
    type: ReportType
    description: Optional[str] = None
    query_config: Dict[str, Any]
    chart_config: Optional[Dict[str, Any]] = None
    filters: List[Dict[str, Any]] = []
    schedule: Optional[Dict[str, Any]] = None
    is_public: bool = False
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class GeneratedReportCreate(BaseModel):
    template_id: str
    name: str
    parameters: Dict[str, Any] = {}

class GeneratedReport(BaseModel):
    id: str
    template_id: str
    name: str
    parameters: Dict[str, Any] = {}
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    generation_time_ms: Optional[int] = None
    generated_by: Optional[str] = None
    generated_at: datetime

# =====================================================
# EMAIL MODELS
# =====================================================

class EmailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"

class EmailTemplateCreate(BaseModel):
    name: str
    type: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []

class EmailTemplate(BaseModel):
    id: str
    name: str
    type: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class EmailLogCreate(BaseModel):
    template_id: Optional[str] = None
    to_email: EmailStr
    cc_emails: Optional[List[EmailStr]] = []
    subject: str
    body: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None

class EmailLog(BaseModel):
    id: str
    template_id: Optional[str] = None
    to_email: EmailStr
    cc_emails: Optional[List[str]] = []
    subject: str
    body: str
    status: EmailStatus = EmailStatus.PENDING
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    created_at: datetime

# =====================================================
# INTEGRATION MODELS
# =====================================================

class IntegrationType(str, Enum):
    BANKING = "banking"
    PAYMENT = "payment"
    ACCOUNTING = "accounting"
    CRM = "crm"
    OTHER = "other"

class APIIntegrationCreate(BaseModel):
    name: str
    type: IntegrationType
    config: Dict[str, Any]
    credentials: Dict[str, Any]

class APIIntegration(BaseModel):
    id: str
    name: str
    type: IntegrationType
    config: Dict[str, Any]
    credentials: Dict[str, Any]  # Should be encrypted in real implementation
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    sync_status: str = "pending"
    error_message: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SyncLogCreate(BaseModel):
    integration_id: str
    sync_type: str
    status: str
    records_processed: int = 0
    records_success: int = 0
    records_failed: int = 0
    error_details: Optional[Dict[str, Any]] = None

class SyncLog(BaseModel):
    id: str
    integration_id: str
    sync_type: str
    status: str
    records_processed: int = 0
    records_success: int = 0
    records_failed: int = 0
    error_details: Optional[Dict[str, Any]] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

# =====================================================
# BANK ACCOUNT MODELS (Missing from original)
# =====================================================

class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"

class BankAccountCreate(BaseModel):
    account_name: str
    account_number: Optional[str] = None
    bank_name: str
    account_type: BankAccountType = BankAccountType.CHECKING
    balance: Decimal = Decimal('0')
    currency: str = "VND"
    is_primary: bool = False

class BankAccount(BaseModel):
    id: str
    account_name: str
    account_number: Optional[str] = None
    bank_name: str
    account_type: BankAccountType = BankAccountType.CHECKING
    balance: Decimal = Decimal('0')
    currency: str = "VND"
    is_primary: bool = False
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# =====================================================
# DASHBOARD MODELS
# =====================================================

class DashboardMetrics(BaseModel):
    period: str
    date: date
    daily_revenue: Optional[Decimal] = None
    daily_expenses: Optional[Decimal] = None
    monthly_revenue: Optional[Decimal] = None
    monthly_expenses: Optional[Decimal] = None
    overdue_invoices: int = 0
    active_projects: int = 0
    new_customers_today: Optional[int] = None
    new_customers_month: Optional[int] = None

class DashboardWidgetCreate(BaseModel):
    widget_type: str
    widget_config: Dict[str, Any]
    position_x: int = 0
    position_y: int = 0
    width: int = 4
    height: int = 3
    is_visible: bool = True
    refresh_interval: int = 300

class DashboardWidget(BaseModel):
    id: str
    user_id: str
    widget_type: str
    widget_config: Dict[str, Any]
    position_x: int = 0
    position_y: int = 0
    width: int = 4
    height: int = 3
    is_visible: bool = True
    refresh_interval: int = 300
    created_at: datetime
    updated_at: datetime

# =====================================================
# SYSTEM SETTINGS MODELS
# =====================================================

class SystemSettingCreate(BaseModel):
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None

class SystemSetting(BaseModel):
    id: str
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: datetime

# =====================================================
# RESPONSE MODELS
# =====================================================

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None