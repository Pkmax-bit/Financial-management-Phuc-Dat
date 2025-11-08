'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, RefreshCw, Save, Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type DimensionType = 'area' | 'volume' | 'height' | 'length' | 'depth' | 'quantity'
type ChangeType = 'percentage' | 'absolute'
type ChangeDirection = 'increase' | 'decrease' | 'both'
type AdjustmentType = 'percentage' | 'absolute'

interface ExpenseObjectOption {
  id: string
  name: string
}

interface RuleRow {
  id?: string
  expense_object_id: string
  dimension_type: DimensionType
  change_type: ChangeType
  change_value: number
  change_direction: ChangeDirection
  adjustment_type: AdjustmentType
  adjustment_value: number
  priority: number
  name?: string
  description?: string
  is_active: boolean
  max_adjustment_percentage?: number | null
  max_adjustment_value?: number | null
  allowed_category_ids?: string[] | null
}

function Input({ className = '', ...props }: any) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    />
  )
}

export default function MaterialAdjustmentRulesTab() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<RuleRow[]>([])
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObjectOption[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const filteredRules = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return rules
    return rules.filter(r =>
      (r.name || '').toLowerCase().includes(s) ||
      (r.description || '').toLowerCase().includes(s)
    )
  }, [rules, search])

  const dimOptions: { value: DimensionType, label: string }[] = [
    { value: 'area', label: 'Diện tích (m²)' },
    { value: 'volume', label: 'Thể tích (m³)' },
    { value: 'height', label: 'Cao (mm)' },
    { value: 'length', label: 'Dài (mm)' },
    { value: 'depth', label: 'Sâu (mm)' },
    { value: 'quantity', label: 'Số lượng' }
  ]
  const getDimensionLabel = (v: DimensionType) => dimOptions.find(o => o.value === v)?.label || v
  const changeTypeOptions: { value: ChangeType, label: string }[] = [
    { value: 'percentage', label: 'Phần trăm' },
    { value: 'absolute', label: 'Tuyệt đối' }
  ]
  const getChangeTypeLabel = (v: ChangeType) => changeTypeOptions.find(o => o.value === v)?.label || v
  const directionOptions: { value: ChangeDirection, label: string }[] = [
    { value: 'increase', label: 'Tăng' },
    { value: 'decrease', label: 'Giảm' },
    { value: 'both', label: 'Cả hai' }
  ]
  const getDirectionLabel = (v: ChangeDirection) => directionOptions.find(o => o.value === v)?.label || v
  const adjustmentTypeOptions: { value: AdjustmentType, label: string, hint: string }[] = [
    { value: 'percentage', label: 'Phần trăm', hint: 'Áp dụng theo % vào số lượng vật tư (ví dụ -2 = giảm 2%)' },
    { value: 'absolute', label: 'Tuyệt đối', hint: 'Cộng/trừ trực tiếp vào số lượng vật tư (ví dụ 2 = +2)' }
  ]
  const getAdjustmentTypeLabel = (v: AdjustmentType) => adjustmentTypeOptions.find(o => o.value === v)?.label || v

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    try {
      setLoading(true)
      // Load expense objects for dropdown
      const { data: exp } = await supabase
        .from('expense_objects')
        .select('id, name')
        .order('name')
      setExpenseObjects(exp || [])

      // Load product categories for multi-select
      const { data: cats } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      setCategories(cats || [])

      // Load rules
      const { data: rows } = await supabase
        .from('material_adjustment_rules')
        .select('*')
        .order('priority', { ascending: true })
      setRules((rows || []).map((r: any) => ({
        id: r.id,
        expense_object_id: r.expense_object_id,
        dimension_type: r.dimension_type,
        change_type: r.change_type,
        change_value: Number(r.change_value || 0),
        change_direction: r.change_direction || 'increase',
        adjustment_type: r.adjustment_type,
        adjustment_value: Number(r.adjustment_value || 0),
        priority: Number(r.priority ?? 100),
        name: r.name || '',
        description: r.description || '',
        is_active: !!r.is_active,
        max_adjustment_percentage: r.max_adjustment_percentage != null ? Number(r.max_adjustment_percentage) : null,
        max_adjustment_value: r.max_adjustment_value != null ? Number(r.max_adjustment_value) : null,
        allowed_category_ids: Array.isArray(r.allowed_category_ids) ? r.allowed_category_ids : null
      })))
    } catch (e) {
      console.error('Failed to load adjustment rules:', e)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const addBlank = () => {
    const firstExp = expenseObjects[0]?.id || ''
    setRules(prev => ([
      {
        expense_object_id: firstExp,
        dimension_type: 'quantity',
        change_type: 'percentage',
        change_value: 10,
        change_direction: 'increase',
        adjustment_type: 'percentage',
        max_adjustment_percentage: null,
        max_adjustment_value: null,
        adjustment_value: 10,
        priority: 100,
        name: '',
        description: '',
        is_active: true,
        allowed_category_ids: null
      },
      ...prev
    ]))
    setEditingId('new')
  }

  const saveRow = async (row: RuleRow, idx: number) => {
    try {
      setSaving(true)
      if (!row.expense_object_id) throw new Error('Vui lòng chọn vật tư (expense_object)')
      if (!row.dimension_type) throw new Error('Vui lòng chọn loại kích thước')
      if (!row.change_type) throw new Error('Vui lòng chọn loại thay đổi')
      if (row.change_value == null) throw new Error('Vui lòng nhập ngưỡng thay đổi')
      if (!row.adjustment_type) throw new Error('Vui lòng chọn cách điều chỉnh')
      if (row.adjustment_value == null) throw new Error('Vui lòng nhập giá trị điều chỉnh')

      const payload: any = {
        expense_object_id: row.expense_object_id,
        dimension_type: row.dimension_type,
        change_type: row.change_type,
        change_value: row.change_value,
        change_direction: row.change_direction,
        adjustment_type: row.adjustment_type,
        adjustment_value: row.adjustment_value,
        priority: row.priority ?? 100,
        name: row.name || null,
        description: row.description || null,
        is_active: row.is_active,
        max_adjustment_percentage: row.max_adjustment_percentage != null ? row.max_adjustment_percentage : null,
        max_adjustment_value: row.max_adjustment_value != null ? row.max_adjustment_value : null,
        allowed_category_ids: row.allowed_category_ids && row.allowed_category_ids.length > 0 ? row.allowed_category_ids : null
      }

      if (row.id) {
        const { error } = await supabase
          .from('material_adjustment_rules')
          .update(payload)
          .eq('id', row.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('material_adjustment_rules')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        row.id = data?.id
      }

      const updated = [...rules]
      updated[idx] = { ...row }
      setRules(updated)
      setEditingId(null)
    } catch (e: any) {
      alert('Lưu quy tắc thất bại: ' + (e?.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  const removeRow = async (row: RuleRow, idx: number) => {
    try {
      if (row.id) {
        const { error } = await supabase
          .from('material_adjustment_rules')
          .delete()
          .eq('id', row.id)
        if (error) throw error
      }
      const updated = [...rules]
      updated.splice(idx, 1)
      setRules(updated)
    } catch (e: any) {
      alert('Xóa quy tắc thất bại: ' + (e?.message || 'unknown'))
    }
  }

  const toggleActive = async (row: RuleRow, idx: number) => {
    try {
      const newActive = !row.is_active
      if (row.id) {
        const { error } = await supabase
          .from('material_adjustment_rules')
          .update({ is_active: newActive })
          .eq('id', row.id)
        if (error) throw error
      }
      const updated = [...rules]
      updated[idx] = { ...row, is_active: newActive }
      setRules(updated)
    } catch (e: any) {
      alert('Cập nhật trạng thái thất bại: ' + (e?.message || 'unknown'))
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header - Responsive */}
      <div className="px-4 py-3 border-b">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={refresh} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </button>
            <button onClick={addBlank} className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Thêm quy tắc
            </button>
            <button onClick={() => setShowHelp(true)} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-black bg-white hover:bg-gray-50">
              <HelpIcon /> Hướng dẫn
            </button>
          </div>
          <div className="flex-1 md:ml-auto">
            <Input placeholder="Tìm theo tên/mô tả..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="w-full md:w-auto" />
          </div>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-black">Vật tư</th>
              <th className="px-3 py-2 text-left font-medium text-black" style={{ minWidth: 220 }}>Loại sản phẩm</th>
              <th className="px-3 py-2 text-left font-medium text-black">Kích thước</th>
              <th className="px-3 py-2 text-left font-medium text-black">Loại thay đổi</th>
              <th className="px-3 py-2 text-right font-medium text-black">Ngưỡng</th>
              <th className="px-3 py-2 text-left font-medium text-black">Chiều thay đổi</th>
              <th className="px-3 py-2 text-left font-medium text-black">Cách điều chỉnh</th>
              <th className="px-3 py-2 text-right font-medium text-black" style={{ minWidth: 140 }}>Giá trị điều chỉnh</th>
              <th className="px-3 py-2 text-right font-medium text-black" style={{ minWidth: 140 }}>Tối đa điều chỉnh (%)</th>
              <th className="px-3 py-2 text-right font-medium text-black" style={{ minWidth: 140 }}>Tối đa điều chỉnh (abs)</th>
              <th className="px-3 py-2 text-right font-medium text-black" style={{ minWidth: 120 }}>Ưu tiên</th>
              <th className="px-3 py-2 text-left font-medium text-black" style={{ minWidth: 200 }}>Tên</th>
              <th className="px-3 py-2 text-left font-medium text-black" style={{ minWidth: 280 }}>Mô tả</th>
              <th className="px-3 py-2 text-center font-medium text-black" style={{ minWidth: 120 }}>Kích hoạt</th>
              <th className="px-3 py-2 text-right font-medium text-black">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={14} className="px-3 py-6 text-center text-black">Đang tải...</td>
              </tr>
            ) : filteredRules.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-6 text-center text-black">Chưa có quy tắc</td>
              </tr>
            ) : (
              filteredRules.map((row, idx) => {
                const isEditing = editingId === row.id || (editingId === 'new' && !row.id)
                return (
                  <tr key={row.id || `new-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          className="w-56 border border-gray-300 rounded-md px-2 py-1 text-sm text-black"
                          value={row.expense_object_id}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, expense_object_id: e.target.value }
                            setRules(updated)
                          }}
                        >
                          {expenseObjects.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-black">{expenseObjects.find(o => o.id === row.expense_object_id)?.name || row.expense_object_id}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="w-[320px] border border-gray-300 rounded-md p-2 bg-white">
                          <div className="mb-2">
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-black"
                              placeholder="Tìm loại sản phẩm..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              onClick={() => {
                                const all = categories.map(c => c.id)
                                const updated = [...rules]
                                updated[idx] = { ...row, allowed_category_ids: all }
                                setRules(updated)
                              }}
                            >Chọn tất cả</button>
                            <button
                              type="button"
                              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              onClick={() => {
                                const updated = [...rules]
                                updated[idx] = { ...row, allowed_category_ids: null }
                                setRules(updated)
                              }}
                            >Bỏ chọn</button>
                          </div>
                          <div className="max-h-40 overflow-auto border border-gray-200 rounded">
                            {(categories
                              .filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
                            ).map(c => {
                              const checked = !!row.allowed_category_ids?.includes(c.id)
                              return (
                                <label key={c.id} className="flex items-center gap-2 px-2 py-1 text-sm text-black hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const curr = new Set(row.allowed_category_ids || [])
                                      if (e.target.checked) curr.add(c.id)
                                      else curr.delete(c.id)
                                      const next = Array.from(curr)
                                      const updated = [...rules]
                                      updated[idx] = { ...row, allowed_category_ids: next.length > 0 ? next : null }
                                      setRules(updated)
                                    }}
                                  />
                                  <span>{c.name}</span>
                                </label>
                              )
                            })}
                            {categories.filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())).length === 0 && (
                              <div className="px-2 py-2 text-xs text-gray-500">Không tìm thấy loại phù hợp</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-black">
                          {row.allowed_category_ids && row.allowed_category_ids.length > 0
                            ? row.allowed_category_ids.map(id => categories.find(c => c.id === id)?.name || id).join(', ')
                            : 'Tất cả'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-black"
                          value={row.dimension_type}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, dimension_type: e.target.value as DimensionType }
                            setRules(updated)
                          }}
                        >
                          {dimOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <span className="text-black">{getDimensionLabel(row.dimension_type)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-black"
                          value={row.change_type}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_type: e.target.value as ChangeType }
                            setRules(updated)
                          }}
                        >
                          {changeTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-black">{getChangeTypeLabel(row.change_type)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.change_value}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_value: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.change_value}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-black"
                          value={row.change_direction}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_direction: e.target.value as ChangeDirection }
                            setRules(updated)
                          }}
                        >
                          {directionOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <span className="text-black">{getDirectionLabel(row.change_direction)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          className="w-40 border border-gray-300 rounded-md px-2 py-1 text-sm text-black"
                          value={row.adjustment_type}
                          title={adjustmentTypeOptions.find(o => o.value === row.adjustment_type)?.hint}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, adjustment_type: e.target.value as AdjustmentType }
                            setRules(updated)
                          }}
                        >
                          {adjustmentTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-black" title={adjustmentTypeOptions.find(o => o.value === row.adjustment_type)?.hint}>
                          {getAdjustmentTypeLabel(row.adjustment_type)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ minWidth: 140 }}>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.adjustment_value}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, adjustment_value: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.adjustment_value}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ minWidth: 140 }}>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Tối đa %"
                          title="Giới hạn tối đa cho điều chỉnh phần trăm (ví dụ: 30 cho tối đa 30%)"
                          value={row.max_adjustment_percentage != null ? row.max_adjustment_percentage : ''}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, max_adjustment_percentage: e.target.value === '' ? null : Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.max_adjustment_percentage != null ? row.max_adjustment_percentage : '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ minWidth: 140 }}>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Tối đa abs"
                          title="Giới hạn tối đa cho điều chỉnh tuyệt đối (cho adjustment_type = absolute)"
                          value={row.max_adjustment_value != null ? row.max_adjustment_value : ''}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, max_adjustment_value: e.target.value === '' ? null : Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.max_adjustment_value != null ? row.max_adjustment_value : '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" style={{ minWidth: 120 }}>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={row.priority}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, priority: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.priority}</span>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 200 }}>
                      {isEditing ? (
                        <Input
                          value={row.name || ''}
                          placeholder="Tên quy tắc (ví dụ: Tăng DT 20% → +10% vật tư)"
                          title="Tên gợi nhớ cho quy tắc"
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, name: e.target.value }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 280 }}>
                      {isEditing ? (
                        <Input
                          value={row.description || ''}
                          placeholder="Ghi chú mô tả quy tắc (tùy chọn)"
                          title="Mô tả ngắn giúp giải thích quy tắc"
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, description: e.target.value }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <span className="text-black">{row.description}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ minWidth: 120 }}>
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={() => toggleActive(row, idx)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button disabled={saving} onClick={() => saveRow(row, idx)} className="inline-flex items-center px-3 py-1 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="inline-flex items-center px-3 py-1 rounded-md text-white bg-gray-500 hover:bg-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(row.id || 'new')} className="inline-flex items-center px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => removeRow(row, idx)} className="inline-flex items-center px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout - Visible on mobile only */}
      <div className="md:hidden p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-black">Đang tải...</div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-8 text-black">Chưa có quy tắc</div>
        ) : (
          filteredRules.map((row, idx) => {
            const isEditing = editingId === row.id || (editingId === 'new' && !row.id)
            const expenseObjectName = expenseObjects.find(o => o.id === row.expense_object_id)?.name || row.expense_object_id
            const categoryNames = row.allowed_category_ids && row.allowed_category_ids.length > 0
              ? row.allowed_category_ids.map(id => categories.find(c => c.id === id)?.name || id).join(', ')
              : 'Tất cả'

            return (
              <div key={row.id || `new-${idx}`} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {row.name || `Quy tắc ${idx + 1}`}
                    </h3>
                    {row.description && (
                      <p className="text-xs text-gray-600">{row.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {row.is_active ? 'Hoạt động' : 'Tắt'}
                    </span>
                    {!isEditing && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditingId(row.id || 'new')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeRow(row, idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-600">Vật tư:</span>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
                          value={row.expense_object_id}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, expense_object_id: e.target.value }
                            setRules(updated)
                          }}
                        >
                          {expenseObjects.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black font-medium mt-1">{expenseObjectName}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Kích thước:</span>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
                          value={row.dimension_type}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, dimension_type: e.target.value as DimensionType }
                            setRules(updated)
                          }}
                        >
                          {dimOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      ) : (
                        <p className="text-black font-medium mt-1">{getDimensionLabel(row.dimension_type)}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-600">Loại thay đổi:</span>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
                          value={row.change_type}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_type: e.target.value as ChangeType }
                            setRules(updated)
                          }}
                        >
                          {changeTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black font-medium mt-1">{getChangeTypeLabel(row.change_type)}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Ngưỡng:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          className="mt-1"
                          value={row.change_value}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_value: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <p className="text-black font-medium mt-1">{row.change_value}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Loại sản phẩm:</span>
                    {isEditing ? (
                      <div className="mt-1 border border-gray-300 rounded-md p-2 bg-white">
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-black mb-2"
                          placeholder="Tìm loại sản phẩm..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                            onClick={() => {
                              const all = categories.map(c => c.id)
                              const updated = [...rules]
                              updated[idx] = { ...row, allowed_category_ids: all }
                              setRules(updated)
                            }}
                          >Chọn tất cả</button>
                          <button
                            type="button"
                            className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                            onClick={() => {
                              const updated = [...rules]
                              updated[idx] = { ...row, allowed_category_ids: null }
                              setRules(updated)
                            }}
                          >Bỏ chọn</button>
                        </div>
                        <div className="max-h-32 overflow-auto border border-gray-200 rounded text-xs">
                          {categories.filter(c => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())).map(c => {
                            const checked = !!row.allowed_category_ids?.includes(c.id)
                            return (
                              <label key={c.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const curr = new Set(row.allowed_category_ids || [])
                                    if (e.target.checked) curr.add(c.id)
                                    else curr.delete(c.id)
                                    const next = Array.from(curr)
                                    const updated = [...rules]
                                    updated[idx] = { ...row, allowed_category_ids: next.length > 0 ? next : null }
                                    setRules(updated)
                                  }}
                                />
                                <span>{c.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-black font-medium mt-1 text-xs">{categoryNames}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-600">Chiều thay đổi:</span>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
                          value={row.change_direction}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, change_direction: e.target.value as ChangeDirection }
                            setRules(updated)
                          }}
                        >
                          {directionOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black font-medium mt-1">{getDirectionLabel(row.change_direction)}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Cách điều chỉnh:</span>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black"
                          value={row.adjustment_type}
                          onChange={(e) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, adjustment_type: e.target.value as AdjustmentType }
                            setRules(updated)
                          }}
                        >
                          {adjustmentTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-black font-medium mt-1">{getAdjustmentTypeLabel(row.adjustment_type)}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-600">Giá trị điều chỉnh:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          className="mt-1"
                          value={row.adjustment_value}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, adjustment_value: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <p className="text-black font-medium mt-1">{row.adjustment_value}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Ưu tiên:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          className="mt-1"
                          value={row.priority}
                          onChange={(e: any) => {
                            const updated = [...rules]
                            updated[idx] = { ...row, priority: Number(e.target.value) }
                            setRules(updated)
                          }}
                        />
                      ) : (
                        <p className="text-black font-medium mt-1">{row.priority}</p>
                      )}
                    </div>
                  </div>

                  {(row.max_adjustment_percentage != null || row.max_adjustment_value != null) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      {row.max_adjustment_percentage != null && (
                        <div>
                          <span className="text-xs text-gray-600">Tối đa điều chỉnh (%):</span>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              className="mt-1"
                              value={row.max_adjustment_percentage}
                              onChange={(e: any) => {
                                const updated = [...rules]
                                updated[idx] = { ...row, max_adjustment_percentage: e.target.value === '' ? null : Number(e.target.value) }
                                setRules(updated)
                              }}
                            />
                          ) : (
                            <p className="text-black font-medium mt-1">{row.max_adjustment_percentage}</p>
                          )}
                        </div>
                      )}
                      {row.max_adjustment_value != null && (
                        <div>
                          <span className="text-xs text-gray-600">Tối đa điều chỉnh (abs):</span>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="mt-1"
                              value={row.max_adjustment_value}
                              onChange={(e: any) => {
                                const updated = [...rules]
                                updated[idx] = { ...row, max_adjustment_value: e.target.value === '' ? null : Number(e.target.value) }
                                setRules(updated)
                              }}
                            />
                          ) : (
                            <p className="text-black font-medium mt-1">{row.max_adjustment_value}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        disabled={saving}
                        onClick={() => saveRow(row, idx)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm text-white bg-gray-500 hover:bg-gray-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHelp(false)}></div>
          <div className="relative rounded-lg shadow-xl w-full max-w-5xl mx-4 bg-white/80 backdrop-blur-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Hướng dẫn sử dụng quy tắc điều chỉnh</h3>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-black overflow-y-auto flex-1">
              <div>
                <p className="font-semibold mb-1">Mục đích</p>
                <p>Tự động điều chỉnh số lượng vật tư khi kích thước/số lượng của dòng báo giá thay đổi, theo các quy tắc do bạn định nghĩa.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Các trường chính</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-medium">Vật tư</span>: Chọn vật tư (expense_object) sẽ bị điều chỉnh.</li>
                  <li><span className="font-medium">Kích thước</span>: Chọn loại theo dõi thay đổi (Diện tích, Thể tích, Cao, Dài, Sâu, Số lượng).</li>
                  <li><span className="font-medium">Loại thay đổi</span>: Phần trăm hoặc Tuyệt đối (cách đo mức thay đổi).</li>
                  <li><span className="font-medium">Ngưỡng</span>: Mức thay đổi tối thiểu để quy tắc kích hoạt (ví dụ: 10 cho 10%).</li>
                  <li><span className="font-medium">Chiều thay đổi</span>: Tăng, Giảm hoặc Cả hai.</li>
                  <li><span className="font-medium">Cách điều chỉnh</span>: Phần trăm hoặc Tuyệt đối (cách áp dụng lên số lượng vật tư).</li>
                  <li><span className="font-medium">Giá trị điều chỉnh</span>: Mức tăng/giảm vật tư (ví dụ: -10 để giảm 10%, hoặc +2 để tăng 2 đơn vị).</li>
                  <li><span className="font-medium">Tối đa điều chỉnh (%)</span>: Giới hạn tối đa cho điều chỉnh phần trăm (tùy chọn). Ví dụ: Nếu diện tích tăng 20% → giảm 10%, nhưng tối đa chỉ giảm 30% thì đặt 30.</li>
                  <li><span className="font-medium">Tối đa điều chỉnh (abs)</span>: Giới hạn tối đa cho điều chỉnh tuyệt đối (tùy chọn, dùng khi Cách điều chỉnh = Tuyệt đối).</li>
                  <li><span className="font-medium">Ưu tiên</span>: Số nhỏ chạy trước khi nhiều quy tắc cùng khớp (mặc định 100).</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Ví dụ mẫu</p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 border rounded">
                    <p className="font-medium">1) Tăng diện tích ≥ 10% → Tăng vật tư 5%</p>
                    <ul className="list-disc list-inside text-xs">
                      <li>Kích thước: Diện tích (m²); Loại thay đổi: Phần trăm; Ngưỡng: 10; Chiều thay đổi: Tăng</li>
                      <li>Cách điều chỉnh: Phần trăm; Giá trị điều chỉnh: 5</li>
                      <li>Kết quả: Diện tích tăng 20% (≥10%) → Vật tư tăng 5%</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 border rounded">
                    <p className="font-medium">2) Tăng diện tích ≥ 10% → Giảm nhân công 10%, tối đa giảm 30%</p>
                    <ul className="list-disc list-inside text-xs">
                      <li>Kích thước: Diện tích (m²); Loại thay đổi: Phần trăm; Ngưỡng: 10; Chiều thay đổi: Giảm</li>
                      <li>Cách điều chỉnh: Phần trăm; Giá trị điều chỉnh: -10; Tối đa điều chỉnh (%): 30</li>
                      <li><span className="font-semibold">Lưu ý:</span> Đây là inverse rule - "Giảm" với giá trị âm sẽ áp dụng khi diện tích TĂNG</li>
                      <li>Kết quả: Diện tích tăng 20% (≥10%) → Nhân công giảm 10%; Diện tích tăng 60% → Nhân công chỉ giảm tối đa 30% (giới hạn)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 border rounded">
                    <p className="font-medium">3) Dài tăng ≥ 100mm → Cộng thêm 1 đơn vị vật tư</p>
                    <ul className="list-disc list-inside text-xs">
                      <li>Kích thước: Dài (mm); Loại thay đổi: Tuyệt đối; Ngưỡng: 100; Chiều thay đổi: Tăng</li>
                      <li>Cách điều chỉnh: Tuyệt đối; Giá trị điều chỉnh: 1</li>
                      <li>Kết quả: Dài tăng 150mm (≥100mm) → Vật tư tăng 1 đơn vị</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 border rounded">
                    <p className="font-medium">4) Số lượng tăng → Diện tích tự động tăng theo</p>
                    <ul className="list-disc list-inside text-xs">
                      <li>Khi số lượng sản phẩm thay đổi, diện tích và thể tích sẽ tự động điều chỉnh theo tỷ lệ: area = baseline_area × quantity</li>
                      <li>Ví dụ: Baseline area = 8.4 m², quantity = 1 → area = 8.4 m²; quantity = 2 → area = 16.8 m²</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p><span className="font-semibold">Lưu ý:</span></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nhiều quy tắc có thể cùng áp dụng và sẽ cộng dồn theo thứ tự Ưu tiên (nhỏ → lớn).</li>
                  <li>Giới hạn tối đa ngăn tổng điều chỉnh vượt quá giá trị đã đặt (ví dụ: tối đa giảm 30% dù có nhiều quy tắc).</li>
                  <li>Giá trị điều chỉnh âm (-) để giảm, dương (+) để tăng.</li>
                  <li>Quy tắc "decrease" với giá trị điều chỉnh âm sẽ áp dụng khi dimension tăng (inverse rule).</li>
                </ul>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setShowHelp(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HelpIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6a4 4 0 00-4 4h2a2 2 0 114 0c0 2-3 1.75-3 5h2c0-2.5 3-2.5 3-5a4 4 0 00-4-4z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01"/>
    </svg>
  )
}


