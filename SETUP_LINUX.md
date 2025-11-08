# 🐧 HƯỚNG DẪN CÀI ĐẶT MÔI TRƯỜNG TRÊN LINUX

Hướng dẫn chi tiết để cài đặt môi trường phát triển cho Financial Management System trên Linux.

## 📋 YÊU CẦU HỆ THỐNG

### Backend (Python)
- **Python:** 3.8 trở lên
- **pip:** Đi kèm với Python
- **PostgreSQL client libraries:** (cho psycopg2)

### Frontend (Node.js)
- **Node.js:** 16 trở lên (khuyến nghị 18+)
- **npm:** Đi kèm với Node.js

### System Dependencies
- **build-essential:** (Ubuntu/Debian) - Cần cho compile Python packages
- **python3-dev:** (Ubuntu/Debian) - Cần cho compile Python packages
- **libpq-dev:** (Ubuntu/Debian) - PostgreSQL client libraries

---

## 🚀 CÁCH CÀI ĐẶT TỰ ĐỘNG (KHUYẾN NGHỊ)

### Bước 1: Cài đặt Python và Node.js (nếu chưa có)

#### Ubuntu/Debian:
```bash
# Cập nhật package list
sudo apt-get update

# Cài đặt Python và pip
sudo apt-get install -y python3 python3-pip python3-venv

# Cài đặt system dependencies
sudo apt-get install -y build-essential python3-dev libpq-dev

# Cài đặt Node.js 18 (sử dụng NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### CentOS/RHEL:
```bash
# Cài đặt Python và pip
sudo yum install -y python3 python3-pip

# Cài đặt system dependencies
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel postgresql-devel

# Cài đặt Node.js 18 (sử dụng NodeSource)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### Fedora:
```bash
# Cài đặt Python và pip
sudo dnf install -y python3 python3-pip

# Cài đặt system dependencies
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3-devel postgresql-devel

# Cài đặt Node.js 18
sudo dnf install -y nodejs npm
```

#### Sử dụng NVM (Khuyến nghị cho Node.js):
```bash
# Cài đặt NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # hoặc source ~/.zshrc

# Cài đặt Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### Bước 2: Chạy script cài đặt tự động

```bash
# Cấp quyền thực thi
chmod +x setup_linux.sh

# Chạy script
./setup_linux.sh
```

Script sẽ tự động:
- ✅ Kiểm tra Python và Node.js
- ✅ Cài đặt system dependencies (nếu cần)
- ✅ Tạo Python virtual environment
- ✅ Cài đặt tất cả Python packages từ `requirements.txt`
- ✅ Cài đặt tất cả npm packages
- ✅ Tạo file `.env` và `.env.local` từ examples

---

## 🔧 CÁCH CÀI ĐẶT THỦ CÔNG

Nếu script tự động không hoạt động, bạn có thể cài đặt thủ công:

### 1. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo virtual environment
python3 -m venv venv

# Kích hoạt virtual environment
source venv/bin/activate

# Nâng cấp pip
pip install --upgrade pip setuptools wheel

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ env.example
cp env.example .env

# Chỉnh sửa .env với thông tin của bạn
nano .env  # hoặc vim .env

# Thoát virtual environment
deactivate
```

### 2. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt npm packages
npm install

# Tạo file .env.local từ env.local.example
cp env.local.example .env.local

# Chỉnh sửa .env.local với thông tin của bạn
nano .env.local  # hoặc vim .env.local
```

---

## ⚙️ CẤU HÌNH MÔI TRƯỜNG

### Backend (.env)

Chỉnh sửa file `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Database
DATABASE_URL=your_database_url

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (nếu cần)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env.local)

Chỉnh sửa file `frontend/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
# Để trống để auto-detect, hoặc set IP cụ thể cho network access
NEXT_PUBLIC_API_URL=http://localhost:8000

# Dify API (nếu cần)
NEXT_PUBLIC_DIFY_API_BASE_URL=https://api.dify.ai/v1
NEXT_PUBLIC_DIFY_API_KEY=your_dify_api_key
```

---

## 🚀 KHỞI ĐỘNG HỆ THỐNG

### Cách 1: Chạy riêng biệt

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Cách 2: Chạy với network access (cho thiết bị khác)

```bash
# Sử dụng script tự động
./start_network.sh

# Hoặc
python3 start_network.py
```

### Cách 3: Sử dụng npm (nếu đã cài đặt concurrently)

```bash
# Từ thư mục root
npm run dev
```

---

## 🐛 XỬ LÝ SỰ CỐ

### Lỗi: "python3: command not found"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt-get install python3

# CentOS/RHEL
sudo yum install python3

# Fedora
sudo dnf install python3
```

### Lỗi: "node: command not found"

**Giải pháp:**
```bash
# Cài đặt Node.js (xem phần Yêu cầu hệ thống)
# Hoặc sử dụng NVM (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

### Lỗi: "pip: command not found"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt-get install python3-pip

# CentOS/RHEL
sudo yum install python3-pip

# Fedora
sudo dnf install python3-pip
```

### Lỗi khi cài đặt psycopg2: "pg_config: command not found"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt-get install libpq-dev postgresql-client

# CentOS/RHEL
sudo yum install postgresql-devel

# Fedora
sudo dnf install postgresql-devel
```

### Lỗi khi cài đặt Python packages: "error: Microsoft Visual C++ 14.0 is required"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel

# Fedora
sudo dnf groupinstall "Development Tools"
sudo dnf install python3-devel
```

### Lỗi: "npm ERR! code ELIFECYCLE"

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: "EACCES: permission denied"

**Giải pháp:**
```bash
# Không nên dùng sudo với npm
# Thay vào đó, fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## ✅ KIỂM TRA CÀI ĐẶT

### Kiểm tra Python:
```bash
python3 --version
pip3 --version
```

### Kiểm tra Node.js:
```bash
node --version
npm --version
```

### Kiểm tra Backend:
```bash
cd backend
source venv/bin/activate
python -c "import fastapi; print('FastAPI OK')"
python -c "import uvicorn; print('Uvicorn OK')"
deactivate
```

### Kiểm tra Frontend:
```bash
cd frontend
npm list --depth=0
```

---

## 📝 GHI CHÚ

1. **Virtual Environment:** Luôn kích hoạt virtual environment trước khi chạy backend:
   ```bash
   source backend/venv/bin/activate
   ```

2. **Ports:** 
   - Backend: `8000`
   - Frontend: `3000`
   - Đảm bảo ports này không bị sử dụng bởi ứng dụng khác

3. **Firewall:** Nếu muốn truy cập từ thiết bị khác, mở ports:
   ```bash
   # Ubuntu/Debian (ufw)
   sudo ufw allow 3000
   sudo ufw allow 8000
   
   # CentOS/RHEL (firewalld)
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --add-port=8000/tcp --permanent
   sudo firewall-cmd --reload
   ```

4. **Permissions:** Đảm bảo có quyền đọc/ghi trong thư mục project

---

## 🆘 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra log của script cài đặt
2. Đảm bảo đã cài đặt đầy đủ system dependencies
3. Kiểm tra phiên bản Python và Node.js
4. Xem lại phần [Xử lý sự cố](#-xử-lý-sự-cố)

---

**Chúc bạn cài đặt thành công! 🎉**

