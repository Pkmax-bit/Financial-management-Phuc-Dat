import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { authMiddleware } from '@/middleware/auth'

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

    // Verify option exists and belongs to user
    const { data: option, error: optionError } = await supabase
      .from('custom_product_options')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', authResult.user.id)
      .eq('is_active', true)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { error: 'Option not found or access denied' },
        { status: 404 }
      )
    }

    // Delete option (soft delete)
    const { error: deleteError } = await supabase
      .from('custom_product_options')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', authResult.user.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete option' },
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
