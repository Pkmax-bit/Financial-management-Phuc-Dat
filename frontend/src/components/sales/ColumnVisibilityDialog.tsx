'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface ColumnVisibilityDialogProps {
  isOpen: boolean
  onClose: () => void
  visibleColumns: Record<string, boolean>
  onToggleColumn: (column: string) => void
  onReset: () => void
}

const COLUMN_LABELS = {
  name: 'Tên sản phẩm',
  description: 'Mô tả',
  quantity: 'Số lượng',
  unit: 'Đơn vị',
  unit_price: 'Đơn giá',
  total_price: 'Thành tiền',
  area: 'Diện tích',
  volume: 'Thể tích',
  height: 'Chiều cao',
  length: 'Dài',
  depth: 'Sâu'
}

export default function ColumnVisibilityDialog({ 
  isOpen, 
  onClose, 
  visibleColumns, 
  onToggleColumn, 
  onReset 
}: ColumnVisibilityDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 w-80">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white/80">
          <h3 className="text-base font-medium text-gray-800">Hiện/Ẩn cột</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-3 bg-white/90">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(COLUMN_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{label}</span>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns[key]}
                    onChange={() => onToggleColumn(key)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${
                    visibleColumns[key] ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      visibleColumns[key] ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Mặc định
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Xong
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
