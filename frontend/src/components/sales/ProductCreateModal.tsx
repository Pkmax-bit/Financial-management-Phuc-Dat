'use client'

import React from 'react'
import ProductCreateForm from './ProductCreateForm'

export default function ProductCreateModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tạo sản phẩm</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-6">
            <ProductCreateForm onCreated={() => { onSuccess?.(); onClose(); }} />
          </div>
        </div>
      </div>
    </div>
  )
}


