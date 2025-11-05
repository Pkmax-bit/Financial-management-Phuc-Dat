'use client'

import { useState, useEffect } from 'react'
import { X, Send, Loader2, Edit2, Save, Plus, Trash2 } from 'lucide-react'

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
    rawHtml?: string
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

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchPreview()
    }
  }, [isOpen, quoteId])

  // Update preview when payment terms or additional notes change during editing
  useEffect(() => {
    if (isEditing && originalHtml) {
      let updated = updatePreviewWithPaymentTerms(originalHtml)
      updated = updatePreviewWithAdditionalNotes(updated)
      setHtmlContent(updated)
    }
  }, [paymentTerms, additionalNotes, isEditing, originalHtml])

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

      const response = await fetch(`http://localhost:8000/api/sales/quotes/${quoteId}/preview`, {
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
      
      // Load draft data if available
      if (result.draft) {
        if (result.draft.custom_payment_terms && Array.isArray(result.draft.custom_payment_terms)) {
          setPaymentTerms(result.draft.custom_payment_terms)
          console.log('📝 Loaded draft payment terms:', result.draft.custom_payment_terms)
        }
        if (result.draft.additional_notes) {
          setAdditionalNotes(result.draft.additional_notes)
          console.log('📝 Loaded draft additional notes:', result.draft.additional_notes)
        }
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
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Xem trước & Chỉnh sửa email báo giá</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (isEditing) {
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
                    
                    // Prepare request body
                    const requestBody: any = {}
                    if (paymentTerms && paymentTerms.length > 0) {
                      requestBody.custom_payment_terms = paymentTerms
                    }
                    if (additionalNotes && additionalNotes.trim()) {
                      requestBody.additional_notes = additionalNotes.trim()
                    }
                    
                    console.log('📝 Saving email draft:', requestBody)
                    
                    const response = await fetch(`http://localhost:8000/api/sales/quotes/${quoteId}/email-draft`, {
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
                }
                setIsEditing(!isEditing)
              }}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {isEditing ? (
                <>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </>
              )}
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
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
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
            <div style={{ maxWidth: '900px', margin: '0 auto' }} className="space-y-4">
              {/* Editable Payment Terms */}
              {isEditing && (
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
              )}

              {/* Email Preview */}
              {htmlContent && (
                <div 
                  className="bg-white rounded-lg shadow-sm p-4"
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                    className="email-preview"
                  />
                </div>
              )}

              {/* Additional Notes Editor */}
              {isEditing && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm ghi chú trước khi gửi</h3>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black min-h-[100px]"
                    placeholder="Nhập thêm ghi chú hoặc thông tin bổ sung sẽ được thêm vào email..."
                  />
                </div>
              )}
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
            onClick={() => {
              // Require saving edits before sending
              if (isEditing) {
                alert('Vui lòng lưu chỉnh sửa trước khi gửi email.');
                return;
              }
              
              // Send with current data and the exact preview HTML
              onConfirmSend({
                paymentTerms,
                additionalNotes,
                rawHtml: htmlContent
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

