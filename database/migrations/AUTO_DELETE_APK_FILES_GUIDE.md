# 🗑️ Hướng Dẫn: Tự Động Xóa File APK Cũ

## ✅ Đã Hoàn Thành

- [x] Migration đã được apply: `add_auto_delete_old_apk_files`
- [x] Trigger đã được tạo để tự động xóa file cũ
- [x] Backend API đã được cập nhật để xóa file vật lý

---

## 🎯 Cách Hoạt Động

### Quy Tắc:
- **Chỉ lưu 3 file APK mới nhất** trên server
- **Giữ lại tất cả version records** trong database (không xóa record)
- **Chỉ xóa file APK vật lý** và clear `apk_file_path`, `file_size` trong database
- **Giữ lại**: version_code, version_name, release_notes, changelog, và tất cả thông tin khác

### Khi Nào Xóa:
- Khi upload version thứ 4 (có APK file)
- Trigger tự động tìm version cũ nhất (theo `version_code` và `created_at`)
- Xóa file APK vật lý từ server
- Clear `apk_file_path` và `file_size` trong database
- **Giữ lại tất cả thông tin khác** của version đó

---

## 📋 Ví Dụ

### Scenario: Có 4 versions

**Version 1.0** (version_code: 1) - CŨ NHẤT
- ✅ Record được giữ: version_name, release_notes, changelog, etc.
- ❌ File APK bị xóa: `apk_file_path = NULL`, `file_size = NULL`

**Version 1.1** (version_code: 2)
- ✅ Record được giữ
- ✅ File APK được giữ

**Version 1.2** (version_code: 3)
- ✅ Record được giữ
- ✅ File APK được giữ

**Version 1.3** (version_code: 4) - MỚI NHẤT
- ✅ Record được giữ
- ✅ File APK được giữ

**Kết quả**: Chỉ 3 file APK mới nhất (1.1, 1.2, 1.3) còn file, nhưng tất cả 4 version records đều được giữ trong database.

---

## 🔄 Workflow

### Khi Upload Version Mới:

1. **Upload APK file** → Lưu vào `apk_releases/`
2. **Update database** với `apk_file_path` và `file_size`
3. **Trigger tự động chạy**:
   - Đếm số version có APK file
   - Nếu > 3: Tìm version cũ nhất
   - Xóa file APK vật lý
   - Clear `apk_file_path` và `file_size` trong database
   - Giữ lại tất cả thông tin khác

---

## 📊 Database Schema

### Version Record (Sau Khi Xóa File):

```json
{
  "id": "uuid",
  "version_code": 1,
  "version_name": "1.0",
  "min_supported_version_code": 1,
  "update_required": false,
  "apk_file_path": null,  // ← Đã bị clear
  "apk_file_url": "https://...",  // ← Vẫn giữ nếu có
  "file_size": null,  // ← Đã bị clear
  "release_notes": "Version 1.0 - Initial release",  // ← Vẫn giữ
  "changelog": "...",  // ← Vẫn giữ
  "is_active": false,
  "download_count": 100,
  "created_at": "2026-01-14T...",
  "updated_at": "2026-01-14T...",
  "created_by": "uuid",
  "deleted_at": null
}
```

**Lưu ý**: Tất cả thông tin version vẫn được giữ, chỉ file APK bị xóa.

---

## 🔍 Kiểm Tra

### Query để xem versions có APK file:

```sql
-- Versions có APK file (3 mới nhất)
SELECT version_code, version_name, apk_file_path, file_size
FROM app_versions
WHERE apk_file_path IS NOT NULL
    AND deleted_at IS NULL
ORDER BY version_code DESC
LIMIT 3;

-- Tất cả versions (bao gồm cả những version đã xóa file)
SELECT version_code, version_name, 
       CASE WHEN apk_file_path IS NULL THEN 'No file' ELSE 'Has file' END as file_status
FROM app_versions
WHERE deleted_at IS NULL
ORDER BY version_code DESC;
```

---

## ⚙️ Cấu Hình

### Thay Đổi Số Lượng File Giữ Lại:

Nếu muốn giữ 5 file thay vì 3, sửa trong function:

```sql
-- Trong function delete_old_apk_files()
IF file_count > 5 THEN  -- Đổi từ 3 thành 5
```

---

## ✅ Checklist

- [x] Migration đã được apply
- [x] Trigger đã được tạo
- [x] Backend API đã được cập nhật
- [x] Logic xóa file vật lý đã được thêm
- [ ] Test với 4 versions để verify

---

## 🧪 Test

### Test Scenario:

1. **Tạo version 1.0** → Upload APK ✅
2. **Tạo version 1.1** → Upload APK ✅
3. **Tạo version 1.2** → Upload APK ✅
4. **Tạo version 1.3** → Upload APK ✅
   - → Version 1.0 file sẽ tự động bị xóa
   - → Version 1.0 record vẫn còn trong database

---

**Hệ thống tự động quản lý file APK, chỉ giữ 3 file mới nhất! 🎉**





