'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle, Loader2, User, Building2, Package, DollarSign, Sparkles, ChevronDown, ChevronUp, ChevronRight, Edit, Save, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Lazy import xlsx with retry mechanism
async function loadXLSX() {
  let retries = 3
  while (retries > 0) {
    try {
      // Use dynamic import with explicit chunk name
      const mod = await import(/* webpackChunkName: "xlsx" */ 'xlsx')
      console.log('✅ xlsx loaded successfully')
      return mod
    } catch (error: any) {
      retries--
      console.warn(`⚠️ Error loading xlsx (${retries} retries left):`, error)
      
      if (retries === 0) {
        // Last attempt: try to reload the page chunk
        if (error.message?.includes('chunk') || error.message?.includes('Loading')) {
          console.error('❌ Chunk load error. Please refresh the page.')
          throw new Error('Không thể tải thư viện xlsx. Vui lòng refresh trang (F5) và thử lại.')
        }
        throw new Error(`Không thể tải thư viện xlsx: ${error.message || 'Unknown error'}`)
      }
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  throw new Error('Failed to load xlsx library after retries')
}

// Convert ArrayBuffer to base64 efficiently (chunked to avoid stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB chunks
  let binary = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

// Extract text from PDF file by sending to server
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Starting PDF text extraction via server...')
    console.log('📊 PDF file size:', file.size, 'bytes')
    
    // Check file size (limit to 10MB to avoid issues)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error(`File PDF quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn file nhỏ hơn 10MB.`)
    }
    
    // Get token from Supabase session or localStorage
    let token: string | null = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfmijckzlhevduwfigkl.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E'
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (!sessionError && session?.access_token) {
        token = session.access_token
        console.log('✅ Got token from Supabase session (PDF extraction)')
      }
    } catch (e) {
      console.warn('⚠️ Error getting session for PDF extraction:', e)
    }
    
    // Fallback to localStorage
    if (!token) {
      token = localStorage.getItem('access_token')
      if (token) {
        console.log('⚠️ Using token from localStorage (PDF extraction fallback)')
      }
    }
    
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    // Convert file to base64 using chunked method
    console.log('🔄 Converting PDF to base64...')
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    console.log('✅ Base64 conversion complete, length:', base64.length)
    
    // Send to server for PDF extraction
    console.log('📤 Sending PDF to server for text extraction...')
    const response = await fetch('/api/sales/quotes/extract-pdf-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: base64,
        fileName: file.name
      })
    })

    if (!response.ok) {
      let errorMessage = 'Lỗi khi trích xuất text từ PDF'
      try {
        // Clone response to read it multiple times if needed
        const responseClone = response.clone()
        const error = await response.json()
        errorMessage = error.message || error.error || errorMessage
        console.error('❌ Server error response:', {
          status: response.status,
          error: error
        })
      } catch (e) {
        // If JSON parse fails, response body was already consumed or not JSON
        try {
        const errorText = await response.text()
        console.error('❌ Server error text:', errorText)
        errorMessage = errorText || errorMessage
        } catch (textError) {
          console.error('❌ Could not read response body:', textError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log(`✅ PDF text extracted: ${result.text?.length || 0} characters`)
    
    if (!result.text || result.text.trim().length === 0) {
      throw new Error('PDF không có text. File có thể là PDF scan (hình ảnh). Vui lòng sử dụng PDF có text layer.')
    }
    
    return result.text
    
  } catch (error: any) {
    console.error('❌ Error extracting PDF text:', error)
    throw new Error(`Lỗi khi đọc PDF: ${error.message || 'Unknown error'}`)
  }
}

interface CustomerInfo {
  name: string
  address?: string
  phone?: string
  email?: string
}

interface QuoteItem {
  stt?: number
  ky_hieu?: string
  hang_muc_thi_cong: string
  item_type?: 'product' | 'material_cost'  // Phân loại: sản phẩm hoặc chi phí vật tư
  belongs_to_product_id?: string  // ID sản phẩm mà chi phí này thuộc về (chỉ dùng khi item_type = 'material_cost')
  belongs_to_product_name?: string  // Tên sản phẩm (để hiển thị)
  expense_object_id?: string  // ID đối tượng chi phí (chỉ dùng khi item_type = 'material_cost')
  ten_san_pham?: string  // Tên sản phẩm chính (dòng đầu)
  loai_san_pham?: string // Loại/Category (ví dụ: Nhôm Xingfa Việt Nam)
  mo_ta?: string         // Mô tả chi tiết (phần còn lại)
  dvt: string
  ngang?: number
  cao?: number
  so_luong: number
  dien_tich?: number
  don_gia: number
  thanh_tien: number
  has_tax?: boolean      // Có thuế VAT hay không (true = có thuế, false = không có thuế)
  tax_rate?: number      // Thuế suất cho sản phẩm này (%)
  ghi_chu?: string
}

interface ProjectInfo {
  name: string
  address?: string
  supervisor?: string
}

interface AnalyzedQuote {
  customer: CustomerInfo
  project: ProjectInfo
  items: QuoteItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  date?: string
  valid_until?: string
  notes?: string  // Ghi chú báo giá (phần 3)
  terms?: string  // Điều khoản, quy trình
}

interface DebugInfo {
  documentPreview: {
    first500Chars: string
    last200Chars: string
    totalLength: number
    lineCount: number
  }
  extractedInfo: {
    customerFound: boolean
    customerName: string | null
    addressFound: boolean
    address: string | null
    phoneFound: boolean
    phone: string | null
    supervisorFound: boolean
    supervisor: string | null
    dateFound: boolean
    date: string | null
    itemsCount: number
    itemsPreview: Array<{
      stt: number | null
      ten_san_pham: string
      loai_san_pham: string | null
      so_luong: number
      don_gia: number
      thanh_tien: number
    }>
    subtotalFound: boolean
    subtotal: number
    vatFound: boolean
    taxAmount: number
    totalFound: boolean
    totalAmount: number
  }
  warnings: string[]
  processingSteps: string[]
}

export default function QuoteExcelUploadAI({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [analyzedData, setAnalyzedData] = useState<AnalyzedQuote | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Edit item state - edit all items at once
  const [isEditingAll, setIsEditingAll] = useState<boolean>(false)
  
  
  // AI Model selection
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o')
  const availableModels = [
    { value: 'gpt-4o', label: 'GPT-4o (Mới nhất, Chính xác nhất)', description: 'Model mới nhất, độ chính xác cao nhất' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Nhanh & Chính xác)', description: 'Cân bằng tốt giữa tốc độ và độ chính xác' },
    { value: 'gpt-4', label: 'GPT-4 (Chuẩn)', description: 'Model GPT-4 chuẩn' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Nhanh, Tiết kiệm)', description: 'Nhanh và tiết kiệm chi phí' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Nhanh nhất)', description: 'Nhanh nhất, chi phí thấp nhất' }
  ]
  
  // Dropdown data
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone?: string; email?: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [employees, setEmployees] = useState<Array<{ 
    id: string; 
    full_name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; unit: string }>>([])
  
  // Product selection modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  // Editable customer and project info
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: '',
    address: '',
    supervisor: ''
  })
  
  // Selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [isNewProject, setIsNewProject] = useState(false)
  
  // Current user info
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email?: string
    full_name?: string
    role?: string
  } | null>(null)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  
  // Product matching status for each item
  const [productMatchStatus, setProductMatchStatus] = useState<Array<{
    index: number
    exists: boolean
    matchedProduct?: { id: string; name: string; price: number }
  }>>([])

  // Load current user info on mount
  React.useEffect(() => {
    fetchCurrentUser()
  }, [])

  // Load customers, employees, and products on mount
  React.useEffect(() => {
    fetchCustomers()
    fetchEmployees()
    fetchProducts()
  }, [])
  
  // Fetch current logged in user and employee info
  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Get user info from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', authUser.id)
          .single()
        
        if (!userError && userData) {
          setCurrentUser(userData)
          console.log('✅ Current user loaded:', userData)
          
          // Check if user exists in employees table
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('id')
            .eq('id', authUser.id)
            .single()
          
          if (!employeeError && employeeData) {
            setCurrentEmployeeId(employeeData.id)
            console.log('✅ Current employee ID:', employeeData.id)
            
            // Auto-select current employee if not already selected
            if (!selectedEmployeeId) {
              setSelectedEmployeeId(employeeData.id)
            }
          } else {
            console.log('ℹ️ User is not in employees table')
          }
        } else {
          console.error('❌ Error fetching user data:', userError)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching current user:', error)
    }
  }
  
  // Load projects when customer is selected
  React.useEffect(() => {
    if (selectedCustomerId) {
      fetchProjects(selectedCustomerId)
    } else {
      setProjects([])
    }
  }, [selectedCustomerId])
  
  // Check product matches when analyzed data changes
  React.useEffect(() => {
    if (analyzedData?.items && products.length > 0) {
      checkProductMatches()
    }
  }, [analyzedData, products])

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('status', 'active')
        .order('name')
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProjects = async (customerId: string) => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('customer_id', customerId)
        .in('status', ['planning', 'active'])
        .order('name')
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      console.log('🔍 Fetching employees for comparison...')
      
      // Fetch employees with user info to get full_name
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_id,
          users!employees_user_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .order('first_name')
      
      if (error) {
        console.error('❌ Error fetching employees:', error)
        setEmployees([])
        return
      }
      
      if (data && data.length > 0) {
        // Transform employees to include full_name
        const transformedEmployees = data.map((emp: any) => {
          // Try to get full_name from users table, otherwise use first_name + last_name
          const usersRel = emp.users
          const userFullName = Array.isArray(usersRel) 
            ? usersRel[0]?.full_name 
            : usersRel?.full_name
          
          const fullName = userFullName || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Unknown'
          
          return {
            id: emp.id,
            full_name: fullName,
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email
          }
        })
        
        setEmployees(transformedEmployees)
        console.log(`✅ Loaded ${transformedEmployees.length} employees for comparison`)
      } else {
        console.log('⚠️ No employees found')
        setEmployees([])
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      setEmployees([])
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const { data } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          description, 
          unit, 
          price, 
          category_id,
          area,
          volume,
          height,
          length,
          depth,
          product_categories(name)
        `)
        .eq('is_active', true)
        .order('name')
      
      const transformedProducts = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        unit: product.unit || '',
        unit_price: product.price || 0,
        category: product.product_categories?.name || 'Khác',
        category_id: product.category_id || null,
        area: product.area !== undefined ? product.area : null,
        volume: product.volume !== undefined ? product.volume : null,
        height: product.height !== undefined ? product.height : null,
        length: product.length !== undefined ? product.length : null,
        depth: product.depth !== undefined ? product.depth : null
      }))
      
      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }
  
  // Filter products based on search
  const filteredProducts = products.filter(product => {
    if (!productSearch.trim()) return true
    const searchLower = productSearch.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower))
    )
  })
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }
  
  // Add selected products to analyzedData.items
  const addProductsToItems = async () => {
    if (!analyzedData || selectedProductIds.length === 0) return
    
    try {
      // Load full products with components
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, description, unit, price, category_id, area, volume, height, length, depth, actual_material_components, product_components')
        .in('id', selectedProductIds)
      
      const byId: Record<string, any> = {}
      prods?.forEach((pr: any) => { byId[pr.id] = pr })
      
      // Collect all expense_object_ids to batch fetch names
      const allComponents = (prods || []).flatMap((pr: any) => {
        const actualComps = Array.isArray(pr.actual_material_components) ? pr.actual_material_components : []
        const plannedComps = Array.isArray(pr.product_components) ? pr.product_components : []
        const comps = actualComps.length > 0 ? actualComps : plannedComps
        return comps
      })
      const ids = Array.from(new Set(allComponents.map((c: any) => String(c.expense_object_id)).filter(Boolean)))
      let nameMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: exp } = await supabase
          .from('expense_objects')
          .select('id, name')
          .in('id', ids)
        exp?.forEach((e: any) => { nameMap[e.id] = e.name })
      }
      
      const newItems = [...analyzedData.items]
      const maxStt = Math.max(...newItems.map(item => item.stt || 0), 0)
      
      selectedProductIds.forEach((productId, idx) => {
        const pr = byId[productId]
        if (!pr) return
        
        const actualComps = Array.isArray(pr.actual_material_components) ? pr.actual_material_components : []
        const plannedComps = Array.isArray(pr.product_components) ? pr.product_components : []
        const comps = actualComps.length > 0 ? actualComps : plannedComps
        
        const components = comps.map((c: any) => ({
          expense_object_id: c.expense_object_id,
          name: nameMap[c.expense_object_id] || c.name || '',
          unit: c.unit || '',
          unit_price: Number(c.unit_price || 0),
          quantity: Number(c.quantity || 0),
          total_price: Number(c.total_price || 0)
        }))
        
        const newItem: QuoteItem = {
          stt: maxStt + idx + 1,
          item_type: 'product',
          ten_san_pham: pr.name,
          loai_san_pham: pr.category_id ? 'Sản phẩm' : undefined,
          mo_ta: pr.description || '',
          dvt: pr.unit || 'cái',
          so_luong: 1,
          dien_tich: pr.area || undefined,
          don_gia: pr.price || 0,
          thanh_tien: (pr.area && pr.area > 0) ? (pr.price || 0) * pr.area : (pr.price || 0),
          has_tax: true,
          tax_rate: analyzedData.tax_rate || 0.08,
          ngang: pr.length ? pr.length / 1000 : undefined, // Convert mm to m
          cao: pr.height ? pr.height / 1000 : undefined, // Convert mm to m
          expense_object_id: undefined,
          components: components.length > 0 ? components : undefined
        }
        
        newItems.push(newItem)
      })
      
      // Recalculate totals
      const newSubtotal = newItems.reduce((sum, item) => sum + (item.thanh_tien || 0), 0)
      const newTaxAmount = newItems.reduce((sum, item) => {
        if (item.has_tax !== false) {
          const itemTaxRate = item.tax_rate !== undefined 
            ? item.tax_rate 
            : (analyzedData.tax_rate || 0.08)
          return sum + (item.thanh_tien || 0) * itemTaxRate
        }
        return sum
      }, 0)
      const newTotalAmount = newSubtotal + newTaxAmount
      
      setAnalyzedData({
        ...analyzedData,
        items: newItems,
        subtotal: newSubtotal,
        tax_amount: newTaxAmount,
        total_amount: newTotalAmount
      })
      
      // Refresh product match status
      checkProductMatches()
      
      // Close modal and reset
      setSelectedProductIds([])
      setShowProductModal(false)
    } catch (error) {
      console.error('Error adding products:', error)
      alert('Lỗi khi thêm sản phẩm: ' + (error as Error).message)
    }
  }

  // Helper: recalculate totals from items list
  const recalculateTotalsFromItems = (items: QuoteItem[], defaultTaxRate: number) => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.thanh_tien || 0), 0)
    const newTaxAmount = items.reduce((sum, item) => {
      if (item.has_tax !== false) {
        const itemTaxRate = item.tax_rate !== undefined
          ? item.tax_rate
          : defaultTaxRate
        return sum + (item.thanh_tien || 0) * itemTaxRate
      }
      return sum
    }, 0)
    const newTotalAmount = newSubtotal + newTaxAmount
    return { newSubtotal, newTaxAmount, newTotalAmount }
  }

  // Add a free / manual product row
  const addFreeProductItem = () => {
    if (!analyzedData) return

    const newItems = [...analyzedData.items]
    const maxStt = Math.max(...newItems.map(item => item.stt || 0), 0)
    const baseTaxRate = analyzedData.tax_rate || 0.08

    const newItem: QuoteItem = {
      stt: maxStt + 1,
      item_type: 'product',
      ten_san_pham: 'Sản phẩm tự do',
      loai_san_pham: 'Sản phẩm tự do',
      mo_ta: '',
      dvt: 'cái',
      so_luong: 1,
      dien_tich: undefined,
      don_gia: 0,
      thanh_tien: 0,
      has_tax: true,
      tax_rate: baseTaxRate
    }

    newItems.push(newItem)
    const { newSubtotal, newTaxAmount, newTotalAmount } = recalculateTotalsFromItems(newItems, baseTaxRate)

    setAnalyzedData({
      ...analyzedData,
      items: newItems,
      subtotal: newSubtotal,
      tax_amount: newTaxAmount,
      total_amount: newTotalAmount
    })
  }

  // Delete a product/material row from analyzed items
  const deleteItemAtIndex = (index: number) => {
    if (!analyzedData) return
    const newItems = analyzedData.items.filter((_, i) => i !== index)
    const baseTaxRate = analyzedData.tax_rate || 0.08
    const { newSubtotal, newTaxAmount, newTotalAmount } = recalculateTotalsFromItems(newItems, baseTaxRate)

    setAnalyzedData({
      ...analyzedData,
      items: newItems,
      subtotal: newSubtotal,
      tax_amount: newTaxAmount,
      total_amount: newTotalAmount
    })
  }
  
  // Helper function to normalize Vietnamese text for matching
  const normalizeText = (text: string): string => {
    if (!text) return ''
    return text
      .toLowerCase()
      .trim()
      // Remove common prefixes/suffixes
      .replace(/^\(anh\)\s*/i, '')
      .replace(/^\(chị\)\s*/i, '')
      .replace(/^\(chú\)\s*/i, '')
      .replace(/^\(cô\)\s*/i, '')
      .replace(/\s+/g, ' ')
  }

  // Helper function to calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeText(str1)
    const s2 = normalizeText(str2)
    
    // Exact match
    if (s1 === s2) return 1.0
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9
    
    // Word-based similarity
    const words1 = s1.split(/\s+/)
    const words2 = s2.split(/\s+/)
    const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
    
    if (commonWords.length > 0) {
      return commonWords.length / Math.max(words1.length, words2.length)
    }
    
    return 0
  }

  // Find matching customer from database
  const findMatchingCustomer = (customerName: string) => {
    if (!customerName || customers.length === 0) return null
    
    let bestMatch: { customer: any, similarity: number } | null = null
    
    for (const customer of customers) {
      const similarity = calculateSimilarity(customerName, customer.name)
      
      // Also check phone number if available
      if (customerInfo.phone && customer.phone) {
        const phoneSimilarity = customer.phone.includes(customerInfo.phone) || customerInfo.phone.includes(customer.phone)
        if (phoneSimilarity) {
          return { customer, similarity: 1.0 }  // Phone match is very strong
        }
      }
      
      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { customer, similarity }
      }
    }
    
    return bestMatch
  }

  // Find matching project from database
  const findMatchingProject = (projectName: string, projectsList: any[]) => {
    if (!projectName || projectsList.length === 0) return null
    
    let bestMatch: { project: any, similarity: number } | null = null
    
    for (const project of projectsList) {
      const similarity = calculateSimilarity(projectName, project.name)
      
      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { project, similarity }
      }
    }
    
    return bestMatch
  }
  
  const checkProductMatches = () => {
    if (!analyzedData?.items) return
    
    const matches = analyzedData.items.map((item, index) => {
      // Use ten_san_pham if available, otherwise extract from hang_muc_thi_cong
      // Handle null/undefined cases safely
      let itemName = ''
      if (item.ten_san_pham) {
        itemName = item.ten_san_pham
      } else if (item.hang_muc_thi_cong) {
        // Split only if hang_muc_thi_cong is not null/undefined
        itemName = typeof item.hang_muc_thi_cong === 'string' 
          ? item.hang_muc_thi_cong.split('\n')[0] 
          : String(item.hang_muc_thi_cong || '')
      } else {
        // Fallback to empty string or use index
        itemName = `Item ${index + 1}`
      }
      
      // Clean itemName for better matching (only if itemName is not empty)
      const cleanedItemName = itemName 
        ? itemName.trim().toLowerCase().replace(/cửa sổ/g, '').replace(/cửa/g, '').trim()
        : `item-${index + 1}`
      
      // Try exact match first
      let matchedProduct = products.find(p => {
        const pName = p.name.toLowerCase()
        return pName === cleanedItemName || 
               pName.includes(cleanedItemName) || 
               cleanedItemName.includes(pName)
      })
      
      // If no exact match, try fuzzy match
      if (!matchedProduct) {
        matchedProduct = products.find(p => {
          const pName = p.name.toLowerCase()
          // Simple similarity: check if significant words match
          const itemWords = cleanedItemName.split(/\s+/)
          const productWords = pName.split(/\s+/)
          const matchedWords = itemWords.filter(w => productWords.some(pw => pw.includes(w) || w.includes(pw)))
          return matchedWords.length >= Math.min(2, itemWords.length)
        })
      }
      
      return {
        index,
        exists: !!matchedProduct,
        matchedProduct
      }
    })
    
    setProductMatchStatus(matches)
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const XLSX = await loadXLSX()
      const wb = XLSX.utils.book_new()
      
      // Template data theo định dạng thực tế
      const templateData = [
        {
          'STT': 1,
          'Ký hiệu': '',
          'Hạng mục thi công': 'VÁCH KÍNH VĂN PHÒNG\nKính trắng 10mm cường lực\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính',
          'ĐVT': 'm²',
          'Ngang (m)': 3.250,
          'Cao (m)': 2.780,
          'Số lượng': 1,
          'Diện tích (m²)': 9.04,
          'Đơn giá (VNĐ/ĐVT)': 850000,
          'Thành tiền (VNĐ)': 7684000,
          'Ghi chú': ''
        },
        {
          'STT': '',
          'Ký hiệu': 'Vách kính cường lực',
          'Hạng mục thi công': 'Phụ kiện cửa kính mở BLS VVP inox trắng\n1 bản lề sàn\n1 kẹp kính L\n1 kẹp kính trên\n1 kẹp kính dưới\n1 khóa âm sàn\n1 tay nắm H600',
          'ĐVT': 'bộ',
          'Ngang (m)': '',
          'Cao (m)': '',
          'Số lượng': 1,
          'Diện tích (m²)': '',
          'Đơn giá (VNĐ/ĐVT)': 2600000,
          'Thành tiền (VNĐ)': 2600000,
          'Ghi chú': ''
        }
      ]
      
      const ws = XLSX.utils.json_to_sheet(templateData)
      XLSX.utils.book_append_sheet(wb, ws, 'Báo giá')
      XLSX.writeFile(wb, 'Mau_Bao_Gia.xlsx')
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Lỗi khi tải file mẫu')
    } finally {
      setDownloading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('📁 New file selected:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type)
    console.log('🔄 Clearing previous data...')

    // Check for Excel temporary/lock files
    if (file.name.startsWith('~$') || file.name.startsWith('~')) {
      setError(
        `⚠️ File "${file.name}" là file tạm (temporary file) của Excel.\n\n` +
        `File này được Excel tự động tạo khi bạn đang mở file gốc.\n\n` +
        `🔧 Cách khắc phục:\n` +
        `1. Đóng file Excel đang mở\n` +
        `2. Upload file gốc (không có ký tự ~ hoặc ~$ ở đầu tên file)\n` +
        `3. File gốc có tên: "${file.name.replace(/^~\$?/, '')}"`
      )
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    // Check for suspiciously small files (likely temporary or corrupted)
    if (file.size < 1000) {
      setError(
        `⚠️ File quá nhỏ (${file.size} bytes).\n\n` +
        `File Excel báo giá thường có kích thước > 10KB.\n\n` +
        `Vui lòng kiểm tra:\n` +
        `- File có bị lỗi không?\n` +
        `- Đóng file Excel trước khi upload\n` +
        `- Upload đúng file báo giá gốc (không phải file temporary ~$...)`
      )
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Check file type - ONLY Excel for now (PDF has compatibility issues)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'
    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf'

    if (isPDF) {
      setError('Tính năng PDF đang được cập nhật. Vui lòng sử dụng file Excel (.xlsx, .xls)')
      return
    }

    if (!isExcel) {
      setError('Vui lòng chọn file Excel (.xlsx, .xls)')
      return
    }

    // Clear all previous data first
    setAnalyzedData(null)
    setError(null)
    setSuccess(null)
    setAnalyzing(true)

    try {
      let documentText = ''
      let fileType = 'excel'

      if (isPDF) {
        // Extract text from PDF
        console.log('📄 Extracting text from PDF...')
        fileType = 'pdf'
        documentText = await extractTextFromPDF(file)
        console.log('✅ PDF text extracted, length:', documentText.length)
        console.log('📊 PDF text preview (first 1000 chars):', documentText.substring(0, 1000))
      } else {
        // Convert Excel to structured text for AI analysis
        const XLSX = await loadXLSX()
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array', cellDates: true, cellNF: false, cellText: false })
        
        console.log('📊 Excel workbook loaded, sheets:', wb.SheetNames)
        
        // Find sheet: Ưu tiên "hợp đồng", "BG", "Báo giá", tránh "GIÁ VỐN"
        let sheetName = wb.SheetNames.find(name => 
          name.toLowerCase().includes('hợp đồng') || 
          name.toLowerCase().includes('hop dong')
        ) || wb.SheetNames.find(name => 
          name.toLowerCase().includes('bg') ||
          name.toLowerCase().includes('báo giá') || 
          name.toLowerCase().includes('bao gia')
        ) || wb.SheetNames.find(name => 
          !name.toLowerCase().includes('giá vốn') &&
          !name.toLowerCase().includes('gia von')
        ) || wb.SheetNames[0]
        
        const ws = wb.Sheets[sheetName]
        console.log(`✅ Đọc sheet: "${sheetName}"`)
        
        if (!ws) {
          throw new Error('Không tìm thấy sheet hợp lệ trong file Excel')
        }
        
        // Get sheet range
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        const totalRows = range.e.r + 1
        const totalCols = range.e.c + 1
        
        console.log(`📊 Sheet dimensions: ${totalRows} rows x ${totalCols} columns`)
        console.log(`📊 Sheet range: ${ws['!ref']}`)
        
        // Read ALL rows including empty ones, preserving structure
        const rowsWithHeaders: any[] = []
        for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex++) {
          const row: any[] = []
          for (let colIndex = 0; colIndex <= range.e.c; colIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
            const cell = ws[cellAddress]
            
            // Get cell value, handling different types
            let cellValue = ''
            if (cell) {
              if (cell.t === 'n') {
                // Number
                cellValue = cell.v
              } else if (cell.t === 'd') {
                // Date
                cellValue = cell.w || cell.v.toString()
              } else if (cell.t === 'b') {
                // Boolean
                cellValue = cell.v ? 'TRUE' : 'FALSE'
              } else if (cell.t === 'e') {
                // Error
                cellValue = `#ERROR: ${cell.v}`
              } else {
                // String or formula result
                cellValue = cell.w || cell.v || ''
              }
            }
            row.push(cellValue)
          }
          rowsWithHeaders.push(row)
        }
        
        console.log(`✅ Read ${rowsWithHeaders.length} rows, ${rowsWithHeaders[0]?.length || 0} columns`)
        
        // Find actual header row (row with column names like STT, Hạng mục, etc.)
        let headerRowIndex = -1
        const headerKeywords = ['STT', 'Hạng mục', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Khách hàng', 'Địa chỉ', 'Giám sát']
        
        for (let i = 0; i < Math.min(30, rowsWithHeaders.length); i++) {
          const row = rowsWithHeaders[i]
          const rowText = row.map((cell: any) => String(cell || '')).join(' ').toUpperCase()
          const hasHeaderKeywords = headerKeywords.some(keyword => rowText.includes(keyword.toUpperCase()))
          
          if (hasHeaderKeywords) {
            headerRowIndex = i
            console.log(`✅ Found header row at index ${i}:`, row.filter((c: any) => c))
            break
          }
        }
        
        // Use found header row or first row
        const actualHeaders = headerRowIndex >= 0 ? rowsWithHeaders[headerRowIndex] : (rowsWithHeaders[0] || [])
        const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 1
        
        console.log(`📊 Using headers from row ${headerRowIndex >= 0 ? headerRowIndex + 1 : 1}:`, actualHeaders.filter((h: any) => h))
        console.log(`📊 Data starts from row ${dataStartRow + 1}`)
        
        // Build comprehensive document text with ALL rows
        documentText = `=== THÔNG TIN FILE EXCEL ===\n`
        documentText += `Tên sheet: ${sheetName}\n`
        documentText += `Tổng số dòng: ${rowsWithHeaders.length}\n`
        documentText += `Tổng số cột: ${actualHeaders.length}\n`
        documentText += `Header row: ${headerRowIndex >= 0 ? headerRowIndex + 1 : 1}\n\n`
        
        documentText += `=== HEADER ROW ===\n`
        documentText += actualHeaders.map((header: string, idx: number) => {
          const h = String(header || '').trim()
          return `Cột ${idx + 1}: "${h}"`
        }).join(' | ') + '\n\n'
        
        documentText += `=== DỮ LIỆU TỪNG DÒNG (BẮT ĐẦU TỪ DÒNG ${dataStartRow + 1}) ===\n`
        
        // Process rows starting from data
        for (let rowIndex = 0; rowIndex < rowsWithHeaders.length; rowIndex++) {
          const row = rowsWithHeaders[rowIndex]
          
          // Check if row has any data
          const hasData = row.some((cell: any) => {
            const val = cell !== null && cell !== undefined && String(cell).trim() !== ''
            return val
          })
          
          // Always include first 30 rows for context (to find customer info, etc.)
          // And include all rows with data
          if (hasData || rowIndex < 30) {
            documentText += `\n--- Dòng ${rowIndex + 1} ---\n`
            
            // Create detailed key-value pairs for each cell
            const rowData: string[] = []
            for (let colIndex = 0; colIndex < Math.max(actualHeaders.length, row.length); colIndex++) {
              const header = colIndex < actualHeaders.length 
                ? (String(actualHeaders[colIndex] || '').trim() || `Cột ${colIndex + 1}`)
                : `Cột ${colIndex + 1}`
              const cellValue = row[colIndex] !== undefined && row[colIndex] !== null 
                ? String(row[colIndex]).trim() 
                : ''
              
              // Include all non-empty cells and first 10 columns
              if (cellValue || colIndex < 10) {
                rowData.push(`${header}: "${cellValue}"`)
              }
            }
            
            documentText += rowData.join(' | ') + '\n'
            
            // Also include raw row data for context (all non-empty cells)
            const rawRowData = row.map((cell: any, idx: number) => {
              const val = cell !== undefined && cell !== null ? String(cell).trim() : ''
              return val ? `[${idx}]=${val}` : ''
            }).filter((s: string) => s).join(' ')
            
            if (rawRowData) {
              documentText += `Raw: ${rawRowData}\n`
            }
          }
        }
        
        console.log('📊 Document text generated, length:', documentText.length)
        console.log('📊 First 1000 chars:', documentText.substring(0, 1000))
        console.log('📊 Last 500 chars:', documentText.substring(Math.max(0, documentText.length - 500)))
      }
      
      // Send to AI for analysis
      console.log(`📤 Sending ${fileType.toUpperCase()} data to AI for analysis...`)
      console.log('📄 File name:', file.name)
      console.log('📄 File size:', file.size, 'bytes')
      console.log('📄 File last modified:', new Date(file.lastModified).toISOString())
      console.log('📊 Document text length:', documentText.length, 'characters')
      console.log('📊 Document text preview (first 1000 chars):', documentText.substring(0, 1000))
      console.log('📊 Document text preview (last 500 chars):', documentText.substring(Math.max(0, documentText.length - 500)))
      
      // Create unique request ID to prevent caching
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      console.log('🆔 Request ID:', requestId)
      
      // Get token using helper function
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
      }

      // Add timestamp and unique ID to prevent caching
      const timestamp = Date.now()
      const uniqueId = `${timestamp}-${Math.random().toString(36).substring(7)}`
      
      const requestBody = {
        documentData: documentText,
        fileName: file.name,
        fileType: fileType,
        timestamp: timestamp,
        requestId: uniqueId,
        fileSize: file.size,
        fileLastModified: file.lastModified,
        model: selectedModel  // Include selected AI model
      }
      
      console.log('📤 Request body metadata:', {
        fileName: requestBody.fileName,
        fileType: requestBody.fileType,
        fileSize: requestBody.fileSize,
        documentDataLength: requestBody.documentData.length,
        requestId: requestBody.requestId,
        model: requestBody.model
      })
      
      const response = await fetch(`/api/sales/quotes/analyze-excel-ai?t=${timestamp}&id=${uniqueId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': uniqueId
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 API response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Lỗi khi phân tích file'
        let errorDetails: any = {}
        
        try {
          const error = await response.json()
          errorDetails = error
          errorMessage = error.message || error.error || error.detail || errorMessage
          
          // Save debug info from error response if available
          if (error.debug) {
            console.log('🔍 Debug info from error response:', error.debug)
            setDebugInfo(error.debug)
            setShowDebug(true)  // Auto-show debug on error
          }
          
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: error,
            hasDebug: !!error.debug
          })
        } catch (e) {
          const errorText = await response.text()
          console.error('Error response text:', errorText)
          errorMessage = errorText || errorMessage
          try {
            errorDetails = JSON.parse(errorText)
            errorMessage = errorDetails.message || errorDetails.error || errorMessage
            
            // Try to get debug info from parsed error
            if (errorDetails.debug) {
              setDebugInfo(errorDetails.debug)
              setShowDebug(true)
            }
          } catch (parseError) {
            // Keep original errorText as errorMessage
          }
        }
        
        // Provide more specific error message
        if (response.status === 400) {
          errorMessage = errorDetails.message || 'Dữ liệu file không hợp lệ. Vui lòng kiểm tra lại file.'
        } else if (response.status === 500) {
          errorMessage = errorDetails.message || 'Lỗi server khi phân tích file. Vui lòng thử lại sau.'
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ AI Analysis result received:', {
        success: result.success,
        hasAnalysis: !!result.analysis,
        hasDebug: !!result.debug,
        customer: result.analysis?.customer?.name,
        itemsCount: result.analysis?.items?.length,
        requestId: uniqueId
      })
      
      // Save debug info if available
      if (result.debug) {
        console.log('🔍 Debug info received:', result.debug)
        setDebugInfo(result.debug)
        
        // Auto show debug if there are warnings
        if (result.debug.warnings && result.debug.warnings.length > 0) {
          setShowDebug(true)
          console.warn('⚠️ Warnings found:', result.debug.warnings)
        }
      }
      
      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Không nhận được dữ liệu phân tích từ AI')
      }
      
      console.log('🎉 Setting analyzed data to state')
      console.log('📋 Final analysis data:', {
        customer: result.analysis.customer?.name,
        project: result.analysis.project?.name,
        itemsCount: result.analysis.items?.length,
        totalAmount: result.analysis.total_amount,
        firstItem: result.analysis.items?.[0]?.hang_muc_thi_cong?.substring(0, 50)
      })
      
      // Verify this is new data (check customer name matches file)
      console.log('🔍 Verifying data matches file:', {
        file: file.name,
        customer: result.analysis.customer?.name,
        requestId: uniqueId
      })
      
      // Set new analyzed data
      setAnalyzedData(result.analysis)
      
      // Initialize editable customer and project info from analyzed data
      const customerName = result.analysis.customer?.name || ''
      const customerAddress = result.analysis.customer?.address || ''
      const customerPhone = result.analysis.customer?.phone || ''  // Lưu để hiển thị trong debug, nhưng không điền vào form
      const customerEmail = result.analysis.customer?.email || ''
      
      // Lưu ý: Không điền phone từ AI analysis vì đó có thể là số điện thoại của nhân viên
      // Người dùng sẽ tự nhập số điện thoại khách hàng sau khi phân tích
      setCustomerInfo({
        name: customerName,
        address: customerAddress,
        phone: '',  // Để trống để người dùng tự nhập
        email: customerEmail
      })
      
      // 🔍 AUTO-MATCH CUSTOMER FROM DATABASE
      console.log('🔍 Checking if customer exists in database...')
      let matchedCustomer = null
      
      if (customerName && customers.length > 0) {
        const match = findMatchingCustomer(customerName)
        
        if (match && match.similarity >= 0.8) {
          matchedCustomer = match.customer
          console.log(`✅ Found matching customer: "${matchedCustomer.name}" (similarity: ${(match.similarity * 100).toFixed(0)}%)`)
          
          // Auto-select the matched customer
          setSelectedCustomerId(matchedCustomer.id)
          setIsNewCustomer(false)
          
          // Update customer info with data from database
          // Lưu ý: Không lấy phone từ AI analysis, chỉ lấy từ database hoặc để trống
          setCustomerInfo({
            name: matchedCustomer.name,
            address: customerAddress || matchedCustomer.address || '',
            phone: matchedCustomer.phone || '',  // Chỉ lấy từ database, không lấy từ AI analysis
            email: customerEmail || matchedCustomer.email || ''
          })
          
          // Load projects for this customer
          console.log('📂 Loading projects for matched customer...')
          await fetchProjects(matchedCustomer.id)
          
        } else if (match) {
          console.log(`⚠️ Found similar customer: "${match.customer.name}" but similarity too low (${(match.similarity * 100).toFixed(0)}%)`)
          setIsNewCustomer(true)
        } else {
          console.log('❌ No matching customer found in database')
          setIsNewCustomer(true)
        }
      } else if (!customerName) {
        setIsNewCustomer(true)
        console.log('⚠️ No customer name found, marking as new customer')
      } else {
        setIsNewCustomer(true)
        console.log('ℹ️ No customers loaded, marking as new customer')
      }
      
      // Initialize project info
      const projectName = result.analysis.project?.name || ''
      const projectAddress = result.analysis.project?.address || customerAddress
      const projectSupervisor = result.analysis.project?.supervisor || ''
      
      setProjectInfo({
        name: projectName || (customerName && customerAddress ? `${customerName} - ${customerAddress}` : customerName),
        address: projectAddress,
        supervisor: projectSupervisor
      })
      
      // 🔍 AUTO-MATCH SUPERVISOR WITH EMPLOYEES
      if (projectSupervisor) {
        console.log('🔍 Loading employees for supervisor matching...')
        
        // Fetch employees directly (not relying on state)
        try {
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select(`
              id,
              first_name,
              last_name,
              email,
              user_id,
              users!employees_user_id_fkey(full_name)
            `)
            .eq('status', 'active')
            .order('first_name')
          
          if (!employeesError && employeesData && employeesData.length > 0) {
            // Transform employees to include full_name
            const transformedEmployees = employeesData.map((emp: any) => {
              const usersRel = emp.users
              const userFullName = Array.isArray(usersRel) 
                ? usersRel[0]?.full_name 
                : usersRel?.full_name
              
              const fullName = userFullName || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Unknown'
              
              return {
                id: emp.id,
                full_name: fullName,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email
              }
            })
            
            // Update state
            setEmployees(transformedEmployees)
            
            // Find matching employee
            const normalizedSupervisor = normalizeText(projectSupervisor)
            const matchedEmployee = transformedEmployees.find((emp: any) => {
              const empFullName = normalizeText(emp.full_name)
              const empFirstName = normalizeText(emp.first_name || '')
              const empLastName = normalizeText(emp.last_name || '')
              
              // Check if supervisor matches full name, first name, or last name
              return empFullName.includes(normalizedSupervisor) || 
                     normalizedSupervisor.includes(empFullName) ||
                     empFirstName.includes(normalizedSupervisor) ||
                     normalizedSupervisor.includes(empFirstName) ||
                     empLastName.includes(normalizedSupervisor) ||
                     normalizedSupervisor.includes(empLastName)
            })
            
            if (matchedEmployee) {
              console.log(`✅ Found matching employee for supervisor "${projectSupervisor}": ${matchedEmployee.full_name} (ID: ${matchedEmployee.id})`)
              setSelectedEmployeeId(matchedEmployee.id)
              setProjectInfo(prev => ({
                ...prev,
                supervisor: matchedEmployee.full_name
              }))
            } else {
              console.log(`⚠️ No matching employee found for supervisor "${projectSupervisor}"`)
              // Keep the supervisor name from analysis, user can manually select
            }
          } else {
            console.log('⚠️ No employees found in database for comparison')
          }
        } catch (error) {
          console.error('❌ Error loading employees for supervisor matching:', error)
        }
      }
      
      // 🔍 AUTO-MATCH PROJECT IF CUSTOMER MATCHED
      if (matchedCustomer) {
        console.log('🔍 Checking if project exists for this customer...')
        
        // Wait a bit for projects to load
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Re-fetch projects to ensure we have the latest
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('customer_id', matchedCustomer.id)
          .in('status', ['planning', 'active'])
          .order('name')
        
        if (projectsData && projectsData.length > 0) {
          const projectMatch = findMatchingProject(projectName, projectsData)
          
          if (projectMatch && projectMatch.similarity >= 0.8) {
            console.log(`✅ Found matching project: "${projectMatch.project.name}" (similarity: ${(projectMatch.similarity * 100).toFixed(0)}%)`)
            
            // Auto-select the matched project
            setSelectedProjectId(projectMatch.project.id)
            setIsNewProject(false)
            
            // Update project info
            setProjectInfo({
              name: projectMatch.project.name,
              address: projectAddress,
              supervisor: projectSupervisor
            })
          } else if (projectMatch) {
            console.log(`⚠️ Found similar project: "${projectMatch.project.name}" but similarity too low (${(projectMatch.similarity * 100).toFixed(0)}%)`)
        setIsNewProject(true)
          } else {
            console.log('❌ No matching project found, will create new project')
            setIsNewProject(true)
          }
        } else {
          console.log('ℹ️ No projects found for this customer, will create new project')
          setIsNewProject(true)
        }
      } else {
        // Customer is new, so project must be new too
        if (!projectName && customerName) {
        setProjectInfo(prev => ({
          ...prev,
          name: customerAddress ? `${customerName} - ${customerAddress}` : customerName
        }))
        }
        setIsNewProject(true)
      }
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      console.log('✅ File processing complete for:', file.name)
      
    } catch (error: any) {
      console.error('❌ Error analyzing file:', error)
      setError(error.message || 'Lỗi khi phân tích file. Vui lòng thử lại.')
      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleClearData = () => {
    console.log('🗑️ Clearing all data...')
    setAnalyzedData(null)
    setError(null)
    setSuccess(null)
    setCustomerInfo({ name: '', address: '', phone: '', email: '' })
    setProjectInfo({ name: '', address: '', supervisor: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('✅ Data cleared, ready for new upload')
  }

  // Helper function to format UTC time (default timezone)
  const formatUTCTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  }

  // Helper function to get access token from Supabase session or localStorage
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (!sessionError && session?.access_token) {
        return session.access_token
      }
    } catch (e) {
      console.warn('⚠️ Error getting session:', e)
    }
    
    // Fallback to localStorage
    return localStorage.getItem('access_token')
  }

  // Helper function to log detailed token info
  const logTokenInfo = (token: string, label: string = 'Token') => {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        const exp = payload.exp * 1000
        const now = Date.now()
        const expiresIn = exp - now
        
        console.log(`🔑 ${label} Info:`, {
          userId: payload.sub || payload.user_id || 'unknown',
          email: payload.email || 'unknown',
          expiresAt: formatUTCTime(exp),
          currentTime: formatUTCTime(now),
          expiresInMinutes: Math.floor(expiresIn / 1000 / 60),
          expiresInSeconds: Math.floor(expiresIn / 1000),
          isExpired: expiresIn < 0,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 30) + '...' + token.substring(token.length - 10)
        })
      }
    } catch (e) {
      console.warn(`⚠️ Could not decode ${label}:`, e)
    }
  }

  const getValidToken = async (): Promise<string> => {
    // Try to get token from Supabase session first, then localStorage
    let token: string | null = await getAccessToken()
    
    if (!token) {
      console.error('❌ No access_token found in session or localStorage')
      throw new Error(
        `🔐 Chưa đăng nhập.\n\n` +
        `📋 Thông tin chi tiết:\n` +
        `- Access token: Không có trong Supabase session hoặc localStorage\n` +
        `- Refresh token: ${localStorage.getItem('refresh_token') ? 'Có' : 'Không có'}\n\n` +
        `💡 Cách khắc phục:\n` +
        `1. Đăng nhập lại để lấy token mới\n` +
        `2. Kiểm tra xem có đang ở trang đăng nhập không\n` +
        `3. Thử refresh trang (F5)`
      )
    }
    
    // Log current token info
    logTokenInfo(token, 'Current')
    
    // Validate token format
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format:', {
        partsCount: tokenParts.length,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50)
      })
      throw new Error(
        `🔐 Token không đúng định dạng.\n\n` +
        `📋 Thông tin chi tiết:\n` +
        `- Token format: ${tokenParts.length} parts (expected 3)\n` +
        `- Token length: ${token.length} ký tự\n` +
        `- Token preview: ${token.substring(0, 50)}...\n\n` +
        `💡 Cách khắc phục:\n` +
        `1. Đăng nhập lại để lấy token mới\n` +
        `2. Xóa localStorage: localStorage.clear() trong Console (F12)\n` +
        `3. Refresh và đăng nhập lại`
      )
    }
    
    // Check if token is expired (simple check - decode JWT and check exp)
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      const expiresIn = exp - now
      const expiresInMinutes = Math.floor(expiresIn / 1000 / 60)
      const expiresInSeconds = Math.floor(expiresIn / 1000)
      
      console.log('🔑 Token status:', {
        userId: payload.sub || payload.user_id || 'unknown',
        email: payload.email || 'unknown',
        expiresAt: formatUTCTime(exp),
        currentTime: formatUTCTime(now),
        expiresInMinutes,
        expiresInSeconds,
        isExpired: expiresIn < 0,
        needsRefresh: expiresIn < 5 * 60 * 1000
      })
      
      // If token is expired or expires in less than 5 minutes, try to refresh
      if (expiresIn < 5 * 60 * 1000) {
        const isExpired = expiresIn < 0
        const expiresInMinutes = Math.floor(expiresIn / 1000 / 60)
        
        console.log('🔄 Token status:', {
          isExpired,
          expiresInMinutes,
          expiresAt: formatUTCTime(exp),
          currentTime: formatUTCTime(now)
        })
        
        console.log('🔄 Token sắp hết hạn hoặc đã hết hạn, đang refresh...')
        
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (!refreshToken) {
          console.error('❌ No refresh token available in localStorage')
          
          // If token is expired and no refresh token, redirect to login
          if (isExpired) {
            console.warn('🔄 Token expired and no refresh token. Redirecting to login...')
            
            // Clear all auth data
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            
            // Redirect to login page
            if (typeof window !== 'undefined') {
              const loginUrl = '/login'
              const currentUrl = window.location.pathname + window.location.search
              
              // Store return URL for after login
              sessionStorage.setItem('returnUrl', currentUrl)
              
              // Show message before redirect
              alert(
                '🔐 Phiên đăng nhập đã hết hạn.\n\n' +
                'Vui lòng đăng nhập lại để tiếp tục sử dụng.\n\n' +
                'Bạn sẽ được chuyển đến trang đăng nhập...'
              )
              
              // Redirect after short delay
              setTimeout(() => {
                window.location.href = loginUrl
              }, 500)
            }
            
            // Throw error with redirect flag
            const error = new Error(
              `🔐 Token đã hết hạn và không có refresh token.\n\n` +
              `📋 Thông tin chi tiết:\n` +
              `- Token hết hạn lúc: ${formatUTCTime(exp)}\n` +
              `- Thời gian hiện tại: ${formatUTCTime(now)}\n` +
              `- Refresh token: Không có trong localStorage\n\n` +
              `🔄 Đang chuyển đến trang đăng nhập...`
            ) as Error & { redirectToLogin?: boolean }
            error.redirectToLogin = true
            throw error
          } else {
            // Token not expired yet but no refresh token - just warn
            throw new Error(
              `🔐 Token ${isExpired ? 'đã hết hạn' : `sắp hết hạn (còn ${expiresInMinutes} phút)`} và không có refresh token.\n\n` +
              `📋 Thông tin chi tiết:\n` +
              `- Token hết hạn lúc: ${formatUTCTime(exp)}\n` +
              `- Thời gian hiện tại: ${formatUTCTime(now)}\n` +
              `- Refresh token: Không có trong localStorage\n\n` +
              `💡 Cách khắc phục:\n` +
              `1. Nhấn F5 để tải lại trang\n` +
              `2. Đăng xuất và đăng nhập lại\n` +
              `3. Nếu vẫn lỗi, xóa cache: localStorage.clear() trong Console (F12)`
            )
          }
        }
        
        console.log('🔄 Attempting token refresh with refresh_token:', refreshToken.substring(0, 20) + '...')
        
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          const refreshUrl = `${backendUrl}/api/auth/refresh`
          
          console.log('📤 Sending refresh request to:', refreshUrl)
          
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          })
          
          console.log('📥 Refresh response status:', response.status, response.statusText)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📦 Refresh response data keys:', Object.keys(data))
            
            const newToken = data.access_token
            if (newToken && typeof newToken === 'string') {
              localStorage.setItem('access_token', newToken)
              
              // Also update refresh_token if provided
              if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token)
                console.log('✅ Refresh token also updated')
              }
              
              console.log('✅ Token refreshed successfully')
              
              // Log new token info
              logTokenInfo(newToken, 'New (Refreshed)')
              
              return newToken
            } else {
              console.error('❌ Invalid access_token in refresh response:', {
                hasAccessToken: !!data.access_token,
                type: typeof data.access_token,
                dataKeys: Object.keys(data)
              })
              
              throw new Error(
                `🔐 Token refresh failed: Response không chứa access_token hợp lệ.\n\n` +
                `📋 Thông tin chi tiết:\n` +
                `- Response status: ${response.status}\n` +
                `- Response keys: ${Object.keys(data).join(', ')}\n` +
                `- Access token type: ${typeof data.access_token}\n\n` +
                `💡 Cách khắc phục:\n` +
                `1. Kiểm tra backend API /api/auth/refresh có hoạt động không\n` +
                `2. Đăng xuất và đăng nhập lại để lấy token mới\n` +
                `3. Liên hệ admin nếu lỗi vẫn tiếp tục`
              )
            }
          } else {
            let errorDetail = ''
            try {
              const errorData = await response.json()
              errorDetail = errorData.detail || errorData.error || errorData.message || ''
              console.error('❌ Refresh error response:', errorData)
            } catch (e) {
              const errorText = await response.text()
              errorDetail = errorText || response.statusText
              console.error('❌ Refresh error text:', errorText)
            }
            
            // If refresh failed with 401, redirect to login
            if (response.status === 401) {
              console.warn('🔄 Refresh token invalid (401). Redirecting to login...')
              
              // Clear all auth data
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              
              // Redirect to login page
              if (typeof window !== 'undefined') {
                const loginUrl = '/login'
                const currentUrl = window.location.pathname + window.location.search
                
                // Store return URL for after login
                sessionStorage.setItem('returnUrl', currentUrl)
                
                // Show message before redirect
                alert(
                  '🔐 Phiên đăng nhập đã hết hạn.\n\n' +
                  'Refresh token không hợp lệ hoặc đã hết hạn.\n\n' +
                  'Vui lòng đăng nhập lại để tiếp tục sử dụng.\n\n' +
                  'Bạn sẽ được chuyển đến trang đăng nhập...'
                )
                
                // Redirect after short delay
                setTimeout(() => {
                  window.location.href = loginUrl
                }, 500)
              }
              
              // Throw error with redirect flag
              const error = new Error(
                `🔐 Token refresh failed (HTTP 401 Unauthorized).\n\n` +
                `📋 Thông tin chi tiết:\n` +
                `- Token ${isExpired ? 'đã hết hạn' : `sắp hết hạn (còn ${expiresInMinutes} phút)`}\n` +
                `- Refresh endpoint: ${refreshUrl}\n` +
                `- Response status: 401 Unauthorized\n` +
                `- Error detail: ${errorDetail || 'Refresh token invalid or expired'}\n\n` +
                `🔄 Đang chuyển đến trang đăng nhập...`
              ) as Error & { redirectToLogin?: boolean }
              error.redirectToLogin = true
              throw error
            }
            
            throw new Error(
              `🔐 Token refresh failed (HTTP ${response.status}).\n\n` +
              `📋 Thông tin chi tiết:\n` +
              `- Token ${isExpired ? 'đã hết hạn' : `sắp hết hạn (còn ${expiresInMinutes} phút)`}\n` +
              `- Refresh endpoint: ${refreshUrl}\n` +
              `- Response status: ${response.status} ${response.statusText}\n` +
              `- Error detail: ${errorDetail || 'Không có thông tin chi tiết'}\n\n` +
              `💡 Cách khắc phục:\n` +
              `1. Kiểm tra kết nối đến backend: ${backendUrl}\n` +
              `2. Nhấn F5 để tải lại trang\n` +
              `3. Đăng xuất và đăng nhập lại\n` +
              `4. Xóa localStorage: localStorage.clear() trong Console (F12)\n` +
              `5. Nếu vẫn lỗi, liên hệ admin để kiểm tra cấu hình auth`
            )
          }
        } catch (refreshError) {
          console.error('❌ Token refresh exception:', refreshError)
          
          // If it's already our custom error, re-throw it
          if (refreshError instanceof Error && refreshError.message.includes('Token refresh failed')) {
            throw refreshError
          }
          
          // Otherwise create detailed error
          const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError)
          
          throw new Error(
            `🔐 Lỗi khi refresh token.\n\n` +
            `📋 Thông tin chi tiết:\n` +
            `- Token ${isExpired ? 'đã hết hạn' : `sắp hết hạn (còn ${expiresInMinutes} phút)`}\n` +
            `- Error type: ${refreshError instanceof Error ? refreshError.constructor.name : typeof refreshError}\n` +
            `- Error message: ${errorMessage}\n\n` +
            `💡 Cách khắc phục:\n` +
            `1. Kiểm tra kết nối mạng\n` +
            `2. Nhấn F5 để tải lại trang\n` +
            `3. Đăng xuất và đăng nhập lại\n` +
            `4. Xóa cache: localStorage.clear() trong Console (F12)`
          )
        }
      }
      
      // If token is expired and refresh failed, redirect to login
      if (expiresIn < 0) {
        const expiredMinutes = Math.floor(Math.abs(expiresIn) / 1000 / 60)
        
        console.warn(`🔄 Token expired ${expiredMinutes} minutes ago. Redirecting to login...`)
        
        // Clear all auth data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          const loginUrl = '/login'
          const currentUrl = window.location.pathname + window.location.search
          
          // Store return URL for after login
          sessionStorage.setItem('returnUrl', currentUrl)
          
          // Show message before redirect
          alert(
            '🔐 Phiên đăng nhập đã hết hạn.\n\n' +
            `Token đã hết hạn ${expiredMinutes} phút trước.\n\n` +
            'Vui lòng đăng nhập lại để tiếp tục sử dụng.\n\n' +
            'Bạn sẽ được chuyển đến trang đăng nhập...'
          )
          
          // Redirect after short delay
          setTimeout(() => {
            window.location.href = loginUrl
          }, 500)
        }
        
        // Throw error with redirect flag
        const error = new Error(
          `🔐 Token đã hết hạn ${expiredMinutes} phút trước và không thể refresh.\n\n` +
          `📋 Thông tin chi tiết:\n` +
          `- Token hết hạn lúc: ${formatUTCTime(exp)}\n` +
          `- Thời gian hiện tại: ${formatUTCTime(now)}\n` +
          `- Đã hết hạn: ${expiredMinutes} phút\n` +
          `- Refresh token: ${localStorage.getItem('refresh_token') ? 'Có' : 'Không có'}\n\n` +
          `🔄 Đang chuyển đến trang đăng nhập...`
        ) as Error & { redirectToLogin?: boolean }
        error.redirectToLogin = true
        throw error
      }
      
      // Ensure token is not null
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.')
      }
      
      return token
    } catch (e) {
      // If it's our custom error (expired token), re-throw it
      if (e instanceof Error && (e.message.includes('hết hạn') || e.message.includes('refresh') || e.message.includes('Token'))) {
        console.error('🔐 Token error from getValidToken:', {
          message: e.message,
          stack: e.stack,
          type: e.constructor.name
        })
        throw e
      }
      
      // If can't decode, log detailed warning but return token (let backend verify)
      console.warn('⚠️ Could not decode token, will let backend verify:', {
        error: e,
        errorType: e instanceof Error ? e.constructor.name : typeof e,
        errorMessage: e instanceof Error ? e.message : String(e),
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'null'
      })
      
      // Ensure token is not null before returning
      if (!token) {
        throw new Error(
          `🔐 Token không hợp lệ.\n\n` +
          `📋 Thông tin chi tiết:\n` +
          `- Token: Không tồn tại trong localStorage\n` +
          `- Error khi decode: ${e instanceof Error ? e.message : String(e)}\n\n` +
          `💡 Cách khắc phục:\n` +
          `1. Đăng nhập lại để lấy token mới\n` +
          `2. Xóa localStorage: localStorage.clear() trong Console (F12)\n` +
          `3. Refresh và đăng nhập lại`
        )
      }
      
      return token
    }
  }

  const handleImport = async () => {
    if (!analyzedData) return
    
    // Validate required fields
    if (!customerInfo.name || !customerInfo.name.trim()) {
      setError('❌ Vui lòng nhập tên khách hàng')
      return
    }
    
    if (!projectInfo.name || !projectInfo.name.trim()) {
      setError('❌ Vui lòng nhập tên dự án')
      return
    }
    
    // Check if there are any items
    if (!analyzedData.items || analyzedData.items.length === 0) {
      setError('❌ Không có hạng mục nào để import. Vui lòng thêm ít nhất 1 hạng mục.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    console.log('🚀 Starting import process...')
    console.log('📋 Customer:', isNewCustomer ? 'NEW' : selectedCustomerId, '-', customerInfo.name)
    console.log('🏗️ Project:', isNewProject ? 'NEW' : selectedProjectId, '-', projectInfo.name)
    console.log('📦 Items:', analyzedData.items.length)

    try {
      const token = await getValidToken()

      // Load expense_objects to check/create expense objects for material costs
      console.log('🔍 Loading expense_objects...')
      const { data: expenseObjects, error: expenseError } = await supabase
        .from('expense_objects')
        .select('id, name, level, parent_id')
        .eq('is_active', true)
        .in('level', [1, 2, 3])
      
      if (expenseError) {
        console.warn('⚠️ Error loading expense_objects:', expenseError)
      }

      // Helper function to find or create expense object
      const findOrCreateExpenseObject = async (itemName: string, itemDescription?: string): Promise<string | null> => {
        if (!expenseObjects || expenseObjects.length === 0) {
          console.warn('⚠️ No expense_objects loaded')
          return null
        }

        // First, try to find existing expense object by name
        const existingExpense = expenseObjects.find(
          (eo: any) => eo.name?.toLowerCase().trim() === itemName.toLowerCase().trim()
        )
        
        if (existingExpense) {
          console.log(`✅ Found existing expense_object: "${itemName}" (ID: ${existingExpense.id})`)
          return existingExpense.id
        }

        // If not found, find or create "Khác" parent
        const otherCostNames = ['đối tượng chi phí khác', 'chi phí khác', 'khác']
        let otherCostParent = expenseObjects.find((eo: any) => {
          const nameLower = eo.name?.toLowerCase().trim() || ''
          return otherCostNames.some(otherName => nameLower === otherName || nameLower.includes(otherName))
        })

        // If parent not found, create it
        if (!otherCostParent) {
          console.log('📋 Creating parent "Đối tượng chi phí khác"...')
          const parentId = crypto.randomUUID()
          const { data: newParent, error: parentError } = await supabase
            .from('expense_objects')
            .insert({
              id: parentId,
              name: 'Đối tượng chi phí khác',
              description: 'Các đối tượng chi phí khác không phân loại',
              level: 1,
              role: 'other',
              is_active: true
            })
            .select('id')
            .single()
          
          if (parentError || !newParent) {
            console.error('❌ Error creating parent expense_object:', parentError)
            return null
          }
          
          otherCostParent = { id: newParent.id, name: 'Đối tượng chi phí khác', level: 1 }
          console.log(`✅ Created parent expense_object: ${newParent.id}`)
        }

        // Create new expense object under "Khác"
        console.log(`📋 Creating expense_object: "${itemName}" under parent "${otherCostParent.name}"`)
        const expenseId = crypto.randomUUID()
        const { data: newExpense, error: expenseCreateError } = await supabase
          .from('expense_objects')
          .insert({
            id: expenseId,
            name: itemName,
            description: itemDescription || itemName,
            parent_id: otherCostParent.id,
            level: 2,
            role: 'material',
            is_active: true
          })
          .select('id')
          .single()
        
        if (expenseCreateError || !newExpense) {
          console.error('❌ Error creating expense_object:', expenseCreateError)
          return null
        }
        
        console.log(`✅ Created expense_object: "${itemName}" (ID: ${newExpense.id})`)
        return newExpense.id
      }

      // Process items: find/create expense_objects for material costs and format product_components
      const processedItems = await Promise.all(
        analyzedData.items.map(async (item, index) => {
          let expenseObjectId = item.expense_object_id
          
          // If it's a material cost, find or create expense_object
          if (item.item_type === 'material_cost') {
            const itemName = item.ten_san_pham || item.loai_san_pham || `Chi phí ${index + 1}`
            expenseObjectId = await findOrCreateExpenseObject(itemName, item.mo_ta)
          }
          
          return {
            ...item,
            expense_object_id: expenseObjectId
          }
        })
      )

      // Group material costs by belongs_to_product_id and format product_components
      const itemsWithComponents = processedItems.map((item, index) => {
        if (item.item_type === 'product') {
          // Find all material costs that belong to this product
          // belongs_to_product_id is stored as string index in the original items array
          const materialCosts = processedItems.filter(
            (costItem, costIndex) => {
              if (costItem.item_type !== 'material_cost') return false
              // Check if belongs_to_product_id matches this product's index
              const belongsToIndex = costItem.belongs_to_product_id 
                ? parseInt(costItem.belongs_to_product_id) 
                : -1
              return belongsToIndex === index
            }
          )
          
          // Format product_components
          const productComponents = materialCosts.map((costItem) => ({
            expense_object_id: costItem.expense_object_id || null,
            name: costItem.ten_san_pham || costItem.loai_san_pham || null,
            unit: costItem.dvt || '',
            unit_price: Number(costItem.don_gia || 0),
            quantity: Number(costItem.so_luong || 0),
            total_price: Number(costItem.thanh_tien || 0)
          }))
          
          return {
            ...item,
            product_components: productComponents.length > 0 ? productComponents : []
          }
        }
        
        return item
      })

      // Prepare import data with edited customer and project info
      const importData = {
        ...analyzedData,
        items: itemsWithComponents,
        customer: {
          ...analyzedData.customer,
          ...customerInfo,
          name: customerInfo.name.trim(),
          id: isNewCustomer ? undefined : selectedCustomerId  // Include customer ID if using existing
        },
        project: {
          ...analyzedData.project,
          ...projectInfo,
          name: projectInfo.name.trim(),
          id: isNewProject ? undefined : selectedProjectId,  // Include project ID if using existing
          customer_id: isNewCustomer ? undefined : selectedCustomerId
        },
        // Use selected employee or current employee as fallback
        employee_id: selectedEmployeeId || currentEmployeeId || null,
        // Include current user info for tracking
        created_by: currentUser?.id || null,
        created_by_name: currentUser?.full_name || currentUser?.email || null,
        is_new_customer: isNewCustomer,
        is_new_project: isNewProject
      }
      
      console.log('📤 Sending import request with data:', {
        customer: importData.customer.name,
        customerId: importData.customer.id,
        isNewCustomer,
        project: importData.project.name,
        projectId: importData.project.id,
        isNewProject,
        itemsCount: importData.items.length,
        employeeId: importData.employee_id,
        createdBy: importData.created_by,
        createdByName: importData.created_by_name,
        currentUser: currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.full_name,
          role: currentUser.role
        } : null
      })

      // Try calling backend directly (to avoid Next.js middleman issues)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const apiUrl = `${backendUrl}/api/sales/quotes/import-from-analysis`
      
      // Validate token before sending
      if (!token || token.length < 50) {
        throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.')
      }
      
      // Check token expiration
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000
        const now = Date.now()
        
        if (exp < now) {
          throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.')
        }
        
        console.log('🔑 Token info:', {
          userId: payload.sub || payload.user_id,
          exp: new Date(exp).toISOString(),
          expiresIn: Math.floor((exp - now) / 1000 / 60) + ' minutes'
        })
      } catch (e) {
        console.warn('⚠️ Could not parse token:', e)
        // Continue anyway, let backend verify
      }
      
      console.log('🎯 Calling backend directly:', apiUrl)
      console.log('🔑 Token preview:', token.substring(0, 30) + '...' + token.substring(token.length - 10))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      })
      
      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorData: any = {}
        let errorMessage = 'Lỗi khi import'
        let errorDetail = ''
        
        try {
          errorData = await response.json()
          console.error('❌ Import failed (JSON):', errorData)
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage
          errorDetail = errorData.detail || errorData.error || ''
        } catch (e) {
          // Can't parse JSON, try text
          try {
            const errorText = await response.text()
            console.error('❌ Import failed (text):', errorText)
            errorMessage = errorText || errorMessage
            errorDetail = errorText
          } catch (e2) {
            console.error('❌ Import failed (unknown):', e2)
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        }
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('🔐 Authentication failed:', {
            status: response.status,
            errorData,
            tokenPreview: token.substring(0, 30) + '...'
          })
          
          throw new Error(
            '🔐 Xác thực thất bại (401 Unauthorized)\n\n' +
            `Chi tiết: ${errorDetail || 'Token không hợp lệ hoặc đã hết hạn'}\n\n` +
            '📝 Cách khắc phục:\n' +
            '1. Nhấn F5 để tải lại trang\n' +
            '2. Đăng xuất và đăng nhập lại\n' +
            '3. Xóa localStorage và đăng nhập lại:\n' +
            '   - Mở DevTools (F12)\n' +
            '   - Console: localStorage.clear()\n' +
            '   - Refresh và đăng nhập lại\n\n' +
            'Nếu vẫn gặp lỗi, liên hệ admin để kiểm tra cấu hình Supabase JWT.'
          )
        }
        
        // Handle other JWT/token errors
        const lowerError = errorMessage.toLowerCase()
        if (lowerError.includes('jwt') || lowerError.includes('token') || lowerError.includes('signature') || lowerError.includes('unauthorized')) {
          throw new Error(
            '🔐 Lỗi xác thực token\n\n' +
            `Chi tiết: ${errorMessage}\n\n` +
            '📝 Cách khắc phục:\n' +
            '1. Nhấn F5 để tải lại trang\n' +
            '2. Đăng xuất và đăng nhập lại\n' +
            '3. Xóa cache trình duyệt (Ctrl+Shift+Delete)\n\n' +
            'Nếu vẫn gặp lỗi, liên hệ admin để kiểm tra token configuration.'
          )
        }
        
        // Generic error
        throw new Error(
          `❌ Lỗi khi import (HTTP ${response.status})\n\n` +
          `${errorMessage}\n\n` +
          (errorDetail ? `Chi tiết: ${errorDetail}\n\n` : '') +
          'Vui lòng thử lại hoặc liên hệ admin nếu lỗi vẫn tiếp tục.'
        )
      }

      const result = await response.json()
      console.log('✅ Import successful:', result)
      
      // Create detailed success message with all information
      const successDetails: string[] = []
      
      // Customer information
      if (result.createdCustomers > 0) {
        successDetails.push(`✨ Đã tạo ${result.createdCustomers} khách hàng mới`)
      }
      
      // Project information
      if (result.createdProjects > 0) {
        successDetails.push(`🏗️ Đã tạo ${result.createdProjects} dự án mới`)
      }
      
      // Quote information
      if (result.createdQuotes > 0) {
        successDetails.push(`📄 Đã tạo ${result.createdQuotes} báo giá`)
        if (result.quoteNumber) {
          successDetails.push(`   └─ Số báo giá: ${result.quoteNumber}`)
        } else if (result.quoteId) {
          successDetails.push(`   └─ ID báo giá: ${result.quoteId}`)
        }
      }
      
      // Product information
      if (result.matchedProducts > 0) {
        successDetails.push(`✓ Đã sử dụng ${result.matchedProducts} sản phẩm có sẵn`)
      }
      if (result.createdProducts > 0) {
        successDetails.push(`✨ Đã tạo ${result.createdProducts} sản phẩm mới`)
      }
      
      // Cost items information
      if (result.costItems > 0) {
        successDetails.push(`💰 Đã lưu ${result.costItems} chi phí vật tư vào sản phẩm`)
      }
      
      // Create formatted success message
      const successMessage = `🎉 Import thành công!\n\n${successDetails.join('\n')}`
      
      setSuccess(successMessage)
      
      // Log detailed matching info
      if (result.matchedProductDetails && result.matchedProductDetails.length > 0) {
        console.log('✅ Matched products:', result.matchedProductDetails)
      }
      if (result.newProductDetails && result.newProductDetails.length > 0) {
        console.log('✨ New products created:', result.newProductDetails)
      }
      
      // Clear data and redirect after success
      if (onImportSuccess) {
        setTimeout(() => {
          handleClearData()
          onImportSuccess()
        }, 3000)
      }
    } catch (error: any) {
      console.error('❌ Error importing:', error)
      console.error('❌ Error stack:', error.stack)
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        type: typeof error,
        constructor: error.constructor?.name
      })
      
      let errorMessage = error.message || 'Lỗi khi import'
      
      // Check if error is from getValidToken (token expiration/refresh issues)
      if (errorMessage.includes('hết hạn') || errorMessage.includes('refresh') || errorMessage.includes('Token')) {
        // Check if this is a redirect case
        const shouldRedirect = (error as any)?.redirectToLogin === true
        
        if (shouldRedirect) {
          // Don't set error message, redirect is already happening
          console.log('🔄 Redirecting to login page...')
          return // Exit early, redirect is handled in getValidToken
        }
        
        // Error already has detailed information from getValidToken
        // Just ensure it's displayed properly
        console.error('🔐 Token-related error detected:', {
          message: errorMessage,
          hasDetailedInfo: errorMessage.includes('📋 Thông tin chi tiết'),
          hasInstructions: errorMessage.includes('💡 Cách khắc phục'),
          shouldRedirect
        })
      } else if (errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('Phiên đăng nhập') || errorMessage.includes('Unauthorized')) {
        // Generic token error - add more context
        const token = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        
        errorMessage = 
          `🔐 Lỗi xác thực token\n\n` +
          `📋 Thông tin chi tiết:\n` +
          `- Lỗi: ${errorMessage}\n` +
          `- Access token: ${token ? `Có (${token.length} ký tự)` : 'Không có'}\n` +
          `- Refresh token: ${refreshToken ? `Có (${refreshToken.length} ký tự)` : 'Không có'}\n` +
          `- Backend URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\n\n` +
          `💡 Cách khắc phục:\n` +
          `1. Nhấn F5 để tải lại trang\n` +
          `2. Đăng xuất và đăng nhập lại\n` +
          `3. Xóa localStorage:\n` +
          `   - Mở DevTools (F12)\n` +
          `   - Console: localStorage.clear()\n` +
          `   - Refresh và đăng nhập lại\n` +
          `4. Nếu vẫn lỗi, liên hệ admin để kiểm tra cấu hình auth`
      } else {
        // Other errors - add context
        errorMessage = 
          `❌ Lỗi khi import\n\n` +
          `📋 Chi tiết lỗi:\n` +
          `${errorMessage}\n\n` +
          `💡 Cách khắc phục:\n` +
          `1. Kiểm tra lại thông tin đã nhập\n` +
          `2. Thử lại sau vài giây\n` +
          `3. Nếu lỗi vẫn tiếp tục, liên hệ admin\n\n` +
          `Thông tin debug:\n` +
          `- Error type: ${error.name || 'Unknown'}\n` +
          `- Timestamp: ${formatUTCTime(Date.now())}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Sparkles className="h-6 w-6 mr-2" />
              Import Báo giá từ Excel với AI
            </h2>
            <p className="text-blue-100">
              Upload file Excel (.xlsx, .xls) và để AI tự động phân tích, trích xuất thông tin khách hàng và sản phẩm
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {analyzedData && (
              <button
                onClick={handleClearData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Xóa dữ liệu</span>
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Tải file mẫu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  👤 Người thực hiện: {currentUser.full_name || currentUser.email || 'N/A'}
                </p>
                {currentUser.role && (
                  <p className="text-xs text-gray-600">
                    Vai trò: {currentUser.role}
                  </p>
                )}
                {currentEmployeeId && (
                  <p className="text-xs text-gray-600">
                    Nhân viên ID: {currentEmployeeId}
                  </p>
                )}
              </div>
            </div>
            {currentEmployeeId && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                ✓ Đã liên kết với nhân viên
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Model Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">
                🤖 Chọn Model AI
              </label>
              <p className="text-xs text-gray-600">
                Chọn model AI để phân tích file Excel
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-md ml-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={analyzing}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {availableModels.find(m => m.value === selectedModel)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
              accept=".xlsx,.xls"
            onChange={handleFileSelect}
            onClick={(e) => {
              // Reset value to allow selecting the same file again
              const target = e.target as HTMLInputElement
              target.value = ''
            }}
            className="hidden"
            id="document-upload-ai"
            key={analyzedData ? 'has-data' : 'no-data'}
          />
          <label
            htmlFor="document-upload-ai"
            className="cursor-pointer flex flex-col items-center space-y-4"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <span className="text-lg font-medium text-gray-700">
                  🤖 AI đang phân tích file...
                </span>
                <span className="text-sm text-gray-500">
                  Đang gửi dữ liệu đến OpenAI GPT-4o để trích xuất thông tin
                </span>
                <span className="text-xs text-blue-600 mt-2">
                  ⏳ Quá trình này có thể mất 10-30 giây tùy vào độ phức tạp của file (PDF có thể mất thêm thời gian)
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-4">
                  <FileSpreadsheet className="h-16 w-16 text-gray-400" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-medium text-gray-700">
                    Chọn file Excel để upload
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Hỗ trợ .xlsx, .xls - AI sẽ tự động phân tích và trích xuất thông tin
                  </p>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Lưu ý quan trọng:</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• <strong>Đóng file Excel</strong> trước khi upload</li>
                      <li>• <strong>Không upload file có tên bắt đầu bằng ~$</strong> (đây là file tạm)</li>
                      <li>• File phải có <strong>kích thước {'>'} 10KB</strong></li>
                      <li>• Đảm bảo file có <strong>đầy đủ dữ liệu</strong> báo giá</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 shadow-md">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-800 mb-3">🎉 Import thành công!</h3>
              <div className="space-y-2">
                {success.split('\n').map((line, index) => {
                  // Skip empty lines
                  if (!line.trim()) return null
                  
                  // Format different types of lines
                  if (line.startsWith('🎉')) {
                    return null // Skip the title line as we have it in h3
                  } else if (line.startsWith('   └─')) {
                    // Sub-item (indented)
                    return (
                      <p key={index} className="text-sm text-green-700 ml-4 font-mono">
                        {line}
                      </p>
                    )
                  } else if (line.trim().startsWith('✨') || line.trim().startsWith('🏗️') || 
                             line.trim().startsWith('📄') || line.trim().startsWith('✓') || 
                             line.trim().startsWith('💰')) {
                    // Main item with icon
                    return (
                      <p key={index} className="text-sm font-semibold text-green-800">
                        {line}
                      </p>
                    )
                  } else {
                    // Regular line
                    return (
                      <p key={index} className="text-sm text-green-700">
                        {line}
                      </p>
                    )
                  }
                })}
              </div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-500 transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Debug Info Panel */}
      {debugInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center justify-between text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔍</span>
              <span>Thông tin debug - AI đã quét được gì?</span>
              {debugInfo.warnings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
                  {debugInfo.warnings.length} cảnh báo
                </span>
              )}
            </div>
            {showDebug ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {showDebug && (
            <div className="mt-4 space-y-4">
              {/* Warnings */}
              {debugInfo.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-bold text-yellow-900 mb-2">⚠️ Cảnh báo:</h4>
                  <ul className="space-y-1">
                    {debugInfo.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Document Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 mb-2">📄 Thông tin file:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Độ dài:</strong> {debugInfo.documentPreview.totalLength.toLocaleString()} ký tự</p>
                  <p><strong>Số dòng:</strong> {debugInfo.documentPreview.lineCount.toLocaleString()} dòng</p>
                </div>
                <details className="mt-2">
                  <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                    Xem preview dữ liệu (500 ký tự đầu)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                    {debugInfo.documentPreview.first500Chars}
                  </pre>
                </details>
              </div>
              
              {/* Extracted Info Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 mb-2">📊 Thông tin đã trích xuất:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.customerFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.customerFound ? 'text-gray-900' : 'text-gray-500'}>
                      Khách hàng: {debugInfo.extractedInfo.customerName || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.addressFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.addressFound ? 'text-gray-900' : 'text-gray-500'}>
                      Địa chỉ: {debugInfo.extractedInfo.address || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.phoneFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.phoneFound ? 'text-gray-900' : 'text-gray-500'}>
                      SĐT: {debugInfo.extractedInfo.phone || 'Không tìm thấy'}
                      {debugInfo.extractedInfo.phoneFound && (
                        <span className="text-xs text-yellow-600 ml-1">(Có thể là SĐT nhân viên, không tự động điền)</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.supervisorFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.supervisorFound ? 'text-gray-900' : 'text-gray-500'}>
                      Giám sát: {debugInfo.extractedInfo.supervisor || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.dateFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.dateFound ? 'text-gray-900' : 'text-gray-500'}>
                      Ngày: {debugInfo.extractedInfo.date || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.itemsCount > 0 ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.itemsCount > 0 ? 'text-gray-900' : 'text-gray-500'}>
                      Items: {debugInfo.extractedInfo.itemsCount}
                    </span>
                  </div>
                </div>
                
                {/* Items Preview */}
                {debugInfo.extractedInfo.itemsPreview.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                      Xem 3 items đầu tiên
                    </summary>
                    <div className="mt-2 space-y-2">
                      {debugInfo.extractedInfo.itemsPreview.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="font-semibold text-gray-900">
                            {item.ten_san_pham || `Item ${index + 1}`}
                          </div>
                          <div className="text-gray-600">
                            Loại: {item.loai_san_pham || 'N/A'} | 
                            SL: {item.so_luong} | 
                            Đơn giá: {item.don_gia.toLocaleString()} | 
                            Thành tiền: {item.thanh_tien.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                {/* Financial Summary */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng khối lượng:</span>
                      <span className={`font-semibold ${debugInfo.extractedInfo.subtotalFound ? 'text-gray-900' : 'text-red-600'}`}>
                        {debugInfo.extractedInfo.subtotal.toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT:</span>
                      <span className={`font-semibold ${debugInfo.extractedInfo.vatFound ? 'text-gray-900' : 'text-gray-500'}`}>
                        {debugInfo.extractedInfo.taxAmount.toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-900 font-bold">Tổng thanh toán:</span>
                      <span className={`font-bold ${debugInfo.extractedInfo.totalFound ? 'text-blue-600' : 'text-red-600'}`}>
                        {debugInfo.extractedInfo.totalAmount.toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Processing Steps */}
              <details className="bg-white border border-gray-200 rounded-lg p-3">
                <summary className="font-bold text-gray-900 cursor-pointer hover:text-blue-600">
                  🔄 Các bước xử lý ({debugInfo.processingSteps.length} bước)
                </summary>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {debugInfo.processingSteps.map((step, index) => (
                    <div key={index} className="text-xs text-gray-700 pl-4 border-l-2 border-gray-200">
                      {step}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Analyzed Data Display */}
      {analyzedData && (
        <div className="space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin khách hàng</h3>
            </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewCustomer}
                  onChange={(e) => {
                    setIsNewCustomer(e.target.checked)
                    if (e.target.checked) {
                      setSelectedCustomerId('')
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Khách hàng mới</span>
              </label>
            </div>
            
            {!isNewCustomer && selectedCustomerId && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm font-bold text-green-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ AI đã tự động tìm thấy khách hàng có sẵn trong hệ thống</span>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Hệ thống đã so sánh tên "{customerInfo.name}" với danh sách và tìm thấy khách hàng khớp
                </p>
              </div>
            )}
            
            {!isNewCustomer && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chọn khách hàng có sẵn {selectedCustomerId && '(đã tự động chọn)'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value)
                    setSelectedCustomerId(e.target.value)
                    if (customer) {
                      // Chỉ lấy phone từ database, không lấy từ customerInfo (có thể từ AI analysis)
                      setCustomerInfo({
                        name: customer.name,
                        address: customerInfo.address || '',
                        phone: customer.phone || '',  // Chỉ lấy từ database
                        email: customer.email || customerInfo.email || ''
                      })
                    }
                    // Load projects for selected customer
                    if (e.target.value) {
                      fetchProjects(e.target.value)
                      setSelectedProjectId('')  // Reset project selection
                      setIsNewProject(true)
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Tên khách hàng <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-semibold text-gray-900"
                  placeholder="Nhập tên khách hàng"
                  required
                  disabled={!isNewCustomer && selectedCustomerId !== ''}
                />
              </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập địa chỉ khách hàng"
                />
                </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập số điện thoại"
                />
                </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập email"
                />
              </div>
            </div>
            
            {isNewCustomer && (
              <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p className="text-sm font-bold text-blue-900">
                  ✨ Khách hàng mới sẽ được tự động tạo khi bạn xác nhận import
                </p>
                </div>
              )}
            
            {!customerInfo.name && (
              <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ AI không tìm thấy thông tin khách hàng trong file. Vui lòng nhập thủ công.
                </p>
            </div>
            )}
          </div>

          {/* Project Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin dự án</h3>
            </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewProject}
                  onChange={(e) => {
                    setIsNewProject(e.target.checked)
                    if (e.target.checked) {
                      setSelectedProjectId('')
                    }
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Dự án mới</span>
              </label>
            </div>
            
            {!isNewProject && selectedCustomerId && selectedProjectId && (
              <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-sm font-bold text-purple-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ AI đã tự động tìm thấy dự án có sẵn cho khách hàng này</span>
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Hệ thống đã so sánh tên "{projectInfo.name}" với danh sách dự án và tìm thấy dự án khớp
                </p>
              </div>
            )}
            
            {!isNewProject && selectedCustomerId && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chọn dự án có sẵn {selectedProjectId && '(đã tự động chọn)'}
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value)
                    setSelectedProjectId(e.target.value)
                    if (project) {
                      setProjectInfo({
                        ...projectInfo,
                        name: project.name
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {!isNewProject && !selectedCustomerId && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-sm font-bold text-amber-900">
                  ⚠️ Vui lòng chọn khách hàng trước để hiển thị danh sách dự án
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Tên dự án <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={projectInfo.name}
                  onChange={(e) => setProjectInfo({ ...projectInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-semibold text-gray-900"
                  placeholder="Nhập tên dự án"
                  required
                  disabled={!isNewProject && selectedProjectId !== ''}
                />
              </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Địa chỉ dự án</label>
                <input
                  type="text"
                  value={projectInfo.address}
                  onChange={(e) => setProjectInfo({ ...projectInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                  placeholder="Nhập địa chỉ dự án"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-1">Nhân viên trách nhiệm / Giám sát</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value)
                    const employee = employees.find(emp => emp.id === e.target.value)
                    if (employee) {
                      setProjectInfo({ ...projectInfo, supervisor: employee.full_name })
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={projectInfo.supervisor}
                  onChange={(e) => setProjectInfo({ ...projectInfo, supervisor: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-2 text-gray-900 font-medium"
                  placeholder="Hoặc nhập tên nhân viên trách nhiệm"
                />
              </div>
            </div>
            
            {isNewProject && (
              <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-sm font-bold text-purple-900">
                  ✨ Dự án mới sẽ được tự động tạo khi bạn xác nhận import
                </p>
                </div>
              )}
            
            {!projectInfo.name && (
              <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ AI không tìm thấy thông tin dự án trong file. Vui lòng nhập thủ công.
                </p>
                </div>
              )}
          </div>

          {/* Quote Items Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Danh sách hạng mục</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-900 font-semibold">Đã có trong hệ thống</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-gray-900 font-semibold">Sản phẩm mới</span>
                  </div>
                </div>
                {isEditingAll ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (analyzedData) {
                          // Recalculate totals - calculate tax for each item based on its own tax_rate
                          const newSubtotal = analyzedData.items.reduce((sum, item) => sum + (item.thanh_tien || 0), 0)
                          
                          // Calculate tax for each item
                          const newTaxAmount = analyzedData.items.reduce((sum, item) => {
                            if (item.has_tax !== false) {
                              const itemTaxRate = item.tax_rate !== undefined 
                                ? item.tax_rate 
                                : (analyzedData.tax_rate || 0.08)
                              return sum + (item.thanh_tien || 0) * itemTaxRate
                            }
                            return sum
                          }, 0)
                          
                          const newTotalAmount = newSubtotal + newTaxAmount
                          
                          setAnalyzedData({
                            ...analyzedData,
                            subtotal: newSubtotal,
                            tax_amount: newTaxAmount,
                            total_amount: newTotalAmount
                          })
                        }
                        setIsEditingAll(false)
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Lưu tất cả
                    </button>
                    <button
                      onClick={() => setIsEditingAll(false)}
                      className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      + Sản phẩm
                    </button>
                    <button
                      onClick={addFreeProductItem}
                      className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Thêm SP tự do
                    </button>
                    <button
                      onClick={() => setIsEditingAll(true)}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <div className="bg-white border-2 border-gray-500 rounded-md inline-block min-w-max">
                <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-500 sticky top-0 z-10 shadow-sm">
                  <div className="grid gap-1 text-xs font-medium text-black items-start" style={{
                    gridTemplateColumns: '80px 100px 50px 100px 100px 120px 220px 140px 220px 60px 70px 70px 80px 90px 130px 130px 80px 90px'
                  }}>
                    <div className="text-center">Xóa</div>
                    <div>Trạng thái</div>
                    <div>STT</div>
                    <div>Loại</div>
                    <div>Ký hiệu</div>
                    <div>Loại SP</div>
                    <div>Tên sản phẩm</div>
                    <div>Thuộc sản phẩm</div>
                    <div>Mô tả</div>
                    <div className="text-center">ĐVT</div>
                    <div className="text-center">Ngang (m)</div>
                    <div className="text-center">Cao (m)</div>
                    <div className="text-right">Số lượng</div>
                    <div className="text-right">Diện tích (m²)</div>
                    <div className="text-right">Đơn giá</div>
                    <div className="text-right">Thành tiền</div>
                    <div className="text-center">Có VAT</div>
                    <div className="text-center">Thuế %</div>
                  </div>
                </div>

                <div className="divide-y-2 divide-gray-500">
                  {analyzedData.items.map((item, index) => {
                    const matchStatus = productMatchStatus.find(m => m.index === index)
                    const exists = matchStatus?.exists || false
                    const borderColor = exists ? 'border-l-4 border-green-500' : 'border-l-4 border-amber-500'
                    
                    const itemType = item.item_type || 'product'
                    
                    // Update item directly in analyzedData
                    const updateItemField = (field: keyof QuoteItem, value: any) => {
                      if (analyzedData) {
                        const updatedItems = [...analyzedData.items]
                        const currentItem = updatedItems[index]
                        
                        if (field === 'so_luong' || field === 'don_gia' || field === 'dien_tich') {
                          const soLuong = field === 'so_luong' ? value : (currentItem.so_luong || 0)
                          const donGia = field === 'don_gia' ? value : (currentItem.don_gia || 0)
                          const dienTich = field === 'dien_tich' ? value : (currentItem.dien_tich)
                          
                          // Calculate thanh_tien
                          const thanhTien = dienTich && dienTich > 0
                            ? donGia * dienTich * soLuong
                            : donGia * soLuong
                          
                          updatedItems[index] = {
                            ...currentItem,
                            [field]: value,
                            thanh_tien: thanhTien
                          }
                        } else if (field === 'thanh_tien') {
                          const soLuong = currentItem.so_luong || 1
                          const dienTich = currentItem.dien_tich
                          // Calculate don_gia based on formula: if dien_tich exists: don_gia × dien_tich × so_luong, otherwise: don_gia × so_luong
                          const newDonGia = dienTich && dienTich > 0
                            ? (soLuong > 0 && dienTich > 0 ? value / (dienTich * soLuong) : 0)
                            : (soLuong > 0 ? value / soLuong : 0)
                          updatedItems[index] = {
                            ...currentItem,
                            [field]: value,
                            don_gia: newDonGia
                          }
                        } else {
                          updatedItems[index] = {
                            ...currentItem,
                            [field]: value
                          }
                        }
                        
                        // Recalculate totals after updating item
                        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.thanh_tien || 0), 0)
                        const newTaxAmount = updatedItems.reduce((sum, item) => {
                          if (item.has_tax !== false) {
                            const itemTaxRate = item.tax_rate !== undefined 
                              ? item.tax_rate 
                              : (analyzedData.tax_rate || 0.08)
                            return sum + (item.thanh_tien || 0) * itemTaxRate
                          }
                          return sum
                        }, 0)
                        const newTotalAmount = newSubtotal + newTaxAmount
                        
                        setAnalyzedData({
                          ...analyzedData,
                          items: updatedItems,
                          subtotal: newSubtotal,
                          tax_amount: newTaxAmount,
                          total_amount: newTotalAmount
                        })
                      }
                    }
                    
                    return (
                      <div
                        key={index}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors px-4 py-3 ${borderColor}`}
                      >
                        <div className="grid gap-1 items-start text-xs" style={{
                          gridTemplateColumns: '80px 100px 50px 100px 100px 120px 220px 140px 220px 60px 70px 70px 80px 90px 130px 130px 80px 90px'
                        }}>
                          <div className="min-h-[28px] flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => deleteItemAtIndex(index)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 border border-red-300"
                              title="Xóa dòng này"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div>
                          {exists ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span className="text-xs font-bold text-green-800">Đã có</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <span className="text-xs font-bold text-amber-800">Tạo mới</span>
                            </div>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {isEditingAll ? (
                            <input
                              type="number"
                              value={item.stt || index + 1}
                              onChange={(e) => updateItemField('stt', parseInt(e.target.value) || index + 1)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                            />
                          ) : (
                            <span className="text-gray-900 font-bold">{item.stt || index + 1}</span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {isEditingAll ? (
                            <select
                              value={item.item_type || 'product'}
                              onChange={(e) => updateItemField('item_type', e.target.value as 'product' | 'material_cost')}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                            >
                              <option value="product">Sản phẩm</option>
                              <option value="material_cost">Chi phí vật tư</option>
                            </select>
                          ) : (
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                              itemType === 'material_cost' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {itemType === 'material_cost' ? '💰 Chi phí' : '📦 Sản phẩm'}
                            </div>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                            {isEditingAll ? (
                              <input
                                type="text"
                                value={item.ky_hieu || ''}
                                onChange={(e) => updateItemField('ky_hieu', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                                placeholder="Ký hiệu"
                              />
                            ) : (
                              item.ky_hieu || <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {isEditingAll ? (
                            <input
                              type="text"
                              value={item.loai_san_pham || ''}
                              onChange={(e) => updateItemField('loai_san_pham', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="Loại sản phẩm"
                            />
                          ) : (
                            item.loai_san_pham ? (
                            <div className="font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                              {item.loai_san_pham}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Chưa phân loại</span>
                            )
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {isEditingAll ? (
                            <input
                              type="text"
                              value={item.ten_san_pham || ''}
                              onChange={(e) => updateItemField('ten_san_pham', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="Tên sản phẩm"
                            />
                          ) : (
                            <>
                          <div className="font-bold text-gray-900">
                                {item.ten_san_pham || 
                                 (item.hang_muc_thi_cong && typeof item.hang_muc_thi_cong === 'string' 
                                   ? item.hang_muc_thi_cong.split('\n')[0] 
                                   : item.hang_muc_thi_cong) || 
                                 'Chưa có tên'}
                          </div>
                          {matchStatus?.matchedProduct && (
                            <div className="mt-1 text-xs text-green-700 font-semibold">
                              ✓ Khớp: {matchStatus.matchedProduct.name}
                            </div>
                              )}
                            </>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {itemType === 'material_cost' ? (
                            isEditingAll ? (
                              <select
                                value={item.belongs_to_product_id || ''}
                                onChange={(e) => {
                                  const selectedIndex = parseInt(e.target.value)
                                  const selectedProduct = analyzedData?.items[selectedIndex]
                                  updateItemField('belongs_to_product_id', e.target.value)
                                  updateItemField('belongs_to_product_name', selectedProduct?.ten_san_pham || 
                                    (selectedProduct?.hang_muc_thi_cong && typeof selectedProduct.hang_muc_thi_cong === 'string'
                                      ? selectedProduct.hang_muc_thi_cong.split('\n')[0]
                                      : '') || 
                                    `Sản phẩm ${selectedIndex + 1}`)
                                }}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              >
                                <option value="">-- Chọn sản phẩm --</option>
                                {analyzedData?.items.map((it, idx) => {
                                  if (it.item_type === 'product') {
                                    const productName = it.ten_san_pham || 
                                      (it.hang_muc_thi_cong && typeof it.hang_muc_thi_cong === 'string'
                                        ? it.hang_muc_thi_cong.split('\n')[0]
                                        : '') || 
                                      `Sản phẩm ${idx + 1}`
                                    return (
                                      <option key={idx} value={idx}>
                                        {productName}
                                      </option>
                                    )
                                  }
                                  return null
                                })}
                              </select>
                            ) : (
                              item.belongs_to_product_name ? (
                                <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                  {item.belongs_to_product_name}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">Chưa chọn</span>
                              )
                            )
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center">
                          {isEditingAll ? (
                            <textarea
                              value={item.mo_ta || ''}
                              onChange={(e) => updateItemField('mo_ta', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[28px]"
                              placeholder="Mô tả"
                              rows={2}
                            />
                          ) : (
                            (() => {
                              const fullDescription = item.mo_ta || 
                                (item.hang_muc_thi_cong && typeof item.hang_muc_thi_cong === 'string'
                                  ? item.hang_muc_thi_cong.split('\n').slice(1).join('\n')
                                  : '') || 
                                '-'
                              const truncatedDescription = fullDescription.length > 50 
                                ? fullDescription.substring(0, 50) + '...' 
                                : fullDescription
                              
                              return (
                                <div 
                                  className="text-xs text-gray-900 leading-relaxed cursor-help hover:text-gray-700 transition-colors"
                                  title={fullDescription !== '-' ? fullDescription : undefined}
                                >
                                  {truncatedDescription}
                                </div>
                              )
                            })()
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-center">
                          {isEditingAll ? (
                            <input
                              type="text"
                              value={item.dvt || ''}
                              onChange={(e) => updateItemField('dvt', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="ĐVT"
                            />
                          ) : (
                            <span className="text-gray-900 font-semibold">{item.dvt || '-'}</span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-center">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.ngang || ''}
                              onChange={(e) => updateItemField('ngang', parseFloat(e.target.value) || undefined)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="Ngang"
                            />
                          ) : (
                            item.ngang != null && item.ngang !== undefined ? (
                              <span className="font-bold text-blue-700">
                                {typeof item.ngang === 'number' 
                                  ? item.ngang.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                                  : item.ngang}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-center">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.cao || ''}
                              onChange={(e) => updateItemField('cao', parseFloat(e.target.value) || undefined)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="Cao"
                            />
                          ) : (
                            item.cao != null && item.cao !== undefined ? (
                              <span className="font-bold text-blue-700">
                                {typeof item.cao === 'number' 
                                  ? item.cao.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                                  : item.cao}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-end">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.so_luong || 0}
                              onChange={(e) => updateItemField('so_luong', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                            />
                          ) : (
                            <span className="font-bold text-purple-700">
                              {item.so_luong || 0}
                            </span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-end">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.dien_tich || ''}
                              onChange={(e) => updateItemField('dien_tich', parseFloat(e.target.value) || undefined)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="Diện tích"
                            />
                          ) : (
                            item.dien_tich != null && item.dien_tich !== undefined ? (
                              <span className="font-bold text-green-700">
                                {typeof item.dien_tich === 'number' 
                                  ? item.dien_tich.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : item.dien_tich}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-end">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.don_gia || 0}
                              onChange={(e) => updateItemField('don_gia', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                            />
                          ) : (
                            <span className="text-gray-900 font-semibold">{(item.don_gia || 0).toLocaleString('vi-VN')} VNĐ</span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-end">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.thanh_tien || 0}
                              onChange={(e) => updateItemField('thanh_tien', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                            />
                          ) : (
                            <span className="text-gray-900 font-bold">{(item.thanh_tien || 0).toLocaleString('vi-VN')} VNĐ</span>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-center">
                          {isEditingAll ? (
                            <input
                              type="checkbox"
                              checked={item.has_tax !== false}
                              onChange={(e) => updateItemField('has_tax', e.target.checked)}
                              className="w-5 h-5 cursor-pointer"
                              title={item.has_tax !== false ? "Có VAT" : "Không VAT"}
                            />
                          ) : (
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                              item.has_tax !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.has_tax !== false ? '✓ Có' : '✗ Không'}
                            </div>
                          )}
                          </div>
                          <div className="min-h-[28px] flex items-center justify-center">
                          {isEditingAll ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={item.tax_rate !== undefined ? item.tax_rate * 100 : (item.has_tax !== false ? (analyzedData?.tax_rate || 0.08) * 100 : 0)}
                              onChange={(e) => {
                                const taxRatePercent = parseFloat(e.target.value) || 0
                                updateItemField('tax_rate', taxRatePercent / 100)
                              }}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500 h-[28px]"
                              placeholder="%"
                            />
                          ) : (
                            <span className="text-gray-900 font-semibold">
                              {item.tax_rate !== undefined 
                                ? `${(item.tax_rate * 100).toFixed(1)}%`
                                : item.has_tax !== false 
                                  ? `${((analyzedData?.tax_rate || 0.08) * 100).toFixed(1)}%`
                                  : '0%'}
                            </span>
                          )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Summary of products to be created */}
            {productMatchStatus.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-sm font-bold text-amber-900">
                  📝 Sẽ tự động tạo {productMatchStatus.filter(m => !m.exists).length} sản phẩm mới khi import
                </p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Tổng kết</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Doanh thu</label>
                <div className="text-2xl font-bold text-gray-900">
                  {(analyzedData.subtotal || 0).toLocaleString('vi-VN')} VNĐ
                </div>
                <p className="text-xs text-gray-600 mt-1">Tổng thành tiền các sản phẩm</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Thuế</label>
                <div className="text-2xl font-bold text-blue-600">
                  {(analyzedData.tax_amount || 0).toLocaleString('vi-VN')} VNĐ
                </div>
                <p className="text-xs text-gray-600 mt-1">Tổng thuế của tất cả sản phẩm</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Tổng doanh thu sau thuế</label>
                <div className="text-2xl font-bold text-green-600">
                  {(analyzedData.total_amount || 0).toLocaleString('vi-VN')} VNĐ
                </div>
                <p className="text-xs text-gray-600 mt-1">Doanh thu + Thuế</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Số lượng sản phẩm:</span> {analyzedData.items.length}
              </div>
            </div>
          </div>

          {/* Notes & Terms Card */}
          {(analyzedData.notes || analyzedData.terms) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ghi chú & Điều khoản</h3>
              </div>
              
              <div className="space-y-4">
                {analyzedData.notes && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">📝 Ghi chú:</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {analyzedData.notes}
                      </p>
                    </div>
                  </div>
                )}
                
                {analyzedData.terms && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">📋 Quy trình & Điều khoản:</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {analyzedData.terms}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span>Tổng hợp sẽ được tạo khi import</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer */}
              <div className={`p-4 rounded-lg border-2 ${isNewCustomer ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${isNewCustomer ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <User className={`h-5 w-5 ${isNewCustomer ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Khách hàng</p>
                    <p className={`text-sm font-bold ${isNewCustomer ? 'text-blue-700' : 'text-gray-700'}`}>
                      {isNewCustomer ? '✨ Tạo mới' : '✓ Sử dụng có sẵn'}
                  </p>
                </div>
              </div>
                <p className="text-xs text-gray-600 font-medium truncate" title={customerInfo.name}>
                  {customerInfo.name || 'Chưa có tên'}
                </p>
              </div>
              
              {/* Project */}
              <div className={`p-4 rounded-lg border-2 ${isNewProject ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${isNewProject ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Building2 className={`h-5 w-5 ${isNewProject ? 'text-purple-600' : 'text-gray-600'}`} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Dự án</p>
                    <p className={`text-sm font-bold ${isNewProject ? 'text-purple-700' : 'text-gray-700'}`}>
                      {isNewProject ? '✨ Tạo mới' : '✓ Sử dụng có sẵn'}
                  </p>
                </div>
              </div>
                <p className="text-xs text-gray-600 font-medium truncate" title={projectInfo.name}>
                  {projectInfo.name || 'Chưa có tên'}
                </p>
              </div>
              
              {/* Products */}
              <div className="p-4 rounded-lg border-2 bg-amber-50 border-amber-300">
                <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Sản phẩm mới</p>
                  <p className="text-sm text-amber-700 font-bold">
                    ✨ {productMatchStatus.filter(m => !m.exists).length} sản phẩm
                  </p>
                </div>
              </div>
                <p className="text-xs text-gray-600 font-medium">
                  {productMatchStatus.filter(m => m.exists).length} sản phẩm đã có
                </p>
            </div>
              
              {/* Quote */}
              <div className="p-4 rounded-lg border-2 bg-green-50 border-green-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Báo giá</p>
                    <p className="text-sm text-green-700 font-bold">
                      ✨ 1 báo giá mới
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  {analyzedData.items.length} hạng mục
                </p>
              </div>
            </div>
            
            {/* Warning if no items */}
            {(!analyzedData.items || analyzedData.items.length === 0) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm font-bold text-red-800">
                  ⚠️ Chưa có hạng mục nào. Vui lòng kiểm tra lại file hoặc thêm hạng mục thủ công.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="text-sm text-gray-600">
              <p className="font-semibold">📌 Sẵn sàng import:</p>
              <p className="text-xs mt-1">
                {isNewCustomer ? '✨ Khách hàng mới' : '✓ Khách hàng có sẵn'} • 
                {isNewProject ? ' ✨ Dự án mới' : ' ✓ Dự án có sẵn'} • 
                {' '}1 báo giá • {analyzedData.items.length} hạng mục
              </p>
            </div>
            
            <div className="flex space-x-3">
            <button
              onClick={handleClearData}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold flex items-center space-x-2 transition-colors"
            >
              <X className="h-5 w-5" />
                <span>Hủy & Upload khác</span>
            </button>
            <button
              onClick={handleImport}
                disabled={loading || !customerInfo.name || !projectInfo.name || !analyzedData.items || analyzedData.items.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105"
                title={
                  !customerInfo.name ? 'Vui lòng nhập tên khách hàng' :
                  !projectInfo.name ? 'Vui lòng nhập tên dự án' :
                  !analyzedData.items || analyzedData.items.length === 0 ? 'Chưa có hạng mục nào' :
                  `Import ${isNewCustomer ? 'khách hàng mới' : 'khách hàng có sẵn'}, ${isNewProject ? 'dự án mới' : 'dự án có sẵn'}, 1 báo giá với ${analyzedData.items.length} hạng mục`
                }
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang import...</span>
                </>
              ) : (
                <>
                    <Sparkles className="h-5 w-5" />
                    <span>
                      {isNewCustomer && isNewProject ? 'Tạo mới & Import' : 'Xác nhận Import'}
                    </span>
                </>
              )}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-end justify-center">
          <div className="bg-white rounded-t-lg shadow-xl w-full max-w-5xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Chọn sản phẩm</h3>
              <button
                onClick={() => {
                  setSelectedProductIds([])
                  setShowProductModal(false)
                }}
                className="p-2 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm theo tên, mô tả hoặc loại..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">Đang tải sản phẩm...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">
                    {productSearch ? 'Không có sản phẩm phù hợp' : 'Không có sản phẩm nào'}
                  </span>
                </div>
              ) : (
                <div className="p-4">
                  {(() => {
                    // Group filtered products by category
                    const groupedProducts = filteredProducts.reduce((acc, product) => {
                      const category = product.category || 'Khác'
                      if (!acc[category]) {
                        acc[category] = []
                      }
                      acc[category].push(product)
                      return acc
                    }, {} as Record<string, typeof products>)

                    return Object.entries(groupedProducts).map(([category, categoryProducts]) => {
                      const isExpanded = expandedCategories.has(category)

                      return (
                        <div key={category} className="mb-4">
                          <div
                            className="text-sm font-semibold text-gray-600 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                              )}
                              <span>📁 {category}</span>
                              <span className="ml-2 text-xs text-gray-500">({categoryProducts.length} sản phẩm)</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-2">
                              {categoryProducts.map((product) => (
                                <label
                                  key={product.id}
                                  className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.includes(product.id)}
                                    onChange={(e) => {
                                      setSelectedProductIds(prev => e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <div className="grid grid-cols-6 gap-3 items-center w-full">
                                    <div className="col-span-2">
                                      <h5 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h5>
                                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                                        {category}
                                      </div>
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Đơn vị:</span><br />
                                        {product.unit || 'Chưa có'}
                                      </span>
                                    </div>
                                    <div className="col-span-1">
                                      {product.unit_price ? (
                                        <span className="text-sm font-bold text-green-600">
                                          <span className="font-medium">Đơn giá:</span><br />
                                          {product.unit_price.toLocaleString('vi-VN')} ₫
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          <span className="font-medium">Đơn giá:</span><br />
                                          Chưa có
                                        </span>
                                      )}
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Kích thước:</span><br />
                                        <div className="text-xs space-y-1">
                                          {product.area && <div>📐 Diện tích: {product.area} m²</div>}
                                          {product.volume && <div>📦 Thể tích: {product.volume} m³</div>}
                                          {product.height && <div>📏 Cao: {product.height} mm</div>}
                                          {product.length && <div>📏 Dài: {product.length} mm</div>}
                                          {product.depth && <div>📏 Sâu: {product.depth} mm</div>}
                                          {!product.area && !product.volume && !product.height && !product.length && !product.depth &&
                                            <div className="text-gray-400">Chưa có kích thước</div>
                                          }
                                        </div>
                                      </span>
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Mô tả:</span><br />
                                        {product.description || 'Không có mô tả'}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-white flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedProductIds([])
                  setShowProductModal(false)
                }}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={addProductsToItems}
                disabled={selectedProductIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm {selectedProductIds.length > 0 ? `${selectedProductIds.length} ` : ''}sản phẩm đã chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

