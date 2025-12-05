# Phân Tích File .sh và Đánh Giá Ảnh Hưởng

## 📋 Danh Sách File .sh Cần Kiểm Tra

### Root Directory
1. `update_api_url.sh` - Cập nhật NEXT_PUBLIC_API_URL tự động
2. `stop_frontend.sh` - Tắt Frontend server (Linux/Mac)
3. `stop_backend.sh` - Tắt Backend server (Linux/Mac)
4. `stop_all.sh` - Tắt cả Backend và Frontend (Linux/Mac)
5. `start_network.sh` - Khởi động hệ thống với network access (Linux/Mac)
6. `setup_linux.sh` - Script setup môi trường Linux

### File Khác (KHÔNG XÓA)
- `clone_and_setup_ubuntu.sh` - Script clone và setup Ubuntu
- `scripts/install_backend.sh` - **ĐƯỢC SỬ DỤNG** trong package.json

## 🔍 Phân Tích Chi Tiết

### 1. `update_api_url.sh`
**Chức năng:** Tự động lấy IP máy ảo và cập nhật NEXT_PUBLIC_API_URL trong frontend/.env.local

**Sử dụng:**
- ❌ Không được reference trong package.json
- ❌ Không được reference trong README.md
- ✅ Được đề cập trong docs (không bắt buộc)

**Thay thế:**
- Có thể cập nhật thủ công trong frontend/.env.local
- Hoặc sử dụng lệnh thủ công

**Kết luận:** ✅ CÓ THỂ XÓA - Không ảnh hưởng đến code chính

---

### 2. `stop_frontend.sh`, `stop_backend.sh`, `stop_all.sh`
**Chức năng:** Helper scripts để tắt servers (tương tự .bat đã xóa)

**Sử dụng:**
- ❌ Không được reference trong package.json
- ❌ Không được reference trong README.md
- ✅ Được đề cập trong docs/setup/STOP_SERVERS_README.md

**Thay thế:**
- Sử dụng lệnh thủ công: `lsof -ti:8000 | xargs kill -9`
- Hoặc `pkill -f uvicorn` / `pkill -f next`

**Kết luận:** ✅ CÓ THỂ XÓA - Tương tự như .bat đã xóa, có thể thay thế

---

### 3. `start_network.sh`
**Chức năng:** Gọi `python3 start_network.py`

**Sử dụng:**
- ❌ Không được reference trong package.json
- ✅ package.json có `dev:network` gọi trực tiếp `python start_network.py` (không cần .sh)
- ✅ Được đề cập trong docs

**Thay thế:**
- Sử dụng `npm run dev:network` (đã có trong package.json)
- Hoặc `python3 start_network.py` trực tiếp

**Kết luận:** ✅ CÓ THỂ XÓA - Đã có thay thế trong package.json

---

### 4. `setup_linux.sh`
**Chức năng:** Script setup môi trường Linux tự động

**Sử dụng:**
- ✅ Được đề cập trong docs/SETUP_README.md
- ✅ Được đề cập trong docs/SETUP_LINUX.md
- ❌ Không được reference trong package.json

**Thay thế:**
- Có thể setup thủ công theo hướng dẫn trong docs
- Hoặc sử dụng `npm run install:all` (đã có trong package.json)

**Kết luận:** ⚠️ CẦN XEM XÉT - Hữu ích cho người dùng Linux nhưng có thể thay thế

---

## 📊 Tổng Kết

### ✅ AN TOÀN XÓA (5 files):
1. ✅ `update_api_url.sh` - Có thể thay thế bằng thủ công
2. ✅ `stop_frontend.sh` - Helper script, có thể thay thế
3. ✅ `stop_backend.sh` - Helper script, có thể thay thế
4. ✅ `stop_all.sh` - Helper script, có thể thay thế
5. ✅ `start_network.sh` - Đã có thay thế trong package.json

### ⚠️ CẦN XEM XÉT (1 file):
1. ⚠️ `setup_linux.sh` - Hữu ích nhưng có thể thay thế

### ❌ KHÔNG XÓA:
- `clone_and_setup_ubuntu.sh` - Script đặc biệt
- `scripts/install_backend.sh` - **ĐƯỢC SỬ DỤNG** trong package.json

## 🔍 Đánh Giá Ảnh Hưởng

### ✅ KHÔNG ẢNH HƯỞNG ĐẾN:
- Code chính (backend/frontend)
- Build process
- Deployment
- Dependencies
- Runtime application
- Package.json scripts (đã có thay thế)

### ⚠️ ẢNH HƯỞNG:
- **Người dùng Linux/Mac** - Mất tiện ích helper scripts
  - **Giải pháp:** Sử dụng npm scripts hoặc lệnh thủ công (đã có trong docs)

## 📝 Thay Thế

### Tắt Backend (Linux/Mac):
```bash
lsof -ti:8000 | xargs kill -9
# hoặc
pkill -f uvicorn
```

### Tắt Frontend (Linux/Mac):
```bash
lsof -ti:3000 | xargs kill -9
# hoặc
pkill -f next
```

### Start Network:
```bash
npm run dev:network
# hoặc
python3 start_network.py
```

### Setup Linux:
```bash
npm run install:all
# hoặc làm theo hướng dẫn trong docs
```

## 🎯 Kết Luận

**CÓ THỂ XÓA 5-6 files** mà không ảnh hưởng đến code chính:
- Tất cả đều có thay thế
- Không được sử dụng trong build/deployment
- Chỉ là helper scripts tiện ích

