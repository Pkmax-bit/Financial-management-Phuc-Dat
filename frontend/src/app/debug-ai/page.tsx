'use client'

import { useState } from 'react'
import { Upload, TestTube, AlertCircle, CheckCircle } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

export default function DebugAIPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEnvironment = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(getApiEndpoint('/api/test-ai'))
      const data = await response.json()
      setTestResults(data)
    } catch (err) {
      setError('Failed to test environment')
      console.error('Test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testWithImage = async (file: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      setTestResults(data)
    } catch (err) {
      setError('Failed to test with image')
      console.error('Test error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      testWithImage(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Debug Tool</h1>
          </div>
          <p className="text-gray-600">Test AI Image Reader API và environment configuration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Environment Test</h2>
            <button
              onClick={testEnvironment}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Environment'}
            </button>
          </div>

          {/* Image Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Image Test</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Results */}
        {(testResults || error) && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {testResults && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Test Completed</span>
                  </div>
                  <p className="text-green-700">Status: {testResults.success ? 'Success' : 'Failed'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Environment Variables:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>OpenAI API Key:</span>
                      <span className={testResults.environment?.openaiKey === 'NOT_SET' ? 'text-red-600' : 'text-green-600'}>
                        {testResults.environment?.openaiKey || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supabase URL:</span>
                      <span className={testResults.environment?.supabaseUrl === 'NOT_SET' ? 'text-red-600' : 'text-green-600'}>
                        {testResults.environment?.supabaseUrl || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supabase Anon Key:</span>
                      <span className={testResults.environment?.supabaseAnonKey === 'NOT_SET' ? 'text-red-600' : 'text-green-600'}>
                        {testResults.environment?.supabaseAnonKey || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {testResults.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800">{testResults.message}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Raw Response:</h3>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Debug Instructions</h2>
          <div className="space-y-3 text-blue-800">
            <p><strong>1. Test Environment:</strong> Kiểm tra xem các environment variables đã được cấu hình chưa</p>
            <p><strong>2. Test with Image:</strong> Upload một hình ảnh để test OpenAI API connection</p>
            <p><strong>3. Check Console:</strong> Mở Developer Tools để xem detailed logs</p>
            <p><strong>4. Fix Issues:</strong> Dựa vào kết quả test để sửa các vấn đề</p>
          </div>
        </div>
      </div>
    </div>
  )
}
