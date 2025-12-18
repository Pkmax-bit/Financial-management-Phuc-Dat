# 🚀 TỰ ĐỘNG CHẠY TEST - QUICK START

## ⚡ Chạy test tự động trong 1 lệnh

```bash
python scripts/auto_run_tests.py
```

Script sẽ tự động:
1. ✅ Kiểm tra và khởi động backend
2. ✅ Kiểm tra và khởi động frontend  
3. ✅ Đợi services sẵn sàng
4. ✅ Chạy test Phase 1
5. ✅ Hiển thị kết quả

## 🎯 Các tùy chọn

### Chạy API Test (Mặc định - Nhanh)
```bash
python scripts/auto_run_tests.py --type api
```

### Chạy Browser Test (Test UI)
```bash
python scripts/auto_run_tests.py --type browser
```

### Chạy cả hai (Đầy đủ)
```bash
python scripts/auto_run_tests.py --type both
```

### Giữ services chạy sau test
```bash
python scripts/auto_run_tests.py --type api --keep-running
```

## 📋 Yêu cầu

### Dependencies
```bash
# Python packages
pip install requests

# Nếu dùng browser test
pip install playwright
playwright install chromium
```

### Environment
- ✅ Backend `.env` đã cấu hình
- ✅ Frontend `.env.local` đã cấu hình
- ✅ Database đã setup

## 🎬 Kết quả

Sau khi chạy, bạn sẽ thấy:
- ✅ Console output với kết quả real-time
- 📊 JSON reports: `test_results_phase1.json`
- 📸 Screenshots (nếu browser test): `test_screenshots_phase1/`

## 💡 Tips

1. **Lần đầu chạy**: Có thể mất 1-2 phút để khởi động services
2. **Lần sau**: Nếu services đã chạy, sẽ nhanh hơn
3. **Development**: Dùng `--keep-running` để giữ services chạy

## 🐛 Nếu có lỗi

### Frontend không khởi động
```bash
# Thử chạy thủ công để xem lỗi
cd frontend
npm run dev
```

### Backend không khởi động
```bash
# Thử chạy thủ công
cd backend
python -m uvicorn main:app --reload
```

## 📚 Xem thêm

- **Hướng dẫn chi tiết**: `docs/AUTO_RUN_TESTS_GUIDE.md`
- **API Test**: `docs/AUTO_TEST_PHASE1_GUIDE.md`
- **Browser Test**: `docs/BROWSER_TEST_PHASE1_GUIDE.md`

---

**Chúc bạn test thành công! 🎉**








