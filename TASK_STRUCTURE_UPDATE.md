# Cập nhật Cấu trúc Tạo Tasks Mẫu

## Thay đổi

Đã cập nhật logic tạo tasks mẫu để khớp với cấu trúc dự án "Chị Trang - 480/15 Nguyễn Tri Phương,Q10".

### Cấu trúc cũ (SAI):
```
📌 [Tên dự án] (parent task)
  ├─ Kế hoạch (sub-task)
  │  └─ Checklist "Kế hoạch":
  │     ☐ Đo đạt (checklist item)
  │     ☐ Thiết kế
  ├─ Sản xuất (sub-task)
  │  └─ Checklist "Sản xuất":
  │     ☐ Mua hàng
  └─ ...
```

### Cấu trúc mới (ĐÚNG - giống dự án Trang):
```
📌 [Tên dự án] (parent task)
  ├─ Checklist "Kế hoạch":
  │  ☐ Đo đạt (checklist item - có checkbox)
  │  ☐ Thiết kế / cập nhật bản vẽ
  │  ☐ Kế hoạch vật tư
  │  ☐ Kế hoạch sản xuất
  │  ☐ Kế hoạch lắp đặt
  ├─ Checklist "Sản xuất":
  │  ☐ Mua hàng
  │  ☐ Sản xuất
  │  ☐ Hoàn thành
  ├─ Checklist "Vận chuyển / lắp đặt":
  │  ☐ Vận chuyển
  │  ☐ Lắp đặt
  │  ☐ Nghiệm thu bàn giao
  │  ☐ Thu tiền
  └─ Checklist "Chăm sóc khách hàng":
     ☐ Đánh giá khách hàng
     ☐ Báo cáo / sửa chữa
     ☐ Nghiệm thu tính lương
```

## Chi tiết thay đổi

### Backend: `project_default_tasks_service.py`

**Trước:**
- Tạo 1 parent task (tên dự án)
- Tạo 4 sub-tasks (Kế hoạch, Sản xuất, etc.)
- Tạo checklists cho mỗi sub-task
- Tạo checklist items trong mỗi checklist

**Sau:**
- Tạo 1 parent task (tên dự án)
- **KHÔNG tạo sub-tasks**
- Tạo 4 checklists **trực tiếp trong parent task**
- Tạo checklist items trong mỗi checklist

### Kết quả

- **1 parent task** (tên dự án)
- **0 sub-tasks**
- **4 checklists** (Kế hoạch, Sản xuất, Vận chuyển/lắp đặt, Chăm sóc khách hàng)
- **15 checklist items** (các nhiệm vụ nhỏ với checkbox)

## Lợi ích

1. ✅ **Giống cấu trúc dự án "Trang"** - Người dùng đã quen với cấu trúc này
2. ✅ **Có checkbox hoàn thành** - Checklist items có checkbox để tích hoàn thành
3. ✅ **Đơn giản hơn** - Không có sub-tasks phức tạp, chỉ có checklists
4. ✅ **Dễ quản lý** - Tất cả checklists ở cùng cấp trong parent task

## Test

Sau khi tạo dự án mới:
1. Kiểm tra có 1 parent task (tên dự án)
2. Kiểm tra có 4 checklists trong parent task
3. Kiểm tra mỗi checklist có đúng số lượng items
4. Kiểm tra checklist items có checkbox hoàn thành
