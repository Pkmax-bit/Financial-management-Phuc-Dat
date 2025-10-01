import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ExpenseData {
  amount: number
  description: string
  category: string
  expense_date: string
  vendor?: string
  project_id?: string
  status?: string
  ai_generated?: boolean
  ai_confidence?: number
}

export async function POST(request: NextRequest) {
  try {
    const expenseData: ExpenseData = await request.json()
    
    // Validate required fields
    if (!expenseData.amount || !expenseData.description || !expenseData.expense_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get cost category based on expense category
    const categoryMapping: { [key: string]: string } = {
      'travel': 'Phụ cấp đi lại',
      'meals': 'Phụ cấp đi lại',
      'accommodation': 'Phụ cấp đi lại',
      'transportation': 'Phụ cấp đi lại',
      'supplies': 'Vật tư tiêu hao',
      'equipment': 'Phần cứng',
      'training': 'Đào tạo nhân viên',
      'other': 'Dịch vụ bên ngoài'
    }
    
    const categoryName = categoryMapping[expenseData.category] || 'Dịch vụ bên ngoài'
    
    // Skip cost category lookup for now
    console.log('Category mapping:', categoryName)
    
    // Create expense record
    const expenseRecord = {
      project_id: expenseData.project_id || null,
      cost_category_id: null, // Skip cost category for now
      amount: expenseData.amount,
      description: expenseData.description,
      vendor: expenseData.vendor || null,
      cost_date: expenseData.expense_date,
      status: expenseData.status || 'pending',
      ai_generated: expenseData.ai_generated || false,
      ai_confidence: expenseData.ai_confidence || 0
    }
    
    const { data: expense, error } = await supabase
      .from('project_costs')
      .insert(expenseRecord)
      .select(`
        *,
        projects(name, project_code)
      `)
      .single()
    
    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json(
        { error: 'Failed to create expense' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      expense
    })
    
  } catch (error) {
    console.error('Error in expenses API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabase
      .from('project_costs')
      .select(`
        *,
        projects(name, project_code)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: expenses, error } = await query
    
    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch expenses' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: expenses
    })
    
  } catch (error) {
    console.error('Error in expenses GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
