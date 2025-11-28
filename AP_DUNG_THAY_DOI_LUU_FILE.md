# Hướng Dẫn Áp Dụng Thay Đổi Lưu File

## 📋 Tổng Quan Các Thay Đổi

Đã cập nhật hệ thống để lưu file theo cấu trúc:
- **Task attachments**: `Groups/{group_id}/Tasks/{task_id}/{filename}`
- **Group avatar**: `Groups/{group_id}/avatar/avatar.{ext}`

## ✅ Các Bước Áp Dụng

### Bước 1: Chạy Database Migration

Chạy migration để thêm cột `original_file_name`:

```sql
-- File: database/migrations/add_original_filename_to_task_attachments.sql
ALTER TABLE task_attachments
ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);

UPDATE task_attachments
SET original_file_name = file_name
WHERE original_file_name IS NULL;
```

**Cách chạy:**
1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung file `database/migrations/add_original_filename_to_task_attachments.sql`
3. Paste và chạy query

### Bước 2: Kiểm Tra Backend Code

Các file đã được cập nhật:
- ✅ `backend/routers/tasks.py` - Upload task attachments và group avatar
- ✅ `backend/services/file_upload_service.py` - Hỗ trợ custom filename

**Không cần restart backend** nếu đang chạy với auto-reload.

### Bước 3: Kiểm Tra Frontend Code

Các file đã được cập nhật:
- ✅ `frontend/src/app/tasks/[taskId]/page.tsx` - Hiển thị tên file gốc và icon
- ✅ `frontend/src/types/task.ts` - Thêm `original_file_name` vào interface

**Cần rebuild frontend:**
```bash
cd frontend
npm run build
```

### Bước 4: Test Chức Năng

#### Test 1: Tạo Nhiệm Vụ với File
1. Tạo một nhiệm vụ mới trong một nhóm
2. Upload file đính kèm (PDF, Excel, Word, v.v.)
3. Kiểm tra:
   - File được lưu trong: `Groups/{group_id}/Tasks/{task_id}/`
   - Tên file hiển thị là tên gốc (không có task_id)
   - Icon hiển thị đúng theo loại file

#### Test 2: Tạo Nhóm với Avatar
1. Tạo một nhóm mới
2. Upload avatar cho nhóm
3. Kiểm tra:
   - Avatar được lưu trong: `Groups/{group_id}/avatar/avatar.{ext}`
   - Avatar hiển thị đúng trong giao diện

#### Test 3: Xem Chi Tiết Nhiệm Vụ
1. Mở một nhiệm vụ có file đính kèm
2. Kiểm tra:
   - Tên file hiển thị là tên gốc
   - Icon hiển thị đúng (Excel → FileSpreadsheet, Word → FileType, PDF → FileText)
   - Có thể download file

## 🔍 Kiểm Tra Cấu Trúc Storage

Sau khi test, kiểm tra trong Supabase Dashboard:

1. Vào **Storage** → **Buckets** → `minhchung_chiphi`
2. Kiểm tra cấu trúc:
   ```
   Groups/
   ├── {group_id_1}/
   │   ├── avatar/
   │   │   └── avatar.jpg
   │   └── Tasks/
   │       └── {task_id}/
   │           └── {filename}_{task_id}.{ext}
   ├── {group_id_2}/
   │   └── ...
   └── Temp/  (tạm thời cho avatar khi tạo group mới)
   ```

## ⚠️ Lưu Ý

1. **File cũ**: Các file upload trước khi áp dụng thay đổi vẫn ở vị trí cũ (`Tasks/{task_id}/`)
   - Chúng vẫn hoạt động bình thường
   - Có thể migrate sau nếu cần

2. **Migration**: Phải chạy migration SQL để thêm cột `original_file_name`
   - Nếu không chạy, file mới sẽ không có `original_file_name`
   - Frontend sẽ fallback về `file_name` (tên storage)

3. **Avatar cũ**: Avatar upload trước sẽ vẫn ở vị trí cũ
   - Vẫn hoạt động bình thường
   - Khi update avatar mới, sẽ được lưu vào đúng vị trí

## 🐛 Troubleshooting

### Lỗi: "column original_file_name does not exist"
**Nguyên nhân**: Chưa chạy migration SQL
**Giải pháp**: Chạy file `database/migrations/add_original_filename_to_task_attachments.sql`

### Lỗi: File không hiển thị tên gốc
**Nguyên nhân**: File được upload trước khi có migration
**Giải pháp**: 
- File cũ sẽ hiển thị tên storage (có task_id)
- File mới sẽ hiển thị tên gốc

### Lỗi: Avatar không di chuyển từ temp
**Nguyên nhân**: Logic di chuyển file có thể gặp lỗi
**Giải pháp**: 
- Avatar vẫn hoạt động từ temp location
- Có thể upload lại avatar sau khi tạo group

## 📚 Tài Liệu Tham Khảo

- `HUONG_DAN_LUU_TEN_FILE_NHIEM_VU.md` - Chi tiết cách lưu file
- `database/migrations/add_original_filename_to_task_attachments.sql` - Migration SQL

