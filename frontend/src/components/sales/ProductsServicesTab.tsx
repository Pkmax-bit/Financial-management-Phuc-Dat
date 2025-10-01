'use client'

import { useState, useEffect } from 'react'
import { 
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Tag,
  Box,
  Wrench,
  Layers,
  DollarSign,
  BarChart3,
  Archive
} from 'lucide-react'

interface ProductsServicesTabProps {
  searchTerm: string
}

interface ProductService {
  id: string
  name: string
  sku: string
  description: string
  type: 'inventory' | 'non-inventory' | 'service' | 'bundle'
  category: string
  sales_price: number
  cost_price: number
  quantity_on_hand: number
  reorder_point: number
  income_account: string
  expense_account: string
  tax_category: string
  status: 'active' | 'inactive'
  created_date: string
  last_sold_date: string
  total_sold: number
  revenue_generated: number
}

export default function ProductsServicesTab({ searchTerm }: ProductsServicesTabProps) {
  const [items, setItems] = useState<ProductService[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    fetchProductsServices()
  }, [])

  const fetchProductsServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products-services')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching products/services:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa bán'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <Box className="h-5 w-5 text-blue-600" />
      case 'non-inventory':
        return <Package className="h-5 w-5 text-green-600" />
      case 'service':
        return <Wrench className="h-5 w-5 text-purple-600" />
      case 'bundle':
        return <Layers className="h-5 w-5 text-orange-600" />
      default:
        return <Package className="h-5 w-5 text-black" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'Hàng tồn kho'
      case 'non-inventory':
        return 'Không tồn kho'
      case 'service':
        return 'Dịch vụ'
      case 'bundle':
        return 'Gói sản phẩm'
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'bg-blue-100 text-blue-800'
      case 'non-inventory':
        return 'bg-green-100 text-green-800'
      case 'service':
        return 'bg-purple-100 text-purple-800'
      case 'bundle':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Hoạt động' : 'Ngừng bán'
  }

  const getStockStatus = (item: ProductService) => {
    if (item.type !== 'inventory') return null
    
    if (item.quantity_on_hand <= 0) {
      return { label: 'Hết hàng', color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (item.quantity_on_hand <= item.reorder_point) {
      return { label: 'Sắp hết', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    } else {
      return { label: 'Còn hàng', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  }

  const handleViewItem = (itemId: string) => {
    console.log('View item:', itemId)
  }

  const handleEditItem = (itemId: string) => {
    console.log('Edit item:', itemId)
  }

  const handleDeleteItem = (itemId: string) => {
    console.log('Delete item:', itemId)
  }

  const handleDuplicateItem = (itemId: string) => {
    console.log('Duplicate item:', itemId)
  }

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || item.type === filterType
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'sales_price':
          aValue = a.sales_price
          bValue = b.sales_price
          break
        case 'quantity':
          aValue = a.quantity_on_hand
          bValue = b.quantity_on_hand
          break
        case 'revenue':
          aValue = a.revenue_generated
          bValue = b.revenue_generated
          break
        case 'last_sold':
          aValue = a.last_sold_date ? new Date(a.last_sold_date).getTime() : 0
          bValue = b.last_sold_date ? new Date(b.last_sold_date).getTime() : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="inventory">Hàng tồn kho</option>
            <option value="non-inventory">Không tồn kho</option>
            <option value="service">Dịch vụ</option>
            <option value="bundle">Gói sản phẩm</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name-asc">Tên (A-Z)</option>
            <option value="name-desc">Tên (Z-A)</option>
            <option value="sales_price-desc">Giá bán (Cao nhất)</option>
            <option value="sales_price-asc">Giá bán (Thấp nhất)</option>
            <option value="quantity-desc">Tồn kho (Nhiều nhất)</option>
            <option value="quantity-asc">Tồn kho (Ít nhất)</option>
            <option value="revenue-desc">Doanh thu (Cao nhất)</option>
            <option value="last_sold-desc">Bán gần đây</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-black hover:bg-gray-50'}`}
            >
              Bảng
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-black hover:bg-gray-50'}`}
            >
              Lưới
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Tổng mặt hàng</p>
              <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Box className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Hàng tồn kho</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredItems.filter(i => i.type === 'inventory').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Wrench className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Dịch vụ</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredItems.filter(i => i.type === 'service').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredItems.reduce((sum, i) => sum + i.revenue_generated, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Sản phẩm/Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Đã bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Doanh thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getTypeIcon(item.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-black">SKU: {item.sku}</div>
                            {item.description && (
                              <div className="text-xs text-black truncate max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatCurrency(item.sales_price)}
                        </div>
                        {item.cost_price > 0 && (
                          <div className="text-xs text-black">
                            Giá vốn: {formatCurrency(item.cost_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.type === 'inventory' ? (
                          <div>
                            <div className="text-sm text-gray-900">{item.quantity_on_hand}</div>
                            {stockStatus && (
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-black">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.total_sold}</div>
                        <div className="text-xs text-black">
                          Lần cuối: {formatDate(item.last_sold_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.revenue_generated)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewItem(item.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditItem(item.id)}
                            className="text-black hover:text-gray-900 p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDuplicateItem(item.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Sao chép"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item)
            return (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getTypeIcon(item.type)}
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleViewItem(item.id)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditItem(item.id)}
                      className="text-black hover:text-gray-900 p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                <p className="text-sm text-black mb-2">SKU: {item.sku}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-black">Giá bán:</span>
                    <span className="text-sm font-medium">{formatCurrency(item.sales_price)}</span>
                  </div>
                  
                  {item.type === 'inventory' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-black">Tồn kho:</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{item.quantity_on_hand}</span>
                        {stockStatus && (
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-black">Đã bán:</span>
                    <span className="text-sm font-medium">{item.total_sold}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-black">Doanh thu:</span>
                    <span className="text-sm font-medium">{formatCurrency(item.revenue_generated)}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-black">Không tìm thấy sản phẩm/dịch vụ nào</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Thêm sản phẩm/dịch vụ đầu tiên
          </button>
        </div>
      )}
      
      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-black">
        <span>Hiển thị {filteredItems.length} mặt hàng</span>
        <span>
          Tổng giá trị tồn kho: {formatCurrency(
            filteredItems
              .filter(i => i.type === 'inventory')
              .reduce((sum, i) => sum + (i.quantity_on_hand * i.cost_price), 0)
          )}
        </span>
      </div>
    </div>
  )
}