# 📦 Hướng Dẫn: Lưu APK File lên Storage

## ⚠️ Vấn Đề Hiện Tại

File APK (28.33 MB) **quá lớn** để upload lên Supabase Storage bucket `minhchung_chiphi`:
- **Lỗi**: "Payload too large - The object exceeded the maximum allowed size"
- **Giới hạn**: Supabase Storage bucket có giới hạn file size (thường là 50MB cho free tier, nhưng có thể bucket này có giới hạn nhỏ hơn)

## ✅ Giải Pháp

### **Option 1: Sử dụng Google Drive URL (Khuyến nghị)**

File APK đã có trên Google Drive, chỉ cần cập nhật `apk_file_url` trong database:

```sql
UPDATE app_versions
SET apk_file_url = 'https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc'
WHERE version_code = 1;
```

**Ưu điểm:**
- ✅ Không cần upload lại
- ✅ Google Drive hỗ trợ file lớn
- ✅ URL công khai, dễ download

### **Option 2: Tăng Giới Hạn File Size trong Supabase Storage**

1. Vào Supabase Dashboard:
   - https://supabase.com/dashboard → Chọn project → **Storage** → **Buckets** → `minhchung_chiphi`

2. Vào tab **Settings**:
   - Tìm **"File size limit"** hoặc **"Maximum file size"**
   - Tăng lên **50MB** hoặc **100MB** (tùy plan)
   - Click **Save**

3. Sau đó chạy lại script upload:
   ```bash
   python backend/scripts/upload_apk_to_storage.py
   ```

### **Option 3: Sử dụng Bucket Riêng cho APK Files**

Tạo bucket mới chỉ dành cho APK files với giới hạn lớn hơn:

1. Vào Supabase Dashboard → **Storage** → **New bucket**
2. Tên bucket: `app-apk-files`
3. **Public**: ✅ (để có thể download công khai)
4. **File size limit**: 100MB hoặc lớn hơn
5. **Allowed MIME types**: 
   - `application/vnd.android.package-archive`
   - `application/octet-stream`
6. Click **Create**

Sau đó cập nhật code để sử dụng bucket mới này.

---

## 🔧 Cập Nhật Database với Google Drive URL

Nếu muốn dùng Google Drive URL ngay (khuyến nghị):

```sql
UPDATE app_versions
SET apk_file_url = 'https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc'
WHERE version_code = 1;
```

---

## 📋 Checklist

- [ ] Quyết định phương án (Google Drive / Tăng giới hạn / Bucket mới)
- [ ] Cập nhật `apk_file_url` trong database
- [ ] Test download APK từ URL
- [ ] Verify app có thể download và cài đặt được

---

**Khuyến nghị: Sử dụng Google Drive URL vì đơn giản và không cần cấu hình thêm! 🎯**






