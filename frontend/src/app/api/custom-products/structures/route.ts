import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const activeOnly = searchParams.get('active_only') !== 'false'

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/custom-products/structures${categoryId ? `?category_id=${categoryId}` : ''}${categoryId && activeOnly !== undefined ? `&active_only=${activeOnly}` : activeOnly !== undefined && !categoryId ? `?active_only=${activeOnly}` : ''}`

    console.log('Forwarding structures request to backend:', backendUrl)

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch structures' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in structures API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract structure ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const structureId = pathParts[pathParts.length - 1] // Get the last part of the path

    if (!structureId) {
      return NextResponse.json({ error: 'Structure ID is required' }, { status: 400 })
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/custom-products/structures/${structureId}`

    console.log('Forwarding DELETE structures request to backend:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ error: 'Failed to delete structure' }, { status: response.status })
    }

    return new NextResponse(null, { status: 204 }) // No content response for successful deletion
  } catch (error) {
    console.error('Error in DELETE structures API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}