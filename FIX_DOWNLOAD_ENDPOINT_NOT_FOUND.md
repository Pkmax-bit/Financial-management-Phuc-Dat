# 🔧 Sửa lỗi "Not Found" khi download APK

## ❌ Vấn đề

Endpoint `/api/app-updates/download/1` trả về `{"detail":"Not Found"}`

## 🔍 Nguyên nhân

**File APK chỉ có ở local, không có trên server production (Render.com)**

- ✅ Database có version 1.0
- ✅ File APK tồn tại ở local: `backend/apk_releases/app-release-v1.0.apk`
- ❌ File APK **KHÔNG có** trên server production

## ✅ Giải pháp

### **Giải pháp 1: Upload file lên Supabase Storage (Khuyến nghị)**

#### Bước 1: Tăng giới hạn file size trong Supabase

1. Mở **Supabase Dashboard** → **Storage** → **Settings**
2. Tìm **File size limit** hoặc **Max file size**
3. Tăng lên **50 MB** hoặc hơn (file APK hiện tại: 28.33 MB)

#### Bước 2: Thêm MIME type cho APK

1. Vào **Storage** → **Policies** hoặc **Settings**
2. Thêm MIME type: `application/vnd.android.package-archive`
3. Hoặc dùng: `application/octet-stream` (generic binary)

#### Bước 3: Upload file lên Supabase Storage

```bash
python backend/scripts/upload_apk_to_storage.py
```

#### Bước 4: Cập nhật database

Database sẽ tự động cập nhật `apk_file_url` với Supabase Storage URL.

---

### **Giải pháp 2: Dùng Google Drive (Tạm thời)**

Nếu không thể tăng giới hạn Supabase Storage:

1. Upload APK lên Google Drive
2. Lấy direct download link
3. Cập nhật database:

```sql
UPDATE app_versions
SET apk_file_url = 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID'
WHERE version_code = 1;
```

---

### **Giải pháp 3: Deploy file cùng với code (Không khuyến nghị)**

**Vấn đề**: Render.com không lưu file sau khi deploy, file sẽ bị mất khi restart.

**Cách làm** (nếu vẫn muốn thử):
1. Đảm bảo file APK có trong repo
2. Deploy lại code lên Render.com
3. File sẽ có trong container, nhưng sẽ mất khi restart

---

### **Giải pháp 4: Dùng External Storage Service**

#### Option A: AWS S3
- Upload APK lên S3
- Cập nhật `apk_file_url` với S3 public URL

#### Option B: Cloudflare R2
- Tương tự S3, nhưng rẻ hơn

#### Option C: GitHub Releases
- Upload APK lên GitHub Releases
- Dùng direct download link

---

## 🎯 Khuyến nghị

**Dùng Supabase Storage** (Giải pháp 1) vì:
- ✅ Đã tích hợp sẵn với hệ thống
- ✅ Có thể quản lý qua code
- ✅ Tự động cleanup (giữ 3 versions)
- ✅ Có thể track download count

**Nếu không thể tăng giới hạn Supabase:**
- Dùng Google Drive (Giải pháp 2) như một giải pháp tạm thời
- Hoặc migrate sang AWS S3/Cloudflare R2

---

## 📝 Kiểm tra sau khi fix

### 1. Test endpoint trực tiếp:
```
GET https://financial-management-backend-3m78.onrender.com/api/app-updates/download/1
```

### 2. Test từ frontend:
- Mở Settings page
- Click "Tải App Ngay"
- File sẽ được download

### 3. Kiểm tra logs:
Backend sẽ log:
```
INFO: Download APK request - version_code: 1
INFO: Found version: 1.0 (code: 1)
INFO: APK file found, preparing to serve: app-release-v1.0.apk
```

---

## 🔄 Quy trình Upload APK mới

Khi có version mới:

1. **Build APK** từ Android project
2. **Upload lên Supabase Storage** (hoặc external storage)
3. **Tạo version record** trong database:
   ```sql
   INSERT INTO app_versions (version_code, version_name, apk_file_url, ...)
   VALUES (2, '1.1', 'https://...', ...);
   ```
4. **Set version mới là active**:
   ```sql
   UPDATE app_versions SET is_active = true WHERE version_code = 2;
   UPDATE app_versions SET is_active = false WHERE version_code = 1;
   ```

---

## ✅ Tóm tắt

**Vấn đề**: File APK không có trên server production  
**Giải pháp**: Upload file lên Supabase Storage hoặc external storage  
**Kết quả**: Endpoint sẽ serve file từ storage thay vì local file system

