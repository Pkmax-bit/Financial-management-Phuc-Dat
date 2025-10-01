import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test environment variables
    const openaiKey = process.env.OPENAI_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return NextResponse.json({
      success: true,
      environment: {
        openaiKey: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'NOT_SET',
        supabaseUrl: supabaseUrl ? 'SET' : 'NOT_SET',
        supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT_SET'
      },
      message: 'API test successful'
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test API failed', details: error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    
    // Test OpenAI API key
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env.local file'
      }, { status: 500 })
    }
    
    // Test basic OpenAI connection
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'OpenAI API connection failed',
        status: response.status,
        details: errorText
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API connection successful',
      imageSize: imageFile.size,
      imageType: imageFile.type
    })
    
  } catch (error) {
    console.error('Test POST error:', error)
    return NextResponse.json(
      { error: 'Test POST failed', details: error },
      { status: 500 }
    )
  }
}
