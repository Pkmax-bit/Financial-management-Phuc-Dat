# Code Review: Tạo PDF và Gửi Email Báo Giá

## Tổng quan

Hệ thống hỗ trợ 2 cách tạo PDF và gửi email báo giá:
1. **Frontend**: Tạo PDF từ HTML preview sử dụng `html2canvas` + `jsPDF`
2. **Backend**: Tạo PDF từ HTML sử dụng `WeasyPrint` hoặc `xhtml2pdf`, gửi kèm email

---

## 1. Frontend - Tạo PDF (QuoteEmailPreviewModal.tsx)

### 1.1. Vị trí Code
```928:1258:frontend/src/components/sales/QuoteEmailPreviewModal.tsx
const handleDownloadPDF = async () => {
  // ... PDF generation logic
}
```

### 1.2. Quy trình hoạt động

#### Bước 1: Chuẩn bị HTML
- Lấy HTML từ `htmlContent` (đã được generate từ backend hoặc custom)
- Tối ưu hóa HTML cho PDF:
  - Giảm padding trong table cells (8px → 3px 4px)
  - Giảm font size (12px → 9pt)
  - Giảm margins (20px → 10px)
  - Tối ưu line-height (1.8 → 1.4)

#### Bước 2: Render HTML
- Tạo temporary container với:
  - Width: 210mm (A4)
  - Font: Arial, Times New Roman, DejaVu Sans (hỗ trợ tiếng Việt)
  - Background: white
- Thêm CSS inline để compact hóa bảng
- Đợi images load (timeout 5s)

#### Bước 3: Convert HTML → Canvas
- Sử dụng `html2canvas`:
  - Scale: 1.5 (cân bằng chất lượng và kích thước)
  - Window size: 794x1123px (A4 @ 96 DPI)
  - Background: white

#### Bước 4: Canvas → PDF
- Sử dụng `jsPDF`:
  - Format: A4 (210mm x 297mm)
  - Orientation: portrait
- Xử lý multi-page nếu content > 1 trang
- Tên file: `Bao-gia-{project-name-sanitized}-{project-id}.pdf`

#### Bước 5: Cập nhật trạng thái
- Sau khi download thành công, cập nhật quote status → "sent"
- Hiển thị thông báo thành công

### 1.3. Điểm mạnh
✅ Tối ưu hóa HTML cho PDF (compact, giảm font size)
✅ Hỗ trợ multi-page tự động
✅ Tên file có ý nghĩa (project name + ID)
✅ Xử lý images loading với timeout
✅ Tự động cập nhật trạng thái sau khi download

### 1.4. Điểm cần cải thiện
⚠️ **Performance**: `html2canvas` có thể chậm với HTML lớn
⚠️ **Chất lượng**: PDF từ canvas có thể mất chất lượng so với HTML trực tiếp
⚠️ **Font**: Phụ thuộc vào fonts có sẵn trên client
⚠️ **Error handling**: Cần xử lý lỗi tốt hơn khi canvas generation fail

---

## 2. Backend - Tạo PDF và Gửi Email (email_service.py)

### 2.1. Vị trí Code
```280:298:backend/services/email_service.py
def _html_to_pdf_bytes(self, html: str) -> bytes | None:
    """Best-effort HTML→PDF conversion. Tries WeasyPrint, then xhtml2pdf. Returns None if unavailable."""
    # Try WeasyPrint
    try:
        from weasyprint import HTML  # type: ignore
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except Exception:
        pass
    # Try xhtml2pdf
    try:
        from xhtml2pdf import pisa  # type: ignore
        import io
        src = io.StringIO(html)
        out = io.BytesIO()
        pisa.CreatePDF(src, dest=out)  # returns pisaStatus, but we can ignore
        return out.getvalue()
    except Exception:
        return None
```

### 2.2. Quy trình tạo PDF

#### Ưu tiên 1: WeasyPrint
- **Ưu điểm**: 
  - Chất lượng cao, hỗ trợ CSS tốt
  - Render chính xác HTML/CSS
- **Nhược điểm**: 
  - Cần cài đặt dependencies (cairo, pango, etc.)
  - Có thể nặng trên server

