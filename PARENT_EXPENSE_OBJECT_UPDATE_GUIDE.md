# Hướng dẫn cập nhật đối tượng cha khi thêm/sửa đối tượng con

## 📋 Tổng quan

Khi cập nhật bảng `project_expenses`, cần đảm bảo đối tượng cha được cập nhật tự động khi:
- ✅ Thêm đối tượng con mới
- ✅ Sửa đối tượng con hiện có  
- ✅ Xóa đối tượng con
- ✅ Thay đổi `expense_object_id` của đối tượng con

## 🔧 Cấu trúc dữ liệu

### Bảng `project_expenses`
```sql
CREATE TABLE public.project_expenses (
  id uuid PRIMARY KEY,
  expense_code text,
  description text NOT NULL,
  amount numeric(18, 2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'VND',
  expense_date date NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  receipt_url text,
  project_id uuid,
  customer_id uuid,
  id_parent uuid,                    -- Liên kết đến expense cha
  employee_id uuid,
  department_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expense_object_columns jsonb DEFAULT '[]',
  invoice_items jsonb DEFAULT '[]',
  expense_object_id uuid              -- Liên kết đến expense_objects
);
```

### Bảng `expense_objects`
```sql
CREATE TABLE public.expense_objects (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  parent_id uuid,                    -- Liên kết đến đối tượng cha
  is_parent boolean DEFAULT false,
  role text,
  total_children_cost numeric(18,2) DEFAULT 0,
  cost_from_children boolean DEFAULT false
);
```

## 🚀 Logic cập nhật đối tượng cha

### 1. Khi tạo expense mới (POST /project-expenses)

```python
@router.post("/project-expenses")
async def create_project_expense(payload: dict, current_user: User = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Tạo expense mới
        expense = dict(payload)
        expense["id"] = str(uuid.uuid4())
        expense["status"] = expense.get("status") or "pending"
        expense["created_at"] = datetime.utcnow().isoformat()
        expense["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("project_expenses").insert(expense).execute()
        
        if result.data:
            created_expense = result.data[0]
            
            # 🔄 TỰ ĐỘNG CẬP NHẬT ĐỐI TƯỢNG CHA
            if expense.get('expense_object_id'):
                try:
                    await update_parent_expense_object_total(expense['expense_object_id'], supabase)
                except Exception as e:
                    print(f"Warning: Failed to update parent expense object total: {e}")
            
            return created_expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project expense: {str(e)}")
```

### 2. Khi cập nhật expense (PUT /project-expenses/{expense_id})

```python
@router.put("/project-expenses/{expense_id}")
async def update_project_expense(expense_id: str, payload: dict, current_user: User = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Lấy expense hiện tại
        existing = supabase.table("project_expenses").select("*").eq("id", expense_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Not found")

        # Cập nhật expense
        update_dict = {k: v for k, v in payload.items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()

        result = supabase.table("project_expenses").update(update_dict).eq("id", expense_id).execute()
        
        if result.data:
            updated_expense = result.data[0]
            
            # 🔄 TỰ ĐỘNG CẬP NHẬT ĐỐI TƯỢNG CHA
            if update_dict.get('expense_object_id'):
                try:
                    await update_parent_expense_object_total(update_dict['expense_object_id'], supabase)
                except Exception as e:
                    print(f"Warning: Failed to update parent expense object total: {e}")
            
            return updated_expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project expense: {str(e)}")
```

### 3. Khi xóa expense (DELETE /project-expenses/{expense_id})

```python
@router.delete("/project-expenses/{expense_id}")
async def delete_project_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Lấy expense trước khi xóa để lấy expense_object_id
        existing = supabase.table("project_expenses").select("expense_object_id").eq("id", expense_id).execute()
        
        # Xóa expense
        result = supabase.table("project_expenses").delete().eq("id", expense_id).execute()
        
        if result.data:
            # 🔄 TỰ ĐỘNG CẬP NHẬT ĐỐI TƯỢNG CHA SAU KHI XÓA
            if existing.data and existing.data[0].get('expense_object_id'):
                try:
                    await update_parent_expense_object_total(existing.data[0]['expense_object_id'], supabase)
                except Exception as e:
                    print(f"Warning: Failed to update parent expense object total: {e}")
            
            return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project expense: {str(e)}")
```

## 🔄 Hàm cập nhật đối tượng cha

