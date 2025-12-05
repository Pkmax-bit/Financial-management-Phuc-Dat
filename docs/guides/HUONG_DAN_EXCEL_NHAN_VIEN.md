# 📊 Hướng dẫn Import/Export Excel Nhân viên

## ✨ Tính năng mới - Đã sửa lại hoàn toàn!

Chức năng Excel nhân viên đã được viết lại hoàn toàn với:
- ✅ Router riêng (`employee_excel.py`) tách biệt
- ✅ Code đơn giản, dễ hiểu, dễ maintain  
- ✅ Download template KHÔNG CẦN đăng nhập
- ✅ Upload file CẦN đăng nhập (Admin/Manager only)
- ✅ **Audit Trail - Ghi nhận người import** 👤 MỚI!
- ✅ Sheet "Tra cứu nhanh" - Bảng đối chiếu đầy đủ
- ✅ Logging chi tiết để debug
- ✅ Tool test HTML đơn giản (`test_employee_excel.html`)

---

## 🚀 Khởi động nhanh

### Bước 1: Khởi động Backend
```bash
cd backend
python -m uvicorn main:app --reload
```

Backend chạy trên: **http://localhost:8000**

### Bước 2: Test với tool HTML
```bash
# Mở file trong trình duyệt
test_employee_excel.html
```

Tool này sẽ giúp bạn:
- ✅ Test backend có đang chạy không
- ✅ Download file mẫu ngay lập tức
- ✅ Upload file Excel để import

### Bước 3: Hoặc dùng frontend
```bash
cd frontend
npm run dev
```

Truy cập: **http://localhost:3000/employees** → Click **"Upload Excel"**

---

## 📋 API Endpoints

### 1. Download Template (PUBLIC - Không cần đăng nhập)

**Endpoint:**
```
GET /api/employee-excel/download-template
```

**Response:** File Excel với 6 sheets
1. **Mẫu nhân viên** - Template với dropdown lists
2. **Tra cứu nhanh** - Bảng đối chiếu mã và tên (Phòng ban + Chức vụ + Vai trò)
3. **Danh sách vai trò** - 8 vai trò và mô tả chi tiết
4. **Danh sách phòng ban** - Tất cả phòng ban chi tiết
5. **Danh sách chức vụ** - Tất cả chức vụ chi tiết
6. **Hướng dẫn** - Cách điền file

**Test trực tiếp:**
```bash
# Browser
http://localhost:8000/api/employee-excel/download-template

# PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/employee-excel/download-template" -OutFile "template.xlsx"

# Curl
curl -o template.xlsx http://localhost:8000/api/employee-excel/download-template
```

### 2. Upload Excel (PROTECTED - Cần Admin/Manager)

