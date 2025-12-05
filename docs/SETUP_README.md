# 🚀 Quick Setup Guide

## Linux

### Cài đặt tự động:
```bash
# Sử dụng npm scripts (khuyến nghị)
npm run install:all

# Hoặc cài đặt riêng:
npm run install:backend
npm run install:frontend
```

### Cài đặt thủ công:
Xem hướng dẫn chi tiết: [SETUP_LINUX.md](./SETUP_LINUX.md)

## Windows

### Cài đặt Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy env.example .env
```

### Cài đặt Frontend:
```bash
cd frontend
npm install
copy env.local.example .env.local
```

## Sau khi cài đặt

1. **Cấu hình Backend:**
   - Chỉnh sửa `backend/.env` với thông tin Supabase của bạn

2. **Cấu hình Frontend:**
   - Chỉnh sửa `frontend/.env.local` với thông tin Supabase của bạn

3. **Khởi động:**
   ```bash
   # Backend
   cd backend
   source venv/bin/activate  # Linux/Mac
   # hoặc venv\Scripts\activate  # Windows
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   
   # Frontend (terminal mới)
   cd frontend
   npm run dev
   ```

4. **Hoặc chạy với network access:**
   ```bash
   npm run dev:network  # Sử dụng npm script (khuyến nghị)
   # hoặc
   python start_network.py  # Chạy trực tiếp Python script
   ```

## Xem thêm

- **Linux Setup:** [SETUP_LINUX.md](./SETUP_LINUX.md)
- **Network Access:** [HUONG_DAN_NETWORK.md](./HUONG_DAN_NETWORK.md)

