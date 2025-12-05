# 📊 Excel Nhân viên V2.0

## 🚀 Start ngay trong 30 giây!

### Windows:
```bash
# Double click file này:
restart_backend.bat

# Sau đó double click:
test_employee_excel.html
```

### Mac/Linux:
```bash
cd backend
python -m uvicorn main:app --reload
```

---

## 📚 Documentation

| File | Mục đích |
|------|----------|
| **QUICK_START_EXCEL.md** | ⚡ Bắt đầu nhanh - 3 bước đơn giản |
| **HUONG_DAN_EXCEL_NHAN_VIEN.md** | 📖 Hướng dẫn đầy đủ và chi tiết |
| **EXCEL_NHAN_VIEN_V2_CHANGELOG.md** | 📋 Changelog và technical details |

---

## 🧪 Test Tool

**File:** `test_employee_excel.html`

Công cụ test độc lập, không cần frontend:
- ✅ Test backend có chạy không
- ✅ Download file mẫu Excel
- ✅ Upload và import nhân viên

**Cách dùng:** Double click file → Test theo thứ tự 1, 2, 3

---

## ⚡ Quick Commands

### Download template (không cần đăng nhập):
```
http://localhost:8000/api/employee-excel/download-template
```

### PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/employee-excel/download-template" -OutFile "template.xlsx"
```

---

## 🎯 Tính năng

✅ **Download template Excel** - PUBLIC, không cần đăng nhập  
✅ **6 sheets:** Mẫu + Tra cứu nhanh + Roles + Departments + Positions + Instructions  
✅ **Sheet "Tra cứu nhanh"** - Bảng đối chiếu mã ↔ tên tất cả trong một!  
✅ **Dropdown lists** tự động cho phòng ban, chức vụ, vai trò  
✅ **Upload & Import** - Cần Admin/Manager login  
✅ **Audit Trail** - Ghi nhận người import 👤  
✅ **Validation** đầy đủ với lỗi chi tiết từng dòng  
✅ **Tool test HTML** độc lập  

---

## 🐛 Lỗi thường gặp

| Lỗi | Giải pháp |
|-----|-----------|
| Cannot connect | Chạy `restart_backend.bat` |
| Not authenticated (403) | Restart backend |
| Unauthorized (upload) | Đăng nhập Admin/Manager |

---

## 📞 Cần trợ giúp?

1. **Quick start:** Đọc `QUICK_START_EXCEL.md`
2. **Chi tiết:** Đọc `HUONG_DAN_EXCEL_NHAN_VIEN.md`
3. **Test ngay:** Mở `test_employee_excel.html`

---

## 🎉 Ready!

Version 2.0 hoạt động ổn định. Hãy thử ngay! 🚀

```
restart_backend.bat  →  test_employee_excel.html  →  Done!
```

