# 🔧 HƯỚNG DẪN SỬA LỖI "externally-managed-environment" KHI CHẠY npm run install:all

## ❌ LỖI

Khi chạy `npm run install:all` trên Ubuntu Linux, bạn gặp lỗi:
```
error: externally-managed-environment
```

**Nguyên nhân:** Ubuntu mới (23.04+) không cho phép cài đặt Python packages trực tiếp vào system Python để tránh xung đột với package manager.

---

## ✅ GIẢI PHÁP

Đã sửa script `install:backend` để tự động tạo và sử dụng **virtual environment**.

### Cách 1: Chạy lại lệnh (Đã được sửa tự động)

```bash
npm run install:all
```

Script sẽ tự động:
1. Tạo virtual environment trong `backend/venv/`
2. Kích hoạt virtual environment
3. Cài đặt dependencies vào virtual environment

---

### Cách 2: Cài đặt thủ công (Nếu script không hoạt động)

#### Bước 1: Tạo virtual environment
```bash
cd backend
python3 -m venv venv
# hoặc
python3.11 -m venv venv
```

#### Bước 2: Kích hoạt virtual environment
```bash
source venv/bin/activate
```

#### Bước 3: Cài đặt dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Bước 4: Kiểm tra
```bash
pip list
```

---

## 🚀 SAU KHI CÀI ĐẶT

### Chạy Backend

Script `dev:backend` và `start:backend` đã được cập nhật để tự động sử dụng virtual environment:

```bash
# Development mode
npm run dev:backend

# Production mode
npm run start:backend

# Hoặc chạy cả backend và frontend
npm run dev
```

### Chạy thủ công (nếu cần)

```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📝 LƯU Ý

1. **Virtual environment** được tạo trong `backend/venv/`
2. **Không commit** thư mục `venv/` vào Git (đã có trong `.gitignore`)
3. **Mỗi developer** cần tạo virtual environment riêng trên máy của mình
4. **Trên Windows**, virtual environment sẽ ở `backend\venv\` và kích hoạt bằng `venv\Scripts\activate`

---

## 🐛 XỬ LÝ LỖI

### Lỗi: python3-venv not found
```bash
sudo apt install python3.11-venv
# hoặc
sudo apt install python3-venv
```

### Lỗi: Permission denied
```bash
chmod +x scripts/install_backend.sh
```

### Lỗi: Script không tìm thấy
```bash
# Đảm bảo bạn đang ở thư mục gốc của dự án
pwd
# Phải hiển thị: .../Financial-management-Phuc-Dat
```

### Lỗi: Virtual environment không hoạt động
```bash
# Xóa và tạo lại
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## ✅ KIỂM TRA

Sau khi cài đặt thành công:

```bash
# Kiểm tra virtual environment
cd backend
source venv/bin/activate
which python  # Phải hiển thị: .../backend/venv/bin/python
pip list      # Hiển thị danh sách packages đã cài

# Chạy backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

**Chúc bạn cài đặt thành công! 🎉**

