'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function ProductCategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCategories((data || []) as unknown as Category[])
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách loại sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setSubmitting(true)
      setError(null)
      const { error } = await supabase
        .from('product_categories')
        .insert({ name: name.trim(), description: description.trim() || null, is_active: true })
      if (error) throw error
      setName('')
      setDescription('')
      await loadCategories()
    } catch (e: any) {
      setError(e.message || 'Không thể tạo loại sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: !isActive })
        .eq('id', id)
      if (error) throw error
      setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c))
    } catch (e) {
      // ignore minimal error handling
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tạo loại sản phẩm</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Tên loại sản phẩm <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Nội thất"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-1">Mô tả</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú mô tả cho loại sản phẩm"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo loại'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">Danh sách loại sản phẩm</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold w-64">Tên loại</th>
                <th className="px-3 py-2 text-left font-semibold">Mô tả</th>
                <th className="px-3 py-2 text-left font-semibold w-24">Trạng thái</th>
                <th className="px-3 py-2 text-right font-semibold w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-3" colSpan={4}>Đang tải...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td className="px-3 py-3" colSpan={4}>Chưa có loại sản phẩm</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.description || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {c.is_active ? 'Đang dùng' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => toggleActive(c.id, c.is_active)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {c.is_active ? 'Ngưng' : 'Kích hoạt'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


