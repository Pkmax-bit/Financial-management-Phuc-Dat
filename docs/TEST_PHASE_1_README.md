# 🚀 BẮT ĐẦU TEST PHASE 1

## ⚡ Quick Start (3 bước)

### Bước 1: Kiểm tra môi trường
```bash
python scripts/check_test_environment.py
```

Script này sẽ kiểm tra:
- ✅ Backend có đang chạy không
- ✅ Frontend có đang chạy không
- ✅ API Documentation có sẵn không
- ✅ Environment files có tồn tại không
- ✅ Database connection

### Bước 2: Khởi động ứng dụng (nếu chưa chạy)
```bash
# Chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng:
npm run dev:backend   # Terminal 1 - Backend tại http://localhost:8000
npm run dev:frontend  # Terminal 2 - Frontend tại http://localhost:3000
```

### Bước 3: Bắt đầu test
1. **Mở hướng dẫn chi tiết**: `docs/TEST_PHASE_1_GUIDE.md`
2. **Mở checklist**: `docs/TEST_CHECKLIST_3_PHASES.md`
3. **Bắt đầu từ Test Case 1.1.1**: Đăng ký tài khoản mới

---

## 📋 Tài liệu test

| File | Mục đích |
|------|----------|
| `TEST_PHASE_1_GUIDE.md` | Hướng dẫn chi tiết từng test case với các bước cụ thể |
| `TEST_CHECKLIST_3_PHASES.md` | Checklist để đánh dấu kết quả test |
| `TEST_SCENARIOS_3_PHASES.md` | Kịch bản test đầy đủ cho cả 3 đợt |

---

## 🎯 Phase 1 Test Cases (25 test cases)

### 1. Authentication & User Management (8)
- [ ] TC 1.1.1: Đăng ký tài khoản mới
- [ ] TC 1.1.2: Đăng nhập
- [ ] TC 1.1.3: Đăng nhập với thông tin sai
- [ ] TC 1.1.4: Đăng xuất
- [ ] TC 1.1.5: Lấy thông tin người dùng hiện tại
- [ ] TC 1.1.6: Cập nhật thông tin người dùng
- [ ] TC 1.1.7: Đổi mật khẩu
- [ ] TC 1.1.8: Quên mật khẩu

### 2. Customer Management (7)
- [ ] TC 1.2.1: Tạo khách hàng mới
- [ ] TC 1.2.2: Xem danh sách khách hàng
- [ ] TC 1.2.3: Xem chi tiết khách hàng
- [ ] TC 1.2.4: Cập nhật thông tin khách hàng
- [ ] TC 1.2.5: Xóa khách hàng
- [ ] TC 1.2.6: Tìm kiếm khách hàng
- [ ] TC 1.2.7: Lọc khách hàng theo loại

### 3. Employee Management (5)
- [ ] TC 1.3.1: Tạo nhân viên mới
- [ ] TC 1.3.2: Xem danh sách nhân viên
- [ ] TC 1.3.3: Xem chi tiết nhân viên
- [ ] TC 1.3.4: Cập nhật thông tin nhân viên
- [ ] TC 1.3.5: Import nhân viên từ Excel

### 4. Dashboard (3)
- [ ] TC 1.4.1: Xem Dashboard tổng quan
- [ ] TC 1.4.2: Lọc Dashboard theo thời gian
- [ ] TC 1.4.3: Xem chi tiết từ widget

### 5. Phân quyền và Bảo mật (2)
- [ ] TC 1.5.1: Kiểm tra phân quyền theo role
- [ ] TC 1.5.2: Kiểm tra JWT token expiration

---

## 🛠️ Công cụ hỗ trợ

### 1. Browser DevTools
- **F12** để mở DevTools
- **Network tab**: Xem API calls
- **Console tab**: Xem lỗi JavaScript
- **Application tab**: Xem Local Storage, Session Storage

### 2. API Testing
- **Swagger UI**: http://localhost:8000/docs
- **Postman**: Import OpenAPI spec từ http://localhost:8000/openapi.json
- **curl**: Dùng command line (xem ví dụ trong TEST_PHASE_1_GUIDE.md)

### 3. Database
- **Supabase Dashboard**: Xem và kiểm tra dữ liệu
- **SQL Editor**: Chạy queries để verify

---

## 📝 Ghi chú khi test

1. **Ghi lại tất cả kết quả** trong checklist
2. **Chụp screenshot** nếu có bug
3. **Ghi lại API response** nếu có lỗi
4. **Note lại các edge cases** phát hiện được
5. **Đánh giá mức độ nghiêm trọng** của bug (Critical/High/Medium/Low)

---

## 🐛 Báo cáo bug

Khi phát hiện bug, ghi lại:
- **Test Case**: TC 1.x.x
- **Mô tả**: Chi tiết bug
- **Các bước reproduce**: Làm thế nào để tái hiện
- **Expected**: Kết quả mong đợi
- **Actual**: Kết quả thực tế
- **Screenshot**: Hình ảnh minh họa
- **Mức độ**: Critical/High/Medium/Low

---

## ✅ Checklist trước khi bắt đầu

- [ ] Backend đang chạy tại http://localhost:8000
- [ ] Frontend đang chạy tại http://localhost:3000
- [ ] Database đã được setup
- [ ] Có tài khoản test (admin, sales, customer)
- [ ] Đã mở Browser DevTools
- [ ] Đã mở checklist file
- [ ] Đã mở hướng dẫn test

---

## 🎯 Mục tiêu Phase 1

- ✅ Kiểm tra tất cả chức năng cơ bản hoạt động đúng
- ✅ Đảm bảo authentication và authorization hoạt động
- ✅ Verify CRUD operations cho Customer và Employee
- ✅ Kiểm tra Dashboard hiển thị đúng dữ liệu
- ✅ Phát hiện và báo cáo tất cả bugs

---

**Chúc bạn test thành công! 🎉**

Nếu có câu hỏi, xem file `TEST_PHASE_1_GUIDE.md` để biết chi tiết từng test case.








