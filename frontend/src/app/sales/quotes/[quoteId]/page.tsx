'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, FileText, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface QuoteItem {
  id: string
  name_product: string
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

export default function QuoteDetailPage() {
  const params = useParams() as { quoteId?: string }
  const quoteId = params?.quoteId as string
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<QuoteItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = (await supabase.auth.getSession()).data.session?.access_token
        // Fetch quote
        const qRes = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}`), {
          headers: { Authorization: `Bearer ${token || ''}` }
        })
        let qData: any
        if (qRes.ok) {
          qData = await qRes.json()
        } else {
          // Fallback to Supabase direct query when backend is not accessible/authorized
          const { data: joinData, error: joinErr } = await supabase
            .from('quotes')
            .select(`
              *,
              customers:customer_id(name, email),
              projects:project_id(name, project_code)
            `)
            .eq('id', quoteId)
            .single()
          if (joinErr || !joinData) throw new Error('Failed to fetch quote')
          qData = {
            ...joinData,
            customer_name: joinData.customers?.name,
            project_name: joinData.projects?.name,
            project_code: joinData.projects?.project_code
          }
        }
        let enriched = qData
        try {
          // Enrich with customer & project names if missing
          if (!qData.customer_name || !qData.project_name) {
            const { data: joinData } = await supabase
              .from('quotes')
              .select(`
                *,
                customers:customer_id(name, email),
                projects:project_id(name, project_code)
              `)
              .eq('id', quoteId)
              .single()
            if (joinData) {
              enriched = {
                ...qData,
                customer_name: joinData.customers?.name,
                project_name: joinData.projects?.name,
                project_code: joinData.projects?.project_code,
                quote_number: joinData.quote_number ?? qData.quote_number
              }
            }
          }
        } catch (_) {}
        setQuote(enriched)

        // Fetch quote items
        try {
          const iRes = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/items`), {
            headers: { Authorization: `Bearer ${token || ''}` }
          })
          if (iRes.ok) {
            const iData = await iRes.json()
            setItems(iData.items || [])
          } else {
            // Fallback to Supabase direct quote_items
            const { data: supaItems } = await supabase
              .from('quote_items')
              .select('*')
              .eq('quote_id', quoteId)
            setItems(Array.isArray(supaItems) ? supaItems as any : [])
          }
        } catch (_) {
          const { data: supaItems } = await supabase
            .from('quote_items')
            .select('*')
            .eq('quote_id', quoteId)
          setItems(Array.isArray(supaItems) ? supaItems as any : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (quoteId) fetchData()
  }, [quoteId])

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—')

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quote) {
    return <div className="p-6 text-gray-600">Không tìm thấy báo giá</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (match sales UI style) */}
      <aside className="hidden md:block w-60 bg-white border-r border-gray-200 p-4 sticky top-0 h-screen">
        <div className="text-sm font-semibold text-gray-900 mb-3">Bán hàng</div>
        <nav className="space-y-1 text-sm">
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales">Tổng quan</a>
          <a className="block px-3 py-2 rounded-md bg-blue-50 text-blue-700" href="/sales?tab=quotes">Báo giá</a>
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales?tab=invoices">Hóa đơn</a>
          <a className="block px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700" href="/sales?tab=sales-receipts">Phiếu bán hàng</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <a href="/sales?tab=quotes" className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            ← Trở về Bán hàng
          </a>
        </div>
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-700" />
          <div>
            <div className="text-xl font-semibold text-gray-900">Báo giá {quote.quote_number ? `- ${quote.quote_number}` : ''}</div>
            <div className="text-sm text-gray-600">
              Dự án: {quote.project_name || '—'} {quote.project_code ? `(${quote.project_code})` : ''}
            </div>
            <div className="text-sm text-gray-600">Khách hàng: {quote.customer_name || '—'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-700">{formatCurrency(quote.total_amount)}</div>
          <div className="text-xs text-gray-500">Trạng thái: {quote.status}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4" /> Ngày phát hành: {formatDate(quote.issue_date)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4" /> Hiệu lực đến: {formatDate(quote.valid_until)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <DollarSign className="h-4 w-4" /> Thuế: {quote.tax_rate}% ({formatCurrency(quote.tax_amount)})
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
                  <div className="font-medium">{it.name_product}</div>
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


