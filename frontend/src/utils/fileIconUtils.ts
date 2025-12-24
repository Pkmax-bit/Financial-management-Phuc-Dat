/**
 * Utility functions for file icons
 * Ensures icons are loaded correctly in both development and production
 */

/**
 * Get the path to a file icon
 * Uses absolute path from public folder for Next.js
 */
export const getFileIconPath = (iconName: string): string => {
  // In Next.js, files in public/ are served from root
  // Use absolute path starting with /
  return `/icon/${iconName}`
}

/**
 * Get file icon path based on file type or extension
 */
export const getFileIconByType = (fileType: string, fileName?: string): string | null => {
  if (!fileName && !fileType) return null

  const type = fileType?.toLowerCase() || ''
  const name = fileName?.toLowerCase() || ''

  // Extract file extension from name (handle query params and spaces)
  const getExtension = (filename: string): string => {
    // Remove query params and decode if needed
    const cleanName = filename.split('?')[0].trim()
    const match = cleanName.match(/\.([a-z0-9]+)$/i)
    return match ? match[1].toLowerCase() : ''
  }
  const extension = getExtension(name)

  // Check by file extension first (more reliable)
  // PDF
  if (extension === 'pdf' || type === 'application/pdf' || name.includes('.pdf')) {
    return getFileIconPath('pdf.png')
  }

  // Excel files - check extension first
  if (['xls', 'xlsx', 'xlsm', 'xlsb'].includes(extension) || name.includes('.xls')) {
    return getFileIconPath('Excel.png')
  }
  // Then check MIME type
  if (
    type.includes('spreadsheet') ||
    type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel.sheet.macroenabled.12'
  ) {
    return getFileIconPath('Excel.png')
  }

  // Word files - check extension first
  if (['doc', 'docx', 'docm'].includes(extension) || name.includes('.doc')) {
    return getFileIconPath('doc.png')
  }
  // Then check MIME type
  if (
    type.includes('word') ||
    type === 'application/msword' ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/vnd.ms-word.document.macroenabled.12'
  ) {
    return getFileIconPath('doc.png')
  }

  // Images - return null to use ImageIcon component
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension) ||
    type.startsWith('image/')
  ) {
    return null
  }

  // Default - return null to use File icon component
  return null
}

/**
 * Get file icon path from URL
 * Extracts filename from URL and determines icon type
 */
export const getFileIconFromUrl = (url: string): string | null => {
  try {
    // Extract filename from URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || ''
    
    return getFileIconByType('', fileName)
  } catch {
    // If URL parsing fails, try to extract filename from string
    const fileName = url.split('/').pop()?.split('?')[0] || ''
    return getFileIconByType('', fileName)
  }
}

