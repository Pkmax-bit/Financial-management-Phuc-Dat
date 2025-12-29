'use client'

import { useState } from 'react'
import CustomProductSelectionModal from '../../../components/sales/CustomProductSelectionModal'

export default function TestModalPage() {
  const [showModal, setShowModal] = useState(false)

  const handleProductAdd = (product: any) => {
    console.log('Product added:', product)
    alert(`Product added: ${product.generatedName}`)
    setShowModal(false)
  }

  console.log('TestModalPage render, showModal:', showModal)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Custom Product Selection Modal
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Matrix Selection Test</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to test the new matrix-style attribute selection modal.
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Chọn cấu trúc sản phẩm tùy chọn
          </button>
        </div>

        {showModal && (
          <CustomProductSelectionModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onAddToQuote={handleProductAdd}
          />
        )}
      </div>
    </div>
  )
}
