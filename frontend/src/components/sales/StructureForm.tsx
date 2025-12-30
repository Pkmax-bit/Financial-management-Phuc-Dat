import React, { Fragment } from 'react'
import { Save, X } from 'lucide-react'
import { CustomProductCategory, CustomProductColumn } from '@/types/customProduct'

interface StructureFormProps {
    name: string
    setName: (name: string) => void
    description: string
    setDescription: (desc: string) => void
    separator: string
    setSeparator: (sep: string) => void
    category: string
    setCategory: (categoryId: string) => void
    regularCategories?: string[]
    onRegularCategorySelect?: (categoryId: string, isSelected: boolean) => void
    categorySeparators?: string[]
    onSeparatorChange?: (index: number, value: string) => void
    categories: CustomProductCategory[]
    selectedColumns: string[]
    selectedCombinations: string[] | null
    primaryColumn: string
    setPrimaryColumn: (columnId: string) => void
    onAddColumn: (id: string) => void
    onRemoveColumn: (id: string) => void
    onMoveColumn: (from: number, to: number) => void
    onUpdateCombination: (index: number, value: string) => void
    availableColumns: CustomProductColumn[]
    allColumns?: Record<string, CustomProductColumn[]>
    preview: string
    onSave: () => void
    onCancel: () => void
    isEdit?: boolean
}

