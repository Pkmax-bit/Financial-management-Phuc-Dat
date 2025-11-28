# Hướng Dẫn: Cách Lưu Tên File Khi Tạo Nhiệm Vụ

## 📋 Tổng Quan

Khi tạo nhiệm vụ và upload file đính kèm, hệ thống sẽ:
1. **Tạo cấu trúc thư mục** theo nhóm: `Groups/{group_id}/Tasks/{task_id}/`
2. **Lưu tên file gốc** vào database (để hiển thị)
3. **Đổi tên file trong storage** theo format: `{tên_gốc}_{task_id}.{extension}`

## 🔄 Quy Trình

### Bước 1: Tạo Nhiệm Vụ
```typescript
// Frontend: frontend/src/app/tasks/page.tsx
const createdTask = await apiPost('/api/tasks', sanitizedTaskData)
// → Tạo task và nhận về task.id
```

### Bước 2: Upload Files (Sau khi tạo task)
```typescript
// Frontend: Upload từng file sau khi task được tạo
await Promise.all(newFiles.map(async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE_URL}/api/tasks/${createdTask.id}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  })
}))
```

### Bước 3: Backend Xử Lý File
```python
# Backend: backend/routers/tasks.py
# 1. Lấy task_id và group_id
task_result = supabase.table("tasks").select("id, group_id").eq("id", task_id).execute()
task = task_result.data[0]
task_group_id = task.get("group_id", "")

# 2. Lấy tên file gốc
original_filename = file.filename or "untitled"
# Ví dụ: "Báo cáo tháng 12.xlsx"

# 3. Sanitize tên file (loại bỏ ký tự đặc biệt)
name_part = original_filename.rsplit('.', 1)[0]  # "Báo cáo tháng 12"
ext_part = '.' + original_filename.rsplit('.', 1)[1]  # ".xlsx"
sanitized_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name_part)  # "Bao_cao_thang_12"

# 4. Tạo tên file storage (đơn giản hóa, group_id đã có trong path)
storage_filename = f"{sanitized_name}_{task_id}{ext_part}"
# Kết quả: "Bao_cao_thang_12_{task_id}.xlsx"

# 5. Tạo folder path theo cấu trúc: Groups/{group_id}/Tasks/{task_id}
if task_group_id:
    folder_path = f"Groups/{task_group_id}/Tasks/{task_id}"
else:
    folder_path = f"Tasks/{task_id}"  # Fallback nếu không có group_id
```

### Bước 4: Lưu Vào Database
```python
attachment_data = {
    "id": str(uuid.uuid4()),
    "task_id": task_id,
    "file_name": storage_filename,  # "Bao_cao_thang_12_{task_id}.xlsx"
    "original_file_name": original_filename,  # "Báo cáo tháng 12.xlsx"
    "file_url": file_result["url"],
    "file_type": file_result["content_type"],
    "file_size": file_result["size"],
    "uploaded_by": current_user.id,
    "created_at": datetime.utcnow().isoformat()
}
```

## 📊 Ví Dụ Cụ Thể

### Input:
- **Tên file gốc**: `Báo cáo tài chính Q4 2024.xlsx`
- **Task ID**: `abc123-def456-ghi789`
- **Group ID**: `group-001`

### Quá Trình Xử Lý:
1. **Sanitize tên file**: 
   - `Báo cáo tài chính Q4 2024` → `Bao_cao_tai_chinh_Q4_2024`
   - Extension: `.xlsx`

2. **Tạo tên file storage**:
   - `Bao_cao_tai_chinh_Q4_2024_abc123-def456-ghi789.xlsx`

3. **Tạo folder path**:
   - `Groups/group-001/Tasks/abc123-def456-ghi789/`

4. **Lưu vào database**:
   - `file_name`: `Bao_cao_tai_chinh_Q4_2024_abc123-def456-ghi789.xlsx`
   - `original_file_name`: `Báo cáo tài chính Q4 2024.xlsx`

### Kết Quả:
- **Trong Storage**: 
  - Path: `Groups/group-001/Tasks/abc123-def456-ghi789/Bao_cao_tai_chinh_Q4_2024_abc123-def456-ghi789.xlsx`
  - File được tổ chức theo nhóm và nhiệm vụ
- **Hiển thị cho user**: `Báo cáo tài chính Q4 2024.xlsx` (tên gốc)

## 🎯 Lợi Ích

1. **Tổ chức theo nhóm**: File được tổ chức theo cấu trúc Groups → Tasks, dễ quản lý và tìm kiếm
2. **Tránh trùng tên**: Mỗi file có task_id riêng trong thư mục của task đó
3. **User-friendly**: Hiển thị tên file gốc cho người dùng
4. **Dễ phân loại**: Có thể tìm file theo group_id hoặc task_id
5. **Cấu trúc rõ ràng**: Dễ dàng backup, migrate hoặc quản lý theo nhóm

## 📁 Cấu Trúc Storage

### Có Group ID:
```
minhchung_chiphi/
└── Groups/
    └── {group_id}/
        ├── avatar/
        │   └── avatar.{ext}  # Avatar của nhóm
        └── Tasks/
            └── {task_id}/
                ├── Bao_cao_tai_chinh_Q4_2024_{task_id}.xlsx
                ├── Hop_dong_{task_id}.pdf
                └── Anh_minh_hoa_{task_id}.jpg
```

### Không có Group ID (Fallback):
```
minhchung_chiphi/
└── Tasks/
    └── {task_id}/
        ├── Bao_cao_tai_chinh_Q4_2024_{task_id}.xlsx
        ├── Hop_dong_{task_id}.pdf
        └── Anh_minh_hoa_{task_id}.jpg
```

## 🔍 Kiểm Tra

### Xem tên file trong database:
```sql
SELECT 
    id,
    task_id,
    file_name,           -- Tên file trong storage
    original_file_name,  -- Tên file gốc (hiển thị)
    file_type,
    file_size
FROM task_attachments
WHERE task_id = 'your-task-id';
```

### Xem file trong Storage:
- Vào Supabase Dashboard → Storage → Buckets → `minhchung_chiphi`
- **Có group_id**: Tìm trong folder `Groups/{group_id}/Tasks/{task_id}/`
- **Không có group_id**: Tìm trong folder `Tasks/{task_id}/`
- File sẽ có tên format: `{sanitized_name}_{task_id}.{ext}`

## ⚠️ Lưu Ý

1. **Migration cần thiết**: Phải chạy migration `add_original_filename_to_task_attachments.sql` để thêm cột `original_file_name`
2. **File cũ**: Các file upload trước khi có migration sẽ không có `original_file_name`, hệ thống sẽ fallback về `file_name`
3. **Sanitize**: Tên file được sanitize để loại bỏ ký tự đặc biệt, chỉ giữ lại chữ cái, số, `_`, và `-`

## 🛠️ Troubleshooting

### Vấn đề: File không có original_file_name
**Nguyên nhân**: File được upload trước khi chạy migration
**Giải pháp**: 
- Chạy migration `add_original_filename_to_task_attachments.sql`
- Hoặc upload lại file (file mới sẽ có original_file_name)

### Vấn đề: Tên file bị thay đổi quá nhiều
**Nguyên nhân**: Tên file gốc có nhiều ký tự đặc biệt
**Giải pháp**: 
- Đây là hành vi mong muốn để đảm bảo tên file hợp lệ trong storage
- Tên file gốc vẫn được lưu trong `original_file_name` để hiển thị

