'use client'

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { supabase } from '@/lib/supabase'
import ProductExcelImport from './ProductExcelImport'
import FileUpload from '@/components/common/FileUpload'

export interface ProductCatalogRef {
  refresh: () => Promise<void>
}

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
  image_url: string | null
  image_urls?: string[] | null
  actual_material_cost?: number | null
  actual_material_components?: Array<{
    expense_object_id: string
    unit?: string | null
    unit_price?: number
    quantity?: number
  }> | null
}

type Category = { id: string; name: string }

type ExpenseObjectNode = {
  id: string
  name: string
  level: number
  parent_id?: string | null
  children?: ExpenseObjectNode[]
  fullPath?: string
}

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)
const toDecimalString = (value: number | null | undefined, maxFractionDigits = 6): string => {
  if (value == null || !isFinite(Number(value))) return ''
  const fixed = Number(value).toFixed(maxFractionDigits)
  return fixed.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
}

const ProductCatalog = forwardRef<ProductCatalogRef>((props, ref) => {
  const [items, setItems] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
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
  const [editComponents, setEditComponents] = useState<Array<{ expense_object_id: string; unit?: string | null; unit_price?: number; quantity?: number }>>([])
  const [editActualComponents, setEditActualComponents] = useState<Array<{ expense_object_id: string; unit?: string | null; unit_price?: number; quantity?: number }>>([])
  const [editImages, setEditImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [expenseObjectMap, setExpenseObjectMap] = useState<Record<string, string>>({})
  const [allExpenseObjects, setAllExpenseObjects] = useState<Array<{ id: string; name: string; level: number; parent_id?: string | null; l1?: string; l2?: string }>>([])
  const [expenseTree, setExpenseTree] = useState<ExpenseObjectNode[]>([])
  const [expenseObjectsMap, setExpenseObjectsMap] = useState<Record<string, any>>({})
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const getFullPath = (nodeId: string, map: Record<string, any>): string => {
    const node = map[nodeId]
    if (!node) return ''
    if (!node.parent_id) return node.name
    return `${getFullPath(node.parent_id, map)} > ${node.name}`
  }

  const buildTree = (items: any[], map: Record<string, any>): ExpenseObjectNode[] => {
    const tree: ExpenseObjectNode[] = []
    const itemMap: Record<string, ExpenseObjectNode> = {}

    items.forEach(item => {
      itemMap[item.id] = {
        id: item.id,
        name: item.name,
        level: item.level,
        parent_id: item.parent_id,
        children: [],
        fullPath: getFullPath(item.id, map)
      }
    })

    items.forEach(item => {
      const node = itemMap[item.id]
      if (item.parent_id && itemMap[item.parent_id]) {
        itemMap[item.parent_id].children!.push(node)
      } else {
        tree.push(node)
      }
    })

    const sortTree = (nodes: ExpenseObjectNode[]): ExpenseObjectNode[] =>
      nodes
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        .map(node => ({
          ...node,
          children: node.children && node.children.length > 0 ? sortTree(node.children) : undefined
        }))

    return sortTree(tree)
  }

  const renderTreeOptions = (nodes: ExpenseObjectNode[], depth: number = 0): JSX.Element[] => {
    const options: JSX.Element[] = []
    nodes.forEach(node => {
      const indent = '  '.repeat(depth)
      options.push(
        <option key={node.id} value={node.id}>
          {indent}{node.fullPath || node.name}
        </option>
      )
      if (node.children && node.children.length > 0) {
        options.push(...renderTreeOptions(node.children, depth + 1))
      }
    })
    return options
  }

  // ===== TÍNH TỔNG THEO CẤU TRÚC CÂY (GIỐNG VIEW TẠO) =====
  const calculateTreeTotals = (rows: Array<{ expense_object_id?: string; unit_price?: number; quantity?: number }>) => {
    const directTotals: Record<string, number> = {}
    const allTotals: Record<string, number> = {}

    rows.forEach(row => {
      if (row.expense_object_id) {
        const total = Number(row.unit_price || 0) * Number(row.quantity || 0)
        directTotals[row.expense_object_id] = (directTotals[row.expense_object_id] || 0) + total
        allTotals[row.expense_object_id] = directTotals[row.expense_object_id]
      }
    })

    const nodeIds = Object.keys(directTotals)
    const sortedNodes = nodeIds
      .map(id => ({ id, level: expenseObjectsMap[id]?.level || 0 }))
      .sort((a, b) => b.level - a.level)

    sortedNodes.forEach(({ id }) => {
      let currentId: string | null = id
      while (currentId) {
        const obj = expenseObjectsMap[currentId]
        if (!obj || !obj.parent_id) break
        const parentId = obj.parent_id
        allTotals[parentId] = (allTotals[parentId] || 0) + allTotals[currentId]
        currentId = parentId
      }
    })

    return { directTotals, allTotals }
  }

  const buildTreeDisplayList = (
    tree: ExpenseObjectNode[],
    totals: Record<string, number>,
    directTotals: Record<string, number>,
    result: Array<{ id: string; name: string; level: number; total: number; isDirect: boolean }> = []
  ): Array<{ id: string; name: string; level: number; total: number; isDirect: boolean }> => {
    tree.forEach(node => {
      const total = totals[node.id]
      const hasDirect = !!directTotals[node.id]

      // Node có tổng từ con hoặc trực tiếp
      if (total && total > 0) {
        result.push({
          id: node.id,
          name: node.name,
          level: node.level,
          total,
          isDirect: hasDirect
        })
      }

      if (node.children && node.children.length > 0) {
        buildTreeDisplayList(node.children, totals, directTotals, result)
      }
    })
    return result
  }


  const resolveImages = (product: ProductItem | any): string[] => {
    const list: string[] = []
    if (Array.isArray(product?.image_urls)) {
      list.push(...product.image_urls.filter((url: any) => typeof url === 'string' && url.length > 0))
    }
    if (product?.image_url && !list.includes(product.image_url)) {
      list.unshift(product.image_url)
    }
    return list
  }

  const openPreview = (product: ProductItem) => {
    const images = resolveImages(product)
    if (images.length === 0) return
    setPreviewImages(images)
    setPreviewIndex(0)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewImages([])
    setPreviewIndex(0)
  }

  const goPrevImage = () => {
    setPreviewIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)
  }

  const goNextImage = () => {
    setPreviewIndex((prev) => (prev + 1) % previewImages.length)
  }

  const closeEditModal = () => {
    setEditing(null)
    setEditImages([])
  }

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [{ data: prodData, error: prodErr }, { data: catData, error: catErr }] = await Promise.all([
        supabase.from('products').select('id, name, price, unit, description, category_id, created_at, is_active, area, volume, height, length, depth, image_url, image_urls, product_components, actual_material_cost, actual_material_components').order('created_at', { ascending: false }),
        supabase.from('product_categories').select('id, name')
      ])
      if (prodErr) throw prodErr
      if (catErr) throw catErr
      const catMap: Record<string, string> = {}
        ; (catData as Category[] | null)?.forEach(c => { catMap[c.id] = c.name })
      setCategories(catMap)
      const prods = (prodData || []) as any[]
      setItems(prods as unknown as ProductItem[])

      // Collapse all groups by default
      const allGroups = Array.from(new Set(prods.map((p: any) => {
        const catName = p.category_id ? (catMap[p.category_id] || 'Khác') : 'Khác'
        return catName
      })))
      setCollapsedCats(new Set(allGroups))

      // Build expense object id set
      const idSet = new Set<string>()
      prods.forEach(p => {
        const comps = Array.isArray(p.product_components) ? p.product_components : []
        comps.forEach((c: any) => { if (c.expense_object_id) idSet.add(String(c.expense_object_id)) })
      })

      if (idSet.size > 0) {
        const idList = Array.from(idSet)
        const { data: names } = await supabase
          .from('expense_objects')
          .select('id, name')
          .in('id', idList)
        if (names) {
          const map: Record<string, string> = {}
          names.forEach((n: any) => { map[n.id] = n.name })
          setExpenseObjectMap(map)
        }
      } else {
        setExpenseObjectMap({})
      }

      // Load all expense objects for editor
      const { data: allObjs } = await supabase
        .from('expense_objects')
        .select('id, name, parent_id, level, is_active')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('name', { ascending: true })
      if (allObjs) {
        const byId: Record<string, any> = {}
        allObjs.forEach((o: any) => { byId[o.id] = o })

        const tree = buildTree(allObjs || [], byId)
        setExpenseTree(tree)
        setExpenseObjectsMap(byId)

        const withPaths = (allObjs || []).map((o: any) => {
          let l1: string | undefined
          let l2: string | undefined
          if (o.level === 1) l1 = o.name
          else if (o.level === 2) { const p1 = byId[o.parent_id]; l1 = p1?.name }
          else if (o.level === 3) { const p2 = byId[o.parent_id]; const p1 = p2 ? byId[p2.parent_id] : null; l1 = p1?.name; l2 = p2?.name }
          return { id: o.id, name: o.name, level: o.level, parent_id: o.parent_id, l1, l2 }
        })
        setAllExpenseObjects(withPaths)
      }
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  // Expose refresh function via ref
  useImperativeHandle(ref, () => ({
    refresh: load
  }))

  useEffect(() => { load() }, [])

  const openEdit = (p: ProductItem) => {
    setEditing(p)
    setEditName(p.name)
    setEditCat(p.category_id || '')
    setEditPrice(formatNumber(Number(p.price) || 0))
    setEditUnit(p.unit)
    setEditDesc(p.description || '')
    // Prefer recomputing area/volume from mm dimensions when available to avoid stale/wrong DB values
    const h = p.height != null ? Number(p.height) : null
    const l = p.length != null ? Number(p.length) : null
    const d = p.depth != null ? Number(p.depth) : null
    const computedArea = (h != null && l != null) ? Number(((l / 1000) * (h / 1000)).toFixed(2)) : null
    const computedVolume = (h != null && l != null && d != null) ? Number(((l / 1000) * (h / 1000) * (d / 1000)).toFixed(9)) : null
    setEditArea(toDecimalString(computedArea ?? p.area, 2))
    setEditVolume(toDecimalString(computedVolume ?? p.volume, 9))
    // Load mm fields as plain digits (no thousand separators) to avoid mis-parsing like 2.800
    setEditHeight(p.height != null ? String(Number(p.height)) : '')
    setEditLength(p.length != null ? String(Number(p.length)) : '')
    setEditDepth(p.depth != null ? String(Number(p.depth)) : '')
    const comps = Array.isArray((p as any).product_components) ? (p as any).product_components : []
    setEditComponents(comps.map((c: any) => ({
      expense_object_id: String(c.expense_object_id || ''),
      unit: c.unit || '',
      unit_price: Number(c.unit_price || 0),
      quantity: Number(c.quantity || 0)
    })))

    const actualComps = Array.isArray((p as any).actual_material_components) ? (p as any).actual_material_components : []
    setEditActualComponents(actualComps.map((c: any) => ({
      expense_object_id: String(c.expense_object_id || ''),
      unit: c.unit || '',
      unit_price: Number(c.unit_price || 0),
      quantity: Number(c.quantity || 0)
    })))
    setEditImages(resolveImages(p))
  }

  const parseCurrency = (s: string): number => {
    const clean = s.replace(/[^\d]/g, '')
    return clean ? parseInt(clean, 10) : 0
  }

  const parseNumber = (s: string): number | null => {
    const clean = s.replace(/[^\d.]/g, '')
    return clean ? parseFloat(clean) : null
  }

  // Recompute area (m²) in realtime from mm inputs in edit modal
  useEffect(() => {
    if (!editing) return
    const l = parseNumber(editLength)
    const h = parseNumber(editHeight)
    if (l != null && h != null) {
      const a = Number(((l / 1000) * (h / 1000)).toFixed(2))
      setEditArea(toDecimalString(a, 2))
    }
  }, [editLength, editHeight, editing])

  // Recompute volume (m³) in realtime from mm inputs in edit modal
  useEffect(() => {
    if (!editing) return
    const l = parseNumber(editLength)
    const h = parseNumber(editHeight)
    const d = parseNumber(editDepth)
    if (l != null && h != null && d != null) {
      const v = Number(((l / 1000) * (h / 1000) * (d / 1000)).toFixed(9))
      setEditVolume(toDecimalString(v, 9))
    }
  }, [editLength, editHeight, editDepth, editing])

  const saveEdit = async () => {
    if (!editing) return
    try {
      setSaving(true)
      // Parse numbers from inputs
      const priceNum = parseCurrency(editPrice)
      const areaNum = parseNumber(editArea)
      const volumeNum = parseNumber(editVolume)
      const heightNum = parseNumber(editHeight)
      const lengthNum = parseNumber(editLength)
      const depthNum = parseNumber(editDepth)
      // Derive area/volume from mm dimensions if present to ensure correctness
      const derivedArea = (lengthNum != null && heightNum != null) ? Number(((lengthNum / 1000) * (heightNum / 1000)).toFixed(2)) : areaNum
      const derivedVolume = (lengthNum != null && heightNum != null && depthNum != null) ? Number(((lengthNum / 1000) * (heightNum / 1000) * (depthNum / 1000)).toFixed(9)) : volumeNum
      const totalActualCost = editActualComponents
        .filter(r => r.expense_object_id)
        .reduce((sum, r) => sum + Number(r.unit_price || 0) * Number(r.quantity || 0), 0)

      const upd = {
        name: editName.trim() || editing.name,
        category_id: editCat || null,
        price: priceNum,
        unit: editUnit.trim() || 'cái',
        description: editDesc.trim() || null,
        image_url: editImages[0] || null,
        image_urls: editImages,
        area: derivedArea,
        volume: derivedVolume,
        height: heightNum,
        length: lengthNum,
        depth: depthNum,
        product_components: editComponents.filter(r => r.expense_object_id).map(r => ({
          expense_object_id: r.expense_object_id,
          unit: r.unit || null,
          unit_price: r.unit_price || 0,
          quantity: r.quantity || 0
        })),
        actual_material_components: editActualComponents.filter(r => r.expense_object_id).map(r => ({
          expense_object_id: r.expense_object_id,
          unit: r.unit || null,
          unit_price: r.unit_price || 0,
          quantity: r.quantity || 0
        })),
        actual_material_cost: totalActualCost
      }
      const { error: updErr } = await supabase
        .from('products')
        .update(upd)
        .eq('id', editing.id)
      if (updErr) throw updErr
      setEditing(null)
      setEditImages([])
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
        <div className="flex items-center gap-3">
          <ProductExcelImport onImportSuccess={load} />
          <div className="text-xs text-gray-600">{items.length} mục</div>
        </div>
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
          ).sort(([a], [b]) => a.localeCompare(b, 'vi')).map(([catName, list]) => {
            const collapsed = collapsedCats.has(catName)
            return (
              <div key={catName} className="border-b border-gray-200">
                <button
                  type="button"
                  className="w-full bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-100"
                  onClick={() => {
                    setCollapsedCats(prev => {
                      const next = new Set(prev)
                      if (next.has(catName)) next.delete(catName); else next.add(catName)
                      return next
                    })
                  }}
                >
                  <span>{catName}</span>
                  <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
                </button>
                {!collapsed && (
                  <div className="px-2 pb-3">
                    <table className="min-w-full text-sm text-gray-900">
                      <thead className="sticky top-0 bg-white shadow-sm">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold w-20">Ảnh</th>
                          <th className="px-3 py-2 text-left font-semibold w-56">Tên</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Đơn giá</th>
                          <th className="px-3 py-2 text-right font-semibold w-28">Thành tiền</th>
                          <th className="px-3 py-2 text-left font-semibold w-20">Đơn vị</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Diện tích</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Thể tích</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Cao (mm)</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Dài (mm)</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Sâu (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold w-56">Vật tư</th>
                          <th className="px-3 py-2 text-left font-semibold w-24">Trạng thái</th>
                          <th className="px-3 py-2 text-right font-semibold w-24">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(p => {
                          const images = resolveImages(p)
                          const coverImage = images[0]
                          // Tính diện tích m²: ưu tiên tính từ height × length (mm) để đảm bảo đúng đơn vị m²
                          // Công thức: (length_mm / 1000) × (height_mm / 1000) = diện tích m²
                          let areaInM2: number | null = null
                          if (p.height != null && p.length != null) {
                            // Tính từ mm sang m²: (length_mm / 1000) × (height_mm / 1000)
                            areaInM2 = Number(((Number(p.length) / 1000) * (Number(p.height) / 1000)).toFixed(2))
                          } else if (p.area != null) {
                            // Nếu không có height/length, dùng p.area (đã là m²) - làm tròn đến 2 chữ số thập phân
                            areaInM2 = Math.round(Number(p.area) * 100) / 100
                          }
                          const totalPrice = areaInM2 != null && areaInM2 > 0
                            ? (Number(p.price) || 0) * areaInM2
                            : null
                          return (
                            <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2">
                                {coverImage ? (
                                  <button
                                    type="button"
                                    onClick={() => openPreview(p)}
                                    className="focus:outline-none"
                                    title="Xem gallery"
                                  >
                                    <img
                                      src={coverImage}
                                      alt={p.name}
                                      className="h-12 w-12 object-cover rounded border border-gray-200 hover:ring-2 hover:ring-blue-400"
                                    />
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500">Không có ảnh</span>
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(Number(p.price) || 0)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                {totalPrice != null ? formatNumber(totalPrice) : '-'}
                              </td>
                              <td className="px-3 py-2">{p.unit}</td>
                              <td className="px-3 py-2 text-right">{p.area ? `${formatNumber(p.area)} m²` : '-'}</td>
                              <td className="px-3 py-2 text-right">{p.volume ? `${formatNumber(p.volume)} m³` : '-'}</td>
                              <td className="px-3 py-2 text-right">{p.height ? `${formatNumber(p.height)} mm` : '-'}</td>
                              <td className="px-3 py-2 text-right">{p.length ? `${formatNumber(p.length)} mm` : '-'}</td>
                              <td className="px-3 py-2 text-right">{p.depth ? `${formatNumber(p.depth)} mm` : '-'}</td>
                              <td className="px-3 py-2">
                                <div className="text-xs text-gray-700 space-y-1">
                                  {Array.isArray((p as any).actual_material_components) && (p as any).actual_material_components.length > 0 ? (
                                    <>
                                      {((p as any).actual_material_components as any[]).slice(0, 3).map((c, idx) => (
                                        <div key={idx} className="truncate">
                                          <span className="text-gray-900">
                                            {expenseObjectMap[String(c.expense_object_id)] || String(c.expense_object_id)}
                                          </span>
                                          <span className="mx-1 text-gray-400">·</span>
                                          <span>{Number(c.quantity || 0)}</span>
                                          {c.unit ? <span className="ml-1">{c.unit}</span> : null}
                                          <span className="ml-1">× {formatNumber(Number(c.unit_price || 0))}</span>
                                        </div>
                                      ))}
                                      {((p as any).actual_material_components as any[]).length > 3 && (
                                        <div className="text-gray-500">
                                          +{((p as any).actual_material_components as any[]).length - 3} mục khác
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
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
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30" onClick={closeEditModal} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Sửa sản phẩm</h3>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
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
                      {Object.entries(categories).sort((a, b) => a[1].localeCompare(b[1], 'vi')).map(([id, name]) => (
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

                {/* Hình ảnh */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Hình ảnh sản phẩm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <FileUpload
                        endpoint="/api/uploads/images/products"
                        label="Thêm hình (có thể chọn nhiều lần)"
                        accept="image/*"
                        showPreview={false}
                        multiple={true}
                        onSuccess={(result) => {
                          setEditImages((prev) => [...prev, result.url])
                        }}
                        onError={(err) => console.error('Upload edit image error:', err)}
                      />
                    </div>
                    <div className="md:col-span-7">
                      {editImages.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-3 flex flex-wrap gap-3">
                          {editImages.map((url, idx) => (
                            <div key={idx} className="relative">
                              <img src={url} alt={`Ảnh ${idx + 1}`} className="h-20 w-20 object-cover rounded border border-gray-200" />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] px-1"
                              >
                                x
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1 rounded-tr">
                                  Cover
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded p-3">
                          Chưa có hình nào
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thành tiền (Đơn giá × Diện tích) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Thành tiền (ĐG × DT)</label>
                    <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-right text-gray-900 bg-gray-50">
                      {(() => {
                        const priceNum = parseCurrency(editPrice)
                        const areaNum = (() => { const s = editArea; const normalized = s.replace(/,/g, '.'); const clean = normalized.replace(/[^\d.]/g, ''); return clean ? parseFloat(clean) : 0 })()
                        return (areaNum || 0) > 0 ? formatNumber(priceNum * areaNum) : '-'
                      })()}
                    </div>
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
                      <label className="block text-sm font-medium text-gray-900 mb-1">Chiều cao (mm)</label>
                      <input
                        type="text"
                        value={editHeight}
                        onChange={(e) => setEditHeight(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Dài (mm)</label>
                      <input
                        type="text"
                        value={editLength}
                        onChange={(e) => setEditLength(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Sâu (mm)</label>
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

                {/* Chi phí vật tư */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Chi phí vật tư</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-gray-900 text-left">Đối tượng</th>
                          <th className="px-3 py-2 text-gray-900 text-left">Đơn vị</th>
                          <th className="px-3 py-2 text-gray-900 text-right">Đơn giá</th>
                          <th className="px-3 py-2 text-gray-900 text-right">Đơn vị</th>
                          <th className="px-3 py-2 text-gray-900 text-right">Thành tiền</th>
                          <th className="px-3 py-2 text-gray-900 text-right">&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editActualComponents.map((row, idx) => {
                          const total = Number(row.unit_price || 0) * Number(row.quantity || 0)
                          return (
                            <tr key={idx} className="border-t">
                              <td className="px-3 py-2 min-w-[320px]">
                                <select
                                  value={row.expense_object_id}
                                  onChange={(e) => {
                                    const id = e.target.value
                                    const next = [...editActualComponents]; next[idx] = { ...row, expense_object_id: id }; setEditActualComponents(next)
                                  }}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                                >
                                  <option value="">Chọn đối tượng</option>
                                  {renderTreeOptions(expenseTree)}
                                </select>
                              </td>
                              <td className="px-3 py-2 w-40">
                                <input value={row.unit || ''} onChange={(e) => { const next = [...editActualComponents]; next[idx] = { ...row, unit: e.target.value }; setEditActualComponents(next) }} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" placeholder="m, m2, cái..." />
                              </td>
                              <td className="px-3 py-2 text-right w-40">
                                <input type="number" value={Number(row.unit_price || 0)} onChange={(e) => { const next = [...editActualComponents]; next[idx] = { ...row, unit_price: parseFloat(e.target.value) || 0 }; setEditActualComponents(next) }} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black" step="1000" min="0" />
                              </td>
                              <td className="px-3 py-2 text-right w-40">
                                <input type="number" value={Number(row.quantity || 0)} onChange={(e) => { const next = [...editActualComponents]; next[idx] = { ...row, quantity: parseFloat(e.target.value) || 0 }; setEditActualComponents(next) }} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black" step="1" min="0" />
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatNumber(total)}</td>
                              <td className="px-3 py-2 text-gray-900 text-right"><button onClick={() => setEditActualComponents(prev => prev.filter((_, i) => i !== idx))} className="text-red-600 text-xs hover:underline">Xóa</button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={() => setEditActualComponents(prev => [...prev, { expense_object_id: '', unit: '', unit_price: 0, quantity: 1 }])} className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded">Thêm dòng</button>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Tổng chi phí vật tư: </span>
                      <span className="font-semibold text-blue-600">
                        {formatNumber(
                          editActualComponents
                            .filter(r => r.expense_object_id)
                            .reduce((sum, r) => sum + Number(r.unit_price || 0) * Number(r.quantity || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Tổng chi phí theo cấu trúc cây (thực tế) */}
                  {(() => {
                    const { directTotals, allTotals } = calculateTreeTotals(editActualComponents)
                    const displayList = buildTreeDisplayList(expenseTree, allTotals, directTotals)

                    if (displayList.length === 0) return null

                    return (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Tổng chi phí theo cấu trúc cây:</h5>
                        <div className="space-y-1 text-xs">
                          {displayList.map(item => {
                            const amountClass = item.isDirect ? 'text-blue-700' : 'text-blue-500'
                            return (
                              <div
                                key={item.id}
                                className="flex justify-between items-center"
                                style={{ paddingLeft: `${item.level * 16}px` }}
                              >
                                <span className="text-gray-700">
                                  {item.level > 0 && '└─ '}
                                  <span className={`font-medium ${item.isDirect ? 'text-blue-800' : ''}`}>
                                    {item.name}
                                  </span>
                                  {!item.isDirect && (
                                    <span className="text-gray-500 ml-1 text-[10px]">(tổng từ con)</span>
                                  )}
                                </span>
                                <span className={`font-semibold ${amountClass}`}>
                                  {formatNumber(item.total)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
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

      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/70" onClick={closePreview} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 max-w-3xl w-full p-4">
              <button
                onClick={closePreview}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
              {previewImages.length > 0 && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={previewImages[previewIndex]}
                      alt={`Preview ${previewIndex + 1}`}
                      className="max-h-[60vh] object-contain rounded"
                    />
                    {previewImages.length > 1 && (
                      <>
                        <button
                          onClick={goPrevImage}
                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 px-2 py-1 rounded-full"
                        >
                          ‹
                        </button>
                        <button
                          onClick={goNextImage}
                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 px-2 py-1 rounded-full"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  {previewImages.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto">
                      {previewImages.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewIndex(idx)}
                          className={`border ${idx === previewIndex ? 'border-blue-500' : 'border-transparent'}`}
                        >
                          <img src={url} alt={`Thumb ${idx + 1}`} className="h-16 w-16 object-cover rounded" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ProductCatalog.displayName = 'ProductCatalog'

export default ProductCatalog


