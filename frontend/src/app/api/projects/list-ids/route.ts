import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({ 
      projects: data || [],
      count: data?.length || 0 
    })
  } catch (error) {
    console.error('Error in projects list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
