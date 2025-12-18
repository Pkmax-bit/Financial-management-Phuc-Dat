# 🌐 HƯỚNG DẪN TEST PHASE 1 BẰNG BROWSER

## 📋 Tổng quan

Script test bằng browser sử dụng **Playwright** để tự động test Phase 1 thông qua giao diện web. Điều này cho phép test cả UI và tương tác người dùng thực tế.

## ⚡ Quick Start

### Bước 1: Cài đặt Playwright

```bash
# Cài đặt Playwright
pip install playwright

# Cài đặt browser (Chromium)
playwright install chromium
```

### Bước 2: Khởi động ứng dụng

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Đợi đến khi cả hai đều chạy:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

### Bước 3: Chạy test bằng browser

```bash
# Chạy với browser hiển thị (xem được quá trình test)
python scripts/browser_test_phase1.py

# Hoặc chạy ở chế độ ẩn (headless - nhanh hơn)
python scripts/browser_test_phase1.py --headless

# Hoặc chỉ định URL khác
python scripts/browser_test_phase1.py --url http://localhost:3000
```

## 🎯 Test Cases được test

Script sẽ tự động:

### ✅ Authentication & User Management
1. **TC 1.1.1**: Đăng ký tài khoản mới
   - Mở trang `/register`
   - Điền form đăng ký
   - Submit và kiểm tra kết quả

2. **TC 1.1.2**: Đăng nhập
   - Mở trang `/login`
   - Điền email và password
   - Kiểm tra redirect đến dashboard

3. **TC 1.1.3**: Đăng nhập với thông tin sai
   - Thử đăng nhập với thông tin sai
   - Kiểm tra hiển thị thông báo lỗi

4. **TC 1.1.4**: Đăng xuất
   - Tìm và click nút logout
   - Kiểm tra redirect về login

### ✅ Customer Management
5. **TC 1.2.2**: Xem danh sách khách hàng
   - Truy cập `/customers`
   - Kiểm tra danh sách hiển thị

6. **TC 1.2.1**: Tạo khách hàng mới
   - Click nút "Tạo khách hàng"
   - Điền form
   - Submit và kiểm tra

### ✅ Dashboard
7. **TC 1.4.1**: Xem Dashboard
   - Truy cập `/dashboard`
   - Kiểm tra các widget hiển thị

### ✅ Employee Management
8. **TC 1.3.2**: Xem danh sách nhân viên
   - Truy cập `/employees`
   - Kiểm tra danh sách hiển thị

## 📊 Kết quả

### Console Output
```
============================================================
🌐 TỰ ĐỘNG TEST PHASE 1 BẰNG BROWSER
============================================================

🔍 Kiểm tra frontend...
✅ PASS - Frontend is accessible

Bắt đầu test Phase 1 qua browser...

💡 Browser sẽ hiển thị trong quá trình test

🧪 TC 1.1.1: Đăng ký tài khoản... ✅ PASS
🧪 TC 1.1.2: Đăng nhập... ✅ PASS
🧪 TC 1.1.3: Đăng nhập sai thông tin... ✅ PASS
🧪 TC 1.2.2: Danh sách khách hàng... ✅ PASS
🧪 TC 1.2.1: Tạo khách hàng... ✅ PASS
🧪 TC 1.4.1: Dashboard... ✅ PASS
🧪 TC 1.3.2: Danh sách nhân viên... ✅ PASS
🧪 TC 1.1.4: Đăng xuất... ✅ PASS

============================================================
📊 TỔNG KẾT TEST PHASE 1 (BROWSER)
============================================================
Tổng số test cases: 8
✅ Passed: 8
❌ Failed: 0
⏱️  Tổng thời gian: 45.23s
📸 Screenshots: test_screenshots_phase1

💾 Kết quả đã được lưu vào: test_results_phase1_browser.json
```

### Screenshots
Tất cả screenshots được lưu trong thư mục `test_screenshots_phase1/`:
- `register_form.png` - Form đăng ký
- `login_form.png` - Form đăng nhập
- `login_error.png` - Thông báo lỗi
- `customers_list.png` - Danh sách khách hàng
- `dashboard.png` - Dashboard
- Và nhiều screenshots khác...

