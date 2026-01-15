# 📱 Hướng Dẫn Apply Migration cho App Versions

## ✅ Đã Hoàn Thành

- [x] APK đã được build: `app-release.apk` (28.33 MB)
- [x] APK đã được copy vào: `backend/apk_releases/app-release-v1.0.apk`
- [x] Migration SQL đã được tạo: `create_app_versions_table.sql`
- [x] Backend API đã được cập nhật để dùng database

---

## 🚀 BƯỚC 1: Apply Migration vào Supabase

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. **Mở Supabase Dashboard**: https://supabase.com/dashboard
2. **Chọn project** của bạn
3. **Vào SQL Editor**
4. **Copy toàn bộ nội dung** từ file `create_app_versions_table.sql`
5. **Paste vào SQL Editor**
6. **Click "Run"** để execute migration
7. **Kiểm tra** bảng `app_versions` đã được tạo

### Cách 2: Qua MCP (Nếu có)

Sử dụng MCP Supabase để apply migration:

```bash
# Apply migration
mcp_supabase-school-management_apply_migration
```

---

## 🚀 BƯỚC 2: Kiểm Tra Bảng Đã Được Tạo

### Qua Supabase Dashboard:

1. Vào **Table Editor**
2. Tìm bảng **`app_versions`**
3. Kiểm tra có record version 1.0 chưa

### Qua SQL:

```sql
SELECT * FROM app_versions;
```

---

## 🚀 BƯỚC 3: Upload APK và Cập Nhật Version

### Option 1: Qua API (Khuyến nghị)

**Tạo version record:**
```bash
POST /api/app-updates/versions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "version_code": 1,
  "version_name": "1.0",
  "min_supported_version_code": 1,
  "update_required": false,
  "release_notes": "Version 1.0 - Initial release",
  "is_active": true
}
```

**Upload APK:**
```bash
POST /api/app-updates/versions/1/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <APK file>
```

### Option 2: Qua Supabase Dashboard

1. Vào **Table Editor** → **app_versions**
2. Click **Insert** → **Insert row**
3. Điền thông tin:
   - `version_code`: 1
   - `version_name`: "1.0"
   - `min_supported_version_code`: 1
   - `update_required`: false
   - `release_notes`: "Version 1.0 - Initial release"
   - `is_active`: true
   - `apk_file_path`: "apk_releases/app-release-v1.0.apk"
   - `file_size`: 29700000 (28.33 MB in bytes)

---

## 📋 Cấu Trúc Bảng

### `app_versions` Table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `version_code` | INTEGER | Version code (unique, must increment) |
| `version_name` | VARCHAR(50) | Version name (e.g., "1.0", "1.1") |
| `min_supported_version_code` | INTEGER | Minimum supported version |
| `update_required` | BOOLEAN | Force update flag |
| `apk_file_path` | TEXT | Path to APK file |
| `apk_file_url` | TEXT | External URL (Google Drive, etc.) |
| `file_size` | BIGINT | File size in bytes |
| `release_notes` | TEXT | Release notes |
| `changelog` | TEXT | Detailed changelog |
| `is_active` | BOOLEAN | Only one active version at a time |
| `download_count` | INTEGER | Download counter |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Update timestamp |
| `created_by` | UUID | User who created |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp |

---

## 🔄 Workflow Cập Nhật Version Mới

### Khi có version mới (ví dụ: 1.1):

1. **Build APK mới:**
   ```bash
   cd FinancialmanagementPhucDatMobile
   .\gradlew assembleRelease
   ```

2. **Copy APK:**
   ```bash
   Copy-Item "app\build\outputs\apk\release\app-release.apk" -Destination "..\Financial-management-Phuc-Dat\apk_releases\app-release-v1.1.apk"
   ```

3. **Tạo version record qua API:**
   ```bash
   POST /api/app-updates/versions
   {
     "version_code": 2,
     "version_name": "1.1",
     "min_supported_version_code": 1,
     "update_required": false,
     "release_notes": "Version 1.1 - Bug fixes and improvements",
     "is_active": true
   }
   ```

4. **Upload APK:**
   ```bash
   POST /api/app-updates/versions/2/upload
   file: app-release-v1.1.apk
   ```

5. **Version 1.1 sẽ tự động trở thành active** (trigger sẽ deactivate version cũ)

---

## ✅ Checklist

- [ ] Migration đã được apply vào Supabase
- [ ] Bảng `app_versions` đã được tạo
- [ ] Record version 1.0 đã được insert
- [ ] APK file đã được copy vào `backend/apk_releases/`
- [ ] Backend API đã được test
- [ ] Android app có thể check version từ database

---

## 🧪 Test API

### Test Check Version:
```bash
GET /api/app-updates/check?current_version_code=1&current_version_name=1.0
```

### Test List Versions (Admin):
```bash
GET /api/app-updates/versions
Authorization: Bearer <admin_token>
```

### Test Download APK:
```bash
GET /api/app-updates/download/1
```

---

**Chúc bạn setup thành công! 🎉**





