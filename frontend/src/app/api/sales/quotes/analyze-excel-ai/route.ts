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
    const { documentData, fileName, fileType = 'excel', timestamp, requestId, fileSize, fileLastModified } = body
    
    console.log('📥 Received request:', {
      fileName,
      fileType,
      documentDataLength: documentData?.length,
      timestamp: timestamp || 'no timestamp',
      requestId: requestId || 'no requestId',
      fileSize: fileSize || 'unknown',
      fileLastModified: fileLastModified ? new Date(fileLastModified).toISOString() : 'unknown'
    })
    
    // Log first part of document data to verify it's different
    console.log('📊 Document data preview (first 500 chars):', documentData?.substring(0, 500))
    console.log('📊 Document data preview (last 200 chars):', documentData?.substring(Math.max(0, (documentData?.length || 0) - 200)))

    if (!documentData) {
      return NextResponse.json(
        { error: 'No document data provided' },
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

Bạn là chuyên gia phân tích báo giá xây dựng. Bạn PHẢI đọc kỹ và phân tích CHÍNH XÁC dữ liệu ${fileTypeLabel} báo giá sau đây. Trả về CHỈ JSON thuần túy, không có markdown formatting, code blocks, hoặc text thừa.

=== DỮ LIỆU ${fileTypeLabel.toUpperCase()} CẦN PHÂN TÍCH (ĐỌC KỸ TỪNG DÒNG) ===
${documentData}

=== YÊU CẦU PHÂN TÍCH ===
Bạn PHẢI đọc TỪNG DÒNG trong dữ liệu trên và trích xuất:

YÊU CẦU PHÂN TÍCH CHI TIẾT - ĐỌC TỪNG DÒNG:

1. THÔNG TIN KHÁCH HÀNG (TÌM TRONG DỮ LIỆU TRÊN):
   - Tên khách hàng: Tìm trong các dòng có chứa "Khách hàng", "Tên khách hàng", "Customer", hoặc dòng có thông tin khách hàng (ví dụ: "Chị Nhi", "Anh Hà", v.v.)
   - Địa chỉ: Tìm trong các dòng có chứa "Địa chỉ", "Address", hoặc giá trị địa chỉ (ví dụ: "Quận 3", "Tân Phú", v.v.)
   - Số điện thoại: Tìm trong các dòng có chứa "Số điện thoại", "SĐT", "Phone", "Tel", hoặc số điện thoại
   - Email: Tìm trong các dòng có chứa "Email" hoặc địa chỉ email

2. THÔNG TIN DỰ ÁN (TÌM TRONG DỮ LIỆU TRÊN):
   - Tên dự án: Tìm trong các dòng có chứa "Tên dự án", "Dự án", "Project", hoặc tạo từ Tên khách hàng + " - " + Địa chỉ
   - Địa chỉ dự án: Lấy từ địa chỉ khách hàng hoặc tìm trong dòng có "Địa chỉ dự án"
   - Nhân viên trách nhiệm/Giám sát: Tìm trong các dòng có chứa "Giám sát", "Nhân viên", "Người phụ trách", "Supervisor", "Employee", hoặc tên người (ví dụ: "Trương Hoàng Dương")

3. THÔNG TIN SẢN PHẨM/HẠNG MỤC (ĐỌC TỪNG DÒNG TRONG BẢNG):
   Với MỖI dòng có dữ liệu trong bảng (không phải header), trích xuất:
   - STT: Số thứ tự từ cột "STT" hoặc số thứ tự dòng
   - Ký hiệu: Giá trị từ cột "Ký hiệu" (nếu có)
   - Hạng mục thi công: TOÀN BỘ mô tả từ cột "Hạng mục thi công", bao gồm cả các dòng con, xuống dòng (ví dụ: "VÁCH KÍNH VĂN PHÒNG\nKính trắng 10mm cường lực\n...")
   - ĐVT: Đơn vị tính từ cột "ĐVT" (m², bộ, xe, cái, v.v.)
   - Ngang (m): Chiều ngang từ cột "Ngang" hoặc "Ngang (m)"
   - Cao (m): Chiều cao từ cột "Cao" hoặc "Cao (m)"
   - Số lượng: Từ cột "Số lượng" hoặc "SL"
   - Diện tích (m²): Từ cột "Diện tích" hoặc "Diện tích (m²)" hoặc "Diện tích (m2)"
   - Đơn giá: Từ cột "Đơn giá" hoặc "Đơn giá (VNĐ/ĐVT)" (loại bỏ dấu phẩy, chấm, chỉ lấy số)
   - Thành tiền: Từ cột "Thành tiền" hoặc "Thành tiền (VNĐ)" (loại bỏ dấu phẩy, chấm, chỉ lấy số). Nếu không có thì tính = Số lượng × Đơn giá
   - Ghi chú: Từ cột "Ghi chú" (nếu có)

4. TÍNH TOÁN (TỪ DỮ LIỆU TRÊN):
   - Tổng tiền (subtotal): Tìm trong dữ liệu có "TỔNG", "Tổng tiền", "Tổng khối lượng", hoặc tính = tổng tất cả "Thành tiền" của các items
   - VAT: Tìm trong dữ liệu có "VAT", "Thuế", "THUẾ VAT" (thường là 8% = 0.08)
   - Số tiền VAT (tax_amount): Tìm trong dữ liệu hoặc tính = subtotal × tax_rate
   - Tổng thanh toán (total_amount): Tìm trong dữ liệu có "Tổng thanh toán", "TỔNG KHỐI LƯỢNG THANH TOÁN", hoặc tính = subtotal + tax_amount
   - Ngày báo giá (date): Tìm trong dữ liệu có "Ngày", "Date" (format: YYYY-MM-DD) hoặc lấy ngày hiện tại
   - Ngày hết hạn (valid_until): Tìm trong dữ liệu hoặc tính = date + 7 ngày

⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG:
1. PHẢI ĐỌC DỮ LIỆU TRÊN - KHÔNG được dùng dữ liệu từ lần phân tích trước
2. ĐỌC TỪNG DÒNG một cách cẩn thận, không bỏ sót
3. Tên khách hàng PHẢI tìm trong dữ liệu trên (ví dụ: "Chị Nhi", "Anh Hà", v.v.) - KHÔNG đoán
4. Địa chỉ PHẢI tìm trong dữ liệu trên (ví dụ: "Quận 3", "Tân Phú", v.v.) - KHÔNG đoán
5. Giám sát PHẢI tìm trong dữ liệu trên (ví dụ: "Trương Hoàng Dương", v.v.) - KHÔNG đoán
6. Hạng mục thi công có thể có nhiều dòng mô tả con (có ký tự xuống dòng \n), cần lấy TẤT CẢ
7. Nếu có nhiều hạng mục trong cùng một dòng, tách thành các items riêng
8. Đảm bảo tính toán chính xác từ dữ liệu thực tế
9. Nếu không tìm thấy thông tin trong dữ liệu, để null, KHÔNG đoán

VÍ DỤ: Nếu trong dữ liệu có "Khách hàng: (Chị) Nhi" và "Địa chỉ: Quận 3", thì:
- customer.name = "(Chị) Nhi" hoặc "Nhi"
- customer.address = "Quận 3"
KHÔNG được dùng "Anh Hà" hay "Tân Phú" nếu không có trong dữ liệu!

Trả về JSON với format:
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
      "hang_muc_thi_cong": "string (toàn bộ mô tả, bao gồm cả các dòng con)",
      "dvt": "string",
      "ngang": number hoặc null,
      "cao": number hoặc null,
      "so_luong": number,
      "dien_tich": number hoặc null,
      "don_gia": number,
      "thanh_tien": number,
      "ghi_chu": "string hoặc null"
    }
  ],
  "subtotal": number,
  "tax_rate": 0.08,
  "tax_amount": number,
  "total_amount": number,
  "date": "YYYY-MM-DD hoặc null",
  "valid_until": "YYYY-MM-DD hoặc null"
}

