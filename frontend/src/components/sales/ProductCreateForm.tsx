'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CircleHelp } from 'lucide-react'

type Category = {
  id: string
  name: string
}

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)
// Format decimal for inputs (non-locale, keeps '.' as decimal, trims trailing zeros)
const formatDecimal = (value: number, maxFractionDigits = 6): string => {
  if (!isFinite(value)) return ''
  const fixed = value.toFixed(maxFractionDigits)
  return fixed.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
}
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
  // Đối tượng chi phí (vật tư) - selector
  const [expenseObjects, setExpenseObjects] = useState<Array<{ id: string; name: string; level: number; parent_id?: string | null; l1?: string; l2?: string }>>([])
  const [componentRows, setComponentRows] = useState<Array<{ expense_object_id: string; expense_object_name?: string; unit: string; unit_price: number; quantity: number }>>([
    { expense_object_id: '', unit: '', unit_price: 0, quantity: 1 }
  ])

  // Tour state
  const PRODUCT_FORM_TOUR_STORAGE_KEY = 'product-form-tour-status-v1'
  const [isProductTourRunning, setIsProductTourRunning] = useState(false)
  const productTourRef = useRef<any>(null)
  const productShepherdRef = useRef<any>(null)
  const productTourAutoStartAttemptedRef = useRef(false)
  type ProductShepherdModule = typeof import('shepherd.js')
  type ProductShepherdType = ProductShepherdModule & { Tour: new (...args: any[]) => any }
  type ProductShepherdTour = InstanceType<ProductShepherdType['Tour']>

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

  // Tải đối tượng chi phí cấp 3
  useEffect(() => {
    const loadExpenseObjects = async () => {
      try {
        // Load tất cả level 1-3
        const { data: allObjs, error: e1 } = await supabase
          .from('expense_objects')
          .select('id, name, parent_id, level, is_active')
          .eq('is_active', true)
          .in('level', [1, 2, 3])
        if (e1) throw e1

        const byId: Record<string, any> = {}
        ;(allObjs || []).forEach((o: any) => { byId[o.id] = o })

        const withPaths = (allObjs || []).map((o: any) => {
          let l1: string | undefined
          let l2: string | undefined
          if (o.level === 1) {
            l1 = o.name
          } else if (o.level === 2) {
            const p1 = o.parent_id ? byId[o.parent_id] : null
            l1 = p1?.name
          } else if (o.level === 3) {
            const p2 = o.parent_id ? byId[o.parent_id] : null
            const p1 = p2?.parent_id ? byId[p2.parent_id] : null
            l1 = p1?.name
            l2 = p2?.name
          }
          return { id: o.id, name: o.name, level: o.level, parent_id: o.parent_id, l1, l2 }
        })

        setExpenseObjects(withPaths)
      } catch (_) {
        setExpenseObjects([])
      }
    }
    loadExpenseObjects()
  }, [])

  const onPriceChange = (val: string) => {
    const num = parseCurrency(val)
    setPrice(num)
    setPriceDisplay(num > 0 ? formatNumber(num) : val)
  }

  // Parse number for dimension fields (similar to price but allows decimals)
  const parseNumber = (s: string): number | null => {
    const normalized = s.replace(/,/g, '.')
    const clean = normalized.replace(/[^\d.]/g, '')
    return clean ? parseFloat(clean) : null
  }

  const onDimensionChange = (val: string, setter: (val: number | null) => void, displaySetter: (val: string) => void) => {
    const num = parseNumber(val)
    setter(num)
    // Keep user's raw input (no thousand separators) to avoid showing 2.800 for 2800
    displaySetter(val)
  }

  // Auto-calculate area/volume with inputs in mm
  // area (m²) = (length_mm/1000) × (height_mm/1000)
  // volume (m³) = (length_mm/1000) × (height_mm/1000) × (depth_mm/1000)
  useEffect(() => {
    if (length != null && height != null) {
      const a = (length / 1000) * (height / 1000)
      const rounded = Number(a.toFixed(6))
      setArea(rounded)
      setAreaDisplay(formatDecimal(rounded, 6))
    }
  }, [length, height])

  useEffect(() => {
    if (length != null && height != null && depth != null) {
      const v = (length / 1000) * (height / 1000) * (depth / 1000)
      const rounded = Number(v.toFixed(9))
      setVolume(rounded)
      setVolumeDisplay(formatDecimal(rounded, 9))
    }
  }, [length, height, depth])

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
          product_components: componentRows
            .filter(r => r.expense_object_id)
            .map(r => ({
              expense_object_id: r.expense_object_id,
              unit: r.unit || null,
              unit_price: r.unit_price || 0,
              quantity: r.quantity || 0
            })),
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
      setComponentRows([{ expense_object_id: '', unit: '', unit_price: 0, quantity: 1 }])
      
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

  const startProductTour = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (productTourRef.current) {
      productTourRef.current.cancel()
      productTourRef.current = null
    }

    if (!productShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ProductShepherdType })?.default ?? (module as unknown as ProductShepherdType)
        productShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = productShepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 20, delay = 100) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (document.querySelector(selector)) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return false
    }

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )

    await waitForElement('[data-tour-id="product-form-header"]')
    await waitForElement('[data-tour-id="product-form-basic-info"]')
    await waitForElement('[data-tour-id="product-form-dimensions"]')
    await waitForElement('[data-tour-id="product-form-components"]')
    await waitForElement('[data-tour-id="product-form-submit"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'product-form-intro',
      title: 'Hướng dẫn tạo sản phẩm',
      text: 'Form này giúp bạn tạo sản phẩm mới với đầy đủ thông tin: loại sản phẩm, tên, giá, kích thước và vật tư cấu thành.',
      attachTo: { element: '[data-tour-id="product-form-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Bắt đầu',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'product-form-basic-info',
      title: 'Thông tin cơ bản',
      text: 'Điền các thông tin cơ bản:\n• Loại sản phẩm (bắt buộc): Chọn loại sản phẩm từ danh sách\n• Tên sản phẩm (bắt buộc): Nhập tên sản phẩm\n• Đơn giá: Nhập giá bán của sản phẩm\n• Đơn vị: Đơn vị tính (cái, bộ, m², ...)\n• Mô tả: Mô tả chi tiết về sản phẩm\n\nLưu ý: Thành tiền = Đơn giá × Diện tích (tự động tính khi nhập kích thước)',
      attachTo: { element: '[data-tour-id="product-form-basic-info"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'product-form-dimensions',
      title: 'Kích thước sản phẩm',
      text: 'Nhập kích thước sản phẩm (tùy chọn):\n• Diện tích (m²): Tự động tính từ Chiều cao × Dài\n• Thể tích (m³): Tự động tính từ Chiều cao × Dài × Sâu\n• Chiều cao (mm): Nhập chiều cao\n• Dài (mm): Nhập chiều dài\n• Sâu (mm): Nhập chiều sâu\n\nLưu ý: Hệ thống tự động tính diện tích và thể tích khi bạn nhập các kích thước.',
      attachTo: { element: '[data-tour-id="product-form-dimensions"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'product-form-components',
      title: 'Vật tư (đối tượng chi phí)',
      text: 'Thêm vật tư cấu thành sản phẩm (tùy chọn):\n• Chọn đối tượng chi phí cấp 3 từ danh sách\n• Nhập đơn vị, đơn giá và số lượng\n• Nhấn "Thêm dòng" để thêm vật tư khác\n• Nhấn "Xóa" để xóa vật tư không cần thiết\n\nLưu ý: Thành tiền = Đơn giá × Số lượng (tự động tính)',
      attachTo: { element: '[data-tour-id="product-form-components"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'product-form-submit',
      title: 'Tạo sản phẩm',
      text: 'Sau khi điền đầy đủ thông tin (ít nhất Loại sản phẩm và Tên sản phẩm), nhấn "Tạo sản phẩm" để lưu. Sản phẩm sẽ được thêm vào danh sách và có thể sử dụng khi tạo báo giá hoặc hóa đơn.',
      attachTo: { element: '[data-tour-id="product-form-submit"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Hoàn tất',
          action: () => tour.complete()
        }
      ]
    })

    tour.on('complete', () => {
      setIsProductTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(PRODUCT_FORM_TOUR_STORAGE_KEY, 'completed')
      }
      productTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsProductTourRunning(false)
      productTourRef.current = null
    })

    productTourRef.current = tour
    setIsProductTourRunning(true)
    tour.start()
  }, [])

  // Auto-start tour when form is first rendered
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (productTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(PRODUCT_FORM_TOUR_STORAGE_KEY)
    productTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startProductTour()
      }, 800)
    }
  }, [startProductTour])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      productTourRef.current?.cancel()
      productTourRef.current?.destroy?.()
      productTourRef.current = null
    }
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3" data-tour-id="product-form-header">
        <h3 className="text-lg font-semibold text-gray-900">Tạo sản phẩm</h3>
        <button
          onClick={() => startProductTour()}
          disabled={isProductTourRunning || submitting}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isProductTourRunning || submitting
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'text-white bg-blue-600 hover:bg-blue-700'
          }`}
          title="Bắt đầu hướng dẫn tạo sản phẩm"
        >
          <CircleHelp className="h-4 w-4" />
          <span>Hướng dẫn</span>
        </button>
      </div>
      
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
        <div className="md:col-span-12" data-tour-id="product-form-basic-info">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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
              <label className="block text-sm font-medium text-gray-900 mb-1">Thành tiền (ĐG × DT)</label>
              <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-right text-gray-900 bg-gray-50">
                {area != null ? formatNumber((Number(price) || 0) * (Number(area) || 0)) : '-'}
              </div>
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
          </div>
        </div>
        
        {/* Dimension fields */}
        <div className="md:col-span-12" data-tour-id="product-form-dimensions">
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
          <label className="block text-sm font-medium text-gray-900 mb-1">Chiều cao (mm)</label>
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
          <label className="block text-sm font-medium text-gray-900 mb-1">Dài (mm)</label>
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
          <label className="block text-sm font-medium text-gray-900 mb-1">Sâu (mm)</label>
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
        {/* Chọn đối tượng chi phí (Vật tư) */}
        <div className="md:col-span-12" data-tour-id="product-form-components">
          <h4 className="text-md font-medium text-gray-900 mb-3 mt-4">Vật tư (đối tượng chi phí cấp 3)</h4>
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-gray-900 text-left">Đối tượng chi phí</th>
                  <th className="px-3 py-2 text-gray-900 text-left">Đơn vị</th>
                  <th className="px-3 py-2 text-gray-900 text-right">Đơn giá</th>
                  <th className="px-3 py-2 text-gray-900 text-right">Số lượng</th>
                  <th className="px-3 py-2 text-gray-900 text-right">Thành tiền</th>
                  <th className="px-3 py-2 text-gray-900 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {componentRows.map((row, idx) => {
                  const total = (row.unit_price || 0) * (row.quantity || 0)
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2 min-w-[320px]">
                        <select
                          value={row.expense_object_id}
                          onChange={(e) => {
                            const id = e.target.value
                            const name = expenseObjects.find(o => o.id === id)?.name
                            const next = [...componentRows]
                            next[idx] = { ...row, expense_object_id: id, expense_object_name: name }
                            setComponentRows(next)
                          }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                        >
                          <option value="">Chọn đối tượng</option>
                          {Object.entries(expenseObjects.reduce<Record<string, { id: string; name: string; level: number; l2?: string }[]>>((acc, cur) => {
                            const key = cur.l1 || 'Khác'
                            if (!acc[key]) acc[key] = []
                            acc[key].push({ id: cur.id, name: cur.name, level: cur.level, l2: cur.l2 })
                            return acc
                          }, {})).sort(([a],[b]) => a.localeCompare(b, 'vi')).map(([group, list]) => (
                            <optgroup key={group} label={group}>
                              {list
                                .sort((a,b)=>{
                                  if (a.level!==b.level) return a.level-b.level
                                  return (a.l2||'').localeCompare(b.l2||'', 'vi') || a.name.localeCompare(b.name, 'vi')
                                })
                                .map(o => (
                                  <option key={o.id} value={o.id}>
                                    {o.level===1 ? `${group}` : o.level===2 ? `${group} / ${o.name}` : `${group}${o.l2?` / ${o.l2}`:''} / ${o.name}`}
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 w-40">
                        <input
                          value={row.unit}
                          onChange={(e)=>{
                            const next=[...componentRows]; next[idx]={...row, unit:e.target.value}; setComponentRows(next)
                          }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                          placeholder="m, m2, cái..."
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-40">
                        <input
                          type="number"
                          value={row.unit_price}
                          onChange={(e)=>{
                            const next=[...componentRows]; next[idx]={...row, unit_price: parseFloat(e.target.value)||0}; setComponentRows(next)
                          }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black"
                          step="1000"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-40">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e)=>{
                            const next=[...componentRows]; next[idx]={...row, quantity: parseFloat(e.target.value)||0}; setComponentRows(next)
                          }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-right text-black"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(total)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={()=>setComponentRows(prev=>prev.filter((_,i)=>i!==idx))} className="text-red-600 text-xs hover:underline">Xóa</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <button type="button" onClick={()=>setComponentRows(prev=>[...prev,{ expense_object_id:'', unit:'', unit_price:0, quantity:1 }])} className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded">Thêm dòng</button>
          </div>
        </div>
        
        <div className="md:col-span-12" data-tour-id="product-form-submit">
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


