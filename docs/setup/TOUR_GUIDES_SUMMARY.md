# Bảng Tổng Hợp Tất Cả Các Tour Hướng Dẫn

## Tổng Quan
Bảng này liệt kê tất cả các tour hướng dẫn trong ứng dụng, bao gồm thông tin về auto-start, localStorage, và nút manual.

---

## Bảng Chi Tiết

| STT | Tên Tour | Trang/Component | Storage Key | Auto-Start | Điều Kiện Auto-Start | Nút Manual | Ghi Chú |
|-----|----------|----------------|-------------|------------|---------------------|------------|---------|
| 1 | **Customers Page Tour** | `/app/customers/page.tsx` | `customers-page-tour-status-v1` | ❌ **KHÔNG** | - | ✅ Có | Tour hướng dẫn trang quản lý khách hàng |
| 2 | **Customer Form Tour** | `/app/customers/page.tsx` (Modal) | `customer-form-tour-status-v1` | ❌ **KHÔNG** | - | ✅ Có | Tour hướng dẫn form tạo khách hàng |
| 3 | **Projects Page Tour** | `/app/projects/page.tsx` | `projects-page-tour-status-v1` | ✅ **CÓ** | Khi trang load lần đầu (chưa có trong localStorage) | ✅ Có | Tour hướng dẫn trang quản lý dự án |
| 4 | **Customer View Tour** | `/app/customer-view/page.tsx` | `customer-view-tour-status-v1` | ✅ **CÓ** | Khi có khách hàng và chưa xem tour | ✅ Có | Tour hướng dẫn xem chi tiết khách hàng |
| 5 | **Quote Form Tour** | `CreateQuoteSidebarFullscreen.tsx` | `quote-form-tour-status-v1` | ✅ **CÓ** | Khi mở form tạo báo giá lần đầu | ✅ Có | Tour hướng dẫn tạo báo giá |
| 6 | **Invoice Form Tour** | `CreateInvoiceSidebarFullscreen.tsx` | `invoice-form-tour-status-v1` | ✅ **CÓ** | Khi mở form tạo hóa đơn lần đầu | ✅ Có | Tour hướng dẫn tạo hóa đơn |
| 7 | **Quote Convert Tour** | `QuotesTab.tsx` | `quote-convert-tour-status-v1` | ✅ **CÓ** | Khi có báo giá đã accepted/sent/viewed và chưa xem tour | ✅ Có | Tour hướng dẫn chuyển báo giá sang hóa đơn |
| 8 | **Email Form Tour** | `QuoteEmailPreviewModal.tsx` | `email-form-tour-status-v1` | ✅ **CÓ** | Khi mở modal gửi email lần đầu | ✅ Có | Tour hướng dẫn gửi email báo giá |
| 9 | **Product Form Tour** | `ProductCreateForm.tsx` | `product-form-tour-status-v1` | ✅ **CÓ** | Khi form được render lần đầu | ✅ Có | Tour hướng dẫn tạo sản phẩm |
| 10 | **Rule Form Tour** | `MaterialAdjustmentRulesTab.tsx` | `rule-form-tour-status-v1` | ✅ **CÓ** | Khi component được render lần đầu | ✅ Có | Tour hướng dẫn quy tắc điều chỉnh vật tư |
| 11 | **Approve Expense Tour** | `ProjectExpensesTab.tsx` | `approve-expense-tour-status-v1` | ✅ **CÓ** | Khi có chi phí planned pending và chưa xem tour | ✅ Có | Tour hướng dẫn duyệt chi phí |
| 12 | **Planned Expense Tour** | `CreateProjectExpenseDialog.tsx` | `planned-expense-tour-status-v1` | ✅ **CÓ** | Khi mở dialog tạo chi phí kế hoạch lần đầu | ✅ Có | Tour hướng dẫn tạo chi phí kế hoạch |
| 13 | **Actual Expense Tour** | `CreateProjectExpenseDialog.tsx` | `actual-expense-tour-status-v1` | ✅ **CÓ** | Khi mở dialog tạo chi phí thực tế lần đầu | ✅ Có | Tour hướng dẫn tạo chi phí thực tế |
| 14 | **Report List Tour** | `/app/reports/projects-detailed/page.tsx` | `report-list-tour-status-v1` | ✅ **CÓ** | Khi trang load và chưa xem tour | ✅ Có | Tour hướng dẫn danh sách báo cáo |
| 15 | **Report Detail Tour** | `/app/reports/projects-detailed/[projectId]/page.tsx` | `report-detail-tour-status-v1` | ✅ **CÓ** | Khi có project và chưa xem tour | ✅ Có | Tour hướng dẫn chi tiết báo cáo |

