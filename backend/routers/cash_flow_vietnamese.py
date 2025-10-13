"""
Cash Flow Statement Router - Vietnamese Accounting Standards
Handles Cash Flow statement with Debit/Credit classification according to Vietnamese accounting standards
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from pydantic import BaseModel

from models.user import User
from utils.auth import get_current_user
from services.supabase_client import get_supabase_client

router = APIRouter()

# Vietnamese Chart of Accounts Classification
VIETNAMESE_ACCOUNTS = {
    # TÀI SẢN (ASSETS) - BÊN NỢ
    "cash_accounts": ["111", "112"],  # Tiền mặt, Tiền gửi ngân hàng
    "receivables": ["131", "133", "136", "138"],  # Phải thu khách hàng, phải thu khác
    "inventory": ["152", "153", "154"],  # Hàng tồn kho
    "fixed_assets": ["211", "213", "217"],  # Tài sản cố định
    "investments": ["121", "128"],  # Đầu tư tài chính
    
    # NỢ PHẢI TRẢ (LIABILITIES) - BÊN CÓ  
    "payables": ["331", "333", "334", "338"],  # Phải trả nhà cung cấp, thuế, lương
    "long_term_debt": ["341", "342"],  # Vay dài hạn
    
    # VỐN CHỦ SỞ HỮU (EQUITY) - BÊN CÓ
    "equity": ["411", "412", "413", "421"],  # Vốn chủ sở hữu, lợi nhuận
    
    # DOANH THU (REVENUE) - BÊN CÓ
    "revenue": ["511", "512", "515"],  # Doanh thu bán hàng, dịch vụ
    
    # CHI PHÍ (EXPENSES) - BÊN NỢ
    "expenses": ["632", "641", "642", "635"]  # Giá vốn, chi phí bán hàng, quản lý
}

class CashFlowItemVietnamese(BaseModel):
    """Cash Flow item with Vietnamese accounting classification"""
    item_name: str
    item_code: Optional[str] = None
    debit_amount: float = 0.0  # Bên nợ
    credit_amount: float = 0.0  # Bên có
    net_amount: float = 0.0  # Số dư ròng
    description: Optional[str] = None
    account_type: str  # "asset", "liability", "equity", "revenue", "expense"

class CashFlowSectionVietnamese(BaseModel):
    """Cash Flow section with Vietnamese format"""
    section_name: str
    section_type: str  # "operating", "investing", "financing"
    items: List[CashFlowItemVietnamese]
    total_debit: float = 0.0
    total_credit: float = 0.0
    net_cash_flow: float = 0.0

class CashFlowStatementVietnamese(BaseModel):
    """Complete Cash Flow Statement in Vietnamese format"""
    report_period: str
    start_date: date
    end_date: date
    currency: str = "VND"
    generated_at: datetime
    
    # Cash balances
    beginning_cash: float
    ending_cash: float
    net_change_in_cash: float
    
    # Sections
    operating_activities: CashFlowSectionVietnamese
    investing_activities: CashFlowSectionVietnamese
    financing_activities: CashFlowSectionVietnamese
    
    # Totals
    total_operating_cash_flow: float
    total_investing_cash_flow: float
    total_financing_cash_flow: float
    net_cash_flow: float
    
    # Validation
    cash_flow_validation: bool
    total_transactions: int

@router.get("/cash-flow-vietnamese", response_model=CashFlowStatementVietnamese)
async def get_cash_flow_statement_vietnamese(
    start_date: date = Query(..., description="Ngày bắt đầu báo cáo dòng tiền"),
    end_date: date = Query(..., description="Ngày kết thúc báo cáo dòng tiền"),
    # Temporarily disable authentication for testing
    # current_user: User = Depends(get_current_user)
):
    """
    Tạo báo cáo lưu chuyển tiền tệ theo chuẩn kế toán Việt Nam
    
    Phân loại theo:
    - Bên nợ (Debit): Tài sản, Chi phí
    - Bên có (Credit): Nợ phải trả, Vốn chủ sở hữu, Doanh thu
    """
    try:
        supabase = get_supabase_client()
        
        # Convert dates to ISO format
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get cash balances
        beginning_cash = await get_cash_balance_vietnamese(supabase, start_date_str, is_beginning=True)
        ending_cash = await get_cash_balance_vietnamese(supabase, end_date_str, is_beginning=False)
        net_change_in_cash = ending_cash - beginning_cash
        
        # Calculate sections
        operating_activities = await calculate_operating_activities_vietnamese(
            supabase, start_date_str, end_date_str
        )
        
        investing_activities = await calculate_investing_activities_vietnamese(
            supabase, start_date_str, end_date_str
        )
        
        financing_activities = await calculate_financing_activities_vietnamese(
            supabase, start_date_str, end_date_str
        )
        
        # Calculate totals
        total_operating_cash_flow = operating_activities.net_cash_flow
        total_investing_cash_flow = investing_activities.net_cash_flow
        total_financing_cash_flow = financing_activities.net_cash_flow
        net_cash_flow = total_operating_cash_flow + total_investing_cash_flow + total_financing_cash_flow
        
        # Validate cash flow
        cash_flow_validation = abs(net_cash_flow - net_change_in_cash) < 0.01
        
        # Get transaction count
        total_transactions = await get_transaction_count_vietnamese(supabase, start_date_str, end_date_str)
        
        # Create statement
        statement = CashFlowStatementVietnamese(
            report_period=f"Từ {start_date.strftime('%d/%m/%Y')} đến {end_date.strftime('%d/%m/%Y')}",
            start_date=start_date,
            end_date=end_date,
            currency="VND",
            generated_at=datetime.now(),
            
            beginning_cash=beginning_cash,
            ending_cash=ending_cash,
            net_change_in_cash=net_change_in_cash,
            
            operating_activities=operating_activities,
            investing_activities=investing_activities,
            financing_activities=financing_activities,
            
            total_operating_cash_flow=total_operating_cash_flow,
            total_investing_cash_flow=total_investing_cash_flow,
            total_financing_cash_flow=total_financing_cash_flow,
            net_cash_flow=net_cash_flow,
            
            cash_flow_validation=cash_flow_validation,
            total_transactions=total_transactions
        )
        
        return statement
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể tạo báo cáo dòng tiền: {str(e)}"
        )

async def get_cash_balance_vietnamese(supabase, date_str: str, is_beginning: bool = False) -> float:
    """Lấy số dư tiền mặt theo chuẩn Việt Nam"""
    try:
        # Get journal entries up to date
        query = supabase.table("journal_entries")\
            .select("id")\
            .eq("status", "posted")
        
        if is_beginning:
            query = query.lt("entry_date", date_str)
        else:
            query = query.lte("entry_date", date_str)
        
        journal_entries = query.execute()
        
        if not journal_entries.data:
            return 0.0
        
        # Get cash account balances (Debit - Credit for assets)
        entry_ids = [entry["id"] for entry in journal_entries.data]
        cash_lines = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .in_("account_code", VIETNAMESE_ACCOUNTS["cash_accounts"])\
            .execute()
        
        total_cash = sum(
            float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
            for line in cash_lines.data
        )
        
        return total_cash
        
    except Exception:
        return 0.0

async def calculate_operating_activities_vietnamese(supabase, start_date: str, end_date: str) -> CashFlowSectionVietnamese:
    """Tính dòng tiền từ hoạt động kinh doanh"""
    items = []
    
    # 1. Lợi nhuận ròng (từ P&L)
    net_income = await get_net_income_vietnamese(supabase, start_date, end_date)
    items.append(CashFlowItemVietnamese(
        item_name="Lợi nhuận ròng",
        debit_amount=0.0,
        credit_amount=abs(net_income) if net_income >= 0 else 0.0,
        net_amount=net_income,
        description="Từ báo cáo Kết quả Kinh doanh",
        account_type="revenue"
    ))
    
    # 2. Khấu hao và phân bổ (chi phí không dùng tiền mặt)
    depreciation = await get_depreciation_vietnamese(supabase, start_date, end_date)
    if depreciation > 0:
        items.append(CashFlowItemVietnamese(
            item_name="Khấu hao và phân bổ",
            debit_amount=0.0,
            credit_amount=depreciation,
            net_amount=depreciation,
            description="Chi phí không dùng tiền mặt",
            account_type="expense"
        ))
    
    # 3. Thay đổi tài sản lưu động
    current_asset_changes = await get_current_asset_changes_vietnamese(supabase, start_date, end_date)
    for account, change in current_asset_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=change if change > 0 else 0.0,
                credit_amount=abs(change) if change < 0 else 0.0,
                net_amount=change,
                description=f"Thay đổi trong {get_vietnamese_account_name(account)}",
                account_type="asset"
            ))
    
    # 4. Thay đổi nợ ngắn hạn
    current_liability_changes = await get_current_liability_changes_vietnamese(supabase, start_date, end_date)
    for account, change in current_liability_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=abs(change) if change < 0 else 0.0,
                credit_amount=change if change > 0 else 0.0,
                net_amount=change,
                description=f"Thay đổi trong {get_vietnamese_account_name(account)}",
                account_type="liability"
            ))
    
    # Calculate totals
    total_debit = sum(item.debit_amount for item in items)
    total_credit = sum(item.credit_amount for item in items)
    net_cash_flow = sum(item.net_amount for item in items)
    
    return CashFlowSectionVietnamese(
        section_name="Dòng tiền từ hoạt động kinh doanh",
        section_type="operating",
        items=items,
        total_debit=total_debit,
        total_credit=total_credit,
        net_cash_flow=net_cash_flow
    )

async def calculate_investing_activities_vietnamese(supabase, start_date: str, end_date: str) -> CashFlowSectionVietnamese:
    """Tính dòng tiền từ hoạt động đầu tư"""
    items = []
    
    # 1. Thay đổi tài sản cố định
    fixed_asset_changes = await get_fixed_asset_changes_vietnamese(supabase, start_date, end_date)
    for account, change in fixed_asset_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=change if change > 0 else 0.0,
                credit_amount=abs(change) if change < 0 else 0.0,
                net_amount=change,
                description=f"Giao dịch {get_vietnamese_account_name(account)}",
                account_type="asset"
            ))
    
    # 2. Thay đổi đầu tư tài chính
    investment_changes = await get_investment_changes_vietnamese(supabase, start_date, end_date)
    for account, change in investment_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=change if change > 0 else 0.0,
                credit_amount=abs(change) if change < 0 else 0.0,
                net_amount=change,
                description=f"Giao dịch {get_vietnamese_account_name(account)}",
                account_type="asset"
            ))
    
    # Calculate totals
    total_debit = sum(item.debit_amount for item in items)
    total_credit = sum(item.credit_amount for item in items)
    net_cash_flow = sum(item.net_amount for item in items)
    
    return CashFlowSectionVietnamese(
        section_name="Dòng tiền từ hoạt động đầu tư",
        section_type="investing",
        items=items,
        total_debit=total_debit,
        total_credit=total_credit,
        net_cash_flow=net_cash_flow
    )

async def calculate_financing_activities_vietnamese(supabase, start_date: str, end_date: str) -> CashFlowSectionVietnamese:
    """Tính dòng tiền từ hoạt động tài chính"""
    items = []
    
    # 1. Thay đổi vốn chủ sở hữu
    equity_changes = await get_equity_changes_vietnamese(supabase, start_date, end_date)
    for account, change in equity_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=abs(change) if change < 0 else 0.0,
                credit_amount=change if change > 0 else 0.0,
                net_amount=change,
                description=f"Giao dịch {get_vietnamese_account_name(account)}",
                account_type="equity"
            ))
    
    # 2. Thay đổi nợ dài hạn
    debt_changes = await get_debt_changes_vietnamese(supabase, start_date, end_date)
    for account, change in debt_changes.items():
        if abs(change) > 0.01:
            items.append(CashFlowItemVietnamese(
                item_name=f"Thay đổi {get_vietnamese_account_name(account)}",
                item_code=account,
                debit_amount=abs(change) if change < 0 else 0.0,
                credit_amount=change if change > 0 else 0.0,
                net_amount=change,
                description=f"Giao dịch {get_vietnamese_account_name(account)}",
                account_type="liability"
            ))
    
    # Calculate totals
    total_debit = sum(item.debit_amount for item in items)
    total_credit = sum(item.credit_amount for item in items)
    net_cash_flow = sum(item.net_amount for item in items)
    
    return CashFlowSectionVietnamese(
        section_name="Dòng tiền từ hoạt động tài chính",
        section_type="financing",
        items=items,
        total_debit=total_debit,
        total_credit=total_credit,
        net_cash_flow=net_cash_flow
    )

# Helper functions
async def get_net_income_vietnamese(supabase, start_date: str, end_date: str) -> float:
    """Lấy lợi nhuận ròng theo chuẩn Việt Nam"""
    try:
        # Get revenue (Credit side)
        revenue_accounts = VIETNAMESE_ACCOUNTS["revenue"]
        revenue_query = supabase.table("journal_entry_lines")\
            .select("credit_amount, debit_amount")\
            .in_("account_code", revenue_accounts)
        
        # Get journal entries in date range
        journal_entries = supabase.table("journal_entries")\
            .select("id")\
            .gte("entry_date", start_date)\
            .lte("entry_date", end_date)\
            .eq("status", "posted")\
            .execute()
        
        if journal_entries.data:
            entry_ids = [entry["id"] for entry in journal_entries.data]
            revenue_query = revenue_query.in_("entry_id", entry_ids)
        
        revenue_result = revenue_query.execute()
        total_revenue = sum(
            float(line["credit_amount"] or 0) - float(line["debit_amount"] or 0)
            for line in revenue_result.data
        )
        
        # Get expenses (Debit side)
        expense_accounts = VIETNAMESE_ACCOUNTS["expenses"]
        expense_query = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("account_code", expense_accounts)
        
        if journal_entries.data:
            expense_query = expense_query.in_("entry_id", entry_ids)
        
        expense_result = expense_query.execute()
        total_expenses = sum(
            float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
            for line in expense_result.data
        )
        
        return total_revenue - total_expenses
        
    except Exception:
        return 0.0

async def get_depreciation_vietnamese(supabase, start_date: str, end_date: str) -> float:
    """Lấy khấu hao và phân bổ"""
    # Simplified - would need more detailed tracking
    return 0.0

async def get_current_asset_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi tài sản lưu động"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["receivables"] + VIETNAMESE_ACCOUNTS["inventory"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_current_liability_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi nợ ngắn hạn"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["payables"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_fixed_asset_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi tài sản cố định"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["fixed_assets"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_investment_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi đầu tư tài chính"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["investments"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_equity_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi vốn chủ sở hữu"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["equity"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_debt_changes_vietnamese(supabase, start_date: str, end_date: str) -> Dict[str, float]:
    """Lấy thay đổi nợ dài hạn"""
    changes = {}
    
    for account in VIETNAMESE_ACCOUNTS["long_term_debt"]:
        beginning_balance = await get_account_balance_vietnamese(supabase, account, start_date, is_beginning=True)
        ending_balance = await get_account_balance_vietnamese(supabase, account, end_date, is_beginning=False)
        changes[account] = ending_balance - beginning_balance
    
    return changes

async def get_account_balance_vietnamese(supabase, account_code: str, date_str: str, is_beginning: bool = False) -> float:
    """Lấy số dư tài khoản theo chuẩn Việt Nam"""
    try:
        # Get journal entries up to date
        query = supabase.table("journal_entries")\
            .select("id")\
            .eq("status", "posted")
        
        if is_beginning:
            query = query.lt("entry_date", date_str)
        else:
            query = query.lte("entry_date", date_str)
        
        journal_entries = query.execute()
        
        if not journal_entries.data:
            return 0.0
        
        # Get account balance
        entry_ids = [entry["id"] for entry in journal_entries.data]
        account_lines = supabase.table("journal_entry_lines")\
            .select("debit_amount, credit_amount")\
            .in_("entry_id", entry_ids)\
            .eq("account_code", account_code)\
            .execute()
        
        # Calculate balance according to Vietnamese accounting
        if account_code.startswith(("1", "2")):  # Tài sản: Nợ - Có
            balance = sum(
                float(line["debit_amount"] or 0) - float(line["credit_amount"] or 0)
                for line in account_lines.data
            )
        else:  # Nợ phải trả và Vốn chủ sở hữu: Có - Nợ
            balance = sum(
                float(line["credit_amount"] or 0) - float(line["debit_amount"] or 0)
                for line in account_lines.data
            )
        
        return balance
        
    except Exception:
        return 0.0

async def get_transaction_count_vietnamese(supabase, start_date: str, end_date: str) -> int:
    """Lấy số lượng giao dịch"""
    try:
        journal_entries = supabase.table("journal_entries")\
            .select("id")\
            .gte("entry_date", start_date)\
            .lte("entry_date", end_date)\
            .eq("status", "posted")\
            .execute()
        
        return len(journal_entries.data)
        
    except Exception:
        return 0

def get_vietnamese_account_name(account_code: str) -> str:
    """Lấy tên tài khoản theo tiếng Việt"""
    account_names = {
        "111": "Tiền mặt",
        "112": "Tiền gửi ngân hàng",
        "131": "Phải thu khách hàng",
        "133": "Phải thu khác",
        "136": "Phải thu nội bộ",
        "138": "Phải thu khác",
        "152": "Hàng tồn kho",
        "153": "Công cụ, dụng cụ",
        "154": "Chi phí sản xuất, kinh doanh dở dang",
        "211": "Tài sản cố định hữu hình",
        "213": "Tài sản cố định vô hình",
        "217": "Tài sản cố định thuê tài chính",
        "121": "Đầu tư tài chính ngắn hạn",
        "128": "Đầu tư tài chính dài hạn",
        "331": "Phải trả nhà cung cấp",
        "333": "Thuế và các khoản phải nộp nhà nước",
        "334": "Phải trả người lao động",
        "338": "Phải trả, phải nộp khác",
        "341": "Vay dài hạn",
        "342": "Nợ dài hạn khác",
        "411": "Vốn đầu tư của chủ sở hữu",
        "412": "Thặng dư vốn cổ phần",
        "413": "Vốn khác của chủ sở hữu",
        "421": "Lợi nhuận chưa phân phối",
        "511": "Doanh thu bán hàng",
        "512": "Doanh thu cung cấp dịch vụ",
        "515": "Doanh thu hoạt động tài chính",
        "632": "Giá vốn hàng bán",
        "641": "Chi phí bán hàng",
        "642": "Chi phí quản lý doanh nghiệp",
        "635": "Chi phí tài chính"
    }
    
    return account_names.get(account_code, f"Tài khoản {account_code}")

@router.get("/cash-flow-vietnamese/summary")
async def get_cash_flow_summary_vietnamese(
    start_date: date = Query(..., description="Ngày bắt đầu"),
    end_date: date = Query(..., description="Ngày kết thúc"),
    # Temporarily disable authentication for testing
    # current_user: User = Depends(get_current_user)
):
    """Lấy tóm tắt báo cáo dòng tiền"""
    try:
        full_statement = await get_cash_flow_statement_vietnamese(start_date, end_date)
        
        return {
            "period": full_statement.report_period,
            "net_cash_flow": full_statement.net_cash_flow,
            "operating_cash_flow": full_statement.total_operating_cash_flow,
            "investing_cash_flow": full_statement.total_investing_cash_flow,
            "financing_cash_flow": full_statement.total_financing_cash_flow,
            "beginning_cash": full_statement.beginning_cash,
            "ending_cash": full_statement.ending_cash,
            "validation": full_statement.cash_flow_validation
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể tạo tóm tắt báo cáo dòng tiền: {str(e)}"
        )
