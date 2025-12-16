# 🤖 TỰ ĐỘNG TEST PHASE 1 - QUICK START

## ⚡ Chạy test tự động trong 2 bước

### Bước 1: Khởi động backend
```bash
# Terminal 1
npm run dev:backend
```

Đợi đến khi thấy:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Bước 2: Chạy script tự động test
```bash
# Terminal 2 (terminal mới)
python scripts/auto_test_phase1.py
```

## 📊 Kết quả mong đợi

Nếu tất cả test pass, bạn sẽ thấy:
```
🎉 Tất cả test cases đều PASS!

📊 TỔNG KẾT TEST PHASE 1
============================================================
Tổng số test cases: 14
✅ Passed: 14
❌ Failed: 0
⏱️  Tổng thời gian: 2.34s
```

## 📁 Files liên quan

- **Script test**: `scripts/auto_test_phase1.py`
- **Hướng dẫn chi tiết**: `docs/AUTO_TEST_PHASE1_GUIDE.md`
- **Kết quả JSON**: `test_results_phase1.json` (tự động tạo sau khi chạy)

## 🎯 Test Cases được tự động test

✅ **14 test cases** bao gồm:
- Authentication (đăng ký, đăng nhập, logout)
- Customer Management (CRUD, search, filter)
- Employee Management (list)
- Dashboard (stats)
- Permissions (RBAC)

## 💡 Tips

1. **Chạy lại test**: Chỉ cần chạy lại script, nó sẽ tự động tạo dữ liệu test mới
2. **Xem kết quả chi tiết**: Mở file `test_results_phase1.json`
3. **Test với URL khác**: `python scripts/auto_test_phase1.py --url http://your-url:8000`

## 🐛 Nếu có lỗi

Xem hướng dẫn troubleshooting trong: `docs/AUTO_TEST_PHASE1_GUIDE.md`

---

**Chúc bạn test thành công! 🚀**






