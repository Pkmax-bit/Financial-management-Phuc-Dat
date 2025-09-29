"""
Journal Entry Service for Double-Entry Accounting
Handles creation and management of journal entries
"""

from typing import List, Optional
from datetime import datetime
import uuid
from services.supabase_client import get_supabase_client
from models.journal_entry import (
    JournalEntry, JournalEntryCreate, JournalEntryLine,
    TransactionType, ChartOfAccounts
)

class JournalService:
    """Service for managing journal entries"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def create_journal_entry(self, entry_data: JournalEntryCreate, user_id: str) -> JournalEntry:
        """Create a new journal entry with lines"""
        try:
            # Generate entry number
            entry_number = f"JE-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Calculate totals
            total_debit = sum(line.debit_amount for line in entry_data.lines)
            total_credit = sum(line.credit_amount for line in entry_data.lines)
            
            # Validate double-entry accounting
            if abs(total_debit - total_credit) > 0.01:
                raise ValueError(f"Journal entry not balanced: Debit {total_debit} != Credit {total_credit}")
            
            # Create journal entry
            entry_dict = {
                "id": str(uuid.uuid4()),
                "entry_number": entry_number,
                "entry_date": entry_data.entry_date.isoformat(),
                "description": entry_data.description,
                "transaction_type": entry_data.transaction_type.value,
                "transaction_id": entry_data.transaction_id,
                "status": "posted",
                "total_debit": total_debit,
                "total_credit": total_credit,
                "created_by": user_id,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Insert journal entry
            entry_result = self.supabase.table("journal_entries").insert(entry_dict).execute()
            
            if not entry_result.data:
                raise Exception("Failed to create journal entry")
            
            entry_id = entry_result.data[0]["id"]
            
            # Create journal entry lines
            lines_data = []
            for line in entry_data.lines:
                line_dict = {
                    "id": str(uuid.uuid4()),
                    "entry_id": entry_id,
                    "account_code": line.account_code,
                    "account_name": line.account_name,
                    "debit_amount": line.debit_amount,
                    "credit_amount": line.credit_amount,
                    "description": line.description,
                    "reference_id": line.reference_id,
                    "reference_type": line.reference_type,
                    "created_at": datetime.now().isoformat()
                }
                lines_data.append(line_dict)
            
            # Insert journal entry lines
            if lines_data:
                self.supabase.table("journal_entry_lines").insert(lines_data).execute()
            
            # Return created entry
            return JournalEntry(**entry_result.data[0])
            
        except Exception as e:
            raise Exception(f"Error creating journal entry: {str(e)}")
    
    async def create_invoice_journal_entry(self, invoice_data: dict, user_id: str) -> JournalEntry:
        """Create journal entry for invoice creation"""
        try:
            # Create journal entry lines for invoice
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
            
            entry_data = JournalEntryCreate(
                entry_date=datetime.now(),
                description=f"Phát hành hóa đơn {invoice_data['invoice_number']}",
                transaction_type=TransactionType.INVOICE,
                transaction_id=invoice_data["id"],
                lines=lines
            )
            
            return await self.create_journal_entry(entry_data, user_id)
            
        except Exception as e:
            raise Exception(f"Error creating invoice journal entry: {str(e)}")
    
    async def create_payment_journal_entry(self, payment_data: dict, user_id: str) -> JournalEntry:
        """Create journal entry for payment receipt"""
        try:
            # Determine cash/bank account based on payment method
            cash_account_code = ChartOfAccounts.ASSETS_CASH
            cash_account_name = "Tiền mặt"
            
            if payment_data["payment_method"].lower() in ["bank_transfer", "chuyển khoản", "bank_transfer"]:
                cash_account_code = ChartOfAccounts.ASSETS_BANK
                cash_account_name = "Tiền gửi ngân hàng"
            
            # Create journal entry lines for payment
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
            
            entry_data = JournalEntryCreate(
                entry_date=datetime.now(),
                description=f"Thu tiền thanh toán {payment_data['payment_number']}",
                transaction_type=TransactionType.PAYMENT,
                transaction_id=payment_data["id"],
                lines=lines
            )
            
            return await self.create_journal_entry(entry_data, user_id)
            
        except Exception as e:
            raise Exception(f"Error creating payment journal entry: {str(e)}")
    
    async def get_journal_entries_by_transaction(self, transaction_type: str, transaction_id: str) -> List[JournalEntry]:
        """Get journal entries for a specific transaction"""
        try:
            result = self.supabase.table("journal_entries").select("*").eq("transaction_type", transaction_type).eq("transaction_id", transaction_id).execute()
            
            return [JournalEntry(**entry) for entry in result.data]
            
        except Exception as e:
            raise Exception(f"Error fetching journal entries: {str(e)}")
    
    async def reverse_journal_entry(self, entry_id: str, user_id: str) -> JournalEntry:
        """Reverse a journal entry by creating a reversing entry"""
        try:
            # Get original entry
            original_result = self.supabase.table("journal_entries").select("*").eq("id", entry_id).execute()
            if not original_result.data:
                raise Exception("Journal entry not found")
            
            original_entry = original_result.data[0]
            
            # Get original lines
            lines_result = self.supabase.table("journal_entry_lines").select("*").eq("entry_id", entry_id).execute()
            
            # Create reversing entry
            reversing_lines = []
            for line in lines_result.data:
                reversing_lines.append(JournalEntryLine(
                    account_code=line["account_code"],
                    account_name=line["account_name"],
                    debit_amount=line["credit_amount"],  # Swap debit/credit
                    credit_amount=line["debit_amount"],  # Swap debit/credit
                    description=f"Đảo ngược: {line['description']}",
                    reference_id=line["reference_id"],
                    reference_type=line["reference_type"]
                ))
            
            reversing_entry_data = JournalEntryCreate(
                entry_date=datetime.now(),
                description=f"Đảo ngược bút toán {original_entry['entry_number']}",
                transaction_type=TransactionType.ADJUSTMENT,
                transaction_id=entry_id,
                lines=reversing_lines
            )
            
            # Create reversing entry
            reversing_entry = await self.create_journal_entry(reversing_entry_data, user_id)
            
            # Update original entry status
            self.supabase.table("journal_entries").update({"status": "reversed"}).eq("id", entry_id).execute()
            
            return reversing_entry
            
        except Exception as e:
            raise Exception(f"Error reversing journal entry: {str(e)}")

# Global instance
journal_service = JournalService()
