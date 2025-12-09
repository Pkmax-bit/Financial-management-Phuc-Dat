# 📋 Hướng Dẫn Sử Dụng Script Tạo Tất Cả Các Bảng

## 📁 File: `database/create_all_tables.sql`

Script này chứa **toàn bộ các bảng** trong database của hệ thống Financial Management.

---

## 📊 Danh Sách Các Bảng Được Tạo

### 1. **Core Tables** (Bảng cốt lõi)
- ✅ `users` - Người dùng
- ✅ `departments` - Phòng ban
- ✅ `positions` - Chức vụ
- ✅ `employees` - Nhân viên
- ✅ `customers` - Khách hàng
- ✅ `projects` - Dự án
- ✅ `expenses` - Chi phí
- ✅ `invoices` - Hóa đơn
- ✅ `vendors` - Nhà cung cấp
- ✅ `bills` - Hóa đơn nhà cung cấp
- ✅ `payments` - Thanh toán
- ✅ `time_entries` - Ghi nhận thời gian
- ✅ `activity_logs` - Nhật ký hoạt động
- ✅ `chat_history` - Lịch sử chat
- ✅ `user_chat_sessions` - Phiên chat người dùng

### 2. **AI Chat & Assistant Tables**
- ✅ `chat_sessions` - Phiên chat AI
- ✅ `chat_messages` - Tin nhắn chat

### 3. **Advanced Financial Tracking Tables**
- ✅ `budgets` - Ngân sách
- ✅ `budget_items` - Hạng mục ngân sách
- ✅ `cash_flow_entries` - Dòng tiền

### 4. **Task Management Tables**
- ✅ `task_groups` - Nhóm nhiệm vụ
- ✅ `task_group_members` - Thành viên nhóm
- ✅ `tasks` - Nhiệm vụ
- ✅ `task_assignments` - Phân công nhiệm vụ
- ✅ `task_participants` - Người tham gia
- ✅ `task_checklists` - Danh sách kiểm tra
- ✅ `task_checklist_items` - Mục danh sách kiểm tra
- ✅ `task_time_logs` - Ghi nhận thời gian
- ✅ `task_comments` - Bình luận nhiệm vụ
- ✅ `task_attachments` - File đính kèm
- ✅ `task_notifications` - Thông báo nhiệm vụ

### 5. **Products & Services Tables**
- ✅ `product_categories` - Danh mục sản phẩm
- ✅ `products` - Sản phẩm/Dịch vụ

### 6. **Quotes & Invoices Tables**
- ✅ `quotes` - Báo giá
- ✅ `quote_items` - Mục báo giá
- ✅ `invoice_items` - Mục hóa đơn

### 7. **Notifications Table**
- ✅ `notifications` - Thông báo hệ thống

### 8. **Workflow & Approvals Tables**
- ✅ `approval_workflows` - Quy trình phê duyệt
- ✅ `approval_requests` - Yêu cầu phê duyệt

### 9. **Reports & Templates Tables**
- ✅ `report_templates` - Mẫu báo cáo
- ✅ `generated_reports` - Báo cáo đã tạo

### 10. **Email & Communications Tables**
- ✅ `email_templates` - Mẫu email
- ✅ `email_logs` - Nhật ký email

### 11. **Integration & API Tables**
- ✅ `api_integrations` - Tích hợp API
- ✅ `sync_logs` - Nhật ký đồng bộ

---

## 🚀 Cách Sử Dụng

### Option 1: Chạy trực tiếp trong Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/create_all_tables.sql`
5. Paste vào SQL Editor
6. Click **Run** hoặc nhấn `Ctrl+Enter`

### Option 2: Chạy bằng psql

```bash
# Kết nối đến database
psql -h your-db-host -U postgres -d postgres -f database/create_all_tables.sql
```

### Option 3: Chạy bằng Supabase CLI

