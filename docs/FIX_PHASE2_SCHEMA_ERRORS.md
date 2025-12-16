# 🔧 Fix Database Schema Errors cho Phase 2

## 📋 Vấn đề

Khi test Phase 2, phát hiện 2 lỗi database schema:

1. ❌ `column customers_1.company does not exist`
2. ❌ `Could not find the 'product_components' column of 'invoices'`

## ✅ Giải pháp

**KHÔNG XÓA CODE** - Các columns này CẦN THIẾT:
- `product_components`: Dùng để lưu **vật tư/chi phí** cho invoices và quotes
- `company`: Dùng để lưu **tên công ty** của khách hàng

**Giải pháp đúng**: **THÊM các columns vào database** bằng migration.

---

## 🚀 Cách fix

### Bước 1: Chạy migration

**File migration**: `database/migrations/add_missing_columns_for_phase2.sql`

**Cách chạy**:

#### Option 1: Qua Supabase Dashboard
1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy nội dung file `database/migrations/add_missing_columns_for_phase2.sql`
4. Paste và chạy

#### Option 2: Qua Supabase CLI
```bash
supabase migration new add_missing_columns_for_phase2
# Copy nội dung vào file migration mới
supabase db push
```

#### Option 3: Qua psql (nếu có direct access)
```bash
psql -h <your-db-host> -U <user> -d <database> -f database/migrations/add_missing_columns_for_phase2.sql
```

### Bước 2: Verify

Sau khi chạy migration, verify các columns đã được thêm:

```sql
-- Kiểm tra product_components trong invoices
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'product_components';

-- Kiểm tra product_components trong quotes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' AND column_name = 'product_components';

-- Kiểm tra company trong customers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'company';
```

### Bước 3: Test lại

```bash
python scripts/auto_test_phase2.py
```

---

## 📊 Chi tiết các columns

### 1. `invoices.product_components` (JSONB)

**Mục đích**: Lưu vật tư/chi phí cho hóa đơn

**Format**:
```json
[
  {
    "unit": "kg",
    "quantity": 100,
    "unit_price": 50000,
    "expense_object_id": "uuid-here"
  },
  {
    "unit": "m²",
    "quantity": 50,
    "unit_price": 200000,
    "expense_object_id": "uuid-here"
  }
]
```

**Index**: GIN index để query nhanh

### 2. `quotes.product_components` (JSONB)

**Mục đích**: Lưu vật tư/chi phí cho báo giá

**Format**: Tương tự `invoices.product_components`

**Index**: GIN index để query nhanh

### 3. `customers.company` (VARCHAR(255))

**Mục đích**: Lưu tên công ty của khách hàng (riêng biệt với `name`)

**Ví dụ**:
- `name`: "Nguyễn Văn A"
- `company`: "Công ty ABC" (nếu khách hàng đại diện cho công ty)

**Index**: B-tree index để search nhanh

---

## ✅ Sau khi fix

Sau khi chạy migration, các test case sau sẽ PASS:

- ✅ TC 2.2.2: Danh sách báo giá
- ✅ TC 2.3.1: Tạo hóa đơn
- ✅ TC 2.3.2: Danh sách hóa đơn
- ✅ TC 2.3.4: Ghi nhận thanh toán

---

## 📝 Lưu ý

1. **Migration đã có sẵn**: File `scripts/sql/add_product_components_to_quotes_invoices.sql` đã có, nhưng có thể chưa chạy
2. **Backup trước khi chạy**: Nên backup database trước khi chạy migration
3. **Test trên dev trước**: Nên test trên database dev trước khi chạy trên production

---

**Ngày tạo**: 2025-12-14  
**Phiên bản**: 1.0






