# 📱 Hướng Dẫn Setup Tải App Android trên Web

## ✅ Đã Hoàn Thành

- [x] Thêm section "Tải App Android" vào trang Settings
- [x] Tạo API route `/api/app/download` để serve APK
- [x] Thêm QR code để quét tải app
- [x] Thêm hướng dẫn cài đặt

---

## 🚀 Cách Sử Dụng

### **CÁCH 1: Serve APK từ Public Folder (Khuyến nghị cho Development)**

1. **Tạo thư mục:**
   ```bash
   mkdir -p public/app
   ```

2. **Copy APK file vào:**
   ```bash
   # Copy APK từ Android project
   cp ../FinancialmanagementPhucDatMobile/app/build/outputs/apk/release/app-release.apk public/app/financial-management-release.apk
   ```

3. **APK sẽ tự động được serve qua:**
   ```
   /api/app/download
   ```

**Lưu ý:** File phải có tên chính xác: `financial-management-release.apk`

---

### **CÁCH 2: Redirect đến External URL (Khuyến nghị cho Production)**

1. **Upload APK lên:**
   - Google Drive
   - GitHub Releases
   - Server riêng
   - Cloud Storage

2. **Cấu hình trong `.env.local`:**
   ```env
   NEXT_PUBLIC_APP_DOWNLOAD_URL="https://your-domain.com/downloads/app-release.apk"
   ```

   **Ví dụ với Google Drive:**
   ```env
   NEXT_PUBLIC_APP_DOWNLOAD_URL="https://drive.google.com/uc?export=download&id=YOUR_FILE_ID"
   ```

   **Ví dụ với GitHub Releases:**
   ```env
   NEXT_PUBLIC_APP_DOWNLOAD_URL="https://github.com/your-org/repo/releases/download/v1.0/app-release.apk"
   ```

3. **API sẽ tự động redirect đến URL này**

---

## 📋 Cấu Hình

### File `.env.local`:

```env
# Option 1: Để trống để serve từ public folder
# NEXT_PUBLIC_APP_DOWNLOAD_URL=""

# Option 2: Redirect đến external URL
NEXT_PUBLIC_APP_DOWNLOAD_URL="https://your-domain.com/app-release.apk"
```

---

## 🎯 Workflow

### Development:
1. Build APK từ Android project
2. Copy APK vào `public/app/financial-management-release.apk`
3. Restart Next.js dev server
4. Vào Settings → Tải App Android

### Production:
1. Upload APK lên Google Drive/GitHub/Server
2. Cấu hình `NEXT_PUBLIC_APP_DOWNLOAD_URL` trong `.env.local`
3. Deploy frontend
4. User có thể tải từ Settings page

---

## 🔍 Kiểm Tra

1. **Mở trang Settings:**
   ```
   http://localhost:3000/settings
   ```

2. **Kiểm tra section "Tải App Android":**
   - ✅ Hiển thị version, size, requirements
   - ✅ Nút "Tải App Ngay" hoạt động
   - ✅ QR code hiển thị đúng
   - ✅ Link copy được

3. **Test download:**
   - Click "Tải App Ngay" → APK phải download
   - Quét QR code → Mở link download trên điện thoại

---

## 🆘 Troubleshooting

### APK không download được

**Lỗi: "File not found"**
- Kiểm tra file có trong `public/app/` không
- Kiểm tra tên file: `financial-management-release.apk`
- Restart Next.js server

**Lỗi: "Redirect failed"**
- Kiểm tra `NEXT_PUBLIC_APP_DOWNLOAD_URL` trong `.env.local`
- Kiểm tra URL có accessible không
- Kiểm tra CORS nếu host ở domain khác

### QR Code không hiển thị

**Lỗi: "QRCodeSVG is not defined"**
- Kiểm tra package `qrcode.react` đã được install:
  ```bash
  npm install qrcode.react
  ```

### Link không copy được

**Lỗi: "navigator.clipboard is not defined"**
- Chỉ hoạt động trên HTTPS hoặc localhost
- Fallback: User có thể copy thủ công

---

## 📝 Cập Nhật Version

Khi có version mới:

1. **Build APK mới:**
   ```bash
   cd ../FinancialmanagementPhucDatMobile
   ./gradlew assembleRelease
   ```

2. **Copy APK mới:**
   ```bash
   cp app/build/outputs/apk/release/app-release.apk ../Financial-management-Phuc-Dat/frontend/public/app/financial-management-release.apk
   ```

3. **Cập nhật version trong Settings page:**
   ```tsx
   const APP_VERSION = '1.1'  // Cập nhật version mới
   const APP_SIZE = '~XX MB'  // Cập nhật size thực tế
   ```

4. **Restart Next.js server**

---

## 🎨 Customization

### Thay đổi thông tin App:

**File:** `src/app/settings/page.tsx`

```tsx
const APP_VERSION = '1.0'        // Version của app
const APP_SIZE = '~XX MB'        // Kích thước file
// Yêu cầu: Android 6.0+ (hardcoded)
```

### Thay đổi màu sắc:

Section sử dụng màu green (`bg-green-600`). Có thể đổi sang màu khác trong className.

---

## ✅ Checklist

Trước khi deploy:

- [ ] APK file đã được đặt đúng vị trí hoặc URL đã được cấu hình
- [ ] Version và size đã được cập nhật đúng
- [ ] Test download APK thành công
- [ ] Test QR code quét được
- [ ] Test copy link hoạt động
- [ ] Hướng dẫn cài đặt rõ ràng

---

**Chúc bạn setup thành công! 🎉**






