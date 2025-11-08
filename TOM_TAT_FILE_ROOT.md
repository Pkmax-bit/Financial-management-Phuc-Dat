# TÓM TẮT CÁC FILE Ở THƯ MỤC GỐC (ROOT)

## 📋 TỔNG QUAN

Các file ở thư mục gốc của dự án được phân loại như sau:

---

## 1. 📦 FILE CẤU HÌNH DỰ ÁN

### package.json
- **Mô tả**: Cấu hình npm, scripts, dependencies cho toàn bộ dự án
- **Chức năng**: Quản lý dependencies, scripts chạy backend/frontend, setup
- **Cần giữ**: ✅ CÓ

### package-lock.json
- **Mô tả**: Lock file cho npm dependencies
- **Chức năng**: Đảm bảo version dependencies nhất quán
- **Cần giữ**: ✅ CÓ

### openapi.json
- **Mô tả**: OpenAPI specification cho API
- **Chức năng**: Tài liệu API, generate client code
- **Cần giữ**: ✅ CÓ

### README.md
- **Mô tả**: Tài liệu chính của dự án
- **Chức năng**: Hướng dẫn setup, sử dụng dự án
- **Cần giữ**: ✅ CÓ

---

## 2. 🔧 SCRIPT QUẢN LÝ DỰ ÁN

### phan_loai_file.py / phan_loai_file.bat
- **Mô tả**: Script phân loại và di chuyển file vào thư mục tương ứng
- **Chức năng**: Tổ chức lại cấu trúc file (docs, scripts, SQL)
- **Cần giữ**: ✅ CÓ (tiện ích quản lý)

### xoa_file_test.py / xoa_file_test.bat
- **Mô tả**: Script xóa các file test, check, debug
- **Chức năng**: Dọn dẹp các file test không cần thiết
- **Cần giữ**: ✅ CÓ (tiện ích quản lý)

---

## 3. 🚀 SCRIPT KHỞI ĐỘNG HỆ THỐNG

### start_network.bat / start_network.sh
- **Mô tả**: Script khởi động hệ thống network (Windows/Linux)
- **Chức năng**: Chạy backend và frontend cùng lúc
- **Cần giữ**: ✅ CÓ (script chính)

### setup_linux.sh
- **Mô tả**: Script setup môi trường Linux
- **Chức năng**: Cài đặt dependencies, cấu hình môi trường
- **Cần giữ**: ✅ CÓ (nếu dùng Linux)

---

## 4. 🧪 FILE TEST CÒN SÓT LẠI

### test_login.js
- **Mô tả**: File test đăng nhập (JavaScript)
- **Chức năng**: Test chức năng login
- **Cần giữ**: ❌ KHÔNG (nên xóa hoặc di chuyển vào thư mục test)

### test_support_center_position.py
- **Mô tả**: File test vị trí support center
- **Chức năng**: Test UI component
- **Cần giữ**: ❌ KHÔNG (nên xóa hoặc di chuyển vào thư mục test)

### test_update_create_buttons.py
- **Mô tả**: File test nút update/create
- **Chức năng**: Test chức năng button
- **Cần giữ**: ❌ KHÔNG (nên xóa hoặc di chuyển vào thư mục test)

---

## 5. 📁 THƯ MỤC/FILE KHÁC

### Test máy
- **Mô tả**: Thư mục hoặc file test (tên tiếng Việt)
- **Chức năng**: Không rõ
- **Cần giữ**: ❌ KHÔNG (nên xóa hoặc đổi tên)

---

## 📊 TỔNG KẾT

### File cần giữ lại (quan trọng):
- ✅ package.json, package-lock.json
- ✅ openapi.json
- ✅ README.md
- ✅ start_network.bat, start_network.sh
- ✅ setup_linux.sh
- ✅ phan_loai_file.py, phan_loai_file.bat
- ✅ xoa_file_test.py, xoa_file_test.bat

**Tổng: ~10-12 files**

### File nên xóa/di chuyển:
- ❌ test_login.js
- ❌ test_support_center_position.py
- ❌ test_update_create_buttons.py
- ❌ Test máy (nếu không cần)

**Tổng: ~3-4 files**

---

## 💡 KHUYẾN NGHỊ

1. **Giữ nguyên**: Các file cấu hình và script chính
2. **Xóa/di chuyển**: Các file test còn sót lại
3. **Tổ chức**: Các file script có thể di chuyển vào `scripts/` nếu muốn gọn hơn

---

## 📁 CẤU TRÚC THƯ MỤC GỐC LÝ TƯỞNG

```
📁 Financial-management-Phuc-Dat/
├── 📄 README.md                    # Tài liệu chính
├── 📄 package.json                 # Cấu hình npm
├── 📄 package-lock.json            # Lock file
├── 📄 openapi.json                 # API spec
├── 🚀 start_network.bat            # Script khởi động (Windows)
├── 🚀 start_network.sh             # Script khởi động (Linux)
├── 🚀 setup_linux.sh               # Script setup (Linux)
├── 📁 frontend/                    # Frontend code
├── 📁 backend/                     # Backend code
├── 📁 docs/                        # Tài liệu
├── 📁 scripts/                    # Scripts tiện ích
└── 📁 database/                    # Database files
```

