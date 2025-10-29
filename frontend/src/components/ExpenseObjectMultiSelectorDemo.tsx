'use client'

import React, { useState } from 'react'
import ExpenseObjectMultiSelectorEnhanced from './ExpenseObjectMultiSelectorEnhanced'

// Mock data for testing
const mockExpenseObjects = [
  // Level 1 - Root
  {
    id: '1',
    name: 'Nhà cung cấp',
    description: 'Tổng hợp các nhà cung cấp vật liệu và phụ kiện',
    is_active: true,
    level: 1,
    role: 'supplier_root'
  },
  // Level 2 - Material Categories
  {
    id: '2',
    name: 'Nhôm',
    description: 'Vật liệu nhôm cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '3',
    name: 'Kính',
    description: 'Vật liệu kính cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '4',
    name: 'Inox',
    description: 'Vật liệu inox cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '5',
    name: 'Sắt',
    description: 'Vật liệu sắt cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '6',
    name: 'Nhựa',
    description: 'Vật liệu nhựa cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '7',
    name: 'Gỗ',
    description: 'Vật liệu gỗ cho các sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  {
    id: '8',
    name: 'Phụ kiện',
    description: 'Các loại phụ kiện cho sản phẩm',
    is_active: true,
    level: 2,
    parent_id: '1',
    role: 'material_category'
  },
  // Level 3 - Specific Suppliers
  {
    id: '9',
    name: 'Nhôm xưởng',
    description: 'Nhôm sản xuất tại xưởng',
    is_active: true,
    level: 3,
    parent_id: '2',
    role: 'supplier'
  },
  {
    id: '10',
    name: 'Nhôm Tùng Dương',
    description: 'Nhôm từ nhà cung cấp Tùng Dương',
    is_active: true,
    level: 3,
    parent_id: '2',
    role: 'supplier'
  },
  {
    id: '11',
    name: 'Nhôm Slim',
    description: 'Nhôm từ nhà cung cấp Slim',
    is_active: true,
    level: 3,
    parent_id: '2',
    role: 'supplier'
  },
  {
    id: '12',
    name: 'Nhôm Phú Hoàn Anh',
    description: 'Nhôm từ nhà cung cấp Phú Hoàn Anh',
    is_active: true,
    level: 3,
    parent_id: '2',
    role: 'supplier'
  },
  {
    id: '13',
    name: 'Kính Thiên Phát',
    description: 'Kính từ nhà cung cấp Thiên Phát',
    is_active: true,
    level: 3,
    parent_id: '3',
    role: 'supplier'
  },
  {
    id: '14',
    name: 'Kính Phát Đạt',
    description: 'Kính từ nhà cung cấp Phát Đạt',
    is_active: true,
    level: 3,
    parent_id: '3',
    role: 'supplier'
  },
  {
    id: '15',
    name: 'Kính Thành Ký',
    description: 'Kính từ nhà cung cấp Thành Ký',
    is_active: true,
    level: 3,
    parent_id: '3',
    role: 'supplier'
  },
  {
    id: '16',
    name: 'Inox Thiên Tân',
    description: 'Inox từ nhà cung cấp Thiên Tân',
    is_active: true,
    level: 3,
    parent_id: '4',
    role: 'supplier'
  },
  {
    id: '17',
    name: 'Inox Thành Khang',
    description: 'Inox từ nhà cung cấp Thành Khang',
    is_active: true,
    level: 3,
    parent_id: '4',
    role: 'supplier'
  },
  {
    id: '18',
    name: 'Sắt Hải Yến',
    description: 'Sắt từ nhà cung cấp Hải Yến',
    is_active: true,
    level: 3,
    parent_id: '5',
    role: 'supplier'
  },
  {
    id: '19',
    name: 'Sắt Mạnh',
    description: 'Sắt từ nhà cung cấp Mạnh',
    is_active: true,
    level: 3,
    parent_id: '5',
    role: 'supplier'
  },
  {
    id: '20',
    name: 'Sắt Quang',
    description: 'Sắt từ nhà cung cấp Quang',
    is_active: true,
    level: 3,
    parent_id: '5',
    role: 'supplier'
  },
  {
    id: '21',
    name: 'Cửa nhựa Thành An',
    description: 'Cửa nhựa từ nhà cung cấp Thành An',
    is_active: true,
    level: 3,
    parent_id: '6',
    role: 'supplier'
  },
  {
    id: '22',
    name: 'Gỗ Hiệu Hưng',
    description: 'Gỗ từ nhà cung cấp Hiệu Hưng',
    is_active: true,
    level: 3,
    parent_id: '7',
    role: 'supplier'
  },
  {
    id: '23',
    name: 'Phụ kiện Phước Thịnh',
    description: 'Phụ kiện từ nhà cung cấp Phước Thịnh',
    is_active: true,
    level: 3,
    parent_id: '8',
    role: 'supplier'
  },
  {
    id: '24',
    name: 'Phụ kiện Phúc Thịnh',
    description: 'Phụ kiện từ nhà cung cấp Phúc Thịnh',
    is_active: true,
    level: 3,
    parent_id: '8',
    role: 'supplier'
  },
  {
    id: '25',
    name: 'Phụ kiện Cmeck',
    description: 'Phụ kiện từ nhà cung cấp Cmeck',
    is_active: true,
    level: 3,
    parent_id: '8',
    role: 'supplier'
  },
  {
    id: '26',
    name: 'Phụ kiện Phú Hoàn Anh',
    description: 'Phụ kiện từ nhà cung cấp Phú Hoàn Anh',
    is_active: true,
    level: 3,
    parent_id: '8',
    role: 'supplier'
  }
]

export default function ExpenseObjectMultiSelectorDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Demo - Enhanced Expense Object Multi Selector</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Đối tượng chi phí (có thể chọn nhiều)
          </label>
          <ExpenseObjectMultiSelectorEnhanced
            values={selectedValues}
            onChange={setSelectedValues}
            placeholder="Chọn nhiều đối tượng chi phí để phân bổ"
            expenseObjects={mockExpenseObjects}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Đã chọn ({selectedValues.length}):</h3>
          {selectedValues.length === 0 ? (
            <p className="text-gray-500">Chưa chọn đối tượng nào</p>
          ) : (
            <div className="space-y-1">
              {selectedValues.map(id => {
                const obj = mockExpenseObjects.find(o => o.id === id)
                return obj ? (
                  <div key={id} className="text-sm">
                    <span className="font-medium">{obj.name}</span>
                    <span className="text-gray-500 ml-2">(Cấp {obj.level}, {obj.role})</span>
                  </div>
                ) : null
              })}
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">Tính năng mới:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Hiển thị phân cấp 3 cấp với icons và màu sắc phân biệt</li>
            <li>• Bộ lọc theo cấp độ (Level 1, 2, 3)</li>
            <li>• Bộ lọc theo loại (supplier_root, material_category, supplier)</li>
            <li>• Tìm kiếm nâng cao với gợi ý</li>
            <li>• Giao diện đẹp hơn với visual hierarchy rõ ràng</li>
            <li>• Expand/collapse cho các nhóm có con</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