### JSON Report
Kết quả chi tiết được lưu trong `test_results_phase1_browser.json`:
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "total": 8,
  "passed": 8,
  "failed": 0,
  "screenshots_dir": "test_screenshots_phase1",
  "results": [
    {
      "name": "TC 1.1.1: Đăng ký tài khoản",
      "passed": true,
      "error": null,
      "duration": 5.23,
      "screenshot": "test_screenshots_phase1/1234567890_register_form.png"
    },
    ...
  ]
}
```

## 🎥 Video Recording (nếu không headless)

Nếu chạy không headless, video của toàn bộ quá trình test sẽ được lưu trong thư mục `test_videos_phase1/`.

## 🔧 Tùy chỉnh

### Chạy ở chế độ headless (ẩn browser)
```bash
python scripts/browser_test_phase1.py --headless
```

### Chỉ định URL frontend khác
```bash
python scripts/browser_test_phase1.py --url http://your-frontend-url:3000
```

### Chỉ test một số test cases
Sửa file `scripts/browser_test_phase1.py`, comment các test cases không cần:
```python
test_cases = [
    ("TC 1.1.1: Đăng ký tài khoản", self.test_1_1_1_register),
    # ("TC 1.1.2: Đăng nhập", self.test_1_1_2_login),  # Comment này
    ...
]
```

## 🐛 Troubleshooting

### Lỗi: Playwright chưa được cài đặt
```
❌ Playwright chưa được cài đặt!
💡 Chạy lệnh: pip install playwright
💡 Sau đó: playwright install chromium
```
**Giải pháp**: Cài đặt Playwright như hướng dẫn ở trên

### Lỗi: Cannot access frontend
```
❌ Cannot access frontend: Timeout
```
**Giải pháp**: 
- Kiểm tra frontend có đang chạy không: `http://localhost:3000`
- Kiểm tra firewall/antivirus có chặn không

### Lỗi: Element not found
```
❌ FAIL - Cannot find create customer button
```
**Giải pháp**: 
- UI có thể đã thay đổi, cần cập nhật selector trong script
- Xem screenshot để biết element nào không tìm thấy

### Lỗi: Timeout
```
❌ FAIL - Timeout waiting for page load
```
**Giải pháp**: 
- Tăng timeout trong script (mặc định 30s)
- Kiểm tra network có chậm không

## 📝 Lưu ý

1. **Dữ liệu test**: Script sẽ tạo dữ liệu test (users, customers). Có thể xóa sau khi test.

2. **Tốc độ**: Test bằng browser chậm hơn test API (45-60s vs 3-5s), nhưng test được cả UI.

3. **Screenshots**: Tất cả screenshots được lưu tự động, kể cả khi test pass.

4. **Video**: Chỉ có khi chạy không headless.

5. **Browser**: Mặc định dùng Chromium, có thể đổi sang Firefox hoặc WebKit trong code.

## 🎯 So sánh với API Test

| Aspect | Browser Test | API Test |
|---------|--------------|----------|
| **Tốc độ** | 🐌 Chậm (45-60s) | ⚡ Nhanh (3-5s) |
| **Coverage** | ✅ UI + API | ❌ Chỉ API |
| **Screenshots** | ✅ Có | ❌ Không |
| **Video** | ✅ Có (nếu không headless) | ❌ Không |
| **UI Bugs** | ✅ Phát hiện được | ❌ Không |
| **Real User Experience** | ✅ Có | ❌ Không |

**Khuyến nghị**: 
- Dùng **Browser Test** cho UI/UX testing và regression
- Dùng **API Test** cho CI/CD và quick checks

## 🚀 Tích hợp vào CI/CD

Có thể tích hợp vào CI/CD pipeline:

```yaml
# .github/workflows/browser-test.yml
name: Browser Test Phase 1

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
          pip install playwright
          playwright install chromium
      - name: Start backend
        run: |
          npm run dev:backend &
          sleep 10
      - name: Start frontend
        run: |
          npm run dev:frontend &
          sleep 15
      - name: Run browser tests
        run: |
          python scripts/browser_test_phase1.py --headless
      - name: Upload screenshots
        uses: actions/upload-artifact@v2
        with:
          name: test-screenshots
          path: test_screenshots_phase1/
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test_results_phase1_browser.json
```

## 📚 Xem thêm

- **API Test Guide**: `docs/AUTO_TEST_PHASE1_GUIDE.md`
- **Manual Test Guide**: `docs/TEST_PHASE_1_GUIDE.md`
- **Test Checklist**: `docs/TEST_CHECKLIST_3_PHASES.md`

---

**Chúc bạn test thành công! 🎉**








