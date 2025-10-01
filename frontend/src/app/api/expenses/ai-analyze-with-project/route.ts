import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

interface AIAnalysis {
  amount: number
  vendor: string
  date: string
  description: string
  project_name?: string
  project_code?: string
  project_mention: boolean
  category: string
  confidence: number
}

interface MatchedProject {
  id: string
  name: string
  project_code: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Analysis API called')
    
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      console.error('No image provided')
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    
    console.log('Image received:', imageFile.name, imageFile.size, imageFile.type)
    
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env.local file'
      }, { status: 500 })
    }
    
    console.log('OpenAI API key configured')
    
    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    console.log('Image converted to base64, length:', imageBase64.length)
    
    // Analyze with AI
    console.log('Starting AI analysis...')
    const analysis = await analyzeReceiptWithProject(imageBase64)
    console.log('AI analysis completed:', analysis)
    
    // Find matching project
    console.log('Finding matching project...')
    const matchedProject = await findMatchingProject(analysis)
    console.log('Project matching completed:', matchedProject)
    
    return NextResponse.json({
      success: true,
      analysis,
      matchedProject
    })
    
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function analyzeReceiptWithProject(imageBase64: string): Promise<AIAnalysis> {
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
                       text: `Phân tích hóa đơn này và trích xuất thông tin sau. Trả về CHỈ JSON thuần túy, không có markdown formatting, code blocks, hoặc text thừa:

{
  "amount": number,
  "vendor": "string",
  "date": "YYYY-MM-DD",
  "description": "string",
  "project_name": "string hoặc null",
  "project_code": "string hoặc null", 
  "project_mention": boolean,
  "category": "travel/meals/accommodation/transportation/supplies/equipment/training/other",
  "confidence": number
}

Không bao gồm \`\`\`json hoặc \`\`\` trong response.`
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
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
          // Parse JSON response
          let cleanContent = content
          
          // Remove markdown formatting if present
          if (cleanContent.includes('```json')) {
            cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '')
          }
          if (cleanContent.includes('```')) {
            cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '')
          }
          
          // Clean up any extra whitespace
          cleanContent = cleanContent.trim()
          
          console.log('Cleaned content:', cleanContent)
          const analysis = JSON.parse(cleanContent)
    
    // Validate and clean data
    return {
      amount: parseFloat(analysis.amount) || 0,
      vendor: analysis.vendor || 'Unknown Vendor',
      date: analysis.date || new Date().toISOString().split('T')[0],
      description: analysis.description || 'AI Generated Expense',
      project_name: analysis.project_name,
      project_code: analysis.project_code,
      project_mention: Boolean(analysis.project_mention),
      category: analysis.category || 'other',
      confidence: Math.min(100, Math.max(0, parseInt(analysis.confidence) || 0))
    }
    
  } catch (error) {
    console.error('Error analyzing receipt with OpenAI:', error)
    
    // Fallback analysis if OpenAI fails
    return {
      amount: 0,
      vendor: 'Unknown Vendor',
      date: new Date().toISOString().split('T')[0],
      description: 'Failed to analyze receipt',
      project_mention: false,
      category: 'other',
      confidence: 0
    }
  }
}

async function findMatchingProject(analysis: AIAnalysis): Promise<MatchedProject | null> {
  try {
    const { project_name, project_code, project_mention } = analysis
    
    if (!project_mention) {
      return null
    }
    
    // Tìm dự án theo mã dự án trước
    if (project_code) {
      const { data: projectByCode, error: codeError } = await supabase
        .from('projects')
        .select('id, name, project_code')
        .eq('project_code', project_code)
        .single()
      
      if (!codeError && projectByCode) {
        return projectByCode
      }
    }
    
    // Tìm dự án theo tên (fuzzy matching)
    if (project_name) {
      const { data: projects, error: nameError } = await supabase
        .from('projects')
        .select('id, name, project_code')
        .ilike('name', `%${project_name}%`)
        .limit(5)
      
      if (!nameError && projects && projects.length > 0) {
        // Trả về dự án có độ tương đồng cao nhất
        return projects[0]
      }
    }
    
    return null
    
  } catch (error) {
    console.error('Error finding matching project:', error)
    return null
  }
}
