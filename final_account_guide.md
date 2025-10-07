# 🎯 Hướng Dẫn Tạo Tài Khoản Đăng Nhập

## 📋 Trạng Thái Hiện Tại

### ✅ Đã Hoàn Thành:
- **Admin User** (`admin@example.com` / `admin123`) - ✅ **HOẠT ĐỘNG**
- Trang login với tài khoản test có sẵn
- Hệ thống phân quyền hoàn chỉnh
- Fallback authentication (Supabase → Backend API)

### ❌ Cần Làm Thêm:
- Tạo các tài khoản khác qua Supabase Dashboard
- Test phân quyền với từng role

---

## 🚀 Hướng Dẫn Tạo Tài Khoản

### **Bước 1: Truy Cập Supabase Dashboard**
```
https://supabase.com/dashboard
Project: mfmijckzlhevduwfigkl
Authentication > Users
```

### **Bước 2: Tạo Các Tài Khoản**

Bấm "Add user" và tạo từng tài khoản:

| **Tên** | **Email** | **Password** | **User Metadata** |
|---------|-----------|---------------|-------------------|
| Sales Manager | `sales@example.com` | `sales123` | `{"role": "sales", "full_name": "Sales Manager"}` |
| Accountant | `accountant@example.com` | `accountant123` | `{"role": "accountant", "full_name": "Accountant"}` |
| Workshop Employee | `workshop@example.com` | `workshop123` | `{"role": "workshop_employee", "full_name": "Workshop Employee"}` |
| Worker | `worker@example.com` | `worker123` | `{"role": "worker", "full_name": "Worker"}` |
| Transport | `transport@example.com` | `transport123` | `{"role": "transport", "full_name": "Transport"}` |
| Customer | `customer@example.com` | `customer123` | `{"role": "customer", "full_name": "Customer"}` |

### **Bước 3: Test Đăng Nhập**

#### **📱 Truy Cập Trang Login:**
```
http://localhost:3000/login
```

#### **⚡ Cách Test:**
1. **Bấm vào tài khoản test** → Tự động điền thông tin
2. **Bấm "Đăng nhập"** → Hệ thống sẽ thử Supabase trước, fallback sang Backend API
3. **Kiểm tra phân quyền** → Mỗi role có quyền truy cập khác nhau

---

## 🎯 Chức Năng Phân Quyền

### **👑 Admin (admin@example.com):**
- ✅ Toàn quyền truy cập
- ✅ Quản lý hệ thống
- ✅ Tất cả chức năng

### **💰 Sales (sales@example.com):**
- ✅ Quản lý báo giá và chi phí
- ✅ Tạo, chỉnh sửa, duyệt quotes
- ✅ Tạo, chỉnh sửa, duyệt costs

### **📊 Accountant (accountant@example.com):**
- ✅ Quản lý tài chính và hóa đơn
- ✅ Tạo và quản lý invoices
- ✅ Xem báo cáo tài chính

### **🔧 Workshop (workshop@example.com):**
- ✅ Tạo chi phí sản xuất
- ✅ Quản lý chi phí workshop

### **👷 Worker (worker@example.com):**
- ✅ Tạo chi phí cơ bản
- ✅ Quản lý chi phí công việc

### **🚚 Transport (transport@example.com):**
- ✅ Tạo chi phí vận chuyển
- ✅ Quản lý chi phí logistics

### **👥 Customer (customer@example.com):**
- ✅ Portal khách hàng
- ✅ Xem tiến độ dự án
- ✅ Duyệt quotes

---

## 📁 Files Đã Tạo

### **SQL Files:**
- `create_accounts.sql` - SQL script để tạo tài khoản
- `create_accounts_sql.py` - Python script tạo SQL

### **Python Scripts:**
- `create_accounts_direct.py` - Tạo tài khoản trực tiếp
- `create_accounts_final.py` - Script cuối cùng
- `check_database_schema.py` - Kiểm tra database schema

---

## 🔧 Troubleshooting

### **Lỗi Thường Gặp:**

1. **Foreign Key Constraint Error:**
   - Tạo tài khoản qua Supabase Dashboard thay vì script
   - Sử dụng SQL Editor trong Supabase

2. **Invalid Enum Values:**
   - Kiểm tra enum values trong database
   - Sử dụng giá trị enum hợp lệ

3. **Login 422 Error:**
   - Đã được sửa trong frontend
   - Validation và error handling đã cải thiện

---

## 📋 Tóm Tắt

**✅ Đã Hoàn Thành:**
- Trang login với tài khoản test có sẵn
- Admin User hoạt động ngay
- Hệ thống phân quyền hoàn chỉnh
- Fallback authentication (Supabase → Backend API)

**⚠️ Cần Làm Thêm:**
- Tạo các tài khoản khác qua Supabase Dashboard
- Test phân quyền với từng role

**Trang login đã sẵn sàng để test với Admin User ngay bây giờ!** 🚀
