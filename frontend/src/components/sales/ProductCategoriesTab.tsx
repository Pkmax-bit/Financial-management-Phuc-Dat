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
      setError(e.message || 'Không thể tải danh sách hạng mục')
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
      setError(e.message || 'Không thể tạo hạng mục')
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
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tạo hạng mục</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Tên hạng mục <span className="text-red-500">*</span></label>
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
              placeholder="Ghi chú mô tả cho hạng mục"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo hạng mục'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Danh sách hạng mục</h4>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có hạng mục</div>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h5 className="text-base font-medium text-gray-900 mb-1">{c.name}</h5>
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm ${c.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {c.is_active ? 'Đang hoạt động' : 'Đã ngưng'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Tạo: {new Date(c.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(c.id, c.is_active)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        c.is_active 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {c.is_active ? 'Ngưng' : 'Kích hoạt'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


