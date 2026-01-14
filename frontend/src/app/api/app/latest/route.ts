import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://financial-management-backend-3m78.onrender.com'
    const backendUrl = `${apiUrl}/api/app-updates/latest`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: backendUrl
      })
      
      // Return fallback data (không có download_url, phải lấy từ database)
      return NextResponse.json({
        version_code: 1,
        version_name: '1.0',
        download_url: null, // Không fallback, phải lấy từ database
        file_size: null,
        release_notes: 'Version 1.0 - Initial release'
      })
    }
    
    const data = await response.json()
    
    // Convert relative URL to absolute URL if needed
    let downloadUrl = data.download_url
    if (downloadUrl && downloadUrl.startsWith('/')) {
      downloadUrl = `${apiUrl}${downloadUrl}`
    }
    
    return NextResponse.json({
      ...data,
      download_url: downloadUrl || null // Chỉ dùng từ database, không fallback
    })
  } catch (error) {
    console.error('Error fetching app version:', error)
    
    // Return fallback data (không có download_url, phải lấy từ database)
    return NextResponse.json({
      version_code: 1,
      version_name: '1.0',
      download_url: null, // Không fallback, phải lấy từ database
      file_size: null,
      release_notes: 'Version 1.0 - Initial release'
    })
  }
}

