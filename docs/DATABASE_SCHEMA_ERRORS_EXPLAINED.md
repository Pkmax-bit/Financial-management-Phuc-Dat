# 🔍 GIẢI THÍCH CHI TIẾT CÁC LỖI DATABASE SCHEMA

## 📋 Tổng quan

Các lỗi này xảy ra khi **code backend đang cố truy cập các columns không tồn tại** trong database. Đây là lỗi **mismatch giữa code và database schema**.

---

## ❌ LỖI 1: `column customers_1.company does not exist`

### 🔴 Mô tả lỗi
```
Status 500: Failed to fetch quotes: 
{'message': 'column customers_1.company does not exist', 
 'code': '42703', 'hint': None, 'details': None}
```

### 📍 Vị trí lỗi trong code

**File**: `backend/routers/sales.py`

**Các dòng có lỗi**:
- **Dòng 244**: Query quotes với join customers
- **Dòng 324**: Select customers với column `company`
- **Dòng 433**: Query quote detail với join customers
- **Dòng 2098**: Query invoices với join customers
- **Dòng 2219**: Query invoices khác với join customers

**Ví dụ code lỗi**:
```python
# Dòng 244 - Lỗi ở đây
query = supabase.table("quotes").select("""
    *,
    customers!quotes_customer_id_fkey(id, name, email, phone, company),  # ❌ company không tồn tại
    projects!quotes_project_id_fkey(id, name, project_code),
    quote_items(*)
""")

# Dòng 324 - Lỗi ở đây
customers_result = supabase.table("customers").select(
    "id, name, email, phone, company"  # ❌ company không tồn tại
).in_("id", list(customer_ids)).execute()
```

### 🔍 Nguyên nhân

**Database schema thực tế** (từ `database/schema.sql` và `database/create_all_tables.sql`):

```sql
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type customer_type NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    status customer_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**❌ KHÔNG CÓ column `company`!**

**Code đang cố select**: `company`  
**Database thực tế có**: `name`, `type`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, v.v.

### ✅ Cách fix

**Option 1: Xóa `company` khỏi query** (Khuyến nghị)

```python
# Sửa dòng 244
query = supabase.table("quotes").select("""
    *,
    customers!quotes_customer_id_fkey(id, name, email, phone),  # ✅ Bỏ company
    projects!quotes_project_id_fkey(id, name, project_code),
    quote_items(*)
""")

# Sửa dòng 324
customers_result = supabase.table("customers").select(
    "id, name, email, phone"  # ✅ Bỏ company
).in_("id", list(customer_ids)).execute()

# Sửa dòng 433, 2098, 2219 tương tự
```

**Option 2: Thêm column `company` vào database** (Nếu thực sự cần)

```sql
ALTER TABLE customers 
ADD COLUMN company VARCHAR(255);
```

**Option 3: Dùng `name` thay vì `company`** (Nếu `name` chứa tên công ty)

```python
# Thay vì
'company': customer_data.get('company')

# Dùng
'company': customer_data.get('name')  # Nếu name là tên công ty
```

---

## ❌ LỖI 2: `Could not find the 'product_components' column of 'invoices'`

### 🔴 Mô tả lỗi
```
Status 500: Failed to create invoice: 
{'message': "Could not find the 'product_components' column of 'invoices' in the schema cache", 
 'code': 'PGRST204', 'hint': None, 'details': None}
```

### 📍 Vị trí lỗi trong code

**File**: `backend/routers/sales.py` và `backend/models/invoice.py`

**Các dòng có lỗi**:
- Model `Invoice` có field `product_components: Optional[List[dict]] = None`
- Code đang cố insert/select `product_components` vào bảng `invoices`

**Ví dụ code lỗi**:
```python
# backend/models/invoice.py - Dòng 59
class Invoice(BaseModel):
    ...
    product_components: Optional[List[dict]] = None  # ❌ Column không tồn tại trong DB
    ...

