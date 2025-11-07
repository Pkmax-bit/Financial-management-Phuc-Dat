'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { 
  ChevronDown, 
  Search, 
  Check, 
  X, 
  Plus, 
  Filter,
  Building2,
  Package,
  Truck,
  Layers,
  ChevronRight,
  ChevronUp,
  Target
} from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
  level?: number
  parent_id?: string
  role?: string
}

interface ExpenseObjectMultiSelectorEnhancedProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  onAddNew?: () => void
  expenseObjects?: ExpenseObject[]
}

export default function ExpenseObjectMultiSelectorEnhanced({
  values,
  onChange,
  placeholder = 'Chọn nhiều đối tượng chi phí',
  disabled = false,
  onAddNew,
  expenseObjects: propExpenseObjects
}: ExpenseObjectMultiSelectorEnhancedProps) {
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<number[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyLevel3, setShowOnlyLevel3] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)

  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      const base = process.env.NEXT_PUBLIC_API_URL || getApiUrl()
      try {
        const res = await fetch(`${base}/api/expense-objects/?active_only=true`, { credentials: 'omit' })
        if (res.ok) {
          const data = await res.json()
          setExpenseObjects(Array.isArray(data) ? data : [])
        } else {
          throw new Error('auth or server')
        }
      } catch (_err) {
        const res2 = await fetch(`${base}/api/expense-objects/public?active_only=true`, { credentials: 'omit' })
        if (res2.ok) {
          const data2 = await res2.json()
          setExpenseObjects(Array.isArray(data2) ? data2 : [])
        } else {
          setExpenseObjects([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Use provided expense objects or load from API
  useEffect(() => {
    if (propExpenseObjects) {
      setExpenseObjects(propExpenseObjects)
      setLoading(false)
    } else {
      loadExpenseObjects()
    }
  }, [propExpenseObjects])

  // Get all available levels and roles
  const availableLevels = useMemo(() => {
    const levels = [...new Set(expenseObjects.map(obj => obj.level).filter(Boolean))].sort()
    return levels
  }, [expenseObjects])

  const availableRoles = useMemo(() => {
    const roles = [...new Set(expenseObjects.map(obj => obj.role).filter(Boolean))].sort()
    return roles
  }, [expenseObjects])

  // Filter objects based on search, level, and role filters
  const filtered = useMemo(() => {
    let filtered = expenseObjects.filter(obj => {
      // Search filter
      const matchesSearch = !searchTerm || 
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Level filter
      const matchesLevel = selectedLevels.length === 0 || 
        (obj.level !== undefined && selectedLevels.includes(obj.level))
      
      // Role filter
      const matchesRole = selectedRoles.length === 0 || 
        (obj.role && selectedRoles.includes(obj.role))
      
      // Show only level 3 filter
      const matchesLevel3Filter = !showOnlyLevel3 || obj.level === 3
      
      return matchesSearch && matchesLevel && matchesRole && matchesLevel3Filter
    })

    // Sort by level, then by name
    return filtered.sort((a, b) => {
      if (a.level !== b.level) {
        return (a.level || 0) - (b.level || 0)
      }
      return a.name.localeCompare(b.name)
    })
  }, [expenseObjects, searchTerm, selectedLevels, selectedRoles, showOnlyLevel3])

  // Group objects by hierarchy
  const groupedObjects = useMemo(() => {
    const groups: { [key: string]: ExpenseObject[] } = {}
    const rootObjects: ExpenseObject[] = []
    
    filtered.forEach(obj => {
      if (!obj.parent_id) {
        rootObjects.push(obj)
      } else {
        if (!groups[obj.parent_id]) {
          groups[obj.parent_id] = []
        }
        groups[obj.parent_id].push(obj)
      }
    })
    
    return { rootObjects, groups }
  }, [filtered])

  const toggleValue = (id: string) => {
    const obj = expenseObjects.find(o => o.id === id)
    if (!obj) return

    let newValues: string[]

    if (values.includes(id)) {
      // Remove the object and all its children
      const childrenIds = getAllChildrenIds(id)
      newValues = values.filter(v => v !== id && !childrenIds.includes(v))
    } else {
      // Add the object and all its children
      const childrenIds = getAllChildrenIds(id)
      newValues = [...new Set([...values, id, ...childrenIds])]
    }

    // Note: Removed auto-switch to showOnlyLevel3 mode when selecting level 3
    // Users can manually toggle this mode using the "Hiện tất cả cấp" button

    // Auto-select parents if all children are selected
    newValues = autoSelectParents(newValues)
    
    // Auto-deselect parents if not all children are selected
    newValues = autoDeselectParents(newValues)
    
    onChange(newValues)
  }

  // Helper function to auto-select parents when all children are selected
  const autoSelectParents = (currentValues: string[]): string[] => {
    let updatedValues = [...currentValues]
    let changed = true
    
    while (changed) {
      changed = false
      
      // Find all parents that have all their children selected
      const parentsToSelect = expenseObjects.filter(parent => {
        if (updatedValues.includes(parent.id)) return false // Already selected
        
        const children = expenseObjects.filter(child => child.parent_id === parent.id)
        if (children.length === 0) return false // No children
        
        // Check if all children are selected
        return children.every(child => updatedValues.includes(child.id))
      })
      
      if (parentsToSelect.length > 0) {
        updatedValues = [...updatedValues, ...parentsToSelect.map(p => p.id)]
        changed = true
      }
    }
    
    return updatedValues
  }

  // Helper function to auto-deselect parents when not all children are selected
  const autoDeselectParents = (currentValues: string[]): string[] => {
    let updatedValues = [...currentValues]
    let changed = true
    
    while (changed) {
      changed = false
      
      // Find all parents that don't have all their children selected
      const parentsToDeselect = expenseObjects.filter(parent => {
        if (!updatedValues.includes(parent.id)) return false // Already deselected
        
        const children = expenseObjects.filter(child => child.parent_id === parent.id)
        if (children.length === 0) return false // No children
        
        // Check if not all children are selected
        return !children.every(child => updatedValues.includes(child.id))
      })
      
      if (parentsToDeselect.length > 0) {
        updatedValues = updatedValues.filter(id => !parentsToDeselect.map(p => p.id).includes(id))
        changed = true
      }
    }
    
    return updatedValues
  }

  // Helper function to get all children IDs recursively
  const getAllChildrenIds = (parentId: string): string[] => {
    const children = expenseObjects.filter(obj => obj.parent_id === parentId)
    let allChildren: string[] = []
    
    children.forEach(child => {
      allChildren.push(child.id)
      // Recursively get grandchildren
      allChildren = [...allChildren, ...getAllChildrenIds(child.id)]
    })
    
    return allChildren
  }

  const clearAll = () => {
    onChange([])
    setShowOnlyLevel3(false)
  }

  const selectAllFiltered = () => onChange(Array.from(new Set([...values, ...filtered.map(o => o.id)])))

  const resetToAllLevels = () => {
    setShowOnlyLevel3(false)
    setSelectedLevels([])
    setSelectedRoles([])
    setSearchTerm('')
  }

  // Handle showOnlyLevel3 toggle
  const handleShowOnlyLevel3Toggle = () => {
    if (!showOnlyLevel3) {
      // When enabling showOnlyLevel3, keep only level 3 objects that are currently selected
      const level3Objects = expenseObjects.filter(o => o.level === 3)
      const selectedLevel3Ids = level3Objects
        .filter(obj => values.includes(obj.id))
        .map(obj => obj.id)
      
      // If no level 3 objects are selected, select all level 3 objects
      if (selectedLevel3Ids.length === 0) {
        const allLevel3Ids = level3Objects.map(obj => obj.id)
        onChange([...values, ...allLevel3Ids])
      }
    }
    
    setShowOnlyLevel3(!showOnlyLevel3)
  }

  const selectedObjects = useMemo(() => (
    values
      .map(id => expenseObjects.find(o => o.id === id))
      .filter(Boolean) as ExpenseObject[]
  ), [values, expenseObjects])

  const toggleLevelFilter = (level: number) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const toggleRoleFilter = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents)
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId)
    } else {
      newExpanded.add(parentId)
    }
    setExpandedParents(newExpanded)
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'supplier_root': return <Building2 className="w-4 h-4" />
      case 'material_category': return <Package className="w-4 h-4" />
      case 'supplier': return <Truck className="w-4 h-4" />
      default: return <Layers className="w-4 h-4" />
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'supplier_root': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'material_category': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'supplier': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getLevelColor = (level?: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-700'
      case 2: return 'bg-orange-100 text-orange-700'
      case 3: return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const renderObjectItem = (obj: ExpenseObject, depth = 0) => {
    const checked = values.includes(obj.id)
    const hasChildren = groupedObjects.groups[obj.id]?.length > 0
    const isExpanded = expandedParents.has(obj.id)
    
    // Check if all children are selected (for parent items)
    const allChildrenSelected = hasChildren ? 
      groupedObjects.groups[obj.id]?.every(child => values.includes(child.id)) : false
    
    // Check if some children are selected (for partial selection display)
    const someChildrenSelected = hasChildren ? 
      groupedObjects.groups[obj.id]?.some(child => values.includes(child.id)) : false
    
    return (
      <div key={obj.id}>
        <button
          type="button"
          onClick={() => toggleValue(obj.id)}
          className={`w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between ${
            checked ? 'bg-blue-50' : ''
          } ${depth > 0 ? 'ml-8' : ''}`}
        >
          <div className="flex items-center space-x-2 flex-1">
            {/* Indentation for hierarchy */}
            <div className="flex items-center space-x-1">
              {depth > 0 && <div className="w-4 h-4" />}
              {hasChildren && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleParentExpansion(obj.id)
                  }}
                  className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              )}
              {!hasChildren && depth > 0 && <div className="w-4 h-4" />}
            </div>

            {/* Role icon */}
            <div className="flex-shrink-0">
              {getRoleIcon(obj.role)}
            </div>

            {/* Object info */}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${checked ? 'text-blue-700' : 'text-gray-900'} flex items-center space-x-4`}>
                <span className="truncate text-lg">{obj.name}</span>
                {obj.level !== undefined && obj.level !== null && (
                  <span className={`text-base px-4 py-2 rounded-full ${getLevelColor(obj.level)}`}>
                    Cấp {obj.level}
                  </span>
                )}
                {obj.role && (
                  <span className={`text-base px-4 py-2 rounded-full border ${getRoleColor(obj.role)}`}>
                    {obj.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              {obj.description && (
                <div className="text-base text-gray-500 mt-2 leading-relaxed">{obj.description}</div>
              )}
            </div>
          </div>

          {/* Checkbox */}
          <div className={`w-7 h-7 border-2 rounded flex items-center justify-center flex-shrink-0 ${
            checked 
              ? 'bg-blue-600 border-blue-600' 
              : hasChildren && allChildrenSelected
              ? 'bg-blue-100 border-blue-400'
              : hasChildren && someChildrenSelected
              ? 'bg-blue-50 border-blue-300'
              : 'border-gray-300'
          }`}>
            {checked && <Check className="w-5 h-5 text-white" />}
            {!checked && hasChildren && allChildrenSelected && (
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            )}
            {!checked && hasChildren && someChildrenSelected && !allChildrenSelected && (
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
            )}
          </div>
        </button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {groupedObjects.groups[obj.id]?.map(child => renderObjectItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowSidePanel(true)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            {selectedObjects.length === 0 && (
              <span className="text-gray-500">{placeholder}</span>
            )}
            {selectedObjects.slice(0, 3).map(obj => (
              <span key={obj.id} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getRoleColor(obj.role)}`}>
                <span className="flex items-center space-x-1">
                  {getRoleIcon(obj.role)}
                  <span>{obj.name}</span>
                  {obj.level !== undefined && obj.level !== null && (
                    <span className={`text-xs px-1 py-0.5 rounded ${getLevelColor(obj.level)}`}>
                      L{obj.level}
                    </span>
                  )}
                </span>
                <span
                  role="button"
                  aria-label="Bỏ chọn đối tượng"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleValue(obj.id) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleValue(obj.id) } }}
                  className="ml-1 hover:opacity-70 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
            {selectedObjects.length > 3 && (
              <span className="text-xs text-gray-600">+{selectedObjects.length - 3} nữa</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

            {/* Overlay Modal */}
            {showSidePanel && (
              <div className="fixed inset-0 z-[9999] overflow-hidden">
                {/* Backdrop - Completely transparent */}
                <div
                  className="fixed inset-0 bg-transparent transition-opacity"
                  onClick={() => setShowSidePanel(false)}
                />

                {/* Overlay Panel - Positioned to the right */}
                <div className="fixed inset-y-0 right-0 flex items-center justify-end p-4">
                  <div className="w-full max-w-5xl h-[90vh] bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Chọn đối tượng chi phí</h3>
                      <p className="text-sm text-gray-600 mt-1">Chọn nhiều đối tượng để phân bổ ngân sách dự án</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidePanel(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Search and Filter Header */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Search Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm đối tượng chi phí..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Filter Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bộ lọc & Thao tác</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                          >
                            <Filter className="w-4 h-4" />
                            <span>Bộ lọc</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                           <div className="flex items-center gap-2">
                             <button type="button" onClick={selectAllFiltered} className="px-4 py-3 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 bg-white">
                               Chọn tất cả
                             </button>
                             <button type="button" onClick={clearAll} className="px-4 py-3 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 bg-white">
                               Bỏ chọn
                             </button>
                             <button 
                               type="button" 
                               onClick={handleShowOnlyLevel3Toggle} 
                               className={`px-4 py-3 text-sm rounded-lg border ${
                                 showOnlyLevel3 
                                   ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                                   : 'border-gray-300 hover:bg-gray-50 bg-white'
                               }`}
                             >
                               {showOnlyLevel3 ? 'Hiện tất cả cấp' : 'Chỉ hiện cấp 3'}
                             </button>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Level 3 Mode Notice */}
                    {showOnlyLevel3 && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-800 font-medium text-sm">Chế độ chỉ hiển thị cấp 3</span>
                        </div>
                        <p className="text-blue-700 text-xs mt-1">
                          Đang hiển thị chỉ các nhà cung cấp cụ thể (cấp 3). Số liệu sẽ được tính tổng tự động lên cấp 2 và cấp 1.
                        </p>
                      </div>
                    )}

                    {/* Filters */}
                    {showFilters && (
                      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Level Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Cấp độ:</label>
                          <div className="flex flex-wrap gap-2">
                            {availableLevels.map(level => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => toggleLevelFilter(level)}
                                className={`px-4 py-2 text-sm rounded-lg border ${
                                  selectedLevels.includes(level)
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                Cấp {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Loại:</label>
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map(role => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRoleFilter(role)}
                                className={`px-4 py-2 text-sm rounded-lg border ${
                                  selectedRoles.includes(role)
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {role.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Object List */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <div className="mt-3 text-lg">Đang tải...</div>
                        </div>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <div className="text-lg">
                            {searchTerm || selectedLevels.length > 0 || selectedRoles.length > 0 
                              ? 'Không tìm thấy đối tượng nào' 
                              : 'Chưa có đối tượng chi phí'
                            }
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupedObjects.rootObjects.map(obj => renderObjectItem(obj))}
                      </div>
                    )}
                  </div>

                  {/* Add New Button */}
                  {onAddNew && (
                    <div className="border-t border-gray-200 p-6">
                      <button
                        type="button"
                        onClick={() => { onAddNew(); setShowSidePanel(false) }}
                        className="w-full px-6 py-4 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-4 text-lg border border-blue-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <Plus className="w-6 h-6" />
                        Thêm đối tượng mới
                      </button>
                    </div>
                  )}

                        {/* Footer Actions */}
                        <div className="border-t border-gray-200/50 p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-semibold text-gray-700">
                          Đã chọn {selectedObjects.length} đối tượng
                        </div>
                        {selectedObjects.length > 0 && (
                          <div className="text-sm text-gray-500">
                            {selectedObjects.filter(obj => obj.level === 1).length} cấp 1, 
                            {selectedObjects.filter(obj => obj.level === 2).length} cấp 2, 
                            {selectedObjects.filter(obj => obj.level === 3).length} cấp 3
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSidePanel(false)}
                          className="px-6 py-3 text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSidePanel(false)}
                          className="px-6 py-3 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