```bash
# Nếu đã setup Supabase CLI
supabase db reset
# Hoặc
supabase migration new create_all_tables
# Copy nội dung vào file migration mới
supabase db push
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. **Backup Database Trước Khi Chạy**
```sql
-- Backup database trước khi chạy script
pg_dump -h your-host -U postgres -d your-database > backup_before_create_tables.sql
```

### 2. **Script Sử Dụng `CREATE TABLE IF NOT EXISTS`**
- Script sẽ **KHÔNG** xóa dữ liệu hiện có
- Nếu bảng đã tồn tại, script sẽ bỏ qua
- An toàn để chạy nhiều lần

### 3. **Thứ Tự Tạo Bảng**
- Script đã được sắp xếp theo thứ tự phụ thuộc
- Bảng cha được tạo trước, bảng con được tạo sau
- Foreign keys được thiết lập đúng

### 4. **Indexes và Triggers**
- Script này **CHỈ** tạo các bảng
- Indexes và Triggers cần chạy từ file `database/schema.sql`
- RLS Policies cần chạy từ file `database/schema.sql` hoặc migrations

---

## 📝 Các Bước Tiếp Theo Sau Khi Tạo Bảng

### 1. Tạo Indexes
```sql
-- Chạy phần indexes từ database/schema.sql
-- Hoặc chạy database/migrations/add_performance_indexes.sql
```

### 2. Tạo Triggers
```sql
-- Chạy phần triggers từ database/schema.sql
-- Bao gồm:
-- - update_updated_at_column() function
-- - Các triggers cho updated_at
-- - Các triggers cho notifications
```

### 3. Enable RLS và Tạo Policies
```sql
-- Chạy phần RLS từ database/schema.sql
-- Hoặc từng migration file
```

### 4. Chạy Các Migration Bổ Sung
```bash
# Chạy các migration trong database/migrations/
# Ví dụ:
# - create_task_management_tables.sql (đã bao gồm trong script này)
# - create_payments_table.sql (đã bao gồm trong script này)
# - Các migration khác nếu cần
```

---

## 🔍 Kiểm Tra Sau Khi Chạy

### 1. Kiểm Tra Số Lượng Bảng
```sql
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

### 2. Kiểm Tra Các Bảng Đã Tạo
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 3. Kiểm Tra Foreign Keys
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

---

## 🐛 Xử Lý Lỗi

### Lỗi: "relation already exists"
- ✅ **Không sao** - Script sử dụng `IF NOT EXISTS`, sẽ bỏ qua bảng đã tồn tại
- Nếu muốn tạo lại, phải DROP bảng trước (⚠️ **MẤT DỮ LIỆU**)

### Lỗi: "type already exists"
- ✅ **Không sao** - Script sử dụng `DO $$ BEGIN ... EXCEPTION ... END $$` để xử lý
- Enum types sẽ được bỏ qua nếu đã tồn tại

### Lỗi: "foreign key constraint"
- Kiểm tra thứ tự tạo bảng
- Đảm bảo bảng cha đã được tạo trước

---

## 📚 Tài Liệu Tham Khảo

- `database/schema.sql` - Schema đầy đủ với indexes và triggers
- `database/schema_additional.sql` - Các bảng bổ sung
- `database/migrations/` - Các migration riêng lẻ
- `supabase/migrations/` - Supabase migrations

---

## ✅ Checklist

- [ ] Đã backup database
- [ ] Đã kiểm tra kết nối database
- [ ] Đã chạy script `create_all_tables.sql`
- [ ] Đã kiểm tra số lượng bảng
- [ ] Đã chạy indexes (nếu cần)
- [ ] Đã chạy triggers (nếu cần)
- [ ] Đã enable RLS và tạo policies (nếu cần)
- [ ] Đã test các chức năng cơ bản

---

**Lưu ý:** Script này chỉ tạo các bảng. Để có hệ thống hoàn chỉnh, cần chạy thêm:
1. Indexes (từ `schema.sql` hoặc migrations)
2. Triggers (từ `schema.sql` hoặc migrations)
3. RLS Policies (từ `schema.sql` hoặc migrations)
4. Sample data (nếu cần)



