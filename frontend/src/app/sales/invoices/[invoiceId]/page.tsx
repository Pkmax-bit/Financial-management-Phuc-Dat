'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Receipt, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface InvoiceItem {
  id: string
  name_product?: string
  description?: string
  quantity: number
  unit?: string
  unit_price: number
  total_price: number
  length?: number
  height?: number
  depth?: number
  area?: number
  volume?: number
}

export default function InvoiceDetailPage() {
  const params = useParams() as { invoiceId?: string }
  // Extract invoiceId immediately to avoid direct params access
  // Extract invoiceId immediately to avoid direct params access - destructure to prevent enumeration
  const { invoiceId: paramInvoiceId } = params || {}
  const invoiceId = (paramInvoiceId ?? '') as string
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = (await supabase.auth.getSession()).data.session?.access_token
        // Fetch invoice
        const iRes = await fetch(getApiEndpoint(`/api/sales/invoices/${invoiceId}`), {
          headers: { Authorization: `Bearer ${token || ''}` }
        })
        let inv: any
        if (iRes.ok) {
          inv = await iRes.json()
        } else {
          // Fallback to Supabase join when backend not accessible
          const { data: joinData, error: joinErr } = await supabase
            .from('invoices')
            .select(`
              *,
              customers:customer_id(name, email),
              projects:project_id(name, project_code)
            `)
            .eq('id', invoiceId)
            .single()
          if (joinErr || !joinData) throw new Error('Failed to fetch invoice')
          inv = {
            ...joinData,
            customer_name: joinData.customers?.name,
            project_name: joinData.projects?.name,
            project_code: joinData.projects?.project_code
          }
        }
        // Enrich if missing fields
        try {
          if (!inv.customer_name || !inv.project_name) {
            const { data: joinData } = await supabase
              .from('invoices')
              .select(`
                *,
                customers:customer_id(name, email),
                projects:project_id(name, project_code)
              `)
              .eq('id', invoiceId)
              .single()
            if (joinData) {
              inv = {
                ...inv,
                customer_name: joinData.customers?.name,
                project_name: joinData.projects?.name,
                project_code: joinData.projects?.project_code
              }
            }
          }
        } catch(_) {}
        setInvoice(inv)

        // Fetch invoice items (if using separate table)
        try {
          const { data } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId)
          if (Array.isArray(data)) setItems(data as any)
        } catch (_e) {}
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (invoiceId) fetchData()
  }, [invoiceId])

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return <div className="p-6 text-gray-600">Không tìm thấy đơn hàng</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (match sales UI style) */}
      <aside className="hidden md:block w-60 bg-white border-r border-gray-200 p-4 sticky top-0 h-screen">
        <div className="text-sm font-semibold text-gray-900 mb-3">Bán hàng</div>
        <nav className="space-y-1 text-sm">
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales">Tổng quan</a>
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales?tab=quotes">Báo giá</a>
          <a className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700" href="/sales?tab=invoices">Đơn hàng</a>
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales?tab=sales-receipts">Phiếu bán hàng</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <a href="/sales?tab=invoices" className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            ← Trở về Bán hàng
          </a>
        </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-gray-700" />
          <div>
            <div className="text-xl font-semibold text-gray-900">Đơn hàng {invoice.invoice_number ? `- ${invoice.invoice_number}` : ''}</div>
            <div className="text-sm text-gray-600">
              Dự án: {invoice.project_name || '—'} {invoice.project_code ? `(${invoice.project_code})` : ''}
            </div>
            <div className="text-sm text-gray-600">Khách hàng: {invoice.customer_name || '—'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-700">{formatCurrency(invoice.total_amount)}</div>
          <div className="text-xs text-gray-500">Trạng thái: {invoice.status} · Thanh toán: {invoice.payment_status}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4" /> Ngày phát hành: {formatDate(invoice.issue_date)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4" /> Hạn thanh toán: {formatDate(invoice.due_date)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <DollarSign className="h-4 w-4" /> Thuế: {invoice.tax_rate}% ({formatCurrency(invoice.tax_amount)})
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Sản phẩm</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">SL</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Đơn vị</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Dài</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Rộng</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Sâu</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Diện tích</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Thể tích</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Đơn giá</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-2 text-sm text-gray-900">
                  <div className="font-medium">{it.name_product || ''}</div>
                  {it.description && <div className="text-xs text-gray-500">{it.description}</div>}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.quantity}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.unit || ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.length ?? ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.height ?? ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.depth ?? ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.area ?? ''}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{it.volume ?? ''}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(it.unit_price)}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(it.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </main>
    </div>
  )
}


