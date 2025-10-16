# Hướng dẫn Tổng hợp Chức năng (All Features Guide)

## Bản đồ nhanh (visual overview)
```
Chi phí (expenses) ─┐
                    ├─> Tạo chi phí con → Auto-Snapshot (expense_snapshots)
Chi phí dự án (planned) ─┤                         │
Chi phí dự án (actual) ──┘                         └─> Nút "Quay lại" (Restore)

UI:
- ExpensesTab (chi phí thường): Nút Quay lại hiển thị ở dòng CHA (không có id_parent)
- ProjectExpensesTab (dự án):   Nút Quay lại hiển thị ở dòng CHA, kiểm tra đúng project

Backend:
- AutoSnapshotService: tạo/lấy/khôi phục snapshot theo parent_id + snapshot_type
- Routers expense_restore: latest-snapshot, history, restore-parent
```

## 1) Snapshot & Restore (Chi phí cha/chi phí con)
- **Mục tiêu**: Lưu trạng thái chi phí cha khi tạo chi phí con, và cho phép khôi phục.
- **Bảng dữ liệu**: `expense_snapshots`
  - Cột: `id`, `snapshot_name`, `snapshot_type` ('expenses' | 'project_actual' | 'project_planned'), `expenses_data` (JSON), `parent_expense_id`, `child_expense_id`, `project_id`, `created_by`, `created_at`, `restored_at`, `restored_by`, `is_active`...
  - Indexes: `idx_expense_snapshots_parent_id`, `idx_expense_snapshots_child_id`, `idx_expense_snapshots_project_id`
- **Schema update**: Xem `update_snapshot_schema.sql` và `SNAPSHOT_SCHEMA_UPDATE_GUIDE.md`

### Backend
- Service: `backend/services/auto_snapshot_service.py`
  - Tạo snapshot khi có chi phí con (cho `expenses`, `project_expenses`, `project_expenses_quote`)
  - Lưu `parent_expense_id`, `child_expense_id`, `project_id`
  - Lấy snapshot mới nhất theo `parent_expense_id` + `snapshot_type`
  - Khôi phục dữ liệu chi phí cha từ snapshot
- Routers:
  - `backend/routers/expense_restore.py`
    - GET `/api/expense-restore/history/{parent_id}?table_name=...`
    - GET `/api/expense-restore/latest-snapshot/{parent_id}?table_name=...`
    - POST `/api/expense-restore/restore-parent/{parent_id}?table_name=...`
  - Tích hợp snapshot khi tạo chi phí con:
    - `backend/routers/expenses.py`: endpoint tạo chi phí thường
    - `backend/routers/project_expenses.py`: endpoint tạo chi phí dự án (kế hoạch/thực tế)

### Frontend
- Component: `frontend/src/components/expenses/SnapshotStatusIndicator.tsx`
  - Props: `parentId`, `tableName`, `projectId?`, `onRestore?`
  - Hiển thị trạng thái snapshot và nút “Quay lại” (chỉ bật khi có snapshot hợp lệ cùng dự án)
- Tích hợp:
  - Chi phí dự án: `ProjectExpensesTab.tsx` (truyền `projectId={expense.project_id}`)
  - Chi phí thường: `ExpensesTab.tsx` (hiển thị cho dòng cha không có `id_parent`)
- Nút tạo chi phí con hiển thị trong `ExpensesTab.tsx` và dialog tạo/sửa chi phí dự án `CreateProjectExpenseDialog.tsx` có nút “Quay lại” trong context chọn cha.

### Quy trình sử dụng (User flow)
### Flow A: Tạo chi phí con → Tự động snapshot
```
[UI] Chọn chi phí CHA → Tạo chi phí CON (id_parent = id CHA)
       │
       ▼
[Backend] AutoSnapshotService.create_auto_snapshot_for_child()
       │  - Lấy dữ liệu cha hiện tại
       │  - Lưu vào expense_snapshots (kèm parent_expense_id, child_expense_id, project_id, snapshot_type)
       ▼
[DB] Bảng expense_snapshots có thêm 1 dòng snapshot mới
```

### Flow B: Nhấn "Quay lại" để khôi phục
```
[UI] Nút Quay lại ở dòng CHA → gọi /api/expense-restore/restore-parent/{parent_id}?table_name=...
       │
       ▼
[Backend] AutoSnapshotService.restore_parent_from_snapshot()
       │  - Lấy latest snapshot theo parent_expense_id + snapshot_type
       │  - Khôi phục dữ liệu cha về trạng thái snapshot
       ▼
[DB] Cập nhật bản ghi cha; snapshot được đánh dấu restored_at (lịch sử vẫn giữ)
```

### Checklist hiển thị nút "Quay lại"
- [x] Mục là CHA (không có `id_parent` hoặc `level === 0`)
- [x] Có ít nhất 1 snapshot cho `parent_expense_id` này
- [x] Đúng bảng (`tableName`): expenses | project_expenses | project_expenses_quote
- [x] Với dự án: `projectId` khớp `snapshot.project_id`

### Troubleshooting
- Lỗi FK 23503 với `parent_expense_id`: Đã bỏ FK vì parent có thể ở nhiều bảng. Chạy `update_snapshot_schema.sql` (đã có lệnh `DROP CONSTRAINT IF EXISTS`).
- “Không có snapshot”: Chưa từng tạo chi phí con cho cha đó; tạo chi phí con rồi tải lại.
- Sai dự án: `SnapshotStatusIndicator` kiểm tra `projectId` để chỉ bật nút đúng dự án.

