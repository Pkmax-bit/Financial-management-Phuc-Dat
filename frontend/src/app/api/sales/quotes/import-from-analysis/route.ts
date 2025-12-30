import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// This will be a server-side API route that imports data from AI analysis
// We'll need to call the backend API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Import request received:', {
      hasCustomer: !!body.customer,
      customerName: body.customer?.name,
      hasProject: !!body.project,
      projectName: body.project?.name,
      itemsCount: body.items?.length || 0,
      isNewCustomer: body.is_new_customer,
      isNewProject: body.is_new_project
    })

    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No authorization header')
      return NextResponse.json(
        { error: 'Unauthorized', detail: 'Missing authorization token' },
        { status: 401 }
      )
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token preview:', token.substring(0, 20) + '...')

    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const apiUrl = `${backendUrl}/api/sales/quotes/import-from-analysis`

    console.log('📤 Forwarding to backend:', apiUrl)
    console.log('📦 Request body:', JSON.stringify({
      customer: body.customer?.name,
      project: body.project?.name,
      items: `${body.items?.length} items`
    }))

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log('📥 Backend response status:', response.status)

    if (!response.ok) {
      let errorDetail = 'Failed to import'
      try {
        const error = await response.json()
        console.error('❌ Backend error response:', error)
        errorDetail = error.detail || error.message || errorDetail

        return NextResponse.json(
          {
            error: errorDetail,
            detail: errorDetail,
            status: response.status
          },
          { status: response.status }
        )
      } catch (e) {
        const errorText = await response.text()
        console.error('❌ Backend error text:', errorText)
        return NextResponse.json(
          {
            error: errorText || errorDetail,
            detail: errorText || errorDetail,
            status: response.status
          },
          { status: response.status }
        )
      }
    }

    const result = await response.json()
    console.log('✅ Import successful:', {
      createdCustomers: result.createdCustomers,
      createdProjects: result.createdProjects,
      createdQuotes: result.createdQuotes,
      createdProducts: result.createdProducts
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error in import route:', error)
    return NextResponse.json(
      {
        error: 'Failed to import',
        detail: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