#### Ưu tiên 2: xhtml2pdf
- **Ưu điểm**: 
  - Dễ cài đặt (pure Python)
  - Nhẹ hơn WeasyPrint
- **Nhược điểm**: 
  - Hỗ trợ CSS hạn chế
  - Chất lượng thấp hơn WeasyPrint

#### Fallback: None
- Nếu cả 2 đều fail, trả về `None`
- Email vẫn được gửi nhưng không có PDF attachment

### 2.3. Quy trình gửi email

#### Bước 1: Chuẩn bị HTML
```318:667:backend/services/email_service.py
def generate_quote_email_html(...) -> str:
    # Generate HTML với:
    # - Company info (logo, name, address)
    # - Customer info
    # - Quote items table
    # - Payment terms
    # - Bank info
    # - Notes
```

#### Bước 2: Xử lý Logo
- **SMTP**: Attach logo như inline image với Content-ID `cid:company_logo`
- **Resend**: Convert logo thành base64 data URI
- **n8n**: Sử dụng Supabase URL hoặc base64

#### Bước 3: Tạo PDF attachment
```1135:1143:backend/services/email_service.py
# Try attach PDF version of the quote
try:
    pdf_bytes = self._html_to_pdf_bytes(html_body)
    if pdf_bytes:
        pdf_part = MIMEApplication(pdf_bytes, _subtype='pdf')
        pdf_part.add_header('Content-Disposition', 'attachment', filename=f"Bao-gia-{quote_data.get('quote_number','')}.pdf")
        msg.attach(pdf_part)
except Exception:
    pass
```

#### Bước 4: Gửi email
- **SMTP**: Gửi qua SMTP server (Gmail, etc.)
- **Resend**: Gửi qua Resend API (recommended cho production)
- **n8n**: Gửi qua n8n webhook (cho automation)

### 2.4. Điểm mạnh
✅ Hỗ trợ 3 email providers (SMTP, Resend, n8n)
✅ Fallback mechanism (WeasyPrint → xhtml2pdf)
✅ Tự động attach PDF nếu có thể
✅ Xử lý logo linh hoạt (CID, base64, URL)
✅ Background task để không block request

### 2.5. Điểm cần cải thiện
⚠️ **Error handling**: PDF generation fail thì chỉ pass (silent fail)
⚠️ **Dependencies**: WeasyPrint cần system dependencies
⚠️ **Performance**: PDF generation có thể chậm với HTML lớn
⚠️ **Logging**: Thiếu logging khi PDF generation fail

---

## 3. Backend - API Endpoint (sales.py)

### 3.1. Vị trí Code
```1153:1552:backend/routers/sales.py
@router.post("/quotes/{quote_id}/send")
async def send_quote_to_customer(...):
    # Send quote email với customization
```

### 3.2. Quy trình

#### Bước 1: Load customization
- Ưu tiên: `email_customizations` table (active version)
- Fallback: Request body
- Bao gồm:
  - `custom_payment_terms`
  - `additional_notes`
  - `default_notes`
  - `company_info`
  - `bank_info`
  - `raw_html`

#### Bước 2: Generate HTML
- Ưu tiên: `raw_html` từ request/customization
- Fallback: Generate từ template với customization data

#### Bước 3: Gửi email (background task)
```1484:1497:backend/routers/sales.py
background_tasks.add_task(
    email_service.send_quote_email,
    quote_data_with_custom,
    customer_email,
    customer_name,
    quote_items,
    custom_payment_terms,
    additional_notes,
    final_html,
    company_info if company_info else None,
    bank_info if bank_info else None,
    default_notes,
    attachments_list
)
```

#### Bước 4: Lưu email log
- Lưu vào `email_logs` table với:
  - HTML body
  - Custom payment terms
  - Additional notes
  - Metadata

### 3.3. Điểm mạnh
✅ Hỗ trợ customization linh hoạt
✅ Background task không block response
✅ Lưu email log để audit
✅ Priority system cho customization (DB > Request)

