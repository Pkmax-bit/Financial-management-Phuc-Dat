'use client'

import React from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  CreditCard,
  PiggyBank,
  FileText,
  Receipt,
  Calendar,
  ArrowRight,
  Eye
} from 'lucide-react'

interface SimpleReportCardProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  onClick: () => void
  isActive?: boolean
}

export default function SimpleReportCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  onClick, 
  isActive = false 
}: SimpleReportCardProps) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
      green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
      red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
  }

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      indigo: 'text-indigo-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'text-black'
  }

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105
        ${getColorClasses(color)}
        ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(color)}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm opacity-75">{description}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-75">Nhấp để xem</span>
      </div>
    </div>
  )
}
