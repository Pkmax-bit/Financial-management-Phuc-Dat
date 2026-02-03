import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Simple API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Simple API called')
    
    let imageBase64: string
    
    // Check if request is JSON or FormData
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Handle JSON request with base64 image
      const body = await request.json()
      let imageData = body.image
      
      if (!imageData) {
        return NextResponse.json({ 
          error: 'No image provided in JSON body'
        }, { status: 400 })
      }
      
      // Remove data URL prefix if present (data:image/jpeg;base64,)
      if (imageData.startsWith('data:')) {
        imageBase64 = imageData.split(',')[1]
      } else {
        imageBase64 = imageData
      }
      
      console.log('Image received from JSON, base64 length:', imageBase64.length)
    } else {
      // Handle FormData request
      const formData = await request.formData()
      const imageFile = formData.get('image') as File
      
      if (!imageFile) {
        return NextResponse.json({ 
          error: 'No image provided in form data' 
        }, { status: 400 })
      }
      
      console.log('Image received from FormData:', imageFile.name, imageFile.size, imageFile.type)
      
      // Convert image to base64
      const imageBuffer = await imageFile.arrayBuffer()
      imageBase64 = Buffer.from(imageBuffer).toString('base64')
    }
    
    // Check OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env.local file'
      }, { status: 500 })
    }
    
    console.log('Image base64 length:', imageBase64.length)
    
    // Test OpenAI API call
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Phân tích đơn hàng này và trích xuất thông tin. Đơn hàng có thể chứa NHIỀU chi phí khác nhau. Trả về CHỈ JSON thuần túy, không có markdown formatting:\n\n{\n  \"expenses\": [\n    {\n      \"amount\": number,\n      \"description\": \"string\",\n      \"category\": \"travel/meals/accommodation/transportation/supplies/equipment/training/other\",\n      \"confidence\": number\n    }\n  ],\n  \"vendor\": \"string\",\n  \"date\": \"YYYY-MM-DD\",\n  \"total_amount\": number,\n  \"project_mention\": boolean,\n  \"project_name\": \"string hoặc null\",\n  \"project_code\": \"string hoặc null\"\n}\n\nLưu ý:\n- expenses: Mảng các chi phí riêng biệt trong đơn hàng\n- amount: Số tiền của từng chi phí (chỉ số, không có dấu phẩy)\n- description: Mô tả chi phí cụ thể\n- category: Phân loại chi phí\n- confidence: Độ tin cậy (0-100)\n- vendor: Tên nhà cung cấp/công ty\n- date: Ngày theo format YYYY-MM-DD\n- total_amount: Tổng số tiền đơn hàng\n- project_mention: Có đề cập đến dự án không\n- project_name: Tên dự án nếu có\n- project_code: Mã dự án nếu có\n\nNếu đơn hàng chỉ có 1 chi phí, vẫn trả về mảng với 1 phần tử.\nKhông bao gồm ```json hoặc ``` trong response."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', response.status, errorText)
        return NextResponse.json({
          error: 'OpenAI API error',
          status: response.status,
          details: errorText
        }, { status: 500 })
      }
      
      const data = await response.json()
      console.log('OpenAI response:', data)
      
      // Parse the content
      let analysis
      try {
        let content = data.choices[0].message.content
        
        // Remove markdown formatting if present
        if (content.includes('```json')) {
          content = content.replace(/```json\s*/, '').replace(/```\s*$/, '')
        }
        if (content.includes('```')) {
          content = content.replace(/```\s*/, '').replace(/```\s*$/, '')
        }
        
        // Clean up any extra whitespace
        content = content.trim()
        
        console.log('Cleaned content:', content)
        analysis = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Raw content:', data.choices[0].message.content)
        analysis = {
          amount: 0,
          vendor: 'Unknown',
          date: new Date().toISOString().split('T')[0],
          description: 'Failed to parse AI response'
        }
      }
      
      return NextResponse.json({
        success: true,
        analysis,
        rawResponse: data
      })
      
    } catch (openaiError) {
      console.error('OpenAI API call failed:', openaiError)
      return NextResponse.json({
        error: 'OpenAI API call failed',
        details: openaiError instanceof Error ? openaiError.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