export function StructureForm({
    name, setName, description, setDescription, separator, setSeparator,
    category, setCategory, regularCategories = [], onRegularCategorySelect = () => {}, categorySeparators = [], onSeparatorChange = () => {}, categories,
    selectedColumns, selectedCombinations, primaryColumn, setPrimaryColumn,
    onAddColumn, onRemoveColumn, onMoveColumn, onUpdateCombination,
    availableColumns, allColumns, preview, onSave, onCancel, isEdit = false
}: StructureFormProps) {

    // Ensure regularCategories is always an array
    const safeRegularCategories = Array.isArray(regularCategories) ? regularCategories : []

    // Show message if no categories available
    if (!categories || categories.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có danh mục nào</h3>
                <p className="text-gray-600">
                    Vui lòng tạo danh mục trước khi tạo cấu trúc sản phẩm.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                    {isEdit ? 'Chỉnh sửa cấu trúc' : 'Tạo cấu trúc sản phẩm mới'}
                </h3>
            </div>

            {/* 1. Tên và Mô tả */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên cấu trúc <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Cấu trúc tủ bếp"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả cấu trúc</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Mô tả chi tiết về cấu trúc này..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                </div>
            </div>

            {/* 2. Danh mục chính */}
            {!isEdit && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                        📂 Danh mục chính
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg"
                    >
                        <option value="">
                            {categories.filter(cat => Boolean(cat.is_primary)).length === 0
                                ? '⚠️ Không có danh mục chính nào khả dụng'
                                : 'Chọn danh mục chính...'}
                        </option>
                        {categories
                            .filter(cat => Boolean(cat.is_primary))
                            .map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))
                        }
                    </select>
                    <p className="text-sm text-gray-600 mt-2">
                        Chọn danh mục chính làm nền tảng cho cấu trúc sản phẩm
                    </p>
                </div>
            )}

            {/* 3. Danh mục thường */}
            {category && !isEdit && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                        🌿 Danh mục thường
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                        Chọn thêm các danh mục khác để tổ hợp thuộc tính vào cấu trúc sản phẩm
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categories
                            .filter(cat => cat.id !== category && !cat.is_primary)
                            .map(cat => {
                                const isSelected = safeRegularCategories.includes(cat.id)
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => onRegularCategorySelect(cat.id, !isSelected)}
                                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-100'
                                                : 'border-gray-800 bg-white hover:border-green-300 hover:bg-green-50'
                                        }`}
                                        style={{ color: 'rgb(0, 0, 0)' }}
                                    >
                                        <div className="text-center">
                                            <div className={`font-medium ${isSelected ? 'text-green-800' : 'text-black'}`} style={!isSelected ? { color: 'rgba(0, 0, 0, 1) !important' } : {}}>{cat.name}</div>
                                            <div className={`text-xs mt-1 ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                                                {isSelected ? '✓ Đã chọn' : 'Chọn'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>

                    {safeRegularCategories.length > 0 && (
                        <div className="mt-4">
                            <span className="text-sm font-medium text-green-700">Đã chọn:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {safeRegularCategories.map(catId => {
                                    const cat = categories.find(c => c.id === catId)
                                    return cat ? (
                                        <span key={catId} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                            {cat.name}
                                        </span>
                                    ) : null
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Cấu trúc với ký hiệu liên kết */}
            {!isEdit && (category || safeRegularCategories.length > 0) && (
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                        🔗 Cấu trúc hoàn chỉnh
                    </label>

                    <div className="mb-4">
                        <span className="text-sm font-medium text-purple-700 mb-3 block">Cấu trúc danh mục:</span>
                        <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg border border-purple-200">
                            {category && (
                                <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm">
                                    {categories.find(cat => cat.id === category)?.name}
                                </span>
                            )}

                            {safeRegularCategories.length > 0 && (
                                <>
                                    {safeRegularCategories.map((catId, index) => {
                                        const cat = categories.find(c => c.id === catId)
                                        return cat ? (
                                            <Fragment key={catId}>
                                                {index > 0 && (
                                                    <input
                                                        type="text"
                                                        value={categorySeparators[index] || ' - '}
                                                        onChange={(e) => onSeparatorChange(index, e.target.value)}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder=" - "
                                                    />
                                                )}
                                                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                                                    {cat.name}
                                                </span>
                                            </Fragment>
                                        ) : null
                                    })}
                                </>
                            )}
                        </div>

                        <div className="mt-3">
                            <span className="text-xs text-gray-700">Xem trước tên cấu trúc:</span>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono font-bold text-black">
                                {(() => {
                                    let preview = ''
                                    if (category) {
                                        const mainCat = categories.find(cat => cat.id === category)
                                        if (mainCat) preview += mainCat.name
                                    }

                                    safeRegularCategories.forEach((catId, index) => {
                                        const cat = categories.find(c => c.id === catId)
                                        if (cat) {
                                            preview += (categorySeparators[index] || ' - ') + cat.name
                                        }
                                    })

                                    return preview || 'Chưa có cấu trúc'
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <span className="text-sm font-medium text-purple-700">Thuộc tính sẽ được tổ hợp:</span>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {selectedColumns.map((columnId, index) => {
                                const column = availableColumns.find(col => col.id === columnId)
                                const isPrimary = primaryColumn === columnId
                                return (
                                    <span key={columnId} className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${
                                        isPrimary
                                            ? 'bg-yellow-100 text-yellow-800 font-semibold'
                                            : 'bg-white border border-gray-300'
                                    }`}>
                                        {index + 1}. {column?.name || 'Cột'}
                                        {isPrimary && <span className="ml-1 text-yellow-600">⭐</span>}
                                        {index < selectedColumns.length - 1 && (
                                            <span className="ml-2 text-blue-600 font-bold">-</span>
                                        )}
                                    </span>
                                )
                            })}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            ⭐ Thuộc tính chính | Thuộc tính sẽ được tổ hợp theo từng danh mục
                        </p>
                    </div>
                </div>
            )}

            {/* 5. Preview cấu trúc hoàn chỉnh */}
            {selectedColumns.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-full">
                            <span className="text-green-600 font-bold">👀</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">Xem trước cấu trúc</h4>
                            <p className="text-sm text-gray-600">Cấu trúc tên sản phẩm hoàn chỉnh</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500">Tên sản phẩm:</div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border max-h-24 overflow-y-auto">
                                    {(() => {
                                        // Check if allColumns is available
                                        if (!allColumns) {
                                            return 'Đang tải dữ liệu...'
                                        }

                                        // Group columns by category in correct order: main category first, then regular categories
                                        const categoryOrder: string[] = []
                                        const columnsByCategory: { [categoryId: string]: string[] } = {}

                                        // Add main category first
                                        if (category) {
                                            categoryOrder.push(category)
                                            columnsByCategory[category] = []
                                        }

                                        // Add regular categories in order
                                        if (safeRegularCategories) {
                                            safeRegularCategories.forEach(catId => {
                                                categoryOrder.push(catId)
                                                columnsByCategory[catId] = []
                                            })
                                        }

                                        // Group selected columns by their category
                                        selectedColumns.forEach(columnId => {
                                            for (const catId of categoryOrder) {
                                                const categoryColumns = allColumns?.[catId] || []
                                                if (categoryColumns.some((col: CustomProductColumn) => col.id === columnId)) {
                                                    columnsByCategory[catId].push(columnId)
                                                    break
                                                }
                                            }
                                        })

                                        // Generate Cartesian product combinations
                                        const generateCartesianProduct = (arrays: string[][]): string[][] => {
                                            if (arrays.length === 0) return [[]]
                                            if (arrays.length === 1) return arrays[0].map(item => [item])

                                            const [first, ...rest] = arrays
                                            const restCombinations = generateCartesianProduct(rest)
                                            const result: string[][] = []

                                            first.forEach(item => {
                                                restCombinations.forEach(combination => {
                                                    result.push([item, ...combination])
                                                })
                                            })

                                            return result
                                        }

                                        // Get column groups in category order
                                        const columnGroups: string[][] = categoryOrder
                                            .filter(catId => columnsByCategory[catId].length > 0)
                                            .map(catId => columnsByCategory[catId])

                                        // Generate all possible combinations using Cartesian product
                                        const allCombinations = generateCartesianProduct(columnGroups)

                                        // Convert to display names (show first 3 examples)
                                        const previewExamples = allCombinations.slice(0, 3).map(combination => {
                                            return combination.map(columnId => {
                                                const column = availableColumns.find(col => col.id === columnId)
                                                return column?.name || 'Thuộc tính'
                                            }).join(' - ')
                                        })

                                        if (previewExamples.length === 0) {
                                            return 'Chưa có tổ hợp nào'
                                        }

                                        return previewExamples.map((example, index) => (
                                            <div key={index} className="mb-1 last:mb-0">
                                                {example}
                                            </div>
                                        ))
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-3 space-y-1">
                            <p><strong>📋 Logic:</strong> Tổ hợp thuộc tính từ các danh mục khác nhau</p>
                            <p><strong>✨ Ví dụ:</strong> Thuộc tính 1 (danh mục chính) - Thuộc tính 1 (danh mục thường)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={onSave}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                    💾 Lưu cấu trúc
                </button>
            </div>
        </div>
    )
}
