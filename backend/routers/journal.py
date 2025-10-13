from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/journal/entries")
async def list_journal_entries(status: Optional[str] = None, limit: int = 50):
	"""List journal entries (optionally filter by status)."""
	supabase = get_supabase_client()
	query = supabase.table("journal_entries").select("id, entry_number, entry_date, description, status, total_debit, total_credit").order("entry_date", desc=True).limit(limit)
	if status:
		query = query.eq("status", status)
	res = query.execute()
	return res.data or []

@router.get("/journal/entries/{entry_id}")
async def get_journal_entry(entry_id: str):
	"""Get a journal entry with its lines."""
	supabase = get_supabase_client()
	entry_res = supabase.table("journal_entries").select("*").eq("id", entry_id).single().execute()
	if not entry_res.data:
		raise HTTPException(status_code=404, detail="Journal entry not found")
	lines_res = supabase.table("journal_entry_lines").select("*").eq("entry_id", entry_id).order("created_at").execute()
	return {"entry": entry_res.data, "lines": lines_res.data or []}

@router.post("/journal/entries")
async def create_journal_entry(payload: Dict[str, Any]):
	"""Create a journal entry with lines.
	Expected payload: { entry_number?, entry_date, description, status?, lines: [{account_code, account_name?, debit_amount, credit_amount, description?}] }
	"""
	supabase = get_supabase_client()
	lines: List[Dict[str, Any]] = payload.get("lines", [])
	if not lines:
		raise HTTPException(status_code=400, detail="At least one line is required")
	# Basic validation: balanced
	total_debit = sum(float(l.get("debit_amount") or 0) for l in lines)
	total_credit = sum(float(l.get("credit_amount") or 0) for l in lines)
	if round(total_debit - total_credit, 2) != 0:
		raise HTTPException(status_code=400, detail="Entry is not balanced (debit != credit)")
	entry_data = {
		"entry_number": payload.get("entry_number") or f"JE-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
		"entry_date": payload.get("entry_date") or datetime.now().date().isoformat(),
		"description": payload.get("description") or "Manual journal entry",
		"transaction_type": payload.get("transaction_type") or "manual",
		"transaction_id": payload.get("transaction_id") or "00000000-0000-0000-0000-000000000000",
		"status": payload.get("status") or "posted",
		"total_debit": total_debit,
		"total_credit": total_credit,
	}
	entry_res = supabase.table("journal_entries").insert(entry_data).execute()
	if not entry_res.data:
		raise HTTPException(status_code=500, detail="Failed to create journal entry")
	entry_id = entry_res.data[0]["id"]
	# Insert lines
	prepared_lines = []
	for l in lines:
		prepared_lines.append({
			"entry_id": entry_id,
			"account_code": l["account_code"],
			"account_name": l.get("account_name") or f"Tài khoản {l['account_code']}",
			"debit_amount": float(l.get("debit_amount") or 0),
			"credit_amount": float(l.get("credit_amount") or 0),
			"description": l.get("description")
		})
	supabase.table("journal_entry_lines").insert(prepared_lines).execute()
	return {"id": entry_id, "entry_number": entry_data["entry_number"], "total_debit": total_debit, "total_credit": total_credit}

@router.post("/journal/entries/{entry_id}/post")
async def post_journal_entry(entry_id: str):
	"""Mark an entry as posted."""
	supabase = get_supabase_client()
	res = supabase.table("journal_entries").update({"status": "posted"}).eq("id", entry_id).execute()
	if not res.data:
		raise HTTPException(status_code=404, detail="Journal entry not found")
	return {"id": entry_id, "status": "posted"}

@router.post("/journal/entries/{entry_id}/unpost")
async def unpost_journal_entry(entry_id: str):
	"""Mark an entry as draft (unpost)."""
	supabase = get_supabase_client()
	res = supabase.table("journal_entries").update({"status": "draft"}).eq("id", entry_id).execute()
	if not res.data:
		raise HTTPException(status_code=404, detail="Journal entry not found")
	return {"id": entry_id, "status": "draft"}