### Mẹo trực quan (UI cues)
- Dòng con (child) thường có màu cam nhẹ, icon giấy màu cam; dòng cha màu mặc định.
- Nút Quay lại chỉ thấy ở dòng cha. Nếu bị mờ kèm tooltip "Không có snapshot" → cần tạo chi phí con trước.
- Trong dự án, xem cột thao tác của dòng cha: có "Quay lại" và biểu tượng lịch sử.

---

## 2) Chi phí dự án (planned/actual) + phân cấp cha/con
- **Bảng**: `project_expenses_quote` (planned), `project_expenses` (actual)
- **Cột quan trọng**: `id_parent` (quan hệ cha/con), `invoice_items`, `expense_object_columns`
- Phân cấp hiển thị trong `ProjectExpensesTab.tsx`, có expand/collapse, màu sắc phân biệt cha/con.

### Auto Calculate từ `invoice_items`
### Minh họa dữ liệu `invoice_items`
```json
[
  {
    "unit": "cái", "quantity": 1, "unit_price": 100000,
    "line_total": 100000,
    "product_name": "teu",
    "components_pct": { "<expense_object_id_1>": 1, "<expense_object_id_2>": 7 }
  }
]
```
- Nút "Tính toán tự động" sẽ tính tỷ lệ theo `components_pct` và trả về cột đối tượng chi phí.

- Backend: `backend/routers/project_expenses.py` có endpoint
  - POST `/api/project-expenses/calculate-expense-objects`
- Frontend: `CreateProjectExpenseDialog.tsx` có nút “Tính toán tự động” gọi endpoint này.

---

## 3) Chi phí thường (company expenses) + phân cấp cha/con
- **Bảng**: `expenses` (có `id_parent`)
- Frontend: `ExpensesTab.tsx` hiển thị phân cấp, tổng con cho cha, phần trăm tỉ trọng chi tiết.
- Snapshot/Restore đã áp dụng tương tự chi phí dự án (xem mục 1).

### Nhìn nhanh trong UI
```
Mã chi phí | Mô tả | Số tiền | Ngày | Trạng thái | Thao tác
                                                └─ [ + ] Tạo con  [Quay lại]*  [Sửa] [Xóa]
*Quay lại chỉ hiển thị ở dòng cha có snapshot
```

---

## 4) Phục vụ xác thực/Phân quyền cơ bản
- Sử dụng Supabase Auth; các gọi API backend kèm `Authorization: Bearer <access_token>`
- Nhiều endpoint yêu cầu đăng nhập.

---

## 5) Hướng dẫn triển khai cập nhật
- Chạy SQL trong Supabase Dashboard theo `SNAPSHOT_SCHEMA_UPDATE_GUIDE.md`.
- Đảm bảo backend đã include routers trong `backend/main.py`:
  - `/api/expense-snapshots`, `/api/expense-restore`, `/api/project-expenses`, `/api/expenses`
- Xây dựng frontend và kiểm tra các component đã được import đúng.

---

## 6) API tham khảo nhanh
- Snapshot
  - GET `/api/expense-restore/history/{parent_id}?table_name=expenses|project_expenses|project_expenses_quote`
  - GET `/api/expense-restore/latest-snapshot/{parent_id}?table_name=...`
  - POST `/api/expense-restore/restore-parent/{parent_id}?table_name=...`
- Project Expenses
  - POST `/api/project-expenses/calculate-expense-objects`
  - POST `/api/project-expenses` (tạo actual)
  - POST `/api/project-expenses/quotes` (tạo planned)
- Expenses
  - POST `/api/expenses/expenses` (tạo chi phí)
  - DELETE `/api/expenses/expenses/{id}`

### Thứ tự gọi khi khôi phục (visual)
```
Frontend → GET latest-snapshot → xác thực có snapshot & đúng project →
Frontend → POST restore-parent →
Backend  → AutoSnapshotService.restore_parent_from_snapshot →
DB       → cập nhật cha, đánh dấu restored_at
```

---

## 7) Lưu ý & Best Practices
- Không dùng trigger DB cho snapshot; dùng backend service để kiểm soát logic và tránh lỗi.
- Luôn truyền token Supabase khi gọi API từ frontend.
- Đảm bảo đã cập nhật `snapshot_type` (VARCHAR(50)) và dùng mapping `project_actual`, `project_planned` trong service.

---

## 8) Files chính
- Backend: `backend/services/auto_snapshot_service.py`, `backend/routers/{expense_restore,project_expenses,expenses}.py`, `backend/main.py`
- Frontend: `frontend/src/components/expenses/{SnapshotStatusIndicator,ProjectExpensesTab,ExpensesTab,CreateProjectExpenseDialog}.tsx`
- SQL: `update_snapshot_schema.sql`, `create_expense_snapshots_enhanced.sql`, `db/cleanup_disable_auto_snapshot_triggers.sql`
- Docs: `SNAPSHOT_SCHEMA_UPDATE_GUIDE.md`, `SNAPSHOT_PROJECT_VALIDATION_SUMMARY.md`, `RESTORE_BUTTON_GUIDE.md`, `EXPENSE_SNAPSHOTS_GUIDE.md`
