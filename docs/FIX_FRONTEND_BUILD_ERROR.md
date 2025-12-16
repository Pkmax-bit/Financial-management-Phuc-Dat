# 🔧 Sửa lỗi Frontend Build Error

## ❌ Lỗi thường gặp

```
Error: Cannot find module './vendor-chunks/@tanstack.js'
```

## ✅ Giải pháp nhanh

### Cách 1: Xóa cache và rebuild (Khuyến nghị)

**Windows PowerShell:**
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

**Linux/Mac:**
```bash
cd frontend
rm -rf .next
npm run dev
```

### Cách 2: Dùng script tự động

**Windows:**
```powershell
python scripts/fix_frontend_build.ps1
```

**Linux/Mac:**
```bash
bash scripts/fix_frontend_build.sh
```

### Cách 3: Full reinstall (Nếu cách 1 không work)

**Windows PowerShell:**
```powershell
cd frontend
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

**Linux/Mac:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

## 🔍 Nguyên nhân

Lỗi này thường xảy ra khi:
1. ✅ Next.js build cache (`.next` folder) bị corrupt
2. ✅ Dependencies chưa được cài đặt đúng
3. ✅ Có conflict giữa các version của packages

## 💡 Phòng tránh

1. **Luôn xóa `.next` khi có lỗi build**
2. **Đảm bảo `node_modules` được cài đặt đầy đủ**
3. **Kiểm tra version của Node.js** (nên dùng Node 18+)

## 🚀 Sau khi fix

Sau khi fix xong, chạy lại test:

```bash
python scripts/auto_run_tests.py --type api
```

---

**Lưu ý**: Nếu vẫn còn lỗi, thử:
1. Xóa cả `node_modules` và `.next`
2. `npm install` lại
3. `npm run dev`





