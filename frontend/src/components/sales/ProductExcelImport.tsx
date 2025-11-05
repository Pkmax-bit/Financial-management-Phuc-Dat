'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ExpenseObject = { id: string; name: string; level: number; parent_id?: string | null; is_active?: boolean }

// Lazy import xlsx at runtime to avoid SSR issues; ensure 'xlsx' is added to dependencies
async function loadXLSX() {
  const mod = await import('xlsx')
  return mod
}

const toDecimalString = (value: number | null | undefined, maxFractionDigits = 6): string => {
  if (value == null || !isFinite(Number(value))) return ''
  const fixed = Number(value).toFixed(maxFractionDigits)
  return fixed.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
}

function normalizeNumber(input: any): number | null {
  if (input == null) return null
  if (typeof input === 'number') return isFinite(input) ? input : null
  const s = String(input).trim()
  if (!s) return null
  const normalized = s.replace(/,/g, '.')
  const clean = normalized.replace(/[^\d.\-]/g, '')
  if (!clean) return null
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

// Round number to avoid floating point precision errors
// For quantities: round to max 6 decimal places
// For prices: round to max 2 decimal places
function roundNumber(value: number | null, decimals: number = 6): number | null {
  if (value == null || !isFinite(value)) return null
  // Use Math.round to avoid floating point precision issues
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value.trim())
}

