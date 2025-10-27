# HƯỚNG DẪN KHẮC PHỤC LỖI NETWORK CHO MOBILE DEVICE

## 🔍 PHÂN TÍCH VẤN ĐỀ

Từ các hình ảnh lỗi bạn cung cấp, tôi thấy các lỗi sau:

1. **"Network error: Failed to fetch"** - Lỗi kết nối mạng
2. **"Console TypeError: Failed to fetch"** - Lỗi fetch API
3. **IP Address: 192.168.1.25** - Địa chỉ mạng local

## 🛠️ NGUYÊN NHÂN VÀ GIẢI PHÁP

### 1. Backend Server Chưa Chạy Hoặc Không Accessible

**Vấn đề:** Backend server không chạy hoặc không thể truy cập từ mobile device.

**Giải pháp:**
```bash
# Chạy script khởi động backend với network access
python start_backend_network.py
```

### 2. Cấu Hình IP Address Không Đúng

**Vấn đề:** Mobile app đang cố kết nối đến `192.168.1.25:8000` nhưng server không chạy trên IP này.

**Kiểm tra IP thực tế:**
```bash
ipconfig
# Tìm IPv4 Address của WiFi adapter
```

**Cập nhật cấu hình trong Android app:**

File: `AppConfig.java`
```java
public static String getBaseUrl() {
    switch (CURRENT_ENVIRONMENT) {
        case LOCAL:
            return "http://YOUR_ACTUAL_IP:8000/api/";  // Thay YOUR_ACTUAL_IP
        case NETWORK:
            return "http://YOUR_ACTUAL_IP:3000/api/";   // Thay YOUR_ACTUAL_IP
        default:
            return "http://YOUR_ACTUAL_IP:8000/api/";   // Thay YOUR_ACTUAL_IP
    }
}
```

File: `NetworkConfig.java`
```java
public static final String LOCAL_URL = "http://YOUR_ACTUAL_IP:8000/api/";
public static final String NETWORK_URL = "http://YOUR_ACTUAL_IP:3000/api/";
```

### 3. Firewall Windows Chặn Kết Nối

**Vấn đề:** Windows Firewall chặn kết nối từ mobile device.

**Giải pháp:**
1. Mở Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" → "Allow another app..."
4. Browse đến Python executable
5. Check cả "Private" và "Public"
6. Hoặc tạm thời tắt firewall để test

### 4. CORS Configuration

**Vấn đề:** CORS không cho phép mobile app truy cập.

**Đã được cấu hình trong `main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.*:3000",
        "http://192.168.*:3001",
        "*"  # Cho phép tất cả origins trong development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚀 CÁC BƯỚC KHẮC PHỤC

### Bước 1: Kiểm Tra Backend Server
```bash
# Chạy script khởi động
python start_backend_network.py

# Hoặc chạy trực tiếp
cd backend
python main.py
```

### Bước 2: Kiểm Tra Kết Nối Mạng
```bash
# Test từ máy tính
curl http://192.168.1.25:8000/health

# Hoặc dùng Python
python -c "import requests; print(requests.get('http://192.168.1.25:8000/health').json())"
```

### Bước 3: Cập Nhật IP Trong Mobile App
1. Tìm IP thực tế của máy tính: `ipconfig`
2. Cập nhật `AppConfig.java` và `NetworkConfig.java`
3. Rebuild Android app

### Bước 4: Kiểm Tra Firewall
- Tạm thời tắt Windows Firewall
- Hoặc thêm exception cho Python

### Bước 5: Test Kết Nối
1. Đảm bảo điện thoại và máy tính cùng WiFi
2. Mở browser trên điện thoại
3. Truy cập: `http://YOUR_IP:8000/docs`
4. Nếu thấy API docs thì backend OK

## 🔧 SCRIPT TỰ ĐỘNG KIỂM TRA

Tôi đã tạo script `start_backend_network.py` để:
- Tự động khởi động backend
- Kiểm tra kết nối mạng
- Test CORS headers
- Cung cấp hướng dẫn chi tiết

## 📱 CẤU HÌNH MOBILE APP

### Environment Configuration
```java
// AppConfig.java
private static final Environment CURRENT_ENVIRONMENT = Environment.LOCAL;
```

### Network URLs
```java
// NetworkConfig.java
public static final String LOCAL_URL = "http://192.168.1.25:8000/api/";
public static final String NETWORK_URL = "http://192.168.1.25:3000/api/";
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **IP Address:** Đảm bảo IP trong app config khớp với IP thực tế của máy tính
2. **Port:** Backend chạy trên port 8000, frontend trên port 3000
3. **Network:** Điện thoại và máy tính phải cùng mạng WiFi
4. **Firewall:** Windows Firewall có thể chặn kết nối
5. **CORS:** Đã cấu hình để cho phép tất cả origins trong development

## 🆘 NẾU VẪN LỖI

1. Kiểm tra log backend: `python backend/main.py`
2. Kiểm tra log mobile app trong Android Studio
3. Test với Postman hoặc curl
4. Kiểm tra network connectivity giữa devices
5. Thử với IP khác hoặc port khác