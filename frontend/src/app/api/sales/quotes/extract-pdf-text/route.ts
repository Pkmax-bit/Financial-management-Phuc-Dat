import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime (not edge) for pdf compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-side PDF extraction using pdfjs-dist
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

    console.log('📄 Extracting text from PDF on server using pdfjs-dist...')
    console.log('📊 PDF base64 length:', pdfBase64.length)
    console.log('📁 File name:', fileName)

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')
    
    // Extract text using pdfjs-dist
    let extractedText = ''
    
    try {
      console.log('📚 Loading PDF with pdfjs-dist...')
      
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
      
      console.log('✅ Buffer verified as PDF, parsing...')
      console.log('📊 Buffer size:', pdfBuffer.length, 'bytes')
      
      // Use dynamic require for pdfjs-dist in Node.js environment (server-side only)
      // This avoids webpack bundling issues at build time
      // The module will be loaded at runtime only
      const requireFunc = typeof require !== 'undefined' ? require : (() => {
        throw new Error('require is not available')
      })
      
      let pdfjsLib
      try {
        // Try legacy path first
        pdfjsLib = requireFunc('pdfjs-dist/legacy/build/pdf.js')
      } catch (requireError: any) {
        // If legacy path fails, try standard path
        try {
          pdfjsLib = requireFunc('pdfjs-dist/build/pdf.js')
        } catch (e2: any) {
          // Last resort: try main entry point
          try {
            pdfjsLib = requireFunc('pdfjs-dist')
          } catch (e3: any) {
            throw new Error(`pdfjs-dist is not available. Please ensure it is installed: npm install pdfjs-dist. Error: ${requireError?.message || e2?.message || e3?.message}`)
          }
        }
      }
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
      })
      
      const pdfDoc = await loadingTask.promise
      console.log(`✅ PDF loaded: ${pdfDoc.numPages} pages`)
      
      // Extract text from all pages
      const textPromises = []
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        textPromises.push(
          pdfDoc.getPage(pageNum).then(async (page: any) => {
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            return pageText
          })
        )
      }
      
      const pageTexts = await Promise.all(textPromises)
      extractedText = pageTexts.join('\n\n')
      
      console.log(`✅ PDF text extracted: ${extractedText.length} characters`)
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('⚠️ No text found in PDF - may be scanned image')
      }
    } catch (pdfError: any) {
      console.error('❌ pdfjs-dist error:', pdfError)
      console.error('Error type:', typeof pdfError)
      console.error('Error details:', {
        message: pdfError?.message,
        stack: pdfError?.stack?.substring(0, 500),
        name: pdfError?.name,
        code: pdfError?.code
      })
      
      // Check if it's a PDF format error
      const errorMessage = pdfError?.message || String(pdfError)
      if (errorMessage.includes('Invalid PDF') || 
          errorMessage.includes('corrupt') ||
          errorMessage.includes('not a PDF') ||
          errorMessage.includes('PDF structure') ||
          errorMessage.includes('password')) {
        return NextResponse.json(
          { 
            error: 'Invalid PDF file',
            message: 'File PDF không hợp lệ, bị hỏng, hoặc có mật khẩu. Vui lòng kiểm tra lại file.',
            details: errorMessage
          },
          { status: 400 }
        )
      }
      
      // If parsing fails, return error with helpful message
      return NextResponse.json(
        { 
          error: 'Failed to extract text from PDF',
          message: 'Không thể trích xuất text từ PDF. File có thể là PDF scan (hình ảnh) hoặc không có text layer. Vui lòng sử dụng PDF có text.',
          details: errorMessage || 'PDF parsing error'
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

