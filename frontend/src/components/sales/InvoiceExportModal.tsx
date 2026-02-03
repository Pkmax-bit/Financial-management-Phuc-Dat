'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, FileText, Calculator } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
  project_name?: string
  project_code?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'voided'
  items: any[]
  notes?: string
  terms_and_conditions?: string
}

interface InvoiceExportModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onSuccess?: () => void
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface ProductItem {
  stt: number
  ma_hang: string
  dien_giai: string
  kho: string
  don_vi_tinh: string
  chieu_cao: number
  chieu_rong: number
  chieu_dai: number
  trong_luong: number
  so_luong: number
  don_gia: number
  thanh_tien: number
  ty_le_chiet_khau: number
  tien_chiet_khau: number
  thue_suat: number
  tien_thue: number
  tong_tien: number
  so_don_hang: string
  ctkm: string
  hang_km: string
}

export default function InvoiceExportModal({ isOpen, onClose, invoice, onSuccess }: InvoiceExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    so_de_nghi_xuat_hd: '',
    ma_tu_sinh: '',
    dia_chi: '',
    mo_tai_ngan_hang: '',
    nguoi_mua_hang: '',
    email_nguoi_nhan_hd: '',
    tai_khoan_ngan_hang: '',
    ma_so_thue: '',
    ten_nguoi_nhan_hd: '',
    dt_nguoi_nhan_hd: '',
    thong_tin_bo_sung: '',
    loai_hoa_don: 'Hóa đơn thông thường',
    tinh_trang: 'Đề nghị xuất',
    so_don_hang: '',
    hinh_thuc_thanh_toan: 'Chuyển khoản/Tiền mặt',
    ngay_de_nghi: new Date().toISOString().split('T')[0],
    chien_dich: '',
    mo_ta: ''
  })

  const [productItems, setProductItems] = useState<ProductItem[]>([
    {
      stt: 1,
      ma_hang: '330F0501',
      dien_giai: 'Bản lề T-MJ06 ( kèm phụ kiện bộ ke và vít)',
      kho: '',
      don_vi_tinh: 'Chiếc',
      chieu_cao: 0,
      chieu_rong: 0,
      chieu_dai: 0,
      trong_luong: 0,
      so_luong: 1,
      don_gia: 0,
      thanh_tien: 0,
      ty_le_chiet_khau: 0,
      tien_chiet_khau: 0,
      thue_suat: 0,
      tien_thue: 0,
      tong_tien: 0,
      so_don_hang: '',
      ctkm: '',
      hang_km: ''
    }
  ])

  useEffect(() => {
    if (isOpen && invoice) {
      fetchCustomers()
      initializeFormData()
    }
  }, [isOpen, invoice])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, address, tax_code')
        .order('name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const initializeFormData = () => {
    if (!invoice) return

    // Generate auto invoice request number
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const soDeNghi = `HD${year}${month}${day}${randomNum}`

    setFormData({
      so_de_nghi_xuat_hd: soDeNghi,
      ma_tu_sinh: `MS${Date.now()}`,
      dia_chi: invoice.customer_name || '',
      mo_tai_ngan_hang: '',
      nguoi_mua_hang: invoice.customer_name || '',
      email_nguoi_nhan_hd: '',
      tai_khoan_ngan_hang: '',
      ma_so_thue: '',
      ten_nguoi_nhan_hd: invoice.customer_name || '',
      dt_nguoi_nhan_hd: '',
      thong_tin_bo_sung: invoice.notes || '',
      loai_hoa_don: 'Hóa đơn thông thường',
      tinh_trang: 'Đề nghị xuất',
      so_don_hang: invoice.invoice_number,
      hinh_thuc_thanh_toan: 'Chuyển khoản/Tiền mặt',
      ngay_de_nghi: new Date().toISOString().split('T')[0],
      chien_dich: '',
      mo_ta: ''
    })

    // Initialize product items from invoice items
    if (invoice.items && invoice.items.length > 0) {
      const items: ProductItem[] = invoice.items.map((item, index) => ({
        stt: index + 1,
        ma_hang: item.product_code || `SP${index + 1}`,
        dien_giai: item.name || item.description || '',
        kho: item.warehouse || '',
        don_vi_tinh: item.unit || 'Chiếc',
        chieu_cao: item.height || 0,
        chieu_rong: item.width || 0,
        chieu_dai: item.length || 0,
        trong_luong: item.weight || 0,
        so_luong: item.quantity || 0,
        don_gia: item.unit_price || 0,
        thanh_tien: (item.quantity || 0) * (item.unit_price || 0),
        ty_le_chiet_khau: item.discount_rate || 0,
        tien_chiet_khau: item.discount_amount || 0,
        thue_suat: item.tax_rate || 0,
        tien_thue: ((item.quantity || 0) * (item.unit_price || 0) - (item.discount_amount || 0)) * ((item.tax_rate || 0) / 100),
        tong_tien: ((item.quantity || 0) * (item.unit_price || 0) - (item.discount_amount || 0)) * (1 + (item.tax_rate || 0) / 100),
        so_don_hang: invoice.invoice_number,
        ctkm: '',
        hang_km: ''
      }))
      setProductItems(items)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      setFormData(prev => ({
        ...prev,
        nguoi_mua_hang: customer.name,
        ten_nguoi_nhan_hd: customer.name,
        email_nguoi_nhan_hd: customer.email || '',
        dt_nguoi_nhan_hd: customer.phone || '',
        dia_chi: customer.address || '',
        ma_so_thue: customer.tax_code || ''
      }))
    }
  }

  const addProductItem = () => {
    const newItem: ProductItem = {
      stt: productItems.length + 1,
      ma_hang: `SP${productItems.length + 1}`,
      dien_giai: '',
      kho: '',
      don_vi_tinh: 'Chiếc',
      chieu_cao: 0,
      chieu_rong: 0,
      chieu_dai: 0,
      trong_luong: 0,
      so_luong: 0,
      don_gia: 0,
      thanh_tien: 0,
      ty_le_chiet_khau: 0,
      tien_chiet_khau: 0,
      thue_suat: 0,
      tien_thue: 0,
      tong_tien: 0,
      so_don_hang: formData.so_don_hang,
      ctkm: '',
      hang_km: ''
    }
    setProductItems([...productItems, newItem])
  }

  const removeProductItem = (index: number) => {
    setProductItems(productItems.filter((_, i) => i !== index))
  }

  const updateProductItem = (index: number, field: keyof ProductItem, value: any) => {
    const updatedItems = [...productItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Auto calculate dependent fields
    if (field === 'so_luong' || field === 'don_gia' || field === 'ty_le_chiet_khau') {
      const item = updatedItems[index]
      const baseAmount = item.so_luong * item.don_gia
      item.thanh_tien = baseAmount
      item.tien_chiet_khau = baseAmount * (item.ty_le_chiet_khau / 100)
      const afterDiscount = baseAmount - item.tien_chiet_khau
      item.tien_thue = afterDiscount * (item.thue_suat / 100)
      item.tong_tien = afterDiscount + item.tien_thue
    }

    setProductItems(updatedItems)
  }

  const calculateTotals = () => {
    return productItems.reduce((acc, item) => ({
      so_luong: acc.so_luong + item.so_luong,
      thanh_tien: acc.thanh_tien + item.thanh_tien,
      tien_chiet_khau: acc.tien_chiet_khau + item.tien_chiet_khau,
      tien_thue: acc.tien_thue + item.tien_thue,
      tong_tien: acc.tong_tien + item.tong_tien
    }), { so_luong: 0, thanh_tien: 0, tien_chiet_khau: 0, tien_thue: 0, tong_tien: 0 })
  }

  const handleExportInvoice = async () => {
    if (!invoice) return

    try {
      setLoading(true)

      const exportData = {
        invoice_id: invoice.id,
        export_request_data: {
          ...formData,
          product_items: productItems,
          totals: calculateTotals()
        }
      }

      // Here you would typically send this data to your backend
      // For now, we'll just show a success message
      console.log('Exporting invoice with data:', exportData)

      alert('✅ Đã gửi đề nghị xuất hóa đơn thành công!')

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Error exporting invoice:', error)
      alert('❌ Lỗi khi xuất hóa đơn. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !invoice) return null

  const totals = calculateTotals()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute inset-4 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Xuất hóa đơn cho đơn hàng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Thông tin chung */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin chung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số đề nghị xuất hóa đơn</label>
                  <input
                    type="text"
                    value={formData.so_de_nghi_xuat_hd}
                    onChange={(e) => setFormData(prev => ({ ...prev, so_de_nghi_xuat_hd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã tự sinh</label>
                  <input
                    type="text"
                    value={formData.ma_tu_sinh}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.dia_chi}
                    onChange={(e) => setFormData(prev => ({ ...prev, dia_chi: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mở tại ngân hàng</label>
                  <input
                    type="text"
                    value={formData.mo_tai_ngan_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, mo_tai_ngan_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người mua hàng</label>
                  <input
                    type="text"
                    value={formData.nguoi_mua_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, nguoi_mua_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
              </div>
            </div>

            {/* Khách hàng selection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email người nhận HĐ</label>
                  <input
                    type="email"
                    value={formData.email_nguoi_nhan_hd}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_nguoi_nhan_hd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="">- Không chọn -</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản ngân hàng</label>
                  <input
                    type="text"
                    value={formData.tai_khoan_ngan_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, tai_khoan_ngan_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    value={formData.ma_so_thue}
                    onChange={(e) => setFormData(prev => ({ ...prev, ma_so_thue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên người nhận HĐ</label>
                  <input
                    type="text"
                    value={formData.ten_nguoi_nhan_hd}
                    onChange={(e) => setFormData(prev => ({ ...prev, ten_nguoi_nhan_hd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ĐT người nhận HĐ</label>
                  <input
                    type="tel"
                    value={formData.dt_nguoi_nhan_hd}
                    onChange={(e) => setFormData(prev => ({ ...prev, dt_nguoi_nhan_hd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin bổ sung</label>
                  <textarea
                    value={formData.thong_tin_bo_sung}
                    onChange={(e) => setFormData(prev => ({ ...prev, thong_tin_bo_sung: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại hóa đơn</label>
                  <select
                    value={formData.loai_hoa_don}
                    onChange={(e) => setFormData(prev => ({ ...prev, loai_hoa_don: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="Hóa đơn thông thường">Hóa đơn thông thường</option>
                    <option value="Hóa đơn điện tử">Hóa đơn điện tử</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                  <select
                    value={formData.tinh_trang}
                    onChange={(e) => setFormData(prev => ({ ...prev, tinh_trang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="Đề nghị xuất">Đề nghị xuất</option>
                    <option value="Đã xuất">Đã xuất</option>
                    <option value="Hủy">Hủy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số đơn hàng</label>
                  <input
                    type="text"
                    value={formData.so_don_hang}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức thanh toán</label>
                  <select
                    value={formData.hinh_thuc_thanh_toan}
                    onChange={(e) => setFormData(prev => ({ ...prev, hinh_thuc_thanh_toan: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="Chuyển khoản/Tiền mặt">Chuyển khoản/Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đề nghị</label>
                  <input
                    type="date"
                    value={formData.ngay_de_nghi}
                    onChange={(e) => setFormData(prev => ({ ...prev, ngay_de_nghi: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chiến dịch</label>
                  <select
                    value={formData.chien_dich}
                    onChange={(e) => setFormData(prev => ({ ...prev, chien_dich: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="">- Không chọn -</option>
                    <option value="Khuyến mãi A">Khuyến mãi A</option>
                    <option value="Khuyến mãi B">Khuyến mãi B</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Thông tin hàng hóa */}
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Thông tin hàng hóa</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={addProductItem}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nhập khẩu hàng hóa
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                    Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Mã hàng hóa</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Diễn giải</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Kho</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Đơn vị tính</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Chiều cao</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Chiều rộng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Chiều dài</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Trọng lượng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Đơn giá</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Thành tiền</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tỷ lệ chiết khấu</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tiền chiết khấu</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Thuế suất</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tiền thuế</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Tổng tiền</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Số đơn hàng</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">CTKM</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Hàng KM</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-2 py-2 text-xs">{item.stt}</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.ma_hang}
                            onChange={(e) => updateProductItem(index, 'ma_hang', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.dien_giai}
                            onChange={(e) => updateProductItem(index, 'dien_giai', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.kho}
                            onChange={(e) => updateProductItem(index, 'kho', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.don_vi_tinh}
                            onChange={(e) => updateProductItem(index, 'don_vi_tinh', e.target.value)}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.chieu_cao}
                            onChange={(e) => updateProductItem(index, 'chieu_cao', Number(e.target.value))}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.chieu_rong}
                            onChange={(e) => updateProductItem(index, 'chieu_rong', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.chieu_dai}
                            onChange={(e) => updateProductItem(index, 'chieu_dai', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.trong_luong}
                            onChange={(e) => updateProductItem(index, 'trong_luong', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.so_luong}
                            onChange={(e) => updateProductItem(index, 'so_luong', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.don_gia}
                            onChange={(e) => updateProductItem(index, 'don_gia', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-right">{item.thanh_tien.toLocaleString()}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.ty_le_chiet_khau}
                            onChange={(e) => updateProductItem(index, 'ty_le_chiet_khau', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-right">{item.tien_chiet_khau.toLocaleString()}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.thue_suat}
                            onChange={(e) => updateProductItem(index, 'thue_suat', Number(e.target.value))}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-right">{item.tien_thue.toLocaleString()}</td>
                        <td className="px-2 py-2 text-xs text-right font-medium">{item.tong_tien.toLocaleString()}</td>
                        <td className="px-2 py-2 text-xs">{item.so_don_hang}</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.ctkm}
                            onChange={(e) => updateProductItem(index, 'ctkm', e.target.value)}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.hang_km}
                            onChange={(e) => updateProductItem(index, 'hang_km', e.target.value)}
                            className="w-full px-1 py-2 border border-gray-300 rounded text-xs text-black"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeProductItem(index)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={9} className="px-2 py-2 text-xs font-medium text-right">Tổng cộng</td>
                      <td className="px-2 py-2 text-xs font-medium text-right">{totals.so_luong}</td>
                      <td className="px-2 py-2 text-xs font-medium text-right">{totals.thanh_tien.toLocaleString()}</td>
                      <td></td>
                      <td className="px-2 py-2 text-xs font-medium text-right">{totals.tien_chiet_khau.toLocaleString()}</td>
                      <td></td>
                      <td className="px-2 py-2 text-xs font-medium text-right">{totals.tien_thue.toLocaleString()}</td>
                      <td className="px-2 py-2 text-xs font-medium text-right">{totals.tong_tien.toLocaleString()}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Tổng số: {productItems.length} - 100 bản ghi trên trang
              </div>
            </div>

            {/* Thông tin mô tả */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin mô tả</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.mo_ta}
                  onChange={(e) => setFormData(prev => ({ ...prev, mo_ta: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  placeholder="Nhập mô tả chi tiết..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExportInvoice}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Gửi đề nghị xuất hóa đơn
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}