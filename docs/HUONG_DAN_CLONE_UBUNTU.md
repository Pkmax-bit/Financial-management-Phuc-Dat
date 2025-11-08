# 🐧 HƯỚNG DẪN CLONE DỰ ÁN TỪ GITHUB TRÊN UBUNTU LINUX

## 📋 YÊU CẦU HỆ THỐNG

Trước khi clone dự án, đảm bảo bạn đã cài đặt:

- **Git** - Để clone repository
- **Python 3.11+** - Cho backend
- **Node.js 18+** - Cho frontend
- **npm** hoặc **yarn** - Package manager

---

## 🔧 BƯỚC 1: CÀI ĐẶT CÁC CÔNG CỤ CẦN THIẾT

### 1.1. Cập nhật hệ thống
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2. Cài đặt Git
```bash
sudo apt install git -y
```

Kiểm tra phiên bản:
```bash
git --version
```

### 1.3. Cài đặt Python 3.11+
```bash
# Cài đặt Python 3.11
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# Kiểm tra phiên bản
python3.11 --version
```

### 1.4. Cài đặt Node.js 18+
```bash
# Sử dụng NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Hoặc sử dụng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Kiểm tra phiên bản
node --version
npm --version
```

---

## 📥 BƯỚC 2: CLONE DỰ ÁN TỪ GITHUB

### 2.1. Clone repository
```bash
# Clone dự án
git clone https://github.com/Pkmax-bit/Financial-management-Phuc-Dat.git

# Di chuyển vào thư mục dự án
cd Financial-management-Phuc-Dat
```

### 2.2. Kiểm tra branch hiện tại
```bash
# Xem tất cả các branch
git branch -a

# Chuyển sang branch chính (nếu cần)
git checkout main
# hoặc
git checkout master
```

### 2.3. Xem thông tin repository
```bash
# Xem remote URL
git remote -v

# Xem commit history
git log --oneline -10
```

---

## 🛠️ BƯỚC 3: CÀI ĐẶT DEPENDENCIES

### 3.1. Cài đặt tất cả dependencies (Khuyến nghị)
```bash
# Cài đặt cả backend và frontend
npm run install:all
```

### 3.2. Hoặc cài đặt riêng lẻ

#### Backend Dependencies
```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo virtual environment
python3.11 -m venv venv

# Kích hoạt virtual environment
source venv/bin/activate

# Cài đặt dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Quay lại thư mục gốc
cd ..
```

#### Frontend Dependencies
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Quay lại thư mục gốc
cd ..
```

---

## ⚙️ BƯỚC 4: CẤU HÌNH MÔI TRƯỜNG

### 4.1. Cấu hình Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Copy file env.example thành .env
cp env.example .env

# Chỉnh sửa file .env
nano .env
# hoặc
vim .env
```

Cấu hình trong `backend/.env`:
```env
# Supabase Configuration
SUPABASE_URL="https://mfmijckzlhevduwfigkl.supabase.co"
SUPABASE_SERVICE_KEY="your_service_key_here"
SUPABASE_ANON_KEY="your_anon_key_here"

# Database connection details
SUPABASE_DB_HOST="aws-1-ap-southeast-1.pooler.supabase.com"
SUPABASE_DB_USER="postgres.mfmijckzlhevduwfigkl"
SUPABASE_DB_PASSWORD="your_password_here"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_PORT="6543"

# Dify API Configuration
DIFY_API_BASE_URL="https://api.dify.ai/v1"
DIFY_API_KEY="your_dify_api_key_here"

# Email configuration
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"

# JWT Configuration
SECRET_KEY="your_secret_key_here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="30"
```

### 4.2. Cấu hình Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Copy file env.local.example thành .env.local
cp env.local.example .env.local

