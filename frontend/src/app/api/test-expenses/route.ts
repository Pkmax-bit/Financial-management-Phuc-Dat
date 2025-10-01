import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('expenses')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const testData = {
      expense_code: `TEST-${Date.now()}`,
      employee_id: null,
      project_id: null,
      category: 'other',
      description: 'Test expense',
      amount: 100.00,
      currency: 'VND',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_url: null,
      status: 'pending',
      approved_by: null,
      approved_at: null,
      notes: 'Test expense for debugging'
    }
    
    console.log('Test expense data:', testData)
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(testData)
      .select('id, expense_code, description')
      .single()
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Test insert failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test insert successful',
      expense: expense
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
