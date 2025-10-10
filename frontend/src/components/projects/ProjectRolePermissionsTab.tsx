'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Lock,
  CheckSquare,
  XSquare,
  Info,
  Edit,
  Save,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  getRoleDisplayName, 
  ROLE_HIERARCHY,
  type UserRole 
} from '@/utils/rolePermissions'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface RolePermission {
  role: string
  permissions: string[]
}

const defaultPermissions: Permission[] = [
  // Quản lý dự án
  {
    id: 'project_view',
    name: 'Xem dự án',
    description: 'Xem thông tin chi tiết dự án',
    category: 'project'
  },
  {
    id: 'project_edit',
    name: 'Chỉnh sửa dự án',
    description: 'Sửa thông tin, cập nhật trạng thái dự án',
    category: 'project'
  },
  {
    id: 'project_delete',
    name: 'Xóa dự án',
    description: 'Xóa dự án khỏi hệ thống',
    category: 'project'
  },
  {
    id: 'project_create',
    name: 'Tạo dự án mới',
    description: 'Tạo dự án mới trong hệ thống',
    category: 'project'
  },

  // Quản lý team
  {
    id: 'team_view',
    name: 'Xem thành viên',
    description: 'Xem danh sách thành viên trong team',
    category: 'team'
  },
  {
    id: 'team_edit',
    name: 'Quản lý team',
    description: 'Thêm/xóa thành viên, phân công vai trò',
    category: 'team'
  },

  // Tài chính
  {
    id: 'finance_view',
    name: 'Xem tài chính',
    description: 'Xem thông tin tài chính, chi phí dự án',
    category: 'finance'
  },
  {
    id: 'finance_edit',
    name: 'Quản lý tài chính',
    description: 'Cập nhật chi phí, ngân sách dự án',
    category: 'finance'
  },
  {
    id: 'finance_approve',
    name: 'Phê duyệt tài chính',
    description: 'Phê duyệt chi phí, thanh toán',
    category: 'finance'
  },

  // Báo cáo
  {
    id: 'report_view',
    name: 'Xem báo cáo',
    description: 'Xem các báo cáo dự án',
    category: 'report'
  },
  {
    id: 'report_create',
    name: 'Tạo báo cáo',
    description: 'Tạo báo cáo mới',
    category: 'report'
  },

  // Công việc
  {
    id: 'task_view',
    name: 'Xem công việc',
    description: 'Xem danh sách công việc',
    category: 'task'
  },
  {
    id: 'task_edit',
    name: 'Quản lý công việc',
    description: 'Tạo/sửa/xóa công việc',
    category: 'task'
  },
  {
    id: 'task_assign',
    name: 'Phân công công việc',
    description: 'Phân công công việc cho thành viên',
    category: 'task'
  },

  // Thiết bị & Vật tư
  {
    id: 'equipment_view',
    name: 'Xem thiết bị/vật tư',
    description: 'Xem danh sách thiết bị, vật tư',
    category: 'equipment'
  },
  {
    id: 'equipment_edit',
    name: 'Quản lý thiết bị/vật tư',
    description: 'Thêm/sửa/xóa thiết bị, vật tư',
    category: 'equipment'
  },
  {
    id: 'equipment_approve',
    name: 'Phê duyệt yêu cầu',
    description: 'Phê duyệt yêu cầu thiết bị, vật tư',
    category: 'equipment'
  }
]

const defaultRolePermissions: RolePermission[] = [
  // System Roles
  {
    role: 'admin',
    permissions: [
      'project_view', 'project_edit', 'project_delete', 'project_create',
      'team_view', 'team_edit',
      'finance_view', 'finance_edit', 'finance_approve',
      'report_view', 'report_create',
      'task_view', 'task_edit', 'task_assign',
      'equipment_view', 'equipment_edit', 'equipment_approve'
    ]
  },
  {
    role: 'sales',
    permissions: [
      'project_view', 'project_edit', 'project_create',
      'team_view',
      'finance_view',
      'report_view',
      'task_view',
      'equipment_view'
    ]
  },
  {
    role: 'accountant',
    permissions: [
      'project_view',
      'finance_view', 'finance_edit', 'finance_approve',
      'report_view', 'report_create'
    ]
  },
  {
    role: 'workshop_employee',
    permissions: [
      'project_view',
      'team_view',
      'task_view', 'task_edit',
      'equipment_view', 'equipment_edit'
    ]
  },
  {
    role: 'transport',
    permissions: [
      'project_view',
      'team_view',
      'task_view',
      'equipment_view'
    ]
  },
  {
    role: 'worker',
    permissions: [
      'project_view',
      'team_view',
      'task_view',
      'equipment_view'
    ]
  },
  {
    role: 'customer',
    permissions: [
      'project_view',
      'task_view'
    ]
  },
  
  // Custom Roles
  {
    role: 'Giám sát',
    permissions: [
      'project_view', 'project_edit',
      'team_view', 'team_edit',
      'finance_view',
      'report_view', 'report_create',
      'task_view', 'task_edit', 'task_assign',
      'equipment_view', 'equipment_approve'
    ]
  },
  {
    role: 'Lắp đặt',
    permissions: [
      'project_view',
      'team_view',
      'task_view',
      'equipment_view'
    ]
  },
  {
    role: 'Vận chuyển',
    permissions: [
      'project_view',
      'team_view',
      'task_view',
      'equipment_view'
    ]
  },
  {
    role: 'Xưởng',
    permissions: [
      'project_view',
      'team_view',
      'task_view',
      'equipment_view', 'equipment_edit'
    ]
  },
  {
    role: 'Kỹ thuật',
    permissions: [
      'project_view',
      'team_view',
      'task_view', 'task_edit',
      'equipment_view', 'equipment_edit'
    ]
  }
]