**Endpoint:**
```
POST /api/employee-excel/upload-excel
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:** Form data với file Excel

**Response:**
```json
{
  "message": "Hoàn thành import",
  "success_count": 5,
  "error_count": 2,
  "total_rows": 7,
  "imported_by": "admin@company.com",
  "imported_by_id": "123e4567-e89b-12d3-a456-426614174000",
  "errors": ["Dòng 3: Email đã tồn tại", "Dòng 6: Thiếu thông tin"]
}
```

**Audit Trail:**
- `imported_by`: Email của user đang đăng nhập
- `imported_by_id`: UUID của user (lưu vào `created_by`, `updated_by`)
- Tất cả nhân viên được tạo đều có ghi nhận người tạo

---

## 📝 Cấu trúc File Excel

### Sheet 1: "Mẫu nhân viên"

| Họ * | Tên * | Email * | Số điện thoại | Mã phòng ban | Mã chức vụ | Ngày vào làm * | Lương | Vai trò * | Mật khẩu |
|------|-------|---------|---------------|--------------|------------|----------------|-------|-----------|----------|
| Nguyễn | Văn A | email@company.com | 0901234567 | DEPT001 | POS001 | 2024-01-15 | 15000000 | employee | 123456 |

**Cột bắt buộc (*):**
- Họ, Tên, Email
- Ngày vào làm (định dạng: YYYY-MM-DD)
- Vai trò (chọn từ dropdown)

**Cột tùy chọn:**
- Số điện thoại
- Mã phòng ban (chọn từ dropdown)
- Mã chức vụ (chọn từ dropdown)
- Lương (chỉ nhập số)
- Mật khẩu (mặc định: 123456)

### Sheet 2: "Tra cứu nhanh" ⭐ MỚI!

**Bảng đối chiếu tất cả trong một!**

Tất cả thông tin mapping giữa mã và tên ở một nơi:

#### 🏢 Phòng ban
| Mã phòng ban | Tên phòng ban |
|-------------|---------------|
| DEPT001 | Phòng Kế toán |
| DEPT002 | Phòng Kinh doanh |
| ... | ... |

#### 👔 Chức vụ
| Mã chức vụ | Tên chức vụ | Thuộc phòng ban |
|-----------|------------|----------------|
| POS001 | Trưởng phòng | Phòng Kế toán |
| POS002 | Nhân viên | Phòng Kinh doanh |
| ... | ... | ... |

#### 🎭 Vai trò
| Mã vai trò | Tên vai trò | Mô tả |
|-----------|------------|-------|
| admin | Quản trị viên | Quyền quản trị toàn hệ thống |
| accountant | Kế toán | Quản lý tài chính và báo cáo |
| ... | ... | ... |

**⭐ Ưu điểm:**
- ✅ Xem tất cả trong một sheet
- ✅ Dễ tra cứu tên khi chỉ có mã
- ✅ Copy/paste nhanh khi điền form
- ✅ Không cần chuyển qua lại nhiều sheet

### Dropdown Lists

File mẫu có **dropdown lists** tự động cho:
- ✅ **Mã phòng ban** (cột E)
- ✅ **Mã chức vụ** (cột F)
- ✅ **Vai trò** (cột I)

**Cách sử dụng:** 
- Click vào ô → Chọn từ danh sách xuất hiện
- Hoặc xem sheet "Tra cứu nhanh" để copy/paste

---

## 🧪 Test với Tool HTML

### 1. Mở file test
```bash
# Đúp chuột vào file
test_employee_excel.html
```

### 2. Test theo thứ tự

#### Bước 1: Test Backend
- Click **"Test Backend"**
- Phải thấy: ✅ Backend Online

#### Bước 2: Download Template
- Click **"Download Template"**
- File `mau_nhap_nhan_vien.xlsx` được tải xuống
- Mở file và điền thông tin

#### Bước 3: Upload File
- Chọn file Excel đã điền
- Điền token (hoặc để trống nếu đã đăng nhập)
- Click **"Upload & Import"**
- Xem kết quả

---

## 🔧 Cách lấy Token

### Cách 1: Từ localStorage
```javascript
// Mở Console (F12) và chạy:
localStorage.getItem('token')

// Copy token và dán vào ô "Token" trong tool test
```

### Cách 2: Đăng nhập trước
```
1. Mở http://localhost:3000/login
2. Đăng nhập với tài khoản Admin/Manager
3. Token tự động lưu trong localStorage
4. Upload từ frontend hoặc test tool
```

---

## 📂 Cấu trúc Code Mới

```
backend/
  └── routers/
      └── employee_excel.py        ← Router mới, riêng biệt
          ├── download_template()   ← PUBLIC endpoint
          └── upload_excel()        ← PROTECTED endpoint

frontend/
  └── src/
      └── components/
          └── employees/
              └── UploadEmployeeExcel.tsx  ← Đã cập nhật endpoint

