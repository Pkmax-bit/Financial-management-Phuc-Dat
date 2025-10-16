'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Category = {
  id: string
  name: string
}

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)
// Parse Vietnamese currency-like input: remove all non-digits so '1.000.000' -> '1000000'
const parseCurrency = (s: string): number => {
  const clean = s.replace(/[^\d]/g, '')
  return clean ? parseInt(clean, 10) : 0
}

export default function ProductCreateForm({ onCreated }: { onCreated?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [priceDisplay, setPriceDisplay] = useState('0')
  const [unit, setUnit] = useState('cái')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('product_categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name', { ascending: true })
        if (error) throw error
        setCategories((data || []) as unknown as Category[])
      } catch (e: any) {
        setError(e.message || 'Không thể tải loại sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onPriceChange = (val: string) => {
    const num = parseCurrency(val)
    setPrice(num)
    setPriceDisplay(num > 0 ? formatNumber(num) : val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    try {
      setSubmitting(true)
      setError(null)
      const { error } = await supabase
        .from('products')
        .insert({
          category_id: categoryId,
          name: name.trim(),
          price: price,
          unit: unit.trim() || 'cái',
          description: description.trim() || null,
          is_active: true
        })
      if (error) throw error
      // Reset form
      setName('')
      setCategoryId('')
      setPrice(0)
      setPriceDisplay('0')
      setUnit('cái')
      setDescription('')
      onCreated?.()
    } catch (e: any) {
      setError(e.message || 'Không thể tạo sản phẩm')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tạo sản phẩm</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-900 mb-1">Loại sản phẩm <span className="text-red-500">*</span></label>
          <select
            disabled={loading}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn loại</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-900 mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Bàn gỗ sồi"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Đơn giá</label>
          <input
            type="text"
            value={priceDisplay}
            onChange={(e) => onPriceChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Đơn vị</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="cái / bộ / m2 ..."
          />
        </div>
        <div className="md:col-span-12">
          <label className="block text-sm font-medium text-gray-900 mb-1">Mô tả</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="Mô tả chi tiết sản phẩm"
          />
        </div>
        <div className="md:col-span-12">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
          {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  )
}


