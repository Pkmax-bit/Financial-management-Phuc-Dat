'use client'

import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import SystemFeedbackTab from '@/components/system/SystemFeedbackTab'
import { useRouter } from 'next/navigation'

export default function SystemFeedbackPage() {
  const router = useRouter()
  return (
    <LayoutWithSidebar onLogout={() => router.push('/login')}>
      <div className="w-full">
        <StickyTopNav title="Góp ý hệ thống" subtitle="Nhân viên gửi góp ý và theo dõi xử lý" />
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <SystemFeedbackTab />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}



