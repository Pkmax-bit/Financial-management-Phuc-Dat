import React, { useState, useEffect } from 'react'
import {
    Search, Edit, Trash2, Package, Plus, Eye,
    DollarSign, Ruler, Layers, Filter
} from 'lucide-react'
import { CustomProduct, CustomProductCategory } from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

interface CombinedProductsManagementProps {
    onEditProduct?: (product: CustomProduct) => void
}

export default function CombinedProductsManagement({ onEditProduct }: CombinedProductsManagementProps) {
    // Data states
    const [products, setProducts] = useState<CustomProduct[]>([])
    const [categories, setCategories] = useState<CustomProductCategory[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [showActiveOnly, setShowActiveOnly] = useState(true)

    // UI states
    const [selectedProduct, setSelectedProduct] = useState<CustomProduct | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [selectedCategory, showActiveOnly])

    useEffect(() => {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setProducts(filtered)
    }, [searchTerm])

    const loadData = async () => {
        setLoading(true)
        try {
            const [prods, cats] = await Promise.all([
                customProductService.getProducts(selectedCategory || undefined, undefined, showActiveOnly),
                customProductService.getCategories(false)
            ])

            setProducts(prods)
            setCategories(cats)
        } catch (error) {
            console.error('Failed to load data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return

        try {
            await customProductService.deleteProduct(productId)
            await loadData()
        } catch (error) {
            console.error('Failed to delete product', error)
            alert('Có lỗi xảy ra khi xóa sản phẩm')
        }
    }

    const handleToggleActive = async (product: CustomProduct) => {
        try {
            await customProductService.updateProduct(product.id, {
                is_active: !product.is_active
            })
            await loadData()
        } catch (error) {
            console.error('Failed to toggle product status', error)
            alert('Có lỗi xảy ra khi cập nhật trạng thái sản phẩm')
        }
    }

    const showProductDetails = (product: CustomProduct) => {
        setSelectedProduct(product)
        setShowDetailsModal(true)
    }

    const renderColumnOptions = (columnOptions: Record<string, any>) => {
        return Object.values(columnOptions).map((option: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-blue-600">{option.column_name}:</span>
                <span>{option.option_name}</span>
                {option.unit_price && (
                    <span className="text-green-600">
                        ({new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        }).format(option.unit_price)})
                    </span>
                )}
            </div>
        ))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm Đã Kết hợp</h2>
                        <p className="text-gray-600 mt-1">Xem và quản lý các sản phẩm tùy chỉnh đã tạo</p>
                    </div>
                    <button
                        onClick={loadData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tên sản phẩm..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                        <select
                            value={showActiveOnly.toString()}
                            onChange={(e) => setShowActiveOnly(e.target.value === 'true')}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        >
                            <option value="true">Đang hoạt động</option>
                            <option value="false">Tất cả</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={loadData}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
                    <p className="text-gray-500">Hãy tạo sản phẩm đầu tiên bằng cách kết hợp các tùy chọn</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            {/* Product Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {categories.find(c => c.id === product.category_id)?.name}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        product.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {product.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                    </div>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="p-4 space-y-3">
                                {/* Column Options */}
                                <div className="space-y-2">
                                    {renderColumnOptions(product.column_options)}
                                </div>

                                {/* Dimensions */}
                                {(product.total_width || product.total_height || product.total_depth) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Ruler className="w-4 h-4" />
                                        <span>
                                            {product.total_width && `R:${product.total_width}cm`}
                                            {product.total_height && ` × C:${product.total_height}cm`}
                                            {product.total_depth && ` × S:${product.total_depth}cm`}
                                        </span>
                                    </div>
                                )}

                                {/* Pricing */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <span className="font-semibold text-green-600">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(product.total_price || 0)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        SL: {product.quantity}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => showProductDetails(product)}
                                            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Chi tiết
                                        </button>
                                        <button
                                            onClick={() => onEditProduct?.(product)}
                                            className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                        >
                                            <Edit className="w-3 h-3 mr-1" />
                                            Sửa
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(product)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                product.is_active
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                        >
                                            {product.is_active ? 'Ẩn' : 'Hiện'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Chi tiết sản phẩm</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Tên sản phẩm</h4>
                                    <p className="text-gray-700">{selectedProduct.name}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Danh mục</h4>
                                    <p className="text-gray-700">
                                        {categories.find(c => c.id === selectedProduct.category_id)?.name}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Tùy chọn đã chọn</h4>
                                    <div className="space-y-2">
                                        {renderColumnOptions(selectedProduct.column_options)}
                                    </div>
                                </div>

                                {(selectedProduct.total_width || selectedProduct.total_height || selectedProduct.total_depth) && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Kích thước</h4>
                                        <p className="text-gray-700">
                                            {selectedProduct.total_width && `Rộng: ${selectedProduct.total_width}cm`}
                                            {selectedProduct.total_height && ` × Cao: ${selectedProduct.total_height}cm`}
                                            {selectedProduct.total_depth && ` × Sâu: ${selectedProduct.total_depth}cm`}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Đơn giá</h4>
                                        <p className="text-2xl font-bold text-green-600">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(selectedProduct.total_price || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Số lượng</h4>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {selectedProduct.quantity}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Tổng tiền</h4>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(selectedProduct.total_amount || 0)}
                                    </p>
                                </div>

                                {selectedProduct.description && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Mô tả</h4>
                                        <p className="text-gray-700">{selectedProduct.description}</p>
                                    </div>
                                )}

                                <div className="text-sm text-gray-500">
                                    <p>Tạo lúc: {new Date(selectedProduct.created_at).toLocaleString('vi-VN')}</p>
                                    <p>Cập nhật: {new Date(selectedProduct.updated_at).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
