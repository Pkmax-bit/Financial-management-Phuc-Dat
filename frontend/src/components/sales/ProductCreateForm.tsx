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
  const [success, setSuccess] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [priceDisplay, setPriceDisplay] = useState('0')
  const [unit, setUnit] = useState('cái')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Dimension fields
  const [area, setArea] = useState<number | null>(null)
  const [areaDisplay, setAreaDisplay] = useState('')
  const [volume, setVolume] = useState<number | null>(null)
  const [volumeDisplay, setVolumeDisplay] = useState('')
  const [height, setHeight] = useState<number | null>(null)
  const [heightDisplay, setHeightDisplay] = useState('')
  const [length, setLength] = useState<number | null>(null)
  const [lengthDisplay, setLengthDisplay] = useState('')
  const [depth, setDepth] = useState<number | null>(null)
  const [depthDisplay, setDepthDisplay] = useState('')

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

  // Parse number for dimension fields (similar to price but allows decimals)
  const parseNumber = (s: string): number | null => {
    const clean = s.replace(/[^\d.]/g, '')
    return clean ? parseFloat(clean) : null
  }

  const onDimensionChange = (val: string, setter: (val: number | null) => void, displaySetter: (val: string) => void) => {
    const num = parseNumber(val)
    setter(num)
    displaySetter(num ? formatNumber(num) : val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      const { error } = await supabase
        .from('products')
        .insert({
          category_id: categoryId,
          name: name.trim(),
          price: price,
          unit: unit.trim() || 'cái',
          description: description.trim() || null,
          area: area,
          volume: volume,
          height: height,
          length: length,
          depth: depth,
          is_active: true
        })
      if (error) throw error
      
      // Show success message
      setSuccess(`Sản phẩm "${name.trim()}" đã được tạo thành công!`)
      
      // Reset form
      setName('')
      setCategoryId('')
      setPrice(0)
      setPriceDisplay('0')
      setUnit('cái')
      setDescription('')
      setArea(null)
      setAreaDisplay('')
      setVolume(null)
      setVolumeDisplay('')
      setHeight(null)
      setHeightDisplay('')
      setLength(null)
      setLengthDisplay('')
      setDepth(null)
      setDepthDisplay('')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
      
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
      
      {/* Success Notification */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Notification */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
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
        
        {/* Dimension fields */}
        <div className="md:col-span-12">
          <h4 className="text-md font-medium text-gray-900 mb-3 mt-4">Kích thước sản phẩm</h4>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Diện tích (m²)</label>
          <input
            type="text"
            value={areaDisplay}
            onChange={(e) => onDimensionChange(e.target.value, setArea, setAreaDisplay)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Thể tích (m³)</label>
          <input
            type="text"
            value={volumeDisplay}
            onChange={(e) => onDimensionChange(e.target.value, setVolume, setVolumeDisplay)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Chiều cao (m)</label>
          <input
            type="text"
            value={heightDisplay}
            onChange={(e) => onDimensionChange(e.target.value, setHeight, setHeightDisplay)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Dài (m)</label>
          <input
            type="text"
            value={lengthDisplay}
            onChange={(e) => onDimensionChange(e.target.value, setLength, setLengthDisplay)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 mb-1">Sâu (m)</label>
          <input
            type="text"
            value={depthDisplay}
            onChange={(e) => onDimensionChange(e.target.value, setDepth, setDepthDisplay)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2">
          {/* Empty column for spacing */}
        </div>
        
        <div className="md:col-span-12">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !categoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  )
}


