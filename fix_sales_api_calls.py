#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re

print("=" * 60)
print("FIXING ALL SALES API CALLS")
print("=" * 60)

# Files to fix
files_to_fix = [
    "frontend/src/components/sales/CreateCreditMemoModal.tsx",
    "frontend/src/components/sales/CreditMemosTab.tsx", 
    "frontend/src/components/sales/CreateSalesReceiptModal.tsx",
    "frontend/src/components/sales/CreateQuoteModal.tsx",
    "frontend/src/components/sales/QuotesTab.tsx",
    "frontend/src/components/sales/CreatePaymentModal.tsx",
    "frontend/src/components/sales/PaymentsTab.tsx",
    "frontend/src/components/sales/CreateInvoiceModal.tsx"
]

# API endpoints that need fixing
api_endpoints = [
    "/api/customers",
    "/api/sales/invoices", 
    "/api/sales/credit-memos",
    "/api/products",
    "/api/sales/quotes",
    "/api/sales/payments",
    "/api/sales/payments/next-number"
]

print("\n1. FILES TO FIX:")
for file in files_to_fix:
    print(f"   - {file}")

print("\n2. API ENDPOINTS TO FIX:")
for endpoint in api_endpoints:
    print(f"   - {endpoint}")

print("\n3. REPLACEMENT RULE:")
print("   '/api/...' -> 'http://localhost:8000/api/...'")

print("\n4. MANUAL FIXES NEEDED:")
print("   - Open each file")
print("   - Find all apiGet('/api/...')")
print("   - Replace with apiGet('http://localhost:8000/api/...')")
print("   - Same for apiPost, apiPut, apiDelete")

print("\n5. QUICK FIX COMMANDS:")
for file in files_to_fix:
    print(f"   - {file}")

print("\n" + "=" * 60)
print("ALTERNATIVE: CREATE API_BASE_URL CONSTANT")
print("=" * 60)
print("Instead of fixing each call, we can:")
print("1. Create a constant: const API_BASE_URL = 'http://localhost:8000'")
print("2. Use: apiGet(`${API_BASE_URL}/api/sales/invoices`)")
print("3. This is cleaner and easier to maintain")

print("\n" + "=" * 60)
print("RECOMMENDED APPROACH:")
print("=" * 60)
print("1. Update api.ts to use full URLs by default")
print("2. Or create a helper function for sales API calls")
print("3. Or fix each file manually")
print("=" * 60)
