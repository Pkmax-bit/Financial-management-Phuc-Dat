import React, { useState, useEffect, Fragment, useRef, useCallback } from 'react'
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

    // Data loading state
    const [error, setError] = useState<string | null>(null)

    // Debounce timer for column updates
    const updateColumnsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Form states
    const [isAddingStructure, setIsAddingStructure] = useState(false)
    const [editingStructure, setEditingStructure] = useState<string | null>(null)

    // New structure form
    const [newStructureName, setNewStructureName] = useState('')
    const [newStructureDesc, setNewStructureDesc] = useState('')
    const [newStructureSeparator, setNewStructureSeparator] = useState(' - ')
    const [newStructureCategory, setNewStructureCategory] = useState('')
    const [regularCategories, setRegularCategories] = useState<string[]>([])
    const safeRegularCategories = Array.isArray(regularCategories) ? regularCategories : []
    const [categorySeparators, setCategorySeparators] = useState<string[]>([])
    const [newStructureColumns, setNewStructureColumns] = useState<string[]>([])
    const [newStructureCombinations, setNewStructureCombinations] = useState<string[]>([])
    const [newStructurePrimaryColumn, setNewStructurePrimaryColumn] = useState<string>('')

    // Handle main category selection
    const handleCategorySelect = (categoryId: string) => {
        setNewStructureCategory(categoryId)
        setRegularCategories([])
        setCategorySeparators([])
        setNewStructureColumns([])
        setNewStructureCombinations([])
        setNewStructurePrimaryColumn('')

        // Load columns for the selected category on demand
        loadCategoryDataOnDemand(categoryId)
    }

    // Handle regular category selection
    const handleRegularCategorySelect = async (categoryId: string, isSelected: boolean) => {
        let newRegularCategories

        if (isSelected) {
            // Add category if not already selected (prevent duplicates)
            if (!safeRegularCategories.includes(categoryId)) {
                newRegularCategories = [...safeRegularCategories, categoryId]
            } else {
                newRegularCategories = safeRegularCategories // No change if already selected
            }
        } else {
            // Remove category
            newRegularCategories = safeRegularCategories.filter(id => id !== categoryId)
        }

        console.log('handleRegularCategorySelect:', {
            categoryId,
            isSelected,
            oldRegularCategories: safeRegularCategories,
            newRegularCategories,
            wasDuplicate: isSelected && safeRegularCategories.includes(categoryId)
        })

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

        // Load data for newly added categories on demand
        if (isSelected && !columns[categoryId]) {
            loadCategoryDataOnDemand(categoryId)
        }
    }

    // Handle separator change
    const handleSeparatorChange = (index: number, value: string) => {
        const newSeparators = [...categorySeparators]
        newSeparators[index] = value
        setCategorySeparators(newSeparators)
    }

    // Column loading is now handled by loadCategoryDataOnDemand

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

    // Load all structures and their columns when categories are loaded
    useEffect(() => {
        const loadAllStructuresAndColumns = async () => {
            if (categories.length > 0) {
                console.log('Loading structures and columns for all categories...')
                const structurePromises = categories.map(async (category) => {
                    try {
                        const structs = await retryApiCall(() =>
                            customProductService.getStructures(category.id, false)
                        )
                        return structs.map(s => ({
                            ...s,
                            category_name: category.name
                        }))
                    } catch (error) {
                        console.error(`Failed to load structures for category ${category.id}`, error)
                        return []
                    }
                })

                const columnPromises = categories.map(async (category) => {
                    try {
                        const cols = await retryApiCall(() =>
                            customProductService.getColumnsByCategory(category.id, false)
                        )
                        return { categoryId: category.id, columns: cols }
                    } catch (error) {
                        console.error(`Failed to load columns for category ${category.id}`, error)
                        return { categoryId: category.id, columns: [] }
                    }
                })

                const [structureResults, columnResults] = await Promise.all([
                    Promise.all(structurePromises),
                    Promise.all(columnPromises)
                ])

                const allStructures = structureResults.flat()
                const allColumns: Record<string, any[]> = {}
                columnResults.forEach(({ categoryId, columns }) => {
                    allColumns[categoryId] = columns
                })

                setStructures(allStructures)
                setColumns(allColumns)
                console.log(`Loaded ${allStructures.length} structures and ${Object.keys(allColumns).length} column sets from ${categories.length} categories`)
            }
        }

        loadAllStructuresAndColumns()
    }, [categories])

    // No initial loading of all data - load on demand only

    // Helper function to add delay between API calls to prevent rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Helper function to retry API calls with exponential backoff
    const retryApiCall = async function <T>(
        apiCall: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
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
            // Load categories only - structures and columns will be loaded on demand
            const cats = await retryApiCall(() => customProductService.getCategories(false))
            setCategories(cats)

            // Initialize empty structures and columns - will be loaded on demand
            setStructures([])
            setColumns({})
            setOptions({})

            console.log(`Loaded ${cats.length} categories. Structures and columns will be loaded on demand to reduce API calls.`)
        } catch (error) {
            console.error('Failed to load categories:', error)
            setError('Failed to load categories. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Load category data on demand (structures and columns)
    const loadCategoryDataOnDemand = useCallback(async (categoryId: string) => {
        try {
            // Load structures for this category if not loaded
            if (!structures.some(s => s.category_id === categoryId)) {
                const category = categories.find(cat => cat.id === categoryId)
                if (category) {
                    const structs = await retryApiCall(() =>
                        customProductService.getStructures(categoryId, false)
                    )
                    const structuresWithCategory = structs.map(s => ({
                        ...s,
                        category_name: category.name
                    }))
                    setStructures(prev => [...prev, ...structuresWithCategory])
                    console.log(`Loaded ${structuresWithCategory.length} structures for category ${categoryId}`)
                }
            }

            // Load columns for this category if not loaded
            if (!columns[categoryId]) {
                const cols = await retryApiCall(() =>
                    customProductService.getColumnsByCategory(categoryId, false)
                )
                setColumns(prev => ({
                    ...prev,
                    [categoryId]: cols
                }))
                console.log(`Loaded ${cols.length} columns for category ${categoryId}`)
            }
        } catch (error) {
            console.error(`Failed to load data for category ${categoryId}:`, error)
        }
    }, [categories, structures, columns])

    const handleAddStructure = async () => {
        if (!newStructureName || newStructureColumns.length === 0 || !newStructureCategory) return

        try {
            const payload: any = {
                category_id: newStructureCategory,
                name: newStructureName,
                description: newStructureDesc,
                column_order: newStructureColumns,
                separator: newStructureSeparator,
                primary_column_id: newStructurePrimaryColumn,
                is_default: false // New structures are created as non-default
            }

            await customProductService.createStructure(payload)

            // Reset form
            setNewStructureName('')
            setNewStructureDesc('')
            setNewStructureSeparator(' - ')
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
            // Load options for the newly added column if not already loaded
            if (!options[columnId]) {
                customProductService.getOptions(columnId, true).then(columnOptions => {
                    setOptions(prev => ({
                        ...prev,
                        [columnId]: columnOptions
                    }))
                    console.log(`Loaded ${columnOptions.length} options for column ${columnId}`)
                }).catch(error => {
                    console.error(`Failed to load options for column ${columnId}:`, error)
                    setOptions(prev => ({
                        ...prev,
                        [columnId]: []
                    }))
                })
            }
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
        if (!columns) return 'Loading...'
        for (const categoryId in columns) {
            const categoryColumns = columns[categoryId] || []
            const column = categoryColumns.find(c => c.id === columnId)
            if (column) return column.name
        }
        return 'Unknown'
    }

    const getSelectedCategoryCount = (selectedColumns: string[], columnsParam: Record<string, any[]>) => {
        const selectedCategoryIds = new Set<string>()
        selectedColumns.forEach(colId => {
            // Find which category this column belongs to
            for (const [catId, catColumns] of Object.entries(columnsParam || {})) {
                if (catColumns.some((col: any) => col.id === colId)) {
                    selectedCategoryIds.add(catId)
                    break
                }
            }
        })
        return selectedCategoryIds.size
    }

    const getSelectedCategories = (selectedColumns: string[], columnsParam: Record<string, any[]>, categories: any[]) => {
        const categoryMap = new Map<string, { id: string, name: string, columns: any[] }>()

        selectedColumns.forEach(colId => {
            // Find which category this column belongs to
            for (const [catId, catColumns] of Object.entries(columnsParam || {})) {
                const column = catColumns.find((col: any) => col.id === colId)
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

    const generatePreview = (columnOrder: string[], combinations: string[] | null = null, selectedCategory?: string, regularCategories?: string[], columnsParam?: Record<string, any[]>) => {
        // Ensure combinations is an array, default to empty array if null
        const safeCombinations = combinations || []

        // Group columns by category in the correct order: main category first, then regular categories
        const categoryOrder: string[] = []
        const columnsByCategory: { [categoryId: string]: string[] } = {}

        // Add main category first
        if (selectedCategory) {
            categoryOrder.push(selectedCategory)
            columnsByCategory[selectedCategory] = []
        }

        // Add regular categories in order
        if (regularCategories) {
            regularCategories.forEach(catId => {
                categoryOrder.push(catId)
                columnsByCategory[catId] = []
            })
        }

        // Group selected columns by their category
        columnOrder.forEach(columnId => {
            for (const categoryId of categoryOrder) {
                const categoryColumns = columnsParam?.[categoryId] || []
                if (categoryColumns.some(col => col.id === columnId)) {
                    columnsByCategory[categoryId].push(columnId)
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

        // Get column groups in category order (ensuring each category contributes one attribute to each combination)
        const columnGroups: string[][] = categoryOrder
            .filter(catId => columnsByCategory[catId].length > 0)
            .map(catId => columnsByCategory[catId])

        // Generate all possible combinations using Cartesian product
        const allCombinations = generateCartesianProduct(columnGroups)

        // Convert combinations to display names (limit to first 3 examples)
        const previewExamples = allCombinations.slice(0, 3).map(combination => {
            return combination.map((columnId, index) => {
                let column = null
                for (const categoryId in columnsParam) {
                    column = columnsParam?.[categoryId]?.find(c => c.id === columnId)
                    if (column) break
                }

                const columnOptions = (options && options[columnId]) || []
                const displayName = columnOptions.length > 0 ? columnOptions[0].name : (column?.name || 'Thuộc tính')

                // Add separator between attributes
                return index < combination.length - 1 ? displayName + ' - ' : displayName
            }).join('')
        })

        // Return preview with examples
        if (previewExamples.length === 0) {
            return 'Chưa có tổ hợp nào'
        } else if (previewExamples.length === 1) {
            return previewExamples[0]
        } else {
            return previewExamples.join('\n') + (allCombinations.length > 3 ? `\n... và ${allCombinations.length - 3} tổ hợp khác` : '')
        }
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
                        allColumns={columns || {}} // Pass full columns data for debugging
                        key={`new-structure-${newStructureCategory}`} // Force re-render when category changes
                        preview={generatePreview(newStructureColumns, newStructureCombinations, newStructureCategory, regularCategories, columns)}
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
                                            setCategory={() => { }} // Read-only for edit
                                            regularCategories={[]} // Read-only for edit
                                            onRegularCategorySelect={() => { }} // Read-only for edit
                                            categorySeparators={[]} // Read-only for edit
                                            onSeparatorChange={() => { }} // Read-only for edit
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
                                            allColumns={columns || {}} // Pass full columns data for debugging
                                            preview={generatePreview(editStructureColumns, editStructureCombinations, structure.category_id, [], columns)}
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
                                                                    className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${isPrimary
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
                                                            {generatePreview(structure.column_order, structure.column_combinations, structure.category_id, [], columns) || 'Chưa có tổ hợp nào'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            📋 Tổ hợp thuộc tính từ các danh mục khác nhau
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

// StructureForm component - handles form for creating/editing structures
function StructureForm({
    name, setName, description, setDescription, separator, setSeparator,
    category, setCategory, regularCategories = [], onRegularCategorySelect, categorySeparators, onSeparatorChange, categories,
    selectedColumns, selectedCombinations, primaryColumn, setPrimaryColumn,
    onAddColumn, onRemoveColumn, onMoveColumn, onUpdateCombination,
    availableColumns, allColumns, preview, onSave, onCancel
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
                        {(() => {
                            const availableRegularCategories = categories.filter(cat => cat.id !== category && !cat.is_primary)
                            console.log(`Available regular categories: ${availableRegularCategories.length}`, availableRegularCategories.map(cat => cat.name))
                            return availableRegularCategories
                        })()
                            .map(cat => {
                                const isSelected = safeRegularCategories.includes(cat.id)
                                console.log(`Available category: ${cat.name} (${cat.id}) - selected: ${isSelected}`)
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => onRegularCategorySelect(cat.id, !isSelected)}
                                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${isSelected
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
            {(category || safeRegularCategories.length > 0) && (
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
                            {safeRegularCategories.length > 0 && (
                                <>
                                    {/* Regular categories with separators */}
                                    {safeRegularCategories.map((catId, index) => {
                                        const cat = categories.find(c => c.id === catId)
                                        return cat ? (
                                            <React.Fragment key={catId}>
                                                {/* Separator before each regular category (including first one) */}
                                                <input
                                                    type="text"
                                                    value={categorySeparators[index] || ' - '}
                                                    onChange={(e) => onSeparatorChange(index, e.target.value)}
                                                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder=" - "
                                                />

                                                {/* Category */}
                                                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                                                    {cat.name}
                                                </span>
                                            </React.Fragment>
                                        ) : (
                                            <React.Fragment key={catId}>
                                                <span className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
                                                    Category not found: {catId}
                                                </span>
                                            </React.Fragment>
                                        )
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

                    {/* Tất cả thuộc tính của danh mục đã chọn */}
                    <div className="mb-4">
                        <span className="text-sm font-medium text-purple-700">Thuộc tính sẽ được tổ hợp:</span>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {selectedColumns.map((columnId, index) => {
                                const column = availableColumns.find(col => col.id === columnId)
                                const isPrimary = primaryColumn === columnId
                                return (
                                    <span key={columnId} className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${isPrimary
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
                                                if (categoryColumns.some((col: any) => col.id === columnId)) {
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
                    disabled={!name.trim() || selectedColumns.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                    💾 Lưu cấu trúc
                </button>
            </div>
        </div>
    )
}