# Chỉnh sửa file .env.local
nano .env.local
# hoặc
vim .env.local
```

Cấu hình trong `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://mfmijckzlhevduwfigkl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_DIFY_API_BASE_URL="https://api.dify.ai/v1"
NEXT_PUBLIC_DIFY_API_KEY="your_dify_api_key_here"
```

---

## 🚀 BƯỚC 5: KHỞI ĐỘNG DỰ ÁN

### 5.1. Sử dụng script tự động (Khuyến nghị)

```bash
# Quay lại thư mục gốc
cd ..

# Chạy script setup tự động (nếu có)
chmod +x setup_linux.sh
./setup_linux.sh

# Hoặc chạy script khởi động network
chmod +x start_network.sh
./start_network.sh
```

### 5.2. Khởi động thủ công

#### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### 5.3. Sử dụng npm script (Khuyến nghị)

```bash
# Quay lại thư mục gốc
cd ..

# Chạy cả backend và frontend cùng lúc
npm run dev
```

---

## 🌐 TRUY CẬP ỨNG DỤNG

Sau khi khởi động thành công, bạn có thể truy cập:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc

---

## 🔄 CẬP NHẬT DỰ ÁN

### Pull latest changes từ GitHub
```bash
# Kiểm tra trạng thái
git status

# Pull latest changes
git pull origin main
# hoặc
git pull origin master

# Cài đặt lại dependencies nếu có thay đổi
npm run install:all
```

### Xem các thay đổi
```bash
# Xem commit history
git log --oneline -10

# Xem các file đã thay đổi
git diff

# Xem các branch
git branch -a
```

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: Permission denied khi clone
```bash
# Cấp quyền cho thư mục
chmod -R 755 ~/Financial-management-Phuc-Dat
```

### Lỗi: Python version không đúng
```bash
# Kiểm tra phiên bản Python
python3.11 --version

# Sử dụng python3.11 thay vì python3
python3.11 -m venv venv
```

### Lỗi: Node.js version không đúng
```bash
# Sử dụng nvm để quản lý version
nvm install 18
nvm use 18
node --version
```

### Lỗi: Port đã được sử dụng
```bash
# Tìm process đang sử dụng port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Lỗi: Virtual environment không hoạt động
```bash
# Tạo lại virtual environment
cd backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📝 LỆNH TÓM TẮT

```bash
# 1. Clone dự án
git clone https://github.com/Pkmax-bit/Financial-management-Phuc-Dat.git
cd Financial-management-Phuc-Dat

# 2. Cài đặt dependencies
npm run install:all

# 3. Cấu hình môi trường
cd backend && cp env.example .env && nano .env
cd ../frontend && cp env.local.example .env.local && nano .env.local
cd ..

# 4. Khởi động dự án
npm run dev
```

---

## 🔗 LIÊN KẾT HỮU ÍCH

- **GitHub Repository**: https://github.com/Pkmax-bit/Financial-management-Phuc-Dat
- **Python Documentation**: https://docs.python.org/3.11/
- **Node.js Documentation**: https://nodejs.org/docs/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Next.js Documentation**: https://nextjs.org/docs

---

## 💡 MẸO HỮU ÍCH

1. **Sử dụng screen hoặc tmux** để chạy nhiều terminal:
   ```bash
   sudo apt install screen -y
   screen -S backend
   # Chạy backend
   # Nhấn Ctrl+A, D để detach
   screen -r backend  # Để attach lại
   ```

2. **Sử dụng alias** để tiết kiệm thời gian:
   ```bash
   # Thêm vào ~/.bashrc
   alias activate-venv='source backend/venv/bin/activate'
   alias start-backend='cd backend && source venv/bin/activate && python -m uvicorn main:app --reload'
   alias start-frontend='cd frontend && npm run dev'
   ```

3. **Sử dụng Git hooks** để tự động chạy tests:
   ```bash
   # Tạo file .git/hooks/pre-commit
   #!/bin/bash
   npm run test
   ```

---

**Chúc bạn clone và setup dự án thành công! 🎉**

