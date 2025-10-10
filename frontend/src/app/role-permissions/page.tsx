'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import ProjectRolePermissionsTab from '@/components/projects/ProjectRolePermissionsTab'

export default function RolePermissionsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Phân quyền hệ thống</h1>
              <p className="text-gray-600 mt-1">
                Quản lý quyền truy cập cho các vai trò trong hệ thống
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8">
        <div className="bg-white rounded-xl border shadow-sm">
          <ProjectRolePermissionsTab />
        </div>
      </div>
    </div>
  )
}
