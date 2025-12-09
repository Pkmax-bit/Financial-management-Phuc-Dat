import { NextRequest, NextResponse } from 'next/server'

// Server-side PDF extraction using pdf-parse or similar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdfBase64, fileName } = body

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'No PDF data provided' },
        { status: 400 }
      )
    }

    console.log('📄 Extracting text from PDF on server...')
    console.log('📊 PDF base64 length:', pdfBase64.length)
    console.log('📁 File name:', fileName)

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')
    
    // Extract text using pdf-parse
    let extractedText = ''
    
    try {
      console.log('📚 Loading pdf-parse library...')
      
      // Try to import pdf-parse
      let pdfParse: any
      try {
        const pdfParseModule = await import('pdf-parse')
        pdfParse = pdfParseModule.default || pdfParseModule
        console.log('✅ pdf-parse module loaded successfully')
      } catch (importError: any) {
        console.error('❌ Failed to import pdf-parse:', importError)
        return NextResponse.json(
          { 
            error: 'PDF library not available',
            message: 'Không thể tải thư viện xử lý PDF. Vui lòng liên hệ admin.',
            details: importError?.message || 'Import error'
          },
          { status: 500 }
        )
      }
      
      if (typeof pdfParse !== 'function') {
        console.error('❌ pdf-parse is not a function:', typeof pdfParse, pdfParse)
        return NextResponse.json(
          { 
            error: 'PDF library error',
            message: 'Thư viện PDF không hoạt động đúng. Vui lòng thử lại.',
            details: 'pdf-parse is not a function'
          },
          { status: 500 }
        )
      }
      
      console.log('✅ pdf-parse function obtained, parsing PDF buffer...')
      console.log('📊 Buffer size:', pdfBuffer.length, 'bytes')
      console.log('📊 Buffer first 100 bytes:', pdfBuffer.slice(0, 100).toString('hex'))
      
      // Check if buffer looks like a PDF (should start with %PDF)
      const bufferStart = pdfBuffer.slice(0, 4).toString('ascii')
      if (!bufferStart.startsWith('%PDF')) {
        console.error('❌ Buffer does not look like a PDF:', bufferStart)
        return NextResponse.json(
          { 
            error: 'Invalid PDF format',
            message: 'File không phải là PDF hợp lệ. Vui lòng kiểm tra lại file.'
          },
          { status: 400 }
        )
      }
      
      // Parse PDF with timeout
      console.log('🔄 Starting PDF parsing...')
      const parsePromise = pdfParse(pdfBuffer)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF parsing timeout after 30 seconds')), 30000)
      )
      
      const pdfData = await Promise.race([parsePromise, timeoutPromise]) as any
      
      console.log('✅ PDF parsed successfully')
      extractedText = pdfData?.text || ''
      console.log(`✅ PDF text extracted: ${extractedText.length} characters`)
      console.log(`📄 PDF info: ${pdfData?.numpages || 'unknown'} pages`)
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('⚠️ No text found in PDF - may be scanned image')
        console.warn('⚠️ PDF metadata:', {
          numpages: pdfData?.numpages,
          info: pdfData?.info,
          metadata: pdfData?.metadata
        })
      }
    } catch (pdfParseError: any) {
      console.error('❌ pdf-parse error:', pdfParseError)
      console.error('Error type:', typeof pdfParseError)
      console.error('Error details:', {
        message: pdfParseError?.message,
        stack: pdfParseError?.stack?.substring(0, 500),
        name: pdfParseError?.name,
        code: pdfParseError?.code
      })
      
      // Check if it's a PDF format error
      const errorMessage = pdfParseError?.message || String(pdfParseError)
      if (errorMessage.includes('Invalid PDF') || 
          errorMessage.includes('corrupt') ||
          errorMessage.includes('not a PDF') ||
          errorMessage.includes('PDF')) {
        return NextResponse.json(
          { 
            error: 'Invalid PDF file',
            message: 'File PDF không hợp lệ hoặc bị hỏng. Vui lòng kiểm tra lại file.',
            details: errorMessage
          },
          { status: 400 }
        )
      }
      
      // If pdf-parse fails, return error with helpful message
      return NextResponse.json(
        { 
          error: 'Failed to extract text from PDF',
          message: 'Không thể trích xuất text từ PDF. File có thể là PDF scan (hình ảnh) hoặc không có text layer. Vui lòng sử dụng PDF có text.',
          details: errorMessage || 'pdf-parse library error'
        },
        { status: 500 }
      )
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'No text found in PDF',
          message: 'PDF có thể là file scan (hình ảnh) hoặc không có text layer. Vui lòng sử dụng PDF có text.'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      length: extractedText.length
    })

  } catch (error) {
    console.error('❌ Top-level error extracting PDF text:', error)
    console.error('Error type:', typeof error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        error: 'Failed to extract text from PDF',
        message: 'Có lỗi xảy ra khi xử lý PDF. Vui lòng thử lại hoặc liên hệ admin.',
        details: errorMessage || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

