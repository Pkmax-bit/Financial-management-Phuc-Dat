# 🌐 HƯỚNG DẪN LẤY IP MÁY ẢO UBUNTU ĐỂ CẤU HÌNH API URL

## 📋 MỤC ĐÍCH

Lấy IP của máy ảo Ubuntu Linux để điền vào `NEXT_PUBLIC_API_URL` trong file `.env.local` của frontend, giúp frontend có thể kết nối với backend API.

---

## 🔍 BƯỚC 1: LẤY IP CỦA MÁY ẢO UBUNTU

### Cách 1: Sử dụng lệnh `hostname -I` (Đơn giản nhất)
```bash
hostname -I
```
Lệnh này sẽ hiển thị tất cả IP của máy ảo.

### Cách 2: Sử dụng lệnh `ip a`
```bash
ip a
```
Tìm dòng có `inet` và copy IP (ví dụ: `10.2.15` hoặc `192.168.1.x`)

### Cách 3: Lấy IP chính (không bao gồm loopback)
```bash
hostname -I | awk '{print $1}'
```

### Cách 4: Lấy IP của interface cụ thể
```bash
# Lấy IP của interface enp0s3 (thường dùng trong VirtualBox)
ip addr show enp0s3 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```

---

## ⚙️ BƯỚC 2: CẤU HÌNH VIRTUALBOX NETWORK

### Tùy chọn 1: NAT Network (Mặc định - IP thường là 10.2.x.x)

**Vấn đề:** IP `10.2.15` không thể truy cập từ máy host Windows.

**Giải pháp:** Cấu hình Port Forwarding trong VirtualBox:

1. **Tắt máy ảo Ubuntu**
2. **Mở VirtualBox Manager**
3. **Chọn máy ảo Ubuntu → Settings → Network**
4. **Chọn Adapter 1 → Advanced → Port Forwarding**
5. **Thêm rules:**

| Name | Protocol | Host IP | Host Port | Guest IP | Guest Port |
|------|----------|---------|-----------|-----------|------------|
| Backend API | TCP | 127.0.0.1 | 8000 | 10.2.15 | 8000 |
| Frontend | TCP | 127.0.0.1 | 3000 | 10.2.15 | 3000 |

6. **Khởi động lại máy ảo**

**Sau đó sử dụng:**
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
```
hoặc
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

---

### Tùy chọn 2: Bridged Adapter (Khuyến nghị - IP thật trên mạng LAN)

**Ưu điểm:** Máy ảo có IP thật trên mạng LAN, có thể truy cập từ máy host và các thiết bị khác.

**Cách cấu hình:**

1. **Tắt máy ảo Ubuntu**
2. **Mở VirtualBox Manager**
3. **Chọn máy ảo Ubuntu → Settings → Network**
4. **Chọn Adapter 1 → Attached to: Bridged Adapter**
5. **Chọn tên card mạng của máy host (ví dụ: Wi-Fi hoặc Ethernet)**
6. **Khởi động lại máy ảo**

**Sau khi khởi động, kiểm tra IP:**
```bash
hostname -I
```

IP sẽ có dạng `192.168.1.x` hoặc `192.168.0.x` (tùy mạng của bạn).

**Ví dụ:** Nếu IP là `192.168.1.16`, cấu hình:
```env
NEXT_PUBLIC_API_URL="http://192.168.1.16:8000"
```

---

### Tùy chọn 3: Host-Only Adapter (Chỉ truy cập từ máy host)

**Ưu điểm:** An toàn, chỉ máy host có thể truy cập.

**Cách cấu hình:**

1. **Tắt máy ảo Ubuntu**
2. **Mở VirtualBox Manager → File → Host Network Manager**
3. **Tạo mới hoặc sử dụng adapter có sẵn**
4. **Chọn máy ảo Ubuntu → Settings → Network → Adapter 1**
5. **Chọn Attached to: Host-only Adapter**
6. **Chọn adapter vừa tạo**
7. **Khởi động lại máy ảo**

**Kiểm tra IP:**
```bash
hostname -I
```

IP thường có dạng `192.168.56.x`

---

## 📝 BƯỚC 3: CẬP NHẬT FILE .env.local

### Trên máy ảo Ubuntu:

```bash
# Di chuyển vào thư mục frontend
cd ~/Financial-management-Phuc-Dat/frontend

