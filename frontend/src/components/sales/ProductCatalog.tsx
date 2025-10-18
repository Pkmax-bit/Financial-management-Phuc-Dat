'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ProductItem = {
  id: string
  name: string
  price: number
  unit: string
  description: string | null
  category_id: string | null
  created_at: string
  is_active: boolean
  area: number | null
  volume: number | null
  height: number | null
  length: number | null
  depth: number | null
}

type Category = { id: string; name: string }

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)

export default function ProductCatalog() {
  const [items, setItems] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ProductItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCat, setEditCat] = useState('')
  const [editPrice, setEditPrice] = useState('0')
  const [editUnit, setEditUnit] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editVolume, setEditVolume] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editLength, setEditLength] = useState('')
  const [editDepth, setEditDepth] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [{ data: prodData, error: prodErr }, { data: catData, error: catErr }] = await Promise.all([
        supabase.from('products').select('id, name, price, unit, description, category_id, created_at, is_active, area, volume, height, length, depth').order('created_at', { ascending: false }),
        supabase.from('product_categories').select('id, name')
      ])
      if (prodErr) throw prodErr
      if (catErr) throw catErr
      const catMap: Record<string, string> = {}
      ;(catData as Category[] | null)?.forEach(c => { catMap[c.id] = c.name })
      setCategories(catMap)
      setItems((prodData || []) as unknown as ProductItem[])
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (p: ProductItem) => {
    setEditing(p)
    setEditName(p.name)
    setEditCat(p.category_id || '')
    setEditPrice(formatNumber(Number(p.price) || 0))
    setEditUnit(p.unit)
    setEditDesc(p.description || '')
    setEditArea(p.area ? formatNumber(p.area) : '')
    setEditVolume(p.volume ? formatNumber(p.volume) : '')
    setEditHeight(p.height ? formatNumber(p.height) : '')
    setEditLength(p.length ? formatNumber(p.length) : '')
    setEditDepth(p.depth ? formatNumber(p.depth) : '')
  }

  const parseCurrency = (s: string): number => {
    const clean = s.replace(/[^\d]/g, '')
    return clean ? parseInt(clean, 10) : 0
  }

  const parseNumber = (s: string): number | null => {
    const clean = s.replace(/[^\d.]/g, '')
    return clean ? parseFloat(clean) : null
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      setSaving(true)
      const upd = {
        name: editName.trim() || editing.name,
        category_id: editCat || null,
        price: parseCurrency(editPrice),
        unit: editUnit.trim() || 'cái',
        description: editDesc.trim() || null,
        area: parseNumber(editArea),
        volume: parseNumber(editVolume),
        height: parseNumber(editHeight),
        length: parseNumber(editLength),
        depth: parseNumber(editDepth)
      }
      const { error: updErr } = await supabase
        .from('products')
        .update(upd)
        .eq('id', editing.id)
      if (updErr) throw updErr
      setEditing(null)
      await load()
    } catch (e) {
      // minimal handling; could surface error
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (p: ProductItem) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return
    try {
      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('id', p.id)
      if (delErr) throw delErr
      setItems(prev => prev.filter(it => it.id !== p.id))
    } catch (e) {
      // minimal handling
    }
  }

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Danh sách sản phẩm</h4>
        <div className="text-xs text-gray-600">{items.length} mục</div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4">Đang tải...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-4">Chưa có sản phẩm</div>
        ) : (
          // Group by category name
          Object.entries(
            items.reduce<Record<string, ProductItem[]>>((acc, p) => {
              const catName = p.category_id ? (categories[p.category_id] || 'Khác') : 'Khác'
              if (!acc[catName]) acc[catName] = []
              acc[catName].push(p)
              return acc
            }, {})
          ).sort(([a], [b]) => a.localeCompare(b, 'vi')).map(([catName, list]) => (
            <div key={catName} className="border-b border-gray-200">
              <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900">
                {catName}
              </div>
              <table className="min-w-full text-sm text-gray-900">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold w-48">Tên</th>
                    <th className="px-3 py-2 text-right font-semibold w-24">Đơn giá</th>
                    <th className="px-3 py-2 text-left font-semibold w-20">Đơn vị</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Diện tích</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Thể tích</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Chiều cao</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Dài</th>
                    <th className="px-3 py-2 text-right font-semibold w-20">Sâu</th>
                    <th className="px-3 py-2 text-left font-semibold w-24">Trạng thái</th>
                    <th className="px-3 py-2 text-right font-semibold w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(p => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(Number(p.price) || 0)}</td>
                      <td className="px-3 py-2">{p.unit}</td>
                      <td className="px-3 py-2 text-right">{p.area ? `${formatNumber(p.area)} m²` : '-'}</td>
                      <td className="px-3 py-2 text-right">{p.volume ? `${formatNumber(p.volume)} m³` : '-'}</td>
                      <td className="px-3 py-2 text-right">{p.height ? `${formatNumber(p.height)} cm` : '-'}</td>
                      <td className="px-3 py-2 text-right">{p.length ? `${formatNumber(p.length)} cm` : '-'}</td>
                      <td className="px-3 py-2 text-right">{p.depth ? `${formatNumber(p.depth)} cm` : '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {p.is_active ? 'Đang bán' : 'Ngưng'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                        <button onClick={() => deleteItem(p)} className="text-red-600 hover:underline text-xs">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30" onClick={() => setEditing(null)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Sửa sản phẩm</h3>
                <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-4 space-y-4">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Hạng mục</label>
                    <select
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Khác</option>
                      {Object.entries(categories).sort((a,b)=>a[1].localeCompare(b[1],'vi')).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Tên danh mục</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Đơn giá</label>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Đơn vị</label>
                    <input
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-8">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Mô tả</label>
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Kích thước */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Kích thước</h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Diện tích (m²)</label>
                      <input
                        type="text"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Thể tích (m³)</label>
                      <input
                        type="text"
                        value={editVolume}
                        onChange={(e) => setEditVolume(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Chiều cao (cm)</label>
                      <input
                        type="text"
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Dài (cm)</label>
                      <input
                        type="text"
                        value={editLength}
                        onChange={(e) => setEditLength(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Sâu (cm)</label>
                      <input
                        type="text"
                        value={editDepth}
                        onChange={(e) => setEditDepth(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded text-gray-700">Hủy</button>
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