---

## Tóm Tắt

### Tổng Số Tour: **15**

### Phân Loại Theo Auto-Start:
- ✅ **Có Auto-Start**: 13 tour
- ❌ **Không Auto-Start**: 2 tour (Customers Page, Customer Form)

### Phân Loại Theo Component:
- **Trang chính (Pages)**: 4 tour
- **Form/Dialog**: 7 tour
- **Tab/Component**: 4 tour

### Đặc Điểm Chung:
- ✅ Tất cả tour đều có **localStorage** để lưu trạng thái đã xem
- ✅ Tất cả tour đều có **nút manual** để mở lại
- ✅ Tất cả tour đều kiểm tra localStorage trước khi auto-start
- ✅ Tất cả tour đều lưu "completed" vào localStorage khi hoàn thành

---

## Chi Tiết Điều Kiện Auto-Start

### 1. Projects Page Tour
- **Điều kiện**: Trang load lần đầu, chưa có trong localStorage
- **Code**: `if (!storedStatus) { startProjectsTour({ auto: true }) }`

### 2. Customer View Tour
- **Điều kiện**: Có khách hàng trong danh sách, chưa xem tour
- **Code**: `if (!storedStatus && filteredCustomers.length > 0) { startCustomerViewTour({ auto: true }) }`

### 3. Quote Form Tour
- **Điều kiện**: Form mở lần đầu (isOpen = true), chưa xem tour
- **Code**: `if (!storedStatus && isOpen) { startQuoteTour() }`

### 4. Invoice Form Tour
- **Điều kiện**: Form mở lần đầu (isOpen = true), chưa xem tour
- **Code**: `if (!storedStatus && isOpen) { startInvoiceTour() }`

### 5. Quote Convert Tour
- **Điều kiện**: Có báo giá với status accepted/sent/viewed, chưa xem tour
- **Code**: `if (!storedStatus && hasConvertibleQuote) { startConvertTour() }`

### 6. Email Form Tour
- **Điều kiện**: Modal mở lần đầu (isOpen = true), chưa xem tour
- **Code**: `if (!storedStatus && isOpen) { startEmailTour() }`

### 7. Product Form Tour
- **Điều kiện**: Form được render lần đầu, chưa xem tour
- **Code**: `if (!storedStatus) { startProductTour() }`

### 8. Rule Form Tour
- **Điều kiện**: Component render lần đầu, không loading, chưa xem tour
- **Code**: `if (!storedStatus && !loading) { startRuleTour() }`

### 9. Approve Expense Tour
- **Điều kiện**: Có chi phí planned với status pending, chưa xem tour
- **Code**: `if (!storedStatus && hasPendingPlannedExpense) { startApproveExpenseTour() }`

### 10. Planned Expense Tour
- **Điều kiện**: Dialog mở với category = 'planned', chưa xem tour
- **Code**: `if (!storedStatus && category === 'planned' && isOpen) { startPlannedExpenseTour() }`

### 11. Actual Expense Tour
- **Điều kiện**: Dialog mở với category = 'actual', chưa xem tour
- **Code**: `if (!storedStatus && category === 'actual' && isOpen) { startActualExpenseTour() }`

### 12. Report List Tour
- **Điều kiện**: Trang load, không loading, chưa xem tour
- **Code**: `if (!hasCompletedTour && !loading) { startReportListTour() }`

### 13. Report Detail Tour
- **Điều kiện**: Có project, không loading, chưa xem tour
- **Code**: `if (!hasCompletedTour && !loading && project) { startReportDetailTour() }`

---

## Lưu Ý

1. **Customers Page Tour** và **Customer Form Tour** không có auto-start, chỉ có nút manual
2. Tất cả các tour khác đều có auto-start với điều kiện cụ thể
3. Tất cả tour đều sử dụng localStorage để lưu trạng thái "completed"
4. Tất cả tour đều có nút để mở lại tour bất cứ lúc nào

---

## Cách Reset Tour

Để reset tour và xem lại, xóa key trong localStorage:
```javascript
// Ví dụ: Reset Quote Form Tour
localStorage.removeItem('quote-form-tour-status-v1')
```

Hoặc reset tất cả tour:
```javascript
// Reset tất cả tour
localStorage.removeItem('quote-form-tour-status-v1')
localStorage.removeItem('invoice-form-tour-status-v1')
localStorage.removeItem('quote-convert-tour-status-v1')
// ... và các tour khác
```


