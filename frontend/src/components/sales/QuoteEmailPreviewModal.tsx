'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Send, Loader2, Save, Plus, Trash2, Image as ImageIcon, File, Paperclip, CircleHelp, Download, DollarSign, TestTube } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'
import { useSidebar } from '@/components/LayoutWithSidebar'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  onQuoteStatusUpdated?: () => void // Callback để refresh danh sách quotes
  onConvertToInvoice?: (quoteId: string) => void // Callback để chuyển đổi thành hóa đơn
}

export default function QuoteEmailPreviewModal({
  isOpen,
  onClose,
  quoteId,
  onConfirmSend,
  onQuoteStatusUpdated,
  onConvertToInvoice
}: QuoteEmailPreviewModalProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null)
  const [pdfDownloaded, setPdfDownloaded] = useState(false) // Track if PDF was successfully downloaded
  const [quoteStatus, setQuoteStatus] = useState<string>('draft') // Track quote status
  const [projectName, setProjectName] = useState<string>('') // Track project name for PDF filename
  const [projectId, setProjectId] = useState<string>('') // Track project ID for PDF filename
  const previewRef = useRef<HTMLDivElement>(null)
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

  // Tour state
  const EMAIL_FORM_TOUR_STORAGE_KEY = 'email-form-tour-status-v1'
  const [isEmailTourRunning, setIsEmailTourRunning] = useState(false)
  const emailTourRef = useRef<any>(null)
  const emailShepherdRef = useRef<any>(null)
  const emailTourAutoStartAttemptedRef = useRef(false)
  type EmailShepherdModule = typeof import('shepherd.js')
  type EmailShepherdType = EmailShepherdModule & { Tour: new (...args: any[]) => any }
  type EmailShepherdTour = InstanceType<EmailShepherdType['Tour']>

  const { hideSidebar } = useSidebar()

  useEffect(() => {
    if (isOpen) {
      hideSidebar(true)
    } else {
      hideSidebar(false)
    }

    return () => {
      hideSidebar(false)
    }
  }, [isOpen, hideSidebar])

  const normalizeMeasurementUnits = (html: string): string => {
    if (!html) return html
    let updated = html

    // Replace unit labels from meters to millimeters
    updated = updated.replace(/NGANG\s*\(m\)/g, 'NGANG (mm)')
    updated = updated.replace(/SÂU\s*\(m\)/g, 'SÂU (mm)')
    updated = updated.replace(/CAO\s*\(m\)/g, 'CAO (mm)')
    updated = updated.replace(/KHỐI LƯỢNG\s*\(m\)/g, 'KHỐI LƯỢNG (mm)')

    // Remove trailing zeros in measurement values (e.g., 2000.00 -> 2000)
    updated = updated.replace(/(\d+)\.(\d+)(?=\s*(mm|m)([^a-zA-Z]|$))/g, (_match, intPart, decimalPart) => {
      const trimmed = decimalPart.replace(/0+$/, '')
      return trimmed ? `${intPart}.${trimmed}` : `${intPart}`
    })

    updated = updated.replace(/(\d+)\.(\d+)(?=<\/td>)/g, (_match, intPart, decimalPart) => {
      const trimmed = decimalPart.replace(/0+$/, '')
      return trimmed ? `${intPart}.${trimmed}` : `${intPart}`
    })

    return updated
  }

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

  // Function to load default logo
  const loadDefaultLogo = useCallback(async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      // Use fallback values if environment variables are not set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      
      if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
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
  }, [])

  const fetchPreview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      // Use fallback values if environment variables are not set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      
      if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      // Fetch quote status, project name and project ID
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          status,
          project_id,
          projects:project_id(name)
        `)
        .eq('id', quoteId)
        .single()
      
      if (!quoteError && quoteData) {
        setQuoteStatus(quoteData.status || 'draft')
        setProjectId(quoteData.project_id || '')
        
        // Get project name
        const project = quoteData.projects as any
        if (project) {
          if (Array.isArray(project) && project.length > 0 && project[0]?.name) {
            setProjectName(String(project[0].name))
          } else if (typeof project === 'object' && 'name' in project && project.name) {
            setProjectName(String(project.name))
          } else {
            setProjectName('')
          }
        } else {
          setProjectName('')
        }
      }

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
      html = normalizeMeasurementUnits(html)
      
      // Store original HTML for later updates
      setOriginalHtml(html)
      setHtmlContent(html)
    } catch (err: any) {
      setError(err.message || 'Failed to load email preview')
      console.error('Error fetching preview:', err)
    } finally {
      setLoading(false)
    }
  }, [quoteId, loadDefaultLogo])

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchPreview()
      // Reset PDF downloaded state when modal opens
      setPdfDownloaded(false)
    } else if (!isOpen) {
      // Reset state when modal closes
      setPdfDownloaded(false)
      setQuoteStatus('draft')
      setProjectName('')
      setProjectId('')
    }
  }, [isOpen, quoteId, fetchPreview])

  const startEmailTour = useCallback(async () => {
    if (!isOpen || typeof window === 'undefined') return

    if (emailTourRef.current) {
      emailTourRef.current.cancel()
      emailTourRef.current = null
    }

    if (!emailShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: EmailShepherdType })?.default ?? (module as unknown as EmailShepherdType)
        emailShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = emailShepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 20, delay = 100) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (document.querySelector(selector)) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return false
    }

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )

    await waitForElement('[data-tour-id="email-form-header"]')
    await waitForElement('[data-tour-id="email-form-preview"]')
    await waitForElement('[data-tour-id="email-form-edit-payment"]')
    await waitForElement('[data-tour-id="email-form-edit-notes"]')
    await waitForElement('[data-tour-id="email-form-send"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'email-form-intro',
      title: 'Hướng dẫn tạo và chỉnh sửa email báo giá',
      text: 'Form này giúp bạn xem trước, chỉnh sửa và gửi email báo giá cho khách hàng. Bạn có thể tùy chỉnh phương thức thanh toán, ghi chú, thông tin công ty và ngân hàng.',
      attachTo: { element: '[data-tour-id="email-form-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Bắt đầu',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'email-form-preview',
      title: 'Xem trước email',
      text: 'Bên trái hiển thị preview email sẽ được gửi cho khách hàng. Preview sẽ tự động cập nhật khi bạn chỉnh sửa các thông tin bên phải.\n\nNội dung preview bao gồm:\n• Logo công ty\n• Thông tin công ty\n• Thông tin khách hàng\n• Chi tiết báo giá (sản phẩm, số lượng, đơn giá, thành tiền)\n• Phương thức thanh toán\n• Ghi chú\n• Thông tin ngân hàng',
      attachTo: { element: '[data-tour-id="email-form-preview"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'email-form-edit-payment',
      title: 'Chỉnh sửa phương thức thanh toán',
      text: 'Các thao tác có thể thực hiện:\n• Thêm đợt thanh toán: Nhấn nút "+" để thêm đợt mới\n• Xóa đợt: Nhấn nút "X" để xóa đợt\n• Chỉnh sửa đợt:\n  - Mô tả: Mô tả đợt thanh toán (ví dụ: "Cọc đợt 1", "Còn lại")\n  - Số tiền: Số tiền của đợt (VND)\n  - Đã nhận: Đánh dấu nếu đã nhận tiền\n\nLưu ý: Bạn có thể chỉnh sửa các đợt thanh toán, số tiền và đánh dấu đã nhận.',
      attachTo: { element: '[data-tour-id="email-form-edit-payment"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'email-form-edit-notes',
      title: 'Chỉnh sửa ghi chú và thông tin',
      text: 'Bạn có thể chỉnh sửa:\n• Ghi chú mặc định (GHI CHÚ section)\n• Ghi chú bổ sung\n• Thông tin công ty (tên, showroom, nhà máy, website, hotline, logo)\n• Thông tin ngân hàng (tên tài khoản, số tài khoản, ngân hàng, chi nhánh)\n• Đính kèm file (nếu cần)',
      attachTo: { element: '[data-tour-id="email-form-edit-notes"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'email-form-save',
      title: 'Lưu chỉnh sửa',
      text: 'Nhấn "Lưu chỉnh sửa" để lưu các thay đổi vào bản nháp. Bạn có thể quay lại chỉnh sửa sau.',
      attachTo: { element: '[data-tour-id="email-form-save"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'email-form-send',
      title: 'Gửi email',
      text: 'Sau khi kiểm tra preview và chỉnh sửa xong, nhấn "Gửi email" để gửi email báo giá cho khách hàng.\n\nKết quả:\n• Email sẽ được gửi đến địa chỉ email của khách hàng đã đăng ký\n• Trạng thái báo giá sẽ được cập nhật thành "Đã gửi"\n• Thông báo xác nhận sẽ hiển thị',
      attachTo: { element: '[data-tour-id="email-form-send"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Hoàn tất',
          action: () => tour.complete()
        }
      ]
    })

    tour.on('complete', () => {
      setIsEmailTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(EMAIL_FORM_TOUR_STORAGE_KEY, 'completed')
      }
      emailTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsEmailTourRunning(false)
      emailTourRef.current = null
    })

    emailTourRef.current = tour
    setIsEmailTourRunning(true)
    tour.start()
  }, [isOpen])

  // Auto-start tour when form opens for the first time
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isOpen) return
    if (emailTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(EMAIL_FORM_TOUR_STORAGE_KEY)
    emailTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startEmailTour()
      }, 1000)
    }
  }, [isOpen, startEmailTour])

  // Reset tour auto-start when form closes
  useEffect(() => {
    if (!isOpen) {
      emailTourAutoStartAttemptedRef.current = false
    }
  }, [isOpen])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      emailTourRef.current?.cancel()
      emailTourRef.current?.destroy?.()
      emailTourRef.current = null
    }
  }, [])

  // Function to fetch preview with current form data
  const fetchPreviewWithCurrentData = async () => {
    if (!quoteId || !isOpen) return
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      // Use fallback values if environment variables are not set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      
      if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
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
      html = normalizeMeasurementUnits(html)
      
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
    setHtmlContent(normalizeMeasurementUnits(updatedHtml))
  }, [
    paymentTerms, 
    additionalNotes,
    isOpen,
    originalHtml
  ])

  // Function to update quote status to sent
  const updateQuoteStatusToSent = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      // Use fallback values if environment variables are not set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      
      if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Try using Supabase client directly first (simpler and more reliable)
      console.log('🔄 Updating quote status to sent for quote:', quoteId)
      const { data, error } = await supabase
        .from('quotes')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to update quote status via Supabase:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Fallback: Try using API endpoint if Supabase direct update fails
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        if (token) {
          try {
            const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}`), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                status: 'sent'
              })
            })

            if (!response.ok) {
              // Try to get error message
              let errorMessage = `HTTP ${response.status}`
              try {
                const errorData = await response.json()
                if (errorData && errorData.detail) {
                  errorMessage = errorData.detail
                }
              } catch (e) {
                // Response might not have JSON body
                const text = await response.text()
                if (text) {
                  errorMessage = text
                }
              }
              console.error('Failed to update quote status via API:', errorMessage)
              return false
            }

            // Success via API
            setQuoteStatus('sent')
            if (onQuoteStatusUpdated) {
              onQuoteStatusUpdated()
            }
            return true
          } catch (apiError) {
            console.error('Error updating quote status via API:', apiError)
            return false
          }
        }
        
        return false
      }

      // Success via Supabase direct update
      if (data) {
        setQuoteStatus('sent')
        if (onQuoteStatusUpdated) {
          onQuoteStatusUpdated()
        }
        return true
      }

      return false
    } catch (error) {
      console.error('Error updating quote status:', error)
      return false
    }
  }

  // Function to test send email via n8n
  const handleTestEmail = async () => {
    if (!quoteId) {
      setTestEmailResult('❌ Không tìm thấy báo giá')
      return
    }

    setTestingEmail(true)
    setTestEmailResult(null)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      // Use fallback values if environment variables are not set
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      
      if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Bạn cần đăng nhập để test email')
      }

      const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/test-email`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Gửi email test thất bại')
      }

      setTestEmailResult(`✅ ${data.message} (Provider: ${data.email_provider || 'N/A'})`)
    } catch (error: any) {
      console.error('Test email error:', error)
      setTestEmailResult(`❌ ${error.message || 'Gửi email test thất bại'}`)
    } finally {
      setTestingEmail(false)
    }
  }

  // Function to download PDF
  const handleDownloadPDF = async () => {
    if (!previewRef.current || !htmlContent) {
      console.error('Preview content not available')
      return
    }

    // Show confirmation dialog
    const shouldExit = window.confirm(
      'Bạn có muốn tải PDF báo giá? Sau khi tải thành công, trạng thái báo giá sẽ được cập nhật thành "Đã gửi" và bạn có thể duyệt báo giá thành hóa đơn.\n\nBạn có muốn tiếp tục?'
    )

    if (!shouldExit) {
      return
    }

    try {
      setIsDownloadingPDF(true)

      // Get the preview element
      const element = previewRef.current.querySelector('.email-preview') as HTMLElement
      if (!element) {
        throw new Error('Preview element not found')
      }

      // Create a temporary container with the HTML content for better PDF rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '210mm' // A4 width
      tempContainer.style.padding = '10mm' // Giảm padding để tiết kiệm không gian
      tempContainer.style.backgroundColor = '#ffffff'
      tempContainer.style.fontFamily = 'Arial, "Times New Roman", "DejaVu Sans", sans-serif' // Font tiếng Việt
      tempContainer.style.fontSize = '11pt' // Giảm font size một chút
      tempContainer.style.color = '#000000'
      
      // Ensure HTML has proper font for Vietnamese and optimize for PDF
      let htmlWithFont = htmlContent
      
      // Optimize table styles for compact display
      // Reduce padding in product table cells
      htmlWithFont = htmlWithFont.replace(
        /<td([^>]*style="[^"]*padding:\s*8px[^"]*"[^>]*)>/gi,
        '<td$1 style="padding: 3px 4px;">'
      )
      htmlWithFont = htmlWithFont.replace(
        /<th([^>]*style="[^"]*padding:\s*8px[^"]*"[^>]*)>/gi,
        '<th$1 style="padding: 4px;">'
      )
      htmlWithFont = htmlWithFont.replace(
        /<td([^>]*style="[^"]*padding:\s*10px[^"]*"[^>]*)>/gi,
        '<td$1 style="padding: 5px;">'
      )
      htmlWithFont = htmlWithFont.replace(
        /<th([^>]*style="[^"]*padding:\s*10px[^"]*"[^>]*)>/gi,
        '<th$1 style="padding: 5px;">'
      )
      
      // Reduce font size in product table
      htmlWithFont = htmlWithFont.replace(
        /<table([^>]*style="[^"]*width:\s*100%[^"]*"[^>]*)>/gi,
        (match) => {
          if (!match.includes('font-size')) {
            return match.replace('style="', 'style="font-size: 9pt; ')
          }
          return match
        }
      )
      
      // Reduce margins between sections
      htmlWithFont = htmlWithFont.replace(
        /margin:\s*20px\s*0/gi,
        'margin: 10px 0'
      )
      htmlWithFont = htmlWithFont.replace(
        /margin-top:\s*20px/gi,
        'margin-top: 10px'
      )
      htmlWithFont = htmlWithFont.replace(
        /margin-bottom:\s*20px/gi,
        'margin-bottom: 10px'
      )
      
      // Reduce padding in main content div
      htmlWithFont = htmlWithFont.replace(
        /padding:\s*20px/gi,
        'padding: 10px'
      )
      
      // Reduce header padding
      htmlWithFont = htmlWithFont.replace(
        /padding:\s*12px\s*20px\s*0\s*20px/gi,
        'padding: 8px 15px 0 15px'
      )
      
      // Make product table more compact - reduce cell height
      htmlWithFont = htmlWithFont.replace(
        /<tr([^>]*>[\s\S]*?<td[^>]*style="[^"]*padding:\s*8px[^"]*"[^>]*>)/gi,
        (match) => {
          return match.replace(/padding:\s*8px/gi, 'padding: 3px 4px')
        }
      )
      
      // Reduce line-height in product description
      htmlWithFont = htmlWithFont.replace(
        /line-height:\s*1\.8/gi,
        'line-height: 1.4'
      )
      
      // Add font-family to body if not present
      if (!htmlWithFont.includes('font-family')) {
        htmlWithFont = htmlWithFont.replace(
          /<body([^>]*)>/i,
          '<body$1 style="font-family: Arial, \'Times New Roman\', \'DejaVu Sans\', sans-serif;">'
        )
      }
      
      // Ensure all text elements have font-family
      htmlWithFont = htmlWithFont.replace(
        /style="([^"]*)"/gi,
        (match, styles) => {
          if (!styles.includes('font-family')) {
            return `style="${styles}; font-family: Arial, 'Times New Roman', 'DejaVu Sans', sans-serif;"`
          }
          return match
        }
      )
      
      tempContainer.innerHTML = htmlWithFont
      
      // Add CSS to make tables more compact
      const style = document.createElement('style')
      style.textContent = `
        /* Make product table more compact */
        table {
          font-size: 9pt !important;
          border-collapse: collapse !important;
        }
        table td, table th {
          padding: 3px 4px !important;
          font-size: 9pt !important;
        }
        /* Reduce spacing in product table rows */
        table tbody tr {
          height: auto !important;
          min-height: 20px !important;
        }
        /* Make header more compact */
        div[style*="padding: 12px"] {
          padding: 8px 15px 0 15px !important;
        }
        /* Reduce margins */
        div[style*="margin: 20px"] {
          margin: 8px 0 !important;
        }
        /* Make payment terms table compact */
        table[style*="width: 100%"] tbody tr td {
          padding: 4px 5px !important;
        }
        /* Reduce line height */
        p {
          margin: 3px 0 !important;
          line-height: 1.3 !important;
        }
        /* Compact header text */
        div[style*="font-size:20px"] {
          font-size: 16px !important;
          padding: 4px 0 !important;
        }
        div[style*="font-size:12px"] {
          font-size: 10pt !important;
        }
        div[style*="font-size:13px"] {
          font-size: 10pt !important;
        }
        div[style*="font-size:14px"] {
          font-size: 11pt !important;
        }
        div[style*="font-size:16px"] {
          font-size: 12pt !important;
        }
      `
      tempContainer.appendChild(style)
      document.body.appendChild(tempContainer)

      // Wait for images to load
      await new Promise((resolve) => {
        const images = tempContainer.querySelectorAll('img')
        if (images.length === 0) {
          resolve(null)
          return
        }
        let loadedCount = 0
        const totalImages = images.length
        images.forEach((img) => {
          if (img.complete) {
            loadedCount++
            if (loadedCount === totalImages) resolve(null)
          } else {
            img.onload = () => {
              loadedCount++
              if (loadedCount === totalImages) resolve(null)
            }
            img.onerror = () => {
              loadedCount++
              if (loadedCount === totalImages) resolve(null)
            }
          }
        })
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000)
      })

      // Convert HTML to canvas with optimized settings for PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5, // Balanced quality and size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
        windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
      })

      // Remove temporary container
      document.body.removeChild(tempContainer)

      // Calculate PDF dimensions (A4: 210mm x 297mm)
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png', 0.95) // Slightly lower quality for smaller file size
      
      // If content is taller than one page, split into multiple pages
      const pageHeight = 297 // A4 height in mm
      const pageWidth = 210 // A4 width in mm
      
      if (imgHeight <= pageHeight) {
        // Content fits on one page - perfect!
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        // Content is taller than one page - split into multiple pages
        let heightLeft = imgHeight
        let position = 0
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        
        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
      }

      // Helper function to remove Vietnamese diacritics
      const removeVietnameseDiacritics = (str: string): string => {
        if (!str) return ''
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .toLowerCase()
          .trim()
      }
      
      // Generate filename: "Báo giá - tên dự án (không dấu) - id dự án.pdf"
      const sanitizedProjectName = projectName ? removeVietnameseDiacritics(projectName) : 'Khong-du-an'
      const projectIdPart = projectId ? projectId.substring(0, 8) : 'no-id' // Use first 8 characters of project ID
      const filename = `Bao-gia-${sanitizedProjectName}-${projectIdPart}.pdf`

      // Save PDF
      pdf.save(filename)
      
      // Mark PDF as downloaded
      setPdfDownloaded(true)
      
      // Update quote status to sent after successful PDF download
      const statusUpdated = await updateQuoteStatusToSent()
      
      if (statusUpdated) {
        // Show success notification
        const successMessage = document.createElement('div')
        successMessage.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #27ae60; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 5px; 
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
          ">
            ✅ PDF đã được tải thành công!<br>
            Trạng thái báo giá đã được cập nhật thành "Đã gửi".
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `
        document.body.appendChild(successMessage)
        
        // Auto remove success message after 5 seconds
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage)
          }
        }, 5000)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Lỗi khi tạo PDF. Vui lòng thử lại.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white shadow-xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200" data-tour-id="email-form-header">
          <h2 className="text-xl font-semibold text-gray-900">Xem trước & Chỉnh sửa email báo giá</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEmailTour()}
              disabled={isEmailTourRunning || loading}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isEmailTourRunning || loading
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
              title="Bắt đầu hướng dẫn email"
            >
              <CircleHelp className="h-4 w-4" />
              <span>Hướng dẫn</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF || loading || !htmlContent}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isDownloadingPDF || loading || !htmlContent
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-green-600 hover:bg-green-700'
              }`}
              title="Tải PDF báo giá"
            >
              {isDownloadingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isDownloadingPDF ? 'Đang tạo PDF...' : 'Tải PDF'}</span>
            </button>
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
                    // Use fallback values if environment variables are not set
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
                    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
                    
                    if (!supabaseUrl) {
                      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
                    }
                    if (!supabaseAnonKey) {
                      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
                    }
                    
                    const supabase = createClient(supabaseUrl, supabaseAnonKey)
                    
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
              data-tour-id="email-form-save"
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
              <div className="flex-1 overflow-auto pr-4 p-4" data-tour-id="email-form-preview" ref={previewRef}>
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
              <div className="w-[670px] flex-shrink-0 overflow-y-auto p-4 space-y-4 bg-gray-50 border-l border-gray-200">
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
                              // Use fallback values if environment variables are not set
                              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
                              const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
                              
                              if (!supabaseUrl) {
                                throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
                              }
                              if (!supabaseAnonKey) {
                                throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
                              }
                              
                              const supabase = createClient(supabaseUrl, supabaseAnonKey)
                              
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
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200" data-tour-id="email-form-edit-payment">
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
                <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200" data-tour-id="email-form-edit-notes">
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
        <div className="space-y-2">
          {/* Test email result message */}
          {testEmailResult && (
            <div className={`px-4 py-2 mx-4 rounded-lg text-sm ${
              testEmailResult.startsWith('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testEmailResult}
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            {/* Show convert to invoice button if PDF was downloaded and quote status is sent */}
            {(pdfDownloaded || quoteStatus === 'sent') && onConvertToInvoice && (
              <button
                onClick={() => {
                  if (onConvertToInvoice) {
                    onConvertToInvoice(quoteId)
                    onClose()
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                title="Duyệt báo giá thành hóa đơn"
              >
                <DollarSign className="w-4 h-4" />
                Duyệt báo giá thành hóa đơn
              </button>
            )}
            <button
              onClick={handleTestEmail}
              disabled={loading || testingEmail || !!error}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Test gửi email qua n8n (không thay đổi trạng thái báo giá)"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang test...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  <span>Test n8n</span>
                </>
              )}
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
              data-tour-id="email-form-send"
            >
              <Send className="w-4 h-4" />
              Gửi email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

