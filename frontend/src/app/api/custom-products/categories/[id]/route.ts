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
    const { name, description, order_index } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Verify category exists and belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('custom_product_categories')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      )
    }

    // Update category
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null
    }

    if (order_index !== undefined) {
      updateData.order_index = order_index
    }

    const { data: updatedCategory, error: updateError } = await supabase
      .from('custom_product_categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCategory)
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

    // Verify category exists and belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('custom_product_categories')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      )
    }

    // Delete all columns and options for this category first
    // Get all columns for this category
    const { data: columns, error: columnsError } = await supabase
      .from('custom_product_columns')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', authResult.user.id)

    if (columnsError) {
      console.error('Error fetching columns:', columnsError)
      return NextResponse.json(
        { error: 'Failed to fetch related data' },
        { status: 500 }
      )
    }

    // Delete all options for all columns in this category
    if (columns && columns.length > 0) {
      const columnIds = columns.map(col => col.id)
      await supabase
        .from('custom_product_options')
        .update({ is_active: false })
        .in('column_id', columnIds)
        .eq('user_id', authResult.user.id)
    }

    // Delete all columns for this category
    await supabase
      .from('custom_product_columns')
      .update({ is_active: false })
      .eq('category_id', id)
      .eq('user_id', authResult.user.id)

    // Delete category (soft delete)
    const { error: deleteError } = await supabase
      .from('custom_product_categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', authResult.user.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete category' },
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
