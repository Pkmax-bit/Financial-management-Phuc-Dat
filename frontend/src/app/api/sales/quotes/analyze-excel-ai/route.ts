import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

interface DocumentAnalysisRequest {
  documentData: string
  fileName: string
  fileType?: 'excel' | 'pdf'
  timestamp?: number
  requestId?: string
  fileSize?: number
  fileLastModified?: number
  model?: string  // AI model to use (e.g., 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo')
}

interface DebugInfo {
  documentPreview: {
    first500Chars: string
    last200Chars: string
    totalLength: number
    lineCount: number
  }
  extractedInfo: {
    customerFound: boolean
    customerName: string | null
    addressFound: boolean
    address: string | null
    phoneFound: boolean
    phone: string | null
    supervisorFound: boolean
    supervisor: string | null
    dateFound: boolean
    date: string | null
    itemsCount: number
    itemsPreview: Array<{
      stt: number | null
      ten_san_pham: string
      loai_san_pham: string | null
      so_luong: number
      don_gia: number
      thanh_tien: number
    }>
    subtotalFound: boolean
    subtotal: number
    vatFound: boolean
    taxAmount: number
    totalFound: boolean
    totalAmount: number
  }
  warnings: string[]
  processingSteps: string[]
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body: DocumentAnalysisRequest = await request.json()
    const { documentData, fileName, fileType = 'excel', timestamp, requestId, fileSize, fileLastModified, model = 'gpt-4o' } = body
    
    // Validate model
    const validModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o-mini']
    const selectedModel = validModels.includes(model) ? model : 'gpt-4o'
    
    console.log('🤖 Selected AI model:', selectedModel)
    
    console.log('📥 Received request:', {
      fileName,
      fileType,
      documentDataLength: documentData?.length,
      timestamp: timestamp || 'no timestamp',
      requestId: requestId || 'no requestId',
      fileSize: fileSize || 'unknown',
      fileLastModified: fileLastModified ? new Date(fileLastModified).toISOString() : 'unknown'
    })
    
    // Check for Excel temporary/lock files
    if (fileName && (fileName.startsWith('~$') || fileName.startsWith('~'))) {
      console.error('❌ Temporary/lock file detected:', fileName)
      return NextResponse.json(
        { 
          error: 'Invalid file: Excel temporary file',
          message: `⚠️ File "${fileName}" là file tạm (temporary file) của Excel.\n\n` +
                   `File này được Excel tự động tạo khi bạn đang mở file gốc.\n\n` +
                   `🔧 Cách khắc phục:\n` +
                   `1. Đóng file Excel đang mở\n` +
                   `2. Upload file gốc (không có ký tự ~ ở đầu tên file)\n` +
                   `3. File gốc có tên: "${fileName.replace(/^~\$/, '')}"`
        },
        { status: 400 }
      )
    }
    
    // Check for suspiciously small files
    if (fileSize && fileSize < 1000) {  // Less than 1KB
      console.warn('⚠️ File size too small:', fileSize, 'bytes')
      return NextResponse.json(
        { 
          error: 'Invalid file: File too small',
          message: `⚠️ File quá nhỏ (${fileSize} bytes).\n\n` +
                   `File Excel báo giá thường có kích thước > 10KB.\n\n` +
                   `Vui lòng kiểm tra lại:\n` +
                   `- Đảm bảo file không bị lỗi\n` +
                   `- Đóng file Excel trước khi upload\n` +
                   `- Upload đúng file báo giá gốc`
        },
        { status: 400 }
      )
    }
    
    // Initialize debug info
    const debugInfo: DebugInfo = {
      documentPreview: {
        first500Chars: documentData?.substring(0, 500) || '',
        last200Chars: documentData?.substring(Math.max(0, (documentData?.length || 0) - 200)) || '',
        totalLength: documentData?.length || 0,
        lineCount: (documentData?.match(/\n/g) || []).length + 1
      },
      extractedInfo: {
        customerFound: false,
        customerName: null,
        addressFound: false,
        address: null,
        phoneFound: false,
        phone: null,
        supervisorFound: false,
        supervisor: null,
        dateFound: false,
        date: null,
        itemsCount: 0,
        itemsPreview: [],
        subtotalFound: false,
        subtotal: 0,
        vatFound: false,
        taxAmount: 0,
        totalFound: false,
        totalAmount: 0
      },
      warnings: [],
      processingSteps: []
    }
    
    // Pre-check document for key patterns
    const hasTableHeader = /STT|Hạng mục|ĐVT|Số lượng|Đơn giá|Thành tiền/i.test(documentData)
    const hasCustomerInfo = /Khách hàng|Customer/i.test(documentData)
    const hasTotal = /TỔNG|Tổng cộng|TOTAL/i.test(documentData)
    const isTempFile = /ADMINSTRATOR|♀ADMINSTRATOR/.test(documentData) && documentData.length < 1000
    
    debugInfo.processingSteps.push('🔍 Pre-checking document structure:')
    debugInfo.processingSteps.push(`  - Has table header: ${hasTableHeader ? '✓' : '✗'}`)
    debugInfo.processingSteps.push(`  - Has customer info: ${hasCustomerInfo ? '✓' : '✗'}`)
    debugInfo.processingSteps.push(`  - Has total section: ${hasTotal ? '✓' : '✗'}`)
    debugInfo.processingSteps.push(`  - Is temp file: ${isTempFile ? '✗ (YES - INVALID!)' : '✓'}`)
    
    if (isTempFile) {
      debugInfo.warnings.push('❌ File này là Excel temporary file (lock file) - không chứa dữ liệu thật')
      debugInfo.warnings.push('💡 Hướng dẫn: Đóng file Excel, sau đó upload file gốc (không có ~ ở đầu tên)')
    }
    
    if (!hasTableHeader) {
      debugInfo.warnings.push('⚠️ Không tìm thấy header bảng (STT, Hạng mục, ĐVT, Số lượng...) - file có thể không đúng format')
    }
    
    if (!hasCustomerInfo) {
      debugInfo.warnings.push('⚠️ Không tìm thấy thông tin khách hàng - kiểm tra lại file')
    }
    
    if (!hasTotal) {
      debugInfo.warnings.push('⚠️ Không tìm thấy phần tổng tiền - file có thể chưa hoàn chỉnh')
    }
    
    // Log first part of document data to verify it's different
    console.log('📊 Document data preview (first 500 chars):', debugInfo.documentPreview.first500Chars)
    console.log('📊 Document data preview (last 200 chars):', debugInfo.documentPreview.last200Chars)
    console.log('📊 Total lines in document:', debugInfo.documentPreview.lineCount)

    if (!documentData) {
      return NextResponse.json(
        { error: 'No document data provided' },
        { status: 400 }
      )
    }
    
    // Check for suspiciously short document data
    if (documentData.length < 500) {
      console.warn('⚠️ Document data too short:', documentData.length, 'characters')
      console.warn('Preview:', documentData)
      return NextResponse.json(
        { 
          error: 'Invalid document data: Too short',
          message: `⚠️ Dữ liệu file quá ngắn (${documentData.length} ký tự).\n\n` +
                   `Có thể bạn đang upload:\n` +
                   `- File temporary của Excel (file bắt đầu bằng ~$)\n` +
                   `- File bị lỗi hoặc file rỗng\n` +
                   `- File đang được mở bởi Excel\n\n` +
                   `🔧 Cách khắc phục:\n` +
                   `1. Đóng file Excel nếu đang mở\n` +
                   `2. Kiểm tra file có dữ liệu đầy đủ không\n` +
                   `3. Upload lại file báo giá gốc`,
          details: `Document preview: ${documentData.substring(0, 200)}...`
        },
        { status: 400 }
      )
    }

    // Create detailed prompt for OpenAI
    const fileTypeLabel = fileType === 'pdf' ? 'PDF' : 'Excel'
    const reqId = requestId || `req-${Date.now()}`
    
