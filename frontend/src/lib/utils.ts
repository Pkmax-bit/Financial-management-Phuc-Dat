import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for the application
export const formatCurrency = (amount: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const formatDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('vi-VN')
}

export const formatDateTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('vi-VN')
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const capitalizeWords = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substr(0, 2)
}

export const downloadFile = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

export const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const getFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (filename: string) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const extension = getFileExtension(filename)
  return imageExtensions.includes(extension)
}

export const isDocumentFile = (filename: string) => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  const extension = getFileExtension(filename)
  return documentExtensions.includes(extension)
}

export const parseCSV = (csvText: string) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(header => header.trim())
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim())
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })
  return data
}

export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}

export const exportToJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  downloadFile(blob, filename)
}

export const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  }
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export const getPriorityColor = (priority: string) => {
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  
  return priorityColors[priority.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export const getTypeColor = (type: string) => {
  const typeColors: Record<string, string> = {
    individual: 'bg-purple-100 text-purple-800',
    company: 'bg-blue-100 text-blue-800',
    government: 'bg-red-100 text-red-800',
    invoice: 'bg-blue-100 text-blue-800',
    payment: 'bg-green-100 text-green-800',
    estimate: 'bg-yellow-100 text-yellow-800',
    receipt: 'bg-purple-100 text-purple-800',
    credit: 'bg-orange-100 text-orange-800',
    refund: 'bg-red-100 text-red-800',
  }
  
  return typeColors[type.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export const calculateAge = (birthDate: string | Date) => {
  const today = new Date()
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export const calculateDaysBetween = (date1: string | Date, date2: string | Date) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const timeDiff = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export const isToday = (date: string | Date) => {
  const today = new Date()
  const checkDate = typeof date === 'string' ? new Date(date) : date
  return checkDate.toDateString() === today.toDateString()
}

export const isThisWeek = (date: string | Date) => {
  const today = new Date()
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  return checkDate >= startOfWeek && checkDate <= endOfWeek
}

export const isThisMonth = (date: string | Date) => {
  const today = new Date()
  const checkDate = typeof date === 'string' ? new Date(date) : date
  return checkDate.getMonth() === today.getMonth() && checkDate.getFullYear() === today.getFullYear()
}

export const isThisYear = (date: string | Date) => {
  const today = new Date()
  const checkDate = typeof date === 'string' ? new Date(date) : date
  return checkDate.getFullYear() === today.getFullYear()
}

export const getRelativeTime = (date: string | Date) => {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`
}

export const validateForm = (data: Record<string, any>, rules: Record<string, any>) => {
  const errors: Record<string, string> = {}
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field]
    const value = data[field]
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.message || `${field} is required`
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.message || `${field} must be no more than ${rule.maxLength} characters`
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} format is invalid`
    }
    
    if (value && rule.email && !isValidEmail(value)) {
      errors[field] = rule.message || `${field} must be a valid email`
    }
    
    if (value && rule.phone && !isValidPhone(value)) {
      errors[field] = rule.message || `${field} must be a valid phone number`
    }
  })
  
  return errors
}

export const sanitizeInput = (input: string) => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export const parseQueryString = (queryString: string) => {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  
  return result
}

export const buildQueryString = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      searchParams.append(key, params[key].toString())
    }
  })
  
  return searchParams.toString()
}