# Mở file .env.local
nano .env.local
# hoặc
vim .env.local
```

### Cập nhật dòng:
```env
NEXT_PUBLIC_API_URL="http://<IP_MÁY_ẢO>:8000"
```

**Ví dụ:**
- Nếu dùng Bridged Adapter và IP là `192.168.1.16`:
  ```env
  NEXT_PUBLIC_API_URL="http://192.168.1.16:8000"
  ```

- Nếu dùng NAT với Port Forwarding:
  ```env
  NEXT_PUBLIC_API_URL="http://localhost:8000"
  ```
  hoặc
  ```env
  NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
  ```

---

## 🔧 BƯỚC 4: CẤU HÌNH FIREWALL (Nếu cần)

Nếu không kết nối được, có thể cần mở port trên firewall:

```bash
# Kiểm tra firewall status
sudo ufw status

# Mở port 8000 (Backend API)
sudo ufw allow 8000/tcp

# Mở port 3000 (Frontend - nếu cần)
sudo ufw allow 3000/tcp

# Kiểm tra lại
sudo ufw status
```

---

## 🧪 BƯỚC 5: KIỂM TRA KẾT NỐI

### Từ máy ảo Ubuntu:
```bash
# Kiểm tra backend API có chạy không
curl http://localhost:8000/docs
```

### Từ máy host Windows:
```bash
# Mở PowerShell hoặc CMD
# Kiểm tra kết nối đến máy ảo
ping <IP_MÁY_ẢO>

# Kiểm tra API
curl http://<IP_MÁY_ẢO>:8000/docs
```

---

## 🚀 SCRIPT TỰ ĐỘNG LẤY IP VÀ CẬP NHẬT FILE

Tạo script `update_api_url.sh`:

```bash
#!/bin/bash

# Lấy IP của máy ảo
IP=$(hostname -I | awk '{print $1}')

echo "IP của máy ảo: $IP"

# Đường dẫn file .env.local
ENV_FILE="frontend/.env.local"

# Kiểm tra file có tồn tại không
if [ ! -f "$ENV_FILE" ]; then
    echo "File $ENV_FILE không tồn tại. Đang tạo từ env.local.example..."
    cp frontend/env.local.example "$ENV_FILE"
fi

# Cập nhật NEXT_PUBLIC_API_URL
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=\"http://$IP:8000\"|g" "$ENV_FILE"

echo "Đã cập nhật NEXT_PUBLIC_API_URL=\"http://$IP:8000\" trong $ENV_FILE"
echo ""
echo "Nội dung file:"
grep "NEXT_PUBLIC_API_URL" "$ENV_FILE"
```

**Sử dụng:**
```bash
chmod +x update_api_url.sh
./update_api_url.sh
```

---

## 📊 TÓM TẮT CÁC TÙY CHỌN

| Network Mode | IP Ví dụ | Cấu hình | Ưu điểm | Nhược điểm |
|--------------|----------|----------|---------|------------|
| **NAT + Port Forwarding** | 127.0.0.1 | `http://localhost:8000` | Dễ setup | Chỉ truy cập từ host |
| **Bridged Adapter** | 192.168.1.16 | `http://192.168.1.16:8000` | IP thật, truy cập từ mọi nơi | Cần IP tĩnh |
| **Host-Only** | 192.168.56.x | `http://192.168.56.x:8000` | An toàn | Chỉ truy cập từ host |

---

## 💡 KHUYẾN NGHỊ

1. **Nếu chỉ test trên máy host:** Dùng **NAT + Port Forwarding** với `localhost:8000`
2. **Nếu cần truy cập từ nhiều thiết bị:** Dùng **Bridged Adapter** với IP thật
3. **Nếu cần bảo mật:** Dùng **Host-Only Adapter**

---

## 🐛 XỬ LÝ LỖI

### Lỗi: Connection refused
- Kiểm tra backend có đang chạy không: `ps aux | grep uvicorn`
- Kiểm tra firewall: `sudo ufw status`
- Kiểm tra backend có bind đúng host: `--host 0.0.0.0`

### Lỗi: Cannot connect
- Kiểm tra IP có đúng không: `hostname -I`
- Kiểm tra port có mở không: `sudo netstat -tulpn | grep 8000`
- Kiểm tra VirtualBox network settings

### Lỗi: CORS error
- Đảm bảo backend cho phép CORS từ frontend
- Kiểm tra `CORS_ORIGINS` trong backend config

---

**Chúc bạn cấu hình thành công! 🎉**