    const prompt = `⚠️ QUAN TRỌNG: ĐÂY LÀ FILE MỚI - Request ID: ${reqId}
File: ${fileName}
Thời gian: ${new Date().toISOString()}
Độ dài dữ liệu: ${documentData.length} ký tự

🚫 KHÔNG SỬ DỤNG DỮ LIỆU TỪ CÁC LẦN PHÂN TÍCH TRƯỚC!
🚫 KHÔNG ĐOÁN HOẶC SUY LUẬN!
✅ PHẢI ĐỌC VÀ PHÂN TÍCH CHÍNH XÁC DỮ LIỆU BÊN DƯỚI!

📋 QUY TRÌNH ĐỌC DỮ LIỆU:
1️⃣ ĐỌC SHEET ĐẦU TIÊN (SHEET DUY NHẤT) - Chỉ đọc sheet đầu tiên, bỏ qua các sheet khác nếu có
2️⃣ ĐỌC TỪNG DÒNG TUẦN TỰ - Bắt đầu từ dòng 1 đến dòng cuối cùng
3️⃣ PHÂN LOẠI TỪNG DÒNG - Xác định dòng thuộc phần nào:
   - Phần 1: Header & Thông tin khách hàng (dòng 1-10)
   - Phần 2: Bảng sản phẩm (từ header bảng đến TỔNG)
   - Phần 3: Ghi chú & Điều khoản (sau TỔNG)
4️⃣ TRÍCH XUẤT THÔNG TIN - Lấy chính xác từng thông tin từ mỗi dòng

Bạn là chuyên gia phân tích báo giá xây dựng. Bạn PHẢI đọc kỹ TỪNG DÒNG và phân tích CHÍNH XÁC dữ liệu ${fileTypeLabel} báo giá sau đây. 

⚠️ QUAN TRỌNG VỀ FORMAT JSON - ĐỌC KỸ:
- Trả về CHỈ JSON thuần túy, KHÔNG có markdown formatting, code blocks, comments, hoặc text thừa
- TUYỆT ĐỐI KHÔNG thêm comments (//, /* */) vào JSON
- TUYỆT ĐỐI KHÔNG thêm note, giải thích, hay text nào ngoài JSON
- TẤT CẢ các ký tự đặc biệt trong string values PHẢI được escape đúng cách:
  * Xuống dòng (newline) phải là \\n (không phải ký tự xuống dòng thực)
  * Dấu ngoặc kép trong string phải là \\"
  * Backslash phải là \\\\
- Đảm bảo JSON hợp lệ 100%, có thể parse được bằng JSON.parse()
- KHÔNG được có comments kiểu: // Rounded from... hoặc // Note: ...

=== DỮ LIỆU ${fileTypeLabel.toUpperCase()} CẦN PHÂN TÍCH ===
⚠️ CHỈ ĐỌC SHEET ĐẦU TIÊN - SHEET DUY NHẤT
⚠️ ĐỌC TỪNG DÒNG TUẦN TỰ TỪ ĐẦU ĐÉN CUỐI
⚠️ KHÔNG BỎ QUA BẤT KỲ DÒNG NÀO

${documentData}

=== HƯỚNG DẪN ĐỌC TỪNG DÒNG ===

BƯỚC 1: ĐỌC DÒNG 1-30 (PHẦN HEADER & THÔNG TIN KHÁCH HÀNG)
- Quét qua từng dòng để tìm:
  ✓ "Khách hàng:" hoặc "Khách hàng :"
  ✓ "Địa chỉ:" hoặc "Địa chỉ :"
  ✓ "SĐT:" hoặc "S Đ T:" hoặc "Số điện thoại:"
  ✓ "Email:"
  ✓ "Giám sát:" hoặc "Người phụ trách:"
  ✓ "NGÀY BÁO GIÁ:" hoặc "Ngày ... tháng ... năm ..."
- Lấy CHÍNH XÁC text bên cạnh các label này

BƯỚC 2: TÌM HEADER BẢNG SẢN PHẨM
- Tìm dòng có: "STT" | "Hạng mục thi công" | "ĐVT" | "Số lượng" | "Đơn giá" | "Thành tiền"
- Ghi nhớ vị trí dòng này (đây là điểm bắt đầu bảng)

BƯỚC 3: ĐỌC TỪNG DÒNG TRONG BẢNG (TỪ SAU HEADER ĐẾN TRƯỚC "TỔNG")
⚠️ QUAN TRỌNG: Nếu KHÔNG TÌM THẤY header bảng hoặc không có dòng nào thỏa điều kiện → trả về items: []

- Với MỖI dòng sau header:
  1. KIỂM TRA: Dòng này có phải item không?
     ❌ BỎ QUA nếu là: "HẠNG MỤC NHÔM...", "VI TRỆ:", header phụ, dòng trống
     ✅ LẤY nếu có ĐỦ: STT + số lượng + đơn giá + thành tiền
     ⚠️ Nếu dòng thiếu 1 trong 4 thông tin trên → KHÔNG phải item, BỎ QUA
  
  2. NẾU LÀ ITEM, TRÍCH XUẤT:
     - STT (cột 1)
     - Ký hiệu (cột 2) - text màu đỏ
     - Hạng mục thi công (cột 3) - TOÀN BỘ text
     - ĐVT (cột 4)
     - Ngang, Cao (cột 5)
     - Số lượng (cột 6)
     - Diện tích (cột 7)
     - Đơn giá (cột 8) - CHỈ số, bỏ dấu phẩy/chấm
     - Thành tiền (cột 9) - CHỈ số, bỏ dấu phẩy/chấm
  
  3. PHÂN TÍCH HẠNG MỤC (từ cột "Hạng mục thi công"):
     a. Lấy DÒNG ĐẦU TIÊN → ten_san_pham
        - Nếu có dấu "+", chỉ lấy phần TRƯỚC dấu "+"
        - Ví dụ: "CỬA SỔ MỞ 1 CÁNH + 1 FIX" → "CỬA SỔ MỞ 1 CÁNH"
     
     b. Đọc TẤT CẢ các dòng → xác định loai_san_pham
        - Tìm "Nhôm" + "Xingfa" + ("Việt Nam" HOẶC "TDA" HOẶC "Tiến Đạt")
          → "Nhôm Xingfa Việt Nam"
        - Tìm "Nhôm" + "Xingfa" + ("Trung Quốc" HOẶC "GuangDong")
          → "Nhôm Xingfa Trung Quốc"
        - Tìm "Zhongkai" HOẶC "AGS"
          → "Nhôm Zhongkai"
        - Chỉ có "Kính", không có "Nhôm"
          → "Kính cường lực"
        - Bắt đầu với "Phụ kiện"
          → "Phụ kiện"
        - Có "vận chuyển" hoặc "lắp đặt"
          → "Dịch vụ"
     
     c. Lấy các dòng SAU dòng đầu → mo_ta
        - Bao gồm: vật liệu, kích thước, màu sắc, phụ kiện
        - Nối các dòng bằng \\n

BƯỚC 4: TÌM CÁC DÒNG TỔNG
- Tìm dòng có "TỔNG KHỐI LƯỢNG" hoặc "TỔNG CỘNG" → subtotal
- Tìm dòng có "THUẾ VAT" hoặc "VAT" → tax_rate và tax_amount
- Tìm dòng có "TỔNG KHỐI LƯỢNG THANH TOÁN" → total_amount

BƯỚC 5: ĐỌC PHẦN GHI CHÚ (SAU DÒNG TỔNG CUỐI)
- Lấy TẤT CẢ text từ sau "TỔNG KHỐI LƯỢNG THANH TOÁN" đến hết file
- Tách thành 2 phần:
  • notes: Phần bảo hành, ghi chú (từ đầu đến "***QUY TRÌNH")
  • terms: Phần quy trình (từ "***QUY TRÌNH" đến hết)

=== CẤU TRÚC FILE EXCEL BAO GIÁ - PHÂN TÍCH KỸ ===

File Excel báo giá Nhôm Kính Phúc Đạt có cấu trúc 3 PHẦN CHÍNH:

📋 PHẦN 1 - HEADER & THÔNG TIN KHÁCH HÀNG (Dòng 1-10):
Vị trí: Các dòng TRƯỚC header bảng (trước "STT", "Hạng mục thi công")
Tìm trong các cells/dòng đầu file:
- "Khách hàng:" hoặc "Khách hàng :" → lấy text bên cạnh (cùng dòng hoặc cell kế)
  * Ví dụ: "Khách hàng: (Chị) Nhi", "Khách hàng: ANH TRUNG"
- "Địa chỉ:" hoặc "Địa chỉ :" → lấy text bên cạnh
  * Ví dụ: "Địa chỉ: Quận 3", "Địa chỉ: TÂN PHÚ", "Địa chỉ: Công trình Tân Phú"
- "Giám sát:" hoặc "Người phụ trách:" → lấy tên người
  * Ví dụ: "Giám sát: Trương Hoàng Dương", "Người phụ trách: Trần Hoàng Quân"
- "S Đ T:" hoặc "SĐT:" hoặc "Số điện thoại:" → lấy số (10 chữ số)
  * Ví dụ: "S Đ T: 0931842122", "SĐT: 0934559522"
- "NGÀY BÁO GIÁ:" hoặc "Ngày ... tháng ... năm ..."
  * Ví dụ: "NGÀY BÁO GIÁ: 08/11/2025", "Ngày 26 tháng 11 năm 2025"

📦 PHẦN 2 - BẢNG SẢN PHẨM (Phần giữa, từ header đến TỔNG):
CẤU TRÚC BẢNG:
- Header columns: STT | STT (ký hiệu) | Hạng mục thi công | ĐVT | Quy cách (Ngang/Cao) | Số lượng | Diện tích | Đơn giá | Bộ phụ kiện | Thành tiền | Hình ảnh

QUAN TRỌNG - NHẬN DIỆN SECTIONS:
1. Header vàng: "HẠNG MỤC NHÔM XINGFA TDA (TIẾN ĐẠT)" hoặc tương tự
   → Đây là nhóm sản phẩm, KHÔNG phải item

2. Section headers: "VI TRỆ: SÂN THƯỢNG", "VI TRỆ: LẦU 1+2", v.v.
   → Đây là vị trí lắp đặt, KHÔNG phải item
   
3. Ký hiệu màu đỏ: "Cửa sổ trước - sau", "cửa sổ giếng trời", "cửa bancol LẦU 2", "Cửa chính"
   → Đây là tên/ký hiệu item, đưa vào field "ky_hieu"

MỖI ITEM GỒM:
- STT: Số thứ tự (cột đầu)
- ky_hieu: Text màu đỏ ở cột 2 (ví dụ: "Cửa sổ trước - sau", "cửa bancol LẦU 2", "Cửa chính")
- hang_muc_thi_cong: Toàn bộ text ở cột "Hạng mục thi công"
- ten_san_pham: Dòng đầu tiên, phần TRƯỚC dấu + (nếu có)
  * "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH" → "CỬA SỔ MỞ 1 CÁNH"
  * "Cửa sổ 2 cánh mở quay quay" → "Cửa sổ 2 cánh mở quay"
  * "VÁCH KÍNH VĂN PHÒNG" → "VÁCH KÍNH VĂN PHÒNG"
  * "CỬA TRƯỢT QUAY 4 CÁNH + MỞ TRONG" → "CỬA TRƯỢT QUAY 4 CÁNH"
  
- loai_san_pham: Nhận diện từ dòng có "Nhôm", "Xuất sứ"
  * "Nhôm Xingfa TDA hệ 55" + "Xuất sứ: Việt Nam" → "Nhôm Xingfa Việt Nam"
  * "Nhôm : Xingfa Tiến Đạt Việt Nam hệ 55" → "Nhôm Xingfa Việt Nam"
  * "Nhôm Xingfa GuangDong" + "Xuất sứ: Trung Quốc" → "Nhôm Xingfa Trung Quốc"
  * "Nhôm : Zhongkai AGS100" → "Nhôm Zhongkai"
  * "Kính trắng 10mm cường lực" (không có Nhôm) → "Kính cường lực"
  * "Phụ kiện cửa kính mở BLS VVP" → "Phụ kiện"

- mo_ta: Tất cả các dòng SAU dòng đầu (bao gồm thông tin vật liệu, kích thước, màu, phụ kiện)

NHẬN DIỆN KẾT THÚC PHẦN 2:
- Dòng có "TỔNG KHỐI LƯỢNG" hoặc "TỔNG CỘNG HẠNG MỤC" → đây là tổng
- Dòng có "THUẾ VAT" → đây là VAT
- Dòng có "TỔNG KHỐI LƯỢNG THANH TOÁN" → đây là tổng cuối

📝 PHẦN 3 - GHI CHÚ & ĐIỀU KHOẢN (Sau TỔNG KHỐI LƯỢNG THANH TOÁN):
Vị trí: Tất cả các dòng SAU bảng sản phẩm

Nội dung thường bao gồm:
1. Thông tin bảo hành:
   - "CHƯA BAO GỒM THUẾ VAT" hoặc "ĐÃ BAO GỒM THUẾ VAT"
   - "Nhôm Xingfa nhập khẩu Quảng Đông bao hành kím khí 5 năm"
   - "Phụ kiện Kinlong chính hãng hoặc Draho đồng bộ cửa bao hành 2 năm"
   - "Phụ kiện VVP inox bảo hành 1 năm"

2. Ghi chú quy chuẩn:
   - "***GHI CHÚ:"
   - "- Quy chuẩn cửa đi 4 cánh lớn trên 7.2m2, 2 cánh trên 3m6..."
   - "- Quy chuẩn cửa sổ 4 cánh lớn trên 3m6, 2 cánh trên 1m8..."

3. Quy trình (nếu có):
   - "***QUY TRÌNH TIẾP NHẬN ĐƠN HÀNG:"
   - "1. Tiếp nhận đơn hàng"
   - "2. Hợp đồng và ứng cọc..."

LƯU Ý: Lấy TẤT CẢ text từ sau "TỔNG KHỐI LƯỢNG THANH TOÁN" đến hết file

=== YÊU CẦU PHÂN TÍCH ===
Bạn PHẢI đọc TỪNG DÒNG và PHÂN TÍCH THEO 3 PHẦN:

YÊU CẦU PHÂN TÍCH CHI TIẾT:

1. THÔNG TIN KHÁCH HÀNG (TÌM TRONG DỮ LIỆU TRÊN):
   QUAN TRỌNG: Tìm trong TOÀN BỘ dữ liệu, đặc biệt là các dòng đầu file (dòng 1-30)
   
   - Tên khách hàng: 
     * Tìm các pattern: "Khách hàng:", "Khách hàng :", "Customer:", hoặc trong bảng có label "Khách hàng"
     * Thường có prefix: (Anh), (Chị), (Chú), Anh, Chị, Chú
     * Ví dụ thực tế từ files:
       - "Khách hàng: ANH TRUNG" → name: "ANH TRUNG"
       - "Khách hàng: (Chị) Nhi" → name: "(Chị) Nhi" hoặc "Chị Nhi"
       - "Khách hàng: (Anh) Trần Xuân Tượng" → name: "(Anh) Trần Xuân Tượng"
       - "Khách hàng: (Chú) Chuyên" → name: "(Chú) Chuyên"
     * QUAN TRỌNG: Lấy CHÍNH XÁC tên trong file, bao gồm cả prefix (Anh), (Chị), (Chú) nếu có
   
   - Địa chỉ:
     * Tìm các pattern: "Địa chỉ:", "Địa chỉ :", "Address:", hoặc trong bảng có label "Địa chỉ"
     * Thường là tên quận/huyện hoặc "Công trình [tên quận]"
     * Ví dụ thực tế:
       - "Địa chỉ: TÂN PHÚ" → address: "TÂN PHÚ"
       - "Địa chỉ: Quận 3" → address: "Quận 3"
       - "Địa chỉ: Công trình Tân Phú" → address: "Công trình Tân Phú"
       - "Địa chỉ: Tân Bình" → address: "Tân Bình"
   
   - Số điện thoại:
     * Tìm các pattern: "Số điện thoại:", "SĐT:", "S Đ T:", "Phone:"
     * Format: 10 số, thường bắt đầu 09xx hoặc 03xx
     * Ví dụ: "SĐT: 0934559522", "S Đ T: 0931842122"
   
   - Email:
     * Tìm các pattern: "Email:" hoặc địa chỉ email có @
     * Nếu không có thì để null

2. THÔNG TIN DỰ ÁN (TÌM TRONG DỮ LIỆU TRÊN):
   - Tên dự án:
     * Tìm pattern: "Tên dự án:", "Dự án:", "Project:"
     * Nếu không có, TẠO từ: Tên khách hàng + " - " + Địa chỉ
     * Ví dụ: "ANH TRUNG - TÂN PHÚ", "(Chị) Nhi - Quận 3"
   
   - Địa chỉ dự án:
     * Lấy từ địa chỉ khách hàng
     * Hoặc tìm pattern: "Địa chỉ dự án:", "Công trình:"
   
   - Nhân viên trách nhiệm/Giám sát:
     * Tìm các pattern: "Giám sát:", "Giám sát :", "Người phụ trách:", "Người phụ trách :"
     * Thường là tên đầy đủ: Họ + Tên đệm + Tên
     * Ví dụ thực tế:
       - "Người phụ trách: Trần Hoàng Quân" → supervisor: "Trần Hoàng Quân"
       - "Giám sát: Trương Hoàng Dương" → supervisor: "Trương Hoàng Dương"
       - "S Đ T: 0931842122" (đây là SĐT, không phải tên)
     * LƯU Ý: Phân biệt giữa tên người và số điện thoại

3. THÔNG TIN SẢN PHẨM/HẠNG MỤC (ĐỌC TỪNG DÒNG TRONG BẢNG):
   QUAN TRỌNG: Tìm bảng chính có header columns, bỏ qua các dòng tiêu đề/giới thiệu
   
   Với MỖI dòng có dữ liệu trong bảng (không phải header), trích xuất và PHÂN TÍCH CHI TIẾT:
   - STT: Số thứ tự từ cột "STT" hoặc số thứ tự dòng
   - Ký hiệu: Giá trị từ cột "Ký hiệu", "Mô tả" (ví dụ: "Cửa sổ", "cửa sổ trước - sau", "Cửa sổ kho", "Cửa chính")
   
   - Hạng mục thi công (hang_muc_thi_cong): TOÀN BỘ mô tả gốc từ cột "Hạng mục thi công"
     * Bao gồm TẤT CẢ các dòng, xuống dòng với \\n
   
   ⚠️ MỚI - PHÂN TÍCH CHI TIẾT HẠNG MỤC:
   - ten_san_pham: Tên sản phẩm CHÍNH (lấy từ dòng đầu tiên, CHỈ lấy phần tên chính, BỎ phần phụ)
     * Ví dụ:
       - "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH" → ten_san_pham: "CỬA SỔ MỞ 1 CÁNH"
       - "Cửa sổ 2 cánh mở quay quay" → ten_san_pham: "Cửa sổ 2 cánh mở quay"
       - "VÁCH KÍNH VĂN PHÒNG" → ten_san_pham: "VÁCH KÍNH VĂN PHÒNG"
       - "CỬA TRƯỢT QUAY 4 CÁNH + MỞ TRONG" → ten_san_pham: "CỬA TRƯỢT QUAY 4 CÁNH"
     * Quy tắc: Lấy TRƯỚC dấu +, hoặc toàn bộ dòng đầu nếu không có +
   
   - item_type: PHÂN LOẠI ITEM - "product" HOẶC "material_cost" (BẮT BUỘC PHẢI CÓ)
     * ⚠️ CỰC KỲ QUAN TRỌNG: PHẢI phân biệt rõ ràng giữa SẢN PHẨM và CHI PHÍ VẬT TƯ
     * Mỗi item PHẢI có item_type để hệ thống biết lưu vào đâu:
       - item_type: "product" → Lưu vào bảng SẢN PHẨM (products)
       - item_type: "material_cost" → Lưu vào bảng CHI PHÍ ĐỐI TƯỢNG (expense_objects)
     
     QUY TẮC PHÂN LOẠI:
     
     ✅ item_type: "product" (SẢN PHẨM) - Nếu là:
        - Sản phẩm hoàn chỉnh: Cửa, Cửa sổ, Cửa đi, Vách kính, Lan can, v.v.
        - Có thể bán trực tiếp cho khách hàng
        - Có đầy đủ thông tin: tên sản phẩm, kích thước, vật liệu, phụ kiện
        - Ví dụ:
          * "CỬA SỔ MỞ 1 CÁNH" → item_type: "product"
          * "Cửa đi 2 cánh mở quay" → item_type: "product"
          * "VÁCH KÍNH VĂN PHÒNG" → item_type: "product"
          * "Lan can kính" → item_type: "product"
          * "CỬA TRƯỢT QUAY 4 CÁNH" → item_type: "product"
     
     ✅ item_type: "material_cost" (CHI PHÍ VẬT TƯ) - Nếu là:
        - Vật tư, nguyên vật liệu: Nhôm, Kính, Inox, Sắt, Nhựa, Gỗ, Phụ kiện riêng lẻ
        - Chi phí sản xuất: Vật liệu dùng để sản xuất sản phẩm
        - Chi phí dịch vụ: Vận chuyển, lắp đặt, v.v.
        - Có từ khóa: "chi phí", "vật tư", "nguyên vật liệu", "vật liệu", "phụ kiện" (riêng lẻ, không phải sản phẩm hoàn chỉnh)
        - Ví dụ:
          * "Nhôm Xingfa TDA" (riêng lẻ, không phải sản phẩm hoàn chỉnh) → item_type: "material_cost"
          * "Kính cường lực 10mm" (riêng lẻ, chỉ là vật liệu) → item_type: "material_cost"
          * "Phụ kiện Kinlong" (riêng lẻ) → item_type: "material_cost"
          * "Chi phí vận chuyển" → item_type: "material_cost"
          * "Nhôm xưởng" → item_type: "material_cost"
          * "Kính Thiên Phát" (chỉ là vật liệu) → item_type: "material_cost"
          * "Vận chuyển lắp đặt" → item_type: "material_cost"
     
     ⚠️ LƯU Ý QUAN TRỌNG:
        - Nếu item có tên sản phẩm hoàn chỉnh (Cửa, Cửa sổ, Vách kính, Lan can) → item_type: "product"
        - Nếu item chỉ là vật liệu/phụ kiện riêng lẻ (Nhôm, Kính, Phụ kiện, Chi phí) → item_type: "material_cost"
        - Nếu không rõ → mặc định là "product"
        - MỖI ITEM PHẢI CÓ item_type, không được để trống hoặc null
   
   - loai_san_pham: Loại/Category sản phẩm - PHÂN LOẠI DỰA VÀO VẬT LIỆU
     * ĐỌC KỸ các dòng mô tả để xác định vật liệu chính
     
     QUY TẮC PHÂN LOẠI (ƯU TIÊN CAO → THẤP):
     
     1️⃣ Nếu có "Xingfa" + ("Việt Nam" HOẶC "Tiến Đạt" HOẶC "TDA")
        → loai_san_pham: "Nhôm Xingfa Việt Nam"
        Ví dụ:
        - "Nhôm Xingfa TDA hệ 55" + "Xuất sứ: Việt Nam" → "Nhôm Xingfa Việt Nam"
        - "Nhôm : Xingfa Tiến Đạt Việt Nam hệ 55" → "Nhôm Xingfa Việt Nam"
     
     2️⃣ Nếu có "Xingfa" + ("Trung Quốc" HOẶC "GuangDong" HOẶC "Guangdong" HOẶC "nhập khẩu")
        → loai_san_pham: "Nhôm Xingfa Trung Quốc"
        Ví dụ:
        - "Nhôm Xingfa GuangDong nhập khẩu hệ 55" + "Xuất sứ: Trung Quốc" → "Nhôm Xingfa Trung Quốc"
        - "Nhôm Xingfa GuangDong hệ 55" → "Nhôm Xingfa Trung Quốc"
     
     3️⃣ Nếu có "Zhongkai" HOẶC "AGS"
        → loai_san_pham: "Nhôm Zhongkai"
        Ví dụ:
        - "Nhôm : Zhongkai AGS100" → "Nhôm Zhongkai"
     
     4️⃣ Nếu CÓ "Kính" và KHÔNG có "Nhôm" (hoặc Nhôm là phụ, Kính là chính)
        → loai_san_pham: "Kính cường lực"
        Ví dụ:
        - "VÁCH KÍNH VĂN PHÒNG\\nKính trắng 10mm cường lực" → "Kính cường lực"
        - "Kính trắng 8mm cường lực" → "Kính cường lực"
     
     5️⃣ Nếu có "Phụ kiện" hoặc tên bắt đầu với "Phụ kiện"
        → loai_san_pham: "Phụ kiện"
        Ví dụ:
        - "Phụ kiện cửa kính mở BLS VVP inox trắng" → "Phụ kiện"
     
     6️⃣ Nếu có "vận chuyển" hoặc "lắp đặt" hoặc "chi phí"
        → loai_san_pham: "Dịch vụ"
        Ví dụ:
        - "Chí phí vận chuyển lắp đặt" → "Dịch vụ"
     
     7️⃣ Nếu không rõ, dựa vào tên sản phẩm
        - Có "Cửa", "Cửa sổ", "Cửa đi" → "Nhôm Xingfa Việt Nam" (default)
        - Khác → null
   
   - mo_ta: Mô tả chi tiết (phần còn lại sau tên sản phẩm chính)
     * Bao gồm: thông tin vật liệu, kích thước, màu sắc, phụ kiện
     * Ví dụ:
       "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH" → mo_ta: "+ 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực\\nPhụ Kiến Kinlong chính hãng đồng bộ cửa\\n4 bánh xe lùa cửa sổ\\n2 bộ khóa sập\\nVà 1 số phụ kiện phụ khác đồng bộ cửa"
   
   - ĐVT: Đơn vị tính từ cột "ĐVT" (m², m2, bộ, xe, cái, md, v.v.)
   - Ngang (m): Chiều ngang từ cột "Ngang" hoặc "Ngang (m)" trong phần "Quy cách"
   - Cao (m): Chiều cao từ cột "Cao" hoặc "Cao (m)" trong phần "Quy cách"
   - Số lượng: Từ cột "Số lượng", "SL", "Số lượng"
   - Diện tích (m²): Từ cột "Diện tích", "Diện tích (m²)", "Diện tích (m2)"
   - Đơn giá: Từ cột "Đơn giá", "Đơn giá (VNĐ/ĐVT)", "Đơn giá (VNĐ·ĐVT)" - loại bỏ dấu phẩy, chấm, CHỈ lấy số
   - Thành tiền: Từ cột "Thành tiền", "Thành tiền (VNĐ)" - loại bỏ dấu phẩy, chấm, CHỈ lấy số. 
     * QUAN TRỌNG - CÔNG THỨC TÍNH THÀNH TIỀN:
       - Nếu có Diện tích: Thành tiền = Đơn giá × Diện tích × Số lượng
       - Nếu không có Diện tích: Thành tiền = Đơn giá × Số lượng
     * Nếu không có trong file, tính theo công thức trên
   - has_tax: Có thuế VAT hay không (boolean)
     * QUAN TRỌNG: Phân biệt các item có thuế và không có thuế
     * has_tax: true (CÓ THUẾ) - Nếu:
       - Item là sản phẩm thông thường (Cửa, Cửa sổ, Vách kính, v.v.)
       - Không có dấu hiệu miễn thuế
       - Mặc định là true nếu không rõ
     * has_tax: false (KHÔNG CÓ THUẾ) - Nếu:
       - Có ghi chú "Không VAT", "Miễn VAT", "Không thuế", "Miễn thuế"
       - Có dấu "*" hoặc ký hiệu đặc biệt chỉ miễn thuế
       - Item là "Vận chuyển", "Lắp đặt" (một số trường hợp)
       - Có ghi chú "Giá chưa VAT" và item đó được liệt kê riêng
     * Ví dụ:
       - "CỬA SỔ MỞ 1 CÁNH" → has_tax: true
       - "Vận chuyển lắp đặt (Không VAT)" → has_tax: false
       - "Phụ kiện *" (có dấu * chỉ miễn thuế) → has_tax: false
   - Ghi chú: Từ cột "Ghi chú", "Hình ảnh minh họa" (nếu có)

4. TÍNH TOÁN (TỪ DỮ LIỆU TRÊN):
   - Tổng tiền (subtotal): 
     * Tìm pattern: "TỔNG KHỐI LƯỢNG", "TỔNG CỘNG HẠNG MỤC", "Tổng tiền"
     * HOẶC tính = tổng tất cả "Thành tiền" của các items
     * Ví dụ: "TỔNG KHỐI LƯỢNG: 49,902,500" → subtotal: 49902500
   
   - VAT: 
     * Tìm pattern: "THUẾ VAT", "VAT", "Thuế", thường có %
     * Thường là 8% (0.08)
     * Ví dụ: "THUẾ VAT 8%" → tax_rate: 0.08
   
   - Số tiền VAT (tax_amount): 
     * Tìm trong dòng có "VAT" hoặc "Thuế"
     * HOẶC tính = subtotal × tax_rate
     * Ví dụ: "902,720" (dòng dưới "THUẾ VAT 8%")
   
   - Tổng thanh toán (total_amount): 
     * Tìm pattern: "TỔNG KHỐI LƯỢNG THANH TOÁN", "Tổng thanh toán"
     * HOẶC tính = subtotal + tax_amount
     * Ví dụ: "TỔNG KHỐI LƯỢNG THANH TOÁN: 12,186,720"
   
   - Ngày báo giá (date):
     * Tìm pattern: "NGÀY BÁO GIÁ:", "Ngày", "Ngày [số] tháng [số] năm [số]"
     * Format output: YYYY-MM-DD
     * Ví dụ: "NGÀY BÁO GIÁ: 08/11/2025" → date: "2025-11-08"
     * Ví dụ: "Ngày 26 tháng 11 năm 2025" → date: "2025-11-26"
   
   - Ngày hết hạn (valid_until): 
     * Tìm trong dữ liệu "Hết hạn:", "Valid until:"
     * HOẶC tính = date + 7 ngày

5. GHI CHÚ & ĐIỀU KHOẢN (PHẦN 3 - SAU BẢNG SẢN PHẨM):
   QUAN TRỌNG: Lấy TẤT CẢ text SAU dòng "TỔNG KHỐI LƯỢNG THANH TOÁN"
   
   - notes: BẢO HÀNH & GHI CHÚ
     * Tìm và lấy TẤT CẢ các dòng về:
       - Bảo hành: "CHƯA BAO GỒM THUẾ VAT", "ĐÃ BAO GỒM THUẾ VAT"
       - "Nhôm Xingfa nhập khẩu Quảng Đông bao hành kím khí 5 năm"
       - "Phụ kiện Kinlong chính hãng hoặc Draho đồng bộ cửa bao hành 2 năm"
       - "Phụ kiện VVP inox bảo hành 1 năm"
       - "PHỤ" (nếu có)
     * Ghi chú quy chuẩn: "***GHI CHÚ:", "- Quy chuẩn cửa..."
     
     VÍ DỤ TỪ FILE THỰC TẾ:
     "CHƯA BAO GỒM THUẾ VAT\\nNhôm Xingfa nhập khẩu Quảng Đông bao hành kím khí 5 năm.\\nPhụ kiện Kinlong chính hãng hoặc Draho đồng bộ cửa bao hành 2 năm.\\nPhụ kiện VVP inox bảo hành 1 năm.\\nPHỤ\\n***GHI CHÚ:\\n- Quy chuẩn cửa đi 4 cánh lớn trên 7.2m2, 2 cánh trên 3m6, 1 cánh trên 1,8m2 giá thành tính theo m2. Kích thước nhỏ hơn sẽ tính theo bộ.\\n- Quy chuẩn cửa sổ 4 cánh lớn trên 3m6, 2 cánh trên 1m8, 1 cánh trên 1m2 giá thành tính theo m2. Kích thước nhỏ hơn sẽ tính theo bộ."
   
   - terms: QUY TRÌNH TIẾP NHẬN
     * Tìm các dòng "***QUY TRÌNH TIẾP NHẬN ĐƠN HÀNG:"
     * Lấy tất cả các bước (1. 2. 3. ...)
     
     VÍ DỤ:
     "***QUY TRÌNH TIẾP NHẬN ĐƠN HÀNG:\\n1. Tiếp nhận đơn hàng\\n2. Hợp đồng và ứng cọc đợt1/ đợt 2\\n3. Đo đạc và lên bảng vẽ thiết kế\\n4. Xác nhận bản vẽ với khách hàng đồng ý sản xuất\\n5. Sản xuất và xác nhận ngày lắp đặt\\n6. Thi công lắp đặt hoàn thiện\\n7. Nghiệm thu bàn giao và thanh toán"
   
   LƯU Ý: Nếu không tìm thấy phần này, để null

⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG - CÁCH ĐỌC DỮ LIỆU:
1. CHỈ ĐỌC SHEET ĐẦU TIÊN - Bỏ qua tất cả các sheet khác (nếu có)
2. ĐỌC TỪNG DÒNG TUẦN TỰ - Từ dòng 1 đến dòng cuối, không bỏ qua dòng nào
3. PHẢI ĐỌC DỮ LIỆU TRÊN - KHÔNG được dùng dữ liệu từ lần phân tích trước
4. ĐỌC TỪNG DÒNG một cách cẩn thận, phân biệt rõ HEADER vs ITEM
5. THEO ĐÚNG 5 BƯỚC ĐỌC ở trên - Không được tự ý thay đổi quy trình

3. BỎ QUA các dòng SAU (KHÔNG phải items):
   ❌ "HẠNG MỤC NHÔM XINGFA TDA (TIẾN ĐẠT)" → header nhóm
   ❌ "VI TRỆ: SÂN THƯỢNG", "VI TRỆ: LẦU 1+2" → section header vị trí
   ❌ Các dòng KHÔNG có số lượng hoặc đơn giá
   ❌ Các dòng chỉ có text mô tả chung

4. CHỈ LẤY làm items khi:
   ✅ Có STT (số thứ tự)
   ✅ Có số lượng (so_luong > 0)
   ✅ Có đơn giá (don_gia > 0)
   ✅ Có đủ thông tin: tên, ĐVT, số lượng, đơn giá, thành tiền

5. Tên khách hàng PHẢI tìm trong dữ liệu - KHÔNG đoán
6. Địa chỉ PHẢI tìm trong dữ liệu - KHÔNG đoán
7. Giám sát PHẢI tìm trong dữ liệu - KHÔNG đoán
8. Xuống dòng trong JSON phải là \\n (escape)
9. PHÂN TÁCH rõ: ten_san_pham, loai_san_pham, mo_ta
10. Nếu không tìm thấy thông tin, để null

VÍ DỤ CỤ THỂ TỪ CÁC FILE THỰC TẾ:

FILE 1: "BG ANH DŨNG - TÂN PHÚ.xlsx"
Nếu trong dữ liệu có:
- "Khách hàng: ANH TRUNG"
- "NGÀY BÁO GIÁ: 08/11/2025"
- "Người phụ trách: Trần Hoàng Quân"
- SĐT: 0934559522 (có thể ở dòng khác)
Thì trả về:
{
  "customer": {"name": "ANH TRUNG", "address": "TÂN PHÚ", "phone": "0934559522", "email": null},
  "project": {"name": "ANH TRUNG - TÂN PHÚ", "address": "TÂN PHÚ", "supervisor": "Trần Hoàng Quân"}
}

FILE 2: "20251126. Chị Nhi Quận 3.xlsx"
Nếu trong dữ liệu có:
- "Khách hàng: (Chị) Nhi"
- "Địa chỉ: Quận 3"
- "Giám sát: Trương Hoàng Dương"
- "S Đ T: 0931842122"
Thì trả về:
{
  "customer": {"name": "(Chị) Nhi", "address": "Quận 3", "phone": "0931842122", "email": null},
  "project": {"name": "(Chị) Nhi - Quận 3", "address": "Quận 3", "supervisor": "Trương Hoàng Dương"}
}

FILE 3: "Anh Tượng Tân Phú.xlsx"
Nếu trong dữ liệu có:
- "Khách hàng: (Anh) Trần Xuân Tượng"
- "Địa chỉ: Công trình Tân Phú"
- "Giám sát: Trương Hoàng Dương"
Thì trả về:
{
  "customer": {"name": "(Anh) Trần Xuân Tượng", "address": "Công trình Tân Phú", "phone": null, "email": null},
  "project": {"name": "(Anh) Trần Xuân Tượng - Công trình Tân Phú", "address": "Công trình Tân Phú", "supervisor": "Trương Hoàng Dương"}
}

FILE 4: "Chú Chuyển Tân Bình.xlsx"
Nếu trong dữ liệu có:
- "Khách hàng: (Chú) Chuyên"
- "Địa chỉ: Tân Bình"
- Item: "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực..."
Thì phân tích:
{
  "customer": {"name": "(Chú) Chuyên", "address": "Tân Bình", "phone": null, "email": null},
  "project": {"name": "(Chú) Chuyên - Tân Bình", "address": "Tân Bình", "supervisor": null},
  "items": [
    {
      "hang_muc_thi_cong": "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm...",
      "ten_san_pham": "CỬA SỔ MỞ 1 CÁNH",
      "loai_san_pham": "Nhôm Xingfa Việt Nam",
      "mo_ta": "+ 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực..."
    }
  ]
}

PHÂN TÍCH SẢN PHẨM CHI TIẾT - VÍ DỤ TỪ FILES THỰC TẾ:

VÍ DỤ 1 - File "Chú Chuyên Tân Bình":
Input: "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực\\nPhụ Kiến Kinlong chính hãng đồng bộ cửa\\n4 bánh xe lùa cửa sổ\\n2 bộ khóa sập\\nVà 1 số phụ kiện phụ khác đồng bộ cửa"
Ký hiệu: "Cửa sổ kho"
→ ky_hieu: "Cửa sổ kho"
→ ten_san_pham: "CỬA SỔ MỞ 1 CÁNH"
→ loai_san_pham: "Nhôm Xingfa Việt Nam"
→ mo_ta: "+ 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực\\nPhụ Kiến Kinlong chính hãng đồng bộ cửa\\n4 bánh xe lùa cửa sổ\\n2 bộ khóa sập\\nVà 1 số phụ kiện phụ khác đồng bộ cửa"

VÍ DỤ 2 - File "Anh Tượng Tân Phú":
Input: "Cửa sổ 2 cánh mở quay quay\\nNhôm Xingfa TDA hệ 55\\nXuất sứ: Việt Nam\\nMàu sắc: xám, nâu, trắng, đen (vân gỗ)\\nĐộ dày: 1,4ly (cánh - khung)\\nKính trong 8ly cường lực\\nPhụ kiện: Kinlong chính hãng\\n04 bản lễ chữ A\\n02 bộ chốt cánh phụ\\n01 bộ tay gạt đa điểm"
Ký hiệu: "Cửa sổ trước - sau"
→ ky_hieu: "Cửa sổ trước - sau"
→ ten_san_pham: "Cửa sổ 2 cánh mở quay"
→ loai_san_pham: "Nhôm Xingfa Việt Nam" (có "Xingfa" + "Xuất sứ: Việt Nam")
→ mo_ta: "Nhôm Xingfa TDA hệ 55\\nXuất sứ: Việt Nam\\nMàu sắc: xám, nâu, trắng, đen (vân gỗ)\\nĐộ dày: 1,4ly (cánh - khung)\\nKính trong 8ly cường lực\\nPhụ kiện: Kinlong chính hãng\\n04 bản lễ chữ A\\n02 bộ chốt cánh phụ\\n01 bộ tay gạt đa điểm"

VÍ DỤ 3 - File "Anh Tượng" (Nhôm Trung Quốc):
Input: "Cửa đi 2 cánh mở quay\\nNhôm Xingfa GuangDong nhập khẩu hệ 55\\nXuất sứ: Trung Quốc\\nMàu sắc: xám, nâu, trắng, đen (vân gỗ)\\nĐộ dày: 2,0ly (cánh - khung)\\nKính trong 8ly cường lực\\nPhụ kiện: Kinlong chính hãng\\n06 bản lễ 4D\\n02 bộ chốt cánh phụ\\n01 bộ tay gạt đa điểm"
Ký hiệu: "cửa bancol LẦU 2"
→ ky_hieu: "cửa bancol LẦU 2"
→ ten_san_pham: "Cửa đi 2 cánh mở quay"
→ loai_san_pham: "Nhôm Xingfa Trung Quốc" (có "Xingfa" + "GuangDong" + "nhập khẩu" + "Xuất sứ: Trung Quốc")
→ mo_ta: "Nhôm Xingfa GuangDong nhập khẩu hệ 55\\nXuất sứ: Trung Quốc\\nMàu sắc: xám, nâu, trắng, đen (vân gỗ)\\nĐộ dày: 2,0ly (cánh - khung)\\nKính trong 8ly cường lực\\nPhụ kiện: Kinlong chính hãng\\n06 bản lễ 4D\\n02 bộ chốt cánh phụ\\n01 bộ tay gạt đa điểm"

VÍ DỤ 4 - File "Chị Nhi" (Vách kính):
Input: "VÁCH KÍNH VĂN PHÒNG\\nKính trắng 10mm cường lực\\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính"
Ký hiệu: "Vách kính cường lực"
→ ky_hieu: "Vách kính cường lực"
→ ten_san_pham: "VÁCH KÍNH VĂN PHÒNG"
→ loai_san_pham: "Kính cường lực" (không có "Nhôm", chủ yếu là "Kính")
→ mo_ta: "Kính trắng 10mm cường lực\\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính"

VÍ DỤ 5 - Phụ kiện:
Input: "Phụ kiện cửa kính mở BLS VVP inox trắng\\n1 bản lề sàn\\n1 kẹp kính L\\n1 kẹp kính trên\\n1 kẹp kính dưới\\n1 khóa âm sàn\\n1 tay nắm H600\\nVà 1 số phụ kiện phụ khác đồng bộ cửa"
Ký hiệu: null
→ ten_san_pham: "Phụ kiện cửa kính mở BLS VVP"
→ loai_san_pham: "Phụ kiện"
→ mo_ta: "inox trắng\\n1 bản lề sàn\\n1 kẹp kính L\\n1 kẹp kính trên\\n1 kẹp kính dưới\\n1 khóa âm sàn\\n1 tay nắm H600\\nVà 1 số phụ kiện phụ khác đồng bộ cửa"

VÍ DỤ 6 - Vận chuyển:
Input: "Chí phí vận chuyển lắp đặt"
→ ten_san_pham: "Chí phí vận chuyển lắp đặt"
→ loai_san_pham: "Dịch vụ"
→ mo_ta: null

BỎ QUA (KHÔNG phải items):
- "HẠNG MỤC NHÔM XINGFA TDA (TIẾN ĐẠT)" → header nhóm sản phẩm
- "VI TRỆ: SÂN THƯỢNG" → section header
- "VI TRỆ: LẦU 1+2" → section header
- Các dòng không có giá hoặc số lượng

LƯU Ý QUAN TRỌNG:
- Tên khách hàng GIỮ NGUYÊN prefix (Anh), (Chị), (Chú) nếu có trong file
- Địa chỉ có thể là: quận/huyện đơn thuần HOẶC "Công trình [tên quận]"
- Nếu KHÔNG TÌM THẤY thông tin, để null (user sẽ nhập thủ công sau)
- KHÔNG đoán, KHÔNG dùng dữ liệu từ file khác

⚠️ YÊU CẦU BẮT BUỘC VỀ FORMAT RESPONSE:
1. LUÔN LUÔN trả về trường "items" dưới dạng array
2. Nếu KHÔNG TÌM THẤY items nào, trả về items: [] (array rỗng)
3. KHÔNG ĐƯỢC bỏ qua trường "items"
4. items PHẢI là array, không được là null hay undefined

Trả về JSON với format CHÍNH XÁC:
{
  "customer": {
    "name": "string (bắt buộc)",
    "address": "string hoặc null",
    "phone": "string hoặc null",
    "email": "string hoặc null"
  },
  "project": {
    "name": "string (tên khách hàng + địa chỉ)",
    "address": "string (địa chỉ dự án)",
    "supervisor": "string hoặc null (nhân viên trách nhiệm)"
  },
  "items": [
    {
      "stt": number hoặc null,
      "ky_hieu": "string hoặc null",
      "hang_muc_thi_cong": "string (toàn bộ mô tả gốc)",
      "item_type": "string (BẮT BUỘC: 'product' hoặc 'material_cost')",
      "ten_san_pham": "string (tên sản phẩm chính, CHỈ lấy phần tên, bỏ phần phụ)",
      "loai_san_pham": "string (loại/category: Nhôm Xingfa Việt Nam, Nhôm Xingfa Trung Quốc, Nhôm Zhongkai, Kính cường lực, Phụ kiện, etc.)",
      "mo_ta": "string (mô tả chi tiết: vật liệu, kích thước, màu sắc, phụ kiện)",
      "dvt": "string",
      "ngang": number hoặc null,
      "cao": number hoặc null,
      "so_luong": number,
      "dien_tich": number hoặc null,
      "don_gia": number,
      "thanh_tien": number,
      "has_tax": boolean (BẮT BUỘC: true nếu có thuế VAT, false nếu không có thuế),
      "ghi_chu": "string hoặc null"
    }
  ],
  "subtotal": number,
  "tax_rate": 0.08,
  "tax_amount": number,
  "total_amount": number,
  "date": "YYYY-MM-DD hoặc null",
  "valid_until": "YYYY-MM-DD hoặc null",
  "notes": "string (ghi chú về sản phẩm, bảo hành, quy chuẩn) hoặc null",
  "terms": "string (quy trình tiếp nhận, điều khoản) hoặc null"
}

VÍ DỤ JSON ĐÚNG (CHI TIẾT):
{
  "customer": {
    "name": "(Chú) Chuyên",
    "address": "Tân Bình",
    "phone": null,
    "email": null
  },
  "project": {
    "name": "(Chú) Chuyên - Tân Bình",
    "address": "Tân Bình",
    "supervisor": "Trương Hoàng Dương"
  },
  "items": [
    {
      "stt": 1,
      "ky_hieu": "Cửa chính",
      "hang_muc_thi_cong": "CỬA SỔ MỞ 1 CÁNH + 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực\\nPhụ Kiến Kinlong chính hãng đồng bộ cửa\\n4 bánh xe lùa cửa sổ\\n2 bộ khóa sập\\nVà 1 số phụ kiện phụ khác đồng bộ cửa",
      "item_type": "product",
      "ten_san_pham": "CỬA SỔ MỞ 1 CÁNH",
      "loai_san_pham": "Nhôm Xingfa Việt Nam",
      "mo_ta": "+ 1 FIX CỐ ĐỊNH\\nNhôm : Xingfa Tiến Đạt Việt Nam hệ 55\\nDày : 1.4mm\\nMàu : xám ghi\\nKính mờ 8mm cường lực\\nPhụ Kiến Kinlong chính hãng đồng bộ cửa\\n4 bánh xe lùa cửa sổ\\n2 bộ khóa sập\\nVà 1 số phụ kiện phụ khác đồng bộ cửa",
      "dvt": "m2",
      "ngang": 1.64,
      "cao": 0.94,
      "so_luong": 1,
      "dien_tich": 1.54,
      "don_gia": 2000000,
      "thanh_tien": 3080000,
      "has_tax": true,
      "ghi_chu": null
    },
    {
      "stt": 2,
      "ky_hieu": null,
      "hang_muc_thi_cong": "VÁCH KÍNH VĂN PHÒNG\\nKính trắng 10mm cường lực\\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính",
      "item_type": "product",
      "ten_san_pham": "VÁCH KÍNH VĂN PHÒNG",
      "loai_san_pham": "Kính cường lực",
      "mo_ta": "Kính trắng 10mm cường lực\\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính",
      "dvt": "m2",
      "ngang": 3.25,
      "cao": 2.78,
      "so_luong": 1,
      "dien_tich": 9.04,
      "don_gia": 850000,
      "thanh_tien": 7684000,
      "has_tax": true,
      "ghi_chu": null
    },
    {
      "stt": 3,
      "ky_hieu": null,
      "hang_muc_thi_cong": "Nhôm xưởng\\nNhôm Xingfa TDA hệ 55",
      "item_type": "material_cost",
      "ten_san_pham": "Nhôm xưởng",
      "loai_san_pham": "Nhôm Xingfa Việt Nam",
      "mo_ta": "Nhôm Xingfa TDA hệ 55",
      "dvt": "kg",
      "ngang": null,
      "cao": null,
      "so_luong": 50,
      "dien_tich": null,
      "don_gia": 150000,
      "thanh_tien": 7500000,
      "has_tax": true,
      "ghi_chu": null
    },
    {
      "stt": 4,
      "ky_hieu": null,
      "hang_muc_thi_cong": "Vận chuyển lắp đặt (Không VAT)",
      "item_type": "material_cost",
      "ten_san_pham": "Vận chuyển lắp đặt",
      "loai_san_pham": "Dịch vụ",
      "mo_ta": null,
      "dvt": "xe",
      "ngang": null,
      "cao": null,
      "so_luong": 1,
      "dien_tich": null,
      "don_gia": 500000,
      "thanh_tien": 500000,
      "has_tax": false,
      "ghi_chu": "Không VAT"
    }
  ],
  "subtotal": 10764000,
  "tax_rate": 0.08,
  "tax_amount": 861120,
  "total_amount": 11625120,
  "date": "2025-11-26",
  "valid_until": "2025-12-03",
  "notes": "ĐÃ BAO GỒM THUẾ VAT\\nPhụ kiện cửa kính VVP inox trắng.\\n***GHI CHÚ:\\n- Quy chuẩn cửa đi 4 cánh lớn trên 7.2m2, 2 cánh trên 3m6, 1 cánh trên 1,8m2 giá thành tính theo m2. Kích thước nhỏ hơn sẽ tính theo bộ.\\n- Quy chuẩn cửa sổ 4 cánh lớn trên 3m6, 2 cánh trên 1m8, 1 cánh trên 1m2 giá thành tính theo m2. Kích thước nhỏ hơn sẽ tính theo bộ.",
  "terms": null
}

VÍ DỤ 2 - File "Anh Tượng Tân Phú" (có quy trình + bảo hành):
{
  "customer": {"name": "(Anh) Trần Xuân Tượng", "address": "Công trình Tân Phú", "phone": null, "email": null},
  "project": {"name": "(Anh) Trần Xuân Tượng - Công trình Tân Phú", "address": "Công trình Tân Phú", "supervisor": "Trương Hoàng Dương"},
  "items": [...],
  "subtotal": 49902500,
  "tax_rate": 0,
  "tax_amount": 0,
  "total_amount": 49902500,
  "date": "2025-11-27",
  "valid_until": "2025-12-04",
  "notes": "BẢO HÀNH NHÔM TDA HỆ 55: BẢO HÀNH 2 NĂM\\nBẢO HÀNH NHÔM GUANGDONG HỆ 55: BẢO HÀNH 5 NĂM\\nBẢO HÀNH PHỤ KIỆN: 2 NĂM",
  "terms": "***QUY TRÌNH TIẾP NHẬN ĐƠN HÀNG:\\n1. Tiếp nhận đơn hàng\\n2. Hợp đồng và ứng cọc đợt1/ đợt 2\\n3. Đo đạc và lên bảng vẽ thiết kế\\n4. Xác nhận bản vẽ với khách hàng đồng ý sản xuất\\n5. Sản xuất và xác nhận ngày lắp đặt\\n6. Thi công lắp đặt hoàn thiện\\n7. Nghiệm thu bàn giao và thanh toán"
}

❌ SAI: "thanh_tien-13300000" (gộp key và value)
✅ ĐÚNG: "thanh_tien": 13300000 (có dấu : giữa key và value)

❌ SAI: "thanh_tien": 5085300, // Rounded from... (có comment)
✅ ĐÚNG: "thanh_tien": 5085300 (không có comment)

❌ SAI: ghi_chu: null (thiếu quotes cho key)
✅ ĐÚNG: "ghi_chu": null (có quotes cho key)

Không bao gồm \`\`\`json hoặc \`\`\` trong response. Chỉ trả về JSON thuần túy.

⚠️ LƯU Ý CUỐI CÙNG - CỰC KỲ QUAN TRỌNG:
- JSON phải hợp lệ 100%, có thể parse được bằng JSON.parse()
- KHÔNG ĐƯỢC thêm bất kỳ comments nào (// hoặc /* */) vào JSON
- KHÔNG ĐƯỢC thêm text giải thích, note, hoặc bất kỳ text nào ngoài JSON
- Tất cả newline trong string phải là \\n (escape), không phải ký tự xuống dòng thực
- Tất cả ký tự đặc biệt trong string phải được escape: \\n, \\r, \\t, \\", \\\\
- MỖI key PHẢI có dấu : và value riêng biệt. Ví dụ: "thanh_tien": 1000000 (ĐÚNG), không được "thanh_tien-1000000" (SAI)
- Kiểm tra lại JSON trước khi trả về để đảm bảo không có lỗi syntax
- Đảm bảo format chuẩn: "key": value, không được thiếu dấu : hoặc gộp key-value thành một string
- Nếu không tìm thấy thông tin, để null, KHÔNG thêm comment giải thích
- Đảm bảo tất cả dấu ngoặc { } và [ ] đều được đóng đúng cách
- Không được có trailing comma trước ] hoặc }
- Tất cả string values phải được bao quanh bởi dấu ngoặc kép ""

QUAN TRỌNG: Trước khi trả về, hãy kiểm tra JSON bằng cách:
1. Đếm số dấu { và } phải bằng nhau
2. Đếm số dấu [ và ] phải bằng nhau
3. Tất cả string values phải được escape đúng cách
4. Không có trailing comma
5. Tất cả keys đều có dấu : sau đó`

    // Call OpenAI API
    console.log('🔵 Calling OpenAI API...')
    console.log('📊 Document data length:', documentData.length, 'characters')
    console.log('📄 File name:', fileName)
    console.log('📋 File type:', fileType)
    console.log('🆔 Request ID:', reqId)
    
    // Log sample of document data to verify it's correct
    const sampleStart = documentData.substring(0, 1000)
    const sampleEnd = documentData.substring(Math.max(0, documentData.length - 500))
    console.log('📊 Document data sample (first 1000 chars):', sampleStart)
    console.log('📊 Document data sample (last 500 chars):', sampleEnd)
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,  // Use selected model from request
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia phân tích báo giá xây dựng với khả năng đọc và phân tích Excel chính xác. QUY TRÌNH LÀM VIỆC CỦA BẠN:\n\n1. CHỈ ĐỌC SHEET ĐẦU TIÊN (sheet duy nhất) của file Excel\n2. ĐỌC TỪNG DÒNG TUẦN TỰ từ đầu đến cuối sheet\n3. PHÂN LOẠI mỗi dòng thuộc phần nào: Header, Bảng sản phẩm, hay Ghi chú\n4. TRÍCH XUẤT chính xác thông tin từ mỗi dòng\n5. KHÔNG được sử dụng dữ liệu từ các lần phân tích trước\n6. KHÔNG được đoán hoặc suy luận - chỉ lấy dữ liệu có trong file\n7. Mỗi request là hoàn toàn độc lập\n\nBạn PHẢI theo đúng 5 bước đọc dữ liệu được hướng dẫn trong prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 16000, // Tăng max_tokens để tránh JSON bị cắt
        temperature: 0.1, // Giảm temperature để AI chính xác hơn, ít "sáng tạo" hơn
        top_p: 0.95,
        frequency_penalty: 0.3, // Penalty cho việc lặp lại từ ngữ (giúp tránh dùng dữ liệu cũ)
        presence_penalty: 0.3
      })
    })
    
    console.log('✅ OpenAI API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('🤖 OpenAI response received')
    console.log('📝 Response tokens used:', data.usage?.total_tokens || 'unknown')
    
    let content = data.choices[0].message.content
    console.log('📄 Raw AI content length:', content.length, 'characters')

    // Clean up response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/, '').replace(/```\s*$/, '')
    }
    if (content.includes('```')) {
      content = content.replace(/```\s*/, '').replace(/```\s*$/, '')
    }
    content = content.trim()
    console.log('✨ Cleaned content length:', content.length, 'characters')

    // Parse JSON
    let analysis
    try {
      // Try to extract JSON from response if it's wrapped in text
      let jsonContent = content.trim()
      
      // Remove any markdown code blocks
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
      }
      if (jsonContent.includes('```')) {
        jsonContent = jsonContent.replace(/```\s*/g, '')
      }
      
      // Try to find JSON object in the content
      let jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }
      
      // Try to fix common JSON issues: unescaped newlines in strings
      // We'll do a first-pass attempt to fix obvious issues
      // Note: This is a heuristic and may not catch all cases
      
      // Fix unescaped newlines in string values
      // Look for patterns like: "key": "value\nactual newline"
      // We'll try to find and fix these by looking for newlines inside quoted strings
      let fixedContent = jsonContent
      let inQuotes = false
      let escapeNext = false
      let result = ''
      let stringStartIndex = -1
      
      for (let i = 0; i < fixedContent.length; i++) {
        const char = fixedContent[i]
        
        if (escapeNext) {
          result += char
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          result += char
          continue
        }
        
        if (char === '"') {
          if (!inQuotes) {
            // Starting a string
            stringStartIndex = result.length
            inQuotes = true
            result += char
          } else {
            // Check if this is really the end of string or a quote inside
            // Look ahead to see what comes after
            const lookAhead = fixedContent.substring(i + 1, i + 5).trim()
            if (lookAhead.startsWith(':') || lookAhead.startsWith(',') || 
                lookAhead.startsWith('}') || lookAhead.startsWith(']') || 
                lookAhead === '' || lookAhead.startsWith('\n') || lookAhead.startsWith('\r')) {
              // This is the end of string
              inQuotes = false
              result += char
            } else {
              // This might be a quote in the string, but we should escape it
              // Actually, if we're in a string and see a quote, it should end the string
              // unless it's escaped, which we already handled
              inQuotes = false
              result += char
            }
          }
          continue
        }
        
        if (inQuotes) {
          // Inside a string value - escape special characters
          if (char === '\n') {
            result += '\\n'
          } else if (char === '\r') {
            result += '\\r'
          } else if (char === '\t') {
            result += '\\t'
          } else {
            result += char
          }
        } else {
          result += char
        }
      }
      
      // If we ended while still in a string, the JSON might be incomplete
      // Try to close the string and continue
      if (inQuotes) {
        console.log('⚠️ JSON ended while in string, attempting to close...')
        result += '"'
      }
      
      jsonContent = result
      
      // Remove ellipsis (...) that AI might add when truncating
      // These appear as standalone "..." or in patterns like: "...\n    }" or "... more items ..."
      // We need to remove entire incomplete objects/arrays
      
      // Pattern 1: Remove objects like { "stt": 4, ... }
      jsonContent = jsonContent.replace(/,?\s*\{\s*[^}]*\.\.\.+[^}]*\}/g, '')
      
      // Pattern 2: Remove incomplete items at end of arrays: [..., {...incomplete...}]
      // Find last complete item before ellipsis
      jsonContent = jsonContent.replace(/,\s*\{[^}]*\.\.\.+[^\]]*$/g, '')
      
      // Pattern 3: Remove "..." entries in arrays
      jsonContent = jsonContent.replace(/,\s*"\.\.\."\s*/g, ',')
      jsonContent = jsonContent.replace(/\[\s*"\.\.\."\s*\]/g, '[]')
      
      // Pattern 4: Remove standalone ... outside strings
      jsonContent = jsonContent.replace(/,?\s*\.\.\.+\s*/g, '')
      
      // Pattern 5: Fix trailing commas before ] or }
      jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1')
      
      // Pattern 6: Fix malformed keys like "-thanh_tien-VALUE" to "thanh_tien": VALUE
      // This handles cases where AI puts key and value in one string
      jsonContent = jsonContent.replace(/"-?([a-z_]+)-(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)"\s*,/g, '"$1": $2,')
      jsonContent = jsonContent.replace(/"-?([a-z_]+)-(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)"\s*\}/g, '"$1": $2}')
      
      // Pattern 7: Fix spacing issues around colons and commas
      jsonContent = jsonContent.replace(/"\s*:\s*/g, '": ')
      jsonContent = jsonContent.replace(/,\s*"/g, ', "')
      jsonContent = jsonContent.replace(/\}\s*,/g, '},')
      jsonContent = jsonContent.replace(/\]\s*,/g, '],')
      
      // Pattern 8: Fix missing colon between key and value
      // Pattern: "key"VALUE -> "key": VALUE
      jsonContent = jsonContent.replace(/"([^"]+)"\s*([^:,}\]]+)\s*([,}\]])/g, (match: string, key: string, value: string, end: string) => {
        // Check if value looks like it should be after a colon
        if (/^[\d\-\.]/.test(value.trim()) || value.trim() === 'null' || value.trim() === 'true' || value.trim() === 'false') {
          return `"${key}": ${value.trim()}${end}`
        }
        return match
      })
      
      // Log cleaned content
      console.log('📊 After cleaning and fixing, length:', jsonContent.length)
      
      // Try to fix common JSON issues
      // 1. Fix unescaped newlines in strings (but not in string values)
      // This is tricky - we need to be careful not to break valid JSON
      
      // 2. Try to find and fix incomplete JSON by tracking braces properly
      let braceCount = 0
      let bracketCount = 0
      let inString = false
      let isEscaped = false
      let lastValidIndex = -1
      
      for (let i = 0; i < jsonContent.length; i++) {
        const char = jsonContent[i]
        
        if (isEscaped) {
          isEscaped = false
          continue
        }
        
        if (char === '\\') {
          isEscaped = true
          continue
        }
        
        if (char === '"' && !isEscaped) {
          inString = !inString
          continue
        }
        
        if (!inString) {
          if (char === '{') braceCount++
          if (char === '}') {
            braceCount--
            if (braceCount === 0 && bracketCount === 0) {
          lastValidIndex = i
            }
          }
          if (char === '[') bracketCount++
          if (char === ']') bracketCount--
        }
      }
      
      // If JSON seems incomplete, try to fix it
      if (lastValidIndex > 0 && lastValidIndex < jsonContent.length - 10) {
        console.log('⚠️ JSON might be incomplete, trying to fix...')
        console.log(`📊 Original length: ${jsonContent.length}, Valid up to: ${lastValidIndex + 1}`)
        jsonContent = jsonContent.substring(0, lastValidIndex + 1)
        
        // Try to close any open arrays/objects
        let openBraces = (jsonContent.match(/\{/g) || []).length - (jsonContent.match(/\}/g) || []).length
        let openBrackets = (jsonContent.match(/\[/g) || []).length - (jsonContent.match(/\]/g) || []).length
        
        // Only close if we're not in a string
        if (!inString) {
        while (openBrackets > 0) {
          jsonContent += ']'
          openBrackets--
        }
        while (openBraces > 0) {
          jsonContent += '}'
          openBraces--
        }
      }
      }
      
      // Final validation: try to fix common JSON syntax errors more aggressively
      
      // Step 1: Fix strings that look like "key-value" or "-key-value" pattern
      // Pattern: "-thanh_tien-3316499.9999999995" → "thanh_tien": 3316499.9999999995
      jsonContent = jsonContent.replace(/"-?([a-z_]+)-(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)"\s*([,}\]])/g, '"$1": $2$3')
      
      // Step 2: Fix missing colons between key and value (string value without quotes after key)
      // Pattern: "key"value → "key": value (where value is number/null/bool)
      jsonContent = jsonContent.replace(/"([^"]+)"\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([,}\]])/g, '"$1": $2$3')
      jsonContent = jsonContent.replace(/"([^"]+)"\s*(null|true|false)\s*([,}\]])/g, '"$1": $2$3')
      
      // Step 3: Fix spacing issues - ensure space after colon
      jsonContent = jsonContent.replace(/":([^\s])/g, '": $1')
      
      // Step 4: Fix multiple spaces to single space
      jsonContent = jsonContent.replace(/\s+/g, ' ')
      
      // Step 5: Ensure no trailing comma before closing brackets
      jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1')
      
      // Step 6: Fix missing quotes around string values after colons
      // But be careful not to quote numbers, null, true, false, objects, arrays
      // This is a last resort fix
      
      console.log('🔧 JSON after auto-fixes (first 1000 chars):', jsonContent.substring(0, 1000))
      
      // Try parsing
      analysis = JSON.parse(jsonContent)
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError)
      console.error('📊 Raw content length:', content.length)
      console.error('📄 Raw content (first 1000 chars):', content.substring(0, 1000))
      console.error('📄 Raw content (FULL):', content) // Log full content for debugging
      
      // Try to find the error position
      let errorPos: number | null = null
      const errorMatch = parseError.message?.match(/position (\d+)/)
      if (errorMatch) {
        errorPos = parseInt(errorMatch[1])
        const start = Math.max(0, errorPos - 100)
        const end = Math.min(content.length, errorPos + 100)
        console.error('🔍 Error around position', errorPos, ':')
        console.error('Context:', content.substring(start, end))
        if (errorPos < content.length) {
          console.error('Error char:', content[errorPos], 'Code:', content.charCodeAt(errorPos))
        }
      }
      
      // Try alternative parsing: use a more lenient approach
      try {
        console.log('🔄 Attempting alternative JSON parsing...')
        
        // Start fresh from original content
        let altJson = content.trim()
        
        // Remove markdown if present
        if (altJson.includes('```json')) {
          altJson = altJson.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
        }
        if (altJson.includes('```')) {
          altJson = altJson.replace(/```\s*/g, '')
        }
        
        // Remove any text before first { and after last }
        // This handles cases where AI adds explanatory text
        let jsonStart = altJson.indexOf('{')
        let jsonEnd = altJson.lastIndexOf('}')
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          altJson = altJson.substring(jsonStart, jsonEnd + 1)
        } else {
          // If no clear boundaries, try to find JSON object by counting braces
          let braceCount = 0
          let startIdx = -1
          let endIdx = -1
          
          for (let i = 0; i < altJson.length; i++) {
            if (altJson[i] === '{') {
              if (braceCount === 0) startIdx = i
              braceCount++
            } else if (altJson[i] === '}') {
              braceCount--
              if (braceCount === 0 && startIdx >= 0) {
                endIdx = i
                break
              }
            }
          }
          
          if (startIdx >= 0 && endIdx > startIdx) {
            altJson = altJson.substring(startIdx, endIdx + 1)
          }
        }
        
        // Fix unescaped newlines in string values more carefully
        let fixedJson = ''
        let inString = false
        let escapeNext = false
        
        for (let i = 0; i < altJson.length; i++) {
          const char = altJson[i]
          
          if (escapeNext) {
            fixedJson += char
            escapeNext = false
            continue
          }
          
          if (char === '\\') {
            escapeNext = true
            fixedJson += char
            continue
          }
          
          if (char === '"') {
            inString = !inString
            fixedJson += char
            continue
          }
          
          if (inString) {
            // Inside a string value - escape special characters
            if (char === '\n') {
              fixedJson += '\\n'
            } else if (char === '\r') {
              fixedJson += '\\r'
            } else if (char === '\t') {
              fixedJson += '\\t'
            } else if (char === '"') {
              fixedJson += '\\"'
            } else {
              fixedJson += char
            }
          } else {
            fixedJson += char
          }
        }
        
        altJson = fixedJson
        
        // Try to fix incomplete JSON by finding the last complete object
        let braceCount = 0
        let bracketCount = 0
        let inStr = false
        let escNext = false
        let lastCompleteIndex = -1
        
        for (let i = 0; i < altJson.length; i++) {
          const char = altJson[i]
          
          if (escNext) {
            escNext = false
            continue
          }
          
          if (char === '\\') {
            escNext = true
            continue
          }
          
          if (char === '"' && !escNext) {
            inStr = !inStr
            continue
          }
          
          if (!inStr) {
            if (char === '{') braceCount++
            if (char === '}') {
              braceCount--
              if (braceCount === 0 && bracketCount === 0) {
                lastCompleteIndex = i
              }
            }
            if (char === '[') bracketCount++
            if (char === ']') bracketCount--
          }
        }
        
        // If JSON seems incomplete, truncate at last complete point
        if (lastCompleteIndex > 0 && lastCompleteIndex < altJson.length - 10) {
          console.log(`⚠️ JSON incomplete, truncating at position ${lastCompleteIndex + 1}`)
          altJson = altJson.substring(0, lastCompleteIndex + 1)
          
          // Close any open arrays/objects
          let openBraces = (altJson.match(/\{/g) || []).length - (altJson.match(/\}/g) || []).length
          let openBrackets = (altJson.match(/\[/g) || []).length - (altJson.match(/\]/g) || []).length
          
          while (openBrackets > 0) {
            altJson += ']'
            openBrackets--
          }
          while (openBraces > 0) {
            altJson += '}'
            openBraces--
          }
        }
        
        // Try parsing the fixed alternative
        analysis = JSON.parse(altJson)
        console.log('✅ Alternative parsing succeeded')
      } catch (altError: any) {
        console.error('❌ Alternative parsing also failed:', altError)
        const altErrorMatch = altError.message?.match(/position (\d+)/)
        const altErrorPos = altErrorMatch ? parseInt(altErrorMatch[1]) : null
        
        // Try one more time with aggressive JSON fixing
        try {
          console.log('🔄 Attempting aggressive JSON fixing...')
          
          // Extract JSON object from content more aggressively
          let jsonContent = content.trim()
          
          // Remove markdown code blocks
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '')
          
          // Find JSON object boundaries
          const firstBrace = jsonContent.indexOf('{')
          const lastBrace = jsonContent.lastIndexOf('}')
          
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            jsonContent = jsonContent.substring(firstBrace, lastBrace + 1)
          }
          
          // Fix unescaped characters in strings more aggressively
          let fixed = ''
          let inString = false
          let escapeNext = false
          
          for (let i = 0; i < jsonContent.length; i++) {
            const char = jsonContent[i]
            
            if (escapeNext) {
              fixed += char
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              escapeNext = true
              fixed += char
              continue
            }
            
            if (char === '"') {
              inString = !inString
              fixed += char
              continue
            }
            
            if (inString) {
              // Escape special characters
              if (char === '\n') {
                fixed += '\\n'
              } else if (char === '\r') {
                fixed += '\\r'
              } else if (char === '\t') {
                fixed += '\\t'
              } else if (char === '"') {
                fixed += '\\"'
              } else if (char === '\\') {
                fixed += '\\\\'
              } else {
                fixed += char
              }
            } else {
              fixed += char
            }
          }
          
          jsonContent = fixed
          
          // Fix trailing commas
          jsonContent = jsonContent.replace(/,\s*([}\]])/g, '$1')
          
          // Fix missing colons between keys and values
          jsonContent = jsonContent.replace(/"([^"]+)"\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([,}\]])/g, '"$1": $2$3')
          jsonContent = jsonContent.replace(/"([^"]+)"\s+(null|true|false)\s*([,}\]])/g, '"$1": $2$3')
          
          // Fix incomplete JSON by closing braces/brackets
          let openBraces = (jsonContent.match(/\{/g) || []).length - (jsonContent.match(/\}/g) || []).length
          let openBrackets = (jsonContent.match(/\[/g) || []).length - (jsonContent.match(/\]/g) || []).length
          
          // Only close if we're at the end and not in a string
          let inStr = false
          let escNext = false
          for (let i = jsonContent.length - 1; i >= 0; i--) {
            const char = jsonContent[i]
            if (escNext) {
              escNext = false
              continue
            }
            if (char === '\\') {
              escNext = true
              continue
            }
            if (char === '"') {
              inStr = !inStr
              continue
            }
            if (!inStr) break
          }
          
          if (!inStr) {
            while (openBrackets > 0) {
              jsonContent += ']'
              openBrackets--
            }
            while (openBraces > 0) {
              jsonContent += '}'
              openBraces--
            }
          }
          
          // Try parsing
          analysis = JSON.parse(jsonContent)
          console.log('✅ Aggressive JSON fixing succeeded')
        } catch (finalError: any) {
          console.error('❌ All JSON parsing attempts failed:', finalError)
          
          // Add parsing error to debug info
          debugInfo.warnings.push('❌ Lỗi parse JSON: AI trả về dữ liệu không hợp lệ')
          debugInfo.processingSteps.push('❌ JSON parsing failed')
          debugInfo.processingSteps.push(`Error: ${parseError.message}`)
          if (altError.message) {
            debugInfo.processingSteps.push(`Alternative parsing error: ${altError.message}`)
          }
          if (finalError.message) {
            debugInfo.processingSteps.push(`Aggressive fixing error: ${finalError.message}`)
          }
          
          return NextResponse.json(
            { 
              success: false,
              error: 'Failed to parse AI response', 
              details: errorPos ? `Lỗi tại vị trí ${errorPos} trong JSON` : (altErrorPos ? `Lỗi tại vị trí ${altErrorPos}` : 'JSON không hợp lệ'),
              message: 'AI trả về dữ liệu không đúng format. Vui lòng thử lại hoặc kiểm tra file.',
              debug: debugInfo  // Include debug info even on error
            },
            { status: 500 }
          )
        }
      }
    }

    // Validate and calculate totals if needed
    console.log('✅ JSON parsed successfully')
    debugInfo.processingSteps.push('✅ JSON parsed successfully')
    
    console.log('📋 ===== KẾT QUẢ PHÂN TÍCH =====')
    
    // Extract and log customer info
    const customerName = analysis.customer?.name || null
    const customerAddress = analysis.customer?.address || null
    const customerPhone = analysis.customer?.phone || null
    const supervisor = analysis.project?.supervisor || null
    const dateExtracted = analysis.date || null
    
    debugInfo.extractedInfo.customerFound = !!customerName
    debugInfo.extractedInfo.customerName = customerName
    debugInfo.extractedInfo.addressFound = !!customerAddress
    debugInfo.extractedInfo.address = customerAddress
    debugInfo.extractedInfo.phoneFound = !!customerPhone
    debugInfo.extractedInfo.phone = customerPhone
    debugInfo.extractedInfo.supervisorFound = !!supervisor
    debugInfo.extractedInfo.supervisor = supervisor
    debugInfo.extractedInfo.dateFound = !!dateExtracted
    debugInfo.extractedInfo.date = dateExtracted
    
    console.log('👤 Customer extracted:', customerName || 'NOT FOUND')
    console.log('📍 Address extracted:', customerAddress || 'NOT FOUND')
    console.log('📞 Phone extracted:', customerPhone || 'NOT FOUND')
    console.log('👷 Supervisor extracted:', supervisor || 'NOT FOUND')
    console.log('📅 Date extracted:', dateExtracted || 'NOT FOUND')
    
    debugInfo.processingSteps.push(
      `👤 Customer: ${customerName || 'NOT FOUND'}`,
      `📍 Address: ${customerAddress || 'NOT FOUND'}`,
      `📞 Phone: ${customerPhone || 'NOT FOUND'}`,
      `👷 Supervisor: ${supervisor || 'NOT FOUND'}`,
      `📅 Date: ${dateExtracted || 'NOT FOUND'}`
    )
    
    // Add warnings for missing data
    if (!customerName) debugInfo.warnings.push('⚠️ Không tìm thấy tên khách hàng trong file')
    if (!customerAddress) debugInfo.warnings.push('⚠️ Không tìm thấy địa chỉ trong file')
    if (!supervisor) debugInfo.warnings.push('⚠️ Không tìm thấy giám sát/người phụ trách trong file')
    
    // Extract items info
    debugInfo.extractedInfo.itemsCount = analysis.items?.length || 0
    console.log('📦 Items count:', debugInfo.extractedInfo.itemsCount)
    debugInfo.processingSteps.push(`📦 Items count: ${debugInfo.extractedInfo.itemsCount}`)
    
    // Log first 3 items for verification
    if (analysis.items && analysis.items.length > 0) {
      console.log('📦 First 3 items:')
      debugInfo.processingSteps.push('📦 First 3 items:')
      
      const itemsToShow = analysis.items.slice(0, 3)
      debugInfo.extractedInfo.itemsPreview = itemsToShow.map((item: any) => ({
        stt: item.stt || null,
        ten_san_pham: item.ten_san_pham || 'NO NAME',
        loai_san_pham: item.loai_san_pham || null,
        so_luong: item.so_luong || 0,
        don_gia: item.don_gia || 0,
        thanh_tien: item.thanh_tien || 0
      }))
      
      itemsToShow.forEach((item: any, index: number) => {
        const itemLog = `  ${index + 1}. ${item.ten_san_pham || 'NO NAME'} (${item.loai_san_pham || 'NO TYPE'}) - SL: ${item.so_luong}, Đơn giá: ${item.don_gia}, Thành tiền: ${item.thanh_tien}`
        console.log(itemLog)
        debugInfo.processingSteps.push(itemLog)
      })
    } else if (debugInfo.extractedInfo.itemsCount === 0) {
      // Only add this warning if we haven't already added it
      if (!debugInfo.warnings.some(w => w.includes('items rỗng') || w.includes('không trích xuất được items'))) {
        debugInfo.warnings.push('⚠️ Không tìm thấy item nào trong file')
      }
    }
    
    // Extract financial info
    debugInfo.extractedInfo.subtotalFound = !!analysis.subtotal
    debugInfo.extractedInfo.subtotal = analysis.subtotal || 0
    debugInfo.extractedInfo.vatFound = !!(analysis.tax_amount && analysis.tax_amount > 0)
    debugInfo.extractedInfo.taxAmount = analysis.tax_amount || 0
    debugInfo.extractedInfo.totalFound = !!analysis.total_amount
    debugInfo.extractedInfo.totalAmount = analysis.total_amount || 0
    
    console.log('💰 Subtotal:', analysis.subtotal || 'NOT FOUND')
    console.log('💰 Tax amount:', analysis.tax_amount || 'NOT FOUND')
    console.log('💰 Total amount:', analysis.total_amount || 'NOT FOUND')
    console.log('📋 =============================')
    
    debugInfo.processingSteps.push(
      `💰 Subtotal: ${analysis.subtotal || 'NOT FOUND'}`,
      `💰 Tax amount: ${analysis.tax_amount || 'NOT FOUND'}`,
      `💰 Total amount: ${analysis.total_amount || 'NOT FOUND'}`
    )
    
    // Verify extracted data matches document
    const docContainsCustomer = documentData.toLowerCase().includes((analysis.customer?.name || '').toLowerCase())
    const docContainsAddress = documentData.toLowerCase().includes((analysis.customer?.address || '').toLowerCase())
    
    console.log('🔍 Verification:', {
      customerFoundInDoc: docContainsCustomer,
      addressFoundInDoc: docContainsAddress,
      customerName: analysis.customer?.name,
      address: analysis.customer?.address
    })
    
    debugInfo.processingSteps.push('🔍 Verification:')
    debugInfo.processingSteps.push(`  - Customer found in doc: ${docContainsCustomer}`)
    debugInfo.processingSteps.push(`  - Address found in doc: ${docContainsAddress}`)
    
    if (!docContainsCustomer && analysis.customer?.name) {
      const warning = '⚠️ WARNING: Customer name not found in document data!'
      console.warn(warning)
      debugInfo.warnings.push(warning)
    }
    if (!docContainsAddress && analysis.customer?.address) {
      const warning = '⚠️ WARNING: Address not found in document data!'
      console.warn(warning)
      debugInfo.warnings.push(warning)
    }
    
    // Handle missing or invalid items array
    if (!analysis.items || !Array.isArray(analysis.items)) {
      console.error('❌ Analysis missing items array')
      const missingItemsWarning = '❌ AI không trích xuất được items từ file. Có thể do: (1) File không có bảng sản phẩm, (2) Cấu trúc bảng không đúng định dạng, (3) AI response bị lỗi'
      debugInfo.warnings.push(missingItemsWarning)
      debugInfo.processingSteps.push(missingItemsWarning)
      
      // Create empty items array instead of failing completely
      analysis.items = []
      console.warn('⚠️ Creating empty items array - user can add items manually')
      debugInfo.processingSteps.push('⚠️ Created empty items array - user will need to add items manually')
    }
    
    // Additional check: if items array is empty, add warning
    if (analysis.items.length === 0) {
      const emptyItemsWarning = '⚠️ Danh sách items rỗng - không tìm thấy sản phẩm nào trong file'
      debugInfo.warnings.push(emptyItemsWarning)
      debugInfo.processingSteps.push(emptyItemsWarning)
      console.warn(emptyItemsWarning)
    }

    // Ensure customer object exists (name can be null, user will fill it manually)
    if (!analysis.customer) {
      console.warn('⚠️ Analysis missing customer object, creating empty one')
      analysis.customer = {
        name: null,
        address: null,
        phone: null,
        email: null
      }
    }
    
    // Log warning if customer name is missing (user will need to fill it)
    if (!analysis.customer.name) {
      console.warn('⚠️ Customer name not found in file - user will need to enter manually')
    }
    
    console.log('🎉 Analysis validated successfully!')

    // Ensure project name exists - create from customer if needed
    if (!analysis.project) {
      analysis.project = {
        name: `${analysis.customer.name}${analysis.customer.address ? ' - ' + analysis.customer.address : ''}`,
        address: analysis.customer.address || null,
        supervisor: null
      }
    } else {
      // Ensure project name follows format: customer name + address
      if (!analysis.project.name || !analysis.project.name.includes(analysis.customer.name)) {
        analysis.project.name = `${analysis.customer.name}${analysis.customer.address ? ' - ' + analysis.customer.address : ''}`
      }
      if (!analysis.project.address) {
        analysis.project.address = analysis.customer.address || null
      }
    }

    // Recalculate totals to ensure accuracy
    const subtotal = analysis.items.reduce((sum: number, item: any) => {
      const itemTotal = item.thanh_tien || (item.don_gia || 0) * (item.so_luong || 1)
      return sum + itemTotal
    }, 0)

    const tax_rate = analysis.tax_rate || 0.08
    const tax_amount = subtotal * tax_rate
    const total_amount = subtotal + tax_amount

    // Update analysis with calculated values
    analysis.subtotal = subtotal
    analysis.tax_rate = tax_rate
    analysis.tax_amount = tax_amount
    analysis.total_amount = total_amount

    // Set default dates if not provided
    if (!analysis.date) {
      analysis.date = new Date().toISOString().split('T')[0]
    }
    if (!analysis.valid_until) {
      const validDate = new Date(analysis.date)
      validDate.setDate(validDate.getDate() + 7)
      analysis.valid_until = validDate.toISOString().split('T')[0]
    }

    // Add final processing step
    debugInfo.processingSteps.push('✅ Analysis completed successfully')
    
    console.log('🔍 ===== DEBUG INFO =====')
    console.log('Total warnings:', debugInfo.warnings.length)
    debugInfo.warnings.forEach(w => console.log(w))
    console.log('==========================')
    
    return NextResponse.json({
      success: true,
      analysis,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Error analyzing document:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to analyze document file'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        errorMessage = 'Lỗi kết nối với OpenAI API. Vui lòng kiểm tra cấu hình API key.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Quá trình phân tích mất quá nhiều thời gian. Vui lòng thử lại.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.'
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        message: 'Có lỗi xảy ra khi phân tích file. Vui lòng kiểm tra lại file và thử lại.'
      },
      { status: 500 }
    )
  }
}

