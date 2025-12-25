import CustomProductBuilderModal from './CustomProductBuilderModal'

// ... existing imports

export default function ProductsServicesTab({ searchTerm }: ProductsServicesTabProps) {
  const [items, setItems] = useState<ProductService[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCustomProductModal, setShowCustomProductModal] = useState(false)

  // ... existing state

  // ... existing fetch function

  const handleCustomProductSave = (product: any) => {
    // Optionally refresh list or show notification
    console.log('Saved custom product:', product)
    fetchProductsServices() // Refresh list to show new product if it was saved to the same table or linked
  }

  // ... existing helpers

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* ... existing filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* ... existing selects */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black"
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
            onClick={() => setShowCustomProductModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Sản phẩm tùy chỉnh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* ... existing summary cards */}
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

      {/* ... existing table/grid views */}
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
          <div className="space-x-4 mt-2">
            <button
              onClick={() => setShowCustomProductModal(true)}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Tạo sản phẩm tùy chỉnh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Thêm sản phẩm/dịch vụ đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* ... existing summary */}
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

      <CustomProductBuilderModal
        isOpen={showCustomProductModal}
        onClose={() => setShowCustomProductModal(false)}
        onSave={handleCustomProductSave}
      />
    </div>
  )
}