// Helper function to capitalize first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export default function ProjectRolePermissionsTab() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(defaultRolePermissions)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')
  const [showNewRoleForm, setShowNewRoleForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRolePermissions()
  }, [])

  const fetchRolePermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/role-permissions')
      if (!response.ok) throw new Error('Failed to fetch role permissions')
      const data = await response.json()
      setRolePermissions(data)
    } catch (err) {
      console.error('Error fetching role permissions:', err)
      setError('Failed to load role permissions')
    } finally {
      setLoading(false)
    }
  }

  const saveRolePermissions = async (role: string, permissions: string[]) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/role-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role_name: role,
          permissions: permissions
        })
      })

      if (!response.ok) throw new Error('Failed to save role permissions')
      await fetchRolePermissions()
    } catch (err) {
      console.error('Error saving role permissions:', err)
      setError('Failed to save role permissions')
    } finally {
      setLoading(false)
    }
  }

  const permissionCategories = Array.from(new Set(defaultPermissions.map(p => capitalize(p.category))))

  const handleTogglePermission = async (role: string, permissionId: string) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role)
    if (!rolePermission) return

    const newPermissions = rolePermission.permissions.includes(permissionId)
      ? rolePermission.permissions.filter(p => p !== permissionId)
      : [...rolePermission.permissions, permissionId]

    await saveRolePermissions(role, newPermissions)
  }

  const handleAddRole = async () => {
    if (newRole && !rolePermissions.find(rp => rp.role === newRole)) {
      await saveRolePermissions(newRole, [])
      setNewRole('')
      setShowNewRoleForm(false)
    }
  }

  const handleDeleteRole = async (role: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vai trò "${role}"?`)) {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/role-permissions/${role}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Failed to delete role permissions')
        await fetchRolePermissions()
      } catch (err) {
        console.error('Error deleting role:', err)
        setError('Failed to delete role')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Phân quyền theo vai trò</h2>
          <p className="text-gray-600 mt-1">Quản lý quyền truy cập cho từng vai trò trong dự án</p>
        </div>
        <button
          onClick={() => setShowNewRoleForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Thêm vai trò
        </button>
      </div>

      {/* New Role Form */}
      {showNewRoleForm && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex gap-4">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Nhập tên vai trò mới"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddRole}
              disabled={!newRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm
            </button>
            <button
              onClick={() => {
                setShowNewRoleForm(false)
                setNewRole('')
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Vai trò
                </th>
                {permissionCategories.map(category => (
                  <th
                    key={category}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    colSpan={defaultPermissions.filter(p => p.category === category.toLowerCase()).length}
                  >
                    {category}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                <th className="px-6 py-3"></th>
                {defaultPermissions.map(permission => (
                  <th
                    key={permission.id}
                    className="px-2 py-2 text-xs font-medium text-gray-500 text-center w-24"
                    title={permission.description}
                  >
                    {permission.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rolePermissions.map((rp) => (
                <tr key={rp.role} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {getRoleDisplayName(rp.role as UserRole) || rp.role}
                        </span>
                        {rp.role in ROLE_HIERARCHY && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            System
                          </span>
                        )}
                      </div>
                      {!Object.keys(ROLE_HIERARCHY).includes(rp.role) && (
                        <button
                          onClick={() => handleDeleteRole(rp.role)}
                          className="text-gray-400 hover:text-red-500"
                          title="Xóa vai trò"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  {defaultPermissions.map(permission => (
                    <td key={permission.id} className="px-2 py-4 text-center">
                      <button
                        onClick={() => handleTogglePermission(rp.role, permission.id)}
                        className={`p-1 rounded-md transition-colors ${
                          rp.permissions.includes(permission.id)
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-300 hover:bg-gray-50'
                        }`}
                        title={rp.permissions.includes(permission.id) ? 'Có quyền' : 'Không có quyền'}
                      >
                        {rp.permissions.includes(permission.id) ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <XSquare className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Chú thích</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Có quyền thực hiện</span>
          </div>
          <div className="flex items-center gap-2">
            <XSquare className="h-5 w-5 text-gray-300" />
            <span className="text-sm text-gray-600">Không có quyền thực hiện</span>
          </div>
        </div>
      </div>
    </div>
  )
}