### 3.4. Điểm cần cải thiện
⚠️ **Error handling**: Nếu email fail, vẫn trả về success (chỉ log error)
⚠️ **Validation**: Thiếu validation cho customization data
⚠️ **Retry mechanism**: Không có retry khi email fail

---

## 4. Frontend - Gửi Email (QuotesTab.tsx)

### 4.1. Vị trí Code
```227:405:frontend/src/components/sales/QuotesTab.tsx
const confirmSendQuote = async (customData?: {...}) => {
    // Send quote email với customization
}
```

### 4.2. Quy trình

#### Bước 1: Chuẩn bị request body
- Map `customData` → request body:
  - `paymentTerms` → `custom_payment_terms`
  - `additionalNotes` → `additional_notes`
  - `defaultNotes` → `default_notes`
  - `companyName`, `companyShowroom`, etc. → `company_info`
  - `bankAccountName`, etc. → `bank_info`
  - `rawHtml` → `raw_html`
  - `attachments` → `attachments`

#### Bước 2: Gọi API
```326:333:frontend/src/components/sales/QuotesTab.tsx
const response = await fetch(getApiEndpoint(`/api/sales/quotes/${previewQuoteId}/send`), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  },
  body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : '{}'
})
```

#### Bước 3: Xử lý response
- Optimistic update: Cập nhật local state ngay
- Persist to DB: Đảm bảo status được lưu
- Hiển thị thông báo: Success/Error với chi tiết

### 4.3. Điểm mạnh
✅ Optimistic update cho UX tốt
✅ Xử lý customization data đầy đủ
✅ Error handling với thông báo rõ ràng
✅ Loading state khi gửi email

### 4.4. Điểm cần cải thiện
⚠️ **Error recovery**: Nếu API fail, cần rollback optimistic update
⚠️ **Validation**: Thiếu validation cho customization data trước khi gửi
⚠️ **Retry**: Không có retry mechanism

---

## 5. So sánh Frontend vs Backend PDF Generation

| Tiêu chí | Frontend (html2canvas) | Backend (WeasyPrint/xhtml2pdf) |
|----------|----------------------|-------------------------------|
| **Chất lượng** | Trung bình (từ canvas) | Cao (từ HTML trực tiếp) |
| **Performance** | Chậm (client-side) | Nhanh hơn (server-side) |
| **Dependencies** | jsPDF, html2canvas | WeasyPrint/xhtml2pdf |
| **Font support** | Phụ thuộc client | Tốt hơn (server fonts) |
| **Multi-page** | Tự động | Tự động |
| **Error handling** | Tốt | Cần cải thiện |

---

## 6. Recommendations

### 6.1. Cải thiện PDF Generation

#### Backend
1. **Thêm logging**:
```python
try:
    pdf_bytes = self._html_to_pdf_bytes(html_body)
    if pdf_bytes:
        # ... attach PDF
        if self.debug:
            print(f"✅ PDF generated successfully ({len(pdf_bytes)} bytes)")
    else:
        print("⚠️ PDF generation failed: No library available")
except Exception as e:
    print(f"❌ PDF generation error: {e}")
    import traceback
    traceback.print_exc()
```

2. **Thêm retry mechanism**:
```python
def _html_to_pdf_bytes_with_retry(self, html: str, max_retries: int = 2) -> bytes | None:
    for attempt in range(max_retries):
        try:
            pdf_bytes = self._html_to_pdf_bytes(html)
            if pdf_bytes:
                return pdf_bytes
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"❌ PDF generation failed after {max_retries} attempts: {e}")
            else:
                print(f"⚠️ PDF generation attempt {attempt + 1} failed, retrying...")
    return None
```

3. **Validate HTML trước khi generate**:
```python
def _validate_html_for_pdf(self, html: str) -> bool:
    """Validate HTML is suitable for PDF generation"""
    if not html or len(html) < 100:
        return False
    # Check for required elements
    required_tags = ['<html>', '<body>', '<table>']
    return all(tag in html for tag in required_tags)
```

