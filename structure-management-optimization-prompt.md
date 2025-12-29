# 🚀 PROMPT: TỐI ƯU HÓA HỆ THỐNG QUẢN LÝ CẤU TRÚC SẢN PHẨM

## 🎯 MỤC TIÊU
Tạo một hệ thống quản lý cấu trúc sản phẩm thông minh, tối ưu và dễ sử dụng cho việc đặt tên sản phẩm tự động.

## 📋 YÊU CẦU HIỆN TẠI

### 🔍 **Vấn đề hiện tại:**
- Dropdown danh mục chính không hiển thị dữ liệu
- Logic chọn cột phức tạp và khó hiểu
- Giao diện chưa tối ưu cho UX
- Thiếu validation và feedback rõ ràng

### ✅ **Yêu cầu cần thực hiện:**
1. **Sửa dropdown danh mục chính** - Hiển thị đúng các danh mục có `is_primary = true`
2. **Đơn giản hóa logic chọn cột** - Tập trung vào danh mục chính + các thuộc tính bổ sung
3. **Cải thiện UX/UI** - Giao diện trực quan, dễ hiểu
4. **Thêm validation thông minh** - Hướng dẫn người dùng từng bước

---

## 🏗️ KIẾN TRÚC HỆ THỐNG MONG MUỐN

### 📊 **Luồng hoạt động:**
```
1. CHỌN DANH MỤC CHÍNH → 2. CHỌN THUỘC TÍNH BỔ SUNG → 3. XẾP THỨ TỰ → 4. XEM TRƯỚC → 5. LƯU
```

### 🎨 **Giao diện mong muốn:**
```
┌─────────────────────────────────────────────────────────┐
│  🏷️ TẠO CẤU TRÚC SẢN PHẨM MỚI                          │
├─────────────────────────────────────────────────────────┤
│  📂 DANH MỤC CHÍNH (bắt buộc)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ▾ Loại tủ bếp ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔧 THUỘC TÍNH BỔ SUNG (tùy chọn)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ◉ Loại nhôm         ◉ Loại tay nắm              │   │
│  │ ◉ Loại kính         ◯ Bộ phận                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📋 XẾP THỨ TỰ CẤU TRÚC                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Loại tủ bếp ─── 2. Loại nhôm ─── 3. Loại tay│   │
│  │    ↕️ Kéo thả để sắp xếp                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👀 XEM TRƯỚC KẾT QUẢ                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📦 Tên sản phẩm: Loại tủ bếp - Loại nhôm - Loại │   │
│  │                    tay nắm - Loại kính           │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│          [🔄 Đặt lại]              [💾 Lưu cấu trúc]    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 CHI TIẾT IMPLEMENTATION

### 1. **DATA FLOW & STATE MANAGEMENT**

```typescript
interface StructureWizardState {
  step: 1 | 2 | 3 | 4; // Current step in the wizard
  mainCategory: string | null; // Selected main category ID
  selectedAttributes: string[]; // Selected attribute column IDs
  structureOrder: string[]; // Ordered list of columns for naming
  separator: string; // Separator between parts
  preview: string; // Generated preview name
  validation: ValidationState; // Form validation state
}

interface ValidationState {
  mainCategory: boolean;
  hasAttributes: boolean;
  validStructure: boolean;
  errors: string[];
}
```

### 2. **SMART CATEGORY FILTERING**

```typescript
// Filter logic for main categories
const getMainCategories = (categories: CustomProductCategory[]) => {
  return categories.filter(cat =>
    cat.is_primary === true ||
    cat.is_primary === "true" ||
    cat.name.toLowerCase().includes('chính') ||
    cat.description?.toLowerCase().includes('main')
  );
};

