import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Verify column exists and belongs to user
    const { data: column, error: columnError } = await supabase
      .from('custom_product_columns')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (columnError || !column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      )
    }

    // Update column
    const { data: updatedColumn, error: updateError } = await supabase
      .from('custom_product_columns')
      .update({
        name: name.trim(),
        description: description?.trim() || null
      })
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update column' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedColumn)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verify column exists and belongs to user
    const { data: column, error: columnError } = await supabase
      .from('custom_product_columns')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (columnError || !column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      )
    }

    // Delete all options for this column first
    await supabase
      .from('custom_product_options')
      .update({ is_active: false })
      .eq('column_id', id)
      .eq('user_id', authResult.user.id)

    // Delete column (soft delete)
    const { error: deleteError } = await supabase
      .from('custom_product_columns')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', authResult.user.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete column' },
        { status: 500 }
      )
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







