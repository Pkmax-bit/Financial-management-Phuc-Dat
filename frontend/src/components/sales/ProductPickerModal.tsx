'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight, Search, Package } from 'lucide-react'

// ĐÃ THÊM ĐỦ CÁC TRƯỜNG KÍCH THƯỚC VÀO TYPE
type Product = {
    id: string
    name: string
    price: number
    unit: string
    description: string | null
    category_id: string | null
    area?: number | null
    volume?: number | null
    height?: number | null
    length?: number | null
    depth?: number | null
}

const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)

export default function ProductPickerModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (p: Product) => void }) {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!isOpen) return
        const load = async () => {
            try {
                setLoading(true)
                
                // Load products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('id, name, price, unit, description, category_id, area, volume, height, length, depth') 
                    .order('created_at', { ascending: false })
                
                if (productsError) throw productsError
                setProducts((productsData || []) as unknown as Product[])
                
                // Load categories
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('product_categories')
                    .select('id, name')
                    .order('name', { ascending: true })
                
                if (categoriesError) throw categoriesError
                setCategories(categoriesData || [])
                
                // Mặc định tất cả danh mục đóng (không auto-expand)
                setExpandedCategories(new Set())
                
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [isOpen])

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId)
            } else {
                newSet.add(categoryId)
            }
            return newSet
        })
    }

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase()
        if (!s) return products
        return products.filter(p =>
            p.name.toLowerCase().includes(s) ||
            (p.description || '').toLowerCase().includes(s)
        )
    }, [search, products])

    const productsByCategory = useMemo(() => {
        const grouped: { [key: string]: Product[] } = {}
        
        // Add uncategorized products
        const uncategorized = filtered.filter(p => !p.category_id)
        if (uncategorized.length > 0) {
            grouped['uncategorized'] = uncategorized
        }
        
        // Group by category
        filtered.forEach(product => {
            if (product.category_id) {
                if (!grouped[product.category_id]) {
                    grouped[product.category_id] = []
                }
                grouped[product.category_id].push(product)
            }
        })
        
        return grouped
    }, [filtered])

    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Transparent overlay - hoàn toàn trong suốt, không che giao diện */}
            <div className="fixed inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
            
            {/* Modal positioned to not block the quote form - nền trong suốt hoàn toàn */}
            <div className="fixed top-20 right-6 w-full max-w-5xl max-h-[80vh] bg-white/100 rounded-xl shadow-2xl border border-gray-200 pointer-events-auto overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center">
                        <Package className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Chọn sản phẩm</h3>
                        <span className="ml-3 text-sm text-gray-500">
                            ({products.length} sản phẩm có sẵn)
                        </span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Đóng hộp thoại"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Search bar với giao diện cải tiến */}
                <div className="p-4 bg-white border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="🔍 Tìm kiếm sản phẩm theo tên hoặc mô tả..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {search && (
                        <div className="mt-2 text-xs text-blue-600">
                            Tìm thấy {filtered.length} sản phẩm phù hợp
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-auto bg-white max-h-[60vh]">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Đang tải...</div>
                    ) : Object.keys(productsByCategory).length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Không có sản phẩm phù hợp</div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(productsByCategory).map(([categoryId, categoryProducts]) => {
                                const category = categories.find(c => c.id === categoryId)
                                const isExpanded = expandedCategories.has(categoryId)
                                const isUncategorized = categoryId === 'uncategorized'
                                
                                return (
                                    <div key={categoryId} className="border-b border-gray-100 last:border-b-0">
                                        {/* Category Header với mũi tên rõ ràng */}
                                        <div 
                                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => !isUncategorized && toggleCategory(categoryId)}
                                        >
                                            <div className="flex items-center">
                                                {!isUncategorized && (
                                                    <div className="flex items-center">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-5 w-5 text-blue-600 mr-2 transition-transform" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-blue-600 mr-2 transition-transform" />
                                                        )}
                                                    </div>
                                                )}
                                                <span className="font-semibold text-gray-900">
                                                    {isUncategorized ? 'Không phân loại' : (category?.name || 'Không xác định')}
                                                </span>
                                                <span className="ml-3 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                                                    {categoryProducts.length} sản phẩm
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Products in Category */}
                                        {isUncategorized || isExpanded ? (
                                            <div className="bg-white">
                                                <table className="min-w-full text-sm text-gray-900">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-semibold">Tên</th>
                                                            <th className="px-3 py-2 text-right font-semibold w-32">Đơn giá</th>
                                                            <th className="px-3 py-2 text-left font-semibold w-24">Đơn vị</th>
                                                            <th className="px-3 py-2 text-left font-semibold">Mô tả</th>
                                                            <th className="px-3 py-2 text-right font-semibold w-24">Hành động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {categoryProducts.map(p => (
                                                            <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50">
                                                                <td className="px-3 py-2 font-medium">{p.name}</td>
                                                                <td className="px-3 py-2 text-right font-semibold text-green-600">
                                                                    {formatNumber(Number(p.price) || 0)} VND
                                                                </td>
                                                                <td className="px-3 py-2">{p.unit}</td>
                                                                <td className="px-3 py-2 text-gray-600">{p.description || '-'}</td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <button
                                                                        onClick={() => { onSelect(p); onClose() }}
                                                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        Chọn
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}