// Filter logic for supplementary attributes
const getSupplementaryAttributes = (
  allColumns: Record<string, CustomProductColumn[]>,
  mainCategoryId: string
) => {
  return Object.entries(allColumns)
    .filter(([catId]) => catId !== mainCategoryId)
    .flatMap(([catId, columns]) => columns);
};
```

### 3. **DRAG & DROP FUNCTIONALITY**

```typescript
// Drag and drop for reordering structure
const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return;

  const items = Array.from(structureOrder);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);

  setStructureOrder(items);
  updatePreview(items);
};
```

### 4. **INTELLIGENT PREVIEW GENERATION**

```typescript
const generateSmartPreview = (
  mainCategory: CustomProductCategory,
  attributes: CustomProductColumn[],
  separator: string
): string => {
  // Get first option from each attribute for preview
  const parts = [mainCategory.name];

  attributes.forEach(attr => {
    const firstOption = getFirstOptionForColumn(attr.id);
    if (firstOption) {
      parts.push(firstOption.name);
    }
  });

  return parts.join(separator);
};
```

### 5. **VALIDATION & ERROR HANDLING**

```typescript
const validateStructure = (): ValidationState => {
  const errors: string[] = [];

  if (!mainCategory) {
    errors.push("Vui lòng chọn danh mục chính");
  }

  if (structureOrder.length === 0) {
    errors.push("Vui lòng chọn ít nhất một thuộc tính");
  }

  if (!structureOrder.includes(mainCategory!)) {
    errors.push("Danh mục chính phải được bao gồm trong cấu trúc");
  }

  return {
    mainCategory: !!mainCategory,
    hasAttributes: structureOrder.length > 0,
    validStructure: errors.length === 0,
    errors
  };
};
```

---

## 🎭 USER EXPERIENCE ENHANCEMENTS

### **Progressive Disclosure**
- **Step 1**: Chỉ hiển thị danh mục chính
- **Step 2**: Hiển thị thuộc tính bổ sung sau khi chọn danh mục chính
- **Step 3**: Hiển thị tùy chọn sắp xếp sau khi chọn thuộc tính
- **Step 4**: Hiển thị preview và lưu

### **Smart Defaults**
- Tự động thêm danh mục chính vào đầu cấu trúc
- Đề xuất thứ tự hợp lý dựa trên loại sản phẩm
- Separator mặc định là " - "

### **Visual Feedback**
- Highlight danh mục chính với màu khác biệt
- Animation khi thêm/xóa thuộc tính
- Real-time preview updates
- Progress indicator cho từng bước

### **Accessibility**
- Keyboard navigation cho drag & drop
- Screen reader support
- High contrast mode
- Focus management

---

## 🔗 INTEGRATION POINTS

### **Backend API Endpoints**
```
GET  /api/custom-products/categories?is_primary=true
GET  /api/custom-products/categories/{id}/columns
POST /api/custom-products/structures
PUT  /api/custom-products/structures/{id}
```

### **Database Schema Updates**
```sql
-- Ensure is_primary column exists and is properly indexed
ALTER TABLE custom_product_categories
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_is_primary
ON custom_product_categories(is_primary) WHERE is_active = true;
```

### **Related Components**
- `StructureList` - Hiển thị danh sách cấu trúc đã tạo
- `StructurePreview` - Component preview chi tiết
- `CategoryManager` - Quản lý danh mục và cột

---

## 📈 PERFORMANCE OPTIMIZATIONS

### **Lazy Loading**
- Load categories on demand
- Load column options only when needed
- Virtual scrolling for large lists

### **Caching Strategy**
- Cache category data for 5 minutes
- Cache column options for session
- Invalidate cache on data changes

### **Debounced Updates**
- Debounce preview generation
- Debounce validation checks
- Debounce API calls

---

## 🧪 TESTING SCENARIOS

### **Happy Path**
1. User selects main category → Attributes appear
2. User selects attributes → Reorder interface shows
3. User reorders → Preview updates in real-time
4. User saves → Success message and redirect

### **Edge Cases**
1. No main categories available → Show helpful message
2. Category has no columns → Disable selection
3. Network error → Retry with exponential backoff
4. Invalid structure → Clear validation messages

### **Accessibility Testing**
1. Keyboard-only navigation
2. Screen reader compatibility
3. High contrast mode
4. Mobile responsiveness

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Backend: Update API to filter primary categories
- [ ] Database: Ensure is_primary column exists
- [ ] Frontend: Implement new StructureWizard component
- [ ] Testing: Unit tests for all new functions
- [ ] E2E: Test complete user flows
- [ ] Performance: Load testing for category/column loading
- [ ] Documentation: Update user guides

---

## 💡 FUTURE ENHANCEMENTS

1. **AI-Powered Suggestions**: Đề xuất cấu trúc dựa trên sản phẩm tương tự
2. **Template System**: Lưu và tái sử dụng cấu trúc mẫu
3. **Bulk Operations**: Tạo nhiều cấu trúc cùng lúc
4. **Analytics**: Theo dõi việc sử dụng cấu trúc
5. **Import/Export**: Xuất cấu trúc ra file Excel/CSV

---

*Prompt này được tạo để hướng dẫn việc phát triển một hệ thống quản lý cấu trúc sản phẩm tối ưu, tập trung vào trải nghiệm người dùng và hiệu suất.*






