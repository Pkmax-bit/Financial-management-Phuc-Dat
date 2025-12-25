import React, { useState, useEffect } from 'react'
import {
    Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown,
    Settings, Check, Star, StarOff, GripVertical
} from 'lucide-react'
import {
    CustomProductCategory,
    CustomProductColumn,
    CustomProductStructure,
    CreateCustomProductStructurePayload
} from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

export default function StructureManagement() {
    // Data states
    const [categories, setCategories] = useState<CustomProductCategory[]>([])
    const [structures, setStructures] = useState<CustomProductStructure[]>([])
    const [columns, setColumns] = useState<Record<string, CustomProductColumn[]>>({})
    const [loading, setLoading] = useState(true)

    // Form states
    const [selectedCategory, setSelectedCategory] = useState('')
    const [isAddingStructure, setIsAddingStructure] = useState(false)
    const [editingStructure, setEditingStructure] = useState<string | null>(null)

    // New structure form
    const [newStructureName, setNewStructureName] = useState('')
    const [newStructureDesc, setNewStructureDesc] = useState('')
    const [newStructureSeparator, setNewStructureSeparator] = useState(' ')
    const [newStructureColumns, setNewStructureColumns] = useState<string[]>([])
    const [newStructureIsDefault, setNewStructureIsDefault] = useState(false)

    // Edit structure form
    const [editStructureName, setEditStructureName] = useState('')
    const [editStructureDesc, setEditStructureDesc] = useState('')
    const [editStructureSeparator, setEditStructureSeparator] = useState(' ')
    const [editStructureColumns, setEditStructureColumns] = useState<string[]>([])
    const [editStructureIsDefault, setEditStructureIsDefault] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        if (selectedCategory) {
            loadCategoryData(selectedCategory)
        }
    }, [selectedCategory])

    const loadCategories = async () => {
        try {
            const cats = await customProductService.getCategories(false)
            setCategories(cats)
            if (cats.length > 0 && !selectedCategory) {
                setSelectedCategory(cats[0].id)
            }
        } catch (error) {
            console.error('Failed to load categories', error)
        }
    }

    const loadCategoryData = async (categoryId: string) => {
        setLoading(true)
        try {
            const [structs, cols] = await Promise.all([
                customProductService.getStructures(categoryId, false),
                customProductService.getColumnsByCategory(categoryId, false)
            ])

            setStructures(structs)
            setColumns({ [categoryId]: cols })
        } catch (error) {
            console.error('Failed to load category data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddStructure = async () => {
        if (!newStructureName || newStructureColumns.length === 0) return

        try {
            const payload: CreateCustomProductStructurePayload = {
                category_id: selectedCategory,
                name: newStructureName,
                description: newStructureDesc,
                column_order: newStructureColumns,
                separator: newStructureSeparator,
                is_default: newStructureIsDefault
            }

            await customProductService.createStructure(payload)

            // Reset form
            setNewStructureName('')
            setNewStructureDesc('')
            setNewStructureSeparator(' ')
            setNewStructureColumns([])
            setNewStructureIsDefault(false)
            setIsAddingStructure(false)

            await loadCategoryData(selectedCategory)
        } catch (error) {
            console.error('Failed to create structure', error)
            alert('Có lỗi xảy ra khi tạo cấu trúc')
        }
    }

    const handleEditStructure = async (structureId: string) => {
        if (!editStructureName || editStructureColumns.length === 0) return

        try {
            await customProductService.updateStructure(structureId, {
                name: editStructureName,
                description: editStructureDesc,
                column_order: editStructureColumns,
                separator: editStructureSeparator,
                is_default: editStructureIsDefault
            })

            setEditingStructure(null)
            await loadCategoryData(selectedCategory)
        } catch (error) {
            console.error('Failed to update structure', error)
            alert('Có lỗi xảy ra khi cập nhật cấu trúc')
        }
    }

    const handleDeleteStructure = async (structureId: string) => {
        if (!confirm('Bạn có chắc muốn xóa cấu trúc này?')) return

        try {
            await customProductService.deleteStructure(structureId)
            await loadCategoryData(selectedCategory)
        } catch (error) {
            console.error('Failed to delete structure', error)
            alert('Có lỗi xảy ra khi xóa cấu trúc')
        }
    }

    const startEditStructure = (structure: CustomProductStructure) => {
        setEditingStructure(structure.id)
        setEditStructureName(structure.name)
        setEditStructureDesc(structure.description || '')
        setEditStructureSeparator(structure.separator)
        setEditStructureColumns(structure.column_order)
        setEditStructureIsDefault(structure.is_default)
    }

    const cancelEdit = () => {
        setEditingStructure(null)
        setEditStructureName('')
        setEditStructureDesc('')
        setEditStructureSeparator(' ')
        setEditStructureColumns([])
        setEditStructureIsDefault(false)
    }

    const moveColumn = (columns: string[], fromIndex: number, toIndex: number) => {
        const newColumns = [...columns]
        const [moved] = newColumns.splice(fromIndex, 1)
        newColumns.splice(toIndex, 0, moved)
        return newColumns
    }

    const addColumnToStructure = (columnId: string, isEdit = false) => {
        const targetColumns = isEdit ? editStructureColumns : newStructureColumns
        const setter = isEdit ? setEditStructureColumns : setNewStructureColumns

        if (!targetColumns.includes(columnId)) {
            setter([...targetColumns, columnId])
        }
    }

    const removeColumnFromStructure = (columnId: string, isEdit = false) => {
        const targetColumns = isEdit ? editStructureColumns : newStructureColumns
        const setter = isEdit ? setEditStructureColumns : setNewStructureColumns

        setter(targetColumns.filter(id => id !== columnId))
    }

    const moveColumnInStructure = (fromIndex: number, toIndex: number, isEdit = false) => {
        const targetColumns = isEdit ? editStructureColumns : newStructureColumns
        const setter = isEdit ? setEditStructureColumns : setNewStructureColumns

        setter(moveColumn(targetColumns, fromIndex, toIndex))
    }

    const getColumnName = (columnId: string) => {
        const categoryColumns = columns[selectedCategory] || []
        const column = categoryColumns.find(c => c.id === columnId)
        return column?.name || 'Unknown'
    }

    const generatePreview = (columnOrder: string[], separator: string) => {
        const names = columnOrder.map(id => getColumnName(id))
        return names.join(separator)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Quản lý Cấu trúc Đặt tên</h2>
                        <p className="text-gray-600 mt-1">Thiết lập thứ tự cột để tạo tên sản phẩm tự động</p>
                    </div>
                    <button
                        onClick={() => setIsAddingStructure(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm cấu trúc
                    </button>
                </div>
            </div>

            {/* Category Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Chọn danh mục sản phẩm
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Add Structure Form */}
            {isAddingStructure && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm cấu trúc mới</h3>
                    <StructureForm
                        name={newStructureName}
                        setName={setNewStructureName}
                        description={newStructureDesc}
                        setDescription={setNewStructureDesc}
                        separator={newStructureSeparator}
                        setSeparator={setNewStructureSeparator}
                        selectedColumns={newStructureColumns}
                        onAddColumn={(id) => addColumnToStructure(id)}
                        onRemoveColumn={(id) => removeColumnFromStructure(id)}
                        onMoveColumn={(from, to) => moveColumnInStructure(from, to)}
                        isDefault={newStructureIsDefault}
                        setIsDefault={setNewStructureIsDefault}
                        availableColumns={columns[selectedCategory] || []}
                        preview={generatePreview(newStructureColumns, newStructureSeparator)}
                        onSave={handleAddStructure}
                        onCancel={() => {
                            setIsAddingStructure(false)
                            setNewStructureName('')
                            setNewStructureDesc('')
                            setNewStructureSeparator(' ')
                            setNewStructureColumns([])
                            setNewStructureIsDefault(false)
                        }}
                    />
                </div>
            )}

            {/* Structures List */}
            {selectedCategory && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
                        </div>
                    ) : structures.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có cấu trúc nào</h3>
                            <p className="text-gray-500">Tạo cấu trúc đầu tiên để bắt đầu đặt tên sản phẩm tự động</p>
                        </div>
                    ) : (
                        structures.map(structure => (
                            <div key={structure.id} className="bg-white rounded-lg shadow-lg border border-gray-200">
                                {editingStructure === structure.id ? (
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chỉnh sửa cấu trúc</h3>
                                        <StructureForm
                                            name={editStructureName}
                                            setName={setEditStructureName}
                                            description={editStructureDesc}
                                            setDescription={setEditStructureDesc}
                                            separator={editStructureSeparator}
                                            setSeparator={setEditStructureSeparator}
                                            selectedColumns={editStructureColumns}
                                            onAddColumn={(id) => addColumnToStructure(id, true)}
                                            onRemoveColumn={(id) => removeColumnFromStructure(id, true)}
                                            onMoveColumn={(from, to) => moveColumnInStructure(from, to, true)}
                                            isDefault={editStructureIsDefault}
                                            setIsDefault={setEditStructureIsDefault}
                                            availableColumns={columns[selectedCategory] || []}
                                            preview={generatePreview(editStructureColumns, editStructureSeparator)}
                                            onSave={() => handleEditStructure(structure.id)}
                                            onCancel={cancelEdit}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {/* Structure Header */}
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {structure.name}
                                                    </h3>
                                                    {structure.is_default && (
                                                        <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEditStructure(structure)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 rounded"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStructure(structure.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {structure.description && (
                                                <p className="text-sm text-gray-600 mt-2">{structure.description}</p>
                                            )}
                                        </div>

                                        {/* Structure Content */}
                                        <div className="p-4">
                                            <div className="space-y-4">
                                                {/* Column Order */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Thứ tự cột:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {structure.column_order.map((columnId, index) => (
                                                            <span
                                                                key={columnId}
                                                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                            >
                                                                {index + 1}. {getColumnName(columnId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Separator */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Dấu phân cách:</h4>
                                                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                        "{structure.separator}"
                                                    </code>
                                                </div>

                                                {/* Preview */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Ví dụ tên sản phẩm:</h4>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="font-medium text-gray-800">
                                                            {generatePreview(structure.column_order, structure.separator) || 'Chưa có cột nào'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

interface StructureFormProps {
    name: string
    setName: (name: string) => void
    description: string
    setDescription: (desc: string) => void
    separator: string
    setSeparator: (sep: string) => void
    selectedColumns: string[]
    onAddColumn: (id: string) => void
    onRemoveColumn: (id: string) => void
    onMoveColumn: (from: number, to: number) => void
    isDefault: boolean
    setIsDefault: (isDefault: boolean) => void
    availableColumns: CustomProductColumn[]
    preview: string
    onSave: () => void
    onCancel: () => void
}

function StructureForm({
    name, setName, description, setDescription, separator, setSeparator,
    selectedColumns, onAddColumn, onRemoveColumn, onMoveColumn,
    isDefault, setIsDefault, availableColumns, preview, onSave, onCancel
}: StructureFormProps) {
    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên cấu trúc</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Cấu trúc cơ bản"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dấu phân cách</label>
                    <input
                        type="text"
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                        placeholder="VD:  , -, _"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Mô tả cấu trúc này..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                    Đặt làm cấu trúc mặc định cho danh mục này
                </label>
            </div>

            {/* Column Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Chọn và sắp xếp cột</label>

                {/* Available Columns */}
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cột có sẵn:</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableColumns.map(column => {
                            const isSelected = selectedColumns.includes(column.id)
                            return (
                                <button
                                    key={column.id}
                                    onClick={() => isSelected ? onRemoveColumn(column.id) : onAddColumn(column.id)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                        isSelected
                                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {column.name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Selected Columns Order */}
                {selectedColumns.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Thứ tự đã chọn:</h4>
                        <div className="space-y-2">
                            {selectedColumns.map((columnId, index) => (
                                <div key={columnId} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-blue-800">{index + 1}.</span>
                                    <span className="flex-1">{availableColumns.find(c => c.id === columnId)?.name}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => index > 0 && onMoveColumn(index, index - 1)}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => index < selectedColumns.length - 1 && onMoveColumn(index, index + 1)}
                                            disabled={index === selectedColumns.length - 1}
                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onRemoveColumn(columnId)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xem trước tên sản phẩm:</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">
                        {preview || 'Chọn ít nhất một cột để xem trước'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                    Hủy
                </button>
                <button
                    onClick={onSave}
                    disabled={!name || selectedColumns.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4 mr-2 inline" />
                    Lưu cấu trúc
                </button>
            </div>
        </div>
    )
}
