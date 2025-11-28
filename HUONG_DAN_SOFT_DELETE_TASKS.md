# Hướng Dẫn: Soft Delete và Khôi Phục Nhiệm Vụ/Nhóm

## 📋 Tổng Quan

Hệ thống đã được cập nhật để hỗ trợ **soft delete** (xóa mềm) với khả năng khôi phục:
- **Trong 24 giờ**: Có thể khôi phục nhiệm vụ/nhóm đã xóa
- **Sau 24 giờ**: Tự động xóa vĩnh viễn (không thể khôi phục)
- **Khi xóa**: Tự động xóa tất cả files trong storage

## 🔄 Quy Trình Xóa

### 1. Xóa Nhiệm Vụ

**Khi xóa nhiệm vụ:**
1. ✅ Set `deleted_at` = thời gian hiện tại (soft delete)
2. ✅ Xóa tất cả files đính kèm trong storage
3. ✅ Nhiệm vụ không hiển thị trong danh sách (filtered out)
4. ✅ Có thể khôi phục trong 24 giờ

**Files được xóa:**
- Tất cả files trong `Groups/{group_id}/Tasks/{task_id}/` hoặc `Tasks/{task_id}/`

### 2. Xóa Nhóm

**Khi xóa nhóm:**
1. ✅ Set `deleted_at` = thời gian hiện tại cho nhóm
2. ✅ Set `deleted_at` = thời gian hiện tại cho tất cả nhiệm vụ trong nhóm
3. ✅ Xóa avatar của nhóm: `Groups/{group_id}/avatar/avatar.{ext}`
4. ✅ Xóa tất cả files của các nhiệm vụ trong nhóm
5. ✅ Nhóm và nhiệm vụ không hiển thị trong danh sách
6. ✅ Có thể khôi phục trong 24 giờ

**Files được xóa:**
- Avatar: `Groups/{group_id}/avatar/avatar.{ext}`
- Tất cả files: `Groups/{group_id}/Tasks/{task_id}/*`

## 🔄 Quy Trình Khôi Phục

### Khôi Phục Nhiệm Vụ

**Endpoint:** `POST /api/tasks/{task_id}/restore`

**Yêu cầu:**
- Phải là Manager hoặc Admin
- Nhiệm vụ phải đã bị xóa (có `deleted_at`)
- Phải trong vòng 24 giờ kể từ khi xóa

**Kết quả:**
- Set `deleted_at` = NULL
- Nhiệm vụ xuất hiện lại trong danh sách
- **Lưu ý**: Files đã bị xóa không thể khôi phục (chỉ khôi phục record trong database)

### Khôi Phục Nhóm

**Endpoint:** `POST /api/tasks/groups/{group_id}/restore`

**Yêu cầu:**
- Phải là Manager hoặc Admin
- Nhóm phải đã bị xóa (có `deleted_at`)
- Phải trong vòng 24 giờ kể từ khi xóa

**Kết quả:**
- Set `deleted_at` = NULL cho nhóm
- Set `deleted_at` = NULL cho tất cả nhiệm vụ trong nhóm
- Nhóm và nhiệm vụ xuất hiện lại trong danh sách
- **Lưu ý**: Files đã bị xóa không thể khôi phục

## ⏰ Tự Động Xóa Vĩnh Viễn

### Background Job

Hệ thống tự động chạy cleanup job mỗi giờ để:
1. Tìm các nhiệm vụ/nhóm đã bị xóa hơn 24 giờ
2. Xóa vĩnh viễn khỏi database
3. Xóa các files còn sót lại trong storage (nếu có)

### Manual Cleanup

**Endpoint:** `POST /api/tasks/cleanup`

**Yêu cầu:**
- Phải là Manager hoặc Admin

**Kết quả:**
- Xóa vĩnh viễn tất cả nhiệm vụ/nhóm đã bị xóa hơn 24 giờ
- Trả về số lượng đã xóa

## 📊 Database Schema

### Migration SQL

```sql
-- File: database/migrations/add_soft_delete_to_tasks_and_groups.sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE task_groups
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_groups_deleted_at ON task_groups(deleted_at);
```

## 🔍 API Endpoints

### Xóa Nhiệm Vụ
```
DELETE /api/tasks/{task_id}
```
- Soft delete (set `deleted_at`)
- Xóa files trong storage
- Có thể khôi phục trong 24h

### Khôi Phục Nhiệm Vụ
```
POST /api/tasks/{task_id}/restore
```
- Chỉ hoạt động trong 24h
- Khôi phục record (không khôi phục files)

### Xóa Nhóm
```
DELETE /api/tasks/groups/{group_id}
```
- Soft delete nhóm và tất cả nhiệm vụ trong nhóm
- Xóa avatar và tất cả files
- Có thể khôi phục trong 24h

### Khôi Phục Nhóm
```
POST /api/tasks/groups/{group_id}/restore
```
- Chỉ hoạt động trong 24h
- Khôi phục nhóm và tất cả nhiệm vụ
- Không khôi phục files

### Cleanup (Manual)
```
POST /api/tasks/cleanup
```
- Xóa vĩnh viễn các record đã xóa hơn 24h
- Chỉ Manager/Admin

## ⚠️ Lưu Ý Quan Trọng

1. **Files không thể khôi phục**: Khi xóa nhiệm vụ/nhóm, files trong storage sẽ bị xóa ngay lập tức. Khôi phục chỉ khôi phục record trong database, không khôi phục files.

2. **Thời gian 24 giờ**: Sau 24 giờ, không thể khôi phục. Record sẽ bị xóa vĩnh viễn bởi cleanup job.

3. **Background Job**: Cleanup job chạy tự động mỗi giờ. Không cần cấu hình thêm.

4. **Filter tự động**: Tất cả các query đều tự động filter ra các record đã bị xóa (`deleted_at IS NULL`).

## 🛠️ Troubleshooting

### Không thể khôi phục sau 24h
**Nguyên nhân**: Đã quá 24 giờ kể từ khi xóa
**Giải pháp**: Không thể khôi phục, đã bị xóa vĩnh viễn

### Files không bị xóa
**Nguyên nhân**: Có thể do lỗi khi xóa file trong storage
**Giải pháp**: 
- Files sẽ được cleanup job xóa sau
- Hoặc có thể xóa thủ công từ Supabase Dashboard

### Cleanup job không chạy
**Nguyên nhân**: Backend không chạy hoặc có lỗi
**Giải pháp**: 
- Kiểm tra backend đang chạy
- Kiểm tra logs để xem lỗi
- Có thể gọi manual cleanup endpoint

## 📚 Tài Liệu Tham Khảo

- `database/migrations/add_soft_delete_to_tasks_and_groups.sql` - Migration SQL
- `backend/services/task_cleanup_service.py` - Cleanup service
- `backend/routers/tasks.py` - Task endpoints

