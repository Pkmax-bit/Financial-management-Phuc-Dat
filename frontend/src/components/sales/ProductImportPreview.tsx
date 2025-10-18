'use client'

import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Check, 
  X, 
  Download,
  Upload,
  Save,
  Edit3
} from 'lucide-react'
import ProductEditModal from './ProductEditModal'

interface ImportProduct {
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
  status: 'pending' | 'approved' | 'rejected'
  errors?: string[]
}

interface ImportPreviewProps {
  products: ImportProduct[]
  onApprove: (approvedProducts: ImportProduct[]) => void
  onReject: () => void
  onEdit: (index: number, updatedProduct: ImportProduct) => void
  isProcessing: boolean
}

export default function ProductImportPreview({ 
  products, 
  onApprove, 
  onReject, 
  onEdit, 
  isProcessing 
}: ImportPreviewProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ImportProduct | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)

  const filteredProducts = products.filter((product, index) => {
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleSelectProduct = (index: number) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map((_, index) => index)))
    }
  }

  const handleApproveSelected = () => {
    const approvedProducts = Array.from(selectedProducts).map(index => ({
      ...filteredProducts[index],
      status: 'approved' as const
    }))
    onApprove(approvedProducts)
  }

  const handleRejectSelected = () => {
    const rejectedProducts = Array.from(selectedProducts).map(index => ({
      ...filteredProducts[index],
      status: 'rejected' as const
    }))
    onApprove(rejectedProducts)
  }

  const handleEditProduct = (index: number) => {
    const product = filteredProducts[index]
    setEditingProduct(product)
    setEditingIndex(index)
    setEditModalOpen(true)
  }

  const handleSaveEdit = (updatedProduct: ImportProduct) => {
    onEdit(editingIndex, updatedProduct)
    setEditModalOpen(false)
    setEditingProduct(null)
    setEditingIndex(-1)
  }

  const handleCloseEdit = () => {
    setEditModalOpen(false)
    setEditingProduct(null)
    setEditingIndex(-1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-300 hover:bg-green-100'
      case 'rejected':
        return 'bg-red-50 border-red-300 hover:bg-red-100'
      default:
        return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Eye className="w-6 h-6 mr-2 text-blue-600" />
            Xem trước dữ liệu import
          </h3>
          <p className="text-sm text-gray-700 mt-2 font-medium">
            Kiểm tra và duyệt <span className="font-bold text-blue-600">{products.length}</span> sản phẩm trước khi lưu vào database
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onReject()}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
          >
            <X className="w-4 h-4 mr-2" />
            Hủy bỏ
          </button>
          <button
            onClick={handleApproveSelected}
            disabled={selectedProducts.size === 0 || isProcessing}
            className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md"
          >
            <Check className="w-4 h-4 mr-2" />
            Duyệt đã chọn ({selectedProducts.size})
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">Tìm kiếm sản phẩm</label>
            <input
              type="text"
              placeholder="Nhập tên sản phẩm hoặc hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Lọc theo trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-bold text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-colors border-2 border-gray-300 hover:border-gray-400"
              >
                {selectedProducts.size === filteredProducts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products List - Table Format */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạng mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kích thước
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${
                    selectedProducts.has(index) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(index)}
                      onChange={() => handleSelectProduct(index)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">Đơn vị: {product.unit}</div>
                      {product.description && (
                        <div className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                          {product.description}
                        </div>
                      )}
                      {product.errors && product.errors.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {product.errors.length} lỗi
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.price.toLocaleString()} VND
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.category_name || 'Chưa có'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-gray-600">
                      {product.area && <div>Diện tích: {product.area} m²</div>}
                      {product.volume && <div>Thể tích: {product.volume} m³</div>}
                      {product.height && <div>Cao: {product.height} m</div>}
                      {product.length && <div>Dài: {product.length} m</div>}
                      {product.depth && <div>Sâu: {product.depth} m</div>}
                      {!product.area && !product.volume && !product.height && !product.length && !product.depth && (
                        <div className="text-gray-400">-</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(product.status)}
                      <span className="ml-2 text-xs font-medium text-gray-600">
                        {product.status === 'pending' ? 'Chờ duyệt' : 
                         product.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditProduct(index)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Tổng: {products.length} sản phẩm
          </div>
          <div className="flex space-x-6 text-sm">
            <div className="text-gray-600">
              Chờ duyệt: <span className="font-medium text-gray-900">
                {products.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div className="text-gray-600">
              Đã duyệt: <span className="font-medium text-gray-900">
                {products.filter(p => p.status === 'approved').length}
              </span>
            </div>
            <div className="text-gray-600">
              Đã từ chối: <span className="font-medium text-gray-900">
                {products.filter(p => p.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        product={editingProduct}
      />
    </div>
  )
}
