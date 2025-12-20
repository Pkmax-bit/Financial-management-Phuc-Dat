# HƯỚNG DẪN SỬ DỤNG BẢNG TRẠNG THÁI

## 📋 Tổng quan

Dự án đã được cập nhật với:
- ✅ **4 bảng database trạng thái** cho Khách hàng, Dự án, Báo giá, Hóa đơn
- ✅ **UI components** đã được chuẩn hóa theo FIGMA spec Bitrix24
- ✅ **API interfaces** sẵn sàng để kết nối với backend

---

## 🗄️ Database Schema

### Các bảng trạng thái

1. **`customer_statuses`** - Trạng thái khách hàng
2. **`project_statuses`** - Trạng thái dự án
3. **`quote_statuses`** - Trạng thái báo giá
4. **`invoice_statuses`** - Trạng thái hóa đơn

### Cấu trúc bảng

Mỗi bảng có các cột:
- `id` (UUID) - Primary key
- `code` (VARCHAR) - Mã trạng thái (unique)
- `name` (VARCHAR) - Tên hiển thị
- `color` (VARCHAR) - Màu HEX code
- `display_order` (INTEGER) - Thứ tự hiển thị
- `is_default` (BOOLEAN) - Trạng thái mặc định
- `is_system` (BOOLEAN) - Trạng thái hệ thống (không cho xóa)
- `description` (TEXT) - Mô tả (optional)
- `created_at`, `updated_at` - Timestamps
- `created_by`, `updated_by` - User IDs (optional)

### Seed Data

Dữ liệu mặc định đã được seed theo đúng FIGMA spec:

**Khách hàng:**
- Tiềm năng (#2FC6F6)
- Hoạt động (#9ECF00) - Default
- Ngừng hoạt động (#9CA3AF)

**Dự án:**
- Lập kế hoạch (#9CA3AF)
- Đang hoạt động (#9ECF00) - Default
- Tạm dừng (#FFA900)
- Hoàn thành (#2066B0)
- Đã hủy (#FF5752)

**Báo giá:**
- Nháp (#9CA3AF) - Default
- Đã gửi (#2FC6F6)
- Đã xem (#A855F7)
- Đã chấp nhận (#9ECF00)
- Từ chối (#FF5752)
- Hết hạn (#FFA900)
- Đã đóng (#6B7280)

**Hóa đơn:**
- Nháp (#9CA3AF) - Default
- Đã gửi (#2FC6F6)
- Chờ thanh toán (#FFA900)
- Đã thanh toán (#9ECF00)
- Quá hạn (#FF5752)
- Đã hủy (#6B7280)

---

## 🚀 Cài đặt Database

### Bước 1: Chạy SQL Schema

```bash
# PostgreSQL
psql -U your_user -d your_database -f database/schema/status_tables.sql

# Hoặc sử dụng migration tool của bạn
```

### Bước 2: Cập nhật các bảng chính

Thêm cột `status_id` vào các bảng chính (nếu chưa có):

```sql
-- Khách hàng
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES customer_statuses(id);

-- Dự án
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES project_statuses(id);

-- Báo giá
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES quote_statuses(id);

-- Hóa đơn
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES invoice_statuses(id);
```

**Lưu ý:** Các bảng khác giữ nguyên như yêu cầu, chỉ thêm cột `status_id`.

---

## 🔌 API Integration

### API Endpoints

File `src/app/api/types.ts` đã định nghĩa các endpoints:

```typescript
// Customer Statuses
GET    /api/customer-statuses
POST   /api/customer-statuses
PUT    /api/customer-statuses/:id
DELETE /api/customer-statuses/:id
PATCH  /api/customer-statuses/reorder

// Tương tự cho project-statuses, quote-statuses, invoice-statuses
```

### Sử dụng API Types

```typescript
import { 
  StatusResponse, 
  CreateStatusRequest, 
  mapStatusResponseToStatus 
} from './api/types';

// Fetch statuses
const response = await fetch('/api/customer-statuses');
const data: StatusResponse[] = await response.json();
const statuses = data.map(mapStatusResponseToStatus);
```

---

## 🎨 UI Components

### Card Components

Tất cả card components đã được cập nhật theo FIGMA spec:

- ✅ **Left border accent** 4px theo màu trạng thái
- ✅ **Padding** 12px
- ✅ **Border radius** 4px
- ✅ **Shadow** nhẹ (0 1px 3px rgba(0,0,0,0.1))
- ✅ **Hover state** với border xanh và shadow tăng

**Files:**
- `src/app/components/cards/customer-card.tsx`
- `src/app/components/cards/project-card.tsx`
- `src/app/components/cards/quote-card.tsx`
- `src/app/components/cards/invoice-card.tsx`

### Kanban Board

- ✅ **Column header** có tab với mũi nhọn bên phải (Bitrix24 style)
- ✅ **Drag & drop** giữa các cột
- ✅ **Hover highlight** khi drag vào cột đích

**File:** `src/app/components/kanban-board.tsx`

### List View

- ✅ **Sticky header** với background #F5F7F8
- ✅ **Hover state** #E8F4FD
- ✅ **Checkbox** để chọn nhiều items
- ✅ **Pagination** ở bottom

**File:** `src/app/components/list-view.tsx`

---

## 📝 Migration từ Mock Data

Hiện tại code đang dùng mock data từ `src/app/data/mock-data.ts`.

### Bước 1: Tạo API Client

Tạo file `src/app/api/status-client.ts`:

```typescript
import { StatusResponse, mapStatusResponseToStatus } from './types';
import { Status } from '../types';

export async function fetchCustomerStatuses(): Promise<Status[]> {
  const response = await fetch('/api/customer-statuses');
  const data: StatusResponse[] = await response.json();
  return data.map(mapStatusResponseToStatus);
}
```

### Bước 2: Cập nhật Modules

Thay thế mock data bằng API call:

```typescript
// Trong customers.tsx
const [statuses, setStatuses] = useState<Status[]>([]);

useEffect(() => {
  fetchCustomerStatuses().then(setStatuses);
}, []);
```

---

## ✅ Checklist

- [x] SQL schema cho 4 bảng trạng thái
- [x] Seed data mặc định
- [x] API TypeScript interfaces
- [x] Card components chuẩn hóa theo FIGMA
- [x] Kanban board với tab mũi nhọn
- [x] List view với sticky header
- [ ] Backend API implementation (TODO)
- [ ] Migration từ mock data sang API (TODO)
- [ ] Unit tests (TODO)

---

## 📚 Tài liệu tham khảo

- **FIGMA Spec:** `FIGMA_PROMPT_KANBAN.md`
- **Database Schema:** `database/schema/status_tables.sql`
- **API Types:** `src/app/api/types.ts`

---

## 🐛 Troubleshooting

### Lỗi Foreign Key

Nếu gặp lỗi khi thêm `status_id` vào các bảng chính:

```sql
-- Kiểm tra xem bảng status đã tồn tại chưa
SELECT * FROM customer_statuses;

-- Nếu chưa có dữ liệu, chạy lại seed
-- Xem file database/schema/status_tables.sql
```

### Lỗi TypeScript

Nếu có lỗi type:

```bash
# Rebuild types
npm run build

# Hoặc check types
npx tsc --noEmit
```

---

## 📞 Hỗ trợ

Nếu có vấn đề, kiểm tra:
1. Database schema đã chạy chưa?
2. Seed data đã có chưa?
3. Foreign keys đã được thêm vào các bảng chính chưa?
4. API endpoints đã implement chưa?

