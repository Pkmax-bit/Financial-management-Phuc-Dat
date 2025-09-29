"""
Journal Entry model definitions for double-entry accounting
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from decimal import Decimal
import uuid

class TransactionType(str, Enum):
    """Types of transactions that can create journal entries"""
    INVOICE = "invoice"
    PAYMENT = "payment"
    SALES_RECEIPT = "sales_receipt"
    EXPENSE = "expense"
    EXPENSE_CLAIM = "expense_claim"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"

class JournalEntryStatus(str, Enum):
    """Status of journal entries"""
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"

class JournalEntryLine(BaseModel):
    """Individual line in a journal entry"""
    id: Optional[str] = None
    entry_id: str
    account_code: str
    account_name: str
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    description: Optional[str] = None
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    created_at: Optional[datetime] = None

class JournalEntry(BaseModel):
    """Journal Entry model for double-entry accounting"""
    id: Optional[str] = None
    entry_number: str
    entry_date: datetime
    description: str
    transaction_type: TransactionType
    transaction_id: str
    status: JournalEntryStatus = JournalEntryStatus.POSTED
    total_debit: float = 0.0
    total_credit: float = 0.0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    lines: Optional[List[JournalEntryLine]] = None

class JournalEntryCreate(BaseModel):
    """Create journal entry request"""
    entry_date: datetime
    description: str
    transaction_type: TransactionType
    transaction_id: str
    lines: List[JournalEntryLine]

class JournalEntryUpdate(BaseModel):
    """Update journal entry request"""
    description: Optional[str] = None
    status: Optional[JournalEntryStatus] = None
    lines: Optional[List[JournalEntryLine]] = None

# Chart of Accounts - Standard account codes
class ChartOfAccounts:
    """Standard chart of accounts for Vietnamese businesses"""
    
    # Assets (Tài sản)
    ASSETS_CASH = "101"  # Tiền mặt
    ASSETS_BANK = "102"  # Tiền gửi ngân hàng
    ASSETS_RECEIVABLE = "131"  # Phải thu khách hàng
    ASSETS_INVENTORY = "152"  # Hàng tồn kho
    ASSETS_FIXED = "211"  # Tài sản cố định
    
    # Liabilities (Nợ phải trả)
    LIABILITIES_PAYABLE = "331"  # Phải trả nhà cung cấp
    LIABILITIES_TAX = "333"  # Thuế và các khoản phải nộp nhà nước
    
    # Equity (Vốn chủ sở hữu)
    EQUITY_CAPITAL = "411"  # Vốn đầu tư của chủ sở hữu
    
    # Revenue (Doanh thu)
    REVENUE_SALES = "511"  # Doanh thu bán hàng
    REVENUE_SERVICES = "512"  # Doanh thu cung cấp dịch vụ
    
    # Expenses (Chi phí)
    EXPENSES_COGS = "632"  # Giá vốn hàng bán
    EXPENSES_OPERATING = "642"  # Chi phí quản lý doanh nghiệp
    EXPENSES_SALES = "641"  # Chi phí bán hàng

# Helper functions for creating journal entries
def create_invoice_journal_entry(invoice_data: dict, user_id: str) -> JournalEntryCreate:
    """Create journal entry for invoice creation"""
    entry_date = datetime.now()
    entry_number = f"JE-{entry_date.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    lines = [
        JournalEntryLine(
            account_code=ChartOfAccounts.ASSETS_RECEIVABLE,
            account_name="Phải thu khách hàng",
            debit_amount=invoice_data["total_amount"],
            credit_amount=0.0,
            description=f"Phát hành hóa đơn {invoice_data['invoice_number']}",
            reference_id=invoice_data["id"],
            reference_type="invoice"
        ),
        JournalEntryLine(
            account_code=ChartOfAccounts.REVENUE_SALES,
            account_name="Doanh thu bán hàng",
            debit_amount=0.0,
            credit_amount=invoice_data["total_amount"],
            description=f"Doanh thu từ hóa đơn {invoice_data['invoice_number']}",
            reference_id=invoice_data["id"],
            reference_type="invoice"
        )
    ]
    
    return JournalEntryCreate(
        entry_date=entry_date,
        description=f"Phát hành hóa đơn {invoice_data['invoice_number']}",
        transaction_type=TransactionType.INVOICE,
        transaction_id=invoice_data["id"],
        lines=lines
    )

def create_payment_journal_entry(payment_data: dict, user_id: str) -> JournalEntryCreate:
    """Create journal entry for payment receipt"""
    entry_date = datetime.now()
    entry_number = f"JE-{entry_date.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Determine cash/bank account based on payment method
    cash_account_code = ChartOfAccounts.ASSETS_CASH
    cash_account_name = "Tiền mặt"
    
    if payment_data["payment_method"].lower() in ["bank_transfer", "bank_transfer", "chuyển khoản"]:
        cash_account_code = ChartOfAccounts.ASSETS_BANK
        cash_account_name = "Tiền gửi ngân hàng"
    
    lines = [
        JournalEntryLine(
            account_code=cash_account_code,
            account_name=cash_account_name,
            debit_amount=payment_data["amount"],
            credit_amount=0.0,
            description=f"Thu tiền thanh toán {payment_data['payment_number']}",
            reference_id=payment_data["id"],
            reference_type="payment"
        ),
        JournalEntryLine(
            account_code=ChartOfAccounts.ASSETS_RECEIVABLE,
            account_name="Phải thu khách hàng",
            debit_amount=0.0,
            credit_amount=payment_data["amount"],
            description=f"Ghi nhận thanh toán {payment_data['payment_number']}",
            reference_id=payment_data["id"],
            reference_type="payment"
        )
    ]
    
    return JournalEntryCreate(
        entry_date=entry_date,
        description=f"Thu tiền thanh toán {payment_data['payment_number']}",
        transaction_type=TransactionType.PAYMENT,
        transaction_id=payment_data["id"],
        lines=lines
    )
