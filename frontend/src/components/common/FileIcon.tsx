'use client'

import { useState } from 'react'
import { File, FileText, Image as ImageIcon } from 'lucide-react'
import { getFileIconByType, getFileIconFromUrl } from '@/utils/fileIconUtils'

interface FileIconProps {
  fileType?: string
  fileName?: string
  fileUrl?: string
  className?: string
  size?: number
  fallback?: React.ReactNode
}

/**
 * FileIcon component that displays file icons with fallback
 * Handles both static file paths and URLs
 */
export default function FileIcon({
  fileType,
  fileName,
  fileUrl,
  className = 'h-5 w-5',
  size,
  fallback
}: FileIconProps) {
  const [iconError, setIconError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Determine icon path
  let iconPath: string | null = null
  if (fileUrl) {
    iconPath = getFileIconFromUrl(fileUrl)
  } else if (fileType || fileName) {
    iconPath = getFileIconByType(fileType || '', fileName)
  }

  // If no icon path or error loading (after retries), use fallback
  if (!iconPath || (iconError && retryCount >= 2)) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Default fallback based on file type
    const type = fileType?.toLowerCase() || ''
    const name = fileName?.toLowerCase() || ''
    
    if (
      type.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].some(ext =>
        name.endsWith(`.${ext}`)
      )
    ) {
      return <ImageIcon className={className} size={size} />
    }

    return <File className={className} size={size} />
  }

  // Render icon image with error handling
  return (
    <img
      src={iconPath}
      alt={fileName || 'File icon'}
      className={className}
      style={size ? { width: size, height: size } : undefined}
      key={`${iconPath}-${retryCount}`}
      onError={() => {
        console.warn(`Failed to load icon: ${iconPath} (attempt ${retryCount + 1})`)
        if (retryCount < 2) {
          // Retry with a slight delay
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            setIconError(false)
          }, 100)
        } else {
          setIconError(true)
        }
      }}
      onLoad={() => {
        setIconError(false)
        setRetryCount(0)
      }}
    />
  )
}


