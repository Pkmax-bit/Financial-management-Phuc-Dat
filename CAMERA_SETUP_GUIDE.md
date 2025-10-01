# 📷 Hướng Dẫn Kích Hoạt Camera cho AI Phân Tích Hóa Đơn

## 🌐 Hỗ Trợ Trình Duyệt

### ✅ **Trình Duyệt Được Hỗ Trợ**
- **Chrome** (Windows, Mac, Android, iOS) - ✅ Tốt nhất
- **Firefox** (Windows, Mac, Android, iOS) - ✅ Hỗ trợ đầy đủ
- **Safari** (Mac, iOS) - ✅ Hỗ trợ tốt
- **Edge** (Windows, Mac) - ✅ Hỗ trợ đầy đủ
- **Opera** (Windows, Mac, Android) - ✅ Hỗ trợ tốt

### ❌ **Trình Duyệt Không Được Hỗ Trợ**
- Internet Explorer (tất cả phiên bản)
- Trình duyệt cũ (phiên bản < 2018)

---

## 🔧 Cài Đặt Camera Theo Nền Tảng

### 🖥️ **Windows**

#### **Chrome/Edge:**
1. Mở **Settings** → **Privacy & Security** → **Site Settings**
2. Tìm trang web của bạn → **Camera**
3. Chọn **Allow** thay vì **Block**
4. Refresh trang web

#### **Firefox:**
1. Click vào **🔒** icon bên trái địa chỉ
2. Chọn **Camera** → **Allow**
3. Refresh trang web

#### **Kiểm Tra Windows:**
1. **Settings** → **Privacy** → **Camera**
2. Đảm bảo **"Allow apps to access your camera"** được bật
3. Kiểm tra **"Allow desktop apps to access your camera"**

### 🍎 **Mac (macOS)**

#### **Safari:**
1. **Safari** → **Preferences** → **Websites**
2. Chọn **Camera** → Tìm trang web
3. Chọn **Allow** thay vì **Deny**
4. Refresh trang web

#### **Chrome/Firefox:**
1. Click vào **🔒** icon bên trái địa chỉ
2. Chọn **Camera** → **Allow**
3. Refresh trang web

#### **Kiểm Tra macOS:**
1. **System Preferences** → **Security & Privacy** → **Privacy**
2. Chọn **Camera** → Đảm bảo trình duyệt được check
3. Restart trình duyệt nếu cần

### 📱 **Android**

#### **Chrome:**
1. Mở **Chrome** → **Settings** → **Site Settings**
2. Tìm trang web → **Camera**
3. Chọn **Allow**
4. Refresh trang web

#### **Firefox:**
1. Mở trang web → Click **🔒** icon
2. Chọn **Camera** → **Allow**
3. Refresh trang web

#### **Kiểm Tra Android:**
1. **Settings** → **Apps** → **Chrome/Firefox**
2. **Permissions** → **Camera** → **Allow**
3. Restart trình duyệt

### 🍎 **iOS (iPhone/iPad)**

#### **Safari:**
1. **Settings** → **Safari** → **Camera**
2. Chọn **Allow** cho trang web
3. Refresh trang web

#### **Chrome:**
1. **Settings** → **Chrome** → **Camera**
2. Chọn **Allow**
3. Refresh trang web

#### **Kiểm Tra iOS:**
1. **Settings** → **Privacy & Security** → **Camera**
2. Đảm bảo trình duyệt được bật
3. Restart trình duyệt

---

## 🚨 Xử Lý Lỗi Thường Gặp

### ❌ **"Camera not found"**
**Nguyên nhân:** Camera không được kết nối hoặc bị chặn
**Giải pháp:**
1. Kiểm tra camera có hoạt động không
2. Kiểm tra quyền truy cập camera
3. Restart trình duyệt
4. Thử trình duyệt khác

### ❌ **"Permission denied"**
**Nguyên nhân:** Trình duyệt từ chối quyền truy cập
**Giải pháp:**
1. Click vào **🔒** icon → **Camera** → **Allow**
2. Refresh trang web
3. Kiểm tra cài đặt hệ thống

### ❌ **"Camera already in use"**
**Nguyên nhân:** Camera đang được ứng dụng khác sử dụng
**Giải pháp:**
1. Đóng tất cả ứng dụng khác sử dụng camera
2. Restart trình duyệt
3. Restart máy tính/điện thoại

### ❌ **"HTTPS required"**
**Nguyên nhân:** Camera chỉ hoạt động trên HTTPS
**Giải pháp:**
1. Đảm bảo trang web sử dụng HTTPS
2. Nếu localhost, thử `https://localhost:3001`

---

## 🔍 Kiểm Tra Hỗ Trợ Camera

### **Test Camera Support:**
```javascript
// Mở Console (F12) và chạy lệnh này:
navigator.mediaDevices.getUserMedia({video: true})
  .then(stream => {
    console.log('✅ Camera supported!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.log('❌ Camera not supported:', err);
  });
```

### **Kiểm Tra Quyền Truy Cập:**
```javascript
// Kiểm tra quyền camera:
navigator.permissions.query({name: 'camera'})
  .then(result => {
    console.log('Camera permission:', result.state);
  });
```

---

## 🛠️ Cài Đặt Nâng Cao

### **Chrome Flags (Nếu cần):**
1. Gõ `chrome://flags/` vào thanh địa chỉ
2. Tìm **"WebRTC"** → **Enable**
3. Tìm **"Camera"** → **Enable**
4. Restart Chrome

### **Firefox Preferences:**
1. Gõ `about:config` vào thanh địa chỉ
2. Tìm `media.navigator.enabled` → **true**
3. Tìm `media.navigator.permission.disabled` → **false**
4. Restart Firefox

### **Safari Preferences:**
1. **Safari** → **Preferences** → **Advanced**
2. Check **"Show Develop menu"**
3. **Develop** → **Disable Cross-Origin Restrictions** (nếu cần)

---

## 📞 Hỗ Trợ Kỹ Thuật

### **Nếu Vẫn Không Hoạt Động:**

1. **Kiểm Tra Camera:**
   - Test camera với ứng dụng khác (Camera app, Zoom, etc.)
   - Đảm bảo camera không bị lỗi phần cứng

2. **Kiểm Tra Trình Duyệt:**
   - Update trình duyệt lên phiên bản mới nhất
   - Clear cache và cookies
   - Disable extensions có thể chặn camera

3. **Kiểm Tra Hệ Thống:**
   - Restart máy tính/điện thoại
   - Update drivers (Windows)
   - Kiểm tra antivirus có chặn camera không

4. **Thử Trình Duyệt Khác:**
   - Nếu Chrome không hoạt động, thử Firefox
   - Nếu Safari không hoạt động, thử Chrome

### **Liên Hệ Hỗ Trợ:**
- **Email:** support@company.com
- **Phone:** +84-xxx-xxx-xxx
- **Chat:** Live chat trên website

---

## ✅ Checklist Kích Hoạt Camera

- [ ] Trình duyệt được hỗ trợ (Chrome, Firefox, Safari, Edge)
- [ ] Trang web sử dụng HTTPS
- [ ] Quyền truy cập camera được cấp
- [ ] Camera không bị ứng dụng khác sử dụng
- [ ] Cài đặt hệ thống cho phép truy cập camera
- [ ] Trình duyệt được update lên phiên bản mới nhất
- [ ] Không có extension chặn camera
- [ ] Antivirus không chặn camera

**🎯 Sau khi hoàn thành checklist, camera sẽ hoạt động bình thường!**
