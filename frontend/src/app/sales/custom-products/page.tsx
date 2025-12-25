'use client'

import React, { useState, useEffect } from 'react'
import CustomProductConfig from '@/components/sales/CustomProductConfig'
import { ArrowLeft, Settings, Combine, Package, Layers } from 'lucide-react'
import Link from 'next/link'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { supabase } from '@/lib/supabase'

interface User {
    full_name?: string
    role?: string
    email?: string
}

export default function CustomProductsPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (userData) {
                    setUser(userData)
                }
            }
        } catch (error) {
            console.error('Error checking user:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
            <div className="w-full">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/sales"
                                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 mr-1" />
                                <span>Quay lại Bán hàng</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm Tùy chỉnh</h1>
                                <p className="text-sm text-gray-600 mt-1">Tạo và quản lý cấu trúc sản phẩm với danh mục, thuộc tính và tùy chọn</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Link
                                href="/sales/combine-products"
                                className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                            >
                                <Combine className="w-6 h-6 mr-3" />
                                <div>
                                    <h3 className="font-semibold">Kết hợp sản phẩm</h3>
                                    <p className="text-sm opacity-90">Tạo sản phẩm từ tùy chọn</p>
                                </div>
                            </Link>

                            <Link
                                href="/sales/combined-products"
                                className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                            >
                                <Package className="w-6 h-6 mr-3" />
                                <div>
                                    <h3 className="font-semibold">Sản phẩm đã kết hợp</h3>
                                    <p className="text-sm opacity-90">Quản lý sản phẩm đã tạo</p>
                                </div>
                            </Link>

                            <Link
                                href="/sales/structures"
                                className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                            >
                                <Settings className="w-6 h-6 mr-3" />
                                <div>
                                    <h3 className="font-semibold">Quản lý cấu trúc</h3>
                                    <p className="text-sm opacity-90">Thiết lập thứ tự đặt tên</p>
                                </div>
                            </Link>

                            <div className="flex items-center p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg">
                                <Layers className="w-6 h-6 mr-3" />
                                <div>
                                    <h3 className="font-semibold">Cấu hình cơ bản</h3>
                                    <p className="text-sm opacity-90">Quản lý danh mục & thuộc tính</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <CustomProductConfig />
            </div>
        </LayoutWithSidebar>
    )
}
