'use client'

import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import EmployeeFeedbackTab from '@/components/employees/EmployeeFeedbackTab'
import { useRouter } from 'next/navigation'

export default function EmployeeFeedbackPage() {
  const router = useRouter()
  return (
    <LayoutWithSidebar onLogout={() => router.push('/login')}>
      <div className="w-full">
        <StickyTopNav title="Góp ý nhân viên" subtitle="Tạo và quản lý góp ý cho nhân viên" />
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <EmployeeFeedbackTab />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}



