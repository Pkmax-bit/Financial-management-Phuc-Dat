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
    const { category_id, name, description, order_index } = body

    if (!category_id || !name) {
      return NextResponse.json(
        { error: 'category_id and name are required' },
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

    // Create column
    const { data: column, error: insertError } = await supabase
      .from('custom_product_columns')
      .insert({
        category_id,
        name: name.trim(),
        description: description?.trim() || null,
        order_index: order_index || 0,
        user_id: authResult.user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create column' },
        { status: 500 }
      )
    }

    return NextResponse.json(column)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