export default function ProductExcelImport({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [allExpenseObjects, setAllExpenseObjects] = useState<ExpenseObject[]>([])
  const [selectedExpenseObjectIds, setSelectedExpenseObjectIds] = useState<string[]>([])
  const [materialSlots, setMaterialSlots] = useState<number>(10)
  const [search, setSearch] = useState<string>('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('expense_objects')
          .select('id, name, level, parent_id, is_active')
          .eq('is_active', true)
          .in('level', [1,2,3])
        setAllExpenseObjects((data || []) as unknown as ExpenseObject[])
      } catch (_) {
        setAllExpenseObjects([])
      }
      try {
        const { data: cats } = await supabase
          .from('product_categories')
          .select('id, name')
          .order('name', { ascending: true })
        setCategories((cats || []) as any)
      } catch (_) {
        setCategories([])
      }
    }
    load()
  }, [])

  const selectedExpenseObjects = useMemo(() => {
    const map: Record<string, ExpenseObject> = {}
    allExpenseObjects.forEach(o => { map[o.id] = o })
    return selectedExpenseObjectIds.map(id => map[id]).filter(Boolean)
  }, [allExpenseObjects, selectedExpenseObjectIds])

  const selectedCategories = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {}
    categories.forEach(c => { map[c.id] = c })
    return selectedCategoryIds.map(id => map[id]).filter(Boolean)
  }, [categories, selectedCategoryIds])

  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase()
    if (!keyword) return categories
    return categories.filter(c => c.name.toLowerCase().includes(keyword))
  }, [categories, categorySearch])

  const groupedExpenseObjects = useMemo(() => {
    // Group by parent chain: Level 1 name -> Level 2 name -> list
    const byId: Record<string, ExpenseObject> = {}
    allExpenseObjects.forEach(o => { byId[o.id] = o })
    const result: Record<string, Record<string, ExpenseObject[]>> = {}
    const keyword = search.trim().toLowerCase()
    for (const o of allExpenseObjects) {
      let l1 = 'Khác'
      let l2 = '—'
      if (o.level === 1) l1 = o.name
      else if (o.level === 2) {
        const p1 = o.parent_id ? byId[o.parent_id] : undefined
        l1 = p1?.name || 'Khác'
        l2 = o.name
      } else if (o.level === 3) {
        const p2 = o.parent_id ? byId[o.parent_id] : undefined
        const p1 = p2?.parent_id ? byId[p2.parent_id] : undefined
        l1 = p1?.name || 'Khác'
        l2 = p2?.name || '—'
      }
      if (keyword && !(`${l1} ${l2} ${o.name}`.toLowerCase().includes(keyword))) continue
      if (!result[l1]) result[l1] = {}
      if (!result[l1][l2]) result[l1][l2] = []
      result[l1][l2].push(o)
    }
    return result
  }, [allExpenseObjects, search])

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const XLSX = await loadXLSX()
      // Build header columns
      const baseHeaders = [
        'Tên','ID loại sản phẩm','Loại sản phẩm','Đơn giá','Thành tiền','Đơn vị','Diện tích (m²)','Thể tích (m³)','Cao (mm)','Dài (mm)','Sâu (mm)'
      ]
      const materialHeaders: string[] = []
      // Use configurable material slots, ensure at least selected count
      const maxSlots = Math.max(materialSlots || 0, selectedExpenseObjects.length, 0)
      for (let i = 1; i <= maxSlots; i++) {
        // Thêm cả tên vật tư (ten)
        materialHeaders.push(`Vật tư ${i} - ID`)
        materialHeaders.push(`Vật tư ${i} - Tên`)
        materialHeaders.push(`Vật tư ${i} - Đơn vị`)
        materialHeaders.push(`Vật tư ${i} - Đơn giá`)
        materialHeaders.push(`Vật tư ${i} - Số lượng`)
      }
      const wsData: any[][] = []
      const headers = [...baseHeaders, ...materialHeaders]
      wsData.push(headers)
      // Prefill first data row with selected category and materials' ID and Tên
      const firstRow = new Array(headers.length).fill('')
      
      // Prefill category ID and name (columns: 'ID loại sản phẩm' at index 1, 'Loại sản phẩm' at index 2)
      if (selectedCategories.length > 0) {
        const firstCategory = selectedCategories[0]
        firstRow[1] = firstCategory.id // ID loại sản phẩm
        firstRow[2] = firstCategory.name // Loại sản phẩm
      }
      
      // Prefill materials' ID and Tên in corresponding slots
      const slots = Math.max(materialSlots || 0, selectedExpenseObjects.length, 0)
      const baseLen = baseHeaders.length
      for (let i = 1; i <= slots; i++) {
        const sel = selectedExpenseObjects[i - 1]
        const colStart = baseLen + (i - 1) * 5
        if (sel) {
          firstRow[colStart + 0] = sel.id // Vật tư i - ID
          firstRow[colStart + 1] = sel.name // Vật tư i - Tên
        }
      }
      wsData.push(firstRow)
      // Add 2 more empty rows as example
      wsData.push(new Array(headers.length).fill(''))
      wsData.push(new Array(headers.length).fill(''))

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sản phẩm')
      // Second sheet: selected expense objects reference
      const refRows = [['id','tên','cấp']].concat(
        (selectedExpenseObjects.length > 0 ? selectedExpenseObjects : allExpenseObjects).map(o => [o.id, o.name, String(o.level)])
      )
      const wsRef = XLSX.utils.aoa_to_sheet(refRows)
      XLSX.utils.book_append_sheet(wb, wsRef, 'Vật tư')
      // Third sheet: product categories reference (only selected if available)
      const catRows = [['id','tên']].concat(
        (selectedCategories.length > 0 ? selectedCategories : categories).map(c => [c.id, c.name])
      )
      const wsCat = XLSX.utils.aoa_to_sheet(catRows)
      XLSX.utils.book_append_sheet(wb, wsCat, 'Loại sản phẩm')
      XLSX.writeFile(wb, 'Mau_nhap_san_pham.xlsx')
    } finally {
      setDownloading(false)
    }
  }

  const handleImportFile = async (file: File) => {
    setLoading(true)
    try {
      const XLSX = await loadXLSX()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!rows || rows.length === 0) {
        alert('File trống hoặc không hợp lệ')
        return
      }

      // Debug: Log available columns to help identify mapping issues
      if (rows.length > 0) {
        const availableColumns = Object.keys(rows[0])
        console.log('Available columns in Excel:', availableColumns)
      }

      // Build helper maps for resolving by name
      const nameToId: Record<string, string> = {}
      allExpenseObjects.forEach(o => { nameToId[o.name.trim().toLowerCase()] = o.id })

      const getCell = (row: any, keys: string[]): any => {
        for (const k of keys) {
          if (k in row) return row[k]
        }
        return undefined
      }

      const catNameToId: Record<string, string> = {}
      categories.forEach(c => { catNameToId[c.name.trim().toLowerCase()] = c.id })

      const productsToInsert = rows.map((r) => {
        const name = String(r['name'] || '').trim()
        // Vietnamese headers fallback
        const nameVi = String(getCell(r, ['Tên']) || '').trim()
        const finalName = (nameVi || name)
        if (!finalName) return null

        // Handle category: try to read from category_id column first (UUID), then from category name column
        let category_id: string | null = null
        
        // First, try to read from category_id column (UUID format)
        const categoryIdCell = String(getCell(r, ['ID loại sản phẩm','category_id']) || '').trim()
        if (categoryIdCell) {
          // Only accept if it's a valid UUID that exists in product_categories
          if (isValidUUID(categoryIdCell)) {
            const existsInCategories = categories.some(c => c.id === categoryIdCell)
            if (existsInCategories) {
              category_id = categoryIdCell
            }
          }
          // If category_id is not a valid UUID, ignore it (don't use text as UUID)
        }
        
        // If no valid UUID from category_id column, try to read from category name column
        if (!category_id) {
          const categoryNameCell = String(getCell(r, ['Loại sản phẩm','category']) || '').trim()
          if (categoryNameCell) {
            // Look up by name from product_categories
            const byName = catNameToId[categoryNameCell.toLowerCase().trim()]
            if (byName && isValidUUID(byName)) {
              category_id = byName
            }
            // If not found by name, set to null (don't assign text to UUID field)
          }
        }

        const price = normalizeNumber(getCell(r, ['Đơn giá','price'])) || 0
        const total_price_ignored = normalizeNumber(getCell(r, ['Thành tiền','total_price'])) // not stored, ignore
        const unit = String(getCell(r, ['Đơn vị','unit']) || '').trim() || 'cái'
        const heightMm = normalizeNumber(getCell(r, ['Cao (mm)','height_mm']))
        const lengthMm = normalizeNumber(getCell(r, ['Dài (mm)','length_mm']))
        const depthMm = normalizeNumber(getCell(r, ['Sâu (mm)','depth_mm']))
        // Prefer deriving area/volume from mm
        const areaFromMm = (lengthMm != null && heightMm != null) ? Number(((lengthMm/1000) * (heightMm/1000)).toFixed(6)) : null
        const volumeFromMm = (lengthMm != null && heightMm != null && depthMm != null) ? Number(((lengthMm/1000) * (heightMm/1000) * (depthMm/1000)).toFixed(9)) : null
        const area = areaFromMm ?? (normalizeNumber(getCell(r, ['Diện tích (m²)','area'])) ?? null)
        const volume = volumeFromMm ?? (normalizeNumber(getCell(r, ['Thể tích (m³)','volume'])) ?? null)

        // Parse up to 50 materials
        const product_components: Array<{ expense_object_id: string; unit?: string | null; unit_price?: number; quantity?: number }> = []
        for (let i = 1; i <= 50; i++) {
          const id = String(getCell(r, [`material_${i}_id`, `Vật tư ${i} - ID`]) || '').trim()
          const nameCell = String(getCell(r, [`material_${i}_name`, `Vật tư ${i} - Tên`]) || '').trim()
          const mu = String(getCell(r, [`material_${i}_unit`, `Vật tư ${i} - Đơn vị`]) || '').trim() || null
          const upRaw = normalizeNumber(getCell(r, [`material_${i}_unit_price`, `Vật tư ${i} - Đơn giá`])) || 0
          const qtyRaw = normalizeNumber(getCell(r, [`material_${i}_quantity`, `Vật tư ${i} - Số lượng`])) || 0
          // Round to avoid floating point precision errors
          const up = roundNumber(upRaw, 2) || 0 // Price: 2 decimal places
          const qty = roundNumber(qtyRaw, 6) || 0 // Quantity: 6 decimal places
          
          let expenseId: string | null = null
          
          // CRITICAL: Only accept valid UUID from expense_objects table
          // First, try to get UUID from ID column
          if (id) {
            // Validate UUID format - if id is not a valid UUID, ignore it
            if (isValidUUID(id)) {
              // Double-check: verify this UUID exists in expense_objects table
              const existsInExpenseObjects = allExpenseObjects.some(eo => eo.id === id)
              if (existsInExpenseObjects) {
                expenseId = id
              }
              // If UUID format is valid but not found in expense_objects, ignore it
            }
            // If id is not a valid UUID (e.g., contains text like "Nhôm Xingfa Quảng Đông"), ignore it
          }
          
          // If no valid UUID from ID column, try to look up by name from expense_objects
          if (!expenseId && nameCell) {
            const match = nameToId[nameCell.toLowerCase().trim()]
            if (match && isValidUUID(match)) {
              expenseId = match
            }
          }
          
          // Only push if we have a valid UUID from expense_objects table
          if (expenseId && isValidUUID(expenseId)) {
            product_components.push({ expense_object_id: expenseId, unit: mu, unit_price: up, quantity: qty })
          }
        }

        return {
          name: finalName,
          unit,
          price,
          description: null,
          category_id,
          is_active: true,
          area,
          volume,
          height: heightMm ?? null,
          length: lengthMm ?? null,
          depth: depthMm ?? null,
          product_components
        }
      }).filter(Boolean)

      if (!productsToInsert || productsToInsert.length === 0) {
        alert('Không có dòng hợp lệ để nhập')
        return
      }

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert as any[])
      if (error) throw error
      alert(`Đã nhập ${productsToInsert.length} sản phẩm thành công`)
      // Reload product list after successful import
      onImportSuccess?.()
    } catch (e: any) {
      alert(`Lỗi nhập file: ${e?.message || e}`)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadTemplate}
        disabled={downloading}
        className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded disabled:opacity-50"
      >
        {downloading ? 'Đang tạo mẫu…' : 'Tải file mẫu Excel'}
      </button>

      <label className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded cursor-pointer disabled:opacity-50">
        {loading ? 'Đang nhập…' : 'Nhập từ Excel'}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportFile(f)
          }}
        />
      </label>

      {/* Selector for product categories to include in template */}
      <details className="ml-2">
        <summary className="text-xs text-black cursor-pointer select-none">Chọn loại sản phẩm cho file mẫu</summary>
        <div className="mt-2 p-2 border rounded bg-white w-[520px]">
          <div className="flex items-center gap-2 mb-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-xs text-black"
              placeholder="Tìm loại sản phẩm theo tên..."
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 mb-2 text-xs text-black">
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setSelectedCategoryIds(categories.map(c => c.id))}
            >Chọn tất cả</button>
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setSelectedCategoryIds([])}
            >Bỏ chọn</button>
            <span className="text-black">Đã chọn: {selectedCategoryIds.length}</span>
          </div>
          <div className="max-h-72 overflow-auto border rounded">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2">
              {filteredCategories.map(c => {
                const checked = selectedCategoryIds.includes(c.id)
                return (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-black">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedCategoryIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])
                      }}
                    />
                    <span className="truncate text-black" title={c.name}>{c.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </details>

      {/* Selector for expense objects to include in template reference */}
      <details className="ml-2">
        <summary className="text-xs text-black cursor-pointer select-none">Chọn vật tư cho file mẫu</summary>
        <div className="mt-2 p-2 border rounded bg-white w-[520px]">
          <div className="flex items-center gap-2 mb-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-xs text-black"
              placeholder="Tìm vật tư theo tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1 text-xs text-black">
              <span>Slots:</span>
              <input
                type="number"
                min={0}
                step={1}
                className="w-16 border rounded px-1 py-0.5 text-xs text-right text-black"
                value={materialSlots}
                onChange={(e)=> setMaterialSlots(Math.max(0, parseInt(e.target.value || '0', 10)))}
                title="Số nhóm vật tư (4 cột/nhóm) trong sheet products"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2 text-xs text-black">
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setSelectedExpenseObjectIds(allExpenseObjects.map(o => o.id))}
            >Chọn tất cả</button>
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setSelectedExpenseObjectIds([])}
            >Bỏ chọn</button>
            <span className="text-black">Đã chọn: {selectedExpenseObjectIds.length}</span>
          </div>
          <div className="max-h-72 overflow-auto border rounded">
            {Object.entries(groupedExpenseObjects).sort((a,b)=>a[0].localeCompare(b[0],'vi')).map(([l1, l2Map]) => (
              <div key={l1} className="border-b last:border-0">
                <div className="flex items-center justify-between bg-gray-50 px-2 py-1 text-xs font-semibold text-black">
                  <span className="text-black">{l1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-1.5 py-0.5 border rounded"
                      onClick={() => {
                        const ids: string[] = []
                        Object.values(l2Map).forEach(list => list.forEach(o => ids.push(o.id)))
                        setSelectedExpenseObjectIds(prev => Array.from(new Set([...prev, ...ids])))
                      }}
                    >Chọn nhóm</button>
                    <button
                      type="button"
                      className="px-1.5 py-0.5 border rounded"
                      onClick={() => {
                        const ids: string[] = []
                        Object.values(l2Map).forEach(list => list.forEach(o => ids.push(o.id)))
                        setSelectedExpenseObjectIds(prev => prev.filter(id => !ids.includes(id)))
                      }}
                    >Bỏ nhóm</button>
                  </div>
                </div>
                {Object.entries(l2Map).sort((a,b)=>a[0].localeCompare(b[0],'vi')).map(([l2, list]) => (
                  <div key={l2} className="px-2 py-1">
                    <div className="text-[11px] text-black mb-1">{l2}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {list.map(o => {
                        const checked = selectedExpenseObjectIds.includes(o.id)
                        return (
                          <label key={o.id} className="flex items-center gap-2 text-xs text-black">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedExpenseObjectIds(prev => checked ? prev.filter(id => id !== o.id) : [...prev, o.id])
                              }}
                            />
                            <span className="truncate text-black" title={o.name}>{o.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}


