# 🌐 TEST PHASE 1 BẰNG BROWSER - QUICK START

## ⚡ Chạy test trong 3 bước

### Bước 1: Cài đặt Playwright
```bash
pip install playwright
playwright install chromium
```

### Bước 2: Khởi động ứng dụng
```bash
# Terminal 1
npm run dev:backend

# Terminal 2  
npm run dev:frontend
```

### Bước 3: Chạy test
```bash
# Terminal 3
python scripts/browser_test_phase1.py
```

## 🎯 Kết quả

- ✅ **Console**: Kết quả real-time với màu sắc
- 📸 **Screenshots**: Tự động lưu trong `test_screenshots_phase1/`
- 📊 **JSON Report**: `test_results_phase1_browser.json`
- 🎥 **Video**: `test_videos_phase1/` (nếu không headless)

## 📋 Test Cases (8)

✅ Authentication (4): Đăng ký, đăng nhập, logout, login sai  
✅ Customer Management (2): List, Create  
✅ Dashboard (1): Xem dashboard  
✅ Employee Management (1): List employees  

## 💡 Tips

- **Xem browser**: Bỏ `--headless` để xem quá trình test
- **Nhanh hơn**: Dùng `--headless` để chạy ẩn
- **Screenshots**: Tự động lưu khi có lỗi hoặc các bước quan trọng

## 📚 Xem thêm

- **Hướng dẫn chi tiết**: `docs/BROWSER_TEST_PHASE1_GUIDE.md`
- **API Test**: `docs/AUTO_TEST_PHASE1_GUIDE.md`

---

**Chúc bạn test thành công! 🚀**








