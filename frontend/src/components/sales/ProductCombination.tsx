import React, { useState, useEffect } from 'react'
import {
    Plus, Save, RefreshCw, Check, X, Package, Layers,
    Ruler, DollarSign, Image as ImageIcon
} from 'lucide-react'
import {
    CustomProductCategory,
    CustomProductColumn,
    CustomProductOption,
    SelectedOption,
    CreateCustomProductPayload,
    CustomProductStructure
} from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

interface ProductCombinationProps {
    onProductCreated?: (product: any) => void
    initialCategoryId?: string
}

export default function ProductCombination({ onProductCreated, initialCategoryId }: ProductCombinationProps) {
    // Data states
    const [categories, setCategories] = useState<CustomProductCategory[]>([])
    const [columns, setColumns] = useState<CustomProductColumn[]>([])
    const [options, setOptions] = useState<Record<string, CustomProductOption[]>>({})
    const [structures, setStructures] = useState<CustomProductStructure[]>([])
    const [loading, setLoading] = useState(false)

    // Selection states
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId || '')
    const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption>>({})
    const [selectedStructure, setSelectedStructure] = useState<string>('')

    // Product creation states
    const [generatedName, setGeneratedName] = useState('')
    const [productQuantity, setProductQuantity] = useState(1)
    const [productDescription, setProductDescription] = useState('')
    const [creating, setCreating] = useState(false)

    // Load initial data
    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        if (selectedCategory) {
            loadCategoryData(selectedCategory)
        }
    }, [selectedCategory])

    useEffect(() => {
        if (selectedCategory && Object.keys(selectedOptions).length > 0) {
            generateProductName()
        }
    }, [selectedOptions, selectedStructure])

    const loadCategories = async () => {
        try {
            const cats = await customProductService.getCategories(false)
            setCategories(cats)
        } catch (error) {
            console.error('Failed to load categories', error)
        }
    }

    const loadCategoryData = async (categoryId: string) => {
        setLoading(true)
        try {
            const [cols, structs] = await Promise.all([
                customProductService.getColumnsByCategory(categoryId, false),
                customProductService.getStructures(categoryId, false)
            ])

            setColumns(cols)
            setStructures(structs)

            // Load options for each column
            const optsByCol: Record<string, CustomProductOption[]> = {}
            for (const col of cols) {
                const colOptions = await customProductService.getOptions(col.id, false)
                optsByCol[col.id] = colOptions
            }
            setOptions(optsByCol)

            // Set default structure if available
            const defaultStructure = structs.find(s => s.is_default)
            if (defaultStructure) {
                setSelectedStructure(defaultStructure.id)
            }

            // Reset selections
            setSelectedOptions({})
            setGeneratedName('')
        } catch (error) {
            console.error('Failed to load category data', error)
        } finally {
            setLoading(false)
        }
    }

    const generateProductName = async () => {
        if (!selectedCategory || Object.keys(selectedOptions).length === 0) return

        try {
            const optionMap: Record<string, string> = {}
            Object.entries(selectedOptions).forEach(([columnId, selectedOption]) => {
                optionMap[columnId] = selectedOption.option_id
            })

            const result = await customProductService.generateProductName(
                selectedCategory,
                optionMap,
                selectedStructure || undefined
            )

            setGeneratedName(result.generated_name)
        } catch (error) {
            console.error('Failed to generate name', error)
        }
    }

    const handleOptionSelect = (columnId: string, option: CustomProductOption) => {
        const column = columns.find(c => c.id === columnId)
        if (!column) return

        const selectedOption: SelectedOption = {
            column_id: columnId,
            column_name: column.name,
            option_id: option.id,
            option_name: option.name,
            quantity: 1,
            unit_price: option.unit_price || 0
        }

        setSelectedOptions(prev => ({
            ...prev,
            [columnId]: selectedOption
        }))
    }

    const handleCreateProduct = async () => {
        if (!selectedCategory || !generatedName) return

        setCreating(true)
        try {
            const productData: CreateCustomProductPayload = {
                category_id: selectedCategory,
                name: generatedName,
                column_options: selectedOptions,
                total_description: productDescription,
                quantity: productQuantity,
                total_price: calculateTotalPrice(),
                total_amount: calculateTotalAmount()
            }

            const createdProduct = await customProductService.createProduct(productData)

            // Reset form
            setSelectedOptions({})
            setGeneratedName('')
            setProductQuantity(1)
            setProductDescription('')

            onProductCreated?.(createdProduct)

            alert('Sản phẩm đã được tạo thành công!')
        } catch (error) {
            console.error('Failed to create product', error)
            alert('Có lỗi xảy ra khi tạo sản phẩm')
        } finally {
            setCreating(false)
        }
    }

    const calculateTotalPrice = () => {
        return Object.values(selectedOptions).reduce((sum, option) => {
            return sum + (option.unit_price || 0)
        }, 0)
    }

    const calculateTotalAmount = () => {
        return calculateTotalPrice() * productQuantity
    }

    const getSelectedOptionForColumn = (columnId: string) => {
        return selectedOptions[columnId]
    }

    const resetSelection = () => {
        setSelectedOptions({})
        setGeneratedName('')
        setProductQuantity(1)
        setProductDescription('')
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Kết hợp Sản phẩm Tùy chỉnh</h2>
                        <p className="text-gray-600 mt-1">Chọn các tùy chọn để tạo sản phẩm mới</p>
                    </div>
                    <button
                        onClick={resetSelection}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Đặt lại
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

            {selectedCategory && (
                <>
                    {/* Structure Selection */}
                    {structures.length > 0 && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn cấu trúc đặt tên
                            </label>
                            <select
                                value={selectedStructure}
                                onChange={(e) => setSelectedStructure(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            >
                                <option value="">-- Chọn cấu trúc --</option>
                                {structures.map(structure => (
                                    <option key={structure.id} value={structure.id}>
                                        {structure.name} {structure.is_default ? '(Mặc định)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Options Selection */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Column Options */}
                            <div className="space-y-4">
                                {columns.map(column => (
                                    <div key={column.id} className="bg-white rounded-lg shadow-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {column.name}
                                            </h3>
                                            {getSelectedOptionForColumn(column.id) && (
                                                <Check className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {options[column.id]?.map(option => {
                                                const isSelected = getSelectedOptionForColumn(column.id)?.option_id === option.id
                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => handleOptionSelect(column.id, option)}
                                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">{option.name}</p>
                                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                                    {option.unit_price && (
                                                                        <span className="flex items-center">
                                                                            <DollarSign className="w-3 h-3 mr-1" />
                                                                            {new Intl.NumberFormat('vi-VN', {
                                                                                style: 'currency',
                                                                                currency: 'VND'
                                                                            }).format(option.unit_price)}
                                                                        </span>
                                                                    )}
                                                                    {option.has_dimensions && (option.width || option.height || option.depth) && (
                                                                        <span className="flex items-center">
                                                                            <Ruler className="w-3 h-3 mr-1" />
                                                                            {option.width && `${option.width}cm`}
                                                                            {option.height && ` × ${option.height}cm`}
                                                                            {option.depth && ` × ${option.depth}cm`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Product Preview */}
                            <div className="space-y-6">
                                {/* Generated Name */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tên sản phẩm được tạo</h3>
                                    <div className="p-4 bg-gray-50 rounded-lg min-h-[60px] flex items-center">
                                        {generatedName ? (
                                            <p className="text-lg font-medium text-gray-900">{generatedName}</p>
                                        ) : (
                                            <p className="text-gray-500 italic">Chọn các tùy chọn để tạo tên sản phẩm</p>
                                        )}
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sản phẩm</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số lượng
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={productQuantity}
                                                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mô tả bổ sung
                                            </label>
                                            <textarea
                                                value={productDescription}
                                                onChange={(e) => setProductDescription(e.target.value)}
                                                rows={3}
                                                placeholder="Mô tả chi tiết về sản phẩm..."
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                            />
                                        </div>

                                        {/* Price Summary */}
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Đơn giá:</span>
                                                <span className="font-medium">
                                                    {new Intl.NumberFormat('vi-VN', {
                                                        style: 'currency',
                                                        currency: 'VND'
                                                    }).format(calculateTotalPrice())}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Số lượng:</span>
                                                <span className="font-medium">{productQuantity}</span>
                                            </div>
                                            <div className="border-t pt-2 flex justify-between items-center">
                                                <span className="font-medium text-gray-900">Tổng cộng:</span>
                                                <span className="font-bold text-lg text-green-600">
                                                    {new Intl.NumberFormat('vi-VN', {
                                                        style: 'currency',
                                                        currency: 'VND'
                                                    }).format(calculateTotalAmount())}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Create Button */}
                                <button
                                    onClick={handleCreateProduct}
                                    disabled={!generatedName || creating}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white shadow-lg ${
                                        generatedName && !creating
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {creating ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Đang tạo...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <Plus className="w-5 h-5 mr-2" />
                                            Tạo sản phẩm
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
