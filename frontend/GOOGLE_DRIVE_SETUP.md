# 📥 Cấu Hình Google Drive Download Link

## ✅ Đã Cấu Hình

Link Google Drive của bạn đã được cấu hình:
- **Share Link**: `https://drive.google.com/file/d/1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc/view?usp=drive_link`
- **Direct Download Link**: `https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc`

---

## 🚀 Cách Sử Dụng

### Bước 1: Tạo file `.env.local`

Tạo file `.env.local` trong thư mục `frontend/` (nếu chưa có):

```bash
cd frontend
cp env.local.example .env.local
```

### Bước 2: Cấu hình Download URL

Mở file `.env.local` và đảm bảo có dòng:

```env
NEXT_PUBLIC_APP_DOWNLOAD_URL="https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc"
```

### Bước 3: Restart Next.js Server

```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

### Bước 4: Test

1. Mở: `http://localhost:3000/settings`
2. Scroll xuống section "Tải App Android"
3. Click "Tải App Ngay" → APK sẽ download từ Google Drive

---

## 🔄 Chuyển Đổi Google Drive Link

### Từ Share Link sang Direct Download Link:

**Share Link format:**
```
https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
```

**Direct Download Link format:**
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

**Ví dụ:**
- Share: `https://drive.google.com/file/d/1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc/view?usp=drive_link`
- Direct: `https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc`

**Cách lấy File ID:**
1. Mở share link
2. File ID là phần giữa `/d/` và `/view`
3. Copy File ID và thay vào direct download link

---

## ⚠️ Lưu Ý Google Drive

### File lớn (>100MB):
Google Drive có thể hiển thị warning page trước khi download. Để tránh điều này:

**Option 1: Dùng Google Drive API (Advanced)**
- Cần OAuth token
- Phức tạp hơn nhưng reliable hơn

**Option 2: Upload lên nơi khác**
- GitHub Releases (khuyến nghị)
- Server riêng
- Cloud Storage (AWS S3, etc.)

### File nhỏ (<100MB):
Direct download link hoạt động tốt, không cần confirm.

---

## 🎯 Kiểm Tra Link Hoạt Động

### Test trực tiếp trong browser:

1. Mở link:
   ```
   https://drive.google.com/uc?export=download&id=1g_SUoY1d6nzG1UD6dr0OpOwmp_B8hpQc
   ```

2. Nếu file download ngay → ✅ Link hoạt động
3. Nếu hiển thị warning page → File quá lớn, cần xử lý khác

---

## 🔧 Troubleshooting

### Link không download được

**Lỗi: "Virus scan warning"**
- Google Drive đang scan file
- Đợi vài phút rồi thử lại
- Hoặc dùng link khác

**Lỗi: "Access denied"**
- Kiểm tra file có được share public không
- Vào Google Drive → Click chuột phải file → Share → "Anyone with the link"

**Lỗi: "File too large"**
- File >100MB cần confirm
- Cân nhắc upload lên GitHub Releases hoặc server riêng

### QR Code không hoạt động

- Kiểm tra `NEXT_PUBLIC_APP_DOWNLOAD_URL` đã được set trong `.env.local`
- Restart Next.js server sau khi thay đổi `.env.local`
- Kiểm tra link có accessible không

---

## 📝 Cập Nhật Link Mới

Khi có APK mới:

1. **Upload APK mới lên Google Drive**
2. **Lấy File ID từ share link mới**
3. **Cập nhật `.env.local`:**
   ```env
   NEXT_PUBLIC_APP_DOWNLOAD_URL="https://drive.google.com/uc?export=download&id=NEW_FILE_ID"
   ```
4. **Restart Next.js server**

---

## ✅ Checklist

- [ ] File APK đã được upload lên Google Drive
- [ ] File đã được share public (Anyone with the link)
- [ ] Đã tạo file `.env.local` từ `env.local.example`
- [ ] Đã cấu hình `NEXT_PUBLIC_APP_DOWNLOAD_URL` với direct download link
- [ ] Đã restart Next.js server
- [ ] Đã test download APK thành công
- [ ] Đã test QR code hoạt động

---

**Link hiện tại đã được cấu hình sẵn! Chỉ cần tạo `.env.local` và restart server. 🎉**






