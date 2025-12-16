# 🚀 HƯỚNG DẪN TỰ ĐỘNG CHẠY TEST

## 📋 Tổng quan

Script `auto_run_tests.py` tự động:
1. ✅ Kiểm tra backend/frontend có đang chạy không
2. ✅ Khởi động backend nếu chưa chạy
3. ✅ Khởi động frontend nếu chưa chạy
4. ✅ Đợi cả hai sẵn sàng
5. ✅ Chạy test (API hoặc Browser)
6. ✅ Hiển thị kết quả
7. ✅ Tự động dọn dẹp (tùy chọn)

## ⚡ Quick Start

### Chạy API Test (Mặc định)
```bash
python scripts/auto_run_tests.py
```

### Chạy Browser Test
```bash
python scripts/auto_run_tests.py --type browser
```

### Chạy Browser Test (Ẩn browser)
```bash
python scripts/auto_run_tests.py --type browser --headless
```

### Chạy cả API và Browser Test
```bash
python scripts/auto_run_tests.py --type both
```

### Giữ services chạy sau khi test
```bash
python scripts/auto_run_tests.py --type api --keep-running
```

## 🎯 Các tùy chọn

### `--type` (Loại test)
- `api`: Chỉ chạy API test (nhanh, 3-5s)
- `browser`: Chỉ chạy browser test (chậm hơn, 45-60s)
- `both`: Chạy cả hai (khuyến nghị cho test đầy đủ)

### `--headless` (Chỉ cho browser test)
- Bỏ qua để xem browser trong quá trình test
- Thêm `--headless` để chạy ẩn (nhanh hơn)

### `--keep-running` (Giữ services chạy)
- Mặc định: Tự động dừng services sau khi test
- Thêm `--keep-running` để giữ services chạy (tiện cho development)

## 📊 Quy trình tự động

```
1. Kiểm tra Backend
   ├─ Đang chạy? → Bỏ qua
   └─ Chưa chạy? → Khởi động

2. Kiểm tra Frontend
   ├─ Đang chạy? → Bỏ qua
   └─ Chưa chạy? → Khởi động

3. Đợi Services sẵn sàng
   ├─ Backend: http://localhost:8000/health
   └─ Frontend: http://localhost:3000

4. Chạy Test
   ├─ API Test → scripts/auto_test_phase1.py
   └─ Browser Test → scripts/browser_test_phase1.py

5. Hiển thị kết quả

6. Dọn dẹp (nếu không --keep-running)
   ├─ Dừng Backend
   └─ Dừng Frontend
```

## 💡 Ví dụ sử dụng

### Test nhanh (API only)
```bash
python scripts/auto_run_tests.py --type api
```
**Thời gian**: ~10-15 giây (bao gồm khởi động)

### Test đầy đủ (API + Browser)
```bash
python scripts/auto_run_tests.py --type both --headless
```
**Thời gian**: ~60-90 giây

### Development mode (giữ services chạy)
```bash
python scripts/auto_run_tests.py --type api --keep-running
```
Sau khi test xong, services vẫn chạy để bạn tiếp tục development.

## 🎬 Output mẫu

```
============================================================
🚀 TỰ ĐỘNG CHẠY TEST PHASE 1
============================================================

============================================================
📦 KIỂM TRA VÀ KHỞI ĐỘNG SERVICES
============================================================

ℹ️  Đang khởi động backend...
ℹ️  Đang đợi backend khởi động...
✅ Backend đã khởi động tại http://localhost:8000

ℹ️  Đang khởi động frontend...
ℹ️  Đang đợi frontend khởi động...
✅ Frontend đã khởi động tại http://localhost:3000

ℹ️  Đang đợi services sẵn sàng...
✅ Tất cả services đã sẵn sàng!

============================================================
🧪 BẮT ĐẦU TEST
============================================================

============================================================
🧪 CHẠY API TEST
============================================================

🧪 TỰ ĐỘNG TEST PHASE 1
============================================================

🔍 Kiểm tra backend...
✅ PASS - Backend is running

Bắt đầu test Phase 1...

🧪 Health Check... ✅ PASS
🧪 TC 1.1.1: Đăng ký tài khoản... ✅ PASS
...

============================================================
📊 TỔNG KẾT
============================================================

✅ 🎉 Tất cả test đã hoàn thành!
```

## 🐛 Troubleshooting

### Lỗi: Backend không khởi động
```
❌ Backend không khởi động sau 30 giây
```
**Giải pháp**:
- Kiểm tra port 8000 có bị chiếm không
- Kiểm tra backend/.env có đúng không
- Xem logs trong terminal

### Lỗi: Frontend không khởi động
```
❌ Frontend không khởi động sau 45 giây
```
**Giải pháp**:
- Kiểm tra port 3000 có bị chiếm không
- Kiểm tra frontend/.env.local có đúng không
- Xem logs trong terminal

### Lỗi: Services đã chạy nhưng test fail
```
✅ Backend đã đang chạy
✅ Frontend đã đang chạy
❌ Test failed
```
**Giải pháp**:
- Kiểm tra services có hoạt động đúng không
- Thử truy cập http://localhost:8000/health và http://localhost:3000
- Xem chi tiết lỗi trong test output

## 📝 Lưu ý

1. **Port conflicts**: Nếu port 8000 hoặc 3000 đã bị chiếm, script sẽ báo lỗi
2. **Dependencies**: Đảm bảo đã cài đặt:
   - Python packages: `requests`
   - Playwright (nếu dùng browser test): `playwright` và `playwright install chromium`
3. **Environment**: Đảm bảo `.env` files đã được cấu hình đúng
4. **Cleanup**: Mặc định script sẽ tự động dừng services sau khi test. Dùng `--keep-running` để giữ chạy.

## 🎯 So sánh các cách test

| Cách | Command | Thời gian | Coverage |
|------|---------|-----------|----------|
| **API Test** | `--type api` | ~10-15s | API only |
| **Browser Test** | `--type browser` | ~60-90s | UI + API |
| **Both** | `--type both` | ~70-105s | Full coverage |

## 🚀 Tích hợp vào CI/CD

Có thể dùng trong CI/CD pipeline:

```yaml
# .github/workflows/auto-test.yml
name: Auto Test Phase 1

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
          pip install requests playwright
          playwright install chromium
      - name: Run auto tests
        run: |
          python scripts/auto_run_tests.py --type both --headless
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: |
            test_results_phase1.json
            test_results_phase1_browser.json
            test_screenshots_phase1/
```

## 📚 Xem thêm

- **API Test Guide**: `docs/AUTO_TEST_PHASE1_GUIDE.md`
- **Browser Test Guide**: `docs/BROWSER_TEST_PHASE1_GUIDE.md`
- **Manual Test Guide**: `docs/TEST_PHASE_1_GUIDE.md`

---

**Chúc bạn test thành công! 🎉**





