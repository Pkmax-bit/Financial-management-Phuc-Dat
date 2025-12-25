import React, { useState, useEffect } from 'react'
import {
    Plus, Trash2, Edit, Save, X, ChevronRight, ChevronDown,
    Image as ImageIcon, GripVertical, Settings, Package
} from 'lucide-react'
import {
    CustomProductCategory,
    CustomProductColumn,
    CustomProductOption
} from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

export default function CustomProductConfig() {
    // Data states
    const [categories, setCategories] = useState<CustomProductCategory[]>([])
    const [columns, setColumns] = useState<Record<string, CustomProductColumn[]>>({})
    const [options, setOptions] = useState<Record<string, CustomProductOption[]>>({})
    const [loading, setLoading] = useState(true)

    // UI states
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

    // Form states - Categories
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDesc, setNewCategoryDesc] = useState('')
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [editCategoryName, setEditCategoryName] = useState('')
    const [editCategoryDesc, setEditCategoryDesc] = useState('')

    // Form states - Columns
    const [isAddingColumn, setIsAddingColumn] = useState<string | null>(null)
    const [newColName, setNewColName] = useState('')
    const [newColDesc, setNewColDesc] = useState('')
    const [editingColumn, setEditingColumn] = useState<string | null>(null)
    const [editColName, setEditColName] = useState('')
    const [editColDesc, setEditColDesc] = useState('')

    // Form states - Options
    const [addingOptionToCol, setAddingOptionToCol] = useState<string | null>(null)
    const [newOptName, setNewOptName] = useState('')
    const [newOptPrice, setNewOptPrice] = useState('')
    const [newOptWidth, setNewOptWidth] = useState('')
    const [newOptHeight, setNewOptHeight] = useState('')
    const [newOptDepth, setNewOptDepth] = useState('')

    // Drag & Drop states
    const [draggedItem, setDraggedItem] = useState<{
        type: 'category' | 'column'
        id: string
        categoryId?: string
    } | null>(null)

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, type: 'category' | 'column', id: string, categoryId?: string) => {
        setDraggedItem({ type, id, categoryId })
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e: React.DragEvent, dropType: 'category' | 'column', dropId: string, dropCategoryId?: string) => {
        e.preventDefault()

        if (!draggedItem) return

        // Same item
        if (draggedItem.id === dropId && draggedItem.type === dropType) return

        try {
            if (draggedItem.type === 'category' && dropType === 'category') {
                // Reorder categories
                const currentIndex = categories.findIndex(cat => cat.id === draggedItem.id)
                const dropIndex = categories.findIndex(cat => cat.id === dropId)

                if (currentIndex === -1 || dropIndex === -1) return

                const newCategories = [...categories]
                const [movedItem] = newCategories.splice(currentIndex, 1)
                newCategories.splice(dropIndex, 0, movedItem)

                // Update order_index
                const updatedCategories = newCategories.map((cat, index) => ({
                    ...cat,
                    order_index: index
                }))

                // Update in database
                for (const cat of updatedCategories) {
                    await customProductService.updateCategory(cat.id, { order_index: cat.order_index })
                }

                setCategories(updatedCategories)

            } else if (draggedItem.type === 'column' && dropType === 'column' && draggedItem.categoryId === dropCategoryId) {
                // Reorder columns within same category
                const categoryColumns = columns[draggedItem.categoryId!] || []
                const currentIndex = categoryColumns.findIndex(col => col.id === draggedItem.id)
                const dropIndex = categoryColumns.findIndex(col => col.id === dropId)

                if (currentIndex === -1 || dropIndex === -1) return

                const newColumns = [...categoryColumns]
                const [movedItem] = newColumns.splice(currentIndex, 1)
                newColumns.splice(dropIndex, 0, movedItem)

                // Update order_index
                const updatedColumns = newColumns.map((col, index) => ({
                    ...col,
                    order_index: index
                }))

                setColumns(prev => ({
                    ...prev,
                    [draggedItem.categoryId!]: updatedColumns
                }))

                // Update in database
                await fetch('/api/custom-products/columns/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category_id: draggedItem.categoryId,
                        column_orders: updatedColumns.map(col => ({ id: col.id, order_index: col.order_index }))
                    })
                })
            }
        } catch (error) {
            console.error('Failed to reorder items', error)
            fetchData() // Refresh data on error
        }

        setDraggedItem(null)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch categories
            const cats = await customProductService.getCategories(false)
            setCategories(cats)

            // Fetch columns and options for each category
            const colsByCat: Record<string, CustomProductColumn[]> = {}
            const optsByCol: Record<string, CustomProductOption[]> = {}

            for (const cat of cats) {
                const catColumns = await customProductService.getColumnsByCategory(cat.id, false)
                colsByCat[cat.id] = catColumns

                for (const col of catColumns) {
                    const colOptions = await customProductService.getOptions(col.id, false)
                    optsByCol[col.id] = colOptions
                }
            }

            setColumns(colsByCat)
            setOptions(optsByCol)
        } catch (error) {
            console.error('Failed to load config', error)
        } finally {
            setLoading(false)
        }
    }

    // Category handlers
    const handleAddCategory = async () => {
        if (!newCategoryName) return
        try {
            await customProductService.createCategory({
                name: newCategoryName,
                description: newCategoryDesc
            })
            setNewCategoryName('')
            setNewCategoryDesc('')
            setIsAddingCategory(false)
            fetchData()
        } catch (error) {
            console.error('Failed to add category', error)
        }
    }

    const handleEditCategory = async (categoryId: string) => {
        if (!editCategoryName) return
        try {
            await customProductService.updateCategory(categoryId, {
                name: editCategoryName,
                description: editCategoryDesc
            })
            setEditingCategory(null)
            setEditCategoryName('')
            setEditCategoryDesc('')
            fetchData()
        } catch (error) {
            console.error('Failed to edit category', error)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Bạn có chắc muốn xóa danh mục này? Tất cả cột và tùy chọn bên trong sẽ bị xóa.')) return
        try {
            await customProductService.deleteCategory(categoryId)
            fetchData()
        } catch (error) {
            console.error('Failed to delete category', error)
        }
    }

    // Column handlers
    const handleAddColumn = async (categoryId: string) => {
        if (!newColName) return
        try {
            await fetch('/api/custom-products/columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: categoryId,
                    name: newColName,
                    description: newColDesc,
                    order_index: (columns[categoryId] || []).length
                })
            })
            setNewColName('')
            setNewColDesc('')
            setIsAddingColumn(null)
            fetchData()
        } catch (error) {
            console.error('Failed to add column', error)
        }
    }

    const handleEditColumn = async (columnId: string, categoryId: string) => {
        if (!editColName) return
        try {
            await fetch(`/api/custom-products/columns/${columnId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editColName,
                    description: editColDesc
                })
            })
            setEditingColumn(null)
            setEditColName('')
            setEditColDesc('')
            fetchData()
        } catch (error) {
            console.error('Failed to edit column', error)
        }
    }

    const handleDeleteColumn = async (columnId: string) => {
        if (!confirm('Bạn có chắc muốn xóa thuộc tính này? Tất cả tùy chọn bên trong sẽ bị xóa.')) return
        try {
            await fetch(`/api/custom-products/columns/${columnId}`, { method: 'DELETE' })
            fetchData()
        } catch (error) {
            console.error('Failed to delete column', error)
        }
    }

    const handleAddOption = async (columnId: string) => {
        if (!newOptName) return
        try {
            const payload = {
                column_id: columnId,
                name: newOptName,
                unit_price: parseFloat(newOptPrice) || 0,
                order_index: (options[columnId] || []).length
            }

            await fetch('/api/custom-products/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            setNewOptName('')
            setNewOptPrice('')
            setAddingOptionToCol(null)
            fetchData()
        } catch (error) {
            console.error('Failed to add option', error)
        }
    }

    const handleDeleteOption = async (id: string) => {
        if (!confirm('Xóa tùy chọn này?')) return
        try {
            await fetch(`/api/custom-products/options/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (error) {
            console.error('Failed to delete option', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm Tùy chỉnh</h1>
                        <p className="mt-2 text-gray-600">Tạo và quản lý cấu trúc sản phẩm với danh mục, thuộc tính và tùy chọn</p>
                    </div>
                    <button
                        onClick={() => setIsAddingCategory(true)}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Thêm Danh mục
                    </button>
                </div>
            </div>

            {/* Add Category Form */}
            {isAddingCategory && (
                <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4">Thêm danh mục mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="Tên danh mục (VD: Nội thất, Điện tử)"
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        />
                        <input
                            value={newCategoryDesc}
                            onChange={e => setNewCategoryDesc(e.target.value)}
                            placeholder="Mô tả danh mục"
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddCategory}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Tạo danh mục
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingCategory(false)
                                    setNewCategoryName('')
                                    setNewCategoryDesc('')
                                }}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {categories.map(category => (
                    <div
                        key={category.id}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'category', category.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'category', category.id)}
                    >
                        {/* Category Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Package className="w-6 h-6 text-white" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                                        <p className="text-blue-100 text-sm">{category.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedCategories(prev =>
                                            new Set(prev.has(category.id) ? [] : [category.id])
                                        )}
                                        className="p-1 text-white hover:bg-white/20 rounded"
                                    >
                                        {expandedCategories.has(category.id) ?
                                            <ChevronDown className="w-5 h-5" /> :
                                            <ChevronRight className="w-5 h-5" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingCategory(category.id)
                                            setEditCategoryName(category.name)
                                            setEditCategoryDesc(category.description || '')
                                        }}
                                        className="p-1 text-white hover:bg-white/20 rounded"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="p-1 text-white hover:bg-red-500/20 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category Content */}
                        {expandedCategories.has(category.id) && (
                            <div className="p-4">
                                {/* Edit Category Form */}
                                {editingCategory === category.id && (
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h4 className="font-medium mb-2">Chỉnh sửa danh mục</h4>
                                        <div className="grid grid-cols-1 gap-2 mb-2">
                                            <input
                                                value={editCategoryName}
                                                onChange={e => setEditCategoryName(e.target.value)}
                                                placeholder="Tên danh mục"
                                                className="p-2 border rounded text-black"
                                            />
                                            <input
                                                value={editCategoryDesc}
                                                onChange={e => setEditCategoryDesc(e.target.value)}
                                                placeholder="Mô tả"
                                                className="p-2 border rounded text-black"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category.id)}
                                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
                                            >
                                                Lưu
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(null)
                                                    setEditCategoryName('')
                                                    setEditCategoryDesc('')
                                                }}
                                                className="px-3 py-1 bg-gray-300 rounded text-sm"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Add Column Button */}
                                <button
                                    onClick={() => setIsAddingColumn(category.id)}
                                    className="w-full mb-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 flex justify-center items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm thuộc tính
                                </button>

                                {/* Add Column Form */}
                                {isAddingColumn === category.id && (
                                    <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium mb-2">Thêm thuộc tính mới</h4>
                                        <div className="grid grid-cols-1 gap-2 mb-2">
                                            <input
                                                value={newColName}
                                                onChange={e => setNewColName(e.target.value)}
                                                placeholder="Tên thuộc tính (VD: Kích thước, Màu sắc)"
                                                className="p-2 border rounded text-black"
                                            />
                                            <input
                                                value={newColDesc}
                                                onChange={e => setNewColDesc(e.target.value)}
                                                placeholder="Mô tả thuộc tính"
                                                className="p-2 border rounded text-black"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddColumn(category.id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                            >
                                                Thêm
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsAddingColumn(null)
                                                    setNewColName('')
                                                    setNewColDesc('')
                                                }}
                                                className="px-3 py-1 bg-gray-300 rounded text-sm"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Columns */}
                                <div className="space-y-3">
                                    {(columns[category.id] || []).map(column => (
                                        <div
                                            key={column.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, 'column', column.id, category.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, 'column', column.id, category.id)}
                                        >
                                            {/* Column Header */}
                                            <div
                                                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                                onClick={() => setExpandedColumns(prev =>
                                                    new Set(prev.has(column.id) ? [] : [column.id])
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                                    {expandedColumns.has(column.id) ?
                                                        <ChevronDown className="w-4 h-4" /> :
                                                        <ChevronRight className="w-4 h-4" />
                                                    }
                                                    <span className="font-medium text-gray-700">{column.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({(options[column.id] || []).length} tùy chọn)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingColumn(column.id)
                                                            setEditColName(column.name)
                                                            setEditColDesc(column.description || '')
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteColumn(column.id)
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Column Content */}
                                            {expandedColumns.has(column.id) && (
                                                <div className="p-3 border-t border-gray-200">
                                                    {/* Edit Column Form */}
                                                    {editingColumn === column.id && (
                                                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                            <h5 className="text-sm font-medium mb-1">Chỉnh sửa thuộc tính</h5>
                                                            <div className="grid grid-cols-1 gap-1 mb-2">
                                                                <input
                                                                    value={editColName}
                                                                    onChange={e => setEditColName(e.target.value)}
                                                                    placeholder="Tên thuộc tính"
                                                                    className="p-1 border rounded text-sm text-black"
                                                                />
                                                                <input
                                                                    value={editColDesc}
                                                                    onChange={e => setEditColDesc(e.target.value)}
                                                                    placeholder="Mô tả"
                                                                    className="p-1 border rounded text-sm text-black"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleEditColumn(column.id, category.id)}
                                                                    className="px-2 py-1 bg-yellow-600 text-white rounded text-xs"
                                                                >
                                                                    Lưu
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingColumn(null)
                                                                        setEditColName('')
                                                                        setEditColDesc('')
                                                                    }}
                                                                    className="px-2 py-1 bg-gray-300 rounded text-xs"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Options */}
                                                    <div className="space-y-2 mb-3">
                                                        {(options[column.id] || []).map(option => (
                                                            <div key={option.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                                <div>
                                                                    <p className="font-medium text-sm">{option.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(option.unit_price || 0)}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteOption(option.id)}
                                                                    className="text-red-400 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Add Option */}
                                                    {addingOptionToCol === column.id ? (
                                                        <div className="p-2 border border-dashed border-gray-300 rounded bg-gray-50">
                                                            <h5 className="text-sm font-medium mb-2">Thêm tùy chọn</h5>
                                                            <div className="grid grid-cols-1 gap-1 mb-2">
                                                                <input
                                                                    value={newOptName}
                                                                    onChange={e => setNewOptName(e.target.value)}
                                                                    placeholder="Tên tùy chọn"
                                                                    className="p-1 border rounded text-sm text-black"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={newOptPrice}
                                                                    onChange={e => setNewOptPrice(e.target.value)}
                                                                    placeholder="Giá (VND)"
                                                                    className="p-1 border rounded text-sm text-black"
                                                                />
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleAddOption(column.id)}
                                                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                                                >
                                                                    Thêm
                                                                </button>
                                                                <button
                                                                    onClick={() => setAddingOptionToCol(null)}
                                                                    className="px-2 py-1 bg-gray-300 rounded text-xs"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddingOptionToCol(column.id)}
                                                            className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded hover:bg-gray-50 text-sm"
                                                        >
                                                            <Plus className="w-4 h-4 mr-1 inline" />
                                                            Thêm tùy chọn
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(columns[category.id] || []).length === 0 && (
                                        <div className="text-center text-gray-400 py-4 text-sm">
                                            Chưa có thuộc tính nào
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {categories.length === 0 && !loading && (
                    <div className="col-span-full bg-white rounded-lg shadow-lg border border-gray-200 p-12">
                        <div className="text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có danh mục nào</h3>
                            <p className="text-gray-500 mb-6">Bắt đầu bằng việc tạo danh mục sản phẩm đầu tiên</p>
                            <button
                                onClick={() => setIsAddingCategory(true)}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Tạo danh mục đầu tiên
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
