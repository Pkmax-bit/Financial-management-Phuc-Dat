# Hướng dẫn Hệ thống Cập nhật Từ xa (OTA) cho Android App

## Tổng quan

Hệ thống OTA (Over-The-Air) cho phép cập nhật ứng dụng Android từ xa mà không cần người dùng tải và cài đặt thủ công từ Play Store hoặc website.

## Cấu trúc hệ thống

### Backend (FastAPI)
- **Router**: `backend/routers/app_updates.py`
- **Endpoints**:
  - `GET /api/app-updates/check` - Kiểm tra phiên bản mới
  - `GET /api/app-updates/download` - Tải xuống APK
  - `GET /api/app-updates/info` - Thông tin phiên bản (public)

### Android App
- **UpdateService**: Kiểm tra và tải xuống APK
- **UpdateManager**: Quản lý UI và cài đặt
- **AppVersion Model**: Model dữ liệu phiên bản

## Cách sử dụng

### 1. Cấu hình Backend

#### Bước 1: Tạo thư mục lưu APK
```bash
cd C:\Projects\Financial-management-Phuc-Dat\backend
mkdir apk_releases
```

#### Bước 2: Cập nhật version trong `app_updates.py`
```python
# backend/routers/app_updates.py
APP_VERSION_CODE = 2  # Tăng số này mỗi lần release
APP_VERSION_NAME = "1.1"
APP_MIN_VERSION_CODE = 1  # Phiên bản tối thiểu được hỗ trợ
APP_UPDATE_REQUIRED = False  # True = bắt buộc cập nhật
```

#### Bước 3: Đặt APK vào thư mục
- Copy file APK release vào: `backend/apk_releases/`
- Đặt tên file: `app-release-v{version}.apk`
- Ví dụ: `app-release-v1.1.apk`

#### Bước 4: Deploy backend
```bash
git add .
git commit -m "Update app version to 1.1"
git push
```

### 2. Build và Upload APK

#### Build Release APK
```bash
cd C:\Projects\FinancialmanagementPhucDatMobile
.\gradlew.bat assembleRelease
```

#### Copy APK lên server
```bash
# Copy APK từ build output
copy app\build\outputs\apk\release\app-release.apk ..\Financial-management-Phuc-Dat\backend\apk_releases\app-release-v1.1.apk
```

### 3. Cập nhật Version Code trong Android

Mỗi lần release, cần tăng `versionCode` trong `app/build.gradle.kts`:

```kotlin
defaultConfig {
    versionCode = 2  // Tăng số này
    versionName = "1.1"  // Cập nhật version name
}
```

**Quan trọng**: `versionCode` phải khớp với `APP_VERSION_CODE` trong backend!

## Quy trình Release

### Khi có bản cập nhật mới:

1. **Cập nhật Android App**:
   - Tăng `versionCode` trong `build.gradle.kts`
   - Cập nhật `versionName`
   - Build release APK

2. **Upload APK lên Backend**:
   - Copy APK vào `backend/apk_releases/`
   - Đặt tên đúng format: `app-release-v{version}.apk`

3. **Cập nhật Backend Config**:
   - Cập nhật `APP_VERSION_CODE` trong `app_updates.py`
   - Cập nhật `APP_VERSION_NAME`
   - Set `APP_UPDATE_REQUIRED = True` nếu bắt buộc cập nhật

4. **Deploy Backend**:
   - Commit và push code
   - Render sẽ tự động deploy

5. **Test**:
   - Mở app trên thiết bị Android
   - App sẽ tự động check update khi khởi động
   - Nếu có update, sẽ hiển thị dialog

## Tính năng

### ✅ Tự động kiểm tra khi app khởi động
- App tự động check version khi mở
- Không hiển thị thông báo nếu không có update

### ✅ Download với progress bar
- Hiển thị tiến trình tải xuống
- Tự động cài đặt sau khi download xong

### ✅ Force update (nếu cần)
- Set `APP_UPDATE_REQUIRED = True` để bắt buộc cập nhật
- Người dùng không thể bỏ qua

### ✅ Hỗ trợ Android 7.0+
- Sử dụng FileProvider cho Android 7.0+
- Tự động xử lý permissions

## API Endpoints

### Check Version
```http
GET /api/app-updates/check?current_version_code=1&current_version_name=1.0
```

**Response**:
```json
{
  "current_version_code": 1,
  "current_version_name": "1.0",
  "latest_version_code": 2,
  "latest_version_name": "1.1",
  "min_supported_version_code": 1,
  "update_available": true,
  "update_required": false,
  "download_url": "/api/app-updates/download",
  "release_notes": "Version 1.1 - Bug fixes and improvements",
  "file_size": 8903986
}
```

### Download APK
```http
GET /api/app-updates/download
```

**Response**: APK file (binary)

## Troubleshooting

### Lỗi: "APK file not found"
- Kiểm tra file APK có trong `backend/apk_releases/` không
- Kiểm tra tên file có đúng format không
- Kiểm tra quyền truy cập file

### Lỗi: "Cannot install APK"
- Kiểm tra permission `REQUEST_INSTALL_PACKAGES` trong AndroidManifest
- Kiểm tra FileProvider đã được cấu hình đúng chưa
- Trên Android 8.0+, cần cho phép "Install from unknown sources"

### Update không hiển thị
- Kiểm tra `versionCode` trong Android app có nhỏ hơn `APP_VERSION_CODE` không
- Kiểm tra API endpoint có hoạt động không
- Kiểm tra log trong Android Studio

### Download bị lỗi
- Kiểm tra kết nối mạng
- Kiểm tra URL download có đúng không
- Kiểm tra file size có quá lớn không (nên < 50MB)

## Bảo mật

### Khuyến nghị:
1. **HTTPS**: Luôn sử dụng HTTPS cho API
2. **APK Signing**: Luôn sign APK với release keystore
3. **Version Validation**: Validate version code trước khi download
4. **File Integrity**: Có thể thêm MD5/SHA256 checksum để verify file

## Tùy chỉnh

### Thay đổi tần suất check update
Trong `MainActivity.java`:
```java
@Override
protected void onResume() {
    super.onResume();
    // Uncomment để check mỗi lần app resume
    // checkForUpdates();
}
```

### Thêm manual check button
Trong SettingsFragment, thêm button:
```java
Button btnCheckUpdate = findViewById(R.id.btn_check_update);
btnCheckUpdate.setOnClickListener(v -> {
    updateManager.checkForUpdate(true); // true = show "no update" message
});
```

## Lưu ý quan trọng

1. **Version Code**: Phải tăng mỗi lần release, không được giảm
2. **APK Naming**: Tên file phải khớp với format trong code
3. **Testing**: Luôn test trên thiết bị thật trước khi release
4. **Backup**: Luôn backup keystore file trước khi release
5. **Rollback**: Có thể rollback bằng cách giảm `APP_VERSION_CODE` (nhưng không khuyến nghị)

## Tương lai

Có thể mở rộng với:
- Delta updates (chỉ download phần thay đổi)
- Staged rollout (rollout từng phần người dùng)
- A/B testing
- Analytics cho update rate

