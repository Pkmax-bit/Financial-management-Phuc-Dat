# 📊 HƯỚNG DẪN XEM KẾT QUẢ TEST PHASE 1

## ⚠️ Lưu ý quan trọng

**Backend hiện chưa chạy**, nên không thể chạy test tự động ngay bây giờ.

## 🚀 Cách chạy test và xem kết quả

### Bước 1: Khởi động backend
Mở một terminal và chạy:
```bash
npm run dev:backend
```

Hoặc:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Đợi đến khi thấy:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Bước 2: Chạy test tự động
Mở terminal mới và chạy:
```bash
python scripts/auto_test_phase1.py
```

### Bước 3: Xem kết quả

#### Kết quả trên Console
Script sẽ hiển thị kết quả real-time:
```
============================================================
🧪 TỰ ĐỘNG TEST PHASE 1
============================================================

🔍 Kiểm tra backend...
✅ PASS - Backend is running

Bắt đầu test Phase 1...

🧪 Health Check... ✅ PASS
🧪 TC 1.1.1: Đăng ký tài khoản... ✅ PASS
🧪 TC 1.1.2: Đăng nhập... ✅ PASS
🧪 TC 1.1.3: Đăng nhập sai thông tin... ✅ PASS
🧪 TC 1.1.5: Lấy thông tin user... ✅ PASS
🧪 TC 1.1.6: Cập nhật thông tin user... ✅ PASS
🧪 TC 1.2.1: Tạo khách hàng... ✅ PASS
🧪 TC 1.2.2: Danh sách khách hàng... ✅ PASS
🧪 TC 1.2.6: Tìm kiếm khách hàng... ✅ PASS
🧪 TC 1.2.7: Lọc khách hàng... ✅ PASS
🧪 TC 1.3.2: Danh sách nhân viên... ✅ PASS
🧪 TC 1.4.1: Dashboard... ✅ PASS
🧪 TC 1.5.1: Phân quyền... ✅ PASS
🧪 TC 1.1.4: Đăng xuất... ✅ PASS

============================================================
📊 TỔNG KẾT TEST PHASE 1
============================================================
Tổng số test cases: 14
✅ Passed: 14
❌ Failed: 0
⏱️  Tổng thời gian: 3.49s

🎉 Tất cả test cases đều PASS!

💾 Kết quả đã được lưu vào: test_results_phase1.json
```

#### Kết quả trong file JSON
Sau khi chạy xong, mở file `test_results_phase1.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "total": 14,
  "passed": 14,
  "failed": 0,
  "results": [
    {
      "name": "TC 1.1.1: Đăng ký tài khoản",
      "passed": true,
      "error": null,
      "duration": 0.45,
      "status_code": 201
    },
    ...
  ]
}
```

## 📋 Các test cases được test

### ✅ Authentication & User Management (6)
1. Health Check
2. TC 1.1.1: Đăng ký tài khoản mới
3. TC 1.1.2: Đăng nhập
4. TC 1.1.3: Đăng nhập với thông tin sai
5. TC 1.1.5: Lấy thông tin người dùng hiện tại
6. TC 1.1.6: Cập nhật thông tin người dùng
7. TC 1.1.4: Đăng xuất

### ✅ Customer Management (4)
8. TC 1.2.1: Tạo khách hàng mới
9. TC 1.2.2: Xem danh sách khách hàng
10. TC 1.2.6: Tìm kiếm khách hàng
11. TC 1.2.7: Lọc khách hàng theo loại

### ✅ Employee Management (1)
12. TC 1.3.2: Xem danh sách nhân viên

### ✅ Dashboard (1)
13. TC 1.4.1: Xem Dashboard tổng quan

### ✅ Phân quyền và Bảo mật (1)
14. TC 1.5.1: Kiểm tra phân quyền

## 🔍 Phân tích kết quả

### Nếu tất cả PASS (14/14)
✅ Hệ thống hoạt động tốt
✅ Các API endpoints hoạt động đúng
✅ Authentication và Authorization hoạt động
✅ Có thể tiếp tục test Phase 2

### Nếu có FAIL
1. **Xem chi tiết lỗi** trong console output
2. **Kiểm tra status code** trong JSON file
3. **Xem error message** để biết nguyên nhân
4. **Fix lỗi** và chạy lại test

### Các lỗi thường gặp

#### ❌ Backend không kết nối được
```
Cannot connect to backend: Connection refused
```
**Giải pháp**: Khởi động backend trước

#### ❌ 401 Unauthorized
```
Status 401: Unauthorized
```
**Giải pháp**: Kiểm tra authentication endpoint

#### ❌ 403 Forbidden
```
Status 403: Forbidden
```
**Giải pháp**: User cần có đủ quyền (admin/sales)

#### ❌ 500 Internal Server Error
```
Status 500: Internal Server Error
```
**Giải pháp**: Kiểm tra backend logs, có thể lỗi database

## 📊 Ví dụ kết quả mẫu

Xem file `test_results_phase1_sample.json` để biết format kết quả mong đợi.

## 🎯 Bước tiếp theo

Sau khi test Phase 1 thành công:
1. ✅ Tổng hợp kết quả
2. ✅ Fix các bug nếu có
3. ✅ Chuyển sang test Phase 2
4. ✅ Hoặc tiếp tục manual test cho UI/UX

---

**Lưu ý**: Để chạy test, bạn cần khởi động backend trước. Script sẽ tự động kiểm tra và báo lỗi nếu backend chưa sẵn sàng.








