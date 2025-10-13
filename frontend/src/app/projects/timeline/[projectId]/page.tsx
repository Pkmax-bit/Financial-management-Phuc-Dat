'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import CustomerProjectTimeline from '@/components/customer-view/CustomerProjectTimeline'
import { supabase } from '@/lib/supabase'
import { Eye } from 'lucide-react'

interface ProjectBasic {
  id: string
  name: string
  description?: string
}

interface InvoiceItem {
  id: string
  invoice_number?: string
  total_amount: number
  status?: string
  payment_status?: string
  created_at: string
}

interface ProjectExpenseItem {
  id: string
  expense_code?: string
  description?: string
  amount: number
  status?: string
  expense_date: string
}

interface InvoiceLineItem {
  id: string
  invoice_id: string
  description?: string
  name_product?: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function CustomerProjectTimelinePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<ProjectBasic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [expenses, setExpenses] = useState<ProjectExpenseItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([])
  const [invoiceItemsLoading, setInvoiceItemsLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    fetchProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .single()
      if (error) throw error
      setProject(data)
      // In parallel, fetch invoices and project expenses (non-blocking for header)
      void fetchSideData()
    } catch (e) {
      console.error(e)
      setError('Không tìm thấy dự án')
    } finally {
      setLoading(false)
    }
  }

  const fetchSideData = async () => {
    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, paid_amount, status, payment_status, created_at, due_date')
          .eq('project_id', projectId)
          .in('status', ['sent', 'paid'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('project_expenses')
          .select('id, expense_code, description, amount, status, expense_date')
          .eq('project_id', projectId)
          .eq('status', 'approved')
          .order('expense_date', { ascending: false })
          .limit(10)
      ])

      if (!invoicesRes.error && invoicesRes.data) {
        setInvoices(invoicesRes.data as any)
        if (!selectedInvoice && invoicesRes.data.length > 0) {
          setSelectedInvoice(invoicesRes.data[0] as any)
        }
      }
      if (!expensesRes.error && expensesRes.data) setExpenses(expensesRes.data as any)
    } catch (err) {
      console.error('Side data load error:', err)
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

  // Load invoice items when a specific invoice is selected
  useEffect(() => {
    const loadItems = async () => {
      if (!selectedInvoice) {
        setInvoiceItems([])
        return
      }
      try {
        setInvoiceItemsLoading(true)
        const { data, error } = await supabase
          .from('invoice_items')
          .select('id, invoice_id, description, name_product, quantity, unit_price, total_price')
          .eq('invoice_id', selectedInvoice.id)
          .order('created_at', { ascending: true })
        if (!error) setInvoiceItems((data as any) || [])
      } catch (e) {
        console.error('Load invoice items error:', e)
      } finally {
        setInvoiceItemsLoading(false)
      }
    }
    loadItems()
  }, [selectedInvoice])

  return (
    <>
      <div className="bg-white min-h-screen p-0 md:p-0">
        <div className="w-full">
          {/* Cover/Header like Facebook */}
          <div className="bg-white border-b">
            <div className="h-32 md:h-44 bg-gradient-to-r from-blue-200 via-blue-100 to-white" />
            <div className="px-4 md:px-8 -mt-10">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {project?.name?.charAt(0) || 'P'}
                </div>
                <div className="pb-2">
                  <div className="text-2xl font-bold text-gray-900">{project?.name || 'Dự án'}</div>
                  {project?.description && (
                    <div className="text-gray-600 mt-1 max-w-3xl line-clamp-2">{project.description}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 md:px-8 py-3 border-t bg-white/60 backdrop-blur">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" /> Khách hàng đang xem tiến độ thi công
              </div>
            </div>
          </div>

          {/* Facebook-like 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 px-4 md:px-8 py-6">
            {/* Left/Center column: Feed */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                {loading && <div>Đang tải dự án...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && project && (
                  <CustomerProjectTimeline projectId={project.id} projectName={project.name} />
                )}
              </div>
            </div>

            {/* Right column: Invoices / Expenses / Help */}
            <div className="lg:col-span-4 space-y-4">
              {/* Invoices */}
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Hóa đơn dự án</h4>
                  <span className="text-xs text-gray-600">{invoices.length} mục</span>
                </div>
                {invoices.length === 0 ? (
                  <div className="text-sm text-gray-600">Chưa có hóa đơn.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {invoices.map(inv => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className={`w-full text-left flex items-center justify-between text-sm border rounded-md px-3 py-2 hover:bg-gray-50 ${selectedInvoice?.id === inv.id ? 'border-blue-300 bg-blue-50/40' : ''}`}
                        title="Xem chi tiết hóa đơn"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{inv.invoice_number || inv.id.slice(0,8)}</div>
                          <div className="text-xs text-gray-600">{new Date(inv.created_at).toLocaleDateString('vi-VN')} • {inv.status} • {inv.payment_status}</div>
                        </div>
                        <div className="font-semibold text-blue-700">{formatCurrency(inv.total_amount)}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline detail for selected invoice */}
                {selectedInvoice && (
                  <div className="mt-4 border-t pt-3">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Chi tiết hóa đơn</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-600">Số hóa đơn</span><span className="font-medium text-gray-900">{selectedInvoice.invoice_number || selectedInvoice.id}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Ngày tạo</span><span className="font-medium text-gray-900">{new Date(selectedInvoice.created_at).toLocaleDateString('vi-VN')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Trạng thái</span><span className="font-medium text-gray-900">{selectedInvoice.status || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Thanh toán</span><span className="font-medium text-gray-900">{selectedInvoice.payment_status || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Tổng tiền</span><span className="font-semibold text-blue-700">{formatCurrency(selectedInvoice.total_amount)}</span></div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-semibold text-gray-900 mb-2">Sản phẩm/Dịch vụ</div>
                      {invoiceItemsLoading ? (
                        <div className="text-sm text-gray-600">Đang tải...</div>
                      ) : invoiceItems.length === 0 ? (
                        <div className="text-sm text-gray-600">Hóa đơn chưa có dòng sản phẩm.</div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 bg-gray-50 text-gray-700 px-3 py-2 text-xs font-medium">
                            <div className="col-span-6">Mô tả</div>
                            <div className="col-span-2 text-right">Số lượng</div>
                            <div className="col-span-2 text-right">Đơn giá</div>
                            <div className="col-span-2 text-right">Thành tiền</div>
                          </div>
                          <div className="max-h-56 overflow-auto">
                            {invoiceItems.map((it) => (
                              <div key={it.id} className="grid grid-cols-12 px-3 py-2 text-xs border-t">
                                <div className="col-span-6 text-gray-900">{it.name_product || it.description || '---'}</div>
                                <div className="col-span-2 text-right text-gray-800">{it.quantity || 0}</div>
                                <div className="col-span-2 text-right text-gray-800">{formatCurrency(it.unit_price || 0)}</div>
                                <div className="col-span-2 text-right font-semibold text-gray-900">{formatCurrency(it.total_price || (it.quantity * it.unit_price))}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses */}
              
              {/* Help tips */}
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="text-sm text-gray-600">Gợi ý</div>
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>Nhấp vào từng mục timeline để xem chi tiết hình ảnh.</li>
                  <li>Sử dụng phần bình luận để trao đổi nhanh với nhân viên.</li>
                  <li>Ảnh minh chứng được lưu tại kho `minhchung_chiphi`.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Invoice Detail Modal */}
      {/* The modal is removed as per the edit hint. */}
    </>
  )
}