Không bao gồm \`\`\`json hoặc \`\`\` trong response. Chỉ trả về JSON thuần túy.`

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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia phân tích báo giá xây dựng. Bạn PHẢI phân tích chính xác dữ liệu được cung cấp. KHÔNG được sử dụng dữ liệu từ các lần phân tích trước. Mỗi request là độc lập và bạn phải đọc kỹ dữ liệu trong request đó.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000, // Tăng max_tokens để tránh JSON bị cắt
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
      
      // Try to fix incomplete JSON (if it was cut off)
      let braceCount = 0
      let lastValidIndex = -1
      for (let i = 0; i < jsonContent.length; i++) {
        if (jsonContent[i] === '{') braceCount++
        if (jsonContent[i] === '}') braceCount--
        if (braceCount === 0 && jsonContent[i] === '}') {
          lastValidIndex = i
        }
      }
      
      // If JSON seems incomplete, try to fix it
      if (lastValidIndex > 0 && lastValidIndex < jsonContent.length - 10) {
        console.log('⚠️ JSON might be incomplete, trying to fix...')
        jsonContent = jsonContent.substring(0, lastValidIndex + 1)
        // Try to close any open arrays/objects
        let openBraces = (jsonContent.match(/\{/g) || []).length - (jsonContent.match(/\}/g) || []).length
        let openBrackets = (jsonContent.match(/\[/g) || []).length - (jsonContent.match(/\]/g) || []).length
        while (openBrackets > 0) {
          jsonContent += ']'
          openBrackets--
        }
        while (openBraces > 0) {
          jsonContent += '}'
          openBraces--
        }
      }
      
      analysis = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content length:', content.length)
      console.error('Raw content (first 500 chars):', content.substring(0, 500))
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response', 
          details: content.substring(0, 500),
          message: 'AI trả về dữ liệu không đúng format. Vui lòng thử lại hoặc kiểm tra file.'
        },
        { status: 500 }
      )
    }

    // Validate and calculate totals if needed
    console.log('✅ JSON parsed successfully')
    console.log('👤 Customer extracted:', analysis.customer?.name || 'NOT FOUND')
    console.log('📍 Address extracted:', analysis.customer?.address || 'NOT FOUND')
    console.log('👷 Supervisor extracted:', analysis.project?.supervisor || 'NOT FOUND')
    console.log('📦 Items count:', analysis.items?.length || 0)
    console.log('💰 Total amount:', analysis.total_amount || 'NOT FOUND')
    
    // Verify extracted data matches document
    const docContainsCustomer = documentData.toLowerCase().includes((analysis.customer?.name || '').toLowerCase())
    const docContainsAddress = documentData.toLowerCase().includes((analysis.customer?.address || '').toLowerCase())
    
    console.log('🔍 Verification:', {
      customerFoundInDoc: docContainsCustomer,
      addressFoundInDoc: docContainsAddress,
      customerName: analysis.customer?.name,
      address: analysis.customer?.address
    })
    
    if (!docContainsCustomer && analysis.customer?.name) {
      console.warn('⚠️ WARNING: Customer name not found in document data!')
    }
    if (!docContainsAddress && analysis.customer?.address) {
      console.warn('⚠️ WARNING: Address not found in document data!')
    }
    
    if (!analysis.items || !Array.isArray(analysis.items)) {
      console.error('❌ Analysis missing items:', analysis)
      return NextResponse.json(
        { 
          error: 'Invalid analysis: missing items array',
          message: 'AI không trích xuất được danh sách hạng mục. Vui lòng kiểm tra lại file.'
        },
        { status: 500 }
      )
    }

    // Ensure customer name exists
    if (!analysis.customer || !analysis.customer.name) {
      console.error('❌ Analysis missing customer:', analysis)
      return NextResponse.json(
        { 
          error: 'Invalid analysis: missing customer name',
          message: 'AI không trích xuất được thông tin khách hàng. Vui lòng kiểm tra lại file có đầy đủ thông tin khách hàng.'
        },
        { status: 500 }
      )
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

    return NextResponse.json({
      success: true,
      analysis
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

