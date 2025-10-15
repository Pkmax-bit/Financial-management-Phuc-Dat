# Hướng dẫn Auto Snapshot Backend Implementation

## Tổng quan
Thay vì sử dụng database triggers (gây lỗi), tính năng auto snapshot được triển khai hoàn toàn trong backend code để đảm bảo tính ổn định và dễ debug.

## Kiến trúc

### 1. **AutoSnapshotService** (`backend/services/auto_snapshot_service.py`)
- Service chính xử lý tất cả logic auto snapshot
- Không phụ thuộc vào database triggers
- Dễ test và debug

### 2. **API Integration**
- Tích hợp vào các API tạo chi phí
- Tự động gọi service khi tạo chi phí con
- Xử lý lỗi gracefully

### 3. **REST API Endpoints**
- Endpoints riêng cho restore functionality
- Không phụ thuộc vào SQL functions
- Sử dụng service layer

## Cách hoạt động

### 1. **Tạo chi phí con**
```python
# Khi tạo chi phí con (có id_parent)
if expense_dict.get('id_parent'):
    auto_snapshot_service = AutoSnapshotService()
    await auto_snapshot_service.create_auto_snapshot_for_child(
        created_expense, 
        'expenses',  # hoặc 'project_expenses', 'project_expenses_quote'
        current_user.id
    )
```

### 2. **Auto Snapshot Process**
1. **Kiểm tra chi phí con**: Có `id_parent` không?
2. **Lấy dữ liệu chi phí cha**: Query từ database
3. **Tạo snapshot data**: Bao gồm parent + child data
4. **Lưu snapshot**: Insert vào `expense_snapshots` table
5. **Log kết quả**: Success hoặc warning

### 3. **Restore Process**
1. **Lấy snapshot mới nhất**: Query từ `expense_snapshots`
2. **Extract parent data**: Từ snapshot data
3. **Update parent expense**: Restore từ snapshot
4. **Mark as restored**: Cập nhật trạng thái

## API Endpoints

### 1. **Tạo chi phí với auto snapshot**
```http
POST /api/expenses
POST /api/project-expenses/quotes  
POST /api/project-expenses
```

**Tự động tạo snapshot khi:**
- Chi phí có `id_parent` (chi phí con)
- Tạo thành công
- Không ảnh hưởng đến response time

### 2. **Restore endpoints**
```http
GET /api/expense-restore/history/{parent_id}?table_name={table_name}
GET /api/expense-restore/latest-snapshot/{parent_id}?table_name={table_name}
POST /api/expense-restore/restore-parent/{parent_id}?table_name={table_name}
POST /api/expense-restore/create-manual-snapshot/{parent_id}?table_name={table_name}
GET /api/expense-restore/check-auto-snapshots?limit=10
```

## Service Methods

### 1. **create_auto_snapshot_for_child()**
```python
async def create_auto_snapshot_for_child(
    self, 
    child_expense: Dict[str, Any], 
    table_name: str,
    created_by: str = None
) -> Optional[Dict[str, Any]]
```

**Chức năng:**
- Tạo snapshot tự động khi tạo chi phí con
- Lưu trữ parent + child data
- Trả về snapshot info hoặc None

### 2. **get_latest_auto_snapshot()**
```python
async def get_latest_auto_snapshot(
    self, 
    parent_id: str, 
    table_name: str
) -> Optional[Dict[str, Any]]
```

**Chức năng:**
- Lấy snapshot mới nhất cho parent expense
- Filter theo parent_id và table_name
- Trả về snapshot data hoặc None

### 3. **restore_parent_from_snapshot()**
```python
async def restore_parent_from_snapshot(
    self, 
    parent_id: str, 
    table_name: str
) -> bool
```

**Chức năng:**
- Khôi phục parent expense từ snapshot
- Update các field quan trọng
- Trả về success/failure

### 4. **get_restore_history()**
```python
async def get_restore_history(
    self, 
    parent_id: str, 
    table_name: str
) -> List[Dict[str, Any]]
```

