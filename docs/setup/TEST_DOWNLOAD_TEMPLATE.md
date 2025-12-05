# 🧪 Test Download Template Endpoint

## 🔧 Khắc phục lỗi 403 "Not authenticated"

### ⚠️ QUAN TRỌNG: Backend PHẢI RESTART sau khi sửa code!

## Các bước kiểm tra và khắc phục:

### Bước 1: RESTART Backend
```bash
# Dừng backend hiện tại (Ctrl+C)
cd backend

# Khởi động lại backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Lưu ý:** `--reload` sẽ tự động restart khi file thay đổi, nhưng bạn cần khởi động lại lần đầu sau khi sửa code!

### Bước 2: Test endpoint public
Mở trình duyệt và test các endpoint sau:

#### Test 1: Root endpoint
```
http://localhost:8000/
```
Kết quả mong đợi:
```json
{
  "message": "Financial Management API is running!",
  "version": "1.0.0",
  "status": "healthy"
}
```

#### Test 2: Public test endpoint
```
http://localhost:8000/api/employees/public-test
```
Kết quả mong đợi:
```json
{
  "message": "Public endpoint working!",
  "status": "success",
  "note": "This endpoint does not require authentication"
}
```

#### Test 3: Download template endpoint
```
http://localhost:8000/api/employees/download-template
```
Kết quả mong đợi: File Excel được tải xuống

### Bước 3: Test từ frontend

Mở Console (F12) và chạy:

```javascript
// Test public endpoint
fetch('http://localhost:8000/api/employees/public-test')
  .then(res => res.json())
  .then(data => console.log('✅ Public test:', data))
  .catch(err => console.error('❌ Error:', err))

// Test download template
fetch('http://localhost:8000/api/employees/download-template')
  .then(res => {
    console.log('Status:', res.status)
    console.log('OK:', res.ok)
    if (res.ok) {
      return res.blob()
    }
    throw new Error('Failed')
  })
  .then(blob => console.log('✅ Blob size:', blob.size))
  .catch(err => console.error('❌ Error:', err))
```

## 🔍 Debug checklist:

### ✅ Backend đã restart?
```bash
# Kiểm tra backend có đang chạy không
curl http://localhost:8000/health

# Hoặc trong PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/health"
```

### ✅ Code đã được deploy?
Kiểm tra file `backend/routers/employees.py` dòng 761:
```python
@router.get("/download-template")
async def download_employee_template():  # Không có current_user: User = Depends(get_current_user)
```

### ✅ Backend log có lỗi?
Xem terminal backend có hiển thị lỗi gì không:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🚨 Nếu vẫn lỗi 403:

### Cách 1: Hard restart backend
```bash
# Dừng tất cả process Python
# Windows PowerShell:
Get-Process python | Stop-Process -Force

# Sau đó khởi động lại
cd backend
python -m uvicorn main:app --reload
```

### Cách 2: Kiểm tra port
```bash
# Kiểm tra port 8000 có bị chiếm không
# Windows PowerShell:
netstat -ano | findstr :8000

# Kill process nếu cần:
taskkill /PID <PID> /F
```

### Cách 3: Test với curl
```bash
# Test trực tiếp với curl (không qua frontend)
curl -X GET "http://localhost:8000/api/employees/download-template" --output test.xlsx

# Hoặc PowerShell:
Invoke-WebRequest -Uri "http://localhost:8000/api/employees/download-template" -OutFile "test.xlsx"
```

## 📊 Expected Results:

### ✅ Thành công:
```
Console log:
Downloading template from: http://localhost:8000/api/employees/download-template
🎉 Endpoint is public - No authentication required!
Response status: 200
Response ok: true
Blob size: 45678 bytes
✅ Template downloaded successfully!
```

File `mau_nhap_nhan_vien.xlsx` được tải về thành công!

### ❌ Thất bại:
```
Console log:
Error response: {}
Not authenticated (Status: 403)
```

→ Backend chưa restart hoặc code chưa được apply!

## 🔄 Script restart backend tự động:

Tạo file `backend/restart.bat` (Windows):
```batch
@echo off
echo Stopping backend...
taskkill /F /IM python.exe 2>nul
timeout /t 2
echo Starting backend...
cd /d "%~dp0"
python -m uvicorn main:app --reload
```

Tạo file `backend/restart.sh` (Linux/Mac):
```bash
#!/bin/bash
echo "Stopping backend..."
pkill -f "uvicorn main:app"
sleep 2
echo "Starting backend..."
cd "$(dirname "$0")"
python -m uvicorn main:app --reload
```

Chạy:
```bash
# Windows
cd backend
restart.bat

# Linux/Mac
cd backend
chmod +x restart.sh
./restart.sh
```

## ✅ Checklist cuối cùng:

- [ ] Backend đã được restart SAU KHI sửa code
- [ ] Test endpoint `/api/employees/public-test` trả về 200
- [ ] Test endpoint `/api/employees/download-template` trả về file
- [ ] Console không còn hiển thị lỗi 403
- [ ] File Excel được tải xuống thành công

## 🎉 Sau khi fix xong:

Frontend sẽ hiển thị:
```
✅ Template downloaded successfully!
```

File `mau_nhap_nhan_vien.xlsx` với 5 sheets và dropdown lists!

