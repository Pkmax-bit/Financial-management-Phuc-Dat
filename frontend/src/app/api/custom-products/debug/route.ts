import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: authResult.error,
        user: null
      }, { status: 401 })
    }

    // Test database connection
    const { data: tables, error: tablesError } = await supabase
      .from('custom_product_categories')
      .select('count', { count: 'exact', head: true })

    if (tablesError) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: tablesError.message,
        tables_exist: false,
        user_id: authResult.user.id
      }, { status: 500 })
    }

    // Check if tables have data
    const { data: categories, error: catError } = await supabase
      .from('custom_product_categories')
      .select('id, name')
      .eq('user_id', authResult.user.id)
      .limit(5)

    const { data: columns, error: colError } = await supabase
      .from('custom_product_columns')
      .select('id, name, category_id')
      .eq('user_id', authResult.user.id)
      .limit(5)

    const { data: options, error: optError } = await supabase
      .from('custom_product_options')
      .select('id, name, column_id')
      .eq('user_id', authResult.user.id)
      .limit(5)

    return NextResponse.json({
      success: true,
      user_id: authResult.user.id,
      database_connection: 'OK',
      tables_exist: true,
      data: {
        categories_count: categories?.length || 0,
        columns_count: columns?.length || 0,
        options_count: options?.length || 0,
        sample_categories: categories,
        sample_columns: columns,
        sample_options: options
      },
      errors: {
        categories: catError?.message,
        columns: colError?.message,
        options: optError?.message
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
