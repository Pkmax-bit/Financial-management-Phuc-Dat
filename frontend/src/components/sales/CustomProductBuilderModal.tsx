import React, { useState, useEffect } from 'react'
import { X, ChevronRight, DollarSign, Package, Check } from 'lucide-react'
import { CustomProductColumn, CustomProductOption, SelectedOption } from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

interface CustomProductBuilderModalProps {
    isOpen: boolean
    onClose: () => void
    onSave?: (product: any) => void
}

export default function CustomProductBuilderModal({ isOpen, onClose, onSave }: CustomProductBuilderModalProps) {
    const [columns, setColumns] = useState<CustomProductColumn[]>([])
    const [options, setOptions] = useState<Record<string, CustomProductOption[]>>({})
    const [selections, setSelections] = useState<Record<string, SelectedOption>>({})
    const [activeColumnIndex, setActiveColumnIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [productName, setProductName] = useState('Sản phẩm tùy chỉnh mới')
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        if (isOpen) {
            fetchData()
        }
    }, [isOpen])

    const fetchData = async () => {
        try {
            setLoading(true)
            const cols = await customProductService.getColumns()
            setColumns(cols)

            const opts: Record<string, CustomProductOption[]> = {}
            for (const col of cols) {
                const colOptions = await customProductService.getOptions(col.id)
                opts[col.id] = colOptions
            }
            setOptions(opts)

            // Initialize selections with defaults if needed
            // const initialSelections: Record<string, SelectedOption> = {}
            // setSelections(initialSelections)

        } catch (error) {
            console.error('Failed to load custom product data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOption = (column: CustomProductColumn, option: CustomProductOption) => {
        const newSelections = { ...selections }
        newSelections[column.id] = {
            column_id: column.id,
            column_name: column.name,
            option_id: option.id,
            option_name: option.name,
            quantity: 1,
            unit_price: option.unit_price
        }
        setSelections(newSelections)

        // Auto advance to next column
        if (activeColumnIndex < columns.length - 1) {
            setTimeout(() => setActiveColumnIndex(activeColumnIndex + 1), 300)
        }
    }

    const calculateTotal = () => {
        let total = 0
        let width = 0
        let height = 0
        let depth = 0

        Object.values(selections).forEach(sel => {
            // Price
            if (sel.unit_price) {
                total += sel.unit_price * sel.quantity
            }

            // Dimensions (Logic: Find the option and add dimensions)
            // Note: This is simplified. Real dimension logic depends on how parts fit.
            const colOptions = options[sel.column_id] || []
            const opt = colOptions.find(o => o.id === sel.option_id)

            if (opt) {
                if (opt.width) width = Math.max(width, opt.width) // Example logic: Max width
                if (opt.height) height += opt.height // Example logic: Sum height
                if (opt.depth) depth = Math.max(depth, opt.depth) // Example logic: Max depth
            }
        })

        return { total, width, height, depth }
    }

    const handleSave = async () => {
        try {
            const { total, width, height, depth } = calculateTotal()

            const payload = {
                name: productName,
                column_options: selections,
                quantity: quantity,
                total_price: total,
                total_amount: total * quantity,
                total_width: width,
                total_height: height,
                total_depth: depth
            }

            await customProductService.createProduct(payload)
            onSave?.(payload)
            onClose()
        } catch (error) {
            console.error('Failed to save product', error)
            alert("Có lỗi xảy ra khi lưu sản phẩm")
        }
    }

    const totals = calculateTotal()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full h-[90vh] flex flex-col">

                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Sản phẩm tùy chỉnh
                            </h3>
                            <p className="text-sm text-gray-500">
                                Xây dựng sản phẩm theo yêu cầu
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar Steps */}
                        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white text-black"
                                />
                            </div>

                            <nav className="space-y-1">
                                {columns.map((col, idx) => {
                                    const isSelected = selections[col.id];
                                    const isActive = idx === activeColumnIndex;
                                    return (
                                        <button
                                            key={col.id}
                                            onClick={() => setActiveColumnIndex(idx)}
                                            className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md
                        ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
                        ${isSelected ? 'border-l-4 border-green-500' : ''}
                      `}
                                        >
                                            <span className="truncate">{col.name}</span>
                                            {isSelected && <Check className="h-4 w-4 text-green-500" />}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>

                        {/* Main Content - Options */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">Loading...</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {columns[activeColumnIndex] && options[columns[activeColumnIndex].id]?.map((opt) => {
                                        const isSelected = selections[columns[activeColumnIndex].id]?.option_id === opt.id
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => handleSelectOption(columns[activeColumnIndex], opt)}
                                                className={`
                            cursor-pointer rounded-lg border-2 p-4 transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}
                          `}
                                            >
                                                <div className="aspect-w-16 aspect-h-9 mb-4 rounded-md bg-gray-200 overflow-hidden">
                                                    {/* Placeholder for image */}
                                                    {opt.image_url ? (
                                                        <img src={opt.image_url} alt={opt.name} className="object-cover w-full h-32" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-32 text-gray-400">
                                                            <Package className="h-12 w-12" />
                                                        </div>
                                                    )}
                                                </div>

                                                <h4 className="font-bold text-gray-900">{opt.name}</h4>
                                                {opt.description && <p className="text-sm text-gray-500 mt-1">{opt.description}</p>}

                                                <div className="mt-4 flex justify-between items-center">
                                                    <span className="text-blue-600 font-bold">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(opt.unit_price || 0)}
                                                    </span>
                                                    {opt.has_dimensions && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {opt.width}x{opt.height}x{opt.depth}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Summary */}
                        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Tổng quan</h3>

                            <div className="flex-1 space-y-4">
                                {Object.values(selections).map((sel) => (
                                    <div key={sel.column_id} className="flex justify-between py-2 border-b border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500">{sel.column_name}</p>
                                            <p className="text-sm font-medium">{sel.option_name}</p>
                                        </div>
                                        <p className="text-sm">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sel.unit_price || 0)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Kích thước tổng:</span>
                                    <span className="font-medium">{totals.width} x {totals.height} x {totals.depth}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-900">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totals.total * quantity)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium shadow-sm flex justify-center items-center"
                                >
                                    <Check className="h-5 w-5 mr-2" />
                                    Tạo sản phẩm
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