# backend/routers/sales.py - Khi insert invoice
invoice_data = {
    ...
    'product_components': invoice.get('product_components'),  # ❌ Column không tồn tại
    ...
}
```

### 🔍 Nguyên nhân

**Database schema thực tế** - Bảng `invoices` KHÔNG có column `product_components`.

**Code đang cố insert**: `product_components` vào bảng `invoices`  
**Database thực tế**: Column này không tồn tại

**Lưu ý**: `product_components` có thể được lưu trong bảng `invoice_items` thay vì `invoices`.

### ✅ Cách fix

**Option 1: Loại bỏ `product_components` khỏi model Invoice** (Khuyến nghị)

```python
# backend/models/invoice.py
class Invoice(BaseModel):
    """Invoice model"""
    id: str
    invoice_number: str
    customer_id: str
    project_id: Optional[str] = None
    quote_id: Optional[str] = None
    issue_date: date
    due_date: date
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    total_amount: float
    currency: str = "VND"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_amount: float = 0.0
    paid_date: Optional[date] = None
    payment_date: Optional[date] = None
    items: Optional[List[dict]] = None  # ✅ product_components có thể ở trong items
    notes: Optional[str] = None
    created_by: Optional[str] = None
    # ❌ Xóa dòng này: product_components: Optional[List[dict]] = None
    reminder_sent_at: Optional[datetime] = None
    reminder_count: int = 0
    created_at: datetime
    updated_at: datetime
```

**Option 2: Không insert `product_components` vào bảng invoices**

```python
# backend/routers/sales.py - Khi tạo invoice
invoice_data = {
    'invoice_number': ...,
    'customer_id': ...,
    'subtotal': ...,
    'total_amount': ...,
    # ❌ Bỏ dòng này: 'product_components': invoice.get('product_components'),
    ...
}

# Nếu cần, lưu product_components vào invoice_items thay vì invoices
```

**Option 3: Thêm column `product_components` vào database** (Nếu thực sự cần)

```sql
ALTER TABLE invoices 
ADD COLUMN product_components JSONB;
```

---

## 📊 Tổng kết các lỗi

| Lỗi | File | Dòng | Column thiếu | Cách fix |
|-----|------|------|--------------|----------|
| `customers.company` | `backend/routers/sales.py` | 244, 324, 433, 2098, 2219 | `company` | Xóa khỏi query hoặc thêm column |
| `invoices.product_components` | `backend/models/invoice.py`<br>`backend/routers/sales.py` | Nhiều dòng | `product_components` | Xóa khỏi model/query hoặc thêm column |

---

## 🔧 Hướng dẫn fix nhanh

### Bước 1: Fix lỗi `customers.company`

1. Mở file `backend/routers/sales.py`
2. Tìm và thay thế tất cả `company` trong query customers:

```python
# Tìm
customers!quotes_customer_id_fkey(id, name, email, phone, company)

# Thay bằng
customers!quotes_customer_id_fkey(id, name, email, phone)
```

3. Tìm và thay thế:
```python
# Tìm
"id, name, email, phone, company"

# Thay bằng
"id, name, email, phone"
```

4. Tìm và xóa:
```python
# Tìm
'company': customer_data.get('company')

# Xóa hoặc thay bằng
# 'company': customer_data.get('name')  # Nếu cần
```

### Bước 2: Fix lỗi `invoices.product_components`

1. Mở file `backend/models/invoice.py`
2. Xóa hoặc comment dòng:
```python
# product_components: Optional[List[dict]] = None
```

3. Mở file `backend/routers/sales.py`
4. Tìm và xóa tất cả references đến `product_components` trong invoice operations

---

## ✅ Kiểm tra sau khi fix

1. **Chạy lại test Phase 2**:
```bash
python scripts/auto_test_phase2.py
```

2. **Kiểm tra các endpoints**:
- `GET /api/sales/quotes` - Không còn lỗi `customers.company`
- `GET /api/sales/invoices` - Không còn lỗi `customers.company`
- `POST /api/sales/invoices` - Không còn lỗi `product_components`

---

## 🎯 Kết luận

**Các lỗi này là do**:
- ✅ Code backend đang cố truy cập columns không tồn tại trong database
- ✅ Mismatch giữa model/query và database schema thực tế
- ✅ Có thể do migration chưa chạy hoặc schema đã thay đổi

**Cách fix**:
- ✅ Sửa code để match với database schema hiện tại
- ✅ Hoặc thêm columns vào database nếu thực sự cần

**Không phải lỗi test script** - Test script đang hoạt động đúng, chỉ phát hiện lỗi trong backend code.

---

**Ngày tạo**: 2025-12-14  
**Phiên bản**: 1.0








