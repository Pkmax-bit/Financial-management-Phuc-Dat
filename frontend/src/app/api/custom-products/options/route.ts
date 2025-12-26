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
    const { column_id, name, unit_price, order_index } = body

    if (!column_id || !name) {
      return NextResponse.json(
        { error: 'column_id and name are required' },
        { status: 400 }
      )
    }

    // Verify column exists and belongs to user
    const { data: column, error: columnError } = await supabase
      .from('custom_product_columns')
      .select('id, user_id')
      .eq('id', column_id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (columnError || !column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      )
    }

    // Create option
    const { data: option, error: insertError } = await supabase
      .from('custom_product_options')
      .insert({
        column_id,
        name: name.trim(),
        unit_price: unit_price || 0,
        order_index: order_index || 0,
        user_id: authResult.user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create option' },
        { status: 500 }
      )
    }

    return NextResponse.json(option)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
