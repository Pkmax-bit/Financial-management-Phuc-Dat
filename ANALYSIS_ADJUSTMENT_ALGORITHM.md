# Phân tích Logic Thuật Toán Áp Dụng Quy Tắc Điều Chỉnh Vật Tư

## Tổng quan
Thuật toán áp dụng quy tắc điều chỉnh vật tư dựa trên thay đổi kích thước (area, volume, height, length, depth, quantity) của sản phẩm trong báo giá.

## Luồng xử lý chính

### 1. Tính toán thay đổi
```typescript
const changePercentage = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0
const changeAbsolute = newValue - oldValue
const changeDirection = changeAbsolute > 0 ? 'increase' : 'decrease'
```

**Lưu ý**: 
- `oldValue` là baseline (cho area/volume) hoặc giá trị trước đó (cho các dimension khác)
- Tính toán dựa trên baseline đảm bảo mỗi sản phẩm tính toán độc lập

### 2. Kiểm tra quy tắc áp dụng (`checkRuleApplicable`)

**Logic kiểm tra:**
1. **Inverse Rule**: Nếu `change_direction === 'decrease'` và `adjustment_value < 0`
   - Áp dụng khi dimension TĂNG (ngược lại với change_direction)
   - VD: Diện tích tăng → Vật tư giảm

2. **Normal Rule**: Kiểm tra `change_direction` khớp với rule
   - `'increase'`, `'decrease'`, hoặc `'both'`

3. **Kiểm tra ngưỡng (threshold)**:
   - `change_type === 'percentage'`: `|changePercentage| >= |change_value|`
   - `change_type === 'absolute'`: `|changeAbsolute| >= |change_value|`

**Vấn đề tiềm ẩn:**
- Logic inverse rule có thể gây nhầm lẫn
- Cần kiểm tra kỹ logic này

### 3. Áp dụng điều chỉnh (`applyRuleAdjustment`)

**Các loại điều chỉnh:**

#### a. Percentage Adjustment:
```typescript
const adjustmentFactor = 1 + (adjustmentValue / 100)
adjustedQuantity = adjustedQuantity * adjustmentFactor
```

**Ví dụ:**
- `adjustment_value = 10` → tăng 10%
- `adjustment_value = -5` → giảm 5%

#### b. Absolute Adjustment:
```typescript
adjustedQuantity = adjustedQuantity + adjustmentValue
```

**Vấn đề tiềm ẩn:**
- Các quy tắc được áp dụng tuần tự và STACK (cộng dồn)
- Có thể dẫn đến kết quả không mong muốn nếu nhiều quy tắc cùng áp dụng

### 4. Giới hạn tối đa (Max Limit)

#### a. Max Adjustment Percentage (cho percentage rules):
```typescript
const adjustmentFromOriginal = ((adjustedQuantity - originalQuantity) / originalQuantity) * 100
const newAdjustmentFromOriginal = ((newAdjustedQuantity - originalQuantity) / originalQuantity) * 100
```

**Logic:**
- Tính tổng điều chỉnh từ giá trị gốc (originalQuantity)
- Nếu vượt quá max, giới hạn lại

**Vấn đề:**
1. **Dòng 1005-1006**: Tính `adjustmentFromOriginal` từ `adjustedQuantity` (đã bị điều chỉnh bởi rules trước) thay vì từ `originalQuantity`
   - Nên sửa thành: `((adjustedQuantity - originalQuantity) / originalQuantity) * 100` ✅ (đã đúng)
   - Nhưng `adjustedQuantity` đã được cập nhật bởi rules trước, nên công thức này đúng

2. **Dòng 1030**: Tính `totalAdjustmentPercentage` nhưng không dùng để kiểm tra max limit tổng thể
   - Chỉ kiểm tra từng rule, không kiểm tra tổng các rules

3. **Logic giới hạn:**
   - Dòng 1013: Kiểm tra `Math.abs(newAdjustmentFromOriginal) > maxAdjustmentPercentage`
   - Nhưng nếu có nhiều rules, có thể vượt quá max sau khi áp dụng tất cả

#### b. Max Adjustment Value (cho absolute rules):
```typescript
const currentAdjustment = Math.abs(newAdjustedQuantity - originalQuantity)
if (currentAdjustment > Math.abs(maxAdjustmentValue)) {
  newAdjustedQuantity = originalQuantity + (maxAdjustmentValue > 0 ? Math.abs(maxAdjustmentValue) : -Math.abs(maxAdjustmentValue))
}
```

**Vấn đề:**
- Chỉ kiểm tra từng rule, không kiểm tra tổng các rules

### 5. Sắp xếp theo Priority

```typescript
applicableRules.sort((a: any, b: any) => a.priority - b.priority)
```

- Rules có priority thấp hơn được áp dụng trước
- Các rules có thể stack (cộng dồn)

## Vấn đề tiềm ẩn

### 1. **Stacking Rules có thể gây sai số**
- Nếu có nhiều rules cùng áp dụng, kết quả có thể không chính xác
- Ví dụ: Rule 1 tăng 10%, Rule 2 tăng 5% → Tổng tăng 15.5% (không phải 15%)

### 2. **Max Limit không chính xác**
- Chỉ kiểm tra từng rule riêng lẻ
- Không kiểm tra tổng điều chỉnh sau khi áp dụng tất cả rules
- Có thể vượt quá max limit sau khi áp dụng tất cả

### 3. **Inverse Rule Logic phức tạp**
- Logic inverse rule có thể gây nhầm lẫn
- Cần kiểm tra kỹ trường hợp này

### 4. **Tính toán adjustmentPercentageApplied**
- Dòng 995: `adjustmentPercentageApplied = ((newAdjustedQuantity - adjustedQuantity) / adjustedQuantity) * 100`
- Đây là phần trăm thay đổi từ giá trị đã điều chỉnh trước đó, không phải từ original
- Có thể gây nhầm lẫn khi hiển thị

## Đề xuất cải thiện

### 1. **Kiểm tra Max Limit tổng thể**
- Sau khi áp dụng tất cả rules, kiểm tra tổng điều chỉnh
- Nếu vượt quá max, điều chỉnh lại

### 2. **Lưu trữ originalQuantity**
- Đảm bảo luôn so sánh với giá trị gốc ban đầu
- Không bị ảnh hưởng bởi các rules trước đó

### 3. **Tách biệt logic Inverse Rule**
- Tạo rule riêng cho inverse case
- Hoặc làm rõ logic trong code

### 4. **Cải thiện logging**
- Log chi tiết từng bước áp dụng
- Dễ debug khi có vấn đề

## Kết luận

Logic thuật toán nhìn chung đúng, nhưng có một số điểm cần cải thiện:
1. Kiểm tra max limit tổng thể sau khi áp dụng tất cả rules
2. Làm rõ logic inverse rule
3. Cải thiện tính toán adjustment percentage
4. Thêm validation để tránh kết quả không hợp lý

