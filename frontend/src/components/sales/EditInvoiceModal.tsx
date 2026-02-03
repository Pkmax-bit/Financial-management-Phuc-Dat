'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  Receipt,
  Minus,
  Plus as PlusIcon
} from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  customer_id: string
}

interface InvoiceItem {
  id?: string
  invoice_id?: string
  product_service_id?: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  name_product?: string
  unit?: string
}

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  status: string
  payment_terms?: string
  items: InvoiceItem[]
  notes?: string
  terms_and_conditions?: string
}

interface EditInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoice: Invoice | null
}

export default function EditInvoiceModal({ isOpen, onClose, onSuccess, invoice }: EditInvoiceModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    items: true,
    totals: true,
    additional: false
  })

  // Form data
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: '',
    project_id: '',
    issue_date: '',
    due_date: '',
    subtotal: 0,
    tax_rate: 10,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_terms: '',
    notes: '',
    terms_and_conditions: ''
  })

  const [items, setItems] = useState<InvoiceItem[]>([])

  useEffect(() => {
    if (isOpen && invoice) {
      fetchCustomers()
      loadInvoiceData()
    }
  }, [isOpen, invoice])

  // Fetch projects when customer changes
  useEffect(() => {
    if (formData.customer_id) {
      fetchProjectsByCustomer(formData.customer_id)
    } else {
      setProjects([])
      setFormData(prev => ({ ...prev, project_id: '' }))
    }
  }, [formData.customer_id])

  useEffect(() => {
    calculateSubtotal()
  }, [items, formData.tax_rate, formData.discount_amount])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching customers from database...')
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching customers:', error)
        throw error
      }
      
      console.log('✅ Customers fetched successfully:', data?.length || 0)
      setCustomers(data || [])
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectsByCustomer = async (customerId: string) => {
    try {
      setLoadingProjects(true)
      console.log('🔍 Fetching projects for customer:', customerId)
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('customer_id', customerId)
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching projects:', error)
        throw error
      }
      
      console.log('✅ Projects fetched successfully:', data?.length || 0)
      setProjects(data || [])
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadInvoiceData = async () => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        project_id: invoice.project_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        payment_terms: invoice.payment_terms || '',
        notes: invoice.notes || '',
        terms_and_conditions: invoice.terms_and_conditions || ''
      })

      // Load invoice items from database
      try {
        const { data: invoiceItems, error } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ Error fetching invoice items:', error)
        } else {
          console.log('✅ Invoice items loaded:', invoiceItems?.length || 0)
          if (invoiceItems && invoiceItems.length > 0) {
            setItems(invoiceItems.map((item: any) => ({
              id: item.id,
              invoice_id: item.invoice_id,
              product_service_id: item.product_service_id,
              description: item.description || '',
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: item.total_price || (item.quantity * item.unit_price),
              name_product: item.name_product || '',
              unit: item.unit || ''
            })))
          } else {
            setItems([{ description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '', unit: '' }])
          }
        }
      } catch (error) {
        console.error('❌ Error loading invoice items:', error)
        setItems([{ description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '', unit: '' }])
      }
    }
  }

  const calculateSubtotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = subtotal * (formData.tax_rate / 100)
    const total_amount = subtotal + tax_amount - formData.discount_amount

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '', unit: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
  }

  const handleSubmit = async () => {
    if (!invoice) return

    setSubmitting(true)
    
    try {
      // Update main invoice data
      const invoiceData = {
        ...formData,
        // Convert empty strings to null for UUID fields
        project_id: formData.project_id || null,
        customer_id: formData.customer_id || null,
        items: [], // Empty JSONB field, items will be in invoice_items table
        currency: 'VND',
        status: 'draft' // Keep as draft when editing
      }

      await apiPut(getApiEndpoint(`/api/sales/invoices/${invoice.id}`), invoiceData)

      // Update invoice items in database
      if (items.length > 0) {
        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoice.id)

        // Insert new items
        const invoiceItemsData = items.map(item => ({
          id: item.id || crypto.randomUUID(),
          invoice_id: invoice.id,
          product_service_id: item.product_service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          name_product: item.name_product,
          unit: item.unit || null,
          created_at: new Date().toISOString()
        }))

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItemsData)

        if (itemsError) {
          console.error('❌ Error updating invoice items:', itemsError)
        } else {
          console.log('✅ Invoice items updated successfully')
        }
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Có lỗi xảy ra khi cập nhật đơn hàng: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-green-50">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Chỉnh sửa đơn hàng - {invoice.invoice_number}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Basic Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Thông tin cơ bản</span>
                  </div>
                  {expandedSections.basic ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.basic && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Số đơn hàng</label>
                      <input
                        type="text"
                        value={formData.invoice_number}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black bg-gray-50"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Khách hàng *</label>
                      {loading ? (
                        <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                          <span className="text-xs text-black">Đang tải...</span>
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="w-full border border-red-300 rounded-md px-2 py-1.5 bg-red-50">
                          <span className="text-xs text-red-600">Không có khách hàng</span>
                        </div>
                      ) : (
                        <select
                          value={formData.customer_id}
                          onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                          required
                        >
                          <option value="">Chọn khách hàng</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} {customer.email ? `(${customer.email})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Dự án</label>
                      {!formData.customer_id ? (
                        <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                          <span className="text-xs text-gray-500">Chọn khách hàng trước</span>
                        </div>
                      ) : loadingProjects ? (
                        <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                          <span className="text-xs text-black">Đang tải dự án...</span>
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="w-full border border-yellow-300 rounded-md px-2 py-1.5 bg-yellow-50">
                          <span className="text-xs text-yellow-600">Không có dự án</span>
                        </div>
                      ) : (
                        <select
                          value={formData.project_id}
                          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">Chọn dự án (tùy chọn)</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.project_code} - {project.name} ({project.status})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Ngày phát hành *</label>
                        <input
                          type="date"
                          value={formData.issue_date}
                          onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Ngày đáo hạn *</label>
                        <input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Điều khoản thanh toán</label>
                      <input
                        type="text"
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Ví dụ: 30 ngày"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('items')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">Sản phẩm/Dịch vụ</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {items.length} mục
                    </span>
                  </div>
                  {expandedSections.items ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.items && (
                  <div className="px-4 pb-4">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-md">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="Mô tả sản phẩm/dịch vụ"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                              min="0"
                              step="0.01"
                              placeholder="SL"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                              min="0"
                              step="0.01"
                              placeholder="Đơn giá"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.total_price}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black bg-gray-100"
                              readOnly
                              placeholder="Thành tiền"
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={addItem}
                      className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-green-500 hover:text-green-600"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm sản phẩm</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Totals Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('totals')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Tổng kết</span>
                  </div>
                  {expandedSections.totals ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.totals && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Thuế suất (%)</label>
                        <input
                          type="number"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Giảm giá (VND)</label>
                        <input
                          type="number"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-medium">{formData.subtotal.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Thuế ({formData.tax_rate}%):</span>
                        <span className="font-medium">{formData.tax_amount.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="font-medium text-red-600">-{formData.discount_amount.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-gray-900">Tổng cộng:</span>
                          <span className="text-green-600">{formData.total_amount.toLocaleString('vi-VN')} VND</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('additional')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-gray-900">Thông tin bổ sung</span>
                  </div>
                  {expandedSections.additional ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.additional && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Ghi chú</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                        rows={3}
                        placeholder="Ghi chú thêm cho đơn hàng..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Điều khoản và điều kiện</label>
                      <textarea
                        value={formData.terms_and_conditions}
                        onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                        rows={3}
                        placeholder="Điều khoản và điều kiện thanh toán..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
