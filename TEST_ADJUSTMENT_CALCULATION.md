# Test Tính Toán Điều Chỉnh: Diện tích 8.4 → 16.8 m²

## Thông tin đầu vào
- **Diện tích cũ**: 8.4 m²
- **Diện tích mới**: 16.8 m²
- **Vật tư**: Nhôm Xingfa Quảng đông

## Tính toán thay đổi

### 1. Tính thay đổi tuyệt đối
```
changeAbsolute = 16.8 - 8.4 = 8.4 m²
```

### 2. Tính thay đổi phần trăm
```
changePercentage = ((16.8 - 8.4) / 8.4) * 100 = (8.4 / 8.4) * 100 = 100%
```

### 3. Xác định hướng thay đổi
```
changeDirection = 'increase' (vì 16.8 > 8.4)
```

## Kịch bản test với các quy tắc khác nhau

### Kịch bản 1: Quy tắc tăng theo tỷ lệ (ví dụ: diện tích tăng 100% → vật tư tăng 100%)

**Quy tắc giả định:**
- `dimension_type`: 'area'
- `change_type`: 'percentage'
- `change_value`: 10 (ngưỡng 10%)
- `change_direction`: 'increase'
- `adjustment_type`: 'percentage'
- `adjustment_value`: 100 (tăng 100%)

**Kiểm tra quy tắc áp dụng:**
```javascript
changePercentage = 100%
changeAbsolute = 8.4 m²
changeDirection = 'increase'

// Kiểm tra ngưỡng
|changePercentage| >= |change_value| → |100| >= |10| → TRUE ✅

// Kiểm tra hướng
rule.change_direction === 'increase' → TRUE ✅

// Quy tắc ÁP DỤNG
```

**Tính toán điều chỉnh:**
```javascript
// Giả sử số lượng ban đầu: 10 m
originalQuantity = 10

// Áp dụng điều chỉnh
adjustmentValue = 100
adjustmentFactor = 1 + (100 / 100) = 1 + 1 = 2
adjustedQuantity = 10 * 2 = 20 m

// Kết quả: Tăng gấp đôi (100%)
```

### Kịch bản 2: Quy tắc tăng theo tỷ lệ nhỏ hơn (ví dụ: diện tích tăng 100% → vật tư tăng 50%)

**Quy tắc giả định:**
- `adjustment_value`: 50 (tăng 50%)

**Tính toán:**
```javascript
originalQuantity = 10
adjustmentFactor = 1 + (50 / 100) = 1.5
adjustedQuantity = 10 * 1.5 = 15 m

// Kết quả: Tăng 50%
```

### Kịch bản 3: Quy tắc tăng tuyệt đối (ví dụ: diện tích tăng ≥ 8 m² → vật tư tăng 5 m)

**Quy tắc giả định:**
- `change_type`: 'absolute'
- `change_value`: 8 (ngưỡng 8 m²)
- `adjustment_type`: 'absolute'
- `adjustment_value`: 5 (tăng 5 m)

**Kiểm tra quy tắc áp dụng:**
```javascript
|changeAbsolute| >= |change_value| → |8.4| >= |8| → TRUE ✅
changeDirection === 'increase' → TRUE ✅

// Quy tắc ÁP DỤNG
```

**Tính toán:**
```javascript
originalQuantity = 10
adjustedQuantity = 10 + 5 = 15 m

// Kết quả: Tăng 5 m
```

## Vấn đề phát hiện trong logic hiện tại

### 1. Logic trong code (dòng 943-945)
```typescript
const changePercentage = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0
const changeAbsolute = newValue - oldValue
const changeDirection = changeAbsolute > 0 ? 'increase' : 'decrease'
```

**✅ Logic này ĐÚNG cho trường hợp:**
- oldValue = 8.4, newValue = 16.8
- changePercentage = ((16.8 - 8.4) / 8.4) * 100 = 100% ✅
- changeAbsolute = 8.4 ✅
- changeDirection = 'increase' ✅

### 2. Kiểm tra quy tắc áp dụng (dòng 829-833)
```typescript
if (rule.change_type === 'percentage') {
  return Math.abs(changePercentage) >= Math.abs(rule.change_value)
} else if (rule.change_type === 'absolute') {
  return Math.abs(changeAbsolute) >= Math.abs(rule.change_value)
}
```

**✅ Logic này ĐÚNG:**
- Nếu rule có `change_value = 10` (10%), thì |100| >= |10| → TRUE ✅
- Nếu rule có `change_value = 8` (8 m²), thì |8.4| >= |8| → TRUE ✅

### 3. Áp dụng điều chỉnh (dòng 844-846)
```typescript
if (rule.adjustment_type === 'percentage') {
  const adjustmentFactor = 1 + (adjustmentValue / 100)
  return adjustedQuantity * adjustmentFactor
}
```

**✅ Logic này ĐÚNG:**
- Nếu `adjustment_value = 100`, thì factor = 1 + (100/100) = 2
- adjustedQuantity = originalQuantity * 2 ✅

## Kết luận

### Logic hiện tại ĐÚNG cho trường hợp:
- Diện tích tăng từ 8.4 → 16.8 (tăng 100%)
- Nhôm Xingfa Quảng đông sẽ tăng theo quy tắc được định nghĩa

### Ví dụ kết quả:
- **Nếu quy tắc**: Diện tích tăng 100% → Vật tư tăng 100%
  - Số lượng ban đầu: 10 m
  - Số lượng sau điều chỉnh: 20 m ✅

- **Nếu quy tắc**: Diện tích tăng 100% → Vật tư tăng 50%
  - Số lượng ban đầu: 10 m
  - Số lượng sau điều chỉnh: 15 m ✅

### Lưu ý:
1. Cần kiểm tra quy tắc cụ thể trong database cho "Nhôm Xingfa Quảng đông"
2. Nếu có nhiều quy tắc, chúng sẽ được áp dụng tuần tự và stack (cộng dồn)
3. Cần kiểm tra max limit nếu có

## Đề xuất test thực tế

1. Kiểm tra quy tắc trong database cho expense_object_id của "Nhôm Xingfa Quảng đông"
2. Chạy test với dữ liệu thực tế
3. So sánh kết quả với mong đợi

