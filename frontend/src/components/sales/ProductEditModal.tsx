'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

interface ProductEditData {
  name: string
  price: number
  unit: string
  description?: string
  area?: number
  volume?: number
  height?: number
  length?: number
  depth?: number
  category_name?: string
}

interface ProductEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProductEditData) => void
  product: ProductEditData | null
}

export default function ProductEditModal({ isOpen, onClose, onSave, product }: ProductEditModalProps) {
  const [formData, setFormData] = useState<ProductEditData>({
    name: '',
    price: 0,
    unit: '',
    description: '',
    area: undefined,
    volume: undefined,
    height: undefined,
    length: undefined,
    depth: undefined,
    category_name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || 0,
        unit: product.unit || '',
        description: product.description || '',
        area: product.area || undefined,
        volume: product.volume || undefined,
        height: product.height || undefined,
        length: product.length || undefined,
        depth: product.depth || undefined,
        category_name: product.category_name || ''
      })
    }
  }, [product])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleInputChange = (field: keyof ProductEditData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleNumberChange = (field: keyof ProductEditData, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    handleInputChange(field, numValue || 0)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Giá sản phẩm phải lớn hơn 0'
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Đơn vị không được để trống'
    }

    if (formData.area !== undefined && formData.area < 0) {
      newErrors.area = 'Diện tích không được âm'
    }

    if (formData.volume !== undefined && formData.volume < 0) {
      newErrors.volume = 'Thể tích không được âm'
    }

    if (formData.height !== undefined && formData.height < 0) {
      newErrors.height = 'Chiều cao không được âm'
    }

    if (formData.length !== undefined && formData.length < 0) {
      newErrors.length = 'Chiều dài không được âm'
    }

    if (formData.depth !== undefined && formData.depth < 0) {
      newErrors.depth = 'Chiều sâu không được âm'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        ref={sidebarRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-gray-200 pointer-events-auto overflow-y-auto transform transition-transform duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa sản phẩm</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập tên sản phẩm"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">
                Đơn vị *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="cái, kg, m, lít..."
              />
              {errors.unit && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.unit}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Giá bán *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleNumberChange('price', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.price}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Hạng mục
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => handleInputChange('category_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Nhập tên hạng mục"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Nhập mô tả sản phẩm"
              rows={3}
            />
          </div>

          {/* Dimensions */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Kích thước (tùy chọn)</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Diện tích (m²)
                </label>
                <input
                  type="number"
                  value={formData.area || ''}
                  onChange={(e) => handleNumberChange('area', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.area ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.area && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.area}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Thể tích (m³)
                </label>
                <input
                  type="number"
                  value={formData.volume || ''}
                  onChange={(e) => handleNumberChange('volume', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.volume ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.volume && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.volume}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chiều cao (m)
                </label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleNumberChange('height', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.height && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.height}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chiều dài (m)
                </label>
                <input
                  type="number"
                  value={formData.length || ''}
                  onChange={(e) => handleNumberChange('length', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.length ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.length && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.length}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chiều sâu (m)
                </label>
                <input
                  type="number"
                  value={formData.depth || ''}
                  onChange={(e) => handleNumberChange('depth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.depth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.depth && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.depth}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}
