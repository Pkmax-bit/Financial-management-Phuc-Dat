# 📦 Hướng dẫn Lưu trữ APK trong Database

## Tổng quan

Hệ thống lưu trữ APK file ở **2 nơi** và lưu **metadata** trong database:

### 1. **Local Storage (Backup)**
- **Vị trí**: `backend/apk_releases/app-release-v{version_name}.apk`
- **Ví dụ**: `backend/apk_releases/app-release-v1.0.apk`
- **Mục đích**: Backup local, phục vụ download trực tiếp từ server

### 2. **Supabase Storage (Primary)**
- **Bucket**: `minhchung_chiphi`
- **Path**: `app-versions/v{version_name}/app-release-v{version_name}.apk`
- **Ví dụ**: `app-versions/v1.0/app-release-v1.0.apk`
- **Mục đích**: Lưu trữ chính, có thể truy cập công khai qua URL

### 3. **Database (Metadata)**
- **Bảng**: `app_versions`
- **Các cột liên quan**:
  - `apk_file_path`: Đường dẫn tương đối (ví dụ: `apk_releases/app-release-v1.0.apk`)
  - `apk_file_url`: URL công khai để download (Supabase Storage URL hoặc Google Drive URL)
  - `file_size`: Kích thước file (bytes)

---

## Cấu trúc Database

### Bảng `app_versions`

```sql
CREATE TABLE public.app_versions (
    id UUID PRIMARY KEY,
    version_code INTEGER NOT NULL UNIQUE,
    version_name VARCHAR(50) NOT NULL,
    apk_file_path TEXT,        -- Đường dẫn file (local hoặc Supabase Storage)
    apk_file_url TEXT,        -- URL công khai để download
    file_size BIGINT,        -- Kích thước file (bytes)
    is_active BOOLEAN,       -- Version đang active
    ...
);
```

### Ví dụ dữ liệu trong database:

```json
{
  "id": "uuid-here",
  "version_code": 1,
  "version_name": "1.0",
  "apk_file_path": "apk_releases/app-release-v1.0.apk",
  "apk_file_url": "https://drive.google.com/uc?export=download&id=...",
  "file_size": 29724672,
  "is_active": true
}
```

---

## Quy trình Upload APK

### Khi upload APK qua API `/api/app-updates/versions/{version_code}/upload`:

1. **Lưu Local (Backup)**
   ```
   backend/apk_releases/app-release-v1.0.apk
   ```

2. **Upload lên Supabase Storage**
   ```
   Bucket: minhchung_chiphi
   Path: app-versions/v1.0/app-release-v1.0.apk
   ```

3. **Lấy Public URL từ Supabase Storage**
   ```
   https://{supabase-url}/storage/v1/object/public/minhchung_chiphi/app-versions/v1.0/app-release-v1.0.apk
   ```

4. **Cập nhật Database**
   ```sql
   UPDATE app_versions SET
     apk_file_path = 'apk_releases/app-release-v1.0.apk',
     apk_file_url = 'https://...',  -- Supabase Storage URL
     file_size = 29724672
   WHERE version_code = 1;
   ```

---

## Logic Download URL

Backend ưu tiên theo thứ tự:

1. **`apk_file_url`** (nếu có)
   - Supabase Storage URL
   - Google Drive URL
   - Bất kỳ external URL nào

2. **`apk_file_path`** (nếu có)
   - Tạo API endpoint: `/api/app-updates/download/{version_code}`
   - Serve file từ local storage

3. **Local file check** (fallback)
   - Kiểm tra file có tồn tại trong `backend/apk_releases/`
   - Nếu có, tạo API endpoint để serve

---

## Quản lý Storage

### Auto Cleanup (Giữ tối đa 3 versions)

Khi upload version mới, hệ thống tự động:
- Xóa file local của version cũ nhất (nếu có > 3 versions)
- Xóa `apk_file_path` và `file_size` trong database (nhưng giữ version record)

### Trigger trong Database

```sql
-- Function tự động xóa file path khi có > 3 versions
CREATE FUNCTION delete_old_apk_files()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic xóa file path của version cũ nhất
    -- (giữ lại version record)
END;
$$;
```

---

## Cách Kiểm tra APK trong Database

### 1. Sử dụng Script Python

```bash
cd backend
python scripts/check_app_version_url.py --check
```

### 2. Query trực tiếp trong Supabase

```sql
SELECT 
    version_code,
    version_name,
    apk_file_path,
    apk_file_url,
    file_size,
    is_active
FROM app_versions
WHERE is_active = true
ORDER BY version_code DESC
LIMIT 1;
```

### 3. Kiểm tra Local Files

```bash
# Windows
dir backend\apk_releases

# Linux/Mac
ls -lh backend/apk_releases/
```

### 4. Kiểm tra Supabase Storage

1. Mở Supabase Dashboard
2. Vào **Storage** → **minhchung_chiphi** bucket
3. Xem folder `app-versions/`

---

## Cập nhật Download URL

### Cách 1: Qua Script

```bash
python scripts/check_app_version_url.py --update 1 --url "https://new-url.com/app.apk"
```

### Cách 2: Qua Supabase Dashboard

1. Mở bảng `app_versions`
2. Tìm version cần cập nhật
3. Sửa cột `apk_file_url`
4. Save

### Cách 3: Qua SQL

```sql
UPDATE app_versions
SET apk_file_url = 'https://drive.google.com/uc?export=download&id=NEW_ID'
WHERE version_code = 1;
```

---

## Lưu ý

1. **Supabase Storage có giới hạn kích thước**
   - Nếu file quá lớn, có thể upload thất bại
   - Giải pháp: Dùng Google Drive hoặc external storage

2. **Local Storage chỉ là backup**
   - File local có thể bị mất khi server restart/redeploy
   - Nên dùng Supabase Storage hoặc external URL

3. **`apk_file_url` ưu tiên hơn `apk_file_path`**
   - Nếu có `apk_file_url`, hệ thống sẽ dùng URL đó
   - `apk_file_path` chỉ dùng khi không có `apk_file_url`

4. **Version record luôn được giữ lại**
   - Khi cleanup, chỉ xóa file path, không xóa version record
   - Lịch sử versions vẫn được lưu trong database

---

## Tóm tắt

| Thông tin | Vị trí | Mục đích |
|-----------|--------|----------|
| **File Local** | `backend/apk_releases/` | Backup, serve trực tiếp |
| **File Supabase** | `minhchung_chiphi/app-versions/` | Lưu trữ chính |
| **Metadata** | `app_versions` table | Thông tin version, URL, size |
| **Download URL** | `apk_file_url` column | URL công khai để download |





