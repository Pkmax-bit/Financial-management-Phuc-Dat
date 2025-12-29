'use client'

import { useState } from 'react'
import CustomProductSelectionModal from '../../components/sales/CustomProductSelectionModal'

export default function TestMatrixPage() {
  const [showModal, setShowModal] = useState(false)

  const handleProductAdd = (product: any) => {
    console.log('Product added:', product)
    alert(`Product added: ${product.generatedName || product.name}`)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Custom Product Matrix Modal
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            ✅ Dữ liệu đã được thêm thành công!
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-800">📊 Categories & Options:</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Loại nhôm:</strong> 3 options (Nhôm lá ghép nhỏ, Nhôm lá ghép lớn, Nhôm hộp kim)</li>
                <li><strong>Loại tay nắm:</strong> 2 options (Tay nắm âm, Tay nắm CNC)</li>
                <li><strong>Loại kính:</strong> 7 options (Kính 4 li, Kính 5 li, Kính 4 li siêu trong, ...)</li>
                <li><strong>Bộ phận:</strong> 8 options (Tủ lạnh, Bàn đảo 1 mặt, Bàn đảo 2 mặt, ...)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-800">🏗️ Structure:</h3>
              <p className="ml-4 mt-2">
                <strong>"Tên sản phẩm tủ bếp"</strong> với thứ tự: Loại nhôm → Loại tay nắm → Loại kính → Bộ phận
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-medium text-blue-800 mb-2">🔧 Logic đã cải thiện:</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• Thay vì Cartesian product (tất cả combinations), giờ chỉ tạo sensible combinations</li>
                <li>• Mỗi category chỉ lấy 1 option để tạo combinations có ý nghĩa</li>
                <li>• Tối đa 20 combinations để tránh quá tải UI</li>
                <li>• Ưu tiên options có unit_price</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            🚀 Test Matrix Modal
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Kết quả mong đợi:</h2>
          <div className="space-y-3 text-gray-700">
            <p>✅ Modal hiển thị với structure "Tên sản phẩm tủ bếp"</p>
            <p>✅ Thứ tự cột hiển thị đúng tên (không còn UUID)</p>
            <p>✅ Matrix table hiển thị các combinations hợp lý</p>
            <p>✅ Mỗi row có giá tổng hợp và nút "Chọn"</p>
            <p>✅ Có thể chọn 1 combination để thêm vào báo giá</p>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800 mb-2">🎯 Ví dụ combinations:</h3>
            <div className="text-green-700 text-sm space-y-1">
              <p>• Nhôm lá ghép nhỏ - Tay nắm âm - Kính 4 li - Tủ lạnh</p>
              <p>• Nhôm lá ghép lớn - Tay nắm CNC - Kính 5 li - Bàn đảo 1 mặt</p>
              <p>• Nhôm hộp kim - Tay nắm âm - Kính 4 li siêu trong - Bàn đảo 2 mặt</p>
              <p className="text-green-600 font-medium">💰 Giá tự động tính tổng từ các options đã chọn</p>
            </div>
          </div>
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
