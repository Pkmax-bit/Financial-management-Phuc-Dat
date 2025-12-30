'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X, Package, Check, Settings,
  Ruler, DollarSign, Calculator, Filter, Plus
} from 'lucide-react'
import {
  CustomProductStructure,
  CustomProductCategory,
  CustomProductColumn,
  CustomProductOption,
  SelectedOption
} from '@/types/customProduct'
import { customProductService } from '@/services/customProductService'

interface CustomProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onAddToQuote: (productData: {
    name: string
    description: string
    unit_price: number
    width?: number
    height?: number
    depth?: number
    area?: number
    volume?: number
    quantity?: number
    total_price?: number
  }) => void
}

export default function CustomProductSelectionModal({
  isOpen,
  onClose,
  onAddToQuote
}: CustomProductSelectionModalProps) {
  // Temporarily disable logging to prevent console spam
  // console.log('CustomProductSelectionModal render start')
  // Data states
  const [structures, setStructures] = useState<CustomProductStructure[]>([])
  const [categories, setCategories] = useState<CustomProductCategory[]>([])
  const [columns, setColumns] = useState<CustomProductColumn[]>([])
  const [options, setOptions] = useState<Record<string, CustomProductOption[]>>({})
  const [loading, setLoading] = useState(false)

  // Selection states
  const [selectedStructure, setSelectedStructure] = useState<string>('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption>>({})
  const [generatedName, setGeneratedName] = useState('')
  const [optionDetails, setOptionDetails] = useState<Array<{
    option_name: string
    column_name: string
    category_name: string
    full_text: string
  }>>([])

  // Dimensions
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    depth: 0
  })

  // Pricing
  const [unitPrice, setUnitPrice] = useState(0)

  // Filter states
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filteringColumn, setFilteringColumn] = useState<string>('')

  // Multiple selection states
  const [selectedCombinations, setSelectedCombinations] = useState<Set<string>>(new Set())
  const [currentCombinations, setCurrentCombinations] = useState<Array<{
    id: string
    options: Record<string, CustomProductOption>
    totalPrice: number
  }>>([])

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  // Load data when structure changes
  useEffect(() => {
    if (selectedStructure) {
      loadStructureData(selectedStructure)
    } else {
      setColumns([])
      setOptions({})
      setSelectedOptions({})
      setGeneratedName('')
    }
  }, [selectedStructure])

  // Generate product name when options change
  useEffect(() => {
    if (selectedStructure && Object.keys(selectedOptions).length > 0) {
      generateProductName()
    }
  }, [selectedOptions, selectedStructure])

  // Generate sensible combinations (moved out of JSX to follow Rules of Hooks)
  const combinations = useMemo(() => {
    const structure = structures.find(s => s.id === selectedStructure)

    if (!structure || !columns.length || !Object.keys(options).length) {
      return []
    }

    const combinations: Array<{
      id: string
      options: Record<string, CustomProductOption>
      totalPrice: number
    }> = []

    // Sort columns according to structure
    const sortedColumns = [...columns].sort((a, b) => {
      if (!structure?.column_order) return 0
      const indexA = structure.column_order.indexOf(a.id)
      const indexB = structure.column_order.indexOf(b.id)
      return indexA - indexB
    })

    // Instead of Cartesian product, create sensible combinations by taking 1 option from each category
    // Prioritize options with prices, and limit to create meaningful combinations
    const getBestOptions = (columnId: string) => {
      let columnOptions = options[columnId] || []

      // Apply filters if any exist for this column
      const activeFilters = columnFilters[columnId] || []
      if (activeFilters.length > 0) {
        columnOptions = columnOptions.filter(opt => activeFilters.includes(opt.id))
      }

      // If no options after filtering, show all options (no filter applied)
      if (columnOptions.length === 0 && activeFilters.length > 0) {
        columnOptions = options[columnId] || []
      }

      // First, get options with unit_price, then add others
      const pricedOptions = columnOptions.filter(opt => opt.unit_price && opt.unit_price > 0)
      const otherOptions = columnOptions.filter(opt => !opt.unit_price || opt.unit_price === 0)

      // Return up to 3 best options per column
      return [...pricedOptions.slice(0, 2), ...otherOptions.slice(0, 1)]
    }

    const columnOptions = sortedColumns.map(col => ({
      column: col,
      options: getBestOptions(col.id)
    }))

    // Create sensible combinations by taking different combinations of options
    const createSensibleCombinations = () => {
      // Create exactly 5 distinct combinations without duplicates
      const seenCombinations = new Set<string>()
      const targetCombinations = 5

      console.log('🔢 createSensibleCombinations: creating exactly', targetCombinations, 'distinct combinations')

      let comboCount = 0

      // Strategy 1: Create base combination (first options from all columns)
      if (columnOptions.length > 0) {
        const combination1: Record<string, CustomProductOption> = {}
        let totalPrice1 = 0
        let hasAllOptions1 = true

        for (const { column, options: colOptions } of columnOptions) {
          if (colOptions.length > 0) {
            combination1[column.id] = colOptions[0]
            totalPrice1 += colOptions[0].unit_price || 0
          } else {
            hasAllOptions1 = false
            break
          }
        }

        if (hasAllOptions1) {
          const signature1 = Object.values(combination1).map(opt => opt.id).sort().join('-')
          if (!seenCombinations.has(signature1)) {
            seenCombinations.add(signature1)
            combinations.push({
              id: `${Object.values(combination1).map(opt => opt.id).join('-')}-${Date.now()}-${Math.random()}`,
              options: combination1,
              totalPrice: totalPrice1
            })
            comboCount++
            console.log(`✅ Combination 1:`, Object.values(combination1).map(opt => opt.name).join(' - '))
          }
        }
      }

      // Strategy 2-3: Vary first column if available
      if (comboCount < targetCombinations && columnOptions.length > 0 && columnOptions[0].options.length > 1) {
        for (let i = 1; i < Math.min(columnOptions[0].options.length, 3) && comboCount < targetCombinations; i++) {
          const combination: Record<string, CustomProductOption> = {}
          let totalPrice = 0
          let hasAllOptions = true

          for (let colIdx = 0; colIdx < columnOptions.length; colIdx++) {
            const { column, options: colOptions } = columnOptions[colIdx]
            if (colOptions.length > 0) {
              const useIndex = (colIdx === 0) ? i : 0 // Vary first column, keep others at 0
              combination[column.id] = colOptions[useIndex]
              totalPrice += colOptions[useIndex].unit_price || 0
            } else {
              hasAllOptions = false
              break
            }
          }

          if (hasAllOptions) {
            const signature = Object.values(combination).map(opt => opt.id).sort().join('-')
            if (!seenCombinations.has(signature)) {
              seenCombinations.add(signature)
              combinations.push({
                id: `${Object.values(combination).map(opt => opt.id).join('-')}-${Date.now()}-${Math.random()}`,
                options: combination,
                totalPrice
              })
              comboCount++
              console.log(`✅ Combination ${comboCount}:`, Object.values(combination).map(opt => opt.name).join(' - '))
            }
          }
        }
      }

      // Strategy 4: Vary second column if available
      if (comboCount < targetCombinations && columnOptions.length > 1 && columnOptions[1].options.length > 1) {
        const combination: Record<string, CustomProductOption> = {}
        let totalPrice = 0
        let hasAllOptions = true

        for (let colIdx = 0; colIdx < columnOptions.length; colIdx++) {
          const { column, options: colOptions } = columnOptions[colIdx]
          if (colOptions.length > 0) {
            const useIndex = (colIdx === 1) ? 1 : 0 // Vary second column
            combination[column.id] = colOptions[Math.min(useIndex, colOptions.length - 1)]
            totalPrice += colOptions[Math.min(useIndex, colOptions.length - 1)].unit_price || 0
          } else {
            hasAllOptions = false
            break
          }
        }

        if (hasAllOptions) {
          const signature = Object.values(combination).map(opt => opt.id).sort().join('-')
          if (!seenCombinations.has(signature)) {
            seenCombinations.add(signature)
            combinations.push({
              id: `${Object.values(combination).map(opt => opt.id).join('-')}-${Date.now()}-${Math.random()}`,
              options: combination,
              totalPrice
            })
            comboCount++
            console.log(`✅ Combination ${comboCount}:`, Object.values(combination).map(opt => opt.name).join(' - '))
          }
        }
      }

      // Strategy 5: Cross-variation pattern (0,1,0,1...)
      if (comboCount < targetCombinations && columnOptions.length > 2) {
        const combination: Record<string, CustomProductOption> = {}
        let totalPrice = 0
        let hasAllOptions = true

        for (let colIdx = 0; colIdx < columnOptions.length; colIdx++) {
          const { column, options: colOptions } = columnOptions[colIdx]
          if (colOptions.length > 0) {
            const useIndex = colIdx % 2 // Alternate pattern: 0,1,0,1,...
            combination[column.id] = colOptions[Math.min(useIndex, colOptions.length - 1)]
            totalPrice += colOptions[Math.min(useIndex, colOptions.length - 1)].unit_price || 0
          } else {
            hasAllOptions = false
            break
          }
        }

        if (hasAllOptions) {
          const signature = Object.values(combination).map(opt => opt.id).sort().join('-')
          if (!seenCombinations.has(signature)) {
            seenCombinations.add(signature)
            combinations.push({
              id: `${Object.values(combination).map(opt => opt.id).join('-')}-${Date.now()}-${Math.random()}`,
              options: combination,
              totalPrice
            })
            comboCount++
            console.log(`✅ Combination ${comboCount}:`, Object.values(combination).map(opt => opt.name).join(' - '))
          }
        }
      }

      console.log('✅ createSensibleCombinations: created', comboCount, 'distinct combinations out of target', targetCombinations)
    }

    if (columnOptions.length > 0 && columnOptions.every(co => co.options.length > 0)) {
      createSensibleCombinations()
    }

    // Sort by total price (cheapest first)
    combinations.sort((a, b) => a.totalPrice - b.totalPrice)

    return combinations.slice(0, 20) // Limit to 20 combinations for UI
  }, [structures, selectedStructure, columns, options, columnFilters])

  // Update current combinations state for multiple selection
  useEffect(() => {
    setCurrentCombinations(combinations)
  }, [combinations])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const cats = await customProductService.getCategories(false)
      setCategories(cats)

      // Load tất cả structures
      const allStructures: CustomProductStructure[] = []
      for (const cat of cats) {
        try {
          const structs = await customProductService.getStructures(cat.id, false)
          allStructures.push(...structs)
        } catch (error) {
          console.error(`Failed to load structures for category ${cat.id}:`, error)
        }
      }
      setStructures(allStructures)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStructureData = async (structureId: string) => {
    try {
      const structure = structures.find(s => s.id === structureId)
      if (!structure) return

      // Load columns from the structure's main category first
      const categoryCols = await customProductService.getColumnsByCategory(structure.category_id, false)

      // If structure has column_order that includes columns not in this category,
      // we need to load all columns from all categories to find matches
      let allColumns = [...categoryCols]

      // Load columns from all categories to ensure we have all columns referenced in structure
      for (const cat of categories) {
        if (cat.id !== structure.category_id) {
          try {
            const catCols = await customProductService.getColumnsByCategory(cat.id, false)
            // Only add columns that are in the structure's column_order
            const relevantCols = catCols.filter(col => structure.column_order.includes(col.id))
            allColumns = [...allColumns, ...relevantCols]
          } catch (error) {
            console.error(`Failed to load columns for category ${cat.id}:`, error)
          }
        }
      }

      // Filter to only columns that are in the structure's column_order
      const structureColumns = allColumns.filter(col => structure.column_order.includes(col.id))
      setColumns(structureColumns)

      console.log('Structure column_order:', structure.column_order)
      console.log('Found columns:', structureColumns.map(c => ({ id: c.id, name: c.name })))

      // Load options for each column
      const optsByCol: Record<string, CustomProductOption[]> = {}
      for (const col of structureColumns) {
        const colOptions = await customProductService.getOptions(col.id, false)
        optsByCol[col.id] = colOptions
      }
      setOptions(optsByCol)

      // Reset selections
      setSelectedOptions({})
      setGeneratedName('')
      setOptionDetails([])
    } catch (error) {
      console.error('Failed to load structure data:', error)
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

    // Auto-fill dimensions from the selected option if available
    if (option.has_dimensions) {
      setDimensions(prev => ({
        width: option.width || prev.width,
        height: option.height || prev.height,
        depth: option.depth || prev.depth
      }))
    }

    // Auto-set unit price from option if not already set
    if (option.unit_price && !unitPrice) {
      setUnitPrice(option.unit_price)
    }
  }

  const generateProductName = async () => {
    if (!selectedStructure || Object.keys(selectedOptions).length === 0) return

    try {
      const optionMap: Record<string, string> = {}
      Object.entries(selectedOptions).forEach(([columnId, selectedOption]) => {
        optionMap[columnId] = selectedOption.option_id
      })

      const result = await customProductService.generateProductName(
        selectedStructure, // Pass structure ID directly
        optionMap,
        selectedStructure // Use structure ID as structureId parameter
      )

      // Set option details for detailed display
      setOptionDetails(result.option_details || [])

      // Set generated name with format "option (category) - option (category) ..."
      const detailedName = result.generated_name || result.option_details?.map(detail => detail.full_text).join(result.separator || ' ') || 'Không thể tạo tên sản phẩm'
      setGeneratedName(detailedName)
    } catch (error) {
      console.error('Failed to generate product name:', error)
      setGeneratedName('Không thể tạo tên sản phẩm')
    }
  }

  const calculateArea = () => {
    if (dimensions.width && dimensions.height) {
      return (dimensions.width * dimensions.height) / 1000000 // Convert mm² to m²
    }
    return 0
  }

  const calculateVolume = () => {
    if (dimensions.width && dimensions.height && dimensions.depth) {
      return (dimensions.width * dimensions.height * dimensions.depth) / 1000000000 // Convert mm³ to m³
    }
    return 0
  }

  // Filter functions
  const openFilterModal = (columnId: string) => {
    setFilteringColumn(columnId)
    setShowFilterModal(true)
  }

  const toggleColumnFilter = (columnId: string, optionId: string) => {
    setColumnFilters(prev => {
      const currentFilters = prev[columnId] || []
      const newFilters = currentFilters.includes(optionId)
        ? currentFilters.filter(id => id !== optionId)
        : [...currentFilters, optionId]

      return {
        ...prev,
        [columnId]: newFilters
      }
    })
  }

  const clearColumnFilters = (columnId: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: []
    }))
  }

  const applyFilters = () => {
    setShowFilterModal(false)
    setFilteringColumn('')
  }

  // Multiple selection functions
  const toggleCombinationSelection = (combinationId: string) => {
    setSelectedCombinations(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(combinationId)) {
        newSelected.delete(combinationId)
      } else {
        newSelected.add(combinationId)
      }
      return newSelected
    })
  }

  const selectAllCombinations = () => {
    // This would select all filtered combinations
    // For now, we'll implement a simple version
    const allCombinationIds = new Set<string>()
    // We'll populate this from the current combinations in the render
    setSelectedCombinations(allCombinationIds)
  }

  const clearAllSelections = () => {
    setSelectedCombinations(new Set())
  }

  const generateProductNameFromCombination = (combination: { options: Record<string, CustomProductOption>, totalPrice: number }) => {
    const structure = structures.find(s => s.id === selectedStructure)
    if (!structure) return 'Không thể tạo tên sản phẩm'

    // Sort options according to structure column order
    const sortedColumnIds = structure.column_order || []
    const sortedOptions = sortedColumnIds
      .map(columnId => combination.options[columnId])
      .filter(option => option) // Remove undefined options

    // Create name by joining option names with structure separator
    const separator = structure.separator || ' - '
    const productName = sortedOptions.map(opt => opt.name).join(separator)

    return productName || 'Không thể tạo tên sản phẩm'
  }

  const handleAddMultipleToQuote = () => {
    console.log('🚀 handleAddMultipleToQuote called')
    console.log('Selected combinations size:', selectedCombinations.size)
    console.log('Current combinations count:', currentCombinations.length)

    if (selectedCombinations.size === 0) {
      alert('Vui lòng chọn ít nhất một tổ hợp sản phẩm')
      return
    }

    const structure = structures.find(s => s.id === selectedStructure)
    const category = categories.find(c => c.id === structure?.category_id)

    // Use current combinations from state
    const selectedCombinationObjects = currentCombinations.filter(combo =>
      selectedCombinations.has(combo.id)
    )

    console.log('Selected combination objects count:', selectedCombinationObjects.length)
    console.log('Selected combination objects:', selectedCombinationObjects)

    // Add each selected combination to quote
    selectedCombinationObjects.forEach((combination, index) => {
      console.log(`➕ Adding product ${index + 1}:`, combination)
      const productName = generateProductNameFromCombination(combination)
      console.log(`📝 Generated name: ${productName}`)

      // Get dimensions from this specific combination's options, OR fallback to global manual dimensions
      const firstOptionWithDimensions = Object.values(combination.options).find(opt => opt.has_dimensions)

      const width = firstOptionWithDimensions?.width || dimensions.width || 0
      const height = firstOptionWithDimensions?.height || dimensions.height || 0
      const depth = firstOptionWithDimensions?.depth || dimensions.depth || 0

      // Calculate area/volume based on the resolved dimensions
      const itemArea = width && height ? (width * height) / 1000000 : 0 // Convert mm² to m²
      const itemVolume = width && height && depth ? (width * height * depth) / 1000000000 : 0 // Convert mm³ to m³

      // Use combination's total price as unit price (price per piece)
      // If dimensions are available, calculate price per area
      let calculatedUnitPrice = combination.totalPrice
      if (itemArea > 0) {
        // If the combination price is total, we might need to adjust. 
        // Assuming combination.totalPrice is the price for the specific options (which might be unit based).
        // If we want pricing per m2, we div by area.
        calculatedUnitPrice = combination.totalPrice / itemArea
      }

      // Generate description with dimensions
      let desc = `Sản phẩm tùy chỉnh từ cấu trúc: ${structure?.name} (${category?.name}) - ${combination.totalPrice.toLocaleString('vi-VN')} VND`
      if (width > 0 && height > 0) {
        desc += ` - ${width}x${height}${depth > 0 ? `x${depth}` : ''}mm`
      }

      const productData = {
        name: productName,
        description: desc,
        unit_price: calculatedUnitPrice,
        width: width || undefined,
        height: height || undefined,
        depth: depth || undefined,
        area: itemArea || undefined,
        volume: itemVolume || undefined,
        quantity: 1, // Default quantity
        total_price: calculatedUnitPrice * (itemArea || 1) // Total price calculation
      }

      console.log('📦 Product data to add:', productData)
      onAddToQuote(productData)
      console.log(`✅ Product ${index + 1} added successfully`)
    })

    // Show detailed success message
    const productNames = selectedCombinationObjects.map(combo =>
      generateProductNameFromCombination(combo)
    )

    const message = `Đã thêm ${selectedCombinationObjects.length} sản phẩm vào báo giá:\n\n${productNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}`

    // alert(message) // Suppress alert to avoid blocking flow if user clicks main button

    // Reset selections after adding
    setSelectedCombinations(new Set())

    // Close modal after successful addition
    onClose()
  }

  const handleAddToQuote = () => {
    // If user has selected items in the table, add those instead of the manual setup
    if (selectedCombinations.size > 0) {
      handleAddMultipleToQuote()
      return
    }

    if (!generatedName) {
      alert('Vui lòng chọn đầy đủ thuộc tính để tạo tên sản phẩm')
      return
    }

    const structure = structures.find(s => s.id === selectedStructure)
    const category = categories.find(c => c.id === structure?.category_id)

    // Append dimensions to description for manual add too
    let desc = `Sản phẩm tùy chỉnh từ cấu trúc: ${structure?.name} (${category?.name})`
    if (dimensions.width > 0 && dimensions.height > 0) {
      desc += ` - ${dimensions.width}x${dimensions.height}${dimensions.depth > 0 ? `x${dimensions.depth}` : ''}mm`
    }

    const productData = {
      name: generatedName,
      description: desc,
      unit_price: unitPrice,
      width: dimensions.width || undefined,
      height: dimensions.height || undefined,
      depth: dimensions.depth || undefined,
      area: calculateArea() || undefined,
      volume: calculateVolume() || undefined
    }

    onAddToQuote(productData)
    handleClose()
  }

  const handleClose = () => {
    // Reset all states
    setSelectedStructure('')
    setSelectedOptions({})
    setGeneratedName('')
    setOptionDetails([])
    setDimensions({ width: 0, height: 0, depth: 0 })
    setUnitPrice(0)
    setColumns([])
    setOptions({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">Chọn cấu trúc sản phẩm</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Structure Selection */}
              <div className="bg-transparent p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn cấu trúc sản phẩm
                </label>
                <select
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                >
                  <option value="">-- Chọn cấu trúc --</option>
                  {structures.map(structure => {
                    const category = categories.find(cat => cat.id === structure.category_id)
                    return (
                      <option key={structure.id} value={structure.id}>
                        {structure.name} - {category?.name} {structure.is_default ? '(Mặc định)' : ''}
                      </option>
                    )
                  })}
                </select>

                {/* Structure Info */}
                {selectedStructure && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    {(() => {
                      const structure = structures.find(s => s.id === selectedStructure)
                      const category = categories.find(cat => cat.id === structure?.category_id)

                      // Convert column UUIDs to names - always try to get names from loaded columns
                      const columnNames = structure?.column_order?.map(columnId => {
                        // First try to find in loaded columns
                        const column = columns.find(col => col.id === columnId)
                        if (column) {
                          return column.name
                        }

                        // If not found in loaded columns, try to get from other sources or show UUID
                        console.log('Column not found for ID:', columnId, 'Available columns:', columns.map(c => ({ id: c.id, name: c.name })))
                        return `Column-${columnId.slice(0, 8)}`
                      }).join(' → ') || 'Đang tải...'

                      return (
                        <div className="text-sm text-gray-600">
                          <p><strong>Danh mục:</strong> {category?.name}</p>
                          <p><strong>Thứ tự cột:</strong> {columnNames}</p>
                          <p><strong>Dấu ngăn cách:</strong> "{structure?.separator || ' '}"</p>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Options Selection - Matrix/Table View */}
              {selectedStructure && columns.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Chọn tổ hợp thuộc tính
                  </h4>

                  <div className="space-y-4">
                    {(() => {
                      const structure = structures.find(s => s.id === selectedStructure)
                      const category = categories.find(cat => cat.id === structure?.category_id)

                      // Sort columns theo structure.column_order
                      const sortedColumns = [...columns].sort((a, b) => {
                        if (!structure?.column_order) return 0
                        const indexA = structure.column_order.indexOf(a.id)
                        const indexB = structure.column_order.indexOf(b.id)
                        return indexA - indexB
                      })

                      return (
                        <div className="space-y-4">
                          {/* Header với thông tin danh mục */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h5 className="text-purple-900 mb-2">
                              <span className="font-bold">Danh mục:</span> <span className="font-bold">{category?.name}</span>
                            </h5>
                            <p className="text-sm text-purple-700 mb-2">
                              Chọn một tổ hợp thuộc tính từ bảng dưới đây
                            </p>
                            <div className="text-xs text-purple-600 mb-3">
                              Hiển thị {combinations.length} tổ hợp có thể có từ {sortedColumns.length} cột
                            </div>
                            {/* Dimension Information */}
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="text-xs text-purple-700 font-semibold mb-1">Thông tin kích thước:</p>
                              <div className="grid grid-cols-5 gap-2 text-xs text-purple-600">
                                <div>• Ngang (mm)</div>
                                <div>• Cao (mm)</div>
                                <div>• Sâu (mm)</div>
                                <div>• Diện tích (m²)</div>
                                <div>• Thể tích (m³)</div>
                              </div>
                            </div>
                          </div>

                          {/* Combinations Table */}
                          {combinations.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-300">
                                {/* Table Header */}
                                <thead className="bg-gray-50">
                                  <tr>
                                    {sortedColumns.map((column, index) => {
                                      const activeFilters = columnFilters[column.id] || []
                                      const hasActiveFilters = activeFilters.length > 0
                                      return (
                                        <th key={column.id} className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                              {index === 0 && (
                                                <span className="text-purple-600 mr-1">✓</span>
                                              )}
                                              {column.name}
                                            </div>
                                            <button
                                              onClick={() => openFilterModal(column.id)}
                                              className={`ml-2 p-1 rounded transition-colors ${hasActiveFilters
                                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                }`}
                                              title={hasActiveFilters ? `Đã lọc ${activeFilters.length} thuộc tính` : 'Lọc thuộc tính'}
                                            >
                                              <Filter className="h-3 w-3" />
                                              {hasActiveFilters && (
                                                <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                                                  {activeFilters.length}
                                                </span>
                                              )}
                                            </button>
                                          </div>
                                        </th>
                                      )
                                    })}
                                    {/* Dimension columns */}
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Chiều ngang (mm)
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Chiều cao (mm)
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Chiều sâu (mm)
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Diện tích (m²)
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Thể tích (m³)
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Tổng giá
                                    </th>
                                    <th className="px-4 py-3 border-b border-gray-300 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Chọn
                                    </th>
                                  </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {combinations.map((combination, comboIndex) => (
                                    <tr
                                      key={combination.id}
                                      className={`hover:bg-gray-50 ${Object.keys(selectedOptions).length === sortedColumns.length &&
                                        sortedColumns.every(col => selectedOptions[col.id]?.option_id === combination.options[col.id]?.id)
                                        ? 'bg-green-50 border-green-300'
                                        : ''
                                        }`}
                                    >
                                      {/* Column values */}
                                      {sortedColumns.map((column) => {
                                        const option = combination.options[column.id]
                                        return (
                                          <td key={column.id} className="px-4 py-3 border-b border-gray-200 text-sm text-gray-900">
                                            <div className="flex flex-col">
                                              <span className="font-medium">{option?.name}</span>
                                              {option?.unit_price && (
                                                <span className="text-xs text-gray-500">
                                                  {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                  }).format(option.unit_price)}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        )
                                      })}

                                      {/* Dimensions from combination options */}
                                      {(() => {
                                        // Get dimensions from the first option that has dimensions
                                        const firstOptionWithDimensions = Object.values(combination.options).find(opt => opt.has_dimensions)
                                        const height = firstOptionWithDimensions?.height || 0
                                        const depth = firstOptionWithDimensions?.depth || 0
                                        const width = firstOptionWithDimensions?.width || 0
                                        const area = width && height ? (width * height) / 1000000 : 0 // Convert mm² to m²
                                        const volume = width && height && depth ? (width * height * depth) / 1000000000 : 0 // Convert mm³ to m³

                                        return (
                                          <>
                                            <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
                                              {width > 0 ? width.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
                                              {height > 0 ? height.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
                                              {depth > 0 ? depth.toLocaleString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
                                              {area > 0 ? area.toFixed(3) : '-'}
                                            </td>
                                            <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
                                              {volume > 0 ? volume.toFixed(4) : '-'}
                                            </td>
                                          </>
                                        )
                                      })()}

                                      {/* Total price */}
                                      <td className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-green-600">
                                        {new Intl.NumberFormat('vi-VN', {
                                          style: 'currency',
                                          currency: 'VND'
                                        }).format(combination.totalPrice)}
                                      </td>

                                      {/* Select button - supports multiple selection */}
                                      <td className="px-4 py-3 border-b border-gray-200 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          {/* Single selection button */}
                                          <button
                                            onClick={() => {
                                              // Set all selected options from this combination
                                              const newSelectedOptions: Record<string, SelectedOption> = {}
                                              sortedColumns.forEach(column => {
                                                const option = combination.options[column.id]
                                                if (option) {
                                                  newSelectedOptions[column.id] = {
                                                    column_id: column.id,
                                                    column_name: column.name,
                                                    option_id: option.id,
                                                    option_name: option.name,
                                                    quantity: 1,
                                                    unit_price: option.unit_price || 0
                                                  }
                                                }
                                              })
                                              setSelectedOptions(newSelectedOptions)

                                              // Auto-fill dimensions from first option that has dimensions
                                              const firstOptionWithDimensions = Object.values(combination.options).find(opt => opt.has_dimensions)
                                              if (firstOptionWithDimensions) {
                                                setDimensions(prev => ({
                                                  width: firstOptionWithDimensions.width || prev.width,
                                                  height: firstOptionWithDimensions.height || prev.height,
                                                  depth: firstOptionWithDimensions.depth || prev.depth
                                                }))
                                              }

                                              // Set unit price from combination total (per unit area if dimensions available)
                                              const area = calculateArea()
                                              setUnitPrice(area > 0 ? combination.totalPrice / area : combination.totalPrice)
                                            }}
                                            className={`px-2 py-1 rounded text-xs font-medium ${Object.keys(selectedOptions).length === sortedColumns.length &&
                                              sortedColumns.every(col => selectedOptions[col.id]?.option_id === combination.options[col.id]?.id)
                                              ? 'bg-green-600 text-white'
                                              : 'bg-blue-600 text-white hover:bg-blue-700'
                                              }`}
                                            title="Chọn để điền thông tin sản phẩm"
                                          >
                                            {Object.keys(selectedOptions).length === sortedColumns.length &&
                                              sortedColumns.every(col => selectedOptions[col.id]?.option_id === combination.options[col.id]?.id)
                                              ? '✓ Đã chọn'
                                              : 'Chọn'}
                                          </button>

                                          {/* Multiple selection checkbox */}
                                          <input
                                            type="checkbox"
                                            checked={selectedCombinations.has(combination.id)}
                                            onChange={() => toggleCombinationSelection(combination.id)}
                                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                            title="Chọn để thêm vào danh sách"
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                              <p>Không có tổ hợp nào có thể tạo.</p>
                              <p className="text-sm">Vui lòng kiểm tra các cột có đủ thuộc tính không.</p>
                            </div>
                          )}

                          {/* Manual selection fallback */}
                          <div className="border-t pt-4">
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                                <span className="mr-2">🔧</span>
                                Chọn thủ công từng thuộc tính (nâng cao)
                              </summary>
                              <div className="mt-4 space-y-3">
                                {sortedColumns.map((column, index) => (
                                  <div key={column.id} className="border border-gray-200 rounded p-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {column.name}
                                    </label>
                                    <select
                                      value={selectedOptions[column.id]?.option_id || ''}
                                      onChange={(e) => {
                                        const optionId = e.target.value
                                        const option = options[column.id]?.find(opt => opt.id === optionId)
                                        if (option) {
                                          handleOptionSelect(column.id, option)
                                        }
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded text-black text-sm"
                                    >
                                      <option value="">-- Chọn {column.name.toLowerCase()} --</option>
                                      {options[column.id]?.map(option => (
                                        <option key={option.id} value={option.id}>
                                          {option.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Generated Product Name */}
              {generatedName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-3">Tên sản phẩm được tạo:</h4>

                  {/* Main generated name */}
                  <p className="text-lg font-semibold text-green-900 mb-3">{generatedName}</p>

                  {/* Detailed breakdown */}
                  {optionDetails.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide">Chi tiết từng phần:</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {optionDetails.map((detail, index) => (
                          <div key={index} className="bg-white rounded p-2 border border-green-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">
                                {detail.option_name}
                              </span>
                              <span className="text-gray-600">
                                ({detail.category_name})
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Cột: {detail.column_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dimensions and Pricing */}
              {generatedName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Kích thước và giá cả
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chiều rộng (mm)
                      </label>
                      <input
                        type="number"
                        value={dimensions.width || ''}
                        onChange={(e) => setDimensions(prev => ({
                          ...prev,
                          width: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chiều cao (mm)
                      </label>
                      <input
                        type="number"
                        value={dimensions.height || ''}
                        onChange={(e) => setDimensions(prev => ({
                          ...prev,
                          height: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chiều sâu (mm) - Tùy chọn
                      </label>
                      <input
                        type="number"
                        value={dimensions.depth || ''}
                        onChange={(e) => setDimensions(prev => ({
                          ...prev,
                          depth: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Auto-calculated values */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Diện tích</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {calculateArea().toFixed(3)} m²
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Thể tích</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {calculateVolume().toFixed(4)} m³
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn giá (/m²)
                      </label>
                      <input
                        type="number"
                        value={unitPrice || ''}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div className="bg-white p-4 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-700">Thành tiền ước tính:</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(unitPrice * calculateArea())}
                    </div>
                    <div className="text-sm text-gray-600">
                      ({unitPrice.toLocaleString()} × {calculateArea().toFixed(3)} m²)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Multiple Selection Actions */}
        {selectedCombinations.size > 0 && (
          <div className="border-t border-gray-200 p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Đã chọn {selectedCombinations.size} tổ hợp sản phẩm
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAllSelections}
                  className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  onClick={handleAddMultipleToQuote}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Thêm tất cả vào báo giá
                </button>
              </div>
            </div>

            {/* Preview of selected products */}
            <div className="bg-white rounded border p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm sẽ được thêm:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {currentCombinations
                  .filter(combo => selectedCombinations.has(combo.id))
                  .map((combo, index) => {
                    // Get dimensions for this combination
                    const firstOptionWithDimensions = Object.values(combo.options).find(opt => opt.has_dimensions)
                    const height = firstOptionWithDimensions?.height || 0
                    const depth = firstOptionWithDimensions?.depth || 0
                    const width = firstOptionWithDimensions?.width || 0
                    const area = width && height ? (width * height) / 1000000 : 0 // Convert mm² to m²

                    return (
                      <div key={combo.id} className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500 font-medium">{index + 1}.</span>
                          <span className="flex-1">{generateProductNameFromCombination(combo)}</span>
                          <span className="text-green-600 font-medium">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(combo.totalPrice)}
                          </span>
                        </div>
                        {(height > 0 || depth > 0 || area > 0) && (
                          <div className="ml-4 text-gray-500 flex gap-4">
                            {height > 0 && <span>Cao: {height}mm</span>}
                            {depth > 0 && <span>Sâu: {depth}mm</span>}
                            {area > 0 && <span>DT: {area.toFixed(3)}m²</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleAddToQuote}
            disabled={!generatedName}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Thêm vào báo giá
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Lọc thuộc tính: {columns.find(c => c.id === filteringColumn)?.name}
                </h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {options[filteringColumn]?.map(option => {
                  const isSelected = (columnFilters[filteringColumn] || []).includes(option.id)
                  return (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleColumnFilter(filteringColumn, option.id)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.name}</div>
                        {option.unit_price && (
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(option.unit_price)}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => clearColumnFilters(filteringColumn)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
