# 🌐 Network Access - Quick Start

## 🚀 Cách chạy nhanh nhất

### Windows:
```bash
# Cách 1: Double-click file
start_network.bat

# Cách 2: Chạy Python script
python start_network.py

# Cách 3: Dùng npm
npm run dev:network
```

### Linux/Mac:
```bash
# Cách 1: Chạy shell script
./start_network.sh

# Cách 2: Chạy Python script
python3 start_network.py

# Cách 3: Dùng npm
npm run dev:network
```

## 📱 Truy cập từ thiết bị khác

1. **Đảm bảo thiết bị cùng mạng WiFi**
2. **Lấy IP từ output** (ví dụ: `192.168.1.25`)
3. **Mở trình duyệt** và truy cập: `http://[IP]:3000`
4. **Đăng nhập** với tài khoản test

## 🔑 Tài khoản test

- **Admin:** admin@test.com / 123456
- **Sales:** sales@example.com / 123456
- **Workshop:** xuong@gmail.com / 123456

## ⚠️ Lưu ý

- Nếu không truy cập được, kiểm tra **Windows Firewall**
- Xem hướng dẫn chi tiết: [HUONG_DAN_NETWORK.md](./HUONG_DAN_NETWORK.md)

## 🆘 Xử lý sự cố

1. **Port đã được sử dụng:** Dừng process đang dùng port 3000 hoặc 8000
2. **Firewall chặn:** Cho phép Python và Node.js qua firewall
3. **IP không đúng:** Chạy `ipconfig` (Windows) hoặc `ifconfig` (Linux/Mac) để kiểm tra

---

**Xem hướng dẫn đầy đủ:** [HUONG_DAN_NETWORK.md](./HUONG_DAN_NETWORK.md)

