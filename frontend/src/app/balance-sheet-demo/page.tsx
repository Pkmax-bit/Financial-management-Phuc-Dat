'use client'

import React, { useState, useEffect } from 'react'
import BalanceSheetView from '@/components/reports/BalanceSheetView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Download, RefreshCw } from 'lucide-react'

interface BalanceSheetData {
  as_of_date: string
  currency: string
  generated_at: string
  assets: {
    total_assets: number
    current_assets: number
    fixed_assets: number
    asset_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  liabilities: {
    total_liabilities: number
    current_liabilities: number
    long_term_liabilities: number
    liability_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  equity: {
    total_equity: number
    retained_earnings: number
    equity_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  summary: {
    total_assets: number
    total_liabilities: number
    total_equity: number
    balance_check: boolean
  }
}

export default function BalanceSheetDemoPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asOfDate, setAsOfDate] = useState('2025-09-01')

  // Sample data
  const sampleData: BalanceSheetData = {
    "as_of_date": "2025-09-01",
    "currency": "VND",
    "generated_at": "2025-09-30T16:08:48.717213",
    "assets": {
      "total_assets": 184000000,
      "current_assets": 134000000,
      "fixed_assets": 50000000,
      "asset_breakdown": [
        {
          "category": "Cash",
          "amount": 10000000,
          "percentage": 5.434782608695652
        },
        {
          "category": "Accounts Receivable",
          "amount": 124000000,
          "percentage": 67.3913043478261
        },
        {
          "category": "Fixed Assets",
          "amount": 50000000,
          "percentage": 27.173913043478258
        }
      ]
    },
    "liabilities": {
      "total_liabilities": 38000000,
      "current_liabilities": 38000000,
      "long_term_liabilities": 0,
      "liability_breakdown": [
        {
          "category": "Accounts Payable",
          "amount": 38000000,
          "percentage": 100
        },
        {
          "category": "Long-term Liabilities",
          "amount": 0,
          "percentage": 0
        }
      ]
    },
    "equity": {
      "total_equity": 146000000,
      "retained_earnings": 146000000,
      "equity_breakdown": [
        {
          "category": "Retained Earnings",
          "amount": 146000000,
          "percentage": 100
        }
      ]
    },
    "summary": {
      "total_assets": 184000000,
      "total_liabilities": 38000000,
      "total_equity": 146000000,
      "balance_check": true
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use sample data for demo
      setData(sampleData)
    } catch (err) {
      setError('Không thể tải dữ liệu báo cáo')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDateChange = (newDate: string) => {
    setAsOfDate(newDate)
  }

  const handleRefresh = () => {
    fetchData()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export balance sheet')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demo Báo cáo Cân đối Kế toán</h1>
              <p className="text-gray-600 mt-2">
                Trình bày dữ liệu báo cáo cân đối kế toán với giao diện đẹp mắt
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                onClick={handleExport}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Cài đặt báo cáo
            </CardTitle>
            <CardDescription>
              Chọn ngày để tạo báo cáo cân đối kế toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tính đến ngày
                </label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="pt-6">
                <Button onClick={handleRefresh} disabled={loading}>
                  {loading ? 'Đang tải...' : 'Tạo báo cáo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải báo cáo...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Thử lại
            </Button>
          </div>
        )}

        {data && !loading && (
          <BalanceSheetView data={data} />
        )}
      </div>
    </div>
  )
}
