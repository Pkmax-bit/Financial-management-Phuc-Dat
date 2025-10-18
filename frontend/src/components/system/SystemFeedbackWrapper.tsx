'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SystemFeedbackTab from './SystemFeedbackTab'
import EmployeeSystemFeedback from './EmployeeSystemFeedback'
import AdminSystemFeedback from './AdminSystemFeedback'

type UserRole = 'admin' | 'manager' | 'employee' | 'viewer'

export default function SystemFeedbackWrapper() {
  const [userRole, setUserRole] = useState<UserRole>('employee')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Get user role from employees table
        const { data: employee, error } = await supabase
          .from('employees')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
        
        if (employee?.role) {
          setUserRole(employee.role as UserRole)
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    )
  }

  // Render different components based on user role
  if (userRole === 'admin' || userRole === 'manager') {
    return <AdminSystemFeedback />
  } else {
    return <EmployeeSystemFeedback />
  }
}
