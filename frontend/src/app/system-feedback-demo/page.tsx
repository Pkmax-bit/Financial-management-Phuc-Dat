'use client'

import { useState } from 'react'
import SystemFeedbackTab from '@/components/system/SystemFeedbackTab'
import EmployeeSystemFeedback from '@/components/system/EmployeeSystemFeedback'
import AdminSystemFeedback from '@/components/system/AdminSystemFeedback'
import SystemFeedbackWrapper from '@/components/system/SystemFeedbackWrapper'

type ViewMode = 'original' | 'employee' | 'admin' | 'wrapper'

export default function SystemFeedbackDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('wrapper')

  const renderComponent = () => {
    switch (viewMode) {
      case 'original':
        return <SystemFeedbackTab />
      case 'employee':
        return <EmployeeSystemFeedback />
      case 'admin':
        return <AdminSystemFeedback />
      case 'wrapper':
        return <SystemFeedbackWrapper />
      default:
        return <SystemFeedbackWrapper />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Demo: System Feedback Components</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('wrapper')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'wrapper'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔄 Auto (Wrapper)
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Original
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'employee'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Employee View
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚙️ Admin View
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current View:</strong> {
                viewMode === 'wrapper' ? 'Auto-detect based on user role' :
                viewMode === 'original' ? 'Original SystemFeedbackTab' :
                viewMode === 'employee' ? 'Employee System Feedback (Green theme)' :
                'Admin System Feedback (Purple theme with statistics)'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Component Content */}
      <div className="max-w-7xl mx-auto p-6">
        {renderComponent()}
      </div>
    </div>
  )
}
