'use client'

import { useState } from 'react'
import { employeeApi } from '@/lib/api'

export default function ApiTestPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testApi = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      setLoading(true)
      console.log(`Testing ${testName}...`)
      const result = await testFunction()
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }))
      console.log(`${testName} success:`, result)
    } catch (error) {
      console.error(`${testName} error:`, error)
      setResults(prev => ({ ...prev, [testName]: { success: false, error: (error as Error).message } }))
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setResults({})
    
    // Test basic endpoints
    await testApi('Test Basic', () => employeeApi.testEmployees())
    await testApi('Test Simple', () => employeeApi.testEmployeesSimple())
    
    // Test public endpoints
    await testApi('Get Public Employees', () => employeeApi.getEmployeesPublic())
    await testApi('Get Public Departments', () => employeeApi.getDepartments())
    await testApi('Get Public Positions', () => employeeApi.getPositions())
    
    // Test authenticated endpoints (may fail if not logged in)
    await testApi('Get Employees (Auth)', () => employeeApi.getEmployees())
    await testApi('Get Employee Stats', () => employeeApi.getEmployeeStats())
    
    // Test sample data creation
    await testApi('Create Sample Employees', () => employeeApi.createSampleEmployees())
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Integration Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {Object.keys(results).length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(results).map(([testName, result]: [string, any]) => (
                <div key={testName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{testName}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Response:</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-red-600 mb-2">Error:</p>
                      <p className="text-sm text-red-800">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
