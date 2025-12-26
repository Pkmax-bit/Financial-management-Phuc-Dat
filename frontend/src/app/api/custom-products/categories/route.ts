import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') !== 'false'

    // Get categories for the authenticated user
    const { data: categories, error } = await supabase
      .from('custom_product_categories')
      .select('*')
      .eq('user_id', authResult.user.id)
      .eq('is_active', activeOnly)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Get the highest order_index for ordering
    const { data: maxOrder, error: orderError } = await supabase
      .from('custom_product_categories')
      .select('order_index')
      .eq('user_id', authResult.user.id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0

    // Create category
    const { data: category, error: insertError } = await supabase
      .from('custom_product_categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        order_index: nextOrderIndex,
        user_id: authResult.user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
