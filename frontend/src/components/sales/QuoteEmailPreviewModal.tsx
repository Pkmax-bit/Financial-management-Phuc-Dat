'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, Edit2, Save, Plus, Trash2, Upload, Image as ImageIcon, File, Paperclip } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

interface PaymentTermItem {
  description: string
  amount: string
  received: boolean
}

interface QuoteEmailPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  quoteId: string
  onConfirmSend: (customData?: {
    paymentTerms?: PaymentTermItem[]
    additionalNotes?: string
    defaultNotes?: string[]
    companyName?: string
    companyShowroom?: string
    companyFactory?: string
    companyWebsite?: string
    companyHotline?: string
    companyLogoUrl?: string
    companyLogoBase64?: string
    bankAccountName?: string
    bankAccountNumber?: string
    bankName?: string
    bankBranch?: string
    rawHtml?: string
    attachments?: Array<{
      name: string
      content: string // base64 encoded file content
      mimeType: string
    }>
  }) => void
}

export default function QuoteEmailPreviewModal({
  isOpen,
  onClose,
  quoteId,
  onConfirmSend
}: QuoteEmailPreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermItem[]>([
    { description: 'CỌC ĐỢT 1 : LÊN THIẾT KẾ 3D', amount: '', received: false },
    { description: 'CỌC ĐỢT 2: 50% KÍ HỢP ĐỒNG, RA ĐƠN SẢN XUẤT', amount: '', received: false },
    { description: 'CÒN LẠI : KHI BÀN GIAO VÀ KIỂM TRA NGHIỆM THU CÔNG TRÌNH', amount: '', received: false }
  ])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [originalHtml, setOriginalHtml] = useState<string>('')
  
  // Default notes (GHI CHÚ section)
  const [defaultNotes, setDefaultNotes] = useState<string[]>([
    'Nếu phụ kiện, thiết bị của khách hàng mà CTy lắp sẽ tính công 200k/1 bộ',
    'Giá đã bao gồm nhân công lắp đặt trọn gói trong khu vực TPHCM',
    'Giá chưa bao gồm Thuế GTGT 10%',
    'Thời gian lắp đặt từ 7 - 9 ngày, không tính chủ nhật hoặc ngày Lễ',
    'Bản vẽ 3D mang tính chất minh họa (giống thực tế 80% - 90%)',
    'Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao'
  ])
  
  // Company info fields
  const [companyName, setCompanyName] = useState('')
  const [companyShowroom, setCompanyShowroom] = useState('')
  const [companyFactory, setCompanyFactory] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyHotline, setCompanyHotline] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [companyLogoBase64, setCompanyLogoBase64] = useState('')
  
  // Bank info fields
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  
  // File attachments
  interface FileAttachment {
    id: string
    name: string
    size: number
    file: File
    base64?: string
  }
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // Update preview HTML when payment terms change
  const updatePreviewWithPaymentTerms = (html: string): string => {
    // Generate new payment terms HTML rows
    const newPaymentTermsRows = paymentTerms.map(term => `
      <tr style="background: #ffd700;">
        <td style="padding: 10px; border: 1px solid #000; font-weight:bold; color:#000000;">${term.description || ''}</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #000; color:#000000;">${term.amount || ''}</td>
        <td style="padding: 10px; text-align: center; border: 1px solid #000; color:#000000;">${term.received ? 'ĐÃ NHẬN' : ''}</td>
      </tr>
    `).join('')
    
    // Try to replace the tbody content of payment terms table
    // Look for table after "PHƯƠNG THỨC THANH TOÁN" text
    let updatedHtml = html.replace(
      /(<div[^>]*>[\s\S]*?PHƯƠNG THỨC THANH TOÁN[\s\S]*?<\/div>[\s\S]*?<table[^>]*style="width: 100%; border-collapse: collapse;"[^>]*>[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>)([\s\S]*?)(<\/tbody>[\s\S]*?<\/table>[\s\S]*?<\/div>)/g,
      `$1${newPaymentTermsRows}$3`
    )
    
    // If the above didn't match, try a simpler pattern
    if (updatedHtml === html) {
      updatedHtml = html.replace(
        /(<tbody>[\s\S]*?)(<tr[^>]*style="background: #ffd700;"[^>]*>[\s\S]*?<\/tr>[\s\S]*?)(<\/tbody>)/g,
        (match, before, content, after) => {
          // Check if this is the payment terms table by looking for "CỌC ĐỢT" or "CÒN LẠI"
          if (match.includes('CỌC ĐỢT') || match.includes('CÒN LẠI')) {
            return `${before}${newPaymentTermsRows}${after}`
          }
          return match
        }
      )
    }
    
    return updatedHtml
  }

  // Update preview HTML when additional notes change
  const updatePreviewWithAdditionalNotes = (html: string): string => {
    // Generate additional notes HTML if provided
    let additionalNotesHTML = ''
    if (additionalNotes && additionalNotes.trim()) {
      // Split by newlines and format as bullet points
      const lines = additionalNotes.split('\n').filter(line => line.trim())
      const bulletPoints = lines.map(line => `<p style="margin:5px 0;">• ${line.trim()}</p>`).join('')
      
      additionalNotesHTML = `
        <div style="margin-top:15px;">
          <div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">Thông tin bổ sung:</div>
          <div style="font-size:12px; color:#000000; line-height:1.8;">
            ${bulletPoints}
          </div>
        </div>
      `
    }
    
    // Try to find and replace the additional notes section
    // Look for existing additional notes section first
    let updatedHtml = html
    
    // Pattern to match existing additional notes section (old and new format)
    const existingNotesPattern = /<div style="margin-top:15px;"><div style="font-size:16px; font-weight:bold; color:#000000; margin-bottom:10px;">Thông tin bổ sung:<\/div><div style="font-size:12px; color:#000000; line-height:1\.8;">[\s\S]*?<\/div><\/div>|<div style="margin-(top|bottom):15px; padding:10px; background:#f9f9f9; border-left:4px solid #2563eb;"><p style="margin:5px 0; font-weight:bold; color:#000000;">Thông tin bổ sung:<\/p><p style="margin:5px 0; color:#000000;">[\s\S]*?<\/p><\/div>/g
    
    if (additionalNotesHTML) {
      // Replace existing section or add new one
      if (existingNotesPattern.test(html)) {
        // Replace existing
        updatedHtml = html.replace(
          existingNotesPattern,
          additionalNotesHTML.trim()
        )
      } else {
        // Add new section after the last bullet point and before "Thông tin tài khoản"
        updatedHtml = html.replace(
          /(<p style="margin:5px 0; color:#000000;">• Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao<\/p>[\s\S]*?)(<div style="margin-top:15px;">[\s\S]*?<p style="margin:5px 0; font-weight:bold; color:#000000;">\* Thông tin tài khoản)/g,
          `$1${additionalNotesHTML.trim()}$2`
        )
        
        // If pattern not found, try simpler pattern
        if (updatedHtml === html) {
          updatedHtml = html.replace(
            /(<p style="margin:5px 0; color:#000000;">• Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao<\/p>[\s\S]*?)(<div style="margin-top:15px;">)/g,
            `$1${additionalNotesHTML.trim()}$2`
          )
        }
      }
    } else {
      // Remove additional notes section if empty
      updatedHtml = html.replace(
        existingNotesPattern,
        ''
      )
    }
    
    return updatedHtml
  }

  // Ref to store debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Function to load default logo
  const loadDefaultLogo = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      // Call API to get default logo as base64
      const response = await fetch(getApiEndpoint('/api/sales/default-logo'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onloadend = () => {
          setCompanyLogoBase64(reader.result as string)
          setCompanyLogoUrl('')
        }
        reader.readAsDataURL(blob)
      }
    } catch (err) {
      console.error('Error loading default logo:', err)
    }
  }

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchPreview()
    }
  }, [isOpen, quoteId])

  // Function to fetch preview with current form data
  const fetchPreviewWithCurrentData = async () => {
    if (!quoteId || !isOpen) return
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      // Prepare request body with current form data
      const requestBody: any = {}
      
      // Always send payment terms (even if empty, backend will use defaults)
      if (paymentTerms && Array.isArray(paymentTerms)) {
        requestBody.custom_payment_terms = paymentTerms
      } else {
        // Send default payment terms if empty
        requestBody.custom_payment_terms = [
          { description: 'CỌC ĐỢT 1 : LÊN THIẾT KẾ 3D', amount: '', received: false },
          { description: 'CỌC ĐỢT 2: 50% KÍ HỢP ĐỒNG, RA ĐƠN SẢN XUẤT', amount: '', received: false },
          { description: 'CÒN LẠI : KHI BÀN GIAO VÀ KIỂM TRA NGHIỆM THU CÔNG TRÌNH', amount: '', received: false }
        ]
      }
      if (additionalNotes && additionalNotes.trim()) {
        requestBody.additional_notes = additionalNotes.trim()
      }
      if (defaultNotes && defaultNotes.length > 0) {
        requestBody.default_notes = defaultNotes.filter(note => note && note.trim())
      }
      if (companyName) requestBody.company_name = companyName
      if (companyShowroom) requestBody.company_showroom = companyShowroom
      if (companyFactory) requestBody.company_factory = companyFactory
      if (companyWebsite) requestBody.company_website = companyWebsite
      if (companyHotline) requestBody.company_hotline = companyHotline
      if (companyLogoUrl) requestBody.company_logo_url = companyLogoUrl
      if (companyLogoBase64) requestBody.company_logo_base64 = companyLogoBase64
      if (bankAccountName) requestBody.bank_account_name = bankAccountName
      if (bankAccountNumber) requestBody.bank_account_number = bankAccountNumber
      if (bankName) requestBody.bank_name = bankName
      if (bankBranch) requestBody.bank_branch = bankBranch

      // Call preview API with POST to send current data
      const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/preview`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        console.error('Failed to update preview')
        return
      }

      const result = await response.json()
      
      // Replace logo src for preview
      let html = result.html
      html = html.replace(/cid:company_logo/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=')
      html = html.replace(/color:\s*#333/g, 'color: #000000')
      html = html.replace(/color:\s*#111/g, 'color: #000000')
      html = html.replace(/color:\s*#374151/g, 'color: #000000')
      
      setHtmlContent(html)
    } catch (err) {
      console.error('Error updating preview:', err)
    }
  }

  // Update preview immediately when form fields change (only frontend, no backend sync)
  useEffect(() => {
    if (!isOpen || !originalHtml) return
    
    // Update HTML directly on frontend for instant feedback (no backend call)
    let updatedHtml = originalHtml
    
    // Update payment terms directly in HTML
    if (paymentTerms && paymentTerms.length > 0) {
      updatedHtml = updatePreviewWithPaymentTerms(updatedHtml)
    }
    
    // Update additional notes directly in HTML
    if (additionalNotes) {
      updatedHtml = updatePreviewWithAdditionalNotes(updatedHtml)
    }
    
    // Update preview immediately with direct HTML update (no backend sync)
    setHtmlContent(updatedHtml)
  }, [
    paymentTerms, 
    additionalNotes,
    isOpen,
    originalHtml
  ])

  const fetchPreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/preview`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to load preview')
      }

      const result = await response.json()
      
      // Load customization data if available
      if (result.customization) {
        const customization = result.customization
        
        // Payment terms
        if (customization.custom_payment_terms && Array.isArray(customization.custom_payment_terms)) {
          setPaymentTerms(customization.custom_payment_terms)
          console.log('📝 Loaded customization payment terms:', customization.custom_payment_terms)
        }
        
        // Additional notes
        if (customization.additional_notes) {
          setAdditionalNotes(customization.additional_notes)
          console.log('📝 Loaded customization additional notes:', customization.additional_notes)
        }
        
        // Default notes (GHI CHÚ section) - load from company_info JSONB
        if (customization.company_info) {
          try {
            const companyInfo = typeof customization.company_info === 'string' 
              ? JSON.parse(customization.company_info) 
              : customization.company_info
            if (companyInfo && companyInfo.default_notes && Array.isArray(companyInfo.default_notes)) {
              setDefaultNotes(companyInfo.default_notes)
              console.log('📝 Loaded customization default notes:', companyInfo.default_notes)
            }
          } catch (e) {
            console.error('Error parsing company_info:', e)
          }
        }
        
        // Company info
        if (customization.company_name) setCompanyName(customization.company_name)
        if (customization.company_showroom) setCompanyShowroom(customization.company_showroom)
        if (customization.company_factory) setCompanyFactory(customization.company_factory)
        if (customization.company_website) setCompanyWebsite(customization.company_website)
        if (customization.company_hotline) setCompanyHotline(customization.company_hotline)
        if (customization.company_logo_url) setCompanyLogoUrl(customization.company_logo_url)
        if (customization.company_logo_base64) setCompanyLogoBase64(customization.company_logo_base64)
        
        // Load default logo if no logo is set
        if (!customization.company_logo_url && !customization.company_logo_base64) {
          loadDefaultLogo()
        }
        
        // Bank info
        if (customization.bank_account_name) setBankAccountName(customization.bank_account_name)
        if (customization.bank_account_number) setBankAccountNumber(customization.bank_account_number)
        if (customization.bank_name) setBankName(customization.bank_name)
        if (customization.bank_branch) setBankBranch(customization.bank_branch)
      }
      
      // Replace logo src for preview (use placeholder or base64)
      // For now, we'll use a placeholder or remove the cid: reference
      let html = result.html
      // Replace cid:company_logo with a placeholder or remove it
      html = html.replace(/cid:company_logo/g, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=')
      
      // Make text color black
      html = html.replace(/color:\s*#333/g, 'color: #000000')
      html = html.replace(/color:\s*#111/g, 'color: #000000')
      html = html.replace(/color:\s*#374151/g, 'color: #000000')
      
      // Store original HTML for later updates
      setOriginalHtml(html)
      setHtmlContent(html)
    } catch (err: any) {
      setError(err.message || 'Failed to load email preview')
      console.error('Error fetching preview:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white shadow-xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Xem trước & Chỉnh sửa email báo giá</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                // Always save when clicking save button
                  // Update preview before saving
                  if (originalHtml) {
                    let updatedHtml = updatePreviewWithPaymentTerms(originalHtml)
                    updatedHtml = updatePreviewWithAdditionalNotes(updatedHtml)
                    setHtmlContent(updatedHtml)
                    // Also update originalHtml so the preview stays updated
                    setOriginalHtml(updatedHtml)
                  }
                  
                  // Save draft to backend
                  try {
                    setLoading(true)
                    const { createClient } = await import('@supabase/supabase-js')
                    const supabase = createClient(
                      process.env.NEXT_PUBLIC_SUPABASE_URL!,
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    )
                    
                    const session = await supabase.auth.getSession()
                    const token = session.data.session?.access_token
                    
                    // Prepare request body with all customization fields
                    const requestBody: any = {}
                    
                    // Payment terms
                    if (paymentTerms && paymentTerms.length > 0) {
                      requestBody.custom_payment_terms = paymentTerms
                    }
                    
                    // Additional notes
                    if (additionalNotes && additionalNotes.trim()) {
                      requestBody.additional_notes = additionalNotes.trim()
                    }
                    
                    // Default notes (GHI CHÚ section)
                    if (defaultNotes && defaultNotes.length > 0) {
                      requestBody.default_notes = defaultNotes.filter(note => note && note.trim())
                    }
                    
                    // Company info
                    if (companyName) requestBody.company_name = companyName
                    if (companyShowroom) requestBody.company_showroom = companyShowroom
                    if (companyFactory) requestBody.company_factory = companyFactory
                    if (companyWebsite) requestBody.company_website = companyWebsite
                    if (companyHotline) requestBody.company_hotline = companyHotline
                    if (companyLogoUrl) requestBody.company_logo_url = companyLogoUrl
                    if (companyLogoBase64) requestBody.company_logo_base64 = companyLogoBase64
                    
                    // Bank info
                    if (bankAccountName) requestBody.bank_account_name = bankAccountName
                    if (bankAccountNumber) requestBody.bank_account_number = bankAccountNumber
                    if (bankName) requestBody.bank_name = bankName
                    if (bankBranch) requestBody.bank_branch = bankBranch
                    
                    console.log('📝 Saving email draft:', requestBody)
                    
                    const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/email-draft`), {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(requestBody)
                    })
                    
                    if (!response.ok) {
                      const errorData = await response.json()
                      console.error('❌ Failed to save draft:', errorData)
                      setError(`Lưu draft thất bại: ${errorData.detail || 'Unknown error'}`)
                    } else {
                      const result = await response.json()
                      console.log('✅ Draft saved successfully:', result)
                      setError(null)
                      // Reload preview from backend so the HTML reflects server rendering immediately
                      await fetchPreview()
                    }
                  } catch (err) {
                    console.error('❌ Error saving draft:', err)
                    setError(`Lỗi khi lưu draft: ${err instanceof Error ? err.message : 'Unknown error'}`)
                  } finally {
                    setLoading(false)
                  }
              }}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Đang tải preview...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-600 text-center">
                <p className="font-semibold">Lỗi khi tải preview</p>
                <p className="text-sm mt-2">{error}</p>
                <button
                  onClick={fetchPreview}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex gap-4 h-full flex-1 overflow-hidden">
              {/* Left side: Email Preview */}
              <div className="flex-1 overflow-auto pr-4 p-4">
                {htmlContent && (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div 
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      className="email-preview"
                    />
                  </div>
                )}
              </div>

              {/* Right side: Edit Forms (always visible) */}
              <div className="w-[450px] flex-shrink-0 overflow-y-auto p-4 space-y-4 bg-gray-50 border-l border-gray-200">
                {/* Reset to Default Button */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-orange-200">
                  <button
                    type="button"
                    onClick={async () => {
                      // Reset all fields to default
                      setCompanyName('')
                      setCompanyShowroom('')
                      setCompanyFactory('')
                      setCompanyWebsite('')
                      setCompanyHotline('')
                      setCompanyLogoUrl('')
                      setCompanyLogoBase64('')
                      setBankAccountName('')
                      setBankAccountNumber('')
                      setBankName('')
                      setBankBranch('')
                      setAdditionalNotes('')
                      setAttachments([])
                      setDefaultNotes([
                        'Nếu phụ kiện, thiết bị của khách hàng mà CTy lắp sẽ tính công 200k/1 bộ',
                        'Giá đã bao gồm nhân công lắp đặt trọn gói trong khu vực TPHCM',
                        'Giá chưa bao gồm Thuế GTGT 10%',
                        'Thời gian lắp đặt từ 7 - 9 ngày, không tính chủ nhật hoặc ngày Lễ',
                        'Bản vẽ 3D mang tính chất minh họa (giống thực tế 80% - 90%)',
                        'Khách hàng sẽ kiểm tra lại thông tin sau khi lắp đặt hoàn thiện và bàn giao'
                      ])
                      setPaymentTerms([
                        { description: 'CỌC ĐỢT 1 : LÊN THIẾT KẾ 3D', amount: '', received: false },
                        { description: 'CỌC ĐỢT 2: 50% KÍ HỢP ĐỒNG, RA ĐƠN SẢN XUẤT', amount: '', received: false },
                        { description: 'CÒN LẠI : KHI BÀN GIAO VÀ KIỂM TRA NGHIỆM THU CÔNG TRÌNH', amount: '', received: false }
                      ])
                      
                      // Load default logo
                      await loadDefaultLogo()
                      
                      // Reload preview from backend
                      await fetchPreview()
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Quay về mặc định
                  </button>
                </div>

                {/* Company Info Editor */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin công ty</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Công Ty TNHH Nhôm Kính Phúc Đạt"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Showroom</label>
                      <input
                        type="text"
                        value={companyShowroom}
                        onChange={(e) => setCompanyShowroom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="480/3 Tân Kỳ Tân Quý, P. Sơn Kỳ, Q. Tân Phú, TP.HCM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Xưởng sản xuất</label>
                      <input
                        type="text"
                        value={companyFactory}
                        onChange={(e) => setCompanyFactory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="334/6A Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input
                          type="text"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="https://www.kinhphucdat.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
                        <input
                          type="text"
                          value={companyHotline}
                          onChange={(e) => setCompanyHotline(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="0901.116.118"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                      <div className="space-y-3">
                        {/* Logo Preview */}
                        {(companyLogoBase64 || companyLogoUrl) && (
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <img 
                              src={companyLogoBase64 || companyLogoUrl} 
                              alt="Company Logo" 
                              className="h-16 w-auto object-contain border border-gray-300 rounded"
                              onError={(e) => {
                                // Fallback nếu không load được
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600">
                                {companyLogoBase64 ? 'Logo (Base64)' : 'Logo (URL)'}
                              </p>
                              <button
                                onClick={() => {
                                  setCompanyLogoBase64('')
                                  setCompanyLogoUrl('')
                                }}
                                className="mt-1 text-xs text-red-600 hover:text-red-800"
                              >
                                Xóa logo
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Upload File */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Tải lên logo từ file:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Resize image if too large
                                const maxWidth = 300 // Max width for logo in email
                                const maxHeight = 100 // Max height for logo in email
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  const img = new Image()
                                  img.onload = () => {
                                    // Calculate new dimensions
                                    let width = img.width
                                    let height = img.height
                                    
                                    // Resize if too large
                                    if (width > maxWidth || height > maxHeight) {
                                      const ratio = Math.min(maxWidth / width, maxHeight / height)
                                      width = Math.round(width * ratio)
                                      height = Math.round(height * ratio)
                                    }
                                    
                                    // Create canvas to resize
                                    const canvas = document.createElement('canvas')
                                    canvas.width = width
                                    canvas.height = height
                                    const ctx = canvas.getContext('2d')
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, width, height)
                                      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9)
                                      setCompanyLogoBase64(resizedBase64)
                                      setCompanyLogoUrl('') // Clear URL khi upload file
                                    } else {
                                      // Fallback: use original if canvas not available
                                      const base64String = reader.result as string
                                      setCompanyLogoBase64(base64String)
                                      setCompanyLogoUrl('')
                                    }
                                  }
                                  img.onerror = () => {
                                    // Fallback: use original if image load fails
                                    const base64String = reader.result as string
                                    setCompanyLogoBase64(base64String)
                                    setCompanyLogoUrl('')
                                  }
                                  img.src = reader.result as string
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        
                        {/* Logo URL */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Hoặc nhập URL logo:</label>
                          <input
                            type="text"
                            value={companyLogoUrl}
                            onChange={(e) => {
                              setCompanyLogoUrl(e.target.value)
                              setCompanyLogoBase64('') // Clear base64 khi nhập URL
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        
                        {/* Default Logo Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            // Load default logo from backend
                            try {
                              const { createClient } = await import('@supabase/supabase-js')
                              const supabase = createClient(
                                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                              )
                              
                              const session = await supabase.auth.getSession()
                              const token = session.data.session?.access_token
                              
                              // Call API to get default logo as base64
                              const response = await fetch(getApiEndpoint('/api/sales/default-logo'), {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              
                              if (response.ok) {
                                const blob = await response.blob()
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setCompanyLogoBase64(reader.result as string)
                                  setCompanyLogoUrl('')
                                }
                                reader.readAsDataURL(blob)
                              } else {
                                // Fallback: Set default path
                                setCompanyLogoUrl('C:\\Projects\\Financial-management-PhucDat\\image\\logo_phucdat.jpg')
                              }
                            } catch (err) {
                              console.error('Error loading default logo:', err)
                              // Fallback: Set default path
                              setCompanyLogoUrl('C:\\Projects\\Financial-management-PhucDat\\image\\logo_phucdat.jpg')
                            }
                          }}
                          className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Sử dụng logo mặc định
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>

              {/* Editable Payment Terms */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa phương thức thanh toán</h3>
                    <button
                      onClick={() => {
                        setPaymentTerms([...paymentTerms, { description: '', amount: '', received: false }])
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm hàng
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-yellow-100">
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Giá tiền</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900">Đã nhận</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentTerms.map((term, index) => (
                          <tr key={index} className="bg-yellow-50 hover:bg-yellow-100">
                            <td className="border border-gray-300 px-3 py-2">
                              <input
                                type="text"
                                value={term.description}
                                onChange={(e) => {
                                  const newTerms = [...paymentTerms]
                                  newTerms[index].description = e.target.value
                                  setPaymentTerms(newTerms)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                                placeholder="Nhập mô tả..."
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <input
                                type="text"
                                value={term.amount}
                                onChange={(e) => {
                                  const newTerms = [...paymentTerms]
                                  newTerms[index].amount = e.target.value
                                  setPaymentTerms(newTerms)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm text-right"
                                placeholder="0"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={term.received}
                                onChange={(e) => {
                                  const newTerms = [...paymentTerms]
                                  newTerms[index].received = e.target.checked
                                  setPaymentTerms(newTerms)
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <button
                                onClick={() => {
                                  if (paymentTerms.length > 1) {
                                    setPaymentTerms(paymentTerms.filter((_, i) => i !== index))
                                  }
                                }}
                                disabled={paymentTerms.length === 1}
                                className="p-1.5 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Xóa hàng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bank Info Editor */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tài khoản ngân hàng</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="CÔNG TY TNHH NHÔM KÍNH PHÚC ĐẠT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="197877019"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên ngân hàng</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="Ngân Hàng TMCP Á Châu (ACB)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
                        <input
                          type="text"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="PGD Gò Mây"
                  />
                </div>
                    </div>
                  </div>
                  </div>

                {/* Default Notes Editor (GHI CHÚ section) */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa GHI CHÚ</h3>
                      <button
                        onClick={() => {
                          setDefaultNotes([...defaultNotes, ''])
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm ghi chú
                      </button>
                    </div>
                    <div className="space-y-2">
                      {defaultNotes.map((note, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm w-6">•</span>
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => {
                              const newNotes = [...defaultNotes]
                              newNotes[index] = e.target.value
                              setDefaultNotes(newNotes)
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                            placeholder="Nhập ghi chú..."
                          />
                          <button
                            onClick={() => {
                              if (defaultNotes.length > 1) {
                                setDefaultNotes(defaultNotes.filter((_, i) => i !== index))
                              }
                            }}
                            disabled={defaultNotes.length === 1}
                            className="p-1.5 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Xóa ghi chú"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

              {/* Additional Notes Editor */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm ghi chú trước khi gửi</h3>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black min-h-[100px]"
                    placeholder="Nhập thêm ghi chú hoặc thông tin bổ sung sẽ được thêm vào email..."
                  />
                </div>

                {/* File Attachments Editor */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Tài liệu đính kèm
                  </h3>
                  <div className="space-y-3">
                    {/* Upload File */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thêm file tài liệu:
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            const newAttachments: FileAttachment[] = []
                            for (const file of files) {
                              // Convert file to base64
                              const base64 = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  const result = reader.result as string
                                  // Remove data:...;base64, prefix
                                  const base64Data = result.split(',')[1] || result
                                  resolve(base64Data)
                                }
                                reader.onerror = reject
                                reader.readAsDataURL(file)
                              })
                              
                              newAttachments.push({
                                id: `${Date.now()}-${Math.random()}`,
                                name: file.name,
                                size: file.size,
                                file: file,
                                base64: base64
                              })
                            }
                            setAttachments([...attachments, ...newAttachments])
                            // Reset input
                            e.target.value = ''
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Có thể chọn nhiều file cùng lúc. File sẽ được đính kèm vào email.
                      </p>
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Danh sách file đính kèm ({attachments.length}):
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(attachment.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setAttachments(attachments.filter(a => a.id !== attachment.id))
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Xóa file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={async () => {
              // Convert attachments to base64 format for sending
              const attachmentData = await Promise.all(
                attachments.map(async (attachment) => {
                  // Get MIME type from file
                  const mimeType = attachment.file.type || 'application/octet-stream'
                  return {
                    name: attachment.name,
                    content: attachment.base64 || '',
                    mimeType: mimeType
                  }
                })
              )

              // Send with all current customization data
              onConfirmSend({
                paymentTerms,
                additionalNotes,
                defaultNotes: defaultNotes.filter(note => note && note.trim()),
                companyName,
                companyShowroom,
                companyFactory,
                companyWebsite,
                companyHotline,
                companyLogoUrl,
                companyLogoBase64,
                bankAccountName,
                bankAccountNumber,
                bankName,
                bankBranch,
                rawHtml: htmlContent,
                attachments: attachmentData.length > 0 ? attachmentData : undefined
              })
            }}
            disabled={loading || !!error}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Gửi email
          </button>
        </div>
      </div>
    </div>
  )
}

