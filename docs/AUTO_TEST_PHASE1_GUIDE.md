# 🤖 HƯỚNG DẪN TỰ ĐỘNG TEST PHASE 1

## 📋 Tổng quan

Script tự động test Phase 1 sẽ kiểm tra các chức năng cơ bản của hệ thống thông qua API calls.

## ⚡ Quick Start

### 1. Đảm bảo backend đang chạy
```bash
# Kiểm tra backend
curl http://localhost:8000/health

# Hoặc khởi động nếu chưa chạy
npm run dev:backend
```

### 2. Chạy script tự động test
```bash
# Chạy với Python
python scripts/auto_test_phase1.py

# Hoặc chỉ định URL backend khác
python scripts/auto_test_phase1.py --url http://localhost:8000
```

## 📦 Dependencies

Script cần thư viện `requests`:
```bash
pip install requests
```

Hoặc nếu đã có `requirements.txt`:
```bash
pip install -r backend/requirements.txt
```

## 🎯 Test Cases được tự động test

Script sẽ tự động test các chức năng sau:

### ✅ Authentication & User Management
- [x] TC 1.1.1: Đăng ký tài khoản mới
- [x] TC 1.1.2: Đăng nhập
- [x] TC 1.1.3: Đăng nhập với thông tin sai
- [x] TC 1.1.5: Lấy thông tin người dùng hiện tại
- [x] TC 1.1.6: Cập nhật thông tin người dùng
- [x] TC 1.1.4: Đăng xuất

### ✅ Customer Management
- [x] TC 1.2.1: Tạo khách hàng mới
- [x] TC 1.2.2: Xem danh sách khách hàng
- [x] TC 1.2.6: Tìm kiếm khách hàng
- [x] TC 1.2.7: Lọc khách hàng theo loại

### ✅ Employee Management
- [x] TC 1.3.2: Xem danh sách nhân viên

### ✅ Dashboard
- [x] TC 1.4.1: Xem Dashboard tổng quan

### ✅ Phân quyền và Bảo mật
- [x] TC 1.5.1: Kiểm tra phân quyền

## 📊 Kết quả

### Console Output
Script sẽ hiển thị kết quả real-time:
```
🧪 TEST PHASE 1
============================================================

🔍 Kiểm tra backend...
✅ PASS - Backend is running

Bắt đầu test Phase 1...

🧪 Health Check... ✅ PASS
🧪 TC 1.1.1: Đăng ký tài khoản... ✅ PASS
🧪 TC 1.1.2: Đăng nhập... ✅ PASS
...

📊 TỔNG KẾT TEST PHASE 1
============================================================
Tổng số test cases: 14
✅ Passed: 14
❌ Failed: 0
⏱️  Tổng thời gian: 2.34s

🎉 Tất cả test cases đều PASS!
```

### JSON Report
Kết quả chi tiết được lưu vào file `test_results_phase1.json`:
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
      "status_code": 200
    },
    ...
  ]
}
```

## 🔧 Tùy chỉnh

### Thay đổi Backend URL
```bash
python scripts/auto_test_phase1.py --url http://your-backend-url:8000
```

### Chỉ test một số test cases
Sửa file `scripts/auto_test_phase1.py`, comment các test cases không cần:
```python
test_cases = [
    ("TC 1.1.1: Đăng ký tài khoản", self.test_1_1_1_register),
    # ("TC 1.1.2: Đăng nhập", self.test_1_1_2_login),  # Comment này
    ...
]
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to backend
```
❌ Cannot connect to backend: Connection refused
⚠️  Hãy chạy: npm run dev:backend
```
**Giải pháp**: Khởi động backend trước khi chạy test

### Lỗi: 401 Unauthorized
```
❌ Status 401: Unauthorized
```
**Giải pháp**: 
- Kiểm tra authentication endpoint hoạt động đúng
- Kiểm tra token được lưu và sử dụng đúng

### Lỗi: 403 Forbidden
```
❌ Status 403: Forbidden
```
**Giải pháp**: 
- User cần có đủ quyền (role admin/sales cho customer management)
- Kiểm tra RBAC middleware

### Lỗi: Module 'requests' not found
```
ModuleNotFoundError: No module named 'requests'
```
**Giải pháp**: 
```bash
pip install requests
```

## 📝 Lưu ý

1. **Dữ liệu test**: Script sẽ tạo dữ liệu test (users, customers). Có thể xóa sau khi test.

2. **Token expiration**: Nếu test chạy lâu, token có thể hết hạn. Script sẽ tự động login lại nếu cần.

3. **Database**: Đảm bảo database đã được setup và có thể kết nối.

4. **Permissions**: Một số test cần user có role admin/sales. Script sẽ tạo user với role "employee" mặc định.

## 🎯 So sánh với Manual Test

| Aspect | Auto Test | Manual Test |
|---------|-----------|-------------|
| **Tốc độ** | ⚡ Nhanh (vài giây) | 🐌 Chậm (vài giờ) |
| **Coverage** | API endpoints | UI + API |
| **Reliability** | ✅ Consistent | ⚠️ Có thể miss |
| **UI Testing** | ❌ Không | ✅ Có |
| **Edge Cases** | ⚠️ Limited | ✅ Tốt hơn |

**Khuyến nghị**: 
- Dùng **Auto Test** cho regression testing và CI/CD
- Dùng **Manual Test** cho UI/UX và edge cases

## 🚀 Tích hợp vào CI/CD

Có thể tích hợp script vào CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Test Phase 1

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install requests
      - name: Start backend
        run: |
          npm run dev:backend &
          sleep 10
      - name: Run Phase 1 tests
        run: |
          python scripts/auto_test_phase1.py
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test_results_phase1.json
```

## 📚 Xem thêm

- **Manual Test Guide**: `docs/TEST_PHASE_1_GUIDE.md`
- **Test Checklist**: `docs/TEST_CHECKLIST_3_PHASES.md`
- **Full Test Scenarios**: `docs/TEST_SCENARIOS_3_PHASES.md`

---

**Chúc bạn test thành công! 🎉**





