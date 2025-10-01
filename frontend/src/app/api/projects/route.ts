import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Lấy danh sách dự án - chỉ select các fields cơ bản
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
        end_date,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      total: projects?.length || 0
    })

  } catch (error) {
    console.error('Error in projects API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json()

    // Validate required fields
    if (!projectData.name || !projectData.project_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, project_code' },
        { status: 400 }
      )
    }

    // Create new project
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      project
    })

  } catch (error) {
    console.error('Error in projects POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
