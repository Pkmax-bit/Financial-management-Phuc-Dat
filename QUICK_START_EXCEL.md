# ⚡ Quick Start - Excel Nhân viên

## 🎯 3 bước đơn giản

### Bước 0: Chạy Migration Database (LẦN ĐẦU - 30 giây)

⚠️ **QUAN TRỌNG:** Chạy lần đầu để thêm cột audit trail

```bash
# Cách 1: Supabase Dashboard (KHUYẾN NGHỊ)
1. Mở: https://app.supabase.com
2. Chọn project → SQL Editor
3. Copy nội dung file: database/quick_fix_audit_columns.sql
4. Paste và Run
5. Thấy kết quả: 4 rows (✅ Done!)

# Cách 2: Xem hướng dẫn chi tiết
RUN_MIGRATION_AUDIT_COLUMNS.md
```

### Bước 1: Khởi động Backend (30 giây)
```bash
cd backend
python -m uvicorn main:app --reload
```

✅ Thấy: `Uvicorn running on http://0.0.0.0:8000`

### Bước 2: Mở Tool Test (5 giây)
```bash
# Double click file này:
test_employee_excel.html
```

### Bước 3: Test (1 phút)
1. Click **"Test Backend"** → Thấy ✅
2. Click **"Download Template"** → File tải xuống
3. Mở file Excel → Điền thông tin → Lưu
4. Upload file → Xem kết quả

---

## 🔥 Hoặc dùng Frontend

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend  
cd frontend
npm run dev
```

Truy cập: http://localhost:3000/employees → Click **"Upload Excel"**

---

## 📥 Download Template trực tiếp

**Browser:**
```
http://localhost:8000/api/employee-excel/download-template
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/employee-excel/download-template" -OutFile "template.xlsx"
```

---

## ✨ Tính năng chính

- ✅ **Download template**: KHÔNG cần đăng nhập
- ✅ **Dropdown lists**: Chọn phòng ban, chức vụ, vai trò
- ✅ **Upload file**: CẦN đăng nhập Admin/Manager
- ✅ **Tool test**: HTML độc lập, dễ debug
- ✅ **6 sheets**: Template + Tra cứu nhanh + Danh sách + Hướng dẫn

---

## 🐛 Lỗi thường gặp

### "Cannot connect"
→ Backend chưa chạy → Xem bước 1

### "Not authenticated" 
→ Backend chưa restart → Ctrl+C rồi chạy lại

### "Unauthorized" khi upload
→ Chưa đăng nhập → Đăng nhập với Admin/Manager

---

## 📚 Documentation đầy đủ

Xem: **`HUONG_DAN_EXCEL_NHAN_VIEN.md`**

---

## 🎉 Done!

Chỉ 3 bước và bạn đã có thể:
- Download file mẫu Excel
- Import hàng loạt nhân viên
- Test mọi thứ dễ dàng

**Happy coding!** 🚀

