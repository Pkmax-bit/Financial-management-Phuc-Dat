# Tóm tắt: Cập nhật Snapshot với Project Validation

## Vấn đề hiện tại
- Nút "Quay lại" hiển thị cho tất cả snapshot, không phân biệt dự án
- Cần lưu ID chi phí cha, chi phí con riêng biệt để truy vấn nhanh
- Cần validate snapshot thuộc đúng dự án

## Giải pháp đã thực hiện

### 1. ✅ Database Schema Update
**File**: `update_snapshot_schema.sql`
```sql
-- Thêm cột mới
ALTER TABLE public.expense_snapshots 
ADD COLUMN IF NOT EXISTS parent_expense_id UUID,
ADD COLUMN IF NOT EXISTS child_expense_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID;

-- Thêm indexes
CREATE INDEX IF NOT EXISTS idx_expense_snapshots_parent_id 
  ON public.expense_snapshots USING btree (parent_expense_id);
```

### 2. ✅ Backend Logic Update
**File**: `backend/services/auto_snapshot_service.py`
- Lưu `parent_expense_id`, `child_expense_id`, `project_id` khi tạo snapshot
- Query trực tiếp bằng `parent_expense_id` thay vì parse JSON
- Validate project_id trong `get_latest_auto_snapshot`

### 3. ✅ Frontend Logic Update
**File**: `frontend/src/components/expenses/SnapshotStatusIndicator.tsx`
- Thêm prop `projectId?: string`
- Validate snapshot thuộc đúng dự án trước khi hiển thị nút "Quay lại"
- Sử dụng latest-snapshot endpoint để kiểm tra project_id

**File**: `frontend/src/components/expenses/ProjectExpensesTab.tsx`
- Truyền `projectId={expense.project_id}` vào SnapshotStatusIndicator

## Cách thực hiện

### Bước 1: Chạy Database Migration
```bash
# Xem SQL cần chạy
python run_snapshot_schema_update.py
```

Sau đó chạy SQL trong Supabase Dashboard:
1. Vào https://supabase.com/dashboard
2. Chọn project → SQL Editor
3. Paste và chạy nội dung từ `update_snapshot_schema.sql`

### Bước 2: Kiểm tra Schema
```sql
-- Kiểm tra cột mới
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expense_snapshots' 
AND column_name IN ('parent_expense_id', 'child_expense_id', 'project_id');
```

### Bước 3: Test Functionality
1. Tạo chi phí cha trong dự án A
2. Tạo chi phí con → snapshot được tạo với project_id = A
3. Chuyển sang dự án B
4. Kiểm tra nút "Quay lại" không hiển thị cho chi phí cha của dự án A
5. Quay lại dự án A → nút "Quay lại" hiển thị

## Lợi ích

### Performance
- **Trước**: Parse JSON để tìm parent/child IDs
- **Sau**: Query trực tiếp bằng `parent_expense_id`

### Accuracy  
- **Trước**: Có thể hiển thị nút "Quay lại" cho snapshot của dự án khác
- **Sau**: Chỉ hiển thị cho snapshot thuộc đúng dự án

### Maintainability
- **Trước**: Logic phức tạp trong JSON parsing
- **Sau**: Logic đơn giản với foreign keys

## Kết quả mong đợi

Sau khi hoàn thành:
1. ✅ Snapshot được tạo với `parent_expense_id`, `child_expense_id`, `project_id`
2. ✅ Nút "Quay lại" chỉ hiển thị cho đúng dự án
3. ✅ Query performance tốt hơn
4. ✅ Logic đơn giản và dễ maintain

## Files đã tạo/cập nhật

### Database
- `update_snapshot_schema.sql` - SQL migration
- `run_snapshot_schema_update.py` - Script chạy migration

### Backend
- `backend/services/auto_snapshot_service.py` - Cập nhật logic lưu snapshot

### Frontend  
- `frontend/src/components/expenses/SnapshotStatusIndicator.tsx` - Thêm projectId validation
- `frontend/src/components/expenses/ProjectExpensesTab.tsx` - Truyền projectId

### Documentation
- `SNAPSHOT_SCHEMA_UPDATE_GUIDE.md` - Hướng dẫn chi tiết
- `SNAPSHOT_PROJECT_VALIDATION_SUMMARY.md` - Tóm tắt này

## Next Steps
1. Chạy database migration
2. Test tính năng
3. Verify nút "Quay lại" chỉ hiển thị cho đúng dự án
