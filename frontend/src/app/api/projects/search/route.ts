import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        projects: []
      })
    }

    // Tìm kiếm dự án theo tên hoặc mã dự án
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        project_code,
        status,
        priority,
        budget,
        start_date,
        end_date
      `)
      .or(`name.ilike.%${query}%,project_code.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching projects:', error)
      return NextResponse.json(
        { error: 'Failed to search projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      projects: projects || []
    })

  } catch (error) {
    console.error('Error in projects search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