**Chức năng:**
- Lấy lịch sử snapshot cho parent expense
- Bao gồm trạng thái restore
- Sắp xếp theo thời gian tạo

## Tích hợp vào API

### 1. **Expenses API** (`backend/routers/expenses.py`)
```python
# Trong create_expense()
if expense_dict.get('id_parent'):
    auto_snapshot_service = AutoSnapshotService()
    await auto_snapshot_service.create_auto_snapshot_for_child(
        created_expense, 
        'expenses',
        current_user.id
    )
```

### 2. **Project Expenses API** (`backend/routers/project_expenses.py`)
```python
# Trong create_project_expense()
if expense.get('id_parent'):
    auto_snapshot_service = AutoSnapshotService()
    await auto_snapshot_service.create_auto_snapshot_for_child(
        created_expense, 
        'project_expenses',
        current_user.id
    )
```

### 3. **Project Quotes API**
```python
# Trong create_project_expense_quote()
if quote.get('id_parent'):
    auto_snapshot_service = AutoSnapshotService()
    await auto_snapshot_service.create_auto_snapshot_for_child(
        created_quote, 
        'project_expenses_quote',
        current_user.id
    )
```

## Lợi ích của Backend Implementation

### 1. **Tính ổn định**
- Không phụ thuộc database triggers
- Dễ debug và troubleshoot
- Error handling tốt hơn

### 2. **Linh hoạt**
- Có thể customize logic
- Dễ test và mock
- Có thể disable/enable

### 3. **Performance**
- Không block database operations
- Async processing
- Graceful error handling

### 4. **Maintainability**
- Code rõ ràng và dễ hiểu
- Centralized logic
- Easy to extend

## Error Handling

### 1. **Auto Snapshot Errors**
```python
try:
    await auto_snapshot_service.create_auto_snapshot_for_child(...)
except Exception as e:
    print(f"Warning: Failed to create auto-snapshot: {e}")
    # Không ảnh hưởng đến việc tạo chi phí
```

### 2. **Restore Errors**
```python
try:
    success = await auto_snapshot_service.restore_parent_from_snapshot(...)
    if not success:
        raise HTTPException(status_code=404, detail="No snapshot found")
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
```

## Testing

### 1. **Unit Tests**
```python
# Test auto snapshot creation
async def test_create_auto_snapshot():
    service = AutoSnapshotService()
    result = await service.create_auto_snapshot_for_child(
        child_expense, 'expenses', 'user_id'
    )
    assert result is not None
```

### 2. **Integration Tests**
```python
# Test API endpoints
async def test_create_expense_with_snapshot():
    response = await client.post("/api/expenses", json=expense_data)
    assert response.status_code == 200
    # Check snapshot was created
```

## Monitoring

### 1. **Logs**
```python
print(f"✅ Auto-snapshot created: {snapshot_name}")
print(f"❌ Error creating auto-snapshot: {e}")
print(f"Warning: Failed to create auto-snapshot: {e}")
```

### 2. **Metrics**
- Số lượng auto snapshots tạo
- Tỷ lệ thành công/thất bại
- Thời gian xử lý

## Troubleshooting

### 1. **Snapshot không được tạo**
- Kiểm tra `id_parent` có tồn tại không
- Kiểm tra parent expense có tồn tại không
- Kiểm tra logs để xem lỗi

### 2. **Restore không hoạt động**
- Kiểm tra snapshot có tồn tại không
- Kiểm tra parent_id có đúng không
- Kiểm tra quyền ghi database

### 3. **Performance issues**
- Kiểm tra database connection
- Kiểm tra async/await usage
- Monitor memory usage

## Kết luận

Backend implementation của auto snapshot:
- **Ổn định hơn** so với database triggers
- **Dễ debug** và maintain
- **Linh hoạt** trong customization
- **Performance tốt** với async processing
- **Error handling** graceful