#### Frontend
1. **Thêm progress indicator**:
```typescript
const [pdfProgress, setPdfProgress] = useState(0)

// Trong handleDownloadPDF:
setPdfProgress(25) // HTML prepared
setPdfProgress(50) // Canvas generated
setPdfProgress(75) // PDF created
setPdfProgress(100) // Done
```

2. **Optimize canvas generation**:
```typescript
const canvas = await html2canvas(tempContainer, {
  scale: 1.5,
  useCORS: true,
  logging: false,
  backgroundColor: '#ffffff',
  width: tempContainer.scrollWidth,
  height: tempContainer.scrollHeight,
  windowWidth: 794,
  windowHeight: 1123,
  onclone: (clonedDoc) => {
    // Optimize cloned document for PDF
    const clonedContainer = clonedDoc.querySelector('.email-preview')
    if (clonedContainer) {
      // Remove interactive elements
      const buttons = clonedContainer.querySelectorAll('button')
      buttons.forEach(btn => btn.remove())
    }
  }
})
```

### 6.2. Cải thiện Email Sending

1. **Thêm email queue**:
```python
# Sử dụng Celery hoặc background job queue
@celery.task
def send_quote_email_task(quote_id: str, customization_data: dict):
    # Send email với retry mechanism
    pass
```

2. **Thêm email validation**:
```python
def validate_email_data(self, customer_email: str, html_body: str) -> tuple[bool, str]:
    """Validate email data before sending"""
    if not customer_email or '@' not in customer_email:
        return False, "Invalid email address"
    if not html_body or len(html_body) < 100:
        return False, "Email body is too short"
    return True, ""
```

3. **Thêm email tracking**:
```python
# Track email opens, clicks, etc.
# Sử dụng tracking pixel hoặc email service provider features
```

### 6.3. Cải thiện Error Handling

1. **Backend error response**:
```python
try:
    email_sent = await email_service.send_quote_email(...)
    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please try again."
        )
except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=f"Email sending error: {str(e)}"
    )
```

2. **Frontend error recovery**:
```typescript
try {
  const result = await sendQuoteEmail(...)
  // Success
} catch (error) {
  // Rollback optimistic update
  setQuotes(prev => prev.map(q => 
    q.id === quoteId ? { ...q, status: 'draft' } : q
  ))
  // Show error message
  alert(`Lỗi: ${error.message}`)
}
```

---

## 7. Testing Checklist

### 7.1. PDF Generation
- [ ] Test với HTML đơn giản
- [ ] Test với HTML phức tạp (nhiều tables, images)
- [ ] Test multi-page PDF
- [ ] Test với các fonts khác nhau
- [ ] Test performance với HTML lớn
- [ ] Test error handling khi PDF generation fail

### 7.2. Email Sending
- [ ] Test với SMTP provider
- [ ] Test với Resend API
- [ ] Test với n8n webhook
- [ ] Test với PDF attachment
- [ ] Test với logo (CID, base64, URL)
- [ ] Test với customization data
- [ ] Test error handling khi email fail

### 7.3. Integration
- [ ] Test flow: Create quote → Preview → Send email
- [ ] Test flow: Create quote → Download PDF → Send email
- [ ] Test với các email providers khác nhau
- [ ] Test với large quote items
- [ ] Test với special characters (Vietnamese)

---

## 8. Kết luận

### Điểm mạnh tổng thể
✅ Hệ thống hỗ trợ cả Frontend và Backend PDF generation
✅ Email sending linh hoạt với 3 providers
✅ Customization system mạnh mẽ
✅ Background task không block user

### Điểm cần cải thiện
⚠️ Error handling cần được cải thiện
⚠️ Logging cần chi tiết hơn
⚠️ Performance optimization cho PDF generation
⚠️ Retry mechanism cho email sending

### Priority Actions
1. **High**: Thêm logging và error handling cho PDF generation
2. **Medium**: Thêm retry mechanism cho email sending
3. **Low**: Optimize PDF generation performance

---

## 9. Tài liệu tham khảo

- [WeasyPrint Documentation](https://weasyprint.org/)
- [xhtml2pdf Documentation](https://xhtml2pdf.readthedocs.io/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [Resend API Documentation](https://resend.com/docs)