test_employee_excel.html              ← Tool test mới
HUONG_DAN_EXCEL_NHAN_VIEN.md         ← File này
```

---

## 🐛 Troubleshooting

### Lỗi: PGRST204 - "Could not find the 'created_by' column"

**Lỗi đầy đủ:**
```
Dòng 2: {'message': "Could not find the 'created_by' column of 'users' 
in the schema cache", 'code': 'PGRST204'}
```

**Nguyên nhân:** Database chưa có cột audit trail (created_by, updated_by)

**Giải pháp:**
```bash
# Chạy migration database (LẦN ĐẦU)
# Xem file: RUN_MIGRATION_AUDIT_COLUMNS.md

# Quick fix:
1. Mở Supabase SQL Editor
2. Copy SQL từ: database/quick_fix_audit_columns.sql
3. Run migration
4. Upload lại
```

**Chi tiết:** Xem `FIX_PGRST204_ERROR.md`

---

### Lỗi: "Cannot connect to backend"

**Nguyên nhân:** Backend không chạy

**Giải pháp:**
```bash
cd backend
python -m uvicorn main:app --reload
```

Kiểm tra: http://localhost:8000/health

---

### Lỗi: "Not authenticated" khi download

**Nguyên nhân:** Backend chưa restart sau khi sửa code

**Giải pháp:**
```bash
# Dừng backend (Ctrl+C)
# Khởi động lại
cd backend
python -m uvicorn main:app --reload
```

**Verify:** http://localhost:8000/api/employee-excel/download-template phải tải file

---

### Lỗi: "Unauthorized" hoặc "Token invalid" khi upload

**Nguyên nhân:** 
- Token đã hết hạn
- Token không hợp lệ
- Chưa đăng nhập
- Không có quyền

**Giải pháp:**
1. **Đăng xuất và đăng nhập lại** (KHUYẾN NGHỊ)
   - Logout → Login → Thử upload lại
   
2. **Clear localStorage nếu vẫn lỗi:**
   ```javascript
   // F12 > Console
   localStorage.clear()
   location.reload()
   ```

3. **Đảm bảo có quyền:**
   - Role: admin, accountant, hoặc sales
   - KHÔNG phải: employee, worker, customer

4. **Kiểm tra token:**
   ```javascript
   // F12 > Console
   localStorage.getItem('token')
   ```

**Chi tiết:** Xem `FIX_TOKEN_ERROR.md`

---

### Lỗi: "Thiếu cột bắt buộc"

**Nguyên nhân:** File Excel không đúng cấu trúc

**Giải pháp:**
1. Download file mẫu mới
2. Đảm bảo sheet tên "Mẫu nhân viên"
3. Không xóa header row
4. Các cột bắt buộc phải có dữ liệu

---

## ✅ Checklist hoàn chỉnh

### Cho Download Template:
- [ ] Backend đang chạy trên http://localhost:8000
- [ ] Test health: http://localhost:8000/health → 200 OK
- [ ] Test endpoint: http://localhost:8000/api/employee-excel/download-template
- [ ] File Excel được tải xuống thành công
- [ ] File có 6 sheets với dropdown lists
- [ ] Sheet "Tra cứu nhanh" hiển thị bảng đối chiếu đầy đủ

### Cho Upload File:
- [ ] Tất cả checklist download ✓
- [ ] Đã đăng nhập với quyền Admin/Manager
- [ ] Token có trong localStorage
- [ ] File Excel đã điền đúng định dạng
- [ ] Email trong file chưa tồn tại
- [ ] Ngày vào làm đúng format YYYY-MM-DD
- [ ] Vai trò hợp lệ (admin, accountant, sales, etc.)

---

## 🎯 Workflow hoàn chỉnh

```
1. Khởi động backend
   ↓
2. Mở test_employee_excel.html
   ↓
3. Test backend (phải thành công)
   ↓
4. Download template
   ↓
5. Mở file Excel và điền thông tin
   - Sử dụng dropdown lists
   - Xóa dòng ví dụ
   - Đảm bảo email unique
   - Ngày đúng định dạng
   ↓
6. Lưu file
   ↓
7. Đăng nhập vào hệ thống
   ↓
8. Upload file Excel
   ↓
9. Xem kết quả import
   ↓
10. Làm mới trang nhân viên để xem danh sách
```

---

## 🎨 Screenshot

### Tool Test
```
┌─────────────────────────────────────────────────┐
│  🧪 Test Employee Excel                         │
│  Tool test nhanh chức năng Import/Export       │
├─────────────────────────────────────────────────┤
│  ⚙️ Cấu hình                                    │
│  Backend URL: [http://localhost:8000]          │
│  [✅ Backend Online]                            │
├─────────────────────────────────────────────────┤
│  ① Kiểm tra Backend                            │
│  [🔍 Test Backend] → ✅ Success                │
├─────────────────────────────────────────────────┤
│  ② Tải file mẫu                                 │
│  [📥 Download Template] → File downloaded!     │
├─────────────────────────────────────────────────┤
│  ③ Upload file Excel                            │
│  [Choose File] [📤 Upload & Import]           │
│  → ✅ Import: 5 success, 0 errors             │
└─────────────────────────────────────────────────┘
```

---

## 📞 Support

Nếu vẫn gặp vấn đề:

1. **Check backend logs:** Xem terminal đang chạy backend
2. **Check browser console:** F12 → Console tab
3. **Use test tool:** `test_employee_excel.html` để debug
4. **Check documentation:** File này!

---

## 🎉 Kết luận

Chức năng Excel nhân viên đã được **viết lại hoàn toàn** với:
- ✅ Code sạch, đơn giản
- ✅ Không có bug authentication
- ✅ Tool test độc lập
- ✅ Documentation đầy đủ

**Bạn có thể:**
- Download template bất cứ lúc nào (không cần đăng nhập)
- Import hàng loạt nhân viên với dropdown lists
- Test mọi thứ với tool HTML đơn giản

**Happy coding!** 🚀