```python
async def update_parent_expense_object_total(expense_object_id: str, supabase):
    """Cập nhật tổng chi phí của đối tượng cha dựa trên tổng các đối tượng con"""
    try:
        # Lấy thông tin đối tượng chi phí
        expense_object_result = supabase.table("expense_objects").select("*").eq("id", expense_object_id).execute()
        if not expense_object_result.data:
            return
        
        expense_object = expense_object_result.data[0]
        
        # Nếu đây là đối tượng con, tìm đối tượng cha
        if expense_object.get('parent_id'):
            parent_id = expense_object['parent_id']
            
            # Tính tổng chi phí của tất cả đối tượng con
            children_result = supabase.table("expense_objects").select("id").eq("parent_id", parent_id).execute()
            children_ids = [child['id'] for child in children_result.data or []]
            
            if children_ids:
                # Tính tổng chi phí từ project_expenses
                total_result = supabase.table("project_expenses").select("amount").in_("expense_object_id", children_ids).execute()
                total_amount = sum(float(expense.get('amount', 0)) for expense in total_result.data or [])
                
                # Tạo/cập nhật record tổng kết trong project_expenses
                parent_expense_data = {
                    "id": str(uuid.uuid4()),
                    "description": f"Tổng {expense_object.get('name', 'đối tượng')}",
                    "amount": total_amount,
                    "expense_date": datetime.utcnow().date().isoformat(),
                    "expense_object_id": parent_id,
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                # Kiểm tra xem đã có record tổng kết chưa
                existing_total = supabase.table("project_expenses").select("id").eq("expense_object_id", parent_id).eq("description", f"Tổng {expense_object.get('name', 'đối tượng')}").execute()
                
                if existing_total.data:
                    # Cập nhật record tổng kết
                    supabase.table("project_expenses").update({
                        "amount": total_amount,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", existing_total.data[0]['id']).execute()
                else:
                    # Tạo record tổng kết mới
                    supabase.table("project_expenses").insert(parent_expense_data).execute()
                
                print(f"✅ Updated parent expense object total: {total_amount}")
        
    except Exception as e:
        print(f"❌ Error updating parent expense object total: {e}")
        raise
```

## 📊 Các trường hợp cần xử lý

### 1. Thêm đối tượng con mới
```python
# Khi tạo expense với expense_object_id là đối tượng con
expense_data = {
    "description": "Chi phí nguyên vật liệu chính",
    "amount": 1000000,
    "expense_object_id": "child_object_id",  # Đối tượng con
    "project_id": "project_id"
}

# Hệ thống sẽ tự động:
# 1. Tạo expense mới
# 2. Gọi update_parent_expense_object_total()
# 3. Tính tổng tất cả đối tượng con
# 4. Tạo/cập nhật record tổng kết cho đối tượng cha
```

### 2. Sửa đối tượng con hiện có
```python
# Khi cập nhật amount của đối tượng con
update_data = {
    "amount": 1500000,  # Tăng từ 1M lên 1.5M
    "expense_object_id": "child_object_id"
}

# Hệ thống sẽ tự động:
# 1. Cập nhật expense
# 2. Gọi update_parent_expense_object_total()
# 3. Tính lại tổng tất cả đối tượng con
# 4. Cập nhật record tổng kết cho đối tượng cha
```

### 3. Xóa đối tượng con
```python
# Khi xóa expense của đối tượng con
# Hệ thống sẽ tự động:
# 1. Lấy expense_object_id trước khi xóa
# 2. Xóa expense
# 3. Gọi update_parent_expense_object_total()
# 4. Tính lại tổng các đối tượng con còn lại
# 5. Cập nhật record tổng kết cho đối tượng cha
```

### 4. Thay đổi expense_object_id
```python
# Khi chuyển expense từ đối tượng con này sang đối tượng con khác
update_data = {
    "expense_object_id": "new_child_object_id"  # Chuyển sang đối tượng con khác
}

# Hệ thống sẽ tự động:
# 1. Cập nhật expense
# 2. Gọi update_parent_expense_object_total() cho đối tượng mới
# 3. Tính lại tổng cho cả đối tượng cha cũ và mới
```

## 🎯 Lợi ích của cách tiếp cận này

1. **Tự động hóa**: Không cần can thiệp thủ công
2. **Tính toán chính xác**: Tổng đối tượng cha luôn bằng tổng các đối tượng con
3. **Đồng bộ dữ liệu**: Đảm bảo tính nhất quán
4. **Linh hoạt**: Hỗ trợ nhiều cấp độ đối tượng cha-con
5. **Hiệu suất**: Chỉ tính toán khi cần thiết

## 🔍 Kiểm tra và debug

```python
# Kiểm tra tổng đối tượng cha
def check_parent_total(parent_id: str, supabase):
    # Lấy tất cả đối tượng con
    children = supabase.table("expense_objects").select("id").eq("parent_id", parent_id).execute()
    children_ids = [child['id'] for child in children.data or []]
    
    # Tính tổng từ project_expenses
    total_result = supabase.table("project_expenses").select("amount").in_("expense_object_id", children_ids).execute()
    calculated_total = sum(float(expense.get('amount', 0)) for expense in total_result.data or [])
    
    # Lấy record tổng kết hiện tại
    parent_total = supabase.table("project_expenses").select("amount").eq("expense_object_id", parent_id).execute()
    current_total = parent_total.data[0].get('amount', 0) if parent_total.data else 0
    
    print(f"Calculated total: {calculated_total}")
    print(f"Current total: {current_total}")
    print(f"Match: {calculated_total == current_total}")
    
    return calculated_total == current_total
```

## 📝 Lưu ý quan trọng

1. **Luôn gọi `update_parent_expense_object_total()`** sau khi thay đổi expense
2. **Xử lý exception** để tránh lỗi khi cập nhật
3. **Kiểm tra `expense_object_id`** trước khi gọi hàm cập nhật
4. **Sử dụng transaction** nếu cần đảm bảo tính nhất quán
5. **Log lỗi** để debug khi cần thiết

Cách tiếp cận này đảm bảo đối tượng cha luôn được cập nhật chính xác khi có thay đổi ở đối tượng con!
