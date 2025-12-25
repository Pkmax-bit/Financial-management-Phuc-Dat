'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ProductCombination from '@/components/sales/ProductCombination'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { supabase } from '@/lib/supabase'

interface User {
    full_name?: string
    role?: string
    email?: string
}

export default function CombineProductsPage() {
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
                                href="/sales/custom-products"
                                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 mr-1" />
                                <span>Quay lại Quản lý Sản phẩm Tùy chỉnh</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Kết hợp Sản phẩm</h1>
                                <p className="text-sm text-gray-600 mt-1">Chọn các tùy chọn để tạo sản phẩm tùy chỉnh mới</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <ProductCombination />
                </div>
            </div>
        </LayoutWithSidebar>
    )
}
