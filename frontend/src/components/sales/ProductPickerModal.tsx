'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  price: number
  unit: string
  description: string | null
  category_id: string | null
}

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)

export default function ProductPickerModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, unit, description, category_id')
          .order('created_at', { ascending: false })
        if (error) throw error
        setProducts((data || []) as unknown as Product[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s)
    )
  }, [search, products])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chọn sản phẩm</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="p-4">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4">Không có sản phẩm phù hợp</div>
            ) : (
              <table className="min-w-full text-sm text-gray-900">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Tên</th>
                    <th className="px-3 py-2 text-right font-semibold w-32">Đơn giá</th>
                    <th className="px-3 py-2 text-left font-semibold w-24">Đơn vị</th>
                    <th className="px-3 py-2 text-left font-semibold">Mô tả</th>
                    <th className="px-3 py-2 text-right font-semibold w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(Number(p.price) || 0)}</td>
                      <td className="px-3 py-2">{p.unit}</td>
                      <td className="px-3 py-2">{p.description || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => { onSelect(p); onClose() }}
                          className="text-blue-600 hover:underline text-xs"
                        >Chọn</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


