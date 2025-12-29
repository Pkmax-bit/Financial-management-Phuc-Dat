import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: categoryId } = params
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') !== 'false'

    // Verify category exists and belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('custom_product_categories')
      .select('id, user_id')
      .eq('id', categoryId)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      )
    }

    // Get columns for the category
    const { data: columns, error: columnsError } = await supabase
      .from('custom_product_columns')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', authResult.user.id)
      .eq('is_active', activeOnly)
      .order('order_index', { ascending: true })

    if (columnsError) {
      console.error('Database error:', columnsError)
      return NextResponse.json(
        { error: 'Failed to fetch columns' },
        { status: 500 }
      )
    }

    return NextResponse.json(columns)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







