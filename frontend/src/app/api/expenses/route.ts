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
}

export async function POST(request: NextRequest) {
  try {
    const expenseData: ExpenseData = await request.json()
    console.log('Received expense data:', expenseData)
    
    // Validate required fields
    if (!expenseData.amount || !expenseData.description || !expenseData.expense_date) {
      console.error('Validation failed:', {
        amount: expenseData.amount,
        description: expenseData.description,
        expense_date: expenseData.expense_date
      })
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          received: {
            amount: expenseData.amount,
            description: expenseData.description,
            expense_date: expenseData.expense_date
          }
        },
        { status: 400 }
      )
    }
    
    // Validate category enum
    const validCategories = ['travel', 'meals', 'accommodation', 'transportation', 'supplies', 'equipment', 'training', 'other']
    if (!validCategories.includes(expenseData.category)) {
      console.error('Invalid category:', expenseData.category)
      return NextResponse.json(
        { 
          error: 'Invalid category',
          received: expenseData.category,
          validCategories
        },
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
    
    // Create expense record using available columns
    const expenseRecord = {
      expense_code: `EXP-${Date.now()}`, // Generate unique code
      employee_id: null, // Will be set by user later
      project_id: expenseData.project_id || null,
      category: expenseData.category || 'other',
      description: expenseData.description,
      amount: expenseData.amount,
      currency: 'VND',
      expense_date: expenseData.expense_date,
      receipt_url: null,
      status: expenseData.status || 'pending',
      approved_by: null,
      approved_at: null,
      notes: expenseData.vendor ? `Vendor: ${expenseData.vendor}` : null
    }
    
    console.log('Expense record to insert:', expenseRecord)
    
    // Validate project_id if provided
    if (expenseRecord.project_id) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', expenseRecord.project_id)
        .single()
      
      if (projectError || !project) {
        console.error('Invalid project_id:', expenseRecord.project_id)
        return NextResponse.json(
          { 
            error: 'Invalid project_id',
            received: expenseRecord.project_id
          },
          { status: 400 }
        )
      }
    }
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseRecord)
      .select(`
        id,
        expense_code,
        project_id,
        category,
        description,
        amount,
        currency,
        expense_date,
        status,
        notes,
        created_at,
        projects(name, project_code)
      `)
      .single()
    
    if (error) {
      console.error('Error creating expense:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { 
          error: 'Failed to create expense',
          details: error.message,
          code: error.code
        },
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
      .from('expenses')
      .select(`
        id,
        expense_code,
        project_id,
        category,
        description,
        amount,
        currency,
        expense_date,
        status,
        notes,
        created_at,
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

