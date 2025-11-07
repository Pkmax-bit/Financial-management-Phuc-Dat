# 🚀 Quick Setup Guide

## Linux

### Cài đặt tự động (Khuyến nghị):
```bash
chmod +x setup_linux.sh
./setup_linux.sh
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
   python start_network.py  # Tự động cấu hình và khởi động
   ```

## Xem thêm

- **Linux Setup:** [SETUP_LINUX.md](./SETUP_LINUX.md)
- **Network Access:** [HUONG_DAN_NETWORK.md](./HUONG_DAN_NETWORK.md)

