# Hướng dẫn Tắt Backend và Frontend

## 📋 Tổng quan

Các file script này giúp bạn tắt Backend và Frontend server một cách dễ dàng.

## 📁 Các file đã tạo

### Windows (.bat)
- `stop_backend.bat` - Tắt Backend server
- `stop_frontend.bat` - Tắt Frontend server  
- `stop_all.bat` - Tắt cả Backend và Frontend

### Linux/Mac (.sh)
- `stop_backend.sh` - Tắt Backend server
- `stop_frontend.sh` - Tắt Frontend server
- `stop_all.sh` - Tắt cả Backend và Frontend

## 🚀 Cách sử dụng

### Windows

#### Tắt Backend
```bash
stop_backend.bat
```
Hoặc double-click vào file `stop_backend.bat`

#### Tắt Frontend
```bash
stop_frontend.bat
```
Hoặc double-click vào file `stop_frontend.bat`

#### Tắt tất cả
```bash
stop_all.bat
```
Hoặc double-click vào file `stop_all.bat`

### Linux/Mac

Trước tiên, cần cấp quyền thực thi:
```bash
chmod +x stop_backend.sh stop_frontend.sh stop_all.sh
```

#### Tắt Backend
```bash
./stop_backend.sh
```

#### Tắt Frontend
```bash
./stop_frontend.sh
```

#### Tắt tất cả
```bash
./stop_all.sh
```

## 🔍 Chi tiết

### Backend Server
- **Port**: 8000
- **Process**: Python/uvicorn
- Script sẽ:
  1. Tìm và dừng process trên port 8000
  2. Dừng tất cả process Python/uvicorn

### Frontend Server
- **Port**: 3000 (Next.js default)
- **Process**: Node.js/Next.js
- Script sẽ:
  1. Tìm và dừng process trên port 3000
  2. Dừng tất cả process Node.js/Next.js

## ⚠️ Lưu ý

1. **Windows**: Script sẽ dừng TẤT CẢ process Python/Node.js, không chỉ của project này
2. **Linux/Mac**: Script sẽ dừng các process liên quan đến uvicorn và Next.js
3. Nếu có các ứng dụng khác đang chạy trên port 8000 hoặc 3000, chúng cũng sẽ bị dừng
4. Script `stop_all.bat`/`stop_all.sh` sẽ kiểm tra lại các port sau khi dừng

## 🛠️ Troubleshooting

### Port vẫn đang được sử dụng

**Windows:**
```bash
# Kiểm tra process trên port 8000
netstat -ano | findstr :8000

# Kiểm tra process trên port 3000
netstat -ano | findstr :3000

# Dừng process theo PID
taskkill /F /PID <PID_NUMBER>
```

**Linux/Mac:**
```bash
# Kiểm tra process trên port 8000
lsof -ti:8000

# Kiểm tra process trên port 3000
lsof -ti:3000

# Dừng process theo PID
kill -9 <PID_NUMBER>
```

### Process không dừng được

Nếu script không thể dừng process, bạn có thể:

1. **Windows**: Mở Task Manager và dừng process thủ công
2. **Linux/Mac**: Sử dụng `kill -9 <PID>` để force kill

## 📝 Ví dụ sử dụng

### Scenario 1: Tắt Backend để restart
```bash
# Windows
stop_backend.bat

# Sau đó chạy lại
cd backend
python -m uvicorn main:app --reload
```

### Scenario 2: Tắt Frontend để cài đặt package mới
```bash
# Windows
stop_frontend.bat

# Sau đó cài đặt và chạy lại
cd frontend
npm install
npm run dev
```

### Scenario 3: Tắt tất cả để bảo trì
```bash
# Windows
stop_all.bat

# Linux/Mac
./stop_all.sh
```

## 🔗 Liên quan

- File start: `start_network.bat` / `start_network.sh`
- File restart: `restart_backend.bat`
- Package.json scripts: `npm run dev`, `npm run dev:backend`, `npm run dev:frontend`

