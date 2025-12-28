import React, { useState, useEffect, Fragment } from 'react'
import {
    Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown,
    Settings, Check, Star, StarOff, GripVertical, Crown
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
    const [options, setOptions] = useState<Record<string, any[]>>({})
    const [loading, setLoading] = useState(true)

    // Form states
    const [isAddingStructure, setIsAddingStructure] = useState(false)
    const [editingStructure, setEditingStructure] = useState<string | null>(null)

    // New structure form
    const [newStructureName, setNewStructureName] = useState('')
    const [newStructureDesc, setNewStructureDesc] = useState('')
    const [newStructureSeparator, setNewStructureSeparator] = useState(' ')
    const [newStructureCategory, setNewStructureCategory] = useState('')
    const [regularCategories, setRegularCategories] = useState<string[]>([])
    const [categorySeparators, setCategorySeparators] = useState<string[]>([])
    const [newStructureColumns, setNewStructureColumns] = useState<string[]>([])
    const [newStructureCombinations, setNewStructureCombinations] = useState<string[]>([])
    const [newStructurePrimaryColumn, setNewStructurePrimaryColumn] = useState<string>('')

    // Handle main category selection
    const handleCategorySelect = (categoryId: string) => {
        setNewStructureCategory(categoryId)
        updateAllColumns() // Recalculate all columns when main category changes
    }

    // Handle regular category selection
    const handleRegularCategorySelect = async (categoryId: string, isSelected: boolean) => {
        const newRegularCategories = isSelected
            ? [...regularCategories, categoryId]
            : regularCategories.filter(id => id !== categoryId)

        setRegularCategories(newRegularCategories)

        // Update separators array - need separators.length = totalCategories - 1
        // But when we have regular categories, we need at least 1 separator (between main and first regular)
        const totalCategories = newRegularCategories.length + (newStructureCategory ? 1 : 0)
        const requiredSeparators = newRegularCategories.length > 0 ? newRegularCategories.length : 0

        if (categorySeparators.length !== requiredSeparators) {
            const newSeparators = [...categorySeparators]
            while (newSeparators.length < requiredSeparators) {
                newSeparators.push(' - ') // Default separator
            }
            while (newSeparators.length > requiredSeparators) {
                newSeparators.pop()
            }
            setCategorySeparators(newSeparators)
        }

        await updateAllColumns() // Recalculate all columns when regular categories change
    }

    // Handle separator change
    const handleSeparatorChange = (index: number, value: string) => {
        const newSeparators = [...categorySeparators]
        newSeparators[index] = value
        setCategorySeparators(newSeparators)
    }

    // Update all columns from main category + regular categories
    const updateAllColumns = async () => {
        const allCategoryIds = [newStructureCategory, ...regularCategories].filter(Boolean)
        console.log('🔄 updateAllColumns called with:', { allCategoryIds, newStructureCategory, regularCategories })

        if (allCategoryIds.length === 0) {
            console.log('❌ No categories selected, clearing columns')
            setNewStructureColumns([])
            setNewStructurePrimaryColumn('')
            return
        }

        try {
            const allColumns: string[] = []

            for (const categoryId of allCategoryIds) {
                console.log(`🔍 Loading columns for category ${categoryId}`)
                const categoryColumns = await retryApiCall(() =>
                    customProductService.getColumnsByCategory(categoryId, false)
                )

                console.log(`📊 Category ${categoryId} returned:`, categoryColumns)

                if (categoryColumns && categoryColumns.length > 0) {
                    const columnIds = categoryColumns.map(col => col.id)
                    allColumns.push(...columnIds)
                    console.log(`✅ Added ${columnIds.length} columns from category ${categoryId}:`, columnIds)
                } else {
                    console.log(`⚠️ No columns found for category ${categoryId}`)
                }
            }

            console.log('🎯 Final allColumns:', allColumns)
            setNewStructureColumns(allColumns)

            // Set primary column to first column from main category if available
            if (newStructureCategory && allColumns.length > 0) {
                setNewStructurePrimaryColumn(allColumns[0])
            }

            console.log(`Total selected columns: ${allColumns.length}`)
        } catch (error) {
            console.error(`Failed to load columns:`, error)
            setNewStructureColumns([])
            setNewStructurePrimaryColumn('')
        }
    }

    // Edit structure form
    const [editStructureName, setEditStructureName] = useState('')
    const [editStructureDesc, setEditStructureDesc] = useState('')
    const [editStructureSeparator, setEditStructureSeparator] = useState(' ')
    const [editStructureColumns, setEditStructureColumns] = useState<string[]>([])
    const [editStructureCombinations, setEditStructureCombinations] = useState<string[]>([])
    const [editStructurePrimaryColumn, setEditStructurePrimaryColumn] = useState<string>('')

    useEffect(() => {
        loadAllData()
    }, [])

    // Helper function to add delay between API calls to prevent rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Helper function to retry API calls with exponential backoff
    const retryApiCall = async <T>(
        apiCall: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> => {
        let lastError: Error

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall()
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error))

                // Don't retry on authentication errors
                if (lastError.message.includes('Authentication failed') ||
                    lastError.message.includes('permission')) {
                    throw lastError
                }

                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    break
                }

                // Wait with exponential backoff
                const waitTime = baseDelay * Math.pow(2, attempt)
                console.log(`API call failed, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
                await delay(waitTime)
            }
        }

        throw lastError!
    }

    const loadAllData = async () => {
        setLoading(true)
        try {
            // Load all categories
            const cats = await retryApiCall(() => customProductService.getCategories(false))
            setCategories(cats)

            // Load all structures from all categories
            const allStructures: any[] = []
            const allColumns: Record<string, any[]> = {}
            const allOptions: Record<string, any[]> = {}

            for (const category of cats) {
                try {
                    // Add small delay between categories to prevent rate limiting
                    await delay(200)

                    // Load structures for this category
                    const structs = await retryApiCall(() =>
                        customProductService.getStructures(category.id, false)
                    )
                    allStructures.push(...structs.map(s => ({ ...s, category_name: category.name })))

                    // Load columns for this category
                    const cols = await retryApiCall(() =>
                        customProductService.getColumnsByCategory(category.id, false)
                    )
                    allColumns[category.id] = cols
                    console.log(`Loaded ${cols.length} columns for category ${category.id} (${category.name})`)

                    // Load options for each column with delays to prevent rate limiting
                    for (const column of cols) {
                        try {
                            // Add delay between column option requests
                            await delay(100)

                            const columnOptions = await retryApiCall(() =>
                                customProductService.getOptions(column.id, true)
                            )
                            allOptions[column.id] = columnOptions
                        } catch (error) {
                            console.error(`Failed to load options for column ${column.id}`, error)
                            allOptions[column.id] = []
                        }
                    }
                } catch (error) {
                    console.error(`Failed to load data for category ${category.id}`, error)
                    // Continue with other categories even if one fails
                }
            }

            setStructures(allStructures)
            setColumns(allColumns)
            setOptions(allOptions)
            console.log('Data loading completed:', {
                categoriesCount: cats.length,
                structuresCount: allStructures.length,
                columnsCount: Object.keys(allColumns).length,
                totalColumns: Object.values(allColumns).reduce((sum, cols) => sum + cols.length, 0)
            })
        } catch (error) {
            console.error('Failed to load all data', error)
            // Set empty arrays to prevent UI crashes
            setCategories([])
            setStructures([])
            setColumns({})
            setOptions({})

            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
            alert(`Lỗi tải dữ liệu: ${errorMessage}\n\nVui lòng kiểm tra kết nối và thử lại.`)
        } finally {
            setLoading(false)
        }
    }

    const handleAddStructure = async () => {
        if (!newStructureName || newStructureColumns.length === 0 || !newStructureCategory) return

        try {
            const payload: any = {
                category_id: newStructureCategory,
                name: newStructureName,
                description: newStructureDesc,
                column_order: newStructureColumns,
                separator: newStructureSeparator,
                column_combinations: newStructureCombinations,
                primary_column_id: newStructurePrimaryColumn
            }

            await customProductService.createStructure(payload)

            // Reset form
            setNewStructureName('')
            setNewStructureDesc('')
            setNewStructureSeparator(' ')
            setNewStructureCategory('')
            setRegularCategories([])
            setCategorySeparators([])
            setNewStructureColumns([])
            setNewStructureCombinations([])
            setNewStructurePrimaryColumn('')
            setIsAddingStructure(false)

            await loadAllData()
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
                column_combinations: editStructureCombinations,
                primary_column_id: editStructurePrimaryColumn
            })

            setEditingStructure(null)
            await loadAllData()
        } catch (error) {
            console.error('Failed to update structure', error)
            alert('Có lỗi xảy ra khi cập nhật cấu trúc')
        }
    }

    const handleDeleteStructure = async (structureId: string) => {
        if (!confirm('Bạn có chắc muốn xóa cấu trúc này?')) return

        try {
            await customProductService.deleteStructure(structureId)
            await loadAllData()
        } catch (error) {
            console.error('Failed to delete structure', error)
            alert('Có lỗi xảy ra khi xóa cấu trúc')
        }
    }

    const startEditStructure = (structure: any) => {
        setEditingStructure(structure.id)
        setEditStructureName(structure.name)
        setEditStructureDesc(structure.description || '')
        setEditStructureSeparator(structure.separator)
        setEditStructureColumns(structure.column_order)
        setEditStructureCombinations(structure.column_combinations || [])
        setEditStructurePrimaryColumn(structure.primary_column_id || '')
    }

    const cancelEdit = () => {
        setEditingStructure(null)
        setEditStructureName('')
        setEditStructureDesc('')
        setEditStructureSeparator(' ')
        setEditStructureColumns([])
        setEditStructureCombinations([])
        setEditStructurePrimaryColumn('')
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
        const targetCombinations = isEdit ? editStructureCombinations : newStructureCombinations
        const columnSetter = isEdit ? setEditStructureColumns : setNewStructureColumns
        const combinationSetter = isEdit ? setEditStructureCombinations : setNewStructureCombinations

        const index = targetColumns.indexOf(columnId)
        if (index !== -1) {
            const newColumns = targetColumns.filter(id => id !== columnId)
            columnSetter(newColumns)

            // Remove corresponding combination if exists
            if (targetCombinations.length > index) {
                const newCombinations = [...targetCombinations]
                newCombinations.splice(index, 1)
                combinationSetter(newCombinations)
            }
        }
    }

    const moveColumnInStructure = (fromIndex: number, toIndex: number, isEdit = false) => {
        const targetColumns = isEdit ? editStructureColumns : newStructureColumns
        const targetCombinations = isEdit ? editStructureCombinations : newStructureCombinations
        const columnSetter = isEdit ? setEditStructureColumns : setNewStructureColumns
        const combinationSetter = isEdit ? setEditStructureCombinations : setNewStructureCombinations

        columnSetter(moveColumn(targetColumns, fromIndex, toIndex))

        // Move combinations accordingly
        if (targetCombinations.length > 0) {
            const newCombinations = [...targetCombinations]
            if (fromIndex < toIndex) {
                // Moving down
                for (let i = fromIndex; i < toIndex; i++) {
                    [newCombinations[i], newCombinations[i + 1]] = [newCombinations[i + 1], newCombinations[i]]
                }
            } else {
                // Moving up
                for (let i = fromIndex; i > toIndex; i--) {
                    [newCombinations[i - 1], newCombinations[i - 2]] = [newCombinations[i - 2], newCombinations[i - 1]]
                }
            }
            combinationSetter(newCombinations)
        }
    }

    const updateColumnCombination = (index: number, value: string, isEdit = false) => {
        const targetCombinations = isEdit ? editStructureCombinations : newStructureCombinations
        const setter = isEdit ? setEditStructureCombinations : setNewStructureCombinations

        const newCombinations = [...targetCombinations]
        if (newCombinations.length <= index) {
            // Extend array if needed
            while (newCombinations.length <= index) {
                newCombinations.push(' ')
            }
        }
        newCombinations[index] = value
        setter(newCombinations)
    }

    const removeColumnCombination = (index: number, isEdit = false) => {
        const targetCombinations = isEdit ? editStructureCombinations : newStructureCombinations
        const setter = isEdit ? setEditStructureCombinations : setNewStructureCombinations

        const newCombinations = [...targetCombinations]
        newCombinations.splice(index, 1)
        setter(newCombinations)
    }

    const getColumnName = (columnId: string) => {
        // Find column across all categories
        for (const categoryId in columns) {
            const categoryColumns = columns[categoryId] || []
            const column = categoryColumns.find(c => c.id === columnId)
            if (column) return column.name
        }
        return 'Unknown'
    }

    const getSelectedCategoryCount = () => {
        const selectedCategoryIds = new Set<string>()
        selectedColumns.forEach(colId => {
            // Find which category this column belongs to
            for (const [catId, catColumns] of Object.entries(allColumns || {})) {
                if (catColumns.some(col => col.id === colId)) {
                    selectedCategoryIds.add(catId)
                    break
                }
            }
        })
        return selectedCategoryIds.size
    }

    const getSelectedCategories = () => {
        const categoryMap = new Map<string, { id: string, name: string, columns: any[] }>()

        selectedColumns.forEach(colId => {
            // Find which category this column belongs to
            for (const [catId, catColumns] of Object.entries(allColumns || {})) {
                const column = catColumns.find(col => col.id === colId)
                if (column) {
                    const category = categories.find(cat => cat.id === catId)
                    if (category && !categoryMap.has(catId)) {
                        categoryMap.set(catId, {
                            id: catId,
                            name: category.name,
                            columns: []
                        })
                    }
                    if (categoryMap.has(catId)) {
                        categoryMap.get(catId)!.columns.push(column)
                    }
                    break
                }
            }
        })

        // Sort columns within each category by their order in selectedColumns
        categoryMap.forEach(categoryInfo => {
            categoryInfo.columns.sort((a, b) => {
                const indexA = selectedColumns.indexOf(a.id)
                const indexB = selectedColumns.indexOf(b.id)
                return indexA - indexB
            })
        })

        return Array.from(categoryMap.values())
    }

    const generatePreview = (columnOrder: string[], combinations: string[] | null = null, selectedCategory?: string) => {
        // Ensure combinations is an array, default to empty array if null
        const safeCombinations = combinations || []

        const parts: string[] = []

        // Add category name as first part if category is selected
        if (selectedCategory) {
            const category = categories.find(cat => cat.id === selectedCategory)
            if (category) {
                parts.push(category.name)
                // Add separator between category name and first column
                if (columnOrder.length > 0) {
                    parts.push(' - ')
                }
            }
        }

        columnOrder.forEach((columnId, index) => {
            // Find column across all categories
            let column = null
            for (const categoryId in columns) {
                column = columns[categoryId]?.find(c => c.id === columnId)
                if (column) break
            }

            const columnOptions = options[columnId] || []

            if (column) {
                // Show first option name if available, otherwise show column name
                const displayName = columnOptions.length > 0 ? columnOptions[0].name : column.name
                parts.push(displayName)

                // Add combination separator if not the last column
                if (index < columnOrder.length - 1) {
                    const combination = safeCombinations[index] || ' '
                    parts.push(combination)
                }
            }
        })

        return parts.join('')
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

            {/* Add Structure Form */}
            {isAddingStructure && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm cấu trúc mới</h3>
                    {console.log('Rendering StructureForm with:', {
                        newStructureCategory,
                        availableColumns: newStructureCategory ? columns[newStructureCategory] || [] : [],
                        columnsKeys: Object.keys(columns),
                        categoriesCount: categories.length
                    })}
                    <StructureForm
                        name={newStructureName}
                        setName={setNewStructureName}
                        description={newStructureDesc}
                        setDescription={setNewStructureDesc}
                        separator={newStructureSeparator}
                        setSeparator={setNewStructureSeparator}
                        category={newStructureCategory}
                        setCategory={handleCategorySelect}
                        regularCategories={regularCategories}
                        onRegularCategorySelect={handleRegularCategorySelect}
                        categorySeparators={categorySeparators}
                        onSeparatorChange={handleSeparatorChange}
                        categories={categories}
                        selectedColumns={newStructureColumns}
                        selectedCombinations={newStructureCombinations}
                        primaryColumn={newStructurePrimaryColumn}
                        setPrimaryColumn={setNewStructurePrimaryColumn}
                        onAddColumn={(id) => addColumnToStructure(id)}
                        onRemoveColumn={(id) => removeColumnFromStructure(id)}
                        onMoveColumn={(from, to) => moveColumnInStructure(from, to)}
                        onUpdateCombination={(index, value) => updateColumnCombination(index, value)}
                        availableColumns={Object.values(columns).flat()} // Show all columns from all categories
                        allColumns={columns} // Pass full columns data for debugging
                        key={`new-structure-${newStructureCategory}`} // Force re-render when category changes
                        preview={generatePreview(newStructureColumns, newStructureCombinations, newStructureCategory)}
                        onSave={handleAddStructure}
                        onCancel={() => {
                            setIsAddingStructure(false)
                            setNewStructureName('')
                            setNewStructureDesc('')
                            setNewStructureSeparator(' ')
                            setNewStructureCategory('')
                            setRegularCategories([])
                            setCategorySeparators([])
                            setNewStructureColumns([])
                            setNewStructureCombinations([])
                            setNewStructurePrimaryColumn('')
                        }}
                    />
                </div>
            )}

            {/* Structures List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách cấu trúc</h3>
                <div className="space-y-4">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
                        </div>
                    ) : structures.length === 0 ? (
                        <div className="p-12 text-center">
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
                                            category={structure.category_id}
                                            setCategory={() => {}} // Read-only for edit
                                            categories={categories}
                                            selectedColumns={editStructureColumns}
                                            selectedCombinations={editStructureCombinations}
                                            primaryColumn={editStructurePrimaryColumn}
                                            setPrimaryColumn={setEditStructurePrimaryColumn}
                                            onAddColumn={(id) => addColumnToStructure(id, true)}
                                            onRemoveColumn={(id) => removeColumnFromStructure(id, true)}
                                            onMoveColumn={(from, to) => moveColumnInStructure(from, to, true)}
                                            onUpdateCombination={(index, value) => updateColumnCombination(index, value, true)}
                                            availableColumns={Object.values(columns).flat()} // Show all columns from all categories
                                            allColumns={columns} // Pass full columns data for debugging
                                            preview={generatePreview(editStructureColumns, editStructureCombinations, structure.category_id)}
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
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                        {structure.category_name || 'Unknown Category'}
                                                    </span>
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
                                                        {structure.column_order.map((columnId, index) => {
                                                            const isPrimary = structure.primary_column_id === columnId
                                                            return (
                                                                <span
                                                                    key={columnId}
                                                                    className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${
                                                                        isPrimary
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-blue-100 text-blue-800'
                                                                    }`}
                                                                >
                                                                    {index + 1}. {getColumnName(columnId)}
                                                                    {isPrimary && <Crown className="w-3 h-3 ml-1" />}
                                                                </span>
                                                            )
                                                        })}
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
                                                            {generatePreview(structure.column_order, structure.column_combinations, structure.category_id) || 'Chưa có cấu trúc'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            📋 [Tên danh mục] - [Các thuộc tính đã chọn]
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
            </div>
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
    category: string
    setCategory: (categoryId: string) => void
    regularCategories: string[]
    onRegularCategorySelect: (categoryId: string, isSelected: boolean) => void
    categorySeparators: string[]
    onSeparatorChange: (index: number, value: string) => void
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
    allColumns?: Record<string, CustomProductColumn[]> // For debugging
    preview: string
    onSave: () => void
    onCancel: () => void
}

