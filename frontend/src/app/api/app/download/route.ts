import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * API Route để serve APK file
 * 
 * Có 2 cách sử dụng:
 * 1. Serve file từ public folder (nếu APK được đặt trong public/app/)
 * 2. Redirect đến external URL (nếu APK được host ở nơi khác)
 */

export async function GET(request: NextRequest) {
  try {
    // Option 1: Serve từ public folder
    // Đặt APK file tại: public/app/financial-management-release.apk
    const apkPath = join(process.cwd(), 'public', 'app', 'financial-management-release.apk')
    
    try {
      const fileBuffer = await readFile(apkPath)
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="financial-management-release.apk"',
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      // File không tồn tại, fallback sang redirect
      console.warn('APK file not found in public folder, using redirect:', fileError)
    }

    // Option 2: Redirect đến external URL
    // Cấu hình trong .env.local: NEXT_PUBLIC_APP_DOWNLOAD_URL
    const externalUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || 
                       process.env.APP_DOWNLOAD_URL
    
    if (!externalUrl) {
      return NextResponse.json(
        { error: 'APK file not found and no download URL configured' },
        { status: 404 }
      )
    }
    
    // Google Drive direct download link
    // Convert share link: https://drive.google.com/file/d/FILE_ID/view
    // To direct: https://drive.google.com/uc?export=download&id=FILE_ID
    return NextResponse.redirect(externalUrl, { status: 302 })
    
  } catch (error) {
    console.error('Error serving APK:', error)
    return NextResponse.json(
      { error: 'Failed to serve APK file' },
      { status: 500 }
    )
  }
}

