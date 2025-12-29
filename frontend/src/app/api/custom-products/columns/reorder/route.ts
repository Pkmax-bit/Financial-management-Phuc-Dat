import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { category_id, column_orders } = body

    if (!category_id || !column_orders || !Array.isArray(column_orders)) {
      return NextResponse.json(
        { error: 'category_id and column_orders array are required' },
        { status: 400 }
      )
    }

    // Verify category exists and belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('custom_product_categories')
      .select('id, user_id')
      .eq('id', category_id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      )
    }

    // Update order_index for each column
    for (const columnOrder of column_orders) {
      const { error: updateError } = await supabase
        .from('custom_product_columns')
        .update({ order_index: columnOrder.order_index })
        .eq('id', columnOrder.id)
        .eq('category_id', category_id)
        .eq('user_id', authResult.user.id)

      if (updateError) {
        console.error('Database error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update column order' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







