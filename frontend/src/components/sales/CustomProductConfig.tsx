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
import { supabase } from '@/lib/supabase'

export default function CustomProductConfig() {
    // Data states
    const [categories, setCategories] = useState<CustomProductCategory[]>([])
    const [columns, setColumns] = useState<Record<string, CustomProductColumn[]>>({})
    const [options, setOptions] = useState<Record<string, CustomProductOption[]>>({})
    const [loading, setLoading] = useState(true)

    // UI states
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

    // Loading states for individual operations
    const [loadingStates, setLoadingStates] = useState<{
        categories: Record<string, boolean>
        columns: Record<string, boolean>
        options: Record<string, boolean>
    }>({
        categories: {},
        columns: {},
        options: {}
    })

    // Form states - Categories
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDesc, setNewCategoryDesc] = useState('')
    const [newCategoryIsPrimary, setNewCategoryIsPrimary] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editIsPrimary, setEditIsPrimary] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Form states - Columns
    const [isAddingColumn, setIsAddingColumn] = useState<string | null>(null)
    const [addingColumnCategory, setAddingColumnCategory] = useState<CustomProductCategory | null>(null)
    const [newColName, setNewColName] = useState('')
    const [newColDesc, setNewColDesc] = useState('')
    const [newColIsPrimary, setNewColIsPrimary] = useState(false)

    // Auto-detect if column should be primary based on category and name
    const updatePrimaryStatus = (name: string, categoryName?: string) => {
        // Check name keywords
        const primaryKeywords = ['kích thước', 'size', 'dimension', 'kich thuoc', 'kich thước']
        const nameIndicatesPrimary = primaryKeywords.some(keyword =>
            name.toLowerCase().includes(keyword.toLowerCase())
        )

        // Check category keywords (materials that typically have dimensions)
        const primaryCategoryKeywords = ['nhôm', 'nhom', 'aluminum', 'alum', 'kinh', 'glass', 'kính']
        const categoryIndicatesPrimary = categoryName && primaryCategoryKeywords.some(keyword =>
            categoryName.toLowerCase().includes(keyword.toLowerCase())
        )

        const shouldBePrimary = nameIndicatesPrimary || categoryIndicatesPrimary || false
        setNewColIsPrimary(shouldBePrimary)
    }

    // Check if primary status is auto-detected based on name only
    const isAutoDetectedFromName = () => {
        const primaryKeywords = ['kích thước', 'size', 'dimension', 'kich thuoc', 'kich thước']
        return newColName && primaryKeywords.some(keyword =>
            newColName.toLowerCase().includes(keyword.toLowerCase())
        )
    }

    // Check if primary status is auto-detected based on category
    const isAutoDetectedFromCategory = () => {
        const primaryCategoryKeywords = ['nhôm', 'nhom', 'aluminum', 'alum', 'kinh', 'glass', 'kính']
        return addingColumnCategory?.name && primaryCategoryKeywords.some(keyword =>
            addingColumnCategory.name.toLowerCase().includes(keyword.toLowerCase())
        )
    }
    const [editingColumn, setEditingColumn] = useState<string | null>(null)
    const [editColName, setEditColName] = useState('')
    const [editColDesc, setEditColDesc] = useState('')
    const [editColIsPrimary, setEditColIsPrimary] = useState(false)

    // Form states - Options
    const [addingOptionToCol, setAddingOptionToCol] = useState<string | null>(null)
    const [newOptName, setNewOptName] = useState('')
    const [newOptDesc, setNewOptDesc] = useState('')
    const [newOptPrice, setNewOptPrice] = useState('')
    const [newOptWidth, setNewOptWidth] = useState('')
    const [newOptHeight, setNewOptHeight] = useState('')
    const [newOptDepth, setNewOptDepth] = useState('')

    // Edit option states
    const [editingOption, setEditingOption] = useState<string | null>(null)
    const [editOptName, setEditOptName] = useState('')
    const [editOptDesc, setEditOptDesc] = useState('')
    const [editOptPrice, setEditOptPrice] = useState('')
    const [editOptWidth, setEditOptWidth] = useState('')
    const [editOptHeight, setEditOptHeight] = useState('')
    const [editOptDepth, setEditOptDepth] = useState('')

    // Drag & Drop states
    const [draggedItem, setDraggedItem] = useState<{
        type: 'category' | 'column'
        id: string
        categoryId?: string
    } | null>(null)

    // Notification helpers
    const showError = (message: string) => {
        alert(`Lỗi: ${message}`)
    }

    const showSuccess = (message: string) => {
        alert(message)
    }

    // Edit helpers
    const startEdit = (category: CustomProductCategory) => {
        setEditingId(category.id)
        setEditName(category.name)
        setEditDescription(category.description || '')
        setEditIsPrimary(category.is_primary || false)
        setError(null)
    }

    const startEditColumn = (column: CustomProductColumn) => {
        setEditingColumn(column.id)
        setEditColName(column.name)
        setEditColDesc(column.description || '')
        setEditColIsPrimary(column.is_primary || false)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditName('')
        setEditDescription('')
        setEditIsPrimary(false)
        setError(null)
    }

    // Toggle primary category
    const handleToggleCategoryPrimary = async (categoryId: string, currentIsPrimary: boolean) => {
        try {
            setLoadingStates(prev => ({ ...prev, categories: { ...prev.categories, [categoryId]: true } }))

            const { error } = await supabase
                .from('custom_product_categories')
                .update({ is_primary: !currentIsPrimary })
                .eq('id', categoryId)

            if (error) throw error

            // Update local state
            setCategories(prev => prev.map(cat =>
                cat.id === categoryId ? { ...cat, is_primary: !currentIsPrimary } : cat
            ))

            showSuccess(`Danh mục đã được ${!currentIsPrimary ? 'đánh dấu là chính' : 'bỏ đánh dấu chính'} thành công!`)
        } catch (error: any) {
            console.error('Failed to toggle category primary status', error)
            showError(`Lỗi: ${error.message || 'Không thể cập nhật trạng thái danh mục'}`)
        } finally {
            setLoadingStates(prev => ({ ...prev, categories: { ...prev.categories, [categoryId]: false } }))
        }
    }

    // Helper functions for calculations
    // Kích thước theo mm, diện tích m², thể tích m³
    const calculateArea = (width: number, height: number): number => {
        // width, height theo mm, area theo m²
        return (width * height) / 1000000 // mm² to m²
    }

    const calculateVolume = (width: number, height: number, depth: number): number => {
        // width, height, depth theo mm, volume theo m³
        return (width * height * depth) / 1000000000 // mm³ to m³
    }

    const calculateTotalPrice = (areaOrVolume: number, unitPrice: number): number => {
        return areaOrVolume * unitPrice
    }

    const startEditOption = (option: CustomProductOption) => {
        setEditingOption(option.id)
        setEditOptName(option.name)
        setEditOptDesc(option.description || '')
        setEditOptPrice(option.unit_price?.toString() || '')
        setEditOptWidth(option.width?.toString() || '')
        setEditOptHeight(option.height?.toString() || '')
        setEditOptDepth(option.depth?.toString() || '')
    }

    const cancelEditOption = () => {
        setEditingOption(null)
        setEditOptName('')
        setEditOptDesc('')
        setEditOptPrice('')
        setEditOptWidth('')
        setEditOptHeight('')
        setEditOptDepth('')
    }

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) {
            setError('Tên danh mục không được để trống')
            return
        }

        try {
            setSubmitting(true)
            setError(null)
            setSuccess(null)

            const { error } = await supabase
                .from('custom_product_categories')
                .update({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                    is_primary: editIsPrimary
                })
                .eq('id', id)

            if (error) throw error

            setSuccess(`Danh mục "${editName.trim()}" đã được cập nhật thành công!`)
            await fetchData()
            cancelEdit()

            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (e: any) {
            setError(e.message || 'Không thể cập nhật danh mục')
        } finally {
            setSubmitting(false)
        }
    }

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
            const { data: cats, error: catsError } = await supabase
                .from('custom_product_categories')
                .select('*, is_primary')
                .eq('is_active', true)
                .order('order_index', { ascending: true })

            if (catsError) throw catsError
            setCategories((cats || []) as CustomProductCategory[])

            // Fetch columns and options for each category
            const colsByCat: Record<string, CustomProductColumn[]> = {}
            const optsByCol: Record<string, CustomProductOption[]> = {}

            for (const cat of cats || []) {
                const { data: catColumns, error: colsError } = await supabase
                    .from('custom_product_columns')
                    .select('*, is_primary')
                    .eq('category_id', cat.id)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true })

                if (colsError) {
                    console.error('Error fetching columns for category', cat.id, colsError)
                    continue
                }

                colsByCat[cat.id] = (catColumns || []) as CustomProductColumn[]

                for (const col of catColumns || []) {
                    const { data: colOptions, error: optsError } = await supabase
                        .from('custom_product_options')
                        .select('*, width, height, depth, area, volume, total_price, description')
                        .eq('column_id', col.id)
                        .eq('is_active', true)
                        .order('order_index', { ascending: true })

                    if (optsError) {
                        console.error('Error fetching options for column', col.id, optsError)
                        continue
                    }

                    optsByCol[col.id] = (colOptions || []) as CustomProductOption[]
                }
            }

            setColumns(colsByCat)
            setOptions(optsByCol)
        } catch (error) {
            console.error('Failed to load config', error)
            alert('Lỗi: Không thể tải dữ liệu cấu hình sản phẩm')
        } finally {
            setLoading(false)
        }
    }

    // Category handlers
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        try {
            setSubmitting(true)

            // Get the highest order_index
            const { data: maxOrder } = await supabase
                .from('custom_product_categories')
                .select('order_index')
                .order('order_index', { ascending: false })
                .limit(1)

            const nextOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0

            const { data: newCategory, error } = await supabase
                .from('custom_product_categories')
                .insert({
                    name: newCategoryName.trim(),
                    description: newCategoryDesc.trim() || null,
                    order_index: nextOrderIndex,
                    is_primary: newCategoryIsPrimary,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            setCategories(prev => [...prev, newCategory as CustomProductCategory])
            setColumns(prev => ({ ...prev, [newCategory.id]: [] }))

            setNewCategoryName('')
            setNewCategoryDesc('')
            setNewCategoryIsPrimary(false)
            setIsAddingCategory(false)
            alert('Đã thêm danh mục thành công!')
            await fetchData()
        } catch (error: any) {
            console.error('Failed to add category', error)
            alert(`Lỗi: ${error.message || 'Không thể thêm danh mục. Vui lòng thử lại.'}`)
        } finally {
            setSubmitting(false)
        }
    }

    // This function is no longer used - edit is handled inline now

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?\n\nLưu ý: Tất cả thuộc tính và tùy chọn bên trong sẽ bị xóa và không thể khôi phục.`)) {
            return
        }

        try {
            setDeletingId(categoryId)

            // Check if there are products using this category
            const { data: products } = await supabase
                .from('custom_products')
                .select('id')
                .eq('category_id', categoryId)
                .limit(1)

            if (products && products.length > 0) {
                alert(`Không thể xóa danh mục "${categoryName}" vì còn sản phẩm đang sử dụng. Vui lòng chuyển các sản phẩm sang danh mục khác trước.`)
                setDeletingId(null)
                return
            }

            // Delete all options first
            const { data: columns } = await supabase
                .from('custom_product_columns')
                .select('id')
                .eq('category_id', categoryId)

            if (columns && columns.length > 0) {
                const columnIds = columns.map(col => col.id)
                await supabase
                    .from('custom_product_options')
                    .delete()
                    .in('column_id', columnIds)
            }

            // Delete all columns
            await supabase
                .from('custom_product_columns')
                .delete()
                .eq('category_id', categoryId)

            // Delete category
            const { error } = await supabase
                .from('custom_product_categories')
                .delete()
                .eq('id', categoryId)

            if (error) throw error

            alert(`Danh mục "${categoryName}" đã được xóa thành công!`)
            await fetchData()
        } catch (error: any) {
            console.error('Failed to delete category', error)
            alert(`Lỗi: ${error.message || 'Không thể xóa danh mục. Vui lòng thử lại.'}`)
        } finally {
            setDeletingId(null)
        }
    }

    // Column handlers
    const handleAddColumn = async (categoryId: string) => {
        if (!newColName.trim()) return

        try {
            setSubmitting(true)

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            // Get the highest order_index for this category
            const { data: maxOrder } = await supabase
                .from('custom_product_columns')
                .select('order_index')
                .eq('category_id', categoryId)
                .order('order_index', { ascending: false })
                .limit(1)

            const nextOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0

            const { data: newColumn, error } = await supabase
                .from('custom_product_columns')
                .insert({
                    category_id: categoryId,
                    name: newColName.trim(),
                    description: newColDesc.trim() || null,
                    order_index: nextOrderIndex,
                    is_primary: newColIsPrimary,
                    user_id: user.id,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            // Update local state
            setColumns(prev => ({
                ...prev,
                [categoryId]: [...(prev[categoryId] || []), newColumn as CustomProductColumn]
            }))
            setOptions(prev => ({ ...prev, [newColumn.id]: [] }))

            setNewColName('')
            setNewColDesc('')
            setNewColIsPrimary(false)
            setIsAddingColumn(null)
            alert('Đã thêm thuộc tính thành công!')
            await fetchData()
        } catch (error: any) {
            console.error('Failed to add column', error)
            alert(`Lỗi: ${error.message || 'Không thể thêm thuộc tính. Vui lòng thử lại.'}`)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditColumn = async (columnId: string, categoryId: string) => {
        if (!editColName.trim()) return

        try {
            setSubmitting(true)

            const { error } = await supabase
                .from('custom_product_columns')
                .update({
                    name: editColName.trim(),
                    description: editColDesc.trim() || null,
                    is_primary: editColIsPrimary
                })
                .eq('id', columnId)

            if (error) throw error

            alert('Đã cập nhật thuộc tính thành công!')
            await fetchData()
            setEditingColumn(null)
            setEditColName('')
            setEditColDesc('')
            setEditColIsPrimary(false)
        } catch (error: any) {
            console.error('Failed to edit column', error)
            alert(`Lỗi: ${error.message || 'Không thể cập nhật thuộc tính. Vui lòng thử lại.'}`)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteColumn = async (columnId: string, columnName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa thuộc tính "${columnName}"?\n\nLưu ý: Tất cả tùy chọn thuộc thuộc tính này sẽ bị xóa và không thể khôi phục.`)) {
            return
        }

        try {
            setDeletingId(columnId)

            // Check if there are products using this column (through options)
            const { data: options } = await supabase
                .from('custom_product_options')
                .select('id')
                .eq('column_id', columnId)
                .limit(1)

            if (options && options.length > 0) {
                alert(`Không thể xóa thuộc tính "${columnName}" vì còn tùy chọn đang được sử dụng. Vui lòng xóa tất cả tùy chọn trước.`)
                setDeletingId(null)
                return
            }

            // Delete all options for this column first
            await supabase
                .from('custom_product_options')
                .delete()
                .eq('column_id', columnId)

            // Delete column
            const { error } = await supabase
                .from('custom_product_columns')
                .delete()
                .eq('id', columnId)

            if (error) throw error

            alert(`Thuộc tính "${columnName}" đã được xóa thành công!`)
            await fetchData()
        } catch (error: any) {
            console.error('Failed to delete column', error)
            alert(`Lỗi: ${error.message || 'Không thể xóa thuộc tính. Vui lòng thử lại.'}`)
        } finally {
            setDeletingId(null)
        }
    }

    const handleAddOption = async (columnId: string) => {
        if (!newOptName.trim()) return

        try {
            setSubmitting(true)

            // Get the highest order_index for this column
            const { data: maxOrder } = await supabase
                .from('custom_product_options')
                .select('order_index')
                .eq('column_id', columnId)
                .order('order_index', { ascending: false })
                .limit(1)

            const nextOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0

            // Parse dimensions
            const width = parseFloat(newOptWidth) || 0
            const height = parseFloat(newOptHeight) || 0
            const depth = parseFloat(newOptDepth) || 0
            const unitPrice = parseFloat(newOptPrice) || 0

            // Calculate area and volume
            const area = calculateArea(width, height)
            const volume = calculateVolume(width, height, depth)

            const { data: newOption, error } = await supabase
                .from('custom_product_options')
                .insert({
                    column_id: columnId,
                    name: newOptName.trim(),
                    description: newOptDesc.trim() || null,
                    unit_price: unitPrice,
                    width: width,
                    height: height,
                    depth: depth,
                    area: area,
                    volume: volume,
                    order_index: nextOrderIndex,
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            // Update local state
            setOptions(prev => ({
                ...prev,
                [columnId]: [...(prev[columnId] || []), newOption as CustomProductOption]
            }))

            setNewOptName('')
            setNewOptDesc('')
            setNewOptPrice('')
            setNewOptWidth('')
            setNewOptHeight('')
            setNewOptDepth('')
            setAddingOptionToCol(null)
            alert('Đã thêm tùy chọn thành công!')
            await fetchData()
        } catch (error: any) {
            console.error('Failed to add option', error)
            alert(`Lỗi: ${error.message || 'Không thể thêm tùy chọn. Vui lòng thử lại.'}`)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteOption = async (id: string, optionName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tùy chọn "${optionName}"?`)) {
            return
        }

        try {
            setDeletingId(id)

            // Check if there are products using this option
            const { data: products } = await supabase
                .from('custom_products')
                .select('id')
                .eq('option_id', id)
                .limit(1)

            if (products && products.length > 0) {
                alert(`Không thể xóa tùy chọn "${optionName}" vì còn sản phẩm đang sử dụng. Vui lòng chuyển sản phẩm sang tùy chọn khác trước.`)
                setDeletingId(null)
                return
            }

            // Delete option
            const { error } = await supabase
                .from('custom_product_options')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert(`Tùy chọn "${optionName}" đã được xóa thành công!`)
            await fetchData()
        } catch (error: any) {
            console.error('Failed to delete option', error)
            alert(`Lỗi: ${error.message || 'Không thể xóa tùy chọn. Vui lòng thử lại.'}`)
        } finally {
            setDeletingId(null)
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
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={newCategoryIsPrimary}
                                onChange={e => setNewCategoryIsPrimary(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Danh mục chính (header màu đỏ)
                            </span>
                        </label>
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
                                    setNewCategoryIsPrimary(false)
                                }}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification */}
            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-green-800">{success}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setSuccess(null)}
                                className="text-green-600 hover:text-green-500"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Notification */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-500"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                    >
                        {editingId === category.id ? (
                            // Edit mode
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Tên danh mục <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Ví dụ: Nội thất"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Mô tả</label>
                                    <input
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Ghi chú mô tả cho danh mục"
                                    />
                                </div>
                                <div className="flex items-center space-x-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={editIsPrimary}
                                            onChange={(e) => setEditIsPrimary(e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Danh mục chính (header màu đỏ)
                                        </span>
                                    </label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => handleUpdate(category.id)}
                                        disabled={submitting || !editName.trim()}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {submitting ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={submitting}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // View mode
                            <>
                                {/* Category Header */}
                                <div className={`p-4 ${category.is_primary ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-6 h-6 text-white" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                                                <p className={`${category.is_primary ? 'text-red-100' : 'text-blue-100'} text-sm`}>{category.description}</p>
                                                {category.is_primary && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800 mt-1">
                                                        Chính
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={category.is_primary || false}
                                                    onChange={(e) => handleToggleCategoryPrimary(category.id, category.is_primary || false)}
                                                    disabled={loadingStates.categories[category.id]}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-xs text-white font-medium">Chính</span>
                                            </label>
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
                                                onClick={() => startEdit(category)}
                                                className="p-1 text-white hover:bg-white/20 rounded"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                                disabled={deletingId === category.id}
                                                className="p-1 text-white hover:bg-red-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingId === category.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Category Content */}
                        {expandedCategories.has(category.id) && (
                            <div className="p-4">
                                {/* Add Column Button */}
                                <button
                                    onClick={() => {
                                        setIsAddingColumn(category.id)
                                        setAddingColumnCategory(category)
                                        // Auto-detect primary status based on category name
                                        updatePrimaryStatus('', category.name)
                                    }}
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
                                                onChange={e => {
                                                    setNewColName(e.target.value)
                                                    updatePrimaryStatus(e.target.value, addingColumnCategory?.name)
                                                }}
                                                placeholder="Tên thuộc tính (VD: Kích thước, Màu sắc)"
                                                className="p-2 border rounded text-black"
                                            />
                                            <input
                                                value={newColDesc}
                                                onChange={e => setNewColDesc(e.target.value)}
                                                placeholder="Mô tả thuộc tính"
                                                className="p-2 border rounded text-black"
                                            />
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={newColIsPrimary}
                                                    onChange={e => setNewColIsPrimary(e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Cột chính (có kích thước và giá)
                                                    {newColIsPrimary && (isAutoDetectedFromName() || isAutoDetectedFromCategory()) && (
                                                        <span className="text-xs text-blue-600 ml-1">
                                                            (tự động{isAutoDetectedFromName() ? ' - tên' : isAutoDetectedFromCategory() ? ' - danh mục' : ''})
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                            {newColIsPrimary && (
                                                <div className="mt-3 p-3 bg-white border border-blue-300 rounded-lg">
                                                    <h5 className="text-sm font-medium mb-2 text-gray-700">Thông tin kích thước và giá (mặc định)</h5>
                                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                                        <input
                                                            type="number"
                                                            value={newOptWidth}
                                                            onChange={e => setNewOptWidth(e.target.value)}
                                                            placeholder="Ngang (mm)"
                                                            className="p-2 border rounded text-sm text-black"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={newOptHeight}
                                                            onChange={e => setNewOptHeight(e.target.value)}
                                                            placeholder="Cao (mm)"
                                                            className="p-2 border rounded text-sm text-black"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={newOptDepth}
                                                            onChange={e => setNewOptDepth(e.target.value)}
                                                            placeholder="Sâu (mm)"
                                                            className="p-2 border rounded text-sm text-black"
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={newOptPrice}
                                                        onChange={e => setNewOptPrice(e.target.value)}
                                                        placeholder="Đơn giá (VND/m²)"
                                                        className="p-2 border rounded text-sm text-black w-full mb-2"
                                                    />
                                                    {(newOptWidth && newOptHeight) && (
                                                        <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded space-y-1">
                                                            <div>Diện tích: {calculateArea(parseFloat(newOptWidth), parseFloat(newOptHeight)).toFixed(3)} m²</div>
                                                            {newOptDepth && <div>Thể tích: {calculateVolume(parseFloat(newOptWidth), parseFloat(newOptHeight), parseFloat(newOptDepth)).toFixed(4)} m³</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                                    setAddingColumnCategory(null)
                                                    setNewColName('')
                                                    setNewColDesc('')
                                                    setNewColIsPrimary(false)
                                                    setNewOptWidth('')
                                                    setNewOptHeight('')
                                                    setNewOptDepth('')
                                                    setNewOptPrice('')
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
                                                    {column.is_primary && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                                            Chính
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        ({(options[column.id] || []).length} tùy chọn)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            startEditColumn(column)
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteColumn(column.id, column.name)
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
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editColIsPrimary}
                                                                        onChange={e => setEditColIsPrimary(e.target.checked)}
                                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-xs font-medium text-gray-700">
                                                                        Cột chính (có kích thước và giá)
                                                                    </span>
                                                                </label>
                                                                {editColIsPrimary && (
                                                                    <div className="mt-2 p-2 bg-white border border-blue-300 rounded">
                                                                        <h6 className="text-xs font-medium mb-1 text-gray-700">Thông tin kích thước và giá (mặc định)</h6>
                                                                        <div className="grid grid-cols-3 gap-1 mb-1">
                                                                            <input
                                                                                type="number"
                                                                                value={editOptWidth}
                                                                                onChange={e => setEditOptWidth(e.target.value)}
                                                                                placeholder="Ngang (mm)"
                                                                                className="p-1 border rounded text-xs text-black"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={editOptHeight}
                                                                                onChange={e => setEditOptHeight(e.target.value)}
                                                                                placeholder="Cao (mm)"
                                                                                className="p-1 border rounded text-xs text-black"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={editOptDepth}
                                                                                onChange={e => setEditOptDepth(e.target.value)}
                                                                                placeholder="Sâu (mm)"
                                                                                className="p-1 border rounded text-xs text-black"
                                                                            />
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            value={editOptPrice}
                                                                            onChange={e => setEditOptPrice(e.target.value)}
                                                                            placeholder="Đơn giá (VND/m²)"
                                                                            className="p-1 border rounded text-xs text-black w-full mb-1"
                                                                        />
                                                                        {(editOptWidth && editOptHeight) && (
                                                                            <div className="text-xs text-gray-600 bg-gray-50 p-1 rounded space-y-1">
                                                                                <div>Diện tích: {calculateArea(parseFloat(editOptWidth), parseFloat(editOptHeight)).toFixed(3)} m²</div>
                                                                                {editOptDepth && <div>Thể tích: {calculateVolume(parseFloat(editOptWidth), parseFloat(editOptHeight), parseFloat(editOptDepth)).toFixed(4)} m³</div>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
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
                                                                        setEditColIsPrimary(false)
                                                                        setEditOptWidth('')
                                                                        setEditOptHeight('')
                                                                        setEditOptDepth('')
                                                                        setEditOptPrice('')
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
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">{option.name}</p>
                                                                    {column.is_primary ? (
                                                                        <div className="text-xs text-gray-500 space-y-1">
                                                                            {option.description && <p>{option.description}</p>}
                                                                            {(option.width && option.height) && (
                                                                                <p>Kích thước: {option.width} × {option.height}{option.depth ? ` × ${option.depth}` : ''} mm</p>
                                                                            )}
                                                                            {option.area && option.area > 0 && (
                                                                                <p>Diện tích: {option.area.toFixed(3)} m²</p>
                                                                            )}
                                                                            {option.volume && option.volume > 0 && (
                                                                                <p>Thể tích: {option.volume.toFixed(4)} m³</p>
                                                                            )}
                                                                            <p>Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(option.unit_price || 0)}/m²</p>
                                                                            {option.total_price && option.total_price > 0 && (
                                                                                <p>Giá thành: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(option.total_price)}</p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-500">
                                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(option.unit_price || 0)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteOption(option.id, option.name)}
                                                                    className="text-red-400 hover:text-red-600 ml-2"
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
                                                                {column.is_primary ? (
                                                                    <>
                                                                        <input
                                                                            value={newOptDesc}
                                                                            onChange={e => setNewOptDesc(e.target.value)}
                                                                            placeholder="Mô tả"
                                                                            className="p-1 border rounded text-sm text-black"
                                                                        />
                                                                        <div className="grid grid-cols-3 gap-1">
                                                                            <input
                                                                                type="number"
                                                                                value={newOptWidth}
                                                                                onChange={e => setNewOptWidth(e.target.value)}
                                                                                placeholder="Ngang (mm)"
                                                                                className="p-1 border rounded text-sm text-black"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={newOptHeight}
                                                                                onChange={e => setNewOptHeight(e.target.value)}
                                                                                placeholder="Cao (mm)"
                                                                                className="p-1 border rounded text-sm text-black"
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                value={newOptDepth}
                                                                                onChange={e => setNewOptDepth(e.target.value)}
                                                                                placeholder="Sâu (mm)"
                                                                                className="p-1 border rounded text-sm text-black"
                                                                            />
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            value={newOptPrice}
                                                                            onChange={e => setNewOptPrice(e.target.value)}
                                                                            placeholder="Đơn giá (VND/m²)"
                                                                            className="p-1 border rounded text-sm text-black"
                                                                        />
                                                                        {(newOptWidth && newOptHeight) && (
                                                                            <div className="text-xs text-gray-600 bg-gray-100 p-1 rounded space-y-1">
                                                                                <div>Diện tích: {calculateArea(parseFloat(newOptWidth), parseFloat(newOptHeight)).toFixed(3)} m²</div>
                                                                                {newOptDepth && <div>Thể tích: {calculateVolume(parseFloat(newOptWidth), parseFloat(newOptHeight), parseFloat(newOptDepth)).toFixed(4)} m³</div>}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        value={newOptPrice}
                                                                        onChange={e => setNewOptPrice(e.target.value)}
                                                                        placeholder="Giá (VND)"
                                                                        className="p-1 border rounded text-sm text-black"
                                                                    />
                                                                )}
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