function StructureForm({
    name, setName, description, setDescription, separator, setSeparator,
    category, setCategory, regularCategories, onRegularCategorySelect, categorySeparators, onSeparatorChange, categories,
    selectedColumns, selectedCombinations, primaryColumn, setPrimaryColumn,
    onAddColumn, onRemoveColumn, onMoveColumn, onUpdateCombination,
    availableColumns, allColumns, preview, onSave, onCancel
}: StructureFormProps) {

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
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-gray-900">Tạo cấu trúc sản phẩm mới</h3>
                <p className="text-gray-600">Tên danh mục + các thuộc tính đã chọn sẽ tạo thành cấu trúc hoàn chỉnh</p>
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
                        {categories.filter(cat => cat.is_primary === true || cat.is_primary === "true").length === 0
                            ? '⚠️ Không có danh mục chính nào khả dụng'
                            : 'Chọn danh mục chính...'}
                    </option>
                    {categories
                        .filter(cat => cat.is_primary === true || cat.is_primary === "true")
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

            {/* 3. Danh mục thường - CHỌN THÊM CATEGORIES KHÁC */}
            {category && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                        🌿 Danh mục thường
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                        Chọn thêm các danh mục khác để tổ hợp thuộc tính vào cấu trúc sản phẩm
                    </p>

                    {/* Available regular categories */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categories
                            .filter(cat => cat.id !== category && !cat.is_primary)
                            .map(cat => {
                                const isSelected = regularCategories.includes(cat.id)
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => onRegularCategorySelect(cat.id, !isSelected)}
                                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-100 text-green-800'
                                                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <div className="font-medium">{cat.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {isSelected ? '✓ Đã chọn' : 'Chọn'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>

                    {/* Selected regular categories summary */}
                    {regularCategories.length > 0 && (
                        <div className="mt-4">
                            <span className="text-sm font-medium text-green-700">Đã chọn:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {regularCategories.map(catId => {
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
            {(category || regularCategories.length > 0) && (
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                        🔗 Cấu trúc hoàn chỉnh
                    </label>

                    {/* Cấu trúc danh mục với separators */}
                    <div className="mb-4">
                        <span className="text-sm font-medium text-purple-700 mb-3 block">Cấu trúc danh mục:</span>
                        <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg border border-purple-200">
                            {/* Main category */}
                            {category && (
                                <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm">
                                    {categories.find(cat => cat.id === category)?.name}
                                </span>
                            )}

                            {/* Show separator and regular categories if any */}
                            {regularCategories.length > 0 && (
                                <>
                                    {/* Separator between main and first regular category */}
                                    <input
                                        type="text"
                                        value={categorySeparators[0] || ' - '}
                                        onChange={(e) => onSeparatorChange(0, e.target.value)}
                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder=" - "
                                    />

                                    {/* Regular categories with separators */}
                                    {regularCategories.map((catId, index) => {
                                        const cat = categories.find(c => c.id === catId)
                                        const separatorIndex = index + 1 // Offset by 1 since first separator is before first regular category
                                        return cat ? (
                                            <React.Fragment key={catId}>
                                                {/* Separator input - between regular categories */}
                                                {index > 0 && (
                                                    <input
                                                        type="text"
                                                        value={categorySeparators[separatorIndex] || ' - '}
                                                        onChange={(e) => onSeparatorChange(separatorIndex, e.target.value)}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder=" - "
                                                    />
                                                )}

                                                {/* Category */}
                                                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                                                    {cat.name}
                                                </span>
                                            </React.Fragment>
                                        ) : null
                                    })}
                                </>
                            )}
                        </div>

                        {/* Preview of structure name */}
                        <div className="mt-3">
                            <span className="text-xs text-gray-700">Xem trước tên cấu trúc:</span>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono font-bold text-black">
                                {(() => {
                                    let preview = ''
                                    if (category) {
                                        const mainCat = categories.find(cat => cat.id === category)
                                        if (mainCat) preview += mainCat.name
                                    }

                                    regularCategories.forEach((catId, index) => {
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

                    {/* Tất cả thuộc tính của danh mục đã chọn */}
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
                            ⭐ Thuộc tính chính | Tất cả thuộc tính sẽ được kết hợp theo thứ tự này
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
                                <div className="text-lg font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border">
                                    {category && (
                                        <>
                                            {categories.find(cat => cat.id === category)?.name}
                                            {selectedColumns.length > 0 && (
                                                <>
                                                    {selectedColumns.map((columnId, index) => {
                                                        const column = availableColumns.find(col => col.id === columnId)
                                                        return (
                                                            <span key={columnId}>
                                                                {' - '}{column?.name || 'Cột'}
                                                            </span>
                                                        )
                                                    })}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-3 space-y-1">
                            <p><strong>📋 Logic:</strong> Chọn danh mục chính → Tự động tổ hợp tất cả thuộc tính</p>
                            <p><strong>✨ Ví dụ:</strong> {category ? categories.find(cat => cat.id === category)?.name : 'Danh mục'} - Thuộc tính 1 - Thuộc tính 2</p>
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
                    disabled={!name.trim() || selectedColumns.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                    💾 Lưu cấu trúc
                </button>
            </div>
        </div>
    )
}
