import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const selectedOptions = searchParams.get('selected_options')
    const structureId = searchParams.get('structure_id')

    if (!categoryId || !selectedOptions || !structureId) {
      return NextResponse.json(
        { error: 'Missing required parameters: category_id, selected_options, structure_id' },
        { status: 400 }
      )
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/api/custom-products/generate-name?category_id=${categoryId}&selected_options=${encodeURIComponent(selectedOptions)}&structure_id=${structureId}`

    console.log('Forwarding generate-name request to backend:', backendUrl)

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ error: 'Failed to generate product name' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in generate-name